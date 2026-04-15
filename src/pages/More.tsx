import { Link } from 'react-router-dom';
import { Trophy, ArrowRightLeft, Settings, LogOut, Globe, Vote, Store, LayoutDashboard, ClipboardList, Users, TrendingUp, TrendingDown, History, Bug, Apple } from 'lucide-react';
import { useUserStore } from '@/store/user';
import LanguageToggle from '@/components/LanguageToggle';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

const ALLOWED_LOG_ROLES = ['founder', 'moderator', 'admin', 'organiser'];

// Roles that are staff/special — should NOT see member-only CTAs
const STAFF_ROLES = ['admin', 'moderator', 'founder', 'organiser', 'onboarding_team', 'business'];

export default function More() {
  const { user, logout } = useUserStore();
  const { lang } = useLang();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    window.location.href = '/';
  };

  const isMemberOnly = user?.role === 'member';

  const allItems = [
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', color: 'text-enb-gold', show: true },
    { icon: Globe, label: 'Community Impact', path: '/impact', color: 'text-enb-green', show: true },
    { icon: Apple, label: 'Food Sharing', path: '/food-sharing', color: 'text-orange-500', show: true },
    { icon: Vote, label: 'Governance', path: '/governance', color: 'text-blue-600', show: true },
    { icon: Store, label: 'Business Directory', path: '/directory', color: 'text-orange-500', show: true },
    { icon: ArrowRightLeft, label: 'Maturation Bridge', path: '/bridge', color: 'text-enb-teal', show: true },
    { icon: Users, label: 'Referral Hub', path: '/wallet/referrals', color: 'text-enb-green', show: true },
    { icon: History, label: 'My History', path: '/history', color: 'text-enb-teal', show: true },
    { icon: ClipboardList, label: 'Daily Log', path: '/my-log', color: 'text-enb-gold', show: ALLOWED_LOG_ROLES.includes(user?.role || '') },
    { icon: TrendingUp, label: 'Founder Sale Gate', path: '/founder-sale', color: 'text-enb-gold', show: user?.role === 'admin' || user?.role === 'founder' },
    { icon: TrendingDown, label: 'Float Monitor', path: '/partner-float', color: 'text-enb-teal', show: user?.role === 'business' || user?.role === 'admin' },
    { icon: LayoutDashboard, label: 'Admin Panel', path: '/admin', color: 'text-purple-600', show: user?.role === 'admin' || user?.role === 'founder' },
    // Only show "Become a Partner" to regular members — not to any staff/role users
    { icon: Store, label: 'Become a Partner', path: '/partner-signup', color: 'text-enb-teal', show: isMemberOnly },
    // Only show "Join Onboarding Team" to regular members — not staff who already have roles
    { icon: Users, label: 'Join Onboarding Team', path: '/volunteer-apply', color: 'text-blue-600', show: isMemberOnly },
    { icon: ClipboardList, label: 'Onboarding Queue', path: '/onboarding-queue', color: 'text-enb-green', show: ['onboarding_team', 'admin'].includes(user?.role || '') },
    { icon: Bug, label: 'Report a Bug', path: '/bug-report', color: 'text-red-500', show: true },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'text-gray-600', show: true },
  ].filter(i => i.show);

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">More</h1>
        <p className="text-enb-text-secondary">Explore additional features</p>
      </header>

      {/* Language toggle — prominent card, always first on mobile */}
      <div className="bg-white rounded-xl border border-enb-border shadow-sm p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-enb-text-primary">
            {lang === 'en' ? 'Language / زبان' : 'زبان / Language'}
          </p>
          <p className="text-xs text-enb-text-secondary mt-0.5">
            {lang === 'en' ? 'Switch to Urdu' : 'Switch to English'}
          </p>
        </div>
        <LanguageToggle />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {allItems.map((item) => (
          <Link key={item.label} to={item.path}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-5 hover:bg-gray-50 transition-colors h-28">
              <item.icon className={`w-7 h-7 mb-2 ${item.color}`} />
              <span className="font-medium text-enb-text-primary text-sm text-center leading-tight">{item.label}</span>
            </div>
          </Link>
        ))}

        <button onClick={handleLogout} className="col-span-2">
          <div className="bg-white rounded-xl border border-red-100 shadow-sm flex items-center justify-center p-4 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5 mr-2 text-red-500" />
            <span className="font-medium text-red-600">Log Out</span>
          </div>
        </button>
      </div>

      <div className="text-center text-xs text-gray-400 pt-2">
        Eco-Neighbor · ENB Token · App v1.2.0
      </div>
    </div>
  );
}
