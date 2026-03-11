import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface EligibilityData {
  eligible: boolean;
  days_held: number;
  rep_score: number;
  annual_cap_pct: number;
  convertible_this_year: number;
  requires_governance_vote: boolean;
  error?: string;
}

export default function MaturationBridge() {
  const { user } = useUserStore();
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchEligibility = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('check_bridge_eligibility', {
          p_user_id: user.id,
        });
        if (error) throw error;
        setEligibility(data);
      } catch (err: any) {
        // RPC not yet deployed — show manual eligibility based on user data
        const repOk = user.rep_score >= 50000;
        setEligibility({
          eligible: repOk,
          days_held: 0,
          rep_score: user.rep_score,
          annual_cap_pct: 20,
          convertible_this_year: repOk ? Math.floor(user.enb_local_bal * 0.2) : 0,
          requires_governance_vote: user.enb_local_bal > 500000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEligibility();
  }, [user?.id]);

  const handleBridge = async () => {
    if (!user || !eligibility?.eligible || !amount) return;
    const amt = parseFloat(amount);
    if (amt <= 0 || amt > (eligibility.convertible_this_year || 0)) {
      setError(`Maximum convertible this year: ${eligibility.convertible_this_year?.toLocaleString()} ENB`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { error } = await supabase.from('bridge_requests').insert({
        user_id: user.id,
        enb_local_amount: amt,
        status: 'pending',
        wallet_address: user.wallet_address || null,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Bridge request failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <div className="w-24 h-24 bg-enb-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-enb-gold" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold text-enb-text-primary">Bridge Request Submitted!</h1>
        <p className="text-enb-text-secondary max-w-xs mx-auto">
          Your request is pending admin review. ENB.GLOBAL will be sent to your Solana wallet within 24–48 hours.
        </p>
        <Link to="/wallet">
          <Button className="mt-6 bg-enb-gold hover:bg-enb-gold/90 text-white">Return to Wallet</Button>
        </Link>
      </div>
    );
  }

  const CONDITIONS = [
    {
      label: '365-Day Hold',
      description: 'No wallet movement for 365 days',
      met: (eligibility?.days_held || 0) >= 365,
      progress: Math.min(((eligibility?.days_held || 0) / 365) * 100, 100),
      detail: `${eligibility?.days_held || 0} / 365 days`,
    },
    {
      label: 'Rep Score ≥ 50,000',
      description: 'Pillar Tier required',
      met: (eligibility?.rep_score || 0) >= 50000,
      progress: Math.min(((eligibility?.rep_score || 0) / 50000) * 100, 100),
      detail: `${(eligibility?.rep_score || 0).toLocaleString()} / 50,000 Rep`,
    },
    {
      label: '20% Annual Cap',
      description: 'Maximum convertible per year',
      met: true,
      progress: 100,
      detail: `Up to ${(eligibility?.convertible_this_year || 0).toLocaleString()} ENB this year`,
    },
    {
      label: 'Governance Vote',
      description: 'Required for batches > 500,000 ENB',
      met: !eligibility?.requires_governance_vote,
      progress: eligibility?.requires_governance_vote ? 0 : 100,
      detail: eligibility?.requires_governance_vote ? 'Vote required for this amount' : 'Not required',
    },
  ];

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto pb-24">
      <header className="flex items-center gap-4">
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
        </div>
      ) : (
        <>
          {/* Conditions */}
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-enb-text-primary">Eligibility Conditions</h3>
              {CONDITIONS.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {c.met
                        ? <CheckCircle className="w-4 h-4 text-enb-green flex-shrink-0" />
                        : <Lock className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                      <span className="text-sm font-medium text-enb-text-primary">{c.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">{c.detail}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${c.met ? 'bg-enb-green' : 'bg-orange-300'}`}
                      style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bridge form — only if eligible */}
          {eligibility?.eligible ? (
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <div className="text-xs text-enb-text-secondary font-medium uppercase tracking-wider">Convertible This Year</div>
                    <div className="text-2xl font-bold text-enb-green">{eligibility.convertible_this_year?.toLocaleString()} ENB</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAmount(String(eligibility.convertible_this_year))}
                    className="text-enb-green hover:bg-enb-green/10">Max</Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-enb-text-primary">Amount to Bridge</label>
                  <div className="relative">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                      className="w-full p-4 pr-16 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-enb-gold/50 focus:border-enb-gold outline-none text-lg font-mono" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">ENB</div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="p-3 bg-enb-gold/5 border border-enb-gold/20 rounded-xl flex items-start gap-3 text-xs text-enb-gold/80">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Your wallet address must be connected to receive ENB.GLOBAL. 2% burn applies on redemption.</span>
                </div>

                <Button onClick={handleBridge} disabled={!amount || parseFloat(amount) <= 0 || submitting}
                  className="w-full h-12 text-lg bg-enb-gold hover:bg-enb-gold/90 text-white shadow-lg shadow-enb-gold/20">
                  {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</> : 'Initiate Conversion'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
              <p className="font-bold mb-1">Not Yet Eligible</p>
              <p>Complete all 4 conditions above to unlock the Maturation Bridge.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
