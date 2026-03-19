import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, ArrowRightLeft, Activity, AlertCircle, TrendingUp, Loader2, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  pendingQueue: number;
  escalationCount: number;
  bridgeRequests: number;
  enbDistributedToday: number;
  enbDistributedAllTime: number;
}

interface ModPairStat {
  mod1_id: string;
  mod2_id: string;
  mod1_name: string;
  mod2_name: string;
  total_reviews: number;
  agreements: number;
  agreement_pct: number;
  flagged: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingQueue: 0,
    escalationCount: 0,
    bridgeRequests: 0,
    enbDistributedToday: 0,
    enbDistributedAllTime: 0,
  });
  const [modPairs, setModPairs] = useState<ModPairStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      // Step 1: get ALL submission IDs assigned to mods (any stage)
      const { data: assignedAssignments } = await supabase
        .from('moderator_assignments')
        .select('submission_id, escalation_flag');

      const assignedIds = (assignedAssignments || [])
        .map((a: any) => a.submission_id)
        .filter(Boolean);

      const escalatedIds = (assignedAssignments || [])
        .filter((a: any) => a.escalation_flag === true)
        .map((a: any) => a.submission_id)
        .filter(Boolean);

      // Step 2: fetch all stats in parallel
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [usersRes, bridgeRes, allTimeRes, todayTxRes, modStatsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('bridge_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('users').select('lifetime_earned'),
        supabase.from('transactions')
          .select('enb_amount')
          .eq('type', 'earn')
          .gte('created_at', todayStart.toISOString()),
        supabase.rpc('get_mod_agreement_stats'),
      ]);

      // Count pending submissions with NO mod assignment yet
      let pendingQuery = supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (assignedIds.length > 0) {
        pendingQuery = pendingQuery.not('id', 'in', `(${assignedIds.join(',')})`);
      }

      const pendingRes = await pendingQuery;

      const allTimeENB = (allTimeRes.data || []).reduce(
        (sum: number, u: any) => sum + (Number(u.lifetime_earned) || 0),
        0
      );

      const todayENB = (todayTxRes.data || []).reduce(
        (sum: number, t: any) => sum + (Number(t.enb_amount) || 0),
        0
      );

      setStats({
        totalUsers: usersRes.count ?? 0,
        pendingQueue: pendingRes.count ?? 0,
        escalationCount: escalatedIds.length,
        bridgeRequests: bridgeRes.count ?? 0,
        enbDistributedToday: todayENB,
        enbDistributedAllTime: allTimeENB,
      });

      // Parse mod agreement stats
      const pairs: ModPairStat[] = Array.isArray(modStatsRes.data) ? modStatsRes.data : [];
      setModPairs(pairs);

      setLoading(false);
    };

    fetchStats();
  }, []);

  const flaggedPairs = modPairs.filter(p => p.flagged);

  const KPI_CARDS = [
    { icon: Users,          label: 'Total Members',        value: stats.totalUsers.toLocaleString(),          color: 'bg-blue-100 text-blue-600' },
    { icon: CheckSquare,    label: 'Pending Queue',        value: stats.pendingQueue.toString(),              color: 'bg-orange-100 text-orange-600' },
    { icon: AlertTriangle,  label: 'Escalations',          value: stats.escalationCount.toString(),           color: 'bg-red-100 text-red-600' },
    { icon: ArrowRightLeft, label: 'Bridge Requests',      value: stats.bridgeRequests.toString(),            color: 'bg-enb-teal/10 text-enb-teal' },
    { icon: Activity,       label: 'ENB Today',            value: stats.enbDistributedToday.toLocaleString(), color: 'bg-enb-green/10 text-enb-green' },
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
          {/* KPI Cards */}
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

            {/* Escalations — only shown when active */}
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
                  ENB Distributed (All Time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{stats.enbDistributedAllTime.toLocaleString()}</div>
                <div className="text-xs text-blue-600 uppercase tracking-wider font-medium mt-1">ENB Distributed All Time</div>
              </CardContent>
            </Card>
          </div>

          {/* Mod Collusion Watch — only shown when flagged pairs exist */}
          {flaggedPairs.length > 0 && (
            <Card className="border-purple-200 bg-purple-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Mod Collusion Watch
                  <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium border border-purple-200">
                    {flaggedPairs.length} pair{flaggedPairs.length > 1 ? 's' : ''} flagged
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-purple-700">
                  The following mod pairs have agreed {'>'}80% of the time across 5+ shared reviews. This may indicate coordination outside the app.
                </p>
                {flaggedPairs.map((pair, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-purple-100 rounded-xl p-4">
                    <div>
                      <div className="font-semibold text-enb-text-primary text-sm">
                        {pair.mod1_name} + {pair.mod2_name}
                      </div>
                      <div className="text-xs text-enb-text-secondary mt-0.5">
                        {pair.total_reviews} shared reviews · {pair.agreements} agreements
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-700">{pair.agreement_pct}%</div>
                      <div className="text-xs text-purple-500">agreement rate</div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-purple-500 mt-2">
                  Consider reassigning these mods to different submission pools or interviewing them separately.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Mod Agreement Overview — always shown, all pairs */}
          {modPairs.length > 0 && (
            <Card className="border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  Mod Agreement Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modPairs.map((pair, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-enb-text-primary">
                        {pair.mod1_name} + {pair.mod2_name}
                      </span>
                      <span className={`font-bold ${pair.agreement_pct >= 80 ? 'text-purple-600' : pair.agreement_pct >= 60 ? 'text-orange-500' : 'text-enb-green'}`}>
                        {pair.agreement_pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pair.agreement_pct >= 80 ? 'bg-purple-400' : pair.agreement_pct >= 60 ? 'bg-orange-300' : 'bg-enb-green'}`}
                        style={{ width: `${pair.agreement_pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">{pair.total_reviews} reviews · {pair.flagged ? '⚠️ Flagged' : '✅ Normal'}</div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-1">Flagged threshold: ≥80% agreement across 5+ shared reviews</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
