import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Leaf, Clock, CheckCircle, XCircle, Store, Loader2, RefreshCw, MessageCircle, Coins, TrendingUp, Shield, Landmark, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  totalEnbDistributed: number;
  pendingQueue: number;
  totalApproved: number;
}

interface PoolStats {
  totalConfirmedSwaps: number;
  totalEnbSwapped: number;
  totalCrpCredited: number;
  totalBusinessGlobal: number;
  totalTreasury: number;
  totalOpsFund: number;
  opsFundLastSwapAt: string | null;
}

interface RecentActivity {
  id: string;
  action: string;
  detail: string;
  time: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminDashboard() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalEnbDistributed: 0, pendingQueue: 0, totalApproved: 0 });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalConfirmedSwaps: 0, totalEnbSwapped: 0, totalCrpCredited: 0,
    totalBusinessGlobal: 0, totalTreasury: 0, totalOpsFund: 0, opsFundLastSwapAt: null,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Admin sees ALL pending submissions — including those assigned to mods
      const pendingQuery = supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const [usersRes, pendingRes, txRes, recentSubsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        pendingQuery,
        supabase.from('users').select('lifetime_earned'),
        supabase.from('submissions')
          .select('id, user_id, action_type, status, reviewed_at, submitted_at')
          .in('status', ['approved', 'rejected'])
          .order('submitted_at', { ascending: false })
          .limit(5),
      ]);

      const totalENB = txRes.data?.reduce((sum: number, u: any) => sum + (Number(u.lifetime_earned) || 0), 0) ?? 0;

      setStats({
        totalUsers: usersRes.count ?? 0,
        totalEnbDistributed: totalENB,
        pendingQueue: pendingRes.count ?? 0,
        totalApproved: 0,
      });

      // Fetch user names separately to avoid join issues
      const userIds = [...new Set((recentSubsRes.data || []).map((s: any) => s.user_id))];
      const { data: usersData } = userIds.length > 0
        ? await supabase.from('users').select('id, full_name').in('id', userIds)
        : { data: [] };
      const userMap = new Map((usersData || []).map((u: any) => [u.id, u.full_name]));

      // Build activity feed
      const acts: RecentActivity[] = (recentSubsRes.data || []).map((s: any) => {
        const name = userMap.get(s.user_id) || 'A member';
        const action = s.action_type?.replace(/_/g, ' ') || 'action';
        const when = s.reviewed_at || s.submitted_at;
        const timeAgo = when ? getTimeAgo(new Date(when)) : '';
        return {
          id: s.id,
          action: s.status === 'approved' ? 'Submission Approved' : 'Submission Rejected',
          detail: `${action} by ${name}`,
          time: timeAgo,
          type: s.status === 'approved' ? 'success' : 'error',
        };
      });

      setActivity(acts);

      // Pool stats fetch
      try {
        const [swapAgg, opsLedger] = await Promise.all([
          supabase.from('redemptions')
            .select('enb_spent, crp_credit, business_global_credit, treasury_credit, ops_fund_credit')
            .eq('status', 'confirmed'),
          supabase.from('ops_fund_ledger')
            .select('enb_amount, ops_fund_enb, created_at')
            .order('created_at', { ascending: false }),
        ]);
        const rows = swapAgg.data || [];
        const agg = rows.reduce((acc: any, r: any) => ({
          totalEnbSwapped:      acc.totalEnbSwapped      + (Number(r.enb_spent) || 0),
          totalCrpCredited:     acc.totalCrpCredited     + (Number(r.crp_credit) || 0),
          totalBusinessGlobal:  acc.totalBusinessGlobal  + (Number(r.business_global_credit) || 0),
          totalTreasury:        acc.totalTreasury        + (Number(r.treasury_credit) || 0),
          totalOpsFund:         acc.totalOpsFund         + (Number(r.ops_fund_credit) || 0),
        }), { totalEnbSwapped: 0, totalCrpCredited: 0, totalBusinessGlobal: 0, totalTreasury: 0, totalOpsFund: 0 });
        const opsRows = opsLedger.data || [];
        setPoolStats({ totalConfirmedSwaps: rows.length, ...agg, opsFundLastSwapAt: opsRows[0]?.created_at || null });
      } catch (poolErr) { console.error('Pool stats error:', poolErr); }

    } catch (err) {
      console.error('Admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (!user) return null;

  const KPI = [
    { icon: Users, label: 'Total Members', value: loading ? '—' : stats.totalUsers.toLocaleString(), color: 'text-enb-teal', bg: 'bg-enb-teal/10' },
    { icon: Leaf, label: 'ENB Distributed', value: loading ? '—' : stats.totalEnbDistributed.toLocaleString(), color: 'text-enb-green', bg: 'bg-enb-green/10' },
    { icon: Clock, label: 'Pending Review', value: loading ? '—' : stats.pendingQueue.toString(), color: 'text-enb-gold', bg: 'bg-enb-gold/10' },
    { icon: MessageCircle, label: 'WhatsApp Ready', value: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
    { icon: Coins, label: 'Total ENB Supply', value: '10B ENB', color: 'text-enb-green', bg: 'bg-enb-green/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-enb-text-secondary">Welcome back, {user.full_name || 'Admin'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
            Super Admin
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white border-gray-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center mb-2`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <div className="text-2xl font-bold text-enb-text-primary">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-300" /> : k.value}
                </div>
                <div className="text-xs text-enb-text-secondary uppercase tracking-wider mt-1">{k.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/queue">
          <Button className="w-full h-auto py-4 flex flex-col gap-2 bg-enb-green hover:bg-enb-green/90 text-white shadow-md shadow-enb-green/20">
            <CheckCircle className="w-6 h-6" />
            <span className="font-bold">Review Queue ({loading ? '…' : stats.pendingQueue})</span>
          </Button>
        </Link>
        <Link to="/admin/campaigns">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200">
            <Leaf className="w-6 h-6 text-enb-teal" />
            <span className="font-medium">Run Campaign</span>
          </Button>
        </Link>
        <Link to="/admin/partners">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200">
            <Store className="w-6 h-6 text-enb-gold" />
            <span className="font-medium">Add Partner</span>
          </Button>
        </Link>
      </div>

      {/* ── ECOSYSTEM TREASURY (super_admin only) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-enb-text-primary text-lg">Ecosystem Treasury</h3>
          <span className="text-xs text-enb-text-secondary bg-gray-100 px-2 py-1 rounded-full">
            {poolStats.totalConfirmedSwaps} SWAPs · {poolStats.totalEnbSwapped.toLocaleString()} ENB
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <div className="bg-white rounded-2xl border border-enb-green/20 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-enb-green/10 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-enb-green" />
              </div>
              <div>
                <p className="text-xs font-semibold text-enb-text-secondary uppercase tracking-wide">Community Rewards Pool</p>
                <p className="text-xs text-gray-400">80% of every SWAP</p>
              </div>
              <span className="ml-auto text-xs bg-enb-green/10 text-enb-green px-2 py-0.5 rounded-full font-medium">CRP</span>
            </div>
            <p className="text-2xl font-bold text-enb-green">{loading ? '—' : poolStats.totalCrpCredited.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">ENB.LOCAL credited back to ecosystem</p>
            <p className="text-xs text-enb-text-secondary mt-3 pt-3 border-t border-gray-50">Pre-mainnet: tracked via redemptions. Used exclusively for verified civic action rewards — never for any other purpose.</p>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-enb-text-secondary uppercase tracking-wide">ENB Operations Fund</p>
                <p className="text-xs text-gray-400">10% of every SWAP</p>
              </div>
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">OPS</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{loading ? '—' : poolStats.totalOpsFund.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">ENB accrued · Solana wallet pending Phase 2</p>
            {poolStats.opsFundLastSwapAt && (
              <p className="text-xs text-gray-400 mt-0.5">Last: {new Date(poolStats.opsFundLastSwapAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
            <p className="text-xs text-enb-text-secondary mt-3 pt-3 border-t border-gray-50">Routine ≤50K (VF alone) · Significant 50K–500K (VF+1) · Major &gt;500K (all seats + Type 2 vote)</p>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-enb-text-secondary uppercase tracking-wide">Community Treasury</p>
                <p className="text-xs text-gray-400">6.7% of every SWAP</p>
              </div>
              <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">TREASURY</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{loading ? '—' : poolStats.totalTreasury.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">ENB across 4 sub-pools</p>
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
              {[['BSF', 0.02], ['Market Making', 0.013], ['Insurance', 0.013], ['Reserve Buffer', 0.02]].map(([label, pct]) => (
                <div key={label as string} className="flex justify-between text-xs">
                  <span className="text-gray-400">{label} ({((pct as number)*100).toFixed(1)}%)</span>
                  <span className="font-medium text-enb-text-primary">{Math.round(poolStats.totalEnbSwapped * (pct as number)).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-enb-text-secondary uppercase tracking-wide">Business ENB.GLOBAL</p>
                <p className="text-xs text-gray-400">3.3% of every SWAP</p>
              </div>
              <span className="ml-auto text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">GLOBAL</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">{loading ? '—' : poolStats.totalBusinessGlobal.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">ENB.GLOBAL earned by all partner businesses</p>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1 text-xs text-gray-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>Locked pre-TGE · Released via Maturation Bridge at mainnet</span>
            </div>
          </div>

        </div>
        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
          <p className="text-xs text-enb-text-secondary font-medium">Pool Verification</p>
          {(() => {
            const total = poolStats.totalCrpCredited + poolStats.totalBusinessGlobal + poolStats.totalTreasury + poolStats.totalOpsFund;
            const match = total === poolStats.totalEnbSwapped;
            return (
              <span className={`text-xs font-semibold ${match ? 'text-enb-green' : 'text-red-500'}`}>
                {match ? '✅ All pools balance' : `⚠️ Gap: ${poolStats.totalEnbSwapped - total} ENB`}
                <span className="text-gray-400 font-normal ml-2">{poolStats.totalEnbSwapped.toLocaleString()} ENB total</span>
              </span>
            );
          })()}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        <h3 className="font-bold text-enb-text-primary text-lg">Recent Activity</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading activity...</span>
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No recent activity yet. Approve your first submission!</p>
          </div>
        ) : (
          activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'success' ? 'bg-enb-green' : item.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div>
                  <div className="font-medium text-enb-text-primary">{item.action}</div>
                  <div className="text-xs text-enb-text-secondary capitalize">{item.detail}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 ml-2">{item.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
