import { useState } from 'react';
import { motion } from 'motion/react';
import { QrCode, Copy, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';

export default function GenerateRedemptionQR() {
  const { user } = useUserStore();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const displayName = user.full_name || user.email || 'Member';
  const walletDisplay = user.wallet_address || 'No wallet connected';

  const handleCopy = () => {
    navigator.clipboard.writeText(user.wallet_address || user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center min-h-[60vh] p-6 space-y-6">
      <header className="w-full flex items-center gap-4 mb-2">
        <Link to="/wallet">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Redeem ENB</h1>
          <p className="text-sm text-enb-text-secondary">Show to a partner business</p>
        </div>
      </header>

      <div className="text-center space-y-1">
        <p className="text-enb-text-secondary text-sm">Your current balance</p>
        <p className="text-3xl font-bold text-enb-green">{(user.enb_local_bal ?? 0).toLocaleString()} ENB.LOCAL</p>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <Card className="bg-white border-gray-100 shadow-lg w-72 h-72 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-enb-green/5 to-enb-gold/5 pointer-events-none" />
          <CardContent className="p-0 flex flex-col items-center justify-center z-10">
            <QrCode className="w-48 h-48 text-enb-text-primary" />
            <div className="mt-4 text-xs text-enb-text-secondary font-mono tracking-widest uppercase">
              {displayName}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg w-full max-w-xs">
        <span className="text-sm font-mono text-gray-600 truncate flex-1">
          {walletDisplay.length > 20 ? `${walletDisplay.slice(0, 10)}...${walletDisplay.slice(-8)}` : walletDisplay}
        </span>
        <button onClick={handleCopy} className="text-gray-400 hover:text-enb-green transition-colors flex-shrink-0">
          {copied ? <CheckCircle className="w-4 h-4 text-enb-green" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {!user.wallet_address && (
        <p className="text-xs text-center text-orange-500 max-w-xs">
          No Solana wallet connected. Connect your wallet in Settings to enable bridging.
        </p>
      )}

      <p className="text-xs text-center text-gray-400 max-w-xs">
        This QR code is valid for 5 minutes. Partner businesses scan this to redeem your ENB tokens.
      </p>
    </div>
  );
}
