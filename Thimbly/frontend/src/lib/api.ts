import axios from 'axios';

const API_BASE_URL = ''; // Force relative paths for E2E reliability

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCreditsBalance = async (token: string) => {
  const { data } = await api.get('/api/credits/balance', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const validateExport = async (token: string, idempotencyKey: string, craftType: string) => {
  const { data } = await api.post(
    '/api/exports/validate',
    { craft_type: craftType },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-idempotency-key': idempotencyKey,
      },
    }
  );
  return data;
};

export const completeExport = async (
  token: string,
  idempotencyKey: string,
  projectId: string,
  format: string,
  designData: unknown
) => {
  const { data } = await api.post(
    '/api/exports/complete',
    { craft_type: 'unknown', format, project_id: projectId, designData },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-idempotency-key': idempotencyKey,
      },
    }
  );
  return data;
};

export default api;
