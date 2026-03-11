import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Leaf, Clock, CheckCircle, XCircle, Store, Loader2, RefreshCw, MessageCircle, Coins } from 'lucide-react';
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes, txRes, recentSubsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('transactions').select('enb_amount').eq('type', 'credit'),
        supabase.from('submissions')
          .select('id, user_id, action_type, status, reviewed_at, submitted_at')
          .in('status', ['approved', 'rejected'])
          .order('submitted_at', { ascending: false })
          .limit(5),
      ]);

      const totalENB = txRes.data?.reduce((sum, t) => sum + (Number(t.enb_amount) || 0), 0) ?? 0;

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
    { icon: Coins, label: 'Total ENB Supply', value: '10,000,000,000', color: 'text-enb-green', bg: 'bg-enb-green/10' },
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
