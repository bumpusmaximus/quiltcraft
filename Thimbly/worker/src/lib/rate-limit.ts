import type { Context, Next } from 'hono';
import type { Env } from './types';

export const rateLimitMiddleware = async (c: Context<Env>, next: Next) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const key = `ratelimit:${ip}`;
  
  const kv = c.env.RATE_LIMIT_KV;
  const currentStr = await kv.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;
  
  if (current >= 10) {
    return c.json({ error: 'Too many requests' }, 429);
  }
  
  await kv.put(key, (current + 1).toString(), { expirationTtl: 60 });
  
  await next();
};
