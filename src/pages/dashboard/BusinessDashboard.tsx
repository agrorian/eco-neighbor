import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  QrCode, TrendingDown, History, Tag, Loader2,
  AlertCircle, CheckCircle, Globe, Lock, Info,
  ChevronRight, Zap, BarChart3, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface BusinessStats {
  today_redemptions: number;
  today_enb: number;
  total_redemptions: number;
  total_enb: number;
  float_balance: number;
  active_offers: number;
}

interface BusinessPartner {
  business_name: string;
  category: string;
  enb_float: number;
  enb_global_bal: number;
  total_swaps_accepted: number;
  total_enb_local_received: number;
  is_verified: boolean;
}

// ── ENB.GLOBAL unlock info panel ─────────────────────────────────────────────
function GlobalUnlockPanel({ globalBal, onClose }: { globalBal: number; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-2xl p-4 relative mt-3"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-700"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-amber-800 font-semibold text-sm mb-3 flex items-center gap-2">
        <Lock className="w-4 h-4" /> Why is my ENB.GLOBAL locked?
      </p>
      <p className="text-amber-700 text-xs mb-3">
        Your <strong>{globalBal.toLocaleString()} ENB.GLOBAL</strong> is earned and recorded.
        Unlock requires all four conditions simultaneously:
      </p>
      <div className="space-y-2">
        {[
          { icon: '⏳', label: '365 days', detail: 'Hold from earning date' },
          { icon: '🛡️', label: 'Pillar Tier', detail: '7,500 REP score required' },
          { icon: '📦', label: 'Max 50,000 ENB', detail: 'Per release event' },
          { icon: '📅', label: 'Max 2 releases/year', detail: 'Calendar year cap' },
        ].map(c => (
          <div key={c.label} className="flex items-start gap-2.5 text-xs text-amber-800">
            <span className="text-base leading-none">{c.icon}</span>
            <div>
              <span className="font-semibold">{c.label}</span>
              <span className="text-amber-600"> — {c.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-amber-600 text-xs mt-3 pt-3 border-t border-amber-200">
        ENB.GLOBAL goes live on Solana Mainnet at TGE. Every token you earn now is
        recorded and will be honoured in full. First movers accumulate the most.
      </p>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function BusinessDashboard() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [partner, setPartner] = useState<BusinessPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGlobalInfo, setShowGlobalInfo] = useState(false);
  const [initialFloat, setInitialFloat] = useState(10000);

  useEffect(() => {
    fetchDashboard();
    if (!user) return;

    // Real-time updates when business_partners row changes
    const channel = supabase
      .channel(`biz-dashboard-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'business_partners',
        filter: `owner_user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new) setPartner(prev => prev ? { ...prev, ...payload.new } : null);
      })
      .subscribe();

    return () => { getDb().removeChannel(channel); };
  }, [user?.id]);

  const fetchDashboard = async () => {
    if (!user) return;
    setLoading(true);

    const { data: biz } = await supabase
      .from('business_partners')
      .select('business_name, category, enb_float, enb_global_bal, total_swaps_accepted, total_enb_local_received, is_verified')
      .eq('owner_user_id', user.id)
      .single();

    if (biz) {
      setPartner(biz);
      setInitialFloat(biz.enb_float || 10000);
    }

    const { data } = await getDb().rpc('get_business_stats', { p_user_id: user.id });
    if (data?.success) setStats(data);

    setLoading(false);
  };

  const floatBalance = stats?.float_balance ?? partner?.enb_float ?? 0;
  const floatPct = Math.min(100, Math.round((floatBalance / Math.max(initialFloat, floatBalance, 1000)) * 100));
  const floatColor = floatPct <= 30 ? 'bg-red-500' : floatPct <= 50 ? 'bg-orange-400' : 'bg-enb-green';
  const globalBal = partner?.enb_global_bal ?? 0;
  const totalReceived = partner?.total_enb_local_received ?? 0;
  const estimatedCrp = Math.round(totalReceived * 0.80);
  const estimatedTreasury = Math.round(totalReceived * 0.067);
  const estimatedOpsFund = Math.round(totalReceived * 0.10);

  return (
    <div className="space-y-4 pb-24">

      {/* ── Header ── */}
      <div className="bg-enb-green rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Partner Dashboard</p>
            <h1 className="text-xl font-bold mt-1">{partner?.business_name || 'My Business'}</h1>
          </div>
          {partner?.is_verified && (
            <div className="bg-white/15 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Verified Partner
            </div>
          )}
        </div>

        {/* Float bar */}
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-xs font-medium">ENB Float Balance</span>
            <span className="text-white font-bold text-sm">
              {loading ? '—' : floatBalance.toLocaleString()} ENB
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${floatColor}`}
              style={{ width: `${floatPct}%` }}
            />
          </div>
          {!loading && floatPct <= 40 && (
            <p className="text-yellow-300 text-xs mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {floatPct <= 30 ? 'Critical — auto top-up initiated' : 'Float running low'}
            </p>
          )}
        </div>
      </div>

      {/* ── ENB.GLOBAL earnings card ── */}
      <Card className="border-l-4 border-l-amber-400 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-enb-text-primary uppercase tracking-wider">
                ENB.GLOBAL Earned
              </span>
            </div>
            <button
              onClick={() => setShowGlobalInfo(v => !v)}
              className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 transition-colors"
            >
              <Lock className="w-2.5 h-2.5" />
              LOCKED
              <Info className="w-2.5 h-2.5 opacity-70" />
            </button>
          </div>

          <div className="flex items-end gap-2 mt-2 mb-1">
            <span className="text-4xl font-bold text-amber-500">
              {loading ? '—' : globalBal.toLocaleString()}
            </span>
            {globalBal > 0 && (
              <span className="text-xs text-amber-500 font-medium mb-1.5">pending · pre-TGE</span>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-2">
            From {partner?.total_swaps_accepted ?? 0} SWAP{(partner?.total_swaps_accepted ?? 0) !== 1 ? 's' : ''} accepted
            {totalReceived > 0 && ` · ${totalReceived.toLocaleString()} ENB.LOCAL processed`}
          </p>

          {showGlobalInfo && (
            <GlobalUnlockPanel
              globalBal={globalBal}
              onClose={() => setShowGlobalInfo(false)}
            />
          )}

          {!showGlobalInfo && globalBal === 0 && (
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 mt-1">
              <Zap className="w-3.5 h-3.5 inline mr-1" />
              Accept SWAPs from members to start earning ENB.GLOBAL.
              Each SWAP gives you <strong>3.3%</strong> as ENB.GLOBAL. 80% returns to CRP, 6.7% to treasury pools, 10% to ENB Operations Fund.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Scan QR primary action ── */}
      <Link to="/scan">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-enb-teal text-white rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-enb-teal/20"
        >
          <div>
            <h2 className="text-lg font-bold">Scan Customer QR</h2>
            <p className="text-white/80 text-sm mt-0.5">Confirm ENB redemption instantly</p>
          </div>
          <div className="bg-white/20 p-3 rounded-xl">
            <QrCode className="w-8 h-8" />
          </div>
        </motion.div>
      </Link>

      {/* ── Stats grid ── */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-enb-text-primary">{stats?.today_redemptions ?? 0}</div>
              <div className="text-xs text-enb-text-secondary uppercase tracking-wider mt-1">Today's Redemptions</div>
            </CardContent>
          </Card>
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-enb-green">{(stats?.today_enb ?? 0).toLocaleString()}</div>
              <div className="text-xs text-enb-text-secondary uppercase tracking-wider mt-1">ENB Today</div>
            </CardContent>
          </Card>
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-enb-text-primary">{stats?.total_redemptions ?? 0}</div>
              <div className="text-xs text-enb-text-secondary uppercase tracking-wider mt-1">All Time</div>
            </CardContent>
          </Card>
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-enb-teal">{stats?.active_offers ?? 0}</div>
              <div className="text-xs text-enb-text-secondary uppercase tracking-wider mt-1">Active Offers</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── SWAP split breakdown — only shown when there's data ── */}
      {totalReceived > 0 && (
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-enb-green" />
              <span className="text-sm font-semibold text-enb-text-primary">Lifetime SWAP Split</span>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: 'You earned (ENB.GLOBAL)',
                  value: globalBal,
                  color: 'bg-amber-400',
                  pct: Math.round((globalBal / totalReceived) * 100),
                  textColor: 'text-amber-600',
                },
                {
                  label: 'Returned to CRP',
                  value: estimatedCrp,
                  color: 'bg-enb-green',
                  pct: 80,
                  textColor: 'text-enb-green',
                },
                {
                  label: 'Community Treasury',
                  value: estimatedTreasury,
                  color: 'bg-enb-teal',
                  pct: 7,
                  textColor: 'text-enb-teal',
                },
                {
                  label: 'ENB Operations Fund',
                  value: estimatedOpsFund,
                  color: 'bg-amber-400',
                  pct: 10,
                  textColor: 'text-amber-600',
                },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs font-bold ${row.textColor}`}>
                      {row.value.toLocaleString()} ENB
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color}`}
                      style={{ width: `${Math.max(row.pct, 1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
              Based on {totalReceived.toLocaleString()} ENB.LOCAL total processed
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Quick links ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/business/offers', icon: Tag, label: 'My Offers', color: 'bg-amber-50 text-amber-700' },
          { to: '/business/history', icon: History, label: 'History', color: 'bg-blue-50 text-blue-700' },
          { to: '/partner-float', icon: TrendingDown, label: 'Float', color: 'bg-enb-green/5 text-enb-green' },
        ].map(item => (
          <Link key={item.to} to={item.to}>
            <div className={`rounded-2xl p-4 flex flex-col items-center gap-2 ${item.color} border border-current/10`}>
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-semibold">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── TGE explainer footer ── */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">About ENB.GLOBAL: </span>
          Your locked balance grows with every SWAP you accept. When Eco-Neighbor
          launches on Solana Mainnet (TGE), all recorded ENB.GLOBAL will be
          transferred to your wallet automatically. Early partners accumulate the most.
        </p>
        <Link
          to="/business/history"
          className="text-xs text-enb-green font-semibold flex items-center gap-1 mt-2"
        >
          View full redemption history <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
