import type { Env } from './types';

// Simple in-memory mock for smoke tests
const mockProcessedTx = new Set<string>();

export function getServiceSupabase(env: Env['Bindings']) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            if (table === 'user_credits') return { data: { balance: 5 }, error: null };
            return { data: null, error: { message: 'Not found' } };
          }
        })
      })
    }),
    rpc: async (fn: string, args: any) => {
      if (fn === 'reserve_credit_atomic') {
        const id = args.p_reference_id;
        if (mockProcessedTx.has(id)) return { data: null, error: { code: '23505' } };
        mockProcessedTx.add(id);
        return { data: { new_balance: 4 }, error: null };
      }
      if (fn === 'finalize_transaction') {
        return { data: { success: true }, error: null };
      }
      return { data: null, error: null };
    }
  } as any;
}

export function getAuthSupabase(env: Env['Bindings'], jwt: string) {
  return {
    auth: {
      getUser: async () => {
        if (jwt === 'valid-mock-jwt') return { data: { user: { id: 'usr-123', email: 'test@example.com' } }, error: null };
        return { data: null, error: { message: 'Invalid JWT' } };
      }
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            if (table === 'user_roles') return { data: { role: 'user' }, error: null };
            return { data: null, error: { message: 'Not found' } };
          }
        })
      })
    })
  } as any;
}
