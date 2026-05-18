import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { AlertTriangle, LayoutDashboard, CheckSquare, Users, Megaphone, Store, ArrowRightLeft, Shield, LogOut, Loader2, ClipboardList, Bug, Radio, GitBranch, BarChart2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore, isSuperAdmin as checkSuperAdmin } from '@/store/user';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/admin',            color: 'text-enb-green',  bg: 'bg-enb-green/10' },
  { icon: Users,           label: 'Users',          path: '/admin/users',          color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: GitBranch,       label: 'Org Structure',  path: '/admin/org-structure',  color: 'text-blue-600',   bg: 'bg-blue-50' },
  { icon: Megaphone,       label: 'Campaigns',      path: '/admin/campaigns',      color: 'text-enb-teal',   bg: 'bg-teal-50' },
  { icon: Radio,           label: 'Announcements',  path: '/admin/announcements',  color: 'text-blue-600',   bg: 'bg-blue-50' },
  { icon: Store,           label: 'Partners',     path: '/admin/partners',   color: 'text-enb-gold',   bg: 'bg-amber-50' },
  { icon: ArrowRightLeft,  label: 'Bridge',       path: '/admin/bridge',     color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: Shield,          label: 'Mod Queue',    path: '/admin/mod-queue',  color: 'text-enb-green',  bg: 'bg-enb-green/10' },
  { icon: AlertTriangle,   label: 'Escalations',  path: '/admin/escalation', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Bug,             label: 'Bug Reports',  path: '/admin/bugs',       color: 'text-red-500',    bg: 'bg-red-50' },
  { icon: Store,           label: 'Onboarding',   path: '/admin/onboarding', color: 'text-enb-teal',   bg: 'bg-teal-50' },
  { icon: Shield,          label: 'ENB Captains', path: '/admin/captains',        color: 'text-enb-gold',   bg: 'bg-amber-50' },
  { icon: BarChart2,       label: 'Mod Performance', path: '/admin/mod-performance', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: UserCheck,       label: 'Mod Assignments', path: '/admin/mod-assignments', color: 'text-blue-600',   bg: 'bg-blue-50' },
  { icon: ClipboardList,   label: 'Daily Log',    path: '/my-log',               color: 'text-gray-600',   bg: 'bg-gray-100' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user } = useUserStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // ── ENB DOCTRINE: Role comes from the store — never re-query DB for role on each render ──
  // [user?.id] dep: only re-evaluate when the user identity changes, not on every balance update.
  // checkSuperAdmin covers both 'admin' and 'super_admin' roles.
  useEffect(() => {
    if (!user?.id) { setIsAdmin(false); return; }
    setIsAdmin(checkSuperAdmin(user.role));
  }, [user?.id, user?.role]);

  // ── Never redirect while user is loading or store is temporarily null ──────
  // If user is null, it means the store is mid-update (token refresh cycle).
  // Redirecting here wipes the page and causes a full reload → phantom account.
  // Only show spinner while isAdmin is still being calculated.
  if (isAdmin === null || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="bg-white border-b md:border-b-0 md:border-r border-gray-200 w-full md:w-64 flex-shrink-0">

        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center md:block">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-enb-text-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <div>
              <h1 className="font-bold text-enb-text-primary">Admin Panel</h1>
              <p className="text-xs text-enb-text-secondary">Eco-Neighbor</p>
            </div>
          </div>
          <Link to="/" className="md:hidden">
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl font-semibold text-sm">
              <LogOut className="w-4 h-4" />
              Exit
            </div>
          </Link>
        </div>

        {/* ── Mobile: card grid — 4 columns, prominent cards ── */}
        <nav className="md:hidden p-3 grid grid-cols-4 gap-2.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <div className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-enb-dark shadow-lg'
                    : `${item.bg} shadow-sm border border-white`
                }`}>
                  {/* Icon container */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
                    isActive ? 'bg-white/20' : 'bg-white'
                  }`}>
                    <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : item.color}`} />
                  </div>
                  {/* Label */}
                  <span className={`text-[11px] font-semibold text-center leading-tight ${
                    isActive ? 'text-white' : 'text-gray-700'
                  }`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ── Desktop: vertical list ── */}
        <nav className="hidden md:flex flex-col p-4 gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <button className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full whitespace-nowrap ${
                  isActive
                    ? 'bg-enb-text-primary text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto hidden md:block">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start text-red-600 border-red-100 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Exit Admin
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
