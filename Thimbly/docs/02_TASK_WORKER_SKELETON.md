# Task 1.2: Cloudflare Worker Skeleton [PRO/FLASH]
**Prompt:** [PRO] Generate CF Worker (Hono) with: /api/auth/session, /api/credits/balance, /api/exports/validate, /api/exports/complete, /api/webhooks/stripe. Include JWT verification, KV rate limiting (10 req/min), idempotency headers, Stripe signature verification, R2 export stub. Output: worker/src/index.ts, wrangler.toml, .env.example, lib/*.ts
**Validate:** 401 on bad JWT, blocks export when balance<1, rejects invalid webhooks.
