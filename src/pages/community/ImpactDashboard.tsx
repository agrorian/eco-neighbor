import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, Users, Store, CheckCircle, Share2, Coins, Apple, Flame, BarChart2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  totalActions: number;
  totalEnbDistributed: number;
  totalPartners: number;
  totalFoodDonations: number;
  totalKgDiverted: number;
  pendingActions: number;
}

interface MonthlyData {
  month: string;
  actions: number;
  enb: number;
}

// Canonical v4.9 Tokenomics — 10,000,000,000 total supply
const TOKEN_ALLOCATION = [
  { label: 'Community Rewards Pool',   amount: '5,000,000,000', pct: 50, color: 'bg-enb-green',  note: 'Earned via verified civic actions only' },
  { label: 'Business Partner Reserve', amount: '1,500,000,000', pct: 15, color: 'bg-enb-teal',   note: '50 Founding Partners + ongoing onboarding' },
  { label: 'ENB.GLOBAL Liquidity Pool',amount: '1,000,000,000', pct: 10, color: 'bg-blue-500',   note: 'Raydium DEX · locked 12 months via Streamflow' },
  { label: 'Impact Grants & Marketing',amount: '1,000,000,000', pct: 10, color: 'bg-enb-gold',   note: 'Gitcoin, Celo, municipal grants, events' },
  { label: 'Founding Contributors',    amount: '500,000,000',   pct: 5,  color: 'bg-purple-500', note: '12-month cliff · 36-month vest' },
  { label: 'Development Fund',         amount: '500,000,000',   pct: 5,  color: 'bg-orange-400', note: 'Platform infrastructure · 12-month cliff' },
  { label: 'Emergency Reserve',        amount: '500,000,000',   pct: 5,  color: 'bg-red-400',    note: '5-of-7 multi-sig governance controlled' },
];

// CFSP v4.9 Priority Waterfall
const CFSP_TIERS = [
  { tier: 1, name: 'Direct Human Consumption', desc: 'Workers, elderly, schools & orphanages', color: 'bg-enb-green', textColor: 'text-enb-green', note: 'Paediatric safety standard applies' },
  { tier: 2, name: 'Community Kitchen',         desc: 'Hot meals at Community Food Hubs',       color: 'bg-enb-teal',  textColor: 'text-enb-teal',  note: '' },
  { tier: 3, name: 'Processed / Value-Added',   desc: 'Pickling, preservation, cooking classes',color: 'bg-blue-400',  textColor: 'text-blue-600',  note: '' },
  { tier: 4, name: 'Animal Feed',               desc: 'Livestock owners & animal shelters',     color: 'bg-enb-gold',  textColor: 'text-yellow-700',note: '' },
  { tier: 5, name: 'Composting / Biogas',       desc: 'Unusable produce composted or biogas',   color: 'bg-gray-400',  textColor: 'text-gray-600',  note: '' },
];

