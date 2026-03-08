import { motion } from 'motion/react';
import { Users, Leaf, Clock, AlertCircle, CheckCircle, XCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';

const AdminStats = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <Card className="bg-white border-gray-100 shadow-sm">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Users className="w-6 h-6 text-enb-teal mb-2" />
        <div className="text-2xl font-bold text-enb-text-primary">1,204</div>
        <div className="text-xs text-enb-text-secondary uppercase tracking-wider">Total Users</div>
      </CardContent>
    </Card>
    <Card className="bg-white border-gray-100 shadow-sm">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Leaf className="w-6 h-6 text-enb-green mb-2" />
        <div className="text-2xl font-bold text-enb-text-primary">45.2k</div>
        <div className="text-xs text-enb-text-secondary uppercase tracking-wider">ENB Distributed</div>
      </CardContent>
    </Card>
    <Card className="bg-white border-gray-100 shadow-sm">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Clock className="w-6 h-6 text-enb-gold mb-2" />
        <div className="text-2xl font-bold text-enb-text-primary">18</div>
        <div className="text-xs text-enb-text-secondary uppercase tracking-wider">Pending Review</div>
      </CardContent>
    </Card>
    <Card className="bg-white border-gray-100 shadow-sm">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
        <div className="text-2xl font-bold text-enb-text-primary">3</div>
        <div className="text-xs text-enb-text-secondary uppercase tracking-wider">Flagged Items</div>
      </CardContent>
    </Card>
  </div>
);

const RecentSystemActivity = () => (
  <div className="space-y-4">
    <h3 className="font-bold text-enb-text-primary text-lg">System Activity Log</h3>
    {[
      { action: "New User Registration", detail: "user_123 joined via Telegram", time: "2m ago", type: "info" },
      { action: "Submission Approved", detail: "Cleanup #456 by eco_warrior", time: "15m ago", type: "success" },
      { action: "Submission Rejected", detail: "Duplicate photo detected", time: "1h ago", type: "error" },
      { action: "Campaign Started", detail: "Spring Cleanup Drive", time: "2h ago", type: "info" },
    ].map((item, i) => (
      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 text-sm">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${item.type === 'success' ? 'bg-enb-green' : item.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
          <div>
            <div className="font-medium text-enb-text-primary">{item.action}</div>
            <div className="text-xs text-enb-text-secondary">{item.detail}</div>
          </div>
        </div>
        <div className="text-xs text-gray-400">{item.time}</div>
      </div>
    ))}
  </div>
);

export default function AdminDashboard() {
  const { user } = useUserStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-enb-text-primary">Admin Dashboard</h1>
        <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
          Super Admin
        </div>
      </div>

      <AdminStats />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/queue">
          <Button className="w-full h-auto py-4 flex flex-col gap-2 bg-enb-green hover:bg-enb-green/90 text-white">
            <CheckCircle className="w-6 h-6" />
            <span className="font-bold">Approve Queue (18)</span>
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

      <RecentSystemActivity />
    </div>
  );
}
