// Business-specific mobile nav — replaces member nav for role='business'
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, QrCode, TrendingDown, Tag, History } from 'lucide-react';
import { useUserStore } from '@/store/user';
import AccountSwitcher from '@/components/AccountSwitcher';

export default function BusinessMobileNav() {
  const location = useLocation();
  const { user } = useUserStore();
  if (!user || user.role !== 'business') return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/scan', icon: QrCode, label: 'Scan' },
    { path: '/business/offers', icon: Tag, label: 'Offers' },
    { path: '/business/history', icon: History, label: 'History' },
    { path: '/partner-float', icon: TrendingDown, label: 'Float' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/') && item.path !== '/';
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-1 w-14 group">
              {isActive && (
                <motion.div
                  layoutId="business-nav-indicator"
                  className="absolute -top-2 w-8 h-1 bg-enb-teal rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-enb-teal/10' : 'group-hover:bg-gray-50'}`}>
                <item.icon className={`w-6 h-6 transition-colors ${isActive ? 'text-enb-teal' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-enb-teal' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <div className="relative flex flex-col items-center gap-1 w-14">
          <AccountSwitcher compact={true} />
          <span className="text-[10px] font-medium text-gray-400">Account</span>
        </div>
      </div>
    </nav>
  );
}
