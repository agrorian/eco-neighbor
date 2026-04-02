import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Wallet, Store, MoreHorizontal, ShieldCheck, Shield } from 'lucide-react';
import { useUserStore } from '@/store/user';
import AccountSwitcher from '@/components/AccountSwitcher';
import { useT } from '@/contexts/LanguageContext';

const ITEM_STYLES: Record<string, { color: string; bg: string; activeBg: string }> = {
  'dashboard':       { color: 'text-enb-green',  bg: 'bg-enb-green/10',  activeBg: 'bg-enb-green' },
  'submitAction':    { color: 'text-blue-600',   bg: 'bg-blue-50',       activeBg: 'bg-blue-600' },
  'wallet':          { color: 'text-amber-500',  bg: 'bg-amber-50',      activeBg: 'bg-amber-500' },
  'directory':       { color: 'text-enb-teal',   bg: 'bg-teal-50',       activeBg: 'bg-enb-teal' },
  'more':            { color: 'text-gray-600',   bg: 'bg-gray-100',      activeBg: 'bg-gray-500' },
  'admin':           { color: 'text-slate-700',  bg: 'bg-slate-100',     activeBg: 'bg-slate-700' },
  'modQueue':        { color: 'text-orange-500', bg: 'bg-orange-50',     activeBg: 'bg-orange-500' },
  'bizOnboarding':   { color: 'text-purple-600', bg: 'bg-purple-50',     activeBg: 'bg-purple-600' },
  'myOffers':        { color: 'text-enb-teal',   bg: 'bg-teal-50',       activeBg: 'bg-enb-teal' },
  'scanQR':          { color: 'text-enb-green',  bg: 'bg-enb-green/10',  activeBg: 'bg-enb-green' },
  'history':         { color: 'text-purple-600', bg: 'bg-purple-50',     activeBg: 'bg-purple-600' },
  'float':           { color: 'text-indigo-600', bg: 'bg-indigo-50',     activeBg: 'bg-indigo-600' },
};

function NavCard({ path, icon: Icon, styleKey, label, isActive }: {
  path: string; icon: any; styleKey: string; label: string; isActive: boolean;
}) {
  const s = ITEM_STYLES[styleKey] || { color: 'text-gray-500', bg: 'bg-gray-100', activeBg: 'bg-gray-500' };
  return (
    <Link to={path} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
        isActive ? `${s.activeBg} shadow-md` : `${s.bg} shadow-sm border border-white`
      }`}>
        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : s.color}`} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className={`text-[11px] font-semibold ${isActive ? s.color : 'text-gray-500'}`}>
        {label}
      </span>
    </Link>
  );
}

function AccountCard() {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <AccountSwitcher compact={true} />
      <span className="text-[11px] font-semibold text-gray-500">Account</span>
    </div>
  );
}

const NAV_WRAPPER = "fixed bottom-0 w-full bg-white/95 backdrop-blur-sm border-t border-gray-100 pb-safe z-50 md:hidden";
const NAV_ROW = "flex items-end pb-3 pt-2 px-3 gap-2";

export default function MobileNav() {
  const location = useLocation();
  const { user } = useUserStore();
  const { l } = useT();

  if (!user) return null;

  const isBusinessSection =
    location.pathname === '/business' ||
    location.pathname.startsWith('/business/') ||
    location.pathname === '/scan' ||
    location.pathname === '/partner-float';

  // ── Business role ──────────────────────────────────────────────────────────
  if (user.role === 'business') {
    const toggleBar = (
      <div className="flex border-b border-gray-100">
        {isBusinessSection ? (
          <>
            <Link to="/" className="flex-1 py-2 text-center text-xs font-semibold text-gray-400">Member View</Link>
            <div className="flex-1 py-2 text-center text-xs font-semibold text-enb-teal border-b-2 border-enb-teal">Business Admin</div>
          </>
        ) : (
          <>
            <div className="flex-1 py-2 text-center text-xs font-semibold text-enb-green border-b-2 border-enb-green">Member View</div>
            <Link to="/business" className="flex-1 py-2 text-center text-xs font-semibold text-gray-400">Business Admin</Link>
          </>
        )}
      </div>
    );

    const bizItems = isBusinessSection
      ? [
          { path: '/business/offers',  icon: Store,       styleKey: 'myOffers',  label: 'My Offers' },
          { path: '/scan',             icon: ShieldCheck, styleKey: 'scanQR',    label: 'Scan QR' },
          { path: '/business/history', icon: Wallet,      styleKey: 'history',   label: 'History' },
          { path: '/partner-float',    icon: Shield,      styleKey: 'float',     label: 'Float' },
        ]
      : [
          { path: '/',          icon: Home,          styleKey: 'dashboard',   label: l('nav', 'dashboard') },
          { path: '/submit',    icon: PlusCircle,    styleKey: 'submitAction',label: l('nav', 'submitAction') },
          { path: '/wallet',    icon: Wallet,        styleKey: 'wallet',      label: l('nav', 'wallet') },
          { path: '/directory', icon: Store,         styleKey: 'directory',   label: l('nav', 'directory') },
          { path: '/more',      icon: MoreHorizontal,styleKey: 'more',        label: l('nav', 'more') },
        ];

    return (
      <nav className={NAV_WRAPPER} style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        {toggleBar}
        <div className={NAV_ROW}>
          {bizItems.map(item => (
            <NavCard key={item.path} path={item.path} icon={item.icon}
              styleKey={item.styleKey} label={item.label}
              isActive={location.pathname === item.path} />
          ))}
          <AccountCard />
        </div>
      </nav>
    );
  }

  // ── All other roles ────────────────────────────────────────────────────────
  const navItems = [
    { path: '/',       icon: Home,       styleKey: 'dashboard',   label: l('nav', 'dashboard') },
    { path: '/submit', icon: PlusCircle, styleKey: 'submitAction',label: l('nav', 'submitAction') },
    { path: '/wallet', icon: Wallet,     styleKey: 'wallet',      label: l('nav', 'wallet') },
    ...(user.role === 'admin'
      ? [{ path: '/admin',            icon: ShieldCheck,    styleKey: 'admin',        label: l('nav', 'admin') },
         { path: '/more',             icon: MoreHorizontal, styleKey: 'more',         label: l('nav', 'more') }]
      : user.role === 'moderator'
      ? [{ path: '/mod-queue',        icon: Shield,         styleKey: 'modQueue',     label: l('nav', 'modQueue') },
         { path: '/more',             icon: MoreHorizontal, styleKey: 'more',         label: l('nav', 'more') }]
      : user.role === 'onboarding_team'
      ? [{ path: '/onboarding-queue', icon: Store,          styleKey: 'bizOnboarding',label: 'Biz Onboarding' },
         { path: '/more',             icon: MoreHorizontal, styleKey: 'more',         label: l('nav', 'more') }]
      : [{ path: '/directory',        icon: Store,          styleKey: 'directory',    label: l('nav', 'directory') },
         { path: '/more',             icon: MoreHorizontal, styleKey: 'more',         label: l('nav', 'more') }]
    ),
  ];

  return (
    <nav className={NAV_WRAPPER} style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
      <div className={NAV_ROW}>
        {navItems.map(item => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : item.path === '/admin'
            ? location.pathname.startsWith('/admin')
            : location.pathname.startsWith(item.path);
          return (
            <NavCard key={item.path} path={item.path} icon={item.icon}
              styleKey={item.styleKey} label={item.label} isActive={isActive} />
          );
        })}
        <AccountCard />
      </div>
    </nav>
  );
}
