import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, QrCode, Users, Lock, Clock, ShieldCheck, Info, X } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { useT } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import TransactionHistory from './wallet/TransactionHistory';

// ─── Locked ENB.GLOBAL info panel ────────────────────────────────────────────
function GlobalLockInfo({
  pendingAmount,
  onClose,
}: {
  pendingAmount: number;
  onClose: () => void;
}) {
  return (
    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-amber-400 hover:text-amber-700"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
        <Lock className="w-3.5 h-3.5" /> Why is my ENB.GLOBAL locked?
      </div>
      <p>Your ENB.GLOBAL balance of <strong>{pendingAmount.toLocaleString()} ENB</strong> is earned but not yet liquid. Unlock requires all of the following:</p>
      <ul className="space-y-1 pl-1">
        <li className="flex items-start gap-1.5">
          <Clock className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
          <span><strong>365 days</strong> hold from the date each batch was earned</span>
        </li>
        <li className="flex items-start gap-1.5">
          <ShieldCheck className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
          <span><strong>Pillar Tier</strong> reputation required (7,500 REP)</span>
        </li>
        <li className="flex items-start gap-1.5">
          <ArrowUpRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>Max <strong>50,000 ENB</strong> per release event</span>
        </li>
        <li className="flex items-start gap-1.5">
          <RefreshCw className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>Max <strong>2 release events</strong> per calendar year</span>
        </li>
      </ul>
      <p className="text-amber-700 pt-1 border-t border-amber-200">
        ENB.GLOBAL goes live on Solana Mainnet at TGE. Your balance is being recorded now and will be honoured in full.
      </p>
    </div>
  );
}

