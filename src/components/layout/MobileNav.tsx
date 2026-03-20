import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, PlusCircle, Wallet, Store, MoreHorizontal, ShieldCheck, Shield } from 'lucide-react';
import { useUserStore } from '@/store/user';
import AccountSwitcher from '@/components/AccountSwitcher';

export default function MobileNav() {
  const location = useLocation();
  const { user } = useUserStore();

  if (!user) return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/submit', icon: PlusCircle, label: 'Action' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    ...(user.role === 'admin'
      ? [
          { path: '/admin', icon: ShieldCheck, label: 'Admin' },
          { path: '/more', icon: MoreHorizontal, label: 'More' },
        ]
      : user.role === 'moderator'
      ? [
          { path: '/mod-queue', icon: Shield, label: 'Mod Queue' },
          { path: '/more', icon: MoreHorizontal, label: 'More' },
        ]
      : [
          { path: '/directory', icon: Store, label: 'Directory' },
          { path: '/more', icon: MoreHorizontal, label: 'More' },
        ]
    ),
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/admin' && location.pathname.startsWith('/admin'));
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-1 w-16 group">
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-2 w-8 h-1 bg-enb-green rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-enb-green/10' : 'group-hover:bg-gray-50'}`}>
                <item.icon
                  className={`w-6 h-6 transition-colors ${isActive ? 'text-enb-green' : 'text-gray-400'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-enb-green' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Account switcher — avatar at far right on mobile */}
        <div className="relative flex flex-col items-center gap-1 w-16">
          <AccountSwitcher compact={true} />
          <span className="text-[10px] font-medium text-gray-400">Account</span>
        </div>
      </div>
    </nav>
  );
}
