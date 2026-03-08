import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Trophy, ArrowRightLeft, Settings, HelpCircle, LogOut, Globe, Vote, Store, LayoutDashboard } from 'lucide-react';
import { useUserStore } from '@/store/user';

export default function More() {
  const { logout } = useUserStore();

  const menuItems = [
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', color: 'text-enb-gold' },
    { icon: Globe, label: 'Impact', path: '/impact', color: 'text-enb-green' },
    { icon: Vote, label: 'Governance', path: '/governance', color: 'text-blue-600' },
    { icon: Store, label: 'Directory', path: '/directory', color: 'text-orange-500' },
    { icon: ArrowRightLeft, label: 'Bridge', path: '/bridge', color: 'text-enb-teal' },
    { icon: LayoutDashboard, label: 'Admin Panel', path: '/admin', color: 'text-purple-600' },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'text-gray-600' },
  ];

  return (
    <div className="space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-enb-text-primary">More</h1>
        <p className="text-enb-text-secondary">Explore additional features</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <Link key={item.label} to={item.path}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-6 hover:bg-gray-50 transition-colors h-32">
              <item.icon className={`w-8 h-8 mb-2 ${item.color}`} />
              <span className="font-medium text-enb-text-primary">{item.label}</span>
            </div>
          </Link>
        ))}
        
        <button onClick={logout} className="col-span-2">
          <div className="bg-white rounded-xl border border-red-100 shadow-sm flex items-center justify-center p-4 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5 mr-2 text-red-500" />
            <span className="font-medium text-red-600">Log Out</span>
          </div>
        </button>
      </div>
    </div>
  );
}
