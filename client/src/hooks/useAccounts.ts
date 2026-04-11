import { useState, useEffect, useCallback } from 'react';
import { plaidApi } from '../lib/services';

export interface Account {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number;
  available_balance: number;
  color: string;
  iso_currency_code: string;
  institution_name: string | null;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await plaidApi.getAccounts();
      setAccounts(data.accounts || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { accounts, loading, error, refetch: fetch };
}
