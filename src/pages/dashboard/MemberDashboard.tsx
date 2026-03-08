import { motion } from 'motion/react';
import { Leaf, ArrowRight, Clock, Star, MapPin, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore, getTier } from '@/store/user';
import { Link } from 'react-router-dom';

const ActiveCampaignBanner = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-enb-green to-enb-teal rounded-2xl p-6 text-white mb-6 relative overflow-hidden shadow-lg shadow-enb-green/20"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-2">
        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
          2× Bonus Active
        </div>
        <div className="flex items-center gap-1 text-xs font-medium bg-black/20 px-2 py-1 rounded-lg">
          <Clock className="w-3 h-3" />
          <span>48h left</span>
        </div>
      </div>
      <h3 className="text-xl font-bold mb-1">Spring Cleanup Drive</h3>
      <p className="text-white/90 text-sm mb-4 max-w-xs">
        Earn double ENB for all neighborhood cleanup actions this weekend!
      </p>
      <Button variant="secondary" size="sm" className="bg-white text-enb-green hover:bg-white/90 border-none">
        Join Campaign
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </motion.div>
);

const ImpactCounter = () => (
  <div className="grid grid-cols-2 gap-4 mb-6">
    <Card className="bg-enb-green/5 border-enb-green/10">
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-enb-green mb-1">1,250</div>
        <div className="text-xs text-enb-text-secondary uppercase tracking-wider">kg Waste Saved</div>
      </CardContent>
    </Card>
    <Card className="bg-enb-gold/5 border-enb-gold/10">
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-enb-gold mb-1">45.2k</div>
        <div className="text-xs text-enb-text-secondary uppercase tracking-wider">ENB Distributed</div>
      </CardContent>
    </Card>
  </div>
);

const RecentActivity = () => (
  <div className="space-y-4">
    <h3 className="font-bold text-enb-text-primary text-lg">Recent Activity</h3>
    {[
      { action: "Recycling Drop-off", date: "2h ago", amount: "+15 ENB", status: "Approved" },
      { action: "Community Cleanup", date: "Yesterday", amount: "+50 ENB", status: "Pending" },
      { action: "Local Purchase", date: "2 days ago", amount: "-12 ENB", status: "Completed" },
    ].map((item, i) => (
      <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.amount.startsWith('+') ? 'bg-enb-green/10 text-enb-green' : 'bg-red-50 text-red-500'}`}>
            {item.amount.startsWith('+') ? <Leaf className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 rotate-45" />}
          </div>
          <div>
            <div className="font-medium text-enb-text-primary">{item.action}</div>
            <div className="text-xs text-enb-text-secondary">{item.date} • {item.status}</div>
          </div>
        </div>
        <div className={`font-bold ${item.amount.startsWith('+') ? 'text-enb-green' : 'text-red-500'}`}>
          {item.amount}
        </div>
      </div>
    ))}
  </div>
);

const getTierIcon = (repScore: number) => {
  const tier = getTier(repScore);
  switch (tier) {
    case 'Newcomer': return '🌱';
    case 'Helper': return '🌿';
    case 'Guardian': return '🌳';
    case 'Pillar': return '⭐';
    case 'Founder': return '🏆';
    default: return '🌱';
  }
};

export default function MemberDashboard() {
  const { user } = useUserStore();

  if (!user) return null;

  const tier = getTier(user.rep_score);

  return (
    <div className="space-y-6">
      {/* Greeting Card */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">
            Hi, {user.full_name || user.email} {getTierIcon(user.rep_score)}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-enb-text-secondary font-medium bg-gray-100 px-2 py-0.5 rounded-md">
              {tier} Tier
            </span>
            <span className="text-sm text-enb-text-secondary">•</span>
            <span className="text-sm text-enb-text-secondary font-medium flex items-center gap-1">
              <Star className="w-3 h-3 text-enb-gold fill-current" />
              {user.rep_score} Rep
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-enb-gold">{user.enb_local_bal.toLocaleString()}</div>
          <div className="text-xs text-enb-text-secondary uppercase tracking-wider font-medium">ENB.LOCAL</div>
        </div>
      </div>

      <ActiveCampaignBanner />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/submit">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200">
            <Leaf className="w-6 h-6 text-enb-green" />
            <span className="text-xs font-medium">Submit Action</span>
          </Button>
        </Link>
        <Link to="/directory">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200">
            <MapPin className="w-6 h-6 text-enb-teal" />
            <span className="text-xs font-medium">Find Business</span>
          </Button>
        </Link>
        <Link to="/wallet">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200">
            <History className="w-6 h-6 text-enb-gold" />
            <span className="text-xs font-medium">My History</span>
          </Button>
        </Link>
      </div>

      <ImpactCounter />
      <RecentActivity />
    </div>
  );
}