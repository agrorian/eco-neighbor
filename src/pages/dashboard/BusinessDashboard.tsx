import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { QrCode, TrendingDown, History, Store, Tag, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface BusinessStats {
  today_redemptions: number;
  today_enb: number;
  total_redemptions: number;
  total_enb: number;
  float_balance: number;
  active_offers: number;
}

export default function BusinessDashboard() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    // Step 1: Get business name
    const { data: partner } = await supabase
      .from('business_partners')
      .select('name, category')
      .eq('owner_user_id', user.id)
      .single();
    if (partner) setBusinessName(partner.name);

    // Step 2: Get stats
    const { data } = await supabase.rpc('get_business_stats', { p_user_id: user.id });
    if (data?.success) setStats(data);

    setLoading(false);
  };

  const floatPct = stats ? Math.min(100, Math.round((stats.float_balance / 150000) * 100)) : 0;
  const floatColor = floatPct <= 30 ? 'bg-red-500' : floatPct <= 40 ? 'bg-orange-400' : 'bg-enb-green';

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="bg-enb-green rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Partner Dashboard</p>
            <h1 className="text-xl font-bold mt-0.5">{businessName || 'My Business'}</h1>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Verified Partner
          </div>
        </div>

        {/* Float bar */}
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-xs font-medium">ENB Float Balance</span>
            <span className="text-white font-bold text-sm">
              {loading ? '—' : stats?.float_balance.toLocaleString()} ENB
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${floatColor}`} style={{ width: `${floatPct}%` }} />
          </div>
          {stats && floatPct <= 40 && (
            <p className="text-yellow-300 text-xs mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {floatPct <= 30 ? 'Critical — auto top-up initiated' : 'Float running low'}
            </p>
          )}
        </div>
      </div>

      {/* Primary action — Scan QR */}
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

      {/* Stats grid */}
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

      {/* Quick links */}
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
    </div>
  );
}
