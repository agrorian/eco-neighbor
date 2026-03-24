import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import ENBLeaf from '@/components/ENBLeaf';
import { AlertTriangle, Home, PlusCircle, Wallet, Store, Trophy, ArrowRightLeft, Settings, ShieldCheck, Shield, Users, CheckSquare, Megaphone, ClipboardList, BarChart2, Globe } from 'lucide-react';
import { useUserStore } from '@/store/user';
import AccountSwitcher from '@/components/AccountSwitcher';
import LanguageToggle from '@/components/LanguageToggle';

export default function DesktopSidebar() {
  const location = useLocation();
  const { user, logout } = useUserStore();

  if (!user) return null;

  const memberNav = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/submit', icon: PlusCircle, label: 'Submit Action' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/directory', icon: Store, label: 'Business Directory' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/bridge', icon: ArrowRightLeft, label: 'Bridge' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const volunteerNav = !['onboarding_team', 'admin', 'moderator', 'founder'].includes(user?.role || '') ? [
    { path: '/volunteer-apply', icon: Users, label: 'Join Onboarding Team' },
  ] : [];

  const ALLOWED_LOG_ROLES = ['founder', 'moderator', 'admin', 'organiser'];
  const modNav = ['moderator', 'admin'].includes(user?.role || '') ? [
    { path: '/mod-queue', icon: Shield, label: 'Mod Queue' },
  ] : [];
  const roleBasedNav = ALLOWED_LOG_ROLES.includes(user?.role || '') ? [
    { path: '/my-log', icon: ClipboardList, label: 'Daily Log' },
    { path: '/impact', icon: Globe, label: 'Community Impact' },
    { path: '/governance', icon: BarChart2, label: 'Governance' },
  ] : [];

  const onboardingNav = user?.role === 'onboarding_team' ? [
    { path: '/onboarding-queue', icon: Store, label: 'Business Onboarding' },
  ] : [];

  const adminNav = [
    { path: '/admin', icon: Home, label: 'Overview' },
    { path: '/admin/users', icon: Users, label: 'Members' },
    { path: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
    { path: '/admin/partners', icon: Store, label: 'Partners' },
    { path: '/admin/bridge', icon: ArrowRightLeft, label: 'Bridge Manager' },
    { path: '/admin/mod-queue', icon: CheckSquare, label: 'Mod Queue' },
    { path: '/admin/escalation', icon: AlertTriangle, label: 'Escalations' },
  ];

  const businessNav = [
    { path: '/business', icon: Home, label: 'Dashboard' },
    { path: '/scan', icon: Store, label: 'Scan QR' },
    { path: '/business/offers', icon: Megaphone, label: 'My Offers' },
    { path: '/business/history', icon: BarChart2, label: 'Redemption History' },
    { path: '/partner-float', icon: ArrowRightLeft, label: 'Float Monitor' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isAdminSection = location.pathname.startsWith('/admin');
  const isBusinessSection = location.pathname === '/business' || location.pathname.startsWith('/business/') || location.pathname === '/scan' || location.pathname === '/partner-float';
  const isBusiness = user?.role === 'business';

  const partnerNav = !['business', 'admin'].includes(user?.role || '') ? [
    { path: '/partner-signup', icon: Store, label: 'Become a Partner' },
  ] : [];

  const navItems = isAdminSection ? adminNav
    : (isBusiness && isBusinessSection) ? businessNav
    : [...memberNav, ...roleBasedNav, ...modNav, ...onboardingNav, ...volunteerNav, ...partnerNav];

  return (
    // w-72 = 288px (up from w-64 = 256px)
    <aside className="hidden md:flex flex-col w-72 h-screen bg-white border-r border-enb-border fixed left-0 top-0 z-50">

      {/* Logo — slightly taller, bigger icon */}
      <div className="px-5 py-5 border-b border-enb-border">
        <div className="flex items-center gap-3">
          <div className="bg-enb-green p-2.5 rounded-xl">
            <ENBLeaf size={30} />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-enb-text-primary">Eco-Neighbor</span>
            <div className="text-xs text-enb-text-muted font-medium">$ENB · v4.7</div>
          </div>
        </div>
      </div>

      {/* Admin / Member toggle */}
      {user.role === 'admin' && (
        <div className="px-4 pt-4 pb-2 flex gap-2">
          <Link
            to="/"
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${!isAdminSection ? 'bg-enb-green text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Member View
          </Link>
          <Link
            to="/admin"
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${isAdminSection ? 'bg-enb-green text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Admin Panel
          </Link>
        </div>
      )}

      {/* Onboarding team toggle */}
      {user.role === 'onboarding_team' && (
        <div className="px-4 pt-4 pb-2 flex gap-2">
          <Link
            to="/"
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${!location.pathname.startsWith('/onboarding') ? 'bg-enb-green text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Member View
          </Link>
          <Link
            to="/onboarding-queue"
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${location.pathname.startsWith('/onboarding') ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Biz Onboarding
          </Link>
        </div>
      )}

      {/* Business toggle */}
      {user.role === 'business' && (
        <div className="px-4 pt-4 pb-2 flex gap-2">
          <Link
            to="/"
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${!isBusinessSection ? 'bg-enb-green text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Member View
          </Link>
          <Link
            to="/business"
            className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${isBusinessSection ? 'bg-enb-teal text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Business Admin
          </Link>
        </div>
      )}

      {/* Nav Items — larger touch targets, bigger text */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-enb-green/10 text-enb-green font-semibold'
                  : 'text-enb-text-secondary hover:bg-gray-50 hover:text-enb-text-primary'
              }`}>
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-enb-green' : 'text-gray-400'}`} />
                <span className="text-[0.9375rem]">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav-indicator"
                    className="ml-auto w-2 h-2 rounded-full bg-enb-green"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-3 pt-2 border-t border-enb-border">
        <div className="px-1 pb-1">
          <LanguageToggle className="w-full justify-center" />
        </div>
        <AccountSwitcher compact={false} />
      </div>
    </aside>
  );
}
