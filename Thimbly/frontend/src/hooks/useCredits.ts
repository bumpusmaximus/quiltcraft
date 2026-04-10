import { useState, useEffect, useCallback } from 'react';
import { getCreditsBalance } from '../lib/api';
import { useAuth } from './useAuth';

export function useCredits() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const fetchBalance = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const data = await getCreditsBalance(session.access_token);
      setBalance(data.balance);
    } catch (err) {
      console.error('Failed to fetch balance', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  const deductCreditLocal = () => {
    if (balance === null || balance < 1) return false;
    setBalance((prev) => (prev ? prev - 1 : 0));
    return true;
  };

  const revertCredit = () => {
    setBalance((prev) => (prev !== null ? prev + 1 : prev));
  };

  return { balance, deductCreditLocal, revertCredit, fetchBalance, loading };
}
