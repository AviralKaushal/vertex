import { useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Landmark, Plus, CheckCircle2, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { usePlaidLink } from '../../hooks/usePlaidLink';
import { useAccounts } from '../../hooks/useAccounts';
import { plaidApi } from '../../lib/services';
import { useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Plaid: any;
  }
}

export function ConnectBankPage() {
  const { accounts, loading: accountsLoading, refetch } = useAccounts();
  const [connectedItems, setConnectedItems] = useState<any[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const data: any = await plaidApi.getConnectedItems();
      setConnectedItems(data.items || []);
    } catch {}
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const onPlaidSuccess = useCallback(async () => {
    toast.success('Bank connected and transactions synced!');
    await refetch();
    await fetchItems();
  }, [refetch, fetchItems]);

  const { loading, error, generateLinkToken, exchangeToken } = usePlaidLink(onPlaidSuccess);

  const handleConnect = async () => {
    const linkToken = await generateLinkToken();
    if (!linkToken) return;

    if (!window.Plaid) {
      toast.error('Plaid SDK not loaded. Check your internet connection.');
      return;
    }

    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: async (publicToken: string) => {
        await exchangeToken(publicToken);
      },
      onExit: (err: any) => {
        if (err) toast.error('Plaid Link exited with an error');
      },
    });

    handler.open();
  };

  const handleRemove = async (itemId: string, name: string) => {
    setRemoving(itemId);
    try {
      await plaidApi.removeItem(itemId);
      toast.success(`${name} disconnected`);
      await fetchItems();
      await refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to disconnect');
    } finally {
      setRemoving(null);
    }
  };

  const handleSync = async () => {
    try {
      await plaidApi.syncTransactions();
      toast.success('Transactions synced!');
      await refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Connect Bank</h1>
              <p className="text-slate-600">Link your bank accounts to Vertex securely via Plaid</p>
            </div>

            <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">Bank-level Security via Plaid</h3>
                    <p className="text-sm text-slate-700">
                      We use Plaid to securely connect to your bank. We never see or store your banking credentials.
                      All data is encrypted in transit and at rest.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 mb-6">
              <Button
                id="connect-bank-btn"
                onClick={handleConnect}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                size="lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {loading ? 'Opening Plaid...' : 'Add Bank Account'}
              </Button>
              <Button
                variant="outline"
                onClick={handleSync}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Transactions
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>Connected Banks</CardTitle>
                <CardDescription>
                  {connectedItems.length === 0
                    ? 'No banks connected yet'
                    : `${connectedItems.length} institution${connectedItems.length > 1 ? 's' : ''} connected`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accountsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : connectedItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Landmark className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No banks connected</p>
                    <p className="text-slate-400 text-sm mt-1">Click &quot;Add Bank Account&quot; to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connectedItems.map(item => {
                      const itemAccounts = accounts.filter(() => true);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                              <Landmark className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{item.institution_name || 'Unknown Bank'}</p>
                              <p className="text-sm text-slate-500">
                                Connected {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRemove(item.id, item.institution_name || 'Bank')}
                              disabled={removing === item.id}
                            >
                              {removing === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}