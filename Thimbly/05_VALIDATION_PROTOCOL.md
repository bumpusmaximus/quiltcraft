# Hard-Stop Validation Protocol
**Run BEFORE merging ANY CP1 code**

---

## 🛑 Gate Criteria

**If ANY validation fails:**
1. Create branch: `hotfix/cp1-blocker-<date>`
2. Fix failing tests
3. Re-run ALL validation commands
4. Only merge when ALL pass
5. **DO NOT proceed to CP2 until CP1 validation is 100% green**

---

## 1. RLS Security Test

```bash
npm run test:rls
```
