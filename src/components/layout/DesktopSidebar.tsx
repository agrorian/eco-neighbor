import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import ENBLeaf from '@/components/ENBLeaf';
import { Home, PlusCircle, Wallet, Store, Trophy, ArrowRightLeft, Settings, LogOut, ShieldCheck, Shield, Users, CheckSquare, Megaphone, ClipboardList, BarChart2, Globe } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

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

  const ALLOWED_LOG_ROLES = ['founder', 'moderator', 'admin', 'organiser'];
  const modNav = ['moderator', 'admin'].includes(user?.role || '') ? [
    { path: '/mod-queue', icon: Shield, label: 'Mod Queue' },
  ] : [];
  const roleBasedNav = ALLOWED_LOG_ROLES.includes(user?.role || '') ? [
    { path: '/my-log', icon: ClipboardList, label: 'Daily Log' },
    { path: '/impact', icon: Globe, label: 'Community Impact' },
    { path: '/governance', icon: BarChart2, label: 'Governance' },
  ] : [];

  const adminNav = [
    { path: '/admin', icon: Home, label: 'Overview' },
    { path: '/admin/queue', icon: CheckSquare, label: 'Review Queue' },
    { path: '/admin/users', icon: Users, label: 'Members' },
    { path: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
    { path: '/admin/partners', icon: Store, label: 'Partners' },
    { path: '/admin/bridge', icon: ArrowRightLeft, label: 'Bridge Manager' },
    { path: '/admin/mod-queue', icon: CheckSquare, label: 'Mod Queue' },
    { path: '/admin/escalation', icon: AlertTriangle, label: 'Escalations' },
  ];

  const isAdminSection = location.pathname.startsWith('/admin');
  const navItems = isAdminSection ? adminNav : [...memberNav, ...roleBasedNav, ...modNav];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    window.location.href = '/';
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-enb-green p-2 rounded-xl">
            <ENBLeaf size={28} />
          </div>
          <span className="font-bold text-xl tracking-tight text-enb-text-primary">Eco-Neighbor</span>
        </div>
      </div>

      {/* Admin / Member toggle — only shown for admin users */}
      {user.role === 'admin' && (
        <div className="px-4 pt-4 pb-1 flex gap-2">
          <Link to="/" className={`flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-colors ${!isAdminSection ? 'bg-enb-green text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            Member View
          </Link>
          <Link to="/admin" className={`flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-colors ${isAdminSection ? 'bg-enb-green text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            Admin Panel
          </Link>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-enb-green/10 text-enb-green font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-enb-green' : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-enb-green"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-enb-green/10 flex items-center justify-center text-enb-green font-bold text-sm flex-shrink-0">
            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-bold text-gray-900 truncate">{user.full_name || user.email}</div>
            <div className="text-xs text-gray-500 truncate capitalize flex items-center gap-1">
              {user.role === 'admin' && <ShieldCheck className="w-3 h-3 text-enb-green" />}
              {user.role}
            </div>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </aside>
  );
}
