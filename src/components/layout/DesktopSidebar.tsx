import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import ENBLeaf from '@/components/ENBLeaf';
import { AlertTriangle, Home, PlusCircle, Wallet, Store, Trophy, ArrowRightLeft, Settings, Shield, Users, CheckSquare, Megaphone, ClipboardList, BarChart2, Globe, Apple, Vote, Flag, Bell, MessageSquare, BookOpen, User } from 'lucide-react';
import { useUserStore } from '@/store/user';
import AccountSwitcher from '@/components/AccountSwitcher';
import LanguageToggle from '@/components/LanguageToggle';
import { useT } from '@/contexts/LanguageContext';
import InboxBell from '@/components/InboxBell';

export default function DesktopSidebar() {
  const location = useLocation();
  const { user } = useUserStore();
  const { l } = useT();

  if (!user) return null;

  const memberNav = [
    { path: '/inbox',        icon: Bell,          label: 'Inbox' },
    { path: '/messages',     icon: MessageSquare, label: 'Messages' },
    { path: '/',              icon: Home,          label: l('nav', 'dashboard') },
    { path: '/submit',        icon: PlusCircle,    label: l('nav', 'submitAction') },
    { path: '/wallet',        icon: Wallet,        label: l('nav', 'wallet') },
    { path: '/directory',     icon: Store,         label: l('nav', 'directory') },
    { path: '/leaderboard',   icon: Trophy,        label: l('nav', 'leaderboard') },
    { path: '/impact',        icon: Globe,         label: l('nav', 'communityImpact') },
    { path: '/food-sharing',  icon: Apple,         label: 'Food Sharing' },
    { path: '/governance',    icon: Vote,          label: l('nav', 'governance') },
    { path: '/issues',        icon: Flag,          label: 'Community Issues' },
    { path: '/glossary',      icon: BookOpen,      label: 'ENB Glossary' },
    { path: '/bridge',        icon: ArrowRightLeft,label: l('nav', 'bridge') },
    { path: '/settings',      icon: Settings,      label: l('nav', 'settings') },
    { path: '/profile',       icon: User,          label: 'My Profile' },
  ];

  const volunteerNav = !['onboarding_team', 'admin', 'super_admin', 'moderator', 'founder'].includes(user?.role || '') ? [
    { path: '/volunteer-apply', icon: Users, label: 'Join Onboarding Team' },
  ] : [];

  const ALLOWED_LOG_ROLES = ['founder', 'moderator', 'admin', 'organiser'];
  const modNav = ['moderator', 'admin', 'super_admin'].includes(user?.role || '') ? [
    { path: '/mod-queue', icon: Shield, label: l('nav', 'modQueue') },
  ] : [];
  const roleBasedNav = ALLOWED_LOG_ROLES.includes(user?.role || '') ? [
    { path: '/my-log', icon: ClipboardList, label: l('nav', 'dailyLog') },
  ] : [];

  const onboardingNav = user?.role === 'onboarding_team' ? [
    { path: '/onboarding-queue', icon: Store, label: 'Business Onboarding' },
  ] : [];

  const adminNav = [
    { path: '/admin',            icon: Home,          label: 'Overview' },
    { path: '/admin/users',      icon: Users,         label: 'Members' },
    { path: '/admin/campaigns',  icon: Megaphone,     label: 'Campaigns' },
    { path: '/admin/partners',   icon: Store,         label: 'Partners' },
    { path: '/admin/bridge',     icon: ArrowRightLeft,label: 'Bridge Manager' },
    { path: '/admin/mod-queue',  icon: CheckSquare,   label: 'Mod Queue' },
    { path: '/admin/escalation', icon: AlertTriangle, label: 'Escalations' },
  ];

  const businessNav = [
    { path: '/business',         icon: Home,          label: l('nav', 'dashboard') },
    { path: '/scan',             icon: Store,         label: 'Scan QR' },
    { path: '/business/offers',  icon: Megaphone,     label: 'My Offers' },
    { path: '/business/history', icon: BarChart2,     label: 'SWAP History' },
    { path: '/partner-float',    icon: ArrowRightLeft,label: 'Float Monitor' },
    { path: '/settings',         icon: Settings,      label: l('nav', 'settings') },
  ];

  const isAdminSection = location.pathname.startsWith('/admin');
  const isBusinessSection = location.pathname === '/business' || location.pathname.startsWith('/business/') || location.pathname === '/scan' || location.pathname === '/partner-float';
  const isBusiness = user?.role === 'business';

  const partnerNav = !['business', 'admin', 'super_admin', 'moderator', 'founder', 'onboarding_team', 'organiser'].includes(user?.role || '') ? [
    { path: '/partner-signup', icon: Store, label: 'Become a Partner' },
  ] : [];

  const navItems = isAdminSection ? adminNav
    : (isBusiness && isBusinessSection) ? businessNav
    : [...memberNav, ...roleBasedNav, ...modNav, ...onboardingNav, ...volunteerNav, ...partnerNav];

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen bg-white border-r border-enb-border fixed left-0 top-0 z-50">

      {/* Logo — always LTR regardless of language direction */}
      <div className="px-5 py-5 border-b border-enb-border" dir="ltr">
        <div className="flex items-center gap-3">
          <div className="bg-enb-green p-2.5 rounded-xl flex-shrink-0">
            <ENBLeaf size={30} />
          </div>
          <div className="overflow-hidden flex-1">
            <span className="font-bold text-xl tracking-tight text-enb-text-primary block truncate">Eco-Neighbor</span>
            <span
              className="text-xs text-enb-text-muted font-medium"
              dir="ltr"
              style={{ unicodeBidi: 'embed', direction: 'ltr', display: 'block' }}
            >$ENB · App v1.8.0</span>
          </div>
          <InboxBell />
        </div>
      </div>

      {/* Admin toggle */}
      {['admin', 'super_admin'].includes(user.role) && (
        <div className="px-4 pt-4 pb-2 flex gap-2">
          <Link to="/" className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${!isAdminSection ? 'bg-enb-green text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            Member View
          </Link>
          <Link to="/admin" className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${isAdminSection ? 'bg-enb-green text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            Admin Panel
          </Link>
        </div>
      )}

      {/* Onboarding toggle */}
      {user.role === 'onboarding_team' && (
        <div className="px-4 pt-4 pb-2 flex gap-2">
          <Link to="/" className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${!location.pathname.startsWith('/onboarding') ? 'bg-enb-green text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            Member View
          </Link>
          <Link to="/onboarding-queue" className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${location.pathname.startsWith('/onboarding') ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            Biz Onboarding
          </Link>
        </div>
      )}

      {/* Business toggle */}
      {user.role === 'business' && (
        <div className="px-4 pt-4 pb-2 flex gap-2">
          <Link to="/" className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${!isBusinessSection ? 'bg-enb-green text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            Member View
          </Link>
          <Link to="/business" className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${isBusinessSection ? 'bg-enb-teal text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            Business Admin
          </Link>
        </div>
      )}

      {/* Nav items */}
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
                <span className="text-[15px]">{item.label}</span>
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
