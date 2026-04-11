import { Wifi } from 'lucide-react';

interface BankCardProps {
  accountName: string;
  balance: number;
  cardholderName: string;
  lastFourDigits: string;
  color?: string;
}

export function BankCard({ accountName, balance, cardholderName, lastFourDigits, color = '#6366f1' }: BankCardProps) {
  return (
    <div
      className="relative rounded-2xl p-6 text-white shadow-lg overflow-hidden mb-3"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
    >
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

      <div className="relative flex justify-between items-start mb-8">
        <div>
          <p className="text-sm opacity-80 mb-1">{accountName}</p>
          <p className="text-2xl font-bold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <Wifi className="w-8 h-8 rotate-90 opacity-70" />
      </div>

      <div className="relative flex justify-between items-end">
        <div>
          <p className="text-xs opacity-70 mb-1 uppercase tracking-widest">{cardholderName}</p>
          <p className="text-base tracking-wider font-mono">•••• •••• •••• {lastFourDigits}</p>
        </div>
        <div className="flex gap-1">
          <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm" />
          <div className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm -ml-3" />
        </div>
      </div>
    </div>
  );
}
