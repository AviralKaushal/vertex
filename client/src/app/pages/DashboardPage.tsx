import { Sidebar } from '../components/Sidebar';
import { BankCard } from '../components/BankCard';
import { TransactionTable } from '../components/TransactionTable';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plane, UtensilsCrossed, ShoppingBag, Zap, Loader2, RefreshCw, Link2 } from 'lucide-react';
import { Link } from 'react-router';
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { useMemo } from 'react';

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  Travel: <Plane className="w-5 h-5 text-emerald-600" />,
  'Food and Drink': <UtensilsCrossed className="w-5 h-5 text-blue-600" />,
  FOOD_AND_DRINK: <UtensilsCrossed className="w-5 h-5 text-blue-600" />,
  Shopping: <ShoppingBag className="w-5 h-5 text-purple-600" />,
  GENERAL_MERCHANDISE: <ShoppingBag className="w-5 h-5 text-purple-600" />,
  Entertainment: <Zap className="w-5 h-5 text-amber-600" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Travel: 'bg-emerald-600',
  'Food and Drink': 'bg-blue-600',
  FOOD_AND_DRINK: 'bg-blue-600',
  Shopping: 'bg-purple-600',
  GENERAL_MERCHANDISE: 'bg-purple-600',
  Entertainment: 'bg-amber-600',
};

export function DashboardPage() {
  const { user } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: txnLoading } = useTransactions({ limit: 10 });
  const hasData = accounts.length > 0;

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0),
    [accounts]
  );

  const recentTransactions = transactions.slice(0, 5);

  const categoryTotals = useMemo(() =>
    transactions.reduce((acc, t) => {
      if (t.type === 'debit') {
        acc[t.category || 'Other'] = (acc[t.category || 'Other'] || 0) + Math.abs(Number(t.amount));
      }
      return acc;
    }, {} as Record<string, number>),
    [transactions]
  );

  const totalSpent = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
  const topCategories = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value, percentage: totalSpent ? (value / totalSpent) * 100 : 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const chartData = [{ name: 'Balance', value: totalBalance, color: '#2563eb' }];

  const firstName = user?.username?.split(' ')[0] || user?.username || 'there';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8">
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Welcome <span className="text-blue-600">{firstName}</span>
                </h1>
                <p className="text-slate-600">Access &amp; manage your account and transactions efficiently.</p>
              </div>

              {!hasData && !accountsLoading && (
                <Card className="mb-8 border-2 border-dashed border-blue-200 bg-blue-50">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Link2 className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Connect your first bank</h3>
                    <p className="text-sm text-slate-600 mb-4">Link a bank account to see your balances and transactions</p>
                    <Link to="/connect">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">Connect Bank</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <div className="mb-8">
                <Card className="border border-slate-200">
                  <CardContent className="p-6">
                    {accountsLoading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        <span className="text-slate-500">Loading accounts...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-8">
                        <div className="relative">
                          <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                startAngle={90}
                                endAngle={450}
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1">{accounts.length} Bank {accounts.length === 1 ? 'Account' : 'Accounts'}</p>
                          <p className="text-sm text-slate-600 mb-2">Total Current Balance</p>
                          <p className="text-4xl font-bold text-slate-900">
                            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
                  <Link to="/transactions">
                    <Button variant="link" className="text-blue-600">View all</Button>
                  </Link>
                </div>

                {accounts.length > 0 && (
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-slate-200">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: accounts[0]?.color || '#6366f1' }}
                      >
                        <div className="w-6 h-6 rounded bg-white/30" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{accounts[0]?.name}</p>
                        <p className="text-sm text-slate-600">
                          ${Number(accounts[0]?.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {txnLoading ? (
                  <div className="flex items-center gap-3 py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    <span className="text-slate-500">Loading transactions...</span>
                  </div>
                ) : (
                  <TransactionTable transactions={recentTransactions} />
                )}
              </div>
            </div>

            <div className="w-80 space-y-6">
              <Card className="border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user?.username}</p>
                      <p className="text-sm text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900">My Banks</h3>
                  <Link to="/connect">
                    <Button variant="link" className="text-blue-600 text-sm">+ Add Bank</Button>
                  </Link>
                </div>
                {accounts.slice(0, 2).map(account => (
                  <BankCard
                    key={account.id}
                    accountName={account.name}
                    balance={Number(account.current_balance)}
                    cardholderName={user?.username || ''}
                    lastFourDigits={account.mask || '****'}
                    color={account.color}
                  />
                ))}
              </div>

              {topCategories.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-4">Top Categories</h3>
                  <div className="space-y-4">
                    {topCategories.map(category => (
                      <div key={category.name} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              {CATEGORY_ICONS[category.name] || <ShoppingBag className="w-5 h-5 text-slate-600" />}
                            </div>
                            <span className="font-semibold text-slate-900 text-sm">{category.name.replace(/_/g, ' ')}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">${category.value.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${CATEGORY_COLORS[category.name] || 'bg-slate-600'} rounded-full`}
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-600 min-w-[3rem] text-right">
                            {category.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}