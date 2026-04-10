# Task 1.1: Supabase Foundation [PRO]
**Prompt:** [PRO] Generate a single Supabase SQL migration for Thimbly CP1:
- Tables: user_credits, credit_transactions, user_roles, projects (with enums, checks, JSONB)
- Triggers: handle_new_user() auto-init credits/roles
- RLS: Strict owner-only SELECT, NO direct INSERT/UPDATE on credits, admin/ops SELECT for transactions
- RPC: grant_credits() SECURITY DEFINER with role validation, idempotency, negative balance protection
- Indexes: credit_transactions(user_id, created_at), projects(user_id, craft_type)
**Validate:** No direct writes, RLS isolates users, RPC handles duplicates safely.
