import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Leaf, Home, PlusCircle, Wallet, Store, Trophy, ArrowRightLeft, Settings, LogOut } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { Button } from '@/components/ui/button';

export default function DesktopSidebar() {
  const location = useLocation();
  const { user, logout } = useUserStore();

  if (!user) return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/submit', icon: PlusCircle, label: 'Submit Action' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/directory', icon: Store, label: 'Business Directory' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/bridge', icon: ArrowRightLeft, label: 'Bridge' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-enb-green p-2 rounded-xl">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-enb-text-primary">Eco-Neighbor</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
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

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-enb-green/10 flex items-center justify-center text-enb-green font-bold text-sm">
            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-bold text-gray-900 truncate">{user.full_name || user.email}</div>
            <div className="text-xs text-gray-500 truncate capitalize">{user.role}</div>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </aside>
  );
}
