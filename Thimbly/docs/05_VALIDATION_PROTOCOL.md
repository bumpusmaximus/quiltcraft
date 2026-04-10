# Hard-Stop Validation Protocol
Run BEFORE merging ANY CP1 code:
1. npm run test:rls → Blocks cross-user access
2. npm run test:credits → Idempotency + negative balance protection
3. npm run perf:grid → 500x500 @60fps, <150MB RAM
4. npm run audit:deps → Zero critical/high CVEs
5. npm run test:e2e → Full export + payment flow
IF ANY FAIL: hotfix/cp1-blocker-<date> branch → fix → retest → merge only when 100% green.
