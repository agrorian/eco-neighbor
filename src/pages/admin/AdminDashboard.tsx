import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, ArrowRightLeft, Activity, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  pendingQueue: number;
  bridgeRequests: number;
  enbDistributedToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, pendingQueue: 0, bridgeRequests: 0, enbDistributedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [usersRes, pendingRes, bridgeRes, txRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bridge_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('transactions').select('enb_amount').gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      ]);
      const todayENB = txRes.data?.reduce((sum, t) => sum + (t.enb_amount > 0 ? t.enb_amount : 0), 0) ?? 0;
      setStats({
        totalUsers: usersRes.count ?? 0,
        pendingQueue: pendingRes.count ?? 0,
        bridgeRequests: bridgeRes.count ?? 0,
        enbDistributedToday: todayENB,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const KPI_CARDS = [
    { icon: Users, label: 'Total Members', value: stats.totalUsers.toLocaleString(), color: 'bg-blue-100 text-blue-600' },
    { icon: CheckSquare, label: 'Pending Queue', value: stats.pendingQueue.toString(), color: 'bg-orange-100 text-orange-600' },
    { icon: ArrowRightLeft, label: 'Bridge Requests', value: stats.bridgeRequests.toString(), color: 'bg-enb-teal/10 text-enb-teal' },
    { icon: Activity, label: 'ENB Distributed Today', value: stats.enbDistributedToday.toLocaleString(), color: 'bg-enb-green/10 text-enb-green' },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {KPI_CARDS.map((kpi) => (
              <Card key={kpi.label} className="border-gray-100 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-enb-text-secondary font-medium">{kpi.label}</p>
                    <h3 className="text-2xl font-bold text-enb-text-primary mt-1">{kpi.value}</h3>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
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
