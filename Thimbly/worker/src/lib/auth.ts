import type { Context, Next } from 'hono';
import { getAuthSupabase } from './supabase';
import type { Env } from './types';

export const authMiddleware = async (c: Context<Env>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const jwt = authHeader.split(' ')[1];
  const supabase = getAuthSupabase(c.env, jwt);
  
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return c.json({ error: 'Unauthorized: Invalid JWT' }, 401);
  }
  const user = data.user;

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', user.id)
    .single();

  c.set('user', {
    id: user.id,
    role: roleData?.role || 'user',
    email: user.email,
  });

  await next();
};
