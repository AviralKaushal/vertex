import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, MoreVertical, Unplug, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { plaidApi } from '../../lib/services';

export function AccountsPage() {
  const { accounts, loading, refetch } = useAccounts();
  const { transactions } = useTransactions({ limit: 200 });
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string } | null>(null);

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);

  const getAccountTransactions = (accountId: string) =>
    transactions.filter(t => t.account_id === accountId);

  const getMonthlyChange = (accountId: string) => {
    const txns = getAccountTransactions(accountId).filter(t =>
      t.date.startsWith(new Date().toISOString().slice(0, 7))
    );
    return txns.reduce((sum, t) => sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount)), 0);
  };

  const confirmDisconnect = async () => {
    if (!itemToRemove) return;
    setRemovingId(itemToRemove.id);
    try {
      await plaidApi.removeItem(itemToRemove.id);
      toast.success(`${itemToRemove.name} disconnected`);
      await refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to disconnect');
    } finally {
      setRemovingId(null);
      setItemToRemove(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Accounts</h1>
            <p className="text-slate-600">Manage and view all your connected accounts</p>
          </div>

          <Card className="mb-8 border border-slate-200">
            <CardContent className="pt-8">
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="text-slate-500">Loading accounts...</span>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Total Portfolio Value</p>
                    <h2 className="text-5xl font-bold text-slate-900">
                      ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-slate-600">Active Accounts</p>
                      <p className="text-3xl font-bold text-slate-900">{accounts.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Transactions</p>
                      <p className="text-3xl font-bold text-slate-900">{transactions.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : accounts.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="py-16 text-center">
                <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No accounts connected yet</p>
                <p className="text-slate-400 text-sm mt-1">Go to Connect Bank to add your first account</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {accounts.map(account => {
                const accountTxns = getAccountTransactions(account.id);
                const recentTxns = accountTxns.slice(0, 5);
                const change = getMonthlyChange(account.id);
                const percentOfTotal = totalBalance > 0 ? (Number(account.current_balance) / totalBalance) * 100 : 0;

                return (
                  <Card key={account.id} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader
                      className="rounded-t-lg pb-6"
                      style={{ background: `linear-gradient(135deg, ${account.color}15, ${account.color}05)` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: account.color }}>
                            <Wallet className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{account.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {account.type} {account.mask ? `• ****${account.mask}` : ''}
                              {account.institution_name ? ` • ${account.institution_name}` : ''}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Active</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setItemToRemove({ id: account.id, name: account.name })}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Unplug className="mr-2 h-4 w-4" />
                                Disconnect Bank
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="text-sm text-slate-600 mb-1">Available Balance</p>
                        <p className="text-4xl font-bold">
                          ${Number(account.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {change >= 0
                            ? <TrendingUp className="w-4 h-4 text-green-600" />
                            : <TrendingDown className="w-4 h-4 text-red-600" />}
                          <span className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? '+' : ''}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2 })} this month
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Portfolio Share</span>
                          <span>{percentOfTotal.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentOfTotal} className="h-2" />
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-sm">Recent Transactions</h4>
                        <span className="text-xs text-slate-500">{accountTxns.length} total</span>
                      </div>
                      <div className="space-y-3">
                        {recentTxns.length > 0 ? recentTxns.map(txn => (
                          <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-600'}`}>
                                {txn.type === 'credit'
                                  ? <ArrowUpRight className="w-4 h-4" />
                                  : <ArrowDownLeft className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{txn.description}</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className={`font-semibold text-sm ${txn.type === 'credit' ? 'text-green-600' : 'text-pink-600'}`}>
                              {txn.type === 'credit' ? '+' : ''}${Math.abs(Number(txn.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm text-slate-500 text-center py-4">No recent transactions</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={itemToRemove !== null} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect {itemToRemove?.name}?
              You will no longer be able to view transactions from this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisconnect} className="bg-red-600 hover:bg-red-700">
              {removingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}