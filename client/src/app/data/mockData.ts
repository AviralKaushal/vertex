export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  accountNumber: string;
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  accountId: string;
  status: string;
  channel: string;
}

export const accounts: Account[] = [
  {
    id: '1',
    name: 'Main Checking',
    type: 'Checking',
    balance: 12450.75,
    accountNumber: '****4521',
    color: '#6366f1',
  },
  {
    id: '2',
    name: 'Savings Account',
    type: 'Savings',
    balance: 45230.00,
    accountNumber: '****7834',
    color: '#8b5cf6',
  },
  {
    id: '3',
    name: 'Investment Fund',
    type: 'Investment',
    balance: 89650.50,
    accountNumber: '****2910',
    color: '#ec4899',
  },
  {
    id: '4',
    name: 'Business Account',
    type: 'Business',
    balance: 23890.25,
    accountNumber: '****6543',
    color: '#14b8a6',
  },
];

export const transactions: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    description: 'Uber 063015 SFPOOL',
    amount: 5.40,
    type: 'debit' as const,
    category: 'Travel',
    date: '2026-02-20',
    status: 'Success',
    channel: 'Online'
  },
  {
    id: '2',
    accountId: '2',
    description: 'United Airlines',
    amount: -500.00,
    type: 'debit' as const,
    category: 'Travel',
    date: '2026-02-18',
    status: 'Success',
    channel: 'In Store'
  },
  {
    id: '3',
    accountId: '1',
    description: 'McDonalds',
    amount: 12.00,
    type: 'debit' as const,
    category: 'Food and Drink',
    date: '2026-02-17',
    status: 'Success',
    channel: 'In Store'
  },
  {
    id: '4',
    accountId: '3',
    description: 'Starbucks',
    amount: 4.33,
    type: 'debit' as const,
    category: 'Food and Drink',
    date: '2026-02-17',
    status: 'Success',
    channel: 'In Store'
  },
  {
    id: '5',
    accountId: '2',
    description: 'Spotify',
    amount: 9.99,
    type: 'debit' as const,
    category: 'Entertainment',
    date: '2026-02-15',
    status: 'Success',
    channel: 'Online'
  },
  {
    id: '6',
    accountId: '1',
    description: 'Salary Deposit',
    amount: 3500.00,
    type: 'credit' as const,
    category: 'Income',
    date: '2026-02-01',
    status: 'Success',
    channel: 'Direct Deposit'
  },
  {
    id: '7',
    accountId: '1',
    description: 'Amazon Purchase',
    amount: 89.99,
    type: 'debit' as const,
    category: 'Shopping',
    date: '2026-02-14',
    status: 'Success',
    channel: 'Online'
  },
  {
    id: '8',
    accountId: '2',
    description: 'CVS Pharmacy',
    amount: 25.50,
    type: 'debit' as const,
    category: 'Healthcare',
    date: '2026-02-13',
    status: 'Success',
    channel: 'In Store'
  },
  {
    id: '9',
    accountId: '3',
    description: 'Freelance Payment',
    amount: 850.00,
    type: 'credit' as const,
    category: 'Income',
    date: '2026-02-10',
    status: 'Success',
    channel: 'Bank Transfer'
  },
  {
    id: '10',
    accountId: '1',
    description: 'Netflix Subscription',
    amount: 15.99,
    type: 'debit' as const,
    category: 'Entertainment',
    date: '2026-02-08',
    status: 'Success',
    channel: 'Online'
  },
];

export const monthlyData = [
  { month: 'Aug', income: 6200, expenses: 4100 },
  { month: 'Sep', income: 6800, expenses: 4500 },
  { month: 'Oct', income: 7100, expenses: 4300 },
  { month: 'Nov', income: 6500, expenses: 4700 },
  { month: 'Dec', income: 8200, expenses: 5200 },
  { month: 'Jan', income: 7500, expenses: 4800 },
  { month: 'Feb', income: 9000, expenses: 3800 },
];

export const categoryData = [
  { name: 'Food', value: 850, color: '#8b5cf6' },
  { name: 'Transport', value: 320, color: '#ec4899' },
  { name: 'Shopping', value: 680, color: '#f59e0b' },
  { name: 'Utilities', value: 450, color: '#14b8a6' },
  { name: 'Entertainment', value: 280, color: '#6366f1' },
  { name: 'Other', value: 420, color: '#64748b' },
];