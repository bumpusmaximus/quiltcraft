export type Env = {
  Bindings: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_SECRET_KEY: string;
    RATE_LIMIT_KV: KVNamespace;
    EXPORTS_BUCKET: R2Bucket;
  };
  Variables: {
    user: {
      id: string;
      role: 'user' | 'admin' | 'ops';
      email?: string;
    };
  };
};
