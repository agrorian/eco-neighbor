import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingDown, AlertCircle, Loader2, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { supabase, getDb } from '@/lib/supabase';

interface FloatData {
  id: string;
  enb_float: number;
  enb_float_allocated: number;
  float_alert_status: string;
  last_replenishment_date: string | null;
  float_replenishment_log: any[];
}

interface ReplenishmentRequest {
  id: string;
  requested_at: string;
  float_at_request: number;
  float_allocated: number;
  float_pct: number;
  recent_swaps: number;
  top_up_amount: number;
  status: string;
  is_fraud_flag: boolean;
  admin_note: string | null;
}

export default function PartnerFloat() {
  const { user } = useUserStore();
  if (!user || !['business', 'admin', 'super_admin'].includes(user.role)) return <Navigate to="/" replace />;

  const [floatData, setFloatData] = useState<FloatData | null>(null);
  const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: partner } = await getDb()
      .from('business_partners')
      .select('id, enb_float, enb_float_allocated, float_alert_status, last_replenishment_date, float_replenishment_log')
      .eq('owner_user_id', user!.id)
      .single();

    if (partner) {
      setFloatData(partner);
      const { data: reqs } = await getDb()
        .from('replenishment_requests')
        .select('*')
        .eq('business_id', partner.id)
        .order('requested_at', { ascending: false })
        .limit(5);
      setRequests(reqs || []);
    }
    setLoading(false);
  };

  const checkStatus = async () => {
    setChecking(true);
    const { data: partner } = await getDb()
      .from('business_partners')
      .select('id')
      .eq('owner_user_id', user!.id)
      .single();
    if (partner) {
      await getDb().rpc('check_float_status', { p_partner_id: partner.id });
      await fetchAll();
    }
    setChecking(false);
  };

  const floatAmt = floatData?.enb_float ?? 0;
  const floatAllocated = floatData?.enb_float_allocated ?? 0;
  const floatPct = floatAllocated > 0 ? Math.round((floatAmt / floatAllocated) * 100) : 100;
  const alertStatus = floatData?.float_alert_status ?? 'OK';
  const pendingRequest = requests.find(r => r.status === 'pending');

  const barColor = floatPct <= 30 ? 'bg-red-500' : floatPct <= 40 ? 'bg-amber-500' : 'bg-enb-green';
  const alertBg = alertStatus === 'ALERT_30' ? 'border-red-200 bg-red-50' :
                  alertStatus === 'ALERT_40' ? 'border-amber-200 bg-amber-50' :
                  'border-enb-green/20 bg-enb-green/5';

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto p-4">
      <header className="flex items-center gap-4">
        <Link to="/more">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-enb-teal" /> Float Monitor
          </h1>
          <p className="text-sm text-enb-text-secondary">Your ENB acceptance float balance</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
        </div>
      ) : !floatData ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-enb-text-secondary space-y-2">
          <TrendingDown className="w-10 h-10 mx-auto opacity-20" />
          <p className="font-medium">No business partner record found.</p>
          <p className="text-sm">Contact the admin to set up your float account.</p>
        </div>
      ) : (
        <>
          {/* Main float card */}
          <div className={`rounded-2xl border ${alertBg} p-5 space-y-4`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold text-enb-text-primary">{floatAmt.toLocaleString()} ENB</div>
                <div className="text-sm text-enb-text-secondary mt-0.5">Current float balance</div>
              </div>
              <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                alertStatus === 'ALERT_30' ? 'bg-red-100 text-red-700' :
                alertStatus === 'ALERT_40' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                {alertStatus === 'OK' ? '✅ Healthy' :
                 alertStatus === 'ALERT_40' ? '⚠️ Low' : '🔴 Critical'}
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-enb-text-secondary mb-1.5">
                <span>{floatPct}% remaining</span>
                <span>Allocated: {floatAllocated.toLocaleString()} ENB</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.min(floatPct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span className="text-amber-500 font-medium">40% ⚠</span>
                <span className="text-red-500 font-medium">30% 🔄</span>
                <span>100%</span>
              </div>
            </div>

            {floatData.last_replenishment_date && (
              <p className="text-xs text-gray-500">
                Last replenishment: {new Date(floatData.last_replenishment_date).toLocaleDateString('en-PK', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            )}
          </div>

          {/* Alert explanations */}
          {alertStatus === 'ALERT_40' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-bold">Low Float Warning</p>
                <p className="mt-1">Your float has dropped below 40%. No action needed yet — this is an early warning. If SWAP activity continues at this pace, a top-up request will be automatically submitted when you reach 30%.</p>
              </div>
            </div>
          )}

          {alertStatus === 'ALERT_30' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-bold">Critical Float Level — Top-Up Requested</p>
                <p className="mt-1">Your float has dropped below 30%. A replenishment request of {Math.round(floatAllocated * 0.5).toLocaleString()} ENB (50% of your allocated float) has been automatically submitted to the Eco-Neighbor team for approval.</p>
              </div>
            </div>
          )}

          {/* Pending replenishment request */}
          {pendingRequest && (
            <div className="bg-white rounded-2xl border border-blue-100 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-enb-text-primary">Replenishment Request Pending</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-enb-text-secondary">
                <div>Top-up amount: <span className="font-semibold text-enb-text-primary">{pendingRequest.top_up_amount.toLocaleString()} ENB</span></div>
                <div>Float at request: <span className="font-semibold text-enb-text-primary">{pendingRequest.float_pct}%</span></div>
                <div>SWAPs (30 days): <span className="font-semibold text-enb-text-primary">{pendingRequest.recent_swaps}</span></div>
                <div>Requested: <span className="font-semibold text-enb-text-primary">{new Date(pendingRequest.requested_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span></div>
              </div>
              {pendingRequest.admin_note && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2">{pendingRequest.admin_note}</p>
              )}
            </div>
          )}

          {/* ARP explained */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wide">Auto-Replenishment Protocol (ARP)</p>
            <div className="space-y-1.5 text-xs text-enb-text-secondary">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold flex-shrink-0">40%</span>
                <span>Early warning notification sent. No action required.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold flex-shrink-0">30%</span>
                <span>Top-up request auto-submitted (50% of allocated float). Requires verified SWAP activity in last 30 days.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 font-bold flex-shrink-0">0%</span>
                <span>Float exhausted — SWAPs paused until replenishment approved by admin.</span>
              </div>
            </div>
          </div>

          {/* Recent requests history */}
          {requests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wide px-1">Request History</p>
              {requests.map(req => (
                <div key={req.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-enb-text-primary">+{req.top_up_amount.toLocaleString()} ENB</p>
                    <p className="text-xs text-gray-400">{new Date(req.requested_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    req.is_fraud_flag ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {req.is_fraud_flag && req.status === 'pending' ? '🔍 Under Review' :
                     req.status === 'approved' ? '✅ Approved' :
                     req.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button onClick={checkStatus} disabled={checking} variant="outline" className="w-full">
            {checking
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</>
              : <><RefreshCw className="w-4 h-4 mr-2" />Refresh Float Status</>}
          </Button>
        </>
      )}
    </div>
  );
}
