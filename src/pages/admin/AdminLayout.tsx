import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, Megaphone, Store, ArrowRightLeft, Shield, LogOut, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: CheckSquare, label: 'Queue', path: '/admin/queue' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Megaphone, label: 'Campaigns', path: '/admin/campaigns' },
  { icon: Store, label: 'Partners', path: '/admin/partners' },
  { icon: ArrowRightLeft, label: 'Bridge', path: '/admin/bridge' },
  { icon: Shield, label: 'Mod Queue', path: '/admin/mod-queue' },
  { icon: ClipboardList, label: 'Daily Log', path: '/my-log' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user } = useUserStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      setIsAdmin(data?.role === 'admin');
    };
    checkRole();
  }, [user]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="bg-white border-b md:border-b-0 md:border-r border-gray-200 w-full md:w-64 flex-shrink-0">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center md:block">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-enb-text-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <div>
              <h1 className="font-bold text-enb-text-primary">Admin Panel</h1>
              <p className="text-xs text-enb-text-secondary">Eco-Neighbor</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm" className="md:hidden">
              <LogOut className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile: 2-row icon grid */}
        <nav className="md:hidden p-3 grid grid-cols-4 gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive ? 'bg-enb-text-primary text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="text-[10px] text-center leading-tight">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Desktop: vertical list */}
        <nav className="hidden md:flex flex-col p-4 gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <button className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full whitespace-nowrap ${
                  isActive ? 'bg-enb-text-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
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

      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}