# 1. RLS Security Test
npm run test:rls
# Must block: User A SELECT on User B's credits/projects
# Must allow: User A SELECT on own data; Admin SELECT on all

# 2. Credit Idempotency Test
npm run test:credits
# Must pass: Same idempotency key twice → second returns 'duplicate'
# Must pass: Negative deduction on balance=1 → rejected with error

# 3. Grid Performance Test
npm run perf:grid
# Must pass: 500x500 grid @ 60fps for 30 seconds
# Must pass: Memory usage < 150MB during pan/zoom

# 4. Dependency Audit
npm run audit:deps
# Must pass: Zero critical/high CVEs in dependencies

# 5. End-to-End Flow
npm run test:e2e
# Must pass: Login → design → free export → credit deduct → upgrade → paid export

# IF ANY FAIL:
# 1. Create branch: hotfix/cp1-blocker-<date>
# 2. Fix failing tests
# 3. Re-run ALL validation commands
# 4. Only merge when ALL pass
# DO NOT proceed to CP2 until CP1 validation is 100% green