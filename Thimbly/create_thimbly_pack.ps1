New-Item -ItemType Directory -Force -Path "thimbly/docs"

Set-Content "thimbly/docs/00_MASTER_CONTEXT.md" @"
# Thimbly - Master Context
## Adobe Creative Suite for Needlecraft
**Stack:** Cloudflare (Pages/Workers/R2) + Supabase (Auth/Postgres/RLS)
**Phase:** CP1 - Grid Foundation (Cross-Stitch + Quilting + Credits + Auth)
**Project ID:** thimbly-cp1-grid

## 🎯 Phase 1 Goal
Ship browser-based grid engine with free design + 1 free export → pay-per-credit model, Supabase RLS, CF Worker export pipeline, React Canvas @ 60fps, DMC palette lock (ΔE<3), watermarked exports.

## ⛓️ Constraints (NON-NEGOTIABLE)
1. No direct table writes: all credit ops via RPC
2. Append-only credit ledger with idempotency
3. Grid engine supports craft rule injection
4. Hard-stop: ≥2 validation fails → PAUSE & refactor

## 🤖 Model Routing
[PRO] = Gemini Pro (Schema, security, complex logic)
[FLASH] = Gemini Flash (UI, tests, docs)
[GEMMA] = Gemma 4 (Utils, config)

## 📋 Output Rules
- Return ONLY code/config unless asked
- Use [CONTINUE] if truncated
- Validate against hard-stops before marking complete
"@

Set-Content "thimbly/docs/01_TASK_SUPABASE_FOUNDATION.md" @"
# Task 1.1: Supabase Foundation [PRO]
**Prompt:** [PRO] Generate a single Supabase SQL migration for Thimbly CP1:
- Tables: user_credits, credit_transactions, user_roles, projects (with enums, checks, JSONB)
- Triggers: handle_new_user() auto-init credits/roles
- RLS: Strict owner-only SELECT, NO direct INSERT/UPDATE on credits, admin/ops SELECT for transactions
- RPC: grant_credits() SECURITY DEFINER with role validation, idempotency, negative balance protection
- Indexes: credit_transactions(user_id, created_at), projects(user_id, craft_type)
**Validate:** No direct writes, RLS isolates users, RPC handles duplicates safely.
"@

Set-Content "thimbly/docs/02_TASK_WORKER_SKELETON.md" @"
# Task 1.2: Cloudflare Worker Skeleton [PRO/FLASH]
**Prompt:** [PRO] Generate CF Worker (Hono) with: /api/auth/session, /api/credits/balance, /api/exports/validate, /api/exports/complete, /api/webhooks/stripe. Include JWT verification, KV rate limiting (10 req/min), idempotency headers, Stripe signature verification, R2 export stub. Output: worker/src/index.ts, wrangler.toml, .env.example, lib/*.ts
**Validate:** 401 on bad JWT, blocks export when balance<1, rejects invalid webhooks.
"@

Set-Content "thimbly/docs/03_TASK_GRID_ENGINE.md" @"
# Task 1.3: Grid Engine Scaffold [FLASH/GEMMA]
**Prompt:** [FLASH] Build React+Canvas grid engine: GridEngine.tsx with zoom/pan, 60fps dirty-rect rendering, CraftRules interface, DMC 117 palette lock, Zustand store, undo/redo (50 steps), watermark export stub. Output: frontend/src/components/GridEngine/*, store/*, utils/palettes/*, config/crafts.ts
**Validate:** 500x500 @60fps, ΔE<3 accuracy, stable undo/redo, downloadable watermarked preview.
"@

Set-Content "thimbly/docs/04_TASK_INTEGRATION_FLOW.md" @"
# Task 1.4: Integration & Flow [PRO/FLASH]
**Prompt:** [PRO] Wire Supabase Auth → Frontend session → Credit deduction → Export pipeline → Stripe checkout. Implement useAuth/useCredits/useExport hooks, UpgradeModal, ExportProgress, Worker checkout routes, Stripe webhook handler. Output: frontend hooks/components, worker routes, Playwright E2E tests
**Validate:** Login→design→free export→deduct→upgrade→paid export works end-to-end.
"@

Set-Content "thimbly/docs/05_VALIDATION_PROTOCOL.md" @"
# Hard-Stop Validation Protocol
Run BEFORE merging ANY CP1 code:
1. npm run test:rls → Blocks cross-user access
2. npm run test:credits → Idempotency + negative balance protection
3. npm run perf:grid → 500x500 @60fps, <150MB RAM
4. npm run audit:deps → Zero critical/high CVEs
5. npm run test:e2e → Full export + payment flow
IF ANY FAIL: hotfix/cp1-blocker-<date> branch → fix → retest → merge only when 100% green.
"@

Set-Content "thimbly/docs/06_COMPLETION_CHECKLIST.md" @"
# CP1 Completion Checklist
- [ ] Supabase migration deployed + RLS verified
- [ ] CF Worker deployed to staging
- [ ] GridEngine 500x500 @60fps + DMC lock
- [ ] End-to-end export flow works (free→deduct→upgrade→paid)
- [ ] All validation commands pass
- [ ] Playwright E2E green
- [ ] Sentry + Cloudflare Analytics configured
- [ ] Stripe test mode updates credits correctly
"@

Set-Content "thimbly/docs/07_PRO_TIPS.md" @"
# Pro Tips for Antigravity + Gemini Execution
- Keep prompts <4k tokens. Use #CONTINUE for truncation.
- After every 2 tasks: run architecture review against manifest constraints.
- Fallback: If Gemini hallucinates schema → force [PRO] validation against Supabase RLS docs.
- Test-first: Generate 50 test cases BEFORE implementation.
- Never trust cloud output blindly. Run validation commands locally.
- Deploy to staging FIRST. Never push direct to production without manual E2E check.
"@

Compress-Archive -Path thimbly -DestinationPath thimbly_cp1_pack.zip -Force
Write-Host "✅ thimbly_cp1_pack.zip created successfully."
