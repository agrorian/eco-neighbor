import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, ArrowRightLeft, Activity, AlertCircle, TrendingUp, Loader2, AlertTriangle, Eye, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  pendingQueue: number;
  escalationCount: number;
  bridgeRequests: number;
  enbDistributedToday: number;
  enbDistributedAllTime: number;
}

interface ModPairStat {
  mod1_id: string;
  mod2_id: string;
  mod1_name: string;
  mod2_name: string;
  total_reviews: number;
  agreements: number;
  agreement_pct: number;
  flagged: boolean;
}

interface AbsenceAlert {
  id: string;
  email: string;
  full_name: string;
  role: string;
  consecutive_absences: number;
  last_log_date: string | null;
  formal_absence_flagged: boolean;
  absence_status: 'WARNING' | 'FORMAL_ABSENCE';
}

interface PendingSubmission {
  id: string;
  action_type: string;
  description: string;
  photo_urls: string[];
  gps_lat: number | null;
  gps_lng: number | null;
  gps_address: string | null;
  submitted_at: string;
  enb_awarded: number;
  submitter_email: string;
  submitter_name: string;
  mod1_email: string | null;
  mod1_name: string | null;
  mod1_decision: string | null;
  mod2_email: string | null;
  mod2_name: string | null;
  mod2_decision: string | null;
  queue_type: 'unassigned' | 'mod_review' | 'escalated';
}

