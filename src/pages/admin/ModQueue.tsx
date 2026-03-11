import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, RefreshCw, User, MapPin } from 'lucide-react';
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

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    if (!user) return;
    setLoading(true);
    const { data: assgn } = await supabase
      .from('moderator_assignments')
      .select('*')
      .or(`mod1_id.eq.${user.id},mod2_id.eq.${user.id}`)
      .is('decision1', null);

    if (assgn && assgn.length > 0) {
      const subIds = assgn.map(a => a.submission_id);
      const { data: subs } = await supabase
        .from('submissions').select('*').in('id', subIds);
      const subMap = new Map((subs || []).map(s => [s.id, s]));
      setAssignments(assgn.map(a => ({ ...a, submission: subMap.get(a.submission_id) })));
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

    // If both mods have decided, trigger auto-evaluate (approve/reject/escalate)
    const { data: updated } = await supabase
      .from('moderator_assignments')
      .select('decision1, decision2')
      .eq('id', assignment.id)
      .single();

    if (updated?.decision1 && updated?.decision2) {
      await supabase.rpc('evaluate_mod_decision', { p_assignment_id: assignment.id });
    }

    await fetchAssignments();
    setSubmitting(null);
  };

  return (
    <div className="space-y-6">
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

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-bold">Blind Review Protocol</p>
        <p className="mt-1">You see: photo, action type, GPS, description only. You cannot see other moderator's decision. Both must agree — disagreement escalates to Senior Moderator. Minimum 10 characters for reason.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-enb-green" /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-20" />
          <p className="font-medium">No assignments pending review.</p>
        </div>
      ) : (
        assignments.map(a => {
          const sub = a.submission;
          const dec = decisions[a.id] || { decision: '', reason: '' };
          const isProcessing = submitting === a.id;
          return (
            <Card key={a.id} className="border-gray-100 shadow-sm overflow-hidden">
              {sub?.photo_urls?.[0] && (
                <div className="h-48 overflow-hidden">
                  <img src={sub.photo_urls[0]} alt="submission" className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-enb-text-primary capitalize">{sub?.action_type?.replace(/_/g, ' ')}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />{sub?.gps_address || 'GPS not recorded'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{sub?.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : ''}</span>
                </div>
                {sub?.description && <p className="text-sm text-enb-text-secondary">{sub.description}</p>}

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setDecisions(d => ({ ...d, [a.id]: { ...dec, decision: 'APPROVE' } }))}
                    className={`flex-1 ${dec.decision === 'APPROVE' ? 'bg-enb-green text-white' : 'bg-gray-100 text-gray-700 hover:bg-enb-green/10'}`}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" onClick={() => setDecisions(d => ({ ...d, [a.id]: { ...dec, decision: 'REJECT' } }))}
                    className={`flex-1 ${dec.decision === 'REJECT' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-red-50'}`}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>

                {dec.decision && (
                  <>
                    <Input
                      placeholder="Reason (minimum 10 characters required)"
                      value={dec.reason}
                      onChange={(e) => setDecisions(d => ({ ...d, [a.id]: { ...dec, reason: e.target.value } }))}
                    />
                    <Button onClick={() => submitDecision(a)}
                      disabled={dec.reason.length < 10 || isProcessing}
                      className="w-full bg-enb-text-primary text-white">
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Decision'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
