import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw, MapPin, Shield, User, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface EscalatedCase {
  id: string;
  submission_id: string;
  mod1_id: string;
  mod2_id: string;
  decision1: string;
  decision2: string;
  reason1: string;
  reason2: string;
  mod1_name?: string;
  mod2_name?: string;
  submission?: any;
}

export default function EscalationQueue() {
  const { user } = useUserStore();
  const [cases, setCases] = useState<EscalatedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<Record<string, { decision: string; reason: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [timers, setTimers] = useState<Record<string, number>>({});
  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => { fetchCases(); }, []);

  useEffect(() => {
    cases.forEach(c => {
      if (!timerRefs.current[c.id]) {
        setTimers(t => ({ ...t, [c.id]: 0 }));
        timerRefs.current[c.id] = setInterval(() => {
          setTimers(t => ({ ...t, [c.id]: Math.min((t[c.id] || 0) + 1, 45) }));
        }, 1000);
      }
    });
    return () => {
      Object.keys(timerRefs.current).forEach(id => {
        if (!cases.find(c => c.id === id)) {
          clearInterval(timerRefs.current[id]);
          delete timerRefs.current[id];
        }
      });
    };
  }, [cases]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchCases = async () => {
    setLoading(true);

    // Fetch all escalated assignments
    const { data: assignments } = await supabase
      .from('moderator_assignments')
      .select('*')
      .eq('escalation_flag', true);

    if (!assignments || assignments.length === 0) {
      setCases([]);
      setLoading(false);
      return;
    }

    // Fetch submissions
    const subIds = assignments.map(a => a.submission_id);
    const { data: subs } = await supabase
      .from('submissions').select('*').in('id', subIds);
    const subMap = new Map((subs || []).map(s => [s.id, s]));

    // Fetch mod names
    const modIds = [...new Set(assignments.flatMap(a => [a.mod1_id, a.mod2_id].filter(Boolean)))];
    const { data: mods } = await supabase
      .from('users').select('id, full_name').in('id', modIds);
    const modMap = new Map((mods || []).map(m => [m.id, m.full_name]));

    setCases(assignments.map(a => ({
      ...a,
      mod1_name: modMap.get(a.mod1_id) || 'Moderator 1',
      mod2_name: modMap.get(a.mod2_id) || 'Moderator 2',
      submission: subMap.get(a.submission_id),
    })));
    setLoading(false);
  };

  const submitFinalDecision = async (c: EscalatedCase) => {
    if (!user) return;
    const dec = decisions[c.id];
    if (!dec?.decision || !dec?.reason || dec.reason.length < 20) return;

    setSubmitting(c.id);

    if (dec.decision === 'APPROVE') {
      // Approve via RPC
      const { error } = await supabase.rpc('approve_submission', {
        p_submission_id: c.submission_id,
        p_moderator_id: user.id,
        p_enb_amount: 500,
        p_rep_amount: 200,
        p_note: `Senior decision: ${dec.reason}`,
      });
      if (error) { showToast('❌ Error: ' + error.message); setSubmitting(null); return; }
    } else {
      // Reject
      await supabase.from('submissions').update({
        status: 'rejected',
        moderator_note: `Senior decision: ${dec.reason}`,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      }).eq('id', c.submission_id);
    }

    // Clear escalation flag
    await supabase.from('moderator_assignments')
      .update({ escalation_flag: false })
      .eq('id', c.id);

    // Pay senior mod 750 ENB
    await supabase.from('users')
      .update({ enb_local_bal: supabase.rpc as any })
      .eq('id', user.id);

    // Use raw update for senior mod payment
    const { data: seniorUser } = await supabase
      .from('users').select('enb_local_bal').eq('id', user.id).single();
    if (seniorUser) {
      await supabase.from('users')
        .update({ enb_local_bal: (seniorUser.enb_local_bal || 0) + 750 })
        .eq('id', user.id);
    }
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'MODERATOR_REWARD',
      enb_amount: 750,
      rep_change: 0,
      description: 'Senior moderator reward: escalation resolved',
    });

    showToast(dec.decision === 'APPROVE'
      ? '✅ Submission approved. +750 ENB earned for resolving escalation.'
      : '❌ Submission rejected. +750 ENB earned for resolving escalation.'
    );

    await fetchCases();
    setSubmitting(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-enb-text-primary text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" /> Escalation Queue
          </h1>
          <p className="text-sm text-enb-text-secondary">
            {cases.length} case{cases.length !== 1 ? 's' : ''} awaiting senior decision
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCases} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </header>

      {/* Info banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 space-y-1">
        <p className="font-bold">Senior Moderator Protocol</p>
        <p>Two moderators disagreed on these submissions. You see <strong>both decisions and reasons</strong> before making the final call.</p>
        <p className="flex items-center gap-2 mt-1">
          <Coins className="w-4 h-4 flex-shrink-0" />
          <span><strong>750 ENB</strong> for each escalation resolved · Minimum 45 seconds review required</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-30" />
          <p className="font-medium">No escalated cases.</p>
          <p className="text-xs mt-1">Disagreements between moderators will appear here.</p>
        </div>
      ) : (
        cases.map(c => {
          const sub = c.submission;
          const dec = decisions[c.id] || { decision: '', reason: '' };
          const isProcessing = submitting === c.id;
          const elapsed = timers[c.id] || 0;
          const canSubmit = elapsed >= 45 && dec.reason.length >= 20 && dec.decision;

          return (
            <Card key={c.id} className="border-orange-200 shadow-sm overflow-hidden">
              {/* Submission photo */}
              {sub?.photo_urls?.[0] && (
                <div className="h-52 overflow-hidden bg-gray-100">
                  <img src={sub.photo_urls[0]} alt="submission" className="w-full h-full object-cover" />
                </div>
              )}

              <CardContent className="p-5 space-y-5">
                {/* Submission info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-enb-text-primary capitalize text-lg">
                      {sub?.action_type?.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />{sub?.gps_address || 'GPS not recorded'}
                    </p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-medium">
                    Escalated
                  </span>
                </div>

                {sub?.description && (
                  <p className="text-sm text-enb-text-secondary bg-gray-50 rounded-lg p-3">
                    {sub.description}
                  </p>
                )}

                {/* Moderator decisions — the key section */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Moderator Decisions</p>

                  {/* Mod 1 */}
                  <div className={`rounded-xl p-4 border ${c.decision1 === 'APPROVE' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-enb-text-primary">{c.mod1_name}</span>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${c.decision1 === 'APPROVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.decision1 === 'APPROVE'
                          ? <><CheckCircle className="w-3 h-3" /> Approved</>
                          : <><XCircle className="w-3 h-3" /> Rejected</>
                        }
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic">"{c.reason1}"</p>
                  </div>

                  {/* Mod 2 */}
                  <div className={`rounded-xl p-4 border ${c.decision2 === 'APPROVE' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-enb-text-primary">{c.mod2_name}</span>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${c.decision2 === 'APPROVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.decision2 === 'APPROVE'
                          ? <><CheckCircle className="w-3 h-3" /> Approved</>
                          : <><XCircle className="w-3 h-3" /> Rejected</>
                        }
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic">"{c.reason2}"</p>
                  </div>
                </div>

                {/* Senior decision */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-sm font-bold text-enb-text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-500" /> Your Final Decision
                  </p>

                  <div className="flex gap-3">
                    <Button size="sm" onClick={() => setDecisions(d => ({ ...d, [c.id]: { ...dec, decision: 'APPROVE' } }))}
                      className={`flex-1 transition-all ${dec.decision === 'APPROVE' ? 'bg-enb-green text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-enb-green/10'}`}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" onClick={() => setDecisions(d => ({ ...d, [c.id]: { ...dec, decision: 'REJECT' } }))}
                      className={`flex-1 transition-all ${dec.decision === 'REJECT' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-red-50'}`}>
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>

                  {dec.decision && (
                    <div className="space-y-3">
                      <Input
                        placeholder="Detailed reasoning required (minimum 20 characters) — this is the final record"
                        value={dec.reason}
                        onChange={e => setDecisions(d => ({ ...d, [c.id]: { ...dec, reason: e.target.value } }))}
                        className={dec.reason.length > 0 && dec.reason.length < 20 ? 'border-red-300' : ''}
                      />
                      {dec.reason.length > 0 && dec.reason.length < 20 && (
                        <p className="text-xs text-red-500">{20 - dec.reason.length} more characters needed</p>
                      )}

                      {/* 45s timer */}
                      {elapsed < 45 && (
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                          <div className="flex-1 bg-orange-200 rounded-full h-1.5">
                            <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-1000"
                              style={{ width: `${(elapsed / 45) * 100}%` }} />
                          </div>
                          <span className="text-xs text-orange-700 font-medium whitespace-nowrap">
                            {45 - elapsed}s — review both sides carefully
                          </span>
                        </div>
                      )}

                      <Button
                        onClick={() => submitFinalDecision(c)}
                        disabled={!canSubmit || isProcessing}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50">
                        {isProcessing
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting final decision...</>
                          : !canSubmit && elapsed < 45
                            ? `Wait ${45 - elapsed}s more`
                            : `Submit Final ${dec.decision === 'APPROVE' ? 'Approval' : 'Rejection'}`
                        }
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
