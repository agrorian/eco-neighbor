import { useEffect, useState } from 'react';
import { Users, RefreshCw, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { formatActionLabel } from '@/lib/beforeAfter';

interface ModAssignment {
  id: string;
  submission_id: string;
  mod1_id: string;
  mod2_id: string;
  decision1: string | null;
  decision2: string | null;
  reason1: string | null;
  reason2: string | null;
  escalation_flag: boolean;
  created_at: string;
  // Joined submission data
  action_type: string;
  submitted_at: string;
  status: string;
  gps_address: string | null;
  gps_accuracy_m: number | null;
  gps_duplicate_flag: boolean;
  gps_outside_boundary: boolean;
  gps_out_of_range: boolean;
  submitter_name: string;
  // Joined moderator names
  mod1_name: string;
  mod2_name: string;
}

function DecisionBadge({ decision, label }: { decision: string | null; label: string }) {
  if (!decision) return (
    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
      <Clock className="w-3 h-3 flex-shrink-0" />
      <span className="font-medium">{label}: Pending</span>
    </div>
  );
  if (decision === 'APPROVE') return (
    <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg">
      <CheckCircle className="w-3 h-3 flex-shrink-0" />
      <span className="font-medium">{label}: Approved</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg">
      <XCircle className="w-3 h-3 flex-shrink-0" />
      <span className="font-medium">{label}: Rejected</span>
    </div>
  );
}

function GpsFlags({ row }: { row: ModAssignment }) {
  const flags = [];
  if (row.gps_accuracy_m != null && row.gps_accuracy_m > 100) {
    flags.push(<span key="acc" className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⚠️ Poor GPS ±{Math.round(row.gps_accuracy_m)}m</span>);
  }
  if (row.gps_duplicate_flag) {
    flags.push(<span key="dup" className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">🔁 Duplicate</span>);
  }
  if (row.gps_outside_boundary) {
    flags.push(<span key="bound" className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">🗺️ Outside boundary</span>);
  }
  if (row.gps_out_of_range) {
    flags.push(<span key="drift" className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">📍 GPS drift</span>);
  }
  if (flags.length === 0) return null;
  return <div className="flex flex-wrap gap-1">{flags}</div>;
}

export default function ModAssignments() {
  const [assignments, setAssignments] = useState<ModAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, bothPending: 0, onePending: 0, escalated: 0 });

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      // Fetch all non-resolved assignments
      const { data: assgn, error } = await getDb()
        .from('moderator_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !assgn) { setLoading(false); return; }

      if (assgn.length === 0) { setAssignments([]); setLoading(false); return; }

      // Fetch all related submissions
      const subIds = [...new Set(assgn.map(a => a.submission_id))];
      const { data: subs } = await getDb()
        .from('submissions')
        .select('id, action_type, submitted_at, status, gps_address, gps_accuracy_m, gps_duplicate_flag, gps_outside_boundary, gps_out_of_range, user_id')
        .in('id', subIds);

      // Fetch all moderator user names
      const modIds = [...new Set([...assgn.map(a => a.mod1_id), ...assgn.map(a => a.mod2_id)])];
      const { data: modUsers } = await getDb()
        .from('users')
        .select('id, full_name, email')
        .in('id', modIds);

      // Fetch submitter names
      const userIds = [...new Set((subs || []).map(s => s.user_id))];
      const { data: submitters } = await getDb()
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      const subMap = new Map((subs || []).map(s => [s.id, s]));
      const modMap = new Map((modUsers || []).map(u => [u.id, u.full_name || u.email || 'Unknown']));
      const submitterMap = new Map((submitters || []).map(u => [u.id, u.full_name || u.email || 'Member']));

      const enriched: ModAssignment[] = assgn.map(a => {
        const sub = subMap.get(a.submission_id) || {};
        return {
          ...a,
          action_type: (sub as any).action_type || 'unknown',
          submitted_at: (sub as any).submitted_at || a.created_at,
          status: (sub as any).status || 'pending',
          gps_address: (sub as any).gps_address || null,
          gps_accuracy_m: (sub as any).gps_accuracy_m ?? null,
          gps_duplicate_flag: (sub as any).gps_duplicate_flag === true,
          gps_outside_boundary: (sub as any).gps_outside_boundary === true,
          gps_out_of_range: (sub as any).gps_out_of_range === true,
          submitter_name: submitterMap.get((sub as any).user_id) || 'Member',
          mod1_name: modMap.get(a.mod1_id) || 'Mod 1',
          mod2_name: modMap.get(a.mod2_id) || 'Mod 2',
        };
      });

      // Stats
      const total = enriched.length;
      const bothPending = enriched.filter(a => !a.decision1 && !a.decision2 && !a.escalation_flag).length;
      const onePending = enriched.filter(a => (!!a.decision1) !== (!!a.decision2) && !a.escalation_flag).length;
      const escalated = enriched.filter(a => a.escalation_flag).length;

      setStats({ total, bothPending, onePending, escalated });
      setAssignments(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Mod Assignments
          </h1>
          <p className="text-sm text-enb-text-secondary">Super Admin view — all pending moderator assignments</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAssignments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-enb-text-primary">{stats.total}</p>
          <p className="text-xs text-enb-text-secondary mt-0.5">Total Assignments</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{stats.bothPending}</p>
          <p className="text-xs text-amber-600 mt-0.5">Both Mods Pending</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{stats.onePending}</p>
          <p className="text-xs text-blue-600 mt-0.5">Waiting for 2nd Mod</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-orange-600">{stats.escalated}</p>
          <p className="text-xs text-orange-600 mt-0.5">Escalated</p>
        </div>
      </div>

      {/* Assignment list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-enb-green" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-30" />
          <p className="font-medium">No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const bothDecided = !!a.decision1 && !!a.decision2;
            const cardBg = a.escalation_flag
              ? 'border-orange-200 bg-orange-50/30'
              : bothDecided
              ? 'border-gray-100 bg-gray-50/50 opacity-70'
              : 'border-gray-100 bg-white';

            return (
              <div key={a.id} className={`rounded-2xl border p-4 shadow-sm ${cardBg}`}>
                <div className="flex flex-col md:flex-row md:items-start gap-3">

                  {/* Left: submission info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-enb-text-primary capitalize">
                        {formatActionLabel(a.action_type)}
                      </span>
                      {a.escalation_flag && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Escalated
                        </span>
                      )}
                      {bothDecided && !a.escalation_flag && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                          ✓ Both decided
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-enb-text-secondary flex-wrap">
                      <span>👤 {a.submitter_name}</span>
                      <span>🕐 {new Date(a.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} {new Date(a.submitted_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
                      {a.gps_address && (
                        <a
                          href={`https://www.google.com/maps?q=${a.gps_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-enb-green hover:underline"
                        >
                          <MapPin className="w-3 h-3" />{a.gps_address}
                        </a>
                      )}
                    </div>

                    <GpsFlags row={a} />
                  </div>

                  {/* Right: moderator decisions */}
                  <div className="flex flex-col gap-2 md:items-end flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
                      <Shield className="w-3 h-3" />
                      <span className="font-medium">Assigned Moderators</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-24 text-right truncate">{a.mod1_name}</span>
                        <DecisionBadge decision={a.decision1} label="Mod 1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-24 text-right truncate">{a.mod2_name}</span>
                        <DecisionBadge decision={a.decision2} label="Mod 2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
