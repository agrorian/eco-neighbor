import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, ArrowRightLeft, Activity, AlertCircle, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  pendingQueue: number;
  escalationCount: number;
  bridgeRequests: number;
  enbDistributedToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingQueue: 0,
    escalationCount: 0,
    bridgeRequests: 0,
    enbDistributedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      // Step 1: get all submission IDs that are currently escalated
      const { data: escalatedAssignments } = await supabase
        .from('moderator_assignments')
        .select('submission_id')
        .eq('escalation_flag', true);

      const escalatedIds = (escalatedAssignments || [])
        .map((a: any) => a.submission_id)
        .filter(Boolean);

      // Step 2: fetch all stats in parallel
      const [usersRes, bridgeRes, txRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('bridge_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('transactions')
          .select('enb_amount')
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);

      // Step 3: count pending submissions EXCLUDING escalated ones
      let pendingQuery = supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (escalatedIds.length > 0) {
        pendingQuery = pendingQuery.not('id', 'in', `(${escalatedIds.join(',')})`);
      }

      const pendingRes = await pendingQuery;

      const todayENB = (txRes.data || []).reduce(
        (sum: number, t: any) => sum + (t.enb_amount > 0 ? t.enb_amount : 0),
        0
      );

      setStats({
        totalUsers: usersRes.count ?? 0,
        pendingQueue: pendingRes.count ?? 0,
        escalationCount: escalatedIds.length,
        bridgeRequests: bridgeRes.count ?? 0,
        enbDistributedToday: todayENB,
      });

      setLoading(false);
    };

    fetchStats();
  }, []);

  const KPI_CARDS = [
    { icon: Users,           label: 'Total Members',        value: stats.totalUsers.toLocaleString(),         color: 'bg-blue-100 text-blue-600' },
    { icon: CheckSquare,     label: 'Pending Queue',         value: stats.pendingQueue.toString(),             color: 'bg-orange-100 text-orange-600' },
    { icon: AlertTriangle,   label: 'Escalations',           value: stats.escalationCount.toString(),          color: 'bg-red-100 text-red-600' },
    { icon: ArrowRightLeft,  label: 'Bridge Requests',       value: stats.bridgeRequests.toString(),           color: 'bg-enb-teal/10 text-enb-teal' },
    { icon: Activity,        label: 'ENB Distributed Today', value: stats.enbDistributedToday.toLocaleString(), color: 'bg-enb-green/10 text-enb-green' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-enb-text-secondary">System Overview</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
          <Activity className="w-4 h-4" />
          System Operational
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading stats...
        </div>
      ) : (
        <>
          {/* KPI Cards — now 5 cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {KPI_CARDS.map((kpi) => (
              <Card key={kpi.label} className="border-gray-100 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-enb-text-secondary font-medium">{kpi.label}</p>
                    <h3 className="text-2xl font-bold text-enb-text-primary mt-1">{kpi.value}</h3>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pending Submissions */}
            <Card className="border-orange-100 bg-orange-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Pending Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 mb-4">
                  There are <span className="font-bold">{stats.pendingQueue} items</span> waiting for review.
                </p>
                <Link to="/admin/queue">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-200">
                    Review Queue
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Escalations — only shown when there are active escalations */}
            {stats.escalationCount > 0 && (
              <Card className="border-red-200 bg-red-50/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Mod Disagreements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-4">
                    <span className="font-bold">{stats.escalationCount} submission{stats.escalationCount > 1 ? 's' : ''}</span> need{stats.escalationCount === 1 ? 's' : ''} your final decision.
                  </p>
                  <Link to="/admin/escalation">
                    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200">
                      Resolve Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* ENB Distribution */}
            <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  ENB Distribution Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{stats.enbDistributedToday.toLocaleString()}</div>
                <div className="text-xs text-blue-600 uppercase tracking-wider font-medium mt-1">ENB Distributed Today</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