// ─── Main Wallet ──────────────────────────────────────────────────────────────
export default function Wallet() {
  const { user, setUser } = useUserStore();
  const { l } = useT();
  const [showGlobalInfo, setShowGlobalInfo] = useState(false);

  useEffect(() => {
    if (!user) return;

    const refreshBalance = async () => {
      const { data } = await supabase
        .from('users')
        .select('enb_local_bal, enb_global_bal, rep_score, tier, lifetime_earned')
        .eq('id', user.id)
        .single();
      if (data) setUser({ ...user, ...data });
    };
    refreshBalance();

    const channel = supabase
      .channel(`wallet-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setUser({ ...user, ...payload.new });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (!user) return null;

  // ENB.GLOBAL is always locked until all conditions are met post-TGE.
  // For now (pre-TGE) the entire balance is pending/locked.
  const globalBal = user.enb_global_bal || 0;
  const isGlobalLocked = globalBal > 0; // always true pre-TGE; post-TGE gated by conditions

  return (
    <div className="space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-enb-text-primary">{l('wallet', 'title')}</h1>
        <p className="text-enb-text-secondary">{l('wallet', 'subtitle')}</p>
      </header>

      {/* Rep Score & Tier */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-enb-gold/10 flex items-center justify-center text-enb-gold font-bold">
            {user.tier?.charAt(0) || 'N'}
          </div>
          <div>
            <div className="font-bold text-enb-text-primary">
              {user.tier} {l('wallet', 'newcomerTier').split(' ').slice(-1)[0]}
            </div>
            <div className="text-xs text-enb-text-secondary">
              {l('wallet', 'repScore')}: {user.rep_score}
            </div>
          </div>
        </div>
        <Link to="/leaderboard">
          <Button variant="ghost" size="sm" className="text-enb-gold hover:text-enb-gold hover:bg-enb-gold/10">
            {l('wallet', 'viewProgress')}
          </Button>
        </Link>
      </div>

      {/* Token Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ENB.LOCAL Card — unchanged */}
        <Card className="border-l-4 border-l-enb-green shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-enb-text-secondary uppercase tracking-wider">
              ENB.LOCAL
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.cnic_verified ? (
              <>
                <div className="text-4xl font-bold text-enb-green mb-1">
                  {(user.enb_local_bal || 0).toLocaleString()}
                </div>
                <p className="text-xs text-enb-text-secondary mb-5">{l('wallet', 'nonTransfer')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/wallet/redeem">
                    <Button variant="outline" size="sm" className="w-full">
                      <QrCode className="w-4 h-4 mr-2 flex-shrink-0" />
                      {l('wallet', 'redeem')}
                    </Button>
                  </Link>
                  <Link to="/bridge">
                    <Button variant="outline" size="sm" className="w-full text-enb-gold border-enb-gold/20 hover:bg-enb-gold/5">
                      <RefreshCw className="w-4 h-4 mr-2 flex-shrink-0" />
                      {l('wallet', 'bridge')}
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-5 h-5 text-amber-500" />
                  <div className="text-4xl font-bold text-amber-500">
                    {(user.enb_local_bal || 0).toLocaleString()}
                  </div>
                </div>
                <p className="text-xs text-amber-600 font-medium mb-2">{l('wallet', 'lockedPending')}</p>
                <p className="text-xs text-enb-text-secondary mb-4">{l('wallet', 'lockedHint')}</p>
                <Link to="/">
                  <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    <Lock className="w-3 h-3 mr-2" /> {l('wallet', 'verifyToUnlock')}
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* ENB.GLOBAL Card — with locked badge */}
        <Card className="border-l-4 border-l-enb-gold shadow-md">
          <CardHeader className="pb-2">
            {/* Title row with LOCKED superscript badge */}
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-medium text-enb-text-secondary uppercase tracking-wider">
                ENB.GLOBAL
              </CardTitle>
              {isGlobalLocked && (
                <button
                  onClick={() => setShowGlobalInfo((v) => !v)}
                  className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-300 transition-colors ml-2 mt-0.5"
                  aria-label="Learn about ENB.GLOBAL lock conditions"
                >
                  <Lock className="w-2.5 h-2.5" />
                  LOCKED
                  <Info className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Balance — amber when locked, gold when free */}
            <div className="flex items-end gap-2 mb-1">
              <div className={`text-4xl font-bold ${isGlobalLocked ? 'text-amber-500' : 'text-enb-gold'}`}>
                {globalBal.toLocaleString()}
              </div>
              {isGlobalLocked && globalBal > 0 && (
                <span className="text-xs text-amber-500 font-medium mb-1.5 leading-none">
                  pending
                </span>
              )}
            </div>

            {/* Subtitle */}
            {isGlobalLocked ? (
              <p className="text-xs text-amber-600 font-medium mb-1">
                Earned · Conditions not yet met
              </p>
            ) : (
              <p className="text-xs text-enb-text-secondary mb-5">{l('wallet', 'tradeable')}</p>
            )}

            {/* Expandable info panel */}
            {showGlobalInfo && (
              <GlobalLockInfo
                pendingAmount={globalBal}
                onClose={() => setShowGlobalInfo(false)}
              />
            )}

            {/* Action buttons — disabled pre-TGE */}
            {!showGlobalInfo && (
              <div className={`grid grid-cols-2 gap-2 ${isGlobalLocked ? 'mt-4' : 'mt-5'}`}>
                <Button
                  className="w-full bg-enb-dark text-white hover:bg-enb-dark/90 shadow-sm text-sm disabled:opacity-40"
                  size="sm"
                  disabled={isGlobalLocked}
                  title={isGlobalLocked ? 'Available after TGE and lock conditions are met' : ''}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2 flex-shrink-0" />
                  {l('wallet', 'send')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-sm disabled:opacity-40"
                  disabled={isGlobalLocked}
                  title={isGlobalLocked ? 'Available after TGE and lock conditions are met' : ''}
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                  {l('wallet', 'receive')}
                </Button>
              </div>
            )}

            {/* Zero balance — pre-TGE explainer */}
            {globalBal === 0 && (
              <p className="text-xs text-enb-text-secondary mt-3">
                Accept SWAPs at your business to start earning ENB.GLOBAL.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral Banner */}
      <Link to="/wallet/referrals">
        <div className="bg-gradient-to-r from-enb-green/10 to-enb-teal/10 p-4 rounded-xl border border-enb-green/20 flex items-center justify-between cursor-pointer hover:bg-enb-green/20 transition-colors">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-enb-green flex-shrink-0" />
            <div>
              <div className="font-bold text-enb-text-primary">{l('wallet', 'inviteFriends')}</div>
              <div className="text-xs text-enb-text-secondary">{l('wallet', 'referralEarn')}</div>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-enb-green flex-shrink-0" />
        </div>
      </Link>

      <TransactionHistory />
    </div>
  );
}
