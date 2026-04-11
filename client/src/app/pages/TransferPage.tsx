import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowRight, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAccounts } from '../../hooks/useAccounts';
import { transferApi } from '../../lib/services';

export function TransferPage() {
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading } = useAccounts();
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toAccount || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = `ui_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const data: any = await transferApi.createPaymentIntent({
        toAccountId: toAccount,
        amount: parsedAmount,
        note,
        idempotencyKey
      });

      navigate('/transfer/confirm', {
        state: {
          toAccountId: toAccount,
          amount,
          note,
          transferId: data.transferId,
          paymentIntentId: data.paymentIntentId,
          clientSecret: data.clientSecret,
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Fund Account</h1>
            <p className="text-slate-600">Add money to your Vertex accounts via Stripe</p>
          </div>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Deposit Details
              </CardTitle>
              <CardDescription>Enter the deposit information below</CardDescription>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="flex items-center gap-3 py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="text-slate-500">Loading accounts...</span>
                </div>
              ) : accounts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-500">You need to connect an account first to fund it.</p>
                  <p className="text-slate-400 text-sm mt-1">Go to Connect Bank to add accounts.</p>
                </div>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="to-account">Destination Account</Label>
                    <Select value={toAccount} onValueChange={setToAccount}>
                      <SelectTrigger id="to-account" className="h-12">
                        <SelectValue placeholder="Select destination account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-3 py-1">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: account.color }}>
                                <Wallet className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium">{account.name}</div>
                                <div className="text-xs text-slate-500">****{account.mask}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="h-14 pl-8 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Input
                      id="note"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="h-12"
                      placeholder="Add a note for this deposit"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white text-lg"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      {loading ? 'Initiating...' : 'Continue to Confirm'}
                      {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {['100', '500', '1000'].map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className="p-4 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="text-2xl font-bold text-slate-900">${amt}</div>
                <div className="text-xs text-slate-600">Quick amount</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}