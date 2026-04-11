import { Badge } from './ui/badge';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  status?: string;
  date: string;
  channel?: string | null;
  category?: string | null;
  type: 'credit' | 'debit';
  account_name?: string;
  account_color?: string;
  pending?: boolean;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Travel': 'bg-blue-100 text-blue-700 border-blue-200',
  'Food and Drink': 'bg-pink-100 text-pink-700 border-pink-200',
  'FOOD_AND_DRINK': 'bg-pink-100 text-pink-700 border-pink-200',
  'Shopping': 'bg-purple-100 text-purple-700 border-purple-200',
  'GENERAL_MERCHANDISE': 'bg-purple-100 text-purple-700 border-purple-200',
  'Entertainment': 'bg-orange-100 text-orange-700 border-orange-200',
  'Healthcare': 'bg-green-100 text-green-700 border-green-200',
  'Income': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Transfer': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'TRANSFER': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'TRANSPORTATION': 'bg-sky-100 text-sky-700 border-sky-200',
};

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-400 font-medium">No transactions found</p>
        <p className="text-slate-300 text-sm mt-1">Connect a bank account and sync to see your transactions</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Transaction</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Amount</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Status</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Date</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Channel</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  {transaction.account_color && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: transaction.account_color }} />
                  )}
                  <span className="text-sm font-medium text-slate-900">{transaction.description}</span>
                  {transaction.pending && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Pending</Badge>
                  )}
                </div>
                {transaction.account_name && (
                  <p className="text-xs text-slate-400 mt-0.5 ml-4">{transaction.account_name}</p>
                )}
              </td>
              <td className="py-4 px-4">
                <span className={`text-sm font-semibold ${transaction.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {transaction.type === 'credit' ? '+' : '-'}${Math.abs(Number(transaction.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </td>
              <td className="py-4 px-4">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                  ● {transaction.pending ? 'Pending' : transaction.status || 'Posted'}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-slate-600">
                  {new Date(transaction.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-slate-600">{transaction.channel || '—'}</span>
              </td>
              <td className="py-4 px-4">
                {transaction.category ? (
                  <Badge className={CATEGORY_COLORS[transaction.category] || 'bg-slate-100 text-slate-700 border-slate-200'}>
                    ● {transaction.category.replace(/_/g, ' ')}
                  </Badge>
                ) : (
                  <span className="text-slate-400 text-sm">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
