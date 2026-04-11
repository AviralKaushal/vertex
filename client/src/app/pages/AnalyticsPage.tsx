import { useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useTransactions } from '../../hooks/useTransactions';
import { useAccounts } from '../../hooks/useAccounts';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar, Loader2 } from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1', '#64748b', '#10b981', '#ef4444'];

export function AnalyticsPage() {
  const { transactions, loading } = useTransactions({ limit: 500 });
  const { accounts } = useAccounts();

  const { monthlyData, categoryData, totalIncome, totalExpenses } = useMemo(() => {
    const byMonth: Record<string, { income: number; expenses: number }> = {};
    const byCat: Record<string, number> = {};

    transactions.forEach(t => {
      const month = t.date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { income: 0, expenses: 0 };
      if (t.type === 'credit') byMonth[month].income += Number(t.amount);
      else byMonth[month].expenses += Number(t.amount);

      if (t.type === 'debit') {
        const cat = (t.category || 'Other').replace(/_/g, ' ');
        byCat[cat] = (byCat[cat] || 0) + Number(t.amount);
      }
    });

    const sortedMonths = Object.keys(byMonth).sort().slice(-7);
    const monthlyData = sortedMonths.map(m => ({
      month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      income: Math.round(byMonth[m].income),
      expenses: Math.round(byMonth[m].expenses),
    }));

    const categoryData = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], i) => ({ name, value: Math.round(value), color: COLORS[i % COLORS.length] }));

    const totalIncome = Object.values(byMonth).reduce((s, m) => s + m.income, 0);
    const totalExpenses = Object.values(byMonth).reduce((s, m) => s + m.expenses, 0);

    return { monthlyData, categoryData, totalIncome, totalExpenses };
  }, [transactions]);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : '0.0';
  const avgMonthlyExpense = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length)
    : 0;

  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance || 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Analytics</h1>
            <p className="text-slate-600">Deep insights into your financial patterns</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Savings Rate', value: `${savingsRate}%`, color: 'text-emerald-600', icon: <TrendingUp className="w-4 h-4" />, sub: 'Of total income saved' },
                  { label: 'Total Income', value: `$${Math.round(totalIncome).toLocaleString()}`, color: 'text-blue-600', icon: <BarChart3 className="w-4 h-4" />, sub: 'All time' },
                  { label: 'Avg. Monthly Expenses', value: `$${avgMonthlyExpense.toLocaleString()}`, color: 'text-slate-900', icon: <Calendar className="w-4 h-4" />, sub: 'Last 7 months' },
                  { label: 'Net Worth', value: `$${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'text-purple-600', icon: <PieChartIcon className="w-4 h-4" />, sub: 'Across all accounts' },
                ].map(stat => (
                  <Card key={stat.label} className="border border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        {stat.icon}
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                      <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Income vs Expenses
                    </CardTitle>
                    <CardDescription>Monthly comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyData.length === 0 ? (
                      <div className="flex items-center justify-center h-64 text-slate-400">
                        No transaction data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                          <Legend />
                          <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} name="Income" />
                          <Bar dataKey="expenses" fill="#ec4899" radius={[8, 8, 0, 0]} name="Expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5" />
                      Spending by Category
                    </CardTitle>
                    <CardDescription>Breakdown of all spending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categoryData.length === 0 ? (
                      <div className="flex items-center justify-center h-64 text-slate-400">
                        No spending data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {monthlyData.length > 0 && (
                <Card className="border border-slate-200 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Financial Trend
                    </CardTitle>
                    <CardDescription>Net income trend over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData.map(m => ({ ...m, net: m.income - m.expenses }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} name="Income" />
                        <Line type="monotone" dataKey="expenses" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} name="Expenses" />
                        <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} name="Net Savings" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {categoryData.length > 0 && (
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                    <CardDescription>Detailed breakdown of spending categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryData.map(cat => {
                        const total = categoryData.reduce((s, c) => s + c.value, 0);
                        const pct = total > 0 ? (cat.value / total * 100).toFixed(1) : '0';
                        return (
                          <div key={cat.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="font-medium">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-600">{pct}%</span>
                                <span className="font-semibold">${cat.value.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}