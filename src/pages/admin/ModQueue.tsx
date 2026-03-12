import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, RefreshCw, MapPin, AlertTriangle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface Assignment {
  id: string;
  submission_id: string;
  mod1_id: string;
  mod2_id: string;
  decision1: string | null;
  decision2: string | null;
  reason1: string | null;
  reason2: string | null;
  escalation_flag: boolean;
  submission?: any;
}

export default function ModQueue() {
  const { user } = useUserStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<Record<string, { decision: string; reason: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchAssignments(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchAssignments = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch all assignments where this user is mod1 OR mod2
    const { data: assgn } = await supabase
      .from('moderator_assignments')
      .select('*')
      .or(`mod1_id.eq.${user.id},mod2_id.eq.${user.id}`)
      .eq('escalation_flag', false);

    if (assgn && assgn.length > 0) {
      // Filter: only show ones where THIS mod hasn't decided yet
      const pending = assgn.filter(a => {
        const isM1 = a.mod1_id === user.id;
        return isM1 ? !a.decision1 : !a.decision2;
      });

      if (pending.length > 0) {
        const subIds = pending.map(a => a.submission_id);
        const { data: subs } = await supabase
          .from('submissions').select('*').in('id', subIds);
        const subMap = new Map((subs || []).map(s => [s.id, s]));
        setAssignments(pending.map(a => ({ ...a, submission: subMap.get(a.submission_id) })));
      } else {
        setAssignments([]);
      }
    } else {
      setAssignments([]);
    }
    setLoading(false);
  };

  const submitDecision = async (assignment: Assignment) => {
    if (!user) return;
    const dec = decisions[assignment.id];
    if (!dec?.decision || !dec?.reason || dec.reason.length < 10) return;

    setSubmitting(assignment.id);
    const isM1 = assignment.mod1_id === user.id;
    const update: any = isM1
      ? { decision1: dec.decision, reason1: dec.reason }
      : { decision2: dec.decision, reason2: dec.reason };

    await supabase.from('moderator_assignments').update(update).eq('id', assignment.id);

    // Check if both mods have now decided
    const { data: updated } = await supabase
      .from('moderator_assignments')
      .select('decision1, decision2')
      .eq('id', assignment.id)
      .single();

    if (updated?.decision1 && updated?.decision2) {
      const { data: result } = await supabase.rpc('evaluate_mod_decision', { p_assignment_id: assignment.id });
      if (result?.status === 'approved') showToast('✅ Both mods agreed — submission approved! +500 ENB earned.');
      else if (result?.status === 'rejected') showToast('❌ Both mods agreed — submission rejected. +200 ENB earned.');
      else if (result?.status === 'escalated_to_senior') showToast('⚠️ Disagreement recorded — escalated to Senior Moderator.');
    } else {
      showToast('✅ Decision submitted. Waiting for second moderator.');
    }

    await fetchAssignments();
    setSubmitting(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-enb-text-primary text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" /> Moderator Queue
          </h1>
          <p className="text-sm text-enb-text-secondary">Blind review — {assignments.length} assigned to you</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAssignments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </header>

      {/* Protocol banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-bold">Blind Review Protocol</p>
        <p>You see: photo, action type, GPS, description only. You cannot see the other moderator's decision.</p>
        <p className="flex items-center gap-2 mt-2">
          <Coins className="w-4 h-4 text-enb-gold flex-shrink-0" />
          <span><strong>500 ENB</strong> for approved · <strong>200 ENB</strong> for legitimate reject · <strong>0</strong> if escalated</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-enb-green" /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-30" />
          <p className="font-medium">No assignments pending review.</p>
          <p className="text-xs mt-1">New submissions will appear here automatically.</p>
        </div>
      ) : (
        assignments.map(a => {
          const sub = a.submission;
          const dec = decisions[a.id] || { decision: '', reason: '' };
          const isProcessing = submitting === a.id;
          return (
            <Card key={a.id} className="border-gray-100 shadow-sm overflow-hidden">
              {/* Photo */}
              {sub?.photo_urls?.[0] && (
                <div className="h-52 overflow-hidden bg-gray-100">
                  <img src={sub.photo_urls[0]} alt="submission" className="w-full h-full object-cover" />
                </div>
              )}

              <CardContent className="p-5 space-y-4">
                {/* Action info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-enb-text-primary capitalize text-lg">
                      {sub?.action_type?.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {sub?.gps_address || 'GPS not recorded'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    {sub?.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-PK') : ''}
                  </span>
                </div>

                {sub?.description && (
                  <p className="text-sm text-enb-text-secondary bg-gray-50 rounded-lg p-3">{sub.description}</p>
                )}

                {/* Escalation warning */}
                {a.escalation_flag && (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>This submission is escalated — moderators disagreed. Senior review required.</span>
                  </div>
                )}

                {/* Decision buttons */}
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => setDecisions(d => ({ ...d, [a.id]: { ...dec, decision: 'APPROVE' } }))}
                    className={`flex-1 transition-all ${dec.decision === 'APPROVE'
                      ? 'bg-enb-green text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-enb-green/10 hover:text-enb-green'}`}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" onClick={() => setDecisions(d => ({ ...d, [a.id]: { ...dec, decision: 'REJECT' } }))}
                    className={`flex-1 transition-all ${dec.decision === 'REJECT'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'}`}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>

                {/* Reason + Submit */}
                {dec.decision && (
                  <div className="space-y-3 pt-1">
                    <Input
                      placeholder="Reason for your decision (minimum 10 characters)"
                      value={dec.reason}
                      onChange={(e) => setDecisions(d => ({ ...d, [a.id]: { ...dec, reason: e.target.value } }))}
                      className={dec.reason.length > 0 && dec.reason.length < 10 ? 'border-red-300' : ''}
                    />
                    {dec.reason.length > 0 && dec.reason.length < 10 && (
                      <p className="text-xs text-red-500">{10 - dec.reason.length} more characters needed</p>
                    )}
                    <Button
                      onClick={() => submitDecision(a)}
                      disabled={dec.reason.length < 10 || isProcessing}
                      className="w-full bg-enb-text-primary text-white hover:bg-enb-text-primary/90">
                      {isProcessing
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                        : `Submit ${dec.decision === 'APPROVE' ? 'Approval' : 'Rejection'}`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
