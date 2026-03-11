import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingDown, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

export default function PartnerFloat() {
  const { user } = useUserStore();
  if (!user || !['business', 'admin'].includes(user.role)) return <Navigate to="/" replace />;

  const [floatData, setFloatData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => { fetchFloat(); }, []);

  const fetchFloat = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('business_partners')
      .select('enb_float_balance, enb_float_total, float_alert_status, last_replenishment_date, float_replenishment_log')
      .eq('user_id', user!.id)
      .single();
    if (data) setFloatData(data);
    setLoading(false);
  };

  const checkStatus = async () => {
    setChecking(true);
    const { data: partner } = await supabase
      .from('business_partners').select('id').eq('user_id', user!.id).single();
    if (partner) {
      await supabase.rpc('check_float_status', { p_partner_id: partner.id });
      await fetchFloat();
    }
    setChecking(false);
  };

  const floatPct = floatData ? Math.round((floatData.enb_float_balance / floatData.enb_float_total) * 100) : 0;
  const alertColor = floatPct <= 30 ? 'text-red-600 bg-red-50 border-red-200'
    : floatPct <= 40 ? 'text-orange-600 bg-orange-50 border-orange-200'
    : 'text-enb-green bg-enb-green/5 border-enb-green/20';

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto p-4">
      <header className="flex items-center gap-4">
        <Link to="/more"><Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-enb-teal" /> Float Monitor
          </h1>
          <p className="text-sm text-enb-text-secondary">Your ENB acceptance float balance</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-enb-green" /></div>
      ) : !floatData ? (
        <Card className="border-gray-100">
          <CardContent className="p-6 text-center text-enb-text-secondary">
            <p>No business partner record found for your account.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className={`border ${alertColor}`}>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-3xl font-bold">{floatData.enb_float_balance?.toLocaleString()} ENB</div>
                  <div className="text-sm opacity-70">of {floatData.enb_float_total?.toLocaleString()} total float</div>
                </div>
                <div className={`text-2xl font-bold ${floatPct <= 30 ? 'text-red-600' : floatPct <= 40 ? 'text-orange-500' : 'text-enb-green'}`}>
                  {floatPct}%
                </div>
              </div>
              <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${floatPct <= 30 ? 'bg-red-500' : floatPct <= 40 ? 'bg-orange-400' : 'bg-enb-green'}`}
                  style={{ width: `${floatPct}%` }} />
              </div>
              <div className="text-sm font-medium">
                Status: {floatData.float_alert_status === 'OK' ? '✅ Healthy' : floatData.float_alert_status === 'ALERT_40' ? '⚠️ Low — top-up recommended' : '🔴 Critical — auto-replenishment triggered'}
              </div>
            </CardContent>
          </Card>

          {floatPct <= 40 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{floatPct <= 30 ? 'Critical Float Level' : 'Low Float Warning'}</p>
                <p className="mt-1">{floatPct <= 30
                  ? 'Auto-replenishment initiated if redemption activity exists. Neighbourhood moderator notified.'
                  : 'Your float is approaching the 30% threshold. Consider requesting a top-up.'}</p>
              </div>
            </div>
          )}

          <Button onClick={checkStatus} disabled={checking} variant="outline" className="w-full">
            {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</> : <><RefreshCw className="w-4 h-4 mr-2" />Refresh Float Status</>}
          </Button>
        </>
      )}
    </div>
  );
}
