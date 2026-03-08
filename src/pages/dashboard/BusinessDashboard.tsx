import { motion } from 'motion/react';
import { Store, QrCode, PlusCircle, ArrowRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';

const RecentRedemptions = () => (
  <div className="space-y-4">
    <h3 className="font-bold text-enb-text-primary text-lg">Recent Redemptions</h3>
    {[
      { user: "eco_warrior", amount: "15 ENB", time: "10m ago", item: "Coffee" },
      { user: "green_thumb", amount: "25 ENB", time: "1h ago", item: "Lunch Special" },
      { user: "recycling_pro", amount: "10 ENB", time: "3h ago", item: "Pastry" },
    ].map((item, i) => (
      <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-enb-teal/10 flex items-center justify-center text-enb-teal font-bold">
            {item.user.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-enb-text-primary">{item.user}</div>
            <div className="text-xs text-enb-text-secondary">{item.item} • {item.time}</div>
          </div>
        </div>
        <div className="font-bold text-enb-green">
          -{item.amount}
        </div>
      </div>
    ))}
  </div>
);

export default function BusinessDashboard() {
  const { user } = useUserStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
            {user.username}
            <span className="bg-enb-teal/10 text-enb-teal text-xs px-2 py-0.5 rounded-full font-medium border border-enb-teal/20">Verified Partner</span>
          </h1>
          <p className="text-sm text-enb-text-secondary mt-1">Green Leaf Cafe • Eco City</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-enb-green">{user.balance.local}</div>
          <div className="text-xs text-enb-text-secondary uppercase tracking-wider font-medium">Float Balance</div>
        </div>
      </div>

      {/* Main Action: Scan QR */}
      <Link to="/scan">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-enb-teal text-white rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-enb-teal/20 cursor-pointer hover:bg-enb-teal/90 transition-colors"
        >
          <div>
            <h2 className="text-xl font-bold mb-1">Scan Customer QR</h2>
            <p className="text-white/80 text-sm">Process a redemption instantly</p>
          </div>
          <div className="bg-white/20 p-3 rounded-xl">
            <QrCode className="w-8 h-8" />
          </div>
        </motion.div>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-enb-text-primary mb-1">12</div>
            <div className="text-xs text-enb-text-secondary uppercase tracking-wider">Today's Redemptions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-enb-text-primary mb-1">450</div>
            <div className="text-xs text-enb-text-secondary uppercase tracking-wider">Total ENB Redeemed</div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="w-full justify-start">
          <PlusCircle className="w-4 h-4 mr-2 text-enb-green" />
          Add New Offer
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <History className="w-4 h-4 mr-2 text-gray-500" />
          View History
        </Button>
      </div>

      <RecentRedemptions />
    </div>
  );
}
