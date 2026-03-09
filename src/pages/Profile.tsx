import { motion } from 'motion/react';
import { Settings, LogOut, Edit2, MapPin, Briefcase, Award, Star } from 'lucide-react';
import { useUserStore, getTier } from '@/store/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const BADGES = [
  { id: 1, name: 'Early Adopter', icon: '🚀', description: 'Joined in the first month' },
  { id: 2, name: 'Green Thumb', icon: '🌿', description: 'Completed 10 gardening actions' },
  { id: 3, name: 'Recycler', icon: '♻️', description: 'Recycled 50kg of waste' },
  { id: 4, name: 'Community Pillar', icon: '🏛️', description: 'Reached Pillar tier' },
];

const TIER_THRESHOLDS: Record<string, number> = {
  Newcomer: 5000,
  Helper: 20000,
  Guardian: 50000,
  Pillar: 100000,
  Founder: 100000,
};

function Crown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

export default function Profile() {
  const { user, logout } = useUserStore();

  if (!user) return null;

  const tier = getTier(user.rep_score);
  const nextTierThreshold = TIER_THRESHOLDS[tier] || 5000;
  const progress = Math.min((user.rep_score / nextTierThreshold) * 100, 100);
  const displayName = user.full_name || user.email || 'Member';

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">My Profile</h1>
          <p className="text-sm text-enb-text-secondary">Your eco-journey so far</p>
        </div>
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-enb-text-secondary" />
          </Button>
        </Link>
      </header>

      {/* Profile Card */}
      <Card className="border-none shadow-md overflow-hidden relative">
        <div className="h-24 bg-gradient-to-r from-enb-green to-enb-teal" />
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1A6B3C&color=fff&size=96`}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <Button size="sm" variant="outline" className="mb-2">
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-enb-text-primary">{displayName}</h2>
              <span className="bg-enb-gold/10 text-enb-gold text-xs px-2 py-0.5 rounded-full font-bold border border-enb-gold/20 flex items-center gap-1">
                <Crown className="w-3 h-3" style={{ fill: 'currentColor' }} />
                {tier}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-enb-text-secondary mt-2">
              {user.neighbourhood && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {user.neighbourhood}
                </div>
              )}
              {user.profession && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {user.profession}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-enb-gold fill-current" />
                {user.rep_score} Rep
              </div>
            </div>
          </div>

          {/* Rep Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-enb-text-secondary">Reputation Score</span>
              <span className="text-enb-text-primary">{user.rep_score} / {nextTierThreshold.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-enb-gold rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {tier === 'Founder'
                ? 'Maximum tier reached!'
                : `${(nextTierThreshold - user.rep_score).toLocaleString()} Rep to next tier`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-enb-green/5 border-enb-green/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-enb-green mb-1">
              {(user.enb_local_bal || 0).toLocaleString()}
            </div>
            <div className="text-xs text-enb-text-secondary uppercase tracking-wider">ENB.LOCAL Balance</div>
          </CardContent>
        </Card>
        <Card className="bg-enb-gold/5 border-enb-gold/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-enb-gold mb-1">{user.rep_score}</div>
            <div className="text-xs text-enb-text-secondary uppercase tracking-wider">Rep Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Badge Wall */}
      <div>
        <h3 className="font-bold text-enb-text-primary text-lg mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-enb-gold" />
          Achievements
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {BADGES.map((badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className="aspect-square bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-2 text-center cursor-pointer group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{badge.icon}</div>
              <div className="text-[10px] font-medium text-enb-text-secondary leading-tight">{badge.name}</div>
            </motion.div>
          ))}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-50 rounded-xl border border-gray-100 border-dashed flex items-center justify-center opacity-50">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="destructive"
        size="lg"
        onClick={logout}
        className="w-full mt-4 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 shadow-none"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Log Out
      </Button>
    </div>
  );
}
