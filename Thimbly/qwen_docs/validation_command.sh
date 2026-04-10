# Test RLS: Try to select another user's credits (should return empty)
# Test RPC: Call grant_credits with valid/invalid roles → Verify response
# Test idempotency: Call twice with same key → Second returns 'duplicate'