import { useState, useEffect } from 'react';
import { History, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { Navigate } from 'react-router-dom';

interface Redemption {
  id: string;
  enb_spent: number;
  confirmed_at: string;
  member_name: string;
  member_email: string;
}

export default function BusinessHistory() {
  const { user } = useUserStore();
  if (!user || user.role !== 'business') return <Navigate to="/" replace />;

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_business_redemption_history', {
      p_user_id: user!.id,
      p_limit: 100,
    });
    if (data?.success) setRedemptions(data.redemptions || []);
    setLoading(false);
  };

  const totalEnb = redemptions.reduce((sum, r) => sum + r.enb_spent, 0);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayRedemptions = redemptions.filter(r => new Date(r.confirmed_at) >= todayStart);
  const todayEnb = todayRedemptions.reduce((sum, r) => sum + r.enb_spent, 0);

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto">
      <header>
        <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-2">
          <History className="w-5 h-5 text-enb-teal" /> Redemption History
        </h1>
        <p className="text-sm text-enb-text-secondary">All confirmed ENB redemptions at your business</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-enb-green/20 bg-enb-green/5">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-enb-green">{todayEnb.toLocaleString()}</div>
            <div className="text-xs text-enb-text-secondary uppercase tracking-wider mt-1">ENB Today</div>
            <div className="text-xs text-gray-400 mt-0.5">{todayRedemptions.length} redemptions</div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-700">{totalEnb.toLocaleString()}</div>
            <div className="text-xs text-enb-text-secondary uppercase tracking-wider mt-1">All Time ENB</div>
            <div className="text-xs text-gray-400 mt-0.5">{redemptions.length} redemptions</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-enb-green" /></div>
      ) : redemptions.length === 0 ? (
        <Card className="border-gray-100">
          <CardContent className="p-8 text-center space-y-2">
            <History className="w-10 h-10 mx-auto text-gray-200" />
            <p className="font-medium text-enb-text-secondary">No redemptions yet</p>
            <p className="text-sm text-gray-400">Confirmed redemptions will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {redemptions.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-enb-teal/10 flex items-center justify-center text-enb-teal font-bold text-sm flex-shrink-0">
                  {(r.member_name || r.member_email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm text-enb-text-primary">{r.member_name || 'Member'}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.confirmed_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(r.confirmed_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-enb-green text-sm">{r.enb_spent.toLocaleString()} ENB</div>
                <div className="text-xs text-gray-400">accepted</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