const ACTION_LABELS: Record<string, string> = {
  neighbourhood_cleanup: 'Neighbourhood Cleanup',
  recycling_dropoff: 'Recycling Drop-off',
  waste_reporting: 'Waste Reporting',
  infrastructure_report: 'Infrastructure Report',
  trade_job: 'Trade Job',
  tree_planting: 'Tree Planting',
  carpool: 'Carpool',
  skill_workshop: 'Skill Workshop',
  food_sharing: 'Food Sharing',
  water_reporting: 'Water Reporting',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, pendingQueue: 0, escalationCount: 0,
    bridgeRequests: 0, enbDistributedToday: 0, enbDistributedAllTime: 0,
  });
  const [modPairs, setModPairs] = useState<ModPairStat[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [absenceAlerts, setAbsenceAlerts] = useState<AbsenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    // Step 1: All mod assignments
    const { data: assignments } = await supabase
      .from('moderator_assignments')
      .select('submission_id, escalation_flag, mod1_id, mod2_id, decision1, decision2');

    const assignedIds = (assignments || []).map((a: any) => a.submission_id).filter(Boolean);
    const escalatedIds = (assignments || []).filter((a: any) => a.escalation_flag).map((a: any) => a.submission_id);
    const assignmentMap = new Map((assignments || []).map((a: any) => [a.submission_id, a]));

    // Step 2: All pending submissions
    const { data: subs } = await supabase
      .from('submissions')
      .select('id, action_type, description, photo_urls, gps_lat, gps_lng, gps_address, submitted_at, enb_awarded, user_id')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    // Step 3: Fetch user details for submitters and mods
    const allUserIds = new Set<string>();
    (subs || []).forEach((s: any) => allUserIds.add(s.user_id));
    (assignments || []).forEach((a: any) => {
      if (a.mod1_id) allUserIds.add(a.mod1_id);
      if (a.mod2_id) allUserIds.add(a.mod2_id);
    });

    const { data: users } = allUserIds.size > 0
      ? await supabase.from('users').select('id, email, full_name').in('id', [...allUserIds])
      : { data: [] };
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Step 4: Build enriched pending submissions list
    const enriched: PendingSubmission[] = (subs || []).map((s: any) => {
      const submitter = userMap.get(s.user_id);
      const assignment = assignmentMap.get(s.id);
      const mod1 = assignment ? userMap.get(assignment.mod1_id) : null;
      const mod2 = assignment ? userMap.get(assignment.mod2_id) : null;

      let queue_type: 'unassigned' | 'mod_review' | 'escalated' = 'unassigned';
      if (assignment?.escalation_flag) queue_type = 'escalated';
      else if (assignment) queue_type = 'mod_review';

      return {
        id: s.id,
        action_type: s.action_type,
        description: s.description,
        photo_urls: s.photo_urls || [],
        gps_lat: s.gps_lat,
        gps_lng: s.gps_lng,
        gps_address: s.gps_address,
        submitted_at: s.submitted_at,
        enb_awarded: s.enb_awarded,
        submitter_email: submitter?.email || 'Unknown',
        submitter_name: submitter?.full_name || submitter?.email || 'Unknown',
        mod1_email: mod1?.email || null,
        mod1_name: mod1?.full_name || mod1?.email || null,
        mod1_decision: assignment?.decision1 || null,
        mod2_email: mod2?.email || null,
        mod2_name: mod2?.full_name || mod2?.email || null,
        mod2_decision: assignment?.decision2 || null,
        queue_type,
      };
    });

    setPendingSubmissions(enriched);

    // Step 5: Stats
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [usersRes, bridgeRes, allTimeRes, todayTxRes, modStatsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('bridge_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('users').select('lifetime_earned'),
      supabase.from('transactions').select('enb_amount').eq('type', 'earn').gte('created_at', todayStart.toISOString()),
      supabase.rpc('get_mod_agreement_stats'),
    ]);

    let pendingCount = (subs || []).length;

    setStats({
      totalUsers: usersRes.count ?? 0,
      pendingQueue: pendingCount,
      escalationCount: escalatedIds.length,
      bridgeRequests: bridgeRes.count ?? 0,
      enbDistributedToday: (todayTxRes.data || []).reduce((s: number, t: any) => s + (Number(t.enb_amount) || 0), 0),
      enbDistributedAllTime: (allTimeRes.data || []).reduce((s: number, u: any) => s + (Number(u.lifetime_earned) || 0), 0),
    });

    setModPairs(Array.isArray(modStatsRes.data) ? modStatsRes.data : []);

    // Fetch absence alerts
    const { data: absences } = await supabase
      .from('absence_alerts')
      .select('*');
    setAbsenceAlerts(absences || []);

    setLoading(false);
  };

  const flaggedPairs = modPairs.filter(p => p.flagged);

  const KPI_CARDS = [
    { icon: Users, label: 'Total Members', value: stats.totalUsers.toLocaleString(), color: 'bg-blue-100 text-blue-600' },
    { icon: CheckSquare, label: 'Pending Queue', value: stats.pendingQueue.toString(), color: 'bg-orange-100 text-orange-600' },
    { icon: AlertTriangle, label: 'Escalations', value: stats.escalationCount.toString(), color: 'bg-red-100 text-red-600' },
    { icon: ArrowRightLeft, label: 'Bridge Requests', value: stats.bridgeRequests.toString(), color: 'bg-enb-teal/10 text-enb-teal' },
    { icon: Activity, label: 'ENB Today', value: stats.enbDistributedToday.toLocaleString(), color: 'bg-enb-green/10 text-enb-green' },
  ];

  const queueBadge = (type: PendingSubmission['queue_type']) => {
    if (type === 'escalated') return <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">Escalated</span>;
    if (type === 'mod_review') return <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">In Review</span>;
    return <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">Unassigned</span>;
  };

  const decisionBadge = (decision: string | null) => {
    if (decision === 'APPROVE') return <span className="text-[10px] text-green-600 font-semibold">✓ Approved</span>;
    if (decision === 'REJECT') return <span className="text-[10px] text-red-600 font-semibold">✗ Rejected</span>;
    return <span className="text-[10px] text-gray-400">Pending</span>;
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-enb-text-secondary">System Overview</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
          <Activity className="w-4 h-4" />
          System Operational
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />Loading stats...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {KPI_CARDS.map((kpi) => (
              <Card key={kpi.label} className="border-gray-100 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-enb-text-secondary font-medium">{kpi.label}</p>
                    <h3 className="text-2xl font-bold text-enb-text-primary mt-1">{kpi.value}</h3>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pending card */}
            <Card className="border-orange-100 bg-orange-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />Pending Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 mb-4">
                  There are <span className="font-bold">{stats.pendingQueue} items</span> waiting for review.
                </p>
                <Link to="/admin/queue">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-200">Review Queue</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Escalations */}
            {stats.escalationCount > 0 && (
              <Card className="border-red-200 bg-red-50/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />Mod Disagreements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-4">
                    <span className="font-bold">{stats.escalationCount} submission{stats.escalationCount > 1 ? 's' : ''}</span> need{stats.escalationCount === 1 ? 's' : ''} your final decision.
                  </p>
                  <Link to="/admin/escalation">
                    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200">Resolve Now</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* ENB All Time */}
            <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />ENB Distributed (All Time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{stats.enbDistributedAllTime.toLocaleString()}</div>
                <div className="text-xs text-blue-600 uppercase tracking-wider font-medium mt-1">ENB Distributed All Time</div>
              </CardContent>
            </Card>
          </div>

          {/* ── PENDING SUBMISSIONS LIST ── */}
          {pendingSubmissions.length > 0 && (
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-500" />
                  All Pending Submissions
                  <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{pendingSubmissions.length}</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={fetchAll} className="text-xs">
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {pendingSubmissions.map((sub) => (
                    <div key={sub.id} className="hover:bg-gray-50 transition-colors">
                      {/* Row — always visible */}
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Photo thumbnail */}
                          {sub.photo_urls[0] && (
                            <img src={sub.photo_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-sm text-enb-text-primary">
                                {ACTION_LABELS[sub.action_type] || sub.action_type.replace(/_/g, ' ')}
                              </span>
                              {queueBadge(sub.queue_type)}
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div>👤 <span className="font-medium">{sub.submitter_name}</span> · {sub.submitter_email}</div>
                              <div>🕐 {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })} · {new Date(sub.submitted_at).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })}</div>
                              {sub.mod1_name && (
                                <div>
                                  👮 {sub.mod1_name} {decisionBadge(sub.mod1_decision)}
                                  {sub.mod2_name && <> · {sub.mod2_name} {decisionBadge(sub.mod2_decision)}</>}
                                </div>
                              )}
                              {!sub.mod1_name && <div className="text-orange-500">⚠️ Not yet assigned to moderators</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-enb-green">{sub.enb_awarded} ENB</span>
                            {expandedId === sub.id
                              ? <ChevronUp className="w-4 h-4 text-gray-400" />
                              : <ChevronDown className="w-4 h-4 text-gray-400" />
                            }
                          </div>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {expandedId === sub.id && (
                        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3">
                          {/* All photos */}
                          {sub.photo_urls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 pt-3">
                              {sub.photo_urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt={`Photo ${i+1}`} className="w-full h-28 object-cover rounded-lg border border-gray-200 hover:opacity-90" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Description */}
                          {sub.description && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-sm text-enb-text-secondary">{sub.description}</p>
                            </div>
                          )}

                          {/* GPS */}
                          {sub.gps_lat && sub.gps_lng && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                              <a
                                href={`https://maps.google.com/?q=${sub.gps_lat},${sub.gps_lng}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-sm text-enb-green hover:underline flex items-center gap-1"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                {sub.gps_address || `${Number(sub.gps_lat).toFixed(5)}, ${Number(sub.gps_lng).toFixed(5)}`}
                                <span className="text-xs text-gray-400">(open in Maps)</span>
                              </a>
                            </div>
                          )}

                          {/* Mod decisions detail */}
                          {sub.mod1_name && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Moderator Decisions</p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">{sub.mod1_name}</span>
                                  {decisionBadge(sub.mod1_decision)}
                                </div>
                                {sub.mod2_name && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600">{sub.mod2_name}</span>
                                    {decisionBadge(sub.mod2_decision)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end pt-1">
                            <button onClick={() => setExpandedId(null)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                              <X className="w-3.5 h-3.5" /> Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Absence Alerts */}
          {absenceAlerts.length > 0 && (
            <Card className="border-red-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Daily Log Absence Alerts
                  <span className="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                    {absenceAlerts.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-0">
                <div className="divide-y divide-gray-100">
                  {absenceAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-enb-text-primary">{alert.full_name || alert.email}</span>
                          <span className="text-xs text-gray-500 capitalize">{alert.role}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Last log: {alert.last_log_date ? new Date(alert.last_log_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Never'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${alert.absence_status === 'FORMAL_ABSENCE' ? 'text-red-600' : 'text-orange-500'}`}>
                          {alert.consecutive_absences} days
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          alert.absence_status === 'FORMAL_ABSENCE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {alert.absence_status === 'FORMAL_ABSENCE' ? '🚨 Formal Absence' : '⚠️ Warning'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mod Collusion Watch */}
          {flaggedPairs.length > 0 && (
            <Card className="border-purple-200 bg-purple-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                  <Eye className="w-5 h-5" />Mod Collusion Watch
                  <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium border border-purple-200">
                    {flaggedPairs.length} pair{flaggedPairs.length > 1 ? 's' : ''} flagged
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-purple-700">The following mod pairs have agreed {'>'}80% of the time across 5+ shared reviews.</p>
                {flaggedPairs.map((pair, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-purple-100 rounded-xl p-4">
                    <div>
                      <div className="font-semibold text-enb-text-primary text-sm">{pair.mod1_name} + {pair.mod2_name}</div>
                      <div className="text-xs text-enb-text-secondary mt-0.5">{pair.total_reviews} shared reviews · {pair.agreements} agreements</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-700">{pair.agreement_pct}%</div>
                      <div className="text-xs text-purple-500">agreement rate</div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-purple-500 mt-2">Consider reassigning these mods to different submission pools or interviewing them separately.</p>
              </CardContent>
            </Card>
          )}

          {/* Mod Agreement Rates */}
          {modPairs.length > 0 && (
            <Card className="border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />Mod Agreement Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modPairs.map((pair, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-enb-text-primary">{pair.mod1_name} + {pair.mod2_name}</span>
                      <span className={`font-bold ${pair.agreement_pct >= 80 ? 'text-purple-600' : pair.agreement_pct >= 60 ? 'text-orange-500' : 'text-enb-green'}`}>
                        {pair.agreement_pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pair.agreement_pct >= 80 ? 'bg-purple-400' : pair.agreement_pct >= 60 ? 'bg-orange-300' : 'bg-enb-green'}`}
                        style={{ width: `${pair.agreement_pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">{pair.total_reviews} reviews · {pair.flagged ? '⚠️ Flagged' : '✅ Normal'}</div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-1">Flagged threshold: ≥80% agreement across 5+ shared reviews</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
