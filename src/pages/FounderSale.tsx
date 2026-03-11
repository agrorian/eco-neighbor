import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, TrendingUp, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

export default function FounderSale() {
  const { user } = useUserStore();
  if (!user || !['founder', 'admin'].includes(user.role)) return <Navigate to="/" replace />;

  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('founder_sale_windows')
        .select('*')
        .eq('founder_id', user.id)
        .order('window_year', { ascending: false });
      if (data) setWindows(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto p-4">
      <header className="flex items-center gap-4">
        <Link to="/more"><Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-enb-gold" /> Founder Sale Gate
          </h1>
          <p className="text-sm text-enb-text-secondary">Controlled ENB.GLOBAL disposal windows</p>
        </div>
      </header>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Sale Window Policy</p>
          <p className="mt-1">Max 10% of accumulated ENB.GLOBAL per rolling 12 months. Two windows per year (W1: Month 6, W2: Month 12), each up to 5%. Unused W1 rolls to W2.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-enb-green" /></div>
      ) : windows.length === 0 ? (
        <Card className="border-gray-100">
          <CardContent className="p-6 text-center text-enb-text-secondary">
            <Lock className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">No sale windows open yet.</p>
            <p className="text-sm mt-1">Windows open at Month 6 and Month 12 of your vesting schedule.</p>
          </CardContent>
        </Card>
      ) : (
        windows.map(w => (
          <Card key={w.id} className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-enb-text-primary">Year {w.window_year} · Window {w.window_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.used_percent >= w.allowance_percent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {w.used_percent >= w.allowance_percent ? 'Exhausted' : 'Available'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Used</span>
                  <span className="font-mono">{w.used_percent}% / {w.allowance_percent}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-enb-gold rounded-full" style={{ width: `${Math.min((w.used_percent / w.allowance_percent) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {new Date(w.window_open_date).toLocaleDateString()} – {new Date(w.window_close_date).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Link to="/founder-hardship">
        <Button variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50">
          Apply for Hardship Exemption
        </Button>
      </Link>
    </div>
  );
}
