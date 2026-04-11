import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowRight, Wallet, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { transferApi } from '../../lib/services';
import { useAccounts } from '../../hooks/useAccounts';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function CheckoutForm({ transferData, toAcct }: { transferData: any, toAcct: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { amount, transferId, paymentIntentId } = transferData;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed. Please try again.');
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const response: any = await transferApi.confirmTransfer({ transferId, paymentIntentId });
        setIsSuccess(true);
        if (response.alreadyProcessed) {
          toast.info('Deposit was already processed concurrently.');
        } else {
          toast.success('Deposit completed successfully!');
        }
        setTimeout(() => navigate('/'), 2500);
      } else {
        toast.error("Payment not completed yet.");
      }
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed on backend. Please try again.');
    } finally {
      if (!isSuccess) setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border border-emerald-200 bg-emerald-50 mt-20">
        <CardContent className="pt-16 pb-16 text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-slate-900">Deposit Successful!</h2>
          <p className="text-slate-600 mb-2">
            ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been deposited
          </p>
          <p className="text-sm text-slate-500">
            Into {toAcct?.name || 'account'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleConfirm}>
      <Card className="border border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Secure Payment</CardTitle>
              <CardDescription>Enter card details securely via Stripe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-md">
            <PaymentElement />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 h-14"
              onClick={() => navigate('/transfer')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-14 bg-slate-900 hover:bg-slate-800 text-white"
              disabled={!stripe || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Processing...' : 'Pay & Confirm Deposit'}
              {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export function ConfirmTransferPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const transferData = location.state;
  const { accounts } = useAccounts();

  if (!transferData || !transferData.clientSecret) {
    setTimeout(() => navigate('/transfer'), 0);
    return null;
  }

  const { toAccountId, amount, note, clientSecret } = transferData;
  const toAcct = accounts.find(a => a.id === toAccountId);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Confirm Deposit</h1>
            <p className="text-slate-600">Review your deposit details and enter payment securely.</p>
          </div>

          <Card className="border border-slate-200 mb-6">
            <CardHeader>
              <CardTitle>Deposit Summary</CardTitle>
              <CardDescription>Please review the details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Destination Account</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: toAcct?.color || '#8b5cf6' }}>
                      <Wallet className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold">{toAcct?.name || toAccountId}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-slate-600">Deposit Amount</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {note && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Note</div>
                  <div className="font-medium">{note}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm transferData={transferData} toAcct={toAcct} />
          </Elements>

        </div>
      </div>
    </div>
  );
}
