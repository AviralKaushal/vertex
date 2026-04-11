import { useState, useEffect, useCallback } from 'react';
import { plaidApi } from '../lib/services';

export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  description: string;
  merchant_name: string | null;
  category: string | null;
  date: string;
  type: 'credit' | 'debit';
  channel: string | null;
  status: string;
  pending: boolean;
  account_name: string;
  account_color: string;
}

interface UseTransactionsParams {
  limit?: number;
  offset?: number;
  accountId?: string;
  category?: string;
  search?: string;
}

export function useTransactions(params: UseTransactionsParams = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await plaidApi.getTransactions(params);
      setTransactions(data.transactions || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  const sync = async () => {
    try {
      await plaidApi.syncTransactions();
      await fetch();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return { transactions, loading, error, refetch: fetch, sync };
}
