import { useState, useCallback } from 'react';
import { plaidApi } from '../lib/services';

export function usePlaidLink(onSuccess: () => void) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLinkToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await plaidApi.createLinkToken();
      setLinkToken(data.link_token);
      return data.link_token;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exchangeToken = useCallback(async (publicToken: string) => {
    setLoading(true);
    try {
      await plaidApi.exchangePublicToken(publicToken);
      await plaidApi.syncTransactions();
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { linkToken, loading, error, generateLinkToken, exchangeToken };
}
