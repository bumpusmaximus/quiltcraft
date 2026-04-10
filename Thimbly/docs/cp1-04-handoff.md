# Thimbly CP1 - Handoff Document

## 📍 Current State: Scaffold & Foundations Complete
The **Thimbly CP1 Grid Foundation** is complete, highly optimized, and ready for full backend integration. 

### What's Built
* **Database & Worker Pipeline**: Strict Supabase RLS policies are in place, RPCs handles idempotent credit management, and the Cloudflare Worker skeleton is deployed (currently mocked).
* **Grid Engine (Canvas)**: Hardware-accelerated CSS Grid background (zero-memory overhead), strict "zoom-to-cursor" math, and viewport frustum culling.
* **State Management**: Optimized Zustand store (`useGridStore`) with lightweight structural sharing for history tracking (no GC spikes).
* **Craft Logistics**: Abstract `CraftRules` handling multiple modes (Cross-Stitch defaults to Bee, Quilting defaults to Flower).
* **Theme**: Fully integrated 'Cottagecore' theme (`Playfair Display` + curated DMC-117 hex locks).

---

## 🎯 Next Session Objective: Phase 04 - Integration Flow
The immediate goal of the next session is to replace the mock services with live environment connectivity and enable the automatic save/export pipeline.

### Immediate Action Items

#### 1. Supabase Auth & Real Client
- **Worker**: In `worker/src/lib/supabase.ts`, strip out the `MockSupabaseClient` and restore the real `@supabase/supabase-js` `createClient`.
- **Worker Auth**: In `worker/src/lib/auth.ts`, update `authMiddleware` to extract Bearer tokens and verify them using `supabase.auth.getUser()`.
- **Frontend**: Create a simple `useAuth.ts` context hook to provide the global session.

#### 2. Persistence & Auto-Sync
- **Zustand Store**: Add `projectId` and `isSaving` to the `useGridStore`.
- **Sync Hook**: Write `useSync.ts`, a debounced (2s) effect that automatically `UPSERT`s the `gridData` to the Supabase `projects` table whenever the user makes edits.

#### 3. Checkout & R2 Exports
- **Stripe Session**: Implement the `POST /api/checkout/create-session` route in the worker to trigger native Stripe Checkout.
- **Export Modal**: Build `ExportModal.tsx` in the frontend. It should act as a multi-step component: *Verify Balance → Validate (API) → Upload to R2 → Finalize / Deduct Credit (API)*. 

---

## 🚨 Essential Notes for the Next Agent
- **Worker API Contract**: `validateExport` and `completeExport` in `api.ts` have been updated to send `craft_type` and `format` via **JSON Body**, *not* headers.
- **UI Aesthetic**: Maintain the "Luxury Cottagecore" visual design. Use the `cottage-wood`, `cottage-cream`, and `cottage-sage` color variables.
- **Secrets Validation**: Ensure the `.env` (Frontend) and `wrangler.toml` (Worker) contain actual valid `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `STRIPE` tokens before executing integration test suites.
