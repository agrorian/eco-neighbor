import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import ENBLeaf from '@/components/ENBLeaf';
import { Home, QrCode, TrendingDown, Tag, History, Settings, ShieldCheck } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import AccountSwitcher from '@/components/AccountSwitcher';
import LanguageToggle from '@/components/LanguageToggle';

export default function BusinessDesktopSidebar() {
  const location = useLocation();
  const { user, logout } = useUserStore();
  if (!user || user.role !== 'business') return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/scan', icon: QrCode, label: 'Scan QR' },
    { path: '/business/offers', icon: Tag, label: 'My Offers' },
    { path: '/business/history', icon: History, label: 'Redemption History' },
    { path: '/partner-float', icon: TrendingDown, label: 'Float Monitor' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-enb-teal p-2 rounded-xl">
            <ENBLeaf size={28} />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-enb-text-primary">Eco-Neighbor</span>
            <div className="text-xs text-enb-teal font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified Partner
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-enb-teal/10 text-enb-teal font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-enb-teal' : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div layoutId="business-desktop-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-enb-teal" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-100">
        <div className="px-2 pb-1">
          <LanguageToggle className="w-full justify-center" />
        </div>
        <AccountSwitcher compact={false} />
      </div>
    </aside>
  );
}
