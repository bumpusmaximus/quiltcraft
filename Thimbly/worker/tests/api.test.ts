import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../src/index';
import { getStripe } from '../src/lib/stripe';

// Mock dependencies
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('../src/lib/supabase', () => ({
  getAuthSupabase: () => mockSupabase,
  getServiceSupabase: () => mockSupabase,
}));

const mockStripeObj = {
  webhooks: {
    constructEventAsync: vi.fn(),
  }
};

vi.mock('../src/lib/stripe', () => ({
  getStripe: () => mockStripeObj
}));

const DUMMY_ENV = {
  RATE_LIMIT_KV: {
    get: vi.fn(),
    put: vi.fn(),
  },
  EXPORTS_BUCKET: {
    put: vi.fn(),
  }
};

describe('Thimbly API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (DUMMY_ENV.RATE_LIMIT_KV.get as any).mockResolvedValue(null);
  });

  describe('Auth Middleware', () => {
    it('returns 401 without auth header', async () => {
      const res = await app.request('/api/auth/session', { method: 'POST' }, DUMMY_ENV as any);
      expect(res.status).toBe(401);
    });

    it('returns 401 on invalid JWT', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ error: true });
      const res = await app.request('/api/auth/session', {
        method: 'POST',
        headers: { Authorization: 'Bearer bad_token' }
      }, DUMMY_ENV as any);
      expect(res.status).toBe(401);
    });
  });

  describe('Exports endpoints', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'usr-1' } } });
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_roles') {
          return {
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'user' } }) }) })
          };
        }
        if (table === 'user_credits') {
          return {
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { balance: 10 } }) }) })
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null })
        };
      });
    });

    it('rejects without idempotency key', async () => {
      const res = await app.request('/api/exports/validate', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid' }
      }, DUMMY_ENV as any);
      expect(res.status).toBe(400);
    });

    it('rejects when balance < 1', async () => {
      // Mock balance check
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_roles') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'user' } }) }) }) };
        if (table === 'user_credits') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { balance: 0 } }) }) }) };
        return { insert: () => Promise.resolve({ error: null }) };
      });

      const res = await app.request('/api/exports/validate', {
        method: 'POST',
        headers: { 
          Authorization: 'Bearer valid',
          'x-idempotency-key': 'key-1'
        },
        body: JSON.stringify({ craft_type: 'cross-stitch', format: 'pdf' })
      }, DUMMY_ENV as any);
      
      expect(res.status).toBe(402); // insufficient credits
    });

    it('/validate inserts status: pending', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_roles') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'user' } }) }) }) };
        if (table === 'user_credits') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { balance: 10 } }) }) }) };
        return { insert: mockInsert };
      });

      const res = await app.request('/api/exports/validate', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid', 'x-idempotency-key': 'key-1' },
        body: JSON.stringify({ craft_type: 'cross-stitch', format: 'pdf' })
      }, DUMMY_ENV as any);
      
      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    });

    it('Duplicate idempotency key returns 409', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_roles') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'user' } }) }) }) };
        if (table === 'user_credits') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { balance: 10 } }) }) }) };
        return { insert: vi.fn().mockResolvedValue({ error: { code: '23505' } }) };
      });

      const res = await app.request('/api/exports/validate', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid', 'x-idempotency-key': 'key-duplicate' },
        body: JSON.stringify({ craft_type: 'cross-stitch', format: 'pdf' })
      }, DUMMY_ENV as any);
      
      expect(res.status).toBe(409);
    });

    it('/complete flips to completed & deducts balance', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ error: null });
      
      const res = await app.request('/api/exports/complete', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid', 'x-idempotency-key': 'key-1' },
        body: JSON.stringify({ craft_type: 'cross-stitch', format: 'pdf' })
      }, DUMMY_ENV as any);
      
      expect(res.status).toBe(200);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('finalize_transaction', expect.any(Object));
    });

    it('returns 429 when rate limit exceeded', async () => {
      (DUMMY_ENV.RATE_LIMIT_KV.get as any).mockResolvedValue('10');
      
      const res = await app.request('/api/exports/validate', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid' }
      }, DUMMY_ENV as any);
      
      expect(res.status).toBe(429);
    });
  });
  
  describe('Stripe Webhook', () => {
     it('rejects missing signature', async () => {
       const res = await app.request('/api/webhooks/stripe', { method: 'POST' });
       expect(res.status).toBe(400);
     });

     it('rejects unsigned/invalid payloads', async () => {
       const stripeMock = (getStripe as any)();
       stripeMock.webhooks.constructEventAsync.mockRejectedValueOnce(new Error('Invalid sig'));
       
       const res = await app.request('/api/webhooks/stripe', {
         method: 'POST',
         headers: { 'stripe-signature': 'invalid' },
         body: 'raw payload'
       }, DUMMY_ENV as any);
       
       expect(res.status).toBe(400);
     });
  });
});
