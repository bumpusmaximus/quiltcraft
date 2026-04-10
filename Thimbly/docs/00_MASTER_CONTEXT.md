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
