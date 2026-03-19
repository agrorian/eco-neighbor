import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, Users, Store, CheckCircle, Share2, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  totalActions: number;
  totalEnbDistributed: number;
  totalPartners: number;
}

interface MonthlyData {
  month: string;
  actions: number;
  enb: number;
}

// v4.7 Token Distribution — 10,000,000,000 total supply
const TOKEN_ALLOCATION = [
  { label: 'Community Rewards Pool', amount: '5,000,000,000', pct: 50, color: 'bg-enb-green' },
  { label: 'Business Partner Reserve', amount: '1,500,000,000', pct: 15, color: 'bg-enb-teal' },
  { label: 'ENB.GLOBAL Liquidity Pool', amount: '1,000,000,000', pct: 10, color: 'bg-blue-500' },
  { label: 'Impact Grants & Marketing', amount: '1,000,000,000', pct: 10, color: 'bg-enb-gold' },
  { label: 'Founding Contributors', amount: '500,000,000', pct: 5, color: 'bg-purple-500' },
  { label: 'Development Fund', amount: '500,000,000', pct: 5, color: 'bg-orange-400' },
  { label: 'Emergency Reserve', amount: '500,000,000', pct: 5, color: 'bg-red-400' },
];

export default function ImpactDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalActions: 0, totalEnbDistributed: 0, totalPartners: 0 });
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [usersRes, actionsRes, txRes, partnersRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('users').select('lifetime_earned'),
        supabase.from('business_partners').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const totalEnb = (txRes.data || []).reduce((sum: number, u: any) => sum + (Number(u.lifetime_earned) || 0), 0);
      setStats({
        totalUsers: usersRes.count || 0,
        totalActions: actionsRes.count || 0,
        totalEnbDistributed: totalEnb,
        totalPartners: partnersRes.count || 0,
      });

      const months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
        const label = d.toLocaleString('default', { month: 'short' });
        const [aRes, tRes] = await Promise.all([
          supabase.from('submissions').select('id', { count: 'exact', head: true })
            .eq('status', 'approved').gte('reviewed_at', monthStart).lte('reviewed_at', monthEnd),
          supabase.from('transactions').select('enb_amount')
            .eq('type', 'earn').gte('created_at', monthStart).lte('created_at', monthEnd),
        ]);
        const monthEnb = (tRes.data || []).reduce((sum, t) => sum + (t.enb_amount || 0), 0);
        months.push({ month: label, actions: aRes.count || 0, enb: monthEnb });
      }
      setChartData(months);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const handleShare = () => {
    const text = `Our community has distributed ${stats.totalEnbDistributed.toLocaleString()} ENB across ${stats.totalActions} verified eco-actions! Join us on Eco-Neighbor.`;
    if (navigator.share) {
      navigator.share({ title: 'Eco-Neighbor Community Impact', text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Impact stats copied to clipboard!'));
    }
  };

  const statCards = [
    { icon: Users, value: stats.totalUsers.toLocaleString(), label: 'Active Members', color: 'bg-enb-green/10 text-enb-green' },
    { icon: CheckCircle, value: stats.totalActions.toLocaleString(), label: 'Verified Actions', color: 'bg-enb-teal/10 text-enb-teal' },
    { icon: Leaf, value: `${(stats.totalEnbDistributed / 1000).toFixed(1)}k`, label: 'ENB Distributed', color: 'bg-enb-gold/10 text-enb-gold' },
    { icon: Store, value: stats.totalPartners.toLocaleString(), label: 'Business Partners', color: 'bg-purple-100 text-purple-600' },
    { icon: Coins, value: '10B', label: 'Total ENB Supply', color: 'bg-enb-green/10 text-enb-green' },
  ];

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Community Impact</h1>
          <p className="text-sm text-enb-text-secondary mt-1">Real change, verified on-chain</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-1" /> Share
        </Button>
      </header>

      {/* Live stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
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

      {/* Token Distribution — v4.7 */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-enb-text-primary">Token Distribution</CardTitle>
          <p className="text-xs text-enb-text-secondary">10,000,000,000 ENB total supply · v4.7</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {TOKEN_ALLOCATION.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-enb-text-primary font-medium">{item.label}</span>
                <span className="text-xs text-enb-text-secondary font-mono">{item.amount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{item.pct}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly Activity Chart */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-enb-text-primary">Monthly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="actions" fill="#1A6B3C" name="Actions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
