import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, PlusCircle, Wallet, Store, MoreHorizontal, ShieldCheck, Shield, LayoutDashboard } from 'lucide-react';
import { useUserStore } from '@/store/user';
import AccountSwitcher from '@/components/AccountSwitcher';

export default function MobileNav() {
  const location = useLocation();
  const { user } = useUserStore();

  if (!user) return null;

  const isBusinessSection = location.pathname.startsWith('/business') ||
    location.pathname === '/scan' || location.pathname === '/partner-float';

  // Business role — show toggle bar + context nav
  if (user.role === 'business') {
    // Business Admin section nav
    if (isBusinessSection) {
      return (
        <nav className="fixed bottom-0 w-full bg-white border-t border-enb-teal/20 pb-safe z-50 md:hidden">
          {/* Toggle row */}
          <div className="flex border-b border-gray-100">
            <Link to="/" className="flex-1 py-2 text-center text-xs font-semibold text-gray-400 hover:text-enb-green">
              Member View
            </Link>
            <div className="flex-1 py-2 text-center text-xs font-semibold text-enb-teal border-b-2 border-enb-teal">
              Business Admin
            </div>
          </div>
          {/* Business nav items */}
          <div className="flex items-center h-14 px-2 gap-1">
            {[
              { path: '/business/offers', icon: Store, label: 'My Offers' },
              { path: '/scan', icon: ShieldCheck, label: 'Scan QR' },
              { path: '/business/history', icon: Wallet, label: 'History' },
              { path: '/partner-float', icon: Shield, label: 'Float' },
            ].map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-0.5 flex-1 min-w-0">
                  {isActive && (
                    <motion.div layoutId="biz-mobile-indicator"
                      className="absolute -top-2 w-6 h-0.5 bg-enb-teal rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`p-1 rounded-xl ${isActive ? 'bg-enb-teal/10' : ''}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-enb-teal' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-enb-teal' : 'text-gray-400'}`}>{item.label}</span>
                </Link>
              );
            })}
            <div className="relative flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <AccountSwitcher compact={true} />
              <span className="text-[10px] font-medium text-gray-400">Account</span>
            </div>
          </div>
        </nav>
      );
    }

    // Business role in Member View — show toggle bar + member nav
    return (
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe z-50 md:hidden">
        {/* Toggle row */}
        <div className="flex border-b border-gray-100">
          <div className="flex-1 py-2 text-center text-xs font-semibold text-enb-green border-b-2 border-enb-green">
            Member View
          </div>
          <Link to="/business/offers" className="flex-1 py-2 text-center text-xs font-semibold text-gray-400 hover:text-enb-teal">
            Business Admin
          </Link>
        </div>
        {/* Member nav items */}
        <div className="flex items-center h-14 px-2 gap-1">
          {[
            { path: '/', icon: Home, label: 'Home' },
            { path: '/submit', icon: PlusCircle, label: 'Action' },
            { path: '/wallet', icon: Wallet, label: 'Wallet' },
            { path: '/directory', icon: Store, label: 'Directory' },
            { path: '/more', icon: MoreHorizontal, label: 'More' },
          ].map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-0.5 flex-1 min-w-0">
                {isActive && (
                  <motion.div layoutId="mobile-nav-indicator"
                    className="absolute -top-2 w-6 h-0.5 bg-enb-green rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`p-1 rounded-xl ${isActive ? 'bg-enb-green/10' : ''}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-enb-green' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-enb-green' : 'text-gray-400'}`}>{item.label}</span>
              </Link>
            );
          })}
          <div className="relative flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <AccountSwitcher compact={true} />
            <span className="text-[10px] font-medium text-gray-400">Account</span>
          </div>
        </div>
      </nav>
    );
  }

  // All other roles
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
      : user.role === 'onboarding_team'
      ? [
          { path: '/onboarding-queue', icon: Store, label: 'Biz Onboarding' },
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
      <div className="flex items-center h-16 gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/admin' && location.pathname.startsWith('/admin'));
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-0.5 flex-1 min-w-0 group">
              {isActive && (
                <motion.div layoutId="mobile-nav-indicator"
                  className="absolute -top-2 w-8 h-1 bg-enb-green rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-enb-green/10' : 'group-hover:bg-gray-50'}`}>
                <item.icon className={`w-6 h-6 transition-colors ${isActive ? 'text-enb-green' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-enb-green' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <div className="relative flex flex-col items-center gap-1 w-16">
          <AccountSwitcher compact={true} />
          <span className="text-[10px] font-medium text-gray-400">Account</span>
        </div>
      </div>
    </nav>
  );
}
