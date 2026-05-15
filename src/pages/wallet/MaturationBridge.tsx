import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, RefreshCw, AlertCircle, CheckCircle,
  Lock, Loader2, Clock, ShieldCheck, Info, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { useT } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// ── v6.3 canonical ECP model ─────────────────────────────────────────────────
// ECP = tokens individually aged 365+ days (from reviewed_at) - FIFO debits - prior conversions
// max_convertible = 25% of ECP - prior_converted
// Max 2 lifetime events, 3-year gap, Pillar Tier required
// Governance vote required if conversion > 500,000 ENB
// ─────────────────────────────────────────────────────────────────────────────

interface EligibilityData {
  eligible: boolean;
  ecp: number;
  aged_credits: number;
  aged_debits: number;
  prior_converted: number;
  max_convertible: number;
  rep_score: number;
  tier_ok: boolean;
  gap_ok: boolean;
  event_count: number;
  next_event_number: number;
  last_conversion_at: string | null;
  governance_required: boolean;
  events_remaining: number;
}

function ConditionRow({
  icon: Icon,
  label,
  detail,
  met,
  progress,
}: {
  icon: any;
  label: string;
  detail: string;
  met: boolean;
  progress: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {met
            ? <CheckCircle className="w-4 h-4 text-enb-green flex-shrink-0" />
            : <Lock className="w-4 h-4 text-orange-400 flex-shrink-0" />}
          <Icon className="w-3.5 h-3.5 text-enb-text-secondary flex-shrink-0" />
          <span className="text-sm font-medium text-enb-text-primary">{label}</span>
        </div>
        <span className="text-xs text-gray-500 text-right max-w-[160px]">{detail}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${met ? 'bg-enb-green' : 'bg-orange-300'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function MaturationBridge() {
  const { l } = useT();
  const { user } = useUserStore();
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchEligibility = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc('check_bridge_eligibility', {
        p_user_id: user.id,
      });
      if (rpcErr) throw rpcErr;
      setEligibility(data as EligibilityData);
    } catch (err: any) {
      console.error('[Bridge] eligibility check failed:', err.message);
      setError('Could not load eligibility data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibility();
  }, [user?.id]);

  const handleBridge = async () => {
    if (!user || !eligibility?.eligible || !amount) return;
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (amt > (eligibility.max_convertible || 0)) {
      setError(
        `Maximum convertible: ${eligibility.max_convertible.toLocaleString()} ENB ` +
        `(25% of your ${eligibility.ecp.toLocaleString()} ENB Eligible Conversion Pool)`
      );
      return;
    }
    if (!user.wallet_address) {
      setError('You must connect a Phantom wallet address before initiating a bridge conversion.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { error: insertErr } = await supabase.from('bridge_requests').insert({
        user_id: user.id,
        requested_amount: amt,
        ecp_snapshot: eligibility.ecp,
        prior_converted: eligibility.prior_converted,
        max_convertible: eligibility.max_convertible,
        event_number: eligibility.next_event_number,
        governance_required: eligibility.governance_required,
        wallet_address: user.wallet_address,
        status: eligibility.governance_required ? 'governance_pending' : 'pending',
      });
      if (insertErr) throw insertErr;
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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
        >
          <div className="w-24 h-24 bg-enb-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-enb-gold" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold text-enb-text-primary">
          {eligibility?.governance_required ? 'Governance Vote Required' : 'Bridge Request Submitted'}
        </h1>
        <p className="text-enb-text-secondary max-w-xs mx-auto">
          {eligibility?.governance_required
            ? 'Your conversion exceeds 500,000 ENB. A Type 2 Ecosystem Governance vote is required before approval. You will be notified of the outcome.'
            : 'Your conversion request has been submitted for admin review. Your ENB.GLOBAL balance will be updated once approved. You will receive an inbox notification.'}
        </p>
        <Link to="/wallet">
          <Button className="mt-6 bg-enb-gold hover:bg-enb-gold/90 text-white">
            Return to Wallet
          </Button>
        </Link>
      </div>
    );
  }

  const ecpProgress = eligibility
    ? Math.min((eligibility.ecp / Math.max(eligibility.aged_credits, 1)) * 100, 100)
    : 0;

  const repProgress = eligibility
    ? Math.min((eligibility.rep_score / 50000) * 100, 100)
    : 0;

  const gapProgress = eligibility?.last_conversion_at
    ? (() => {
        const daysSince = (Date.now() - new Date(eligibility.last_conversion_at).getTime()) / 86400000;
        return Math.min((daysSince / (365 * 3)) * 100, 100);
      })()
    : 100;

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Link to="/wallet">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Maturation Bridge</h1>
          <p className="text-sm text-enb-text-secondary">ENB.LOCAL → ENB.GLOBAL · One-way · Lifetime limit</p>
        </div>
        <Button
          variant="ghost" size="icon" className="ml-auto"
          onClick={fetchEligibility} disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      {/* How it works banner */}
      <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 text-xs text-enb-text-secondary space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-enb-green mb-1">
          <Info className="w-3.5 h-3.5" /> How the Bridge Works
        </div>
        <p>Your <strong>Eligible Conversion Pool (ECP)</strong> is the total of ENB.LOCAL tokens you earned more than 365 days ago, minus any you have spent or already converted.</p>
        <p>You may convert up to <strong>25% of your ECP</strong> per event, across a maximum of <strong>2 lifetime events</strong> with a minimum <strong>3-year gap</strong> between them.</p>
        <p>Conversions above 500,000 ENB require a community governance vote.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
        </div>
      ) : error && !eligibility ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      ) : eligibility ? (
        <>
          {/* ECP Summary Card */}
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-enb-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-enb-green" />
                Your Eligible Conversion Pool
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-enb-green/5 rounded-xl p-3 border border-enb-green/10">
                  <div className="text-xs text-enb-text-secondary mb-0.5">ECP (aged 365+ days)</div>
                  <div className="text-xl font-bold text-enb-green">
                    {eligibility.ecp.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-enb-text-secondary">ENB.LOCAL</div>
                </div>
                <div className="bg-enb-gold/5 rounded-xl p-3 border border-enb-gold/10">
                  <div className="text-xs text-enb-text-secondary mb-0.5">Max convertible (25%)</div>
                  <div className="text-xl font-bold text-enb-gold">
                    {eligibility.max_convertible.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-enb-text-secondary">ENB.GLOBAL</div>
                </div>
              </div>

              {/* ECP breakdown */}
              <div className="text-xs text-enb-text-secondary space-y-0.5 border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span>Aged credits (365+ days old)</span>
                  <span className="font-medium text-enb-green">+{eligibility.aged_credits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spent via SWAP (FIFO deducted)</span>
                  <span className="font-medium text-red-500">−{eligibility.aged_debits.toLocaleString()}</span>
                </div>
                {eligibility.prior_converted > 0 && (
                  <div className="flex justify-between">
                    <span>Prior bridge conversions</span>
                    <span className="font-medium text-orange-500">−{eligibility.prior_converted.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-enb-text-primary border-t border-gray-100 pt-1 mt-1">
                  <span>Net ECP</span>
                  <span>{eligibility.ecp.toLocaleString()}</span>
                </div>
              </div>

              {/* Events remaining */}
              <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-enb-text-secondary">Lifetime events remaining</span>
                <span className="font-bold text-enb-text-primary">
                  {eligibility.events_remaining} of 2
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-enb-text-primary">Eligibility Conditions</h3>
              <ConditionRow
                icon={Clock}
                label="365-Day Token Hold"
                detail={`${eligibility.ecp.toLocaleString()} ENB aged · ${eligibility.aged_credits.toLocaleString()} total credited`}
                met={eligibility.ecp > 0}
                progress={ecpProgress}
              />
              <ConditionRow
                icon={ShieldCheck}
                label="Pillar Tier Required"
                detail={`${eligibility.rep_score.toLocaleString()} / 50,000 Rep`}
                met={eligibility.tier_ok}
                progress={repProgress}
              />
              <ConditionRow
                icon={RefreshCw}
                label="3-Year Gap Between Events"
                detail={
                  eligibility.last_conversion_at
                    ? `Last event: ${new Date(eligibility.last_conversion_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'No prior conversion — condition met'
                }
                met={eligibility.gap_ok}
                progress={gapProgress}
              />
              <ConditionRow
                icon={TrendingUp}
                label="Lifetime Events < 2"
                detail={`Event ${eligibility.next_event_number} of 2`}
                met={eligibility.events_remaining > 0}
                progress={eligibility.events_remaining > 0 ? 100 : 0}
              />
            </CardContent>
          </Card>

          {/* Governance notice */}
          {eligibility.eligible && eligibility.governance_required && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <span>
                Your convertible amount exceeds 500,000 ENB. A <strong>Type 2 Ecosystem Governance vote</strong> is required before this conversion can be approved.
              </span>
            </div>
          )}

          {/* Conversion form */}
          {eligibility.eligible ? (
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-enb-text-primary">Initiate Conversion</h3>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <div className="text-xs text-enb-text-secondary font-medium uppercase tracking-wider">
                      Maximum Convertible
                    </div>
                    <div className="text-2xl font-bold text-enb-green">
                      {eligibility.max_convertible.toLocaleString()} ENB
                    </div>
                    <div className="text-xs text-enb-text-secondary mt-0.5">
                      25% of {eligibility.ecp.toLocaleString()} ECP
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setAmount(String(eligibility.max_convertible))}
                    className="text-enb-green hover:bg-enb-green/10"
                  >
                    Max
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-enb-text-primary">
                    Amount to Convert (ENB.LOCAL)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      min={1}
                      max={eligibility.max_convertible}
                      className="w-full p-4 pr-20 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-enb-gold/50 focus:border-enb-gold outline-none text-lg font-mono"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      ENB
                    </div>
                  </div>
                </div>

                {!user.wallet_address && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    You must connect a Phantom wallet address in Settings before initiating a bridge conversion.
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 space-y-1">
                  <p>• This conversion is <strong>permanent and irreversible</strong></p>
                  <p>• ENB.GLOBAL will be credited to your balance (redeemable on Solana mainnet at TGE)</p>
                  <p>• No burn fee applies — 100% of converted amount becomes ENB.GLOBAL</p>
                  {eligibility.events_remaining === 1 && (
                    <p className="text-orange-600 font-medium">• This will be your <strong>final lifetime conversion</strong> (Event 2 of 2)</p>
                  )}
                </div>

                <Button
                  onClick={handleBridge}
                  disabled={!amount || parseInt(amount) <= 0 || submitting || !user.wallet_address}
                  className="w-full h-12 text-base bg-enb-gold hover:bg-enb-gold/90 text-white shadow-lg shadow-enb-gold/20"
                >
                  {submitting
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</>
                    : eligibility.governance_required
                      ? 'Submit for Governance Vote'
                      : 'Submit Bridge Request'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 space-y-2">
              <p className="font-bold">Not yet eligible</p>
              <ul className="space-y-1 text-xs">
                {!eligibility.tier_ok && <li>• Reach Pillar Tier (50,000 Rep Score) — currently {eligibility.rep_score.toLocaleString()}</li>}
                {eligibility.ecp === 0 && <li>• No tokens have individually aged 365+ days yet. Keep earning and hold without spending.</li>}
                {!eligibility.gap_ok && <li>• 3 years must pass since your last conversion event</li>}
                {eligibility.events_remaining === 0 && <li>• You have used both lifetime conversion events</li>}
              </ul>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
