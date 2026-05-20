import { useState, useEffect } from 'react';
import {
  ArrowRightLeft, CheckCircle, XCircle, Clock,
  AlertTriangle, RefreshCw, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface BridgeRequest {
  id: string;
  user_id: string;
  requested_amount: number;
  ecp_snapshot: number;
  prior_converted: number;
  max_convertible: number;
  event_number: number;
  governance_required: boolean;
  status: string;
  wallet_address: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  user?: { full_name: string; rep_score: number; tier: string; enb_local_bal: number };
}

const STATUS_COLORS: Record<string, string> = {
  pending:            'bg-amber-100 text-amber-700 border-amber-200',
  governance_pending: 'bg-blue-100 text-blue-700 border-blue-200',
  approved:           'bg-green-100 text-green-700 border-green-200',
  rejected:           'bg-red-100 text-red-700 border-red-200',
};

function RequestCard({
  req,
  onApprove,
  onReject,
  processing,
}: {
  req: BridgeRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  processing: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const isPending = req.status === 'pending' || req.status === 'governance_pending';
  const pct = req.ecp_snapshot > 0
    ? ((req.requested_amount / req.ecp_snapshot) * 100).toFixed(1)
    : '0';

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardContent className="p-5 space-y-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-enb-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-enb-teal" />
            </div>
            <div>
              <div className="font-bold text-enb-text-primary">
                {req.user?.full_name || req.user_id.slice(0, 8) + '…'}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  {req.user?.tier || '—'}
                </span>
                <span>{req.user?.rep_score?.toLocaleString() || 0} Rep</span>
                <span>Event {req.event_number}/2</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-xs border ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
              {req.status.replace('_', ' ')}
            </Badge>
            {req.governance_required && (
              <Badge className="text-xs border bg-purple-100 text-purple-700 border-purple-200">
                GOV VOTE
              </Badge>
            )}
          </div>
        </div>

        {/* Amount block */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-enb-text-secondary">Requested</div>
            <div className="font-bold text-enb-text-primary">{req.requested_amount.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400">ENB.LOCAL</div>
          </div>
          <div className="bg-enb-green/5 rounded-xl p-3">
            <div className="text-xs text-enb-text-secondary">ECP Snapshot</div>
            <div className="font-bold text-enb-green">{req.ecp_snapshot.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400">aged tokens</div>
          </div>
          <div className="bg-enb-gold/5 rounded-xl p-3">
            <div className="text-xs text-enb-text-secondary">% of ECP</div>
            <div className="font-bold text-enb-gold">{pct}%</div>
            <div className="text-[10px] text-gray-400">max 25%</div>
          </div>
        </div>

        {/* Validation check */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            {req.requested_amount <= req.max_convertible
              ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              : <XCircle className="w-3.5 h-3.5 text-red-500" />}
            <span>Amount within 25% cap ({req.max_convertible.toLocaleString()} ENB max)</span>
          </div>
          <div className="flex items-center gap-2">
            {req.wallet_address
              ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              : <XCircle className="w-3.5 h-3.5 text-red-500" />}
            <span className="font-mono">
              {req.wallet_address
                ? req.wallet_address.slice(0, 8) + '…' + req.wallet_address.slice(-8)
                : 'No wallet address — cannot approve'}
            </span>
          </div>
          {req.prior_converted > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Prior converted: {req.prior_converted.toLocaleString()} ENB</span>
            </div>
          )}
          {req.governance_required && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-purple-700 font-medium">
                Governance vote required (amount &gt; 500,000 ENB)
              </span>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          className="flex items-center gap-1 text-xs text-enb-text-secondary hover:text-enb-text-primary"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide details' : 'Show full details'}
        </button>

        {expanded && (
          <div className="text-xs text-enb-text-secondary space-y-1 bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between"><span>User ID</span><span className="font-mono">{req.user_id}</span></div>
            <div className="flex justify-between"><span>Requested at</span><span>{new Date(req.requested_at).toLocaleString('en-GB')}</span></div>
            <div className="flex justify-between"><span>Current ENB.LOCAL</span><span>{req.user?.enb_local_bal?.toLocaleString() || '—'}</span></div>
            <div className="flex justify-between"><span>Event number</span><span>{req.event_number} of 2</span></div>
          </div>
        )}

        {/* Action buttons */}
        {isPending && (
          <div className="space-y-2 pt-1">
            {showRejectInput ? (
              <div className="space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (required)"
                  className="w-full p-3 text-sm border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-red-300 outline-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm" className="flex-1"
                    onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    disabled={!rejectReason.trim() || processing === req.id}
                    onClick={() => onReject(req.id, rejectReason)}
                  >
                    {processing === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowRejectInput(true)}
                  disabled={processing === req.id}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white"
                  disabled={
                    processing === req.id ||
                    !req.wallet_address ||
                    req.requested_amount > req.max_convertible ||
                    (req.governance_required && req.status !== 'governance_pending')
                  }
                  onClick={() => onApprove(req.id)}
                >
                  {processing === req.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BridgeManager() {
  const { user } = useUserStore();
  const [requests, setRequests] = useState<BridgeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = getDb()
        .from('bridge_requests')
        .select(`
          *,
          user:users!bridge_requests_user_id_fkey(full_name, rep_score, tier, enb_local_bal)
        `)
        .order('requested_at', { ascending: false });

      if (filter !== 'all') {
        if (filter === 'pending') {
          query = query.in('status', ['pending', 'governance_pending']);
        } else {
          query = query.eq('status', filter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests((data || []) as BridgeRequest[]);
    } catch (err: any) {
      showToast('Failed to load requests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleApprove = async (requestId: string) => {
    if (!user?.id) return;
    setProcessing(requestId);
    try {
      const { data, error } = await getDb().rpc('approve_bridge_request', {
        p_request_id: requestId,
        p_reviewer_id: user.id,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      showToast('✅ Bridge conversion approved. ENB.GLOBAL credited to user.');
      await fetchRequests();
    } catch (err: any) {
      showToast('❌ Approval failed: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!user?.id) return;
    setProcessing(requestId);
    try {
      const { error } = await getDb()
        .from('bridge_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', requestId);
      if (error) throw error;
      showToast('❌ Bridge request rejected.');
      await fetchRequests();
    } catch (err: any) {
      showToast('Failed to reject: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = requests.filter(r =>
    r.status === 'pending' || r.status === 'governance_pending'
  ).length;

  return (
    <div className="space-y-6 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-enb-text-primary text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-enb-teal" />
            Bridge Manager
          </h1>
          <p className="text-sm text-enb-text-secondary">
            ENB.LOCAL → ENB.GLOBAL conversions · ECP model v6.3
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {/* How the ECP model works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
        <p className="font-bold text-blue-900 mb-1">v6.3 ECP Model — Review Rules</p>
        <p>• ECP = tokens aged 365+ days (from approval date) − FIFO debits − prior conversions</p>
        <p>• Max convertible = 25% of ECP at time of request (recalculated at approval)</p>
        <p>• Maximum 2 lifetime events per user · Minimum 3-year gap · Pillar Tier required</p>
        <p>• Conversions &gt; 500,000 ENB require governance vote before approval</p>
        <p>• Approval RPC re-verifies eligibility in real time — cannot approve stale requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-enb-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'pending' ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400">
          <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No {filter === 'all' ? '' : filter} requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              onApprove={handleApprove}
              onReject={handleReject}
              processing={processing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
