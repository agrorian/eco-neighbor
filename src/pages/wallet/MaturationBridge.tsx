import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const BRIDGE_REP_MINIMUM = 50000; // Pillar tier required per whitepaper

export default function MaturationBridge() {
  const { user } = useUserStore();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const repScore = user.rep_score ?? 0;
  const localBal = user.enb_local_bal ?? 0;
  const isEligible = repScore >= BRIDGE_REP_MINIMUM;

  const handleBridge = async () => {
    if (!isEligible || !amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bridge_requests')
        .insert({
          user_id: user.id,
          enb_local_amount: parseFloat(amount),
          status: 'pending',
          wallet_address: user.wallet_address || null,
        });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error('Bridge request failed:', err);
      alert('Bridge request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <div className="w-24 h-24 bg-enb-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-enb-gold" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold text-enb-text-primary mb-2">Bridge Request Submitted!</h1>
        <p className="text-enb-text-secondary max-w-xs mx-auto">
          Your request is pending admin review. ENB.GLOBAL will be sent to your Solana wallet within 24–48 hours.
        </p>
        <Link to="/wallet">
          <Button className="mt-8 bg-enb-gold hover:bg-enb-gold/90 text-white">
            Return to Wallet
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-lg mx-auto">
      <header className="mb-6 flex items-center gap-4">
        <Link to="/wallet">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Maturation Bridge</h1>
          <p className="text-sm text-enb-text-secondary">Convert ENB.LOCAL → ENB.GLOBAL</p>
        </div>
      </header>

      {/* Eligibility Banner */}
      {!isEligible && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-orange-700">Pillar Tier Required</p>
              <p className="text-xs text-orange-600 mt-1">
                You need {BRIDGE_REP_MINIMUM.toLocaleString()} Rep Score to use the Bridge. You have {repScore.toLocaleString()} Rep. Keep submitting actions to earn more!
              </p>
              <div className="mt-2 h-2 bg-orange-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all"
                  style={{ width: `${Math.min((repScore / BRIDGE_REP_MINIMUM) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-orange-500 mt-1">{repScore.toLocaleString()} / {BRIDGE_REP_MINIMUM.toLocaleString()} Rep</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-gray-100 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <div className="text-xs text-enb-text-secondary font-medium uppercase tracking-wider">Available Balance</div>
              <div className="text-2xl font-bold text-enb-green">{localBal.toLocaleString()} ENB.LOCAL</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAmount(localBal.toString())} className="text-enb-green hover:bg-enb-green/10" disabled={!isEligible}>
              Max
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Amount to Bridge</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                disabled={!isEligible}
                className="w-full p-4 pr-16 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-enb-gold/50 focus:border-enb-gold outline-none text-lg font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">ENB</div>
            </div>
          </div>

          <div className="flex items-center justify-center py-2">
            <ArrowRight className="w-6 h-6 text-gray-300" />
          </div>

          <div className="p-4 bg-enb-gold/5 border border-enb-gold/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-enb-gold flex-shrink-0 mt-0.5" />
            <div className="text-xs text-enb-gold/80 font-medium space-y-1">
              <p>Bridge requires Pillar Tier (50,000+ Rep Score).</p>
              <p>Annual cap: 20% of your total ENB.LOCAL balance.</p>
              <p>Your wallet address must be connected to receive ENB.GLOBAL.</p>
            </div>
          </div>

          <Button
            onClick={handleBridge}
            disabled={!amount || parseFloat(amount) <= 0 || loading || !isEligible}
            className="w-full h-12 text-lg bg-enb-gold hover:bg-enb-gold/90 text-white shadow-lg shadow-enb-gold/20 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
            {loading ? 'Submitting...' : 'Request Bridge'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