export default function ImpactDashboard() {
  const { l } = useT();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalActions: 0, totalEnbDistributed: 0,
    totalPartners: 0, totalFoodDonations: 0, totalKgDiverted: 0, pendingActions: 0,
  });
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      // Step 1: Core counts
      const [usersRes, approvedRes, pendingRes, partnersRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('business_partners').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      // Step 2: ENB distributed from users lifetime_earned
      const { data: enbData } = await supabase.from('users').select('lifetime_earned');
      const totalEnb = (enbData || []).reduce((sum: number, u: any) => sum + (Number(u.lifetime_earned) || 0), 0);

      // Step 3: Food donations
      const { data: foodData, count: foodCount } = await supabase
        .from('food_donations')
        .select('quantity_kg', { count: 'exact' })
        .eq('status', 'completed');
      const totalKg = (foodData || []).reduce((sum: number, f: any) => sum + (Number(f.quantity_kg) || 0), 0);

      setStats({
        totalUsers: usersRes.count || 0,
        totalActions: approvedRes.count || 0,
        pendingActions: pendingRes.count || 0,
        totalEnbDistributed: totalEnb,
        totalPartners: partnersRes.count || 0,
        totalFoodDonations: foodCount || 0,
        totalKgDiverted: totalKg,
      });

      // Step 4: Monthly chart — 6 months
      const months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const label = d.toLocaleString('default', { month: 'short' });

        const { count: aCount } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('reviewed_at', monthStart)
          .lte('reviewed_at', monthEnd);

        const { data: tData } = await supabase
          .from('transactions')
          .select('enb_amount')
          .eq('type', 'earn')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);

        const monthEnb = (tData || []).reduce((sum, t) => sum + (t.enb_amount || 0), 0);
        months.push({ month: label, actions: aCount || 0, enb: monthEnb });
      }
      setChartData(months);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const handleShare = () => {
    const text = `Our Rawalpindi community has verified ${stats.totalActions} civic actions and distributed ${stats.totalEnbDistributed.toLocaleString()} ENB to informal workers. Join Eco-Neighbor ($ENB) — your neighborhood work has value! 🌿`;
    if (navigator.share) {
      navigator.share({ title: 'Eco-Neighbor Community Impact', text, url: 'https://eco-neighbor.vercel.app' });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
    }
  };

  const statCards = [
    { icon: Users,        value: stats.totalUsers.toLocaleString(),                           label: l('impact', 'activeMembers'),    color: 'bg-enb-green/10 text-enb-green' },
    { icon: CheckCircle,  value: stats.totalActions.toLocaleString(),                         label: l('impact', 'verifiedActions'),     color: 'bg-enb-teal/10 text-enb-teal' },
    { icon: Coins,        value: stats.totalEnbDistributed > 0 ? `${(stats.totalEnbDistributed / 1000).toFixed(1)}k` : '0', label: l('impact', 'enbDistributed'), color: 'bg-enb-gold/10 text-enb-gold' },
    { icon: Store,        value: stats.totalPartners.toLocaleString(),                        label: l('impact', 'partners'),   color: 'bg-purple-100 text-purple-600' },
    { icon: Apple,        value: stats.totalFoodDonations.toLocaleString(),                   label: l('impact', 'foodDonations'),       color: 'bg-orange-100 text-orange-600' },
    { icon: Leaf,         value: stats.totalKgDiverted > 0 ? `${stats.totalKgDiverted.toFixed(1)} kg` : '0 kg', label: l('impact', 'foodFromLandfill'), color: 'bg-enb-green/10 text-enb-green' },
  ];

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">{l('impact', 'title')}</h1>
          <p className="text-sm text-enb-text-secondary mt-1">{l('impact', 'subtitle')} · Rawalpindi Pilot</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-1" /> Share
        </Button>
      </header>

      {/* Live stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-bold text-enb-text-primary">{s.value}</div>
                    <div className="text-xs text-enb-text-secondary leading-tight">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Monthly Activity Chart */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-enb-green" /> {l('impact', 'monthlyActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="actions" fill="#1A6B3C" name={l('impact', 'verifiedActions')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-gray-400 text-center mt-2">Verified civic actions per month — Chaklala Scheme 3 pilot</p>
        </CardContent>
      </Card>

      {/* CFSP Waterfall v4.9 */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <Apple className="w-4 h-4 text-orange-500" /> Community Food Sharing Programme
          </CardTitle>
          <p className="text-xs text-enb-text-secondary">v4.9 Priority Waterfall — food is never wasted</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {CFSP_TIERS.map((t) => (
            <div key={t.tier} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${t.color} text-white text-xs font-bold`}>
                {t.tier}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${t.textColor}`}>{t.name}</div>
                <div className="text-xs text-enb-text-secondary">{t.desc}</div>
                {t.note && (
                  <div className="text-xs text-orange-600 font-medium mt-0.5">⚠ {t.note}</div>
                )}
              </div>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Every kg diverted generates an on-chain carbon offset record (Verra VCS in development)
          </div>
        </CardContent>
      </Card>

      {/* Token Distribution v4.9 */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-enb-green" /> {l('impact', 'tokenDist')}
          </CardTitle>
          <p className="text-xs text-enb-text-secondary">10,000,000,000 ENB fixed supply · v4.9</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {TOKEN_ALLOCATION.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-sm text-enb-text-primary font-medium">{item.label}</span>
                  <div className="text-xs text-gray-400">{item.note}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-xs text-enb-text-secondary font-mono">{item.amount}</div>
                  <div className="text-xs font-bold text-gray-500">{item.pct}%</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            Mint authority renounced at genesis. Freeze authority renounced forever. Community Rewards Pool releases only via verified civic actions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
