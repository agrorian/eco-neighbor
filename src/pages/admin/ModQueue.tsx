import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, RefreshCw, MapPin, AlertTriangle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useT } from '@/contexts/LanguageContext';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { isTransformationAction, formatActionLabel } from '@/lib/beforeAfter';
import PairedSubmissionView from '@/components/PairedSubmissionView';

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

// ── LAPSE 4 FIX: Small Leaflet map tile showing GPS pin for moderators ────────
// Moderators previously saw raw GPS numbers. Now they see a map pin on a real
// street tile so they can immediately assess whether the location is plausible.
// Uses the same CDN Leaflet pattern as CarpoolSession.tsx.
// Map is intentionally small (160px tall) — it is context, not the main content.
// ─────────────────────────────────────────────────────────────────────────────
function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).L) { resolve((window as any).L); return; }
    // CSS
    if (!document.getElementById('leaflet-css-modqueue')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-modqueue';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // JS
    if (!document.getElementById('leaflet-js-modqueue')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js-modqueue';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve((window as any).L);
      document.head.appendChild(script);
    } else {
      // Script tag exists but L not ready yet — poll
      const interval = setInterval(() => {
        if ((window as any).L) { clearInterval(interval); resolve((window as any).L); }
      }, 100);
    }
  });
}

interface GpsMapTileProps {
  lat: number;
  lng: number;
  accuracyM?: number | null;
  submissionId: string; // used as map container key to avoid duplicate IDs
}

function GpsMapTile({ lat, lng, accuracyM, submissionId }: GpsMapTileProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = await loadLeaflet();

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,       // static tile — moderator opens Google Maps link to interact
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([lat, lng], 17);

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Accuracy circle — shows uncertainty radius if poor GPS signal
    if (accuracyM != null && accuracyM > 0) {
      L.circle([lat, lng], {
        radius: accuracyM,
        color: accuracyM > 100 ? '#F59E0B' : '#1A6B3C',
        fillColor: accuracyM > 100 ? '#FEF3C7' : '#D1FAE5',
        fillOpacity: 0.3,
        weight: 1.5,
      }).addTo(map);
    }

    // Pin marker — ENB green for good accuracy, amber for poor
    const pinColor = (accuracyM != null && accuracyM > 100) ? '#F59E0B' : '#1A6B3C';
    const icon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:${pinColor};border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45);"></div>`,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([lat, lng], { icon }).addTo(map);
  }, [lat, lng, accuracyM]);

  useEffect(() => {
    initMap();
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [initMap]);

  return (
    <div
      ref={mapRef}
      id={`modqueue-map-${submissionId}`}
      style={{ height: '160px', width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }}
      className="border border-gray-200 bg-gray-100"
    />
  );
}

// ── GPS badges for moderators ─────────────────────────────────────────────────
function GpsBadges({ sub }: { sub: any }) {
  const accuracyM: number | null = sub?.gps_accuracy_m ?? null;
  const isDuplicate: boolean = sub?.gps_duplicate_flag === true;
  // gps_out_of_range = Before/After drift (set by AfterPhotoSubmission.tsx, transformation actions only)
  const isBeforeAfterDrift: boolean = sub?.gps_out_of_range === true;
  // gps_outside_boundary = boundary polygon check (set by SubmitAction.tsx, all actions)
  const isOutsideBoundary: boolean = sub?.gps_outside_boundary === true;

  if (accuracyM == null && !isDuplicate && !isBeforeAfterDrift && !isOutsideBoundary) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* GPS accuracy badge */}
      {accuracyM != null && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
          accuracyM > 100
            ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {accuracyM > 100 ? '⚠️' : '📡'} GPS ±{Math.round(accuracyM)}m
          {accuracyM > 100 && ' — poor signal'}
        </span>
      )}
      {/* GPS duplicate flag */}
      {isDuplicate && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
          🔁 Duplicate location — same action within 30 days
        </span>
      )}
      {/* Outside neighbourhood boundary flag */}
      {isOutsideBoundary && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
          🗺️ Outside registered neighbourhood boundary
        </span>
      )}
      {/* Before/After drift flag — transformation actions only */}
      {isBeforeAfterDrift && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
          📍 After photo &gt;20m from Before location
        </span>
      )}
    </div>
  );
}

export default function ModQueue() {
  const { user } = useUserStore();
  const { l } = useT();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<Record<string, { decision: string; reason: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [timers, setTimers] = useState<Record<string, number>>({});
  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  // Tracks whether PairedSubmissionView found an After record in the DB for each assignment.
  const [afterExists, setAfterExists] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchAssignments(); }, []);

  // 30-second minimum review timer per assignment
  useEffect(() => {
    assignments.forEach(a => {
      if (!timerRefs.current[a.id]) {
        setTimers(t => ({ ...t, [a.id]: 0 }));
        timerRefs.current[a.id] = setInterval(() => {
          setTimers(t => ({ ...t, [a.id]: Math.min((t[a.id] || 0) + 1, 30) }));
        }, 1000);
      }
    });
    return () => {
      Object.keys(timerRefs.current).forEach(id => {
        if (!assignments.find(a => a.id === id)) {
          clearInterval(timerRefs.current[id]);
          delete timerRefs.current[id];
        }
      });
    };
  }, [assignments]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchAssignments = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: assgn } = await supabase
      .from('moderator_assignments')
      .select('*')
      .or(`mod1_id.eq.${user.id},mod2_id.eq.${user.id}`)
      .eq('escalation_flag', false);

    if (assgn && assgn.length > 0) {
      const pending = assgn.filter(a => {
        const isM1 = a.mod1_id === user.id;
        return isM1 ? !a.decision1 : !a.decision2;
      });

      if (pending.length > 0) {
        const subIds = pending.map(a => a.submission_id);
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .in('id', subIds);

        const afterSubs = (subs || []).filter(s => s.submission_phase === 'after' && s.parent_submission_id);
        let parentMap = new Map<string, any>();

        if (afterSubs.length > 0) {
          const parentIds = [...new Set(afterSubs.map(s => s.parent_submission_id))];
          const { data: parents } = await supabase
            .from('submissions')
            .select('*')
            .in('id', parentIds);
          (parents || []).forEach(p => parentMap.set(p.id, p));
        }

        const subMap = new Map((subs || []).map(s => [s.id, s]));

        const seenSubmissionIds = new Set<string>();
        const deduped = pending
          .map(a => {
            const sub = subMap.get(a.submission_id);
            const resolvedSub =
              sub?.submission_phase === 'after' && sub?.parent_submission_id
                ? parentMap.get(sub.parent_submission_id) ?? sub
                : sub;
            return { ...a, submission: resolvedSub };
          })
          .filter(a => {
            const sid = a.submission?.id;
            if (!sid || seenSubmissionIds.has(sid)) return false;
            seenSubmissionIds.add(sid);
            return true;
          });

        setAssignments(deduped);
      } else {
        setAssignments([]);
      }
    } else {
      setAssignments([]);
    }
    setLoading(false);
  };

  const submitDecision = async (assignment: Assignment) => {
    if (!user?.id) return;
    const dec = decisions[assignment.id];
    if (!dec?.decision || !dec?.reason || dec.reason.length < 10) return;

    setSubmitting(assignment.id);
    const isM1 = assignment.mod1_id === user.id;
    const reviewedAt = new Date().toISOString();
    const update: any = isM1
      ? { decision1: dec.decision, reason1: dec.reason, mod1_reviewed_at: reviewedAt }
      : { decision2: dec.decision, reason2: dec.reason, mod2_reviewed_at: reviewedAt };

    const { error: updateError } = await supabase
      .from('moderator_assignments')
      .update(update)
      .eq('id', assignment.id);

    if (updateError) {
      showToast('❌ Failed to save decision. Please try again.');
      setSubmitting(null);
      return;
    }

    const { data: result } = await getDb().rpc('evaluate_mod_decision', { p_assignment_id: assignment.id });

    if (result?.status === 'approved') {
      showToast('\u2705 Both mods agreed \u2014 submission approved! +500 ENB earned.');

      // ── Post-approval: fire rating link notification for trade jobs ──────
      try {
        const { data: sub } = await supabase
          .from('submissions')
          .select('action_type, id')
          .eq('id', assignment.submission_id)
          .single();

        if (sub?.action_type === 'trade_job') {
          const { data: jobReq } = await supabase
            .from('job_requests')
            .select('job_code, customer_user_id, tradesperson_id')
            .eq('submission_id', assignment.submission_id)
            .maybeSingle();

          if (jobReq?.customer_user_id && jobReq?.job_code) {
            const ratingUrl = `${window.location.origin}/job/${jobReq.job_code}/rate`;
            await getDb().from('messages').insert({
              sender_id:    jobReq.tradesperson_id,
              recipient_id: jobReq.customer_user_id,
              message_type: 'direct',
              content: `\u2705 <strong>Job completed &amp; verified!</strong><br/>Your job has been approved by the ENB moderation team. Please take a moment to rate the work:<br/><br/><a href="${ratingUrl}" style="color:#1A6B3C;font-weight:600;">\u2b50 Rate this job</a>`,
              channel_id:   null,
              team_id:      null,
            });
          }
        }
      } catch {
        // Silent — approval already recorded above
      }
    } else if (result?.status === 'rejected') {
      showToast('❌ Both mods agreed — submission rejected. +200 ENB earned.');
    } else if (result?.status === 'escalated_to_senior') {
      showToast('⚠️ Disagreement recorded — escalated to Senior Moderator.');
    } else if (result?.status === 'waiting_for_second_mod') {
      showToast('✅ Decision submitted. Waiting for second moderator.');
    } else {
      showToast('✅ Decision recorded.');
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
            <Shield className="w-6 h-6 text-blue-600" /> {l('modqueue', 'title')}
          </h1>
          <p className="text-sm text-enb-text-secondary">Blind review — {assignments.length} assigned to you</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAssignments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </header>

      {/* Protocol banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-bold">{l('modqueue', 'blindReview')}</p>
        <p>{l('modqueue', 'blindReviewDesc')}</p>
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
          <p className="font-medium">{l('modqueue', 'noAssignments')}</p>
          <p className="text-xs mt-1">New submissions will appear here automatically.</p>
        </div>
      ) : (
        assignments.map(a => {
          const sub = a.submission;
          const dec = decisions[a.id] || { decision: '', reason: '' };
          const isProcessing = submitting === a.id;
          const isTransformation = sub?.action_type ? isTransformationAction(sub.action_type) : false;
          const afterPending = isTransformation && afterExists[a.id] === false;

          return (
            <Card key={a.id} className="border-gray-100 shadow-sm overflow-hidden">

              {/* ── TRANSFORMATION: Paired Before/After view ─────────────── */}
              {isTransformation ? (
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-enb-text-primary text-lg">
                        {formatActionLabel(sub?.action_type || '')}
                      </h3>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">
                        📸 Transformation action — Before &amp; After required
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                      {sub?.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : ''}
                    </span>
                  </div>

                  {/* GPS badges for transformation submissions */}
                  <GpsBadges sub={sub} />

                  {afterPending ? (
                    <div className="space-y-3">
                      <PairedSubmissionView
                        beforeSubmission={sub}
                        onAfterResolved={(has) => setAfterExists(prev => ({ ...prev, [a.id]: has }))}
                      />
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        Waiting for user to submit After photos. You can review once both phases are complete.
                      </div>
                    </div>
                  ) : (
                    <PairedSubmissionView
                      beforeSubmission={sub}
                      onAfterResolved={(has) => setAfterExists(prev => ({ ...prev, [a.id]: has }))}
                    />
                  )}

                  {sub?.description && (
                    <p className="text-sm text-enb-text-secondary bg-gray-50 rounded-lg p-3">{sub.description}</p>
                  )}
                </CardContent>
              ) : (
                /* ── STANDARD: Single-phase submission ───────────────────── */
                <>
                  {sub?.photo_urls?.[0] && (
                    <div className="h-52 overflow-hidden bg-gray-100">
                      <img src={sub.photo_urls[0]} alt="submission" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-enb-text-primary capitalize text-lg">
                          {sub?.action_type?.replace(/_/g, ' ')}
                        </h3>

                        {/* GPS link — now accompanied by map tile below */}
                        {sub?.gps_lat && sub?.gps_lng ? (
                          <a
                            href={`https://www.google.com/maps?q=${sub.gps_lat},${sub.gps_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-enb-green flex items-center gap-1 mt-1 hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {sub.gps_address || `${Number(sub.gps_lat).toFixed(5)}, ${Number(sub.gps_lng).toFixed(5)}`}
                            <span className="text-[10px] text-gray-400 ml-1">↗ open in Google Maps</span>
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />GPS not recorded
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg block">
                          {sub?.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5 block">
                          {sub?.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>

                    {/* ── LAPSE 4 FIX: GPS map tile ──────────────────────────
                        Shows a static OpenStreetMap tile with a pin at the
                        submission coordinates. Moderators can immediately see
                        whether the pin is on a street, inside a building, in a
                        residential compound, or in an implausible location.
                        Accuracy circle shown when gps_accuracy_m is available.
                        Amber pin + amber circle = poor GPS accuracy (>100m).
                        Green pin + green circle = good GPS accuracy.
                        Clicking the GPS link above opens Google Maps for full
                        interactive verification.
                    ─────────────────────────────────────────────────────── */}
                    {sub?.gps_lat && sub?.gps_lng && (
                      <div className="space-y-1.5">
                        <GpsMapTile
                          lat={Number(sub.gps_lat)}
                          lng={Number(sub.gps_lng)}
                          accuracyM={sub.gps_accuracy_m ?? null}
                          submissionId={sub.id}
                        />
                        <p className="text-[10px] text-gray-400 text-center">
                          📍 Submission location — tap link above to open in Google Maps
                        </p>
                      </div>
                    )}

                    {/* GPS flags badges */}
                    <GpsBadges sub={sub} />

                    {sub?.description && (
                      <p className="text-sm text-enb-text-secondary bg-gray-50 rounded-lg p-3">{sub.description}</p>
                    )}
                  </CardContent>
                </>
              )}

              {/* ── DECISION SECTION ──────────────────────────────────────── */}
              <CardContent className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100">
                {afterPending ? (
                  <p className="text-sm text-center text-gray-400 py-2">
                    Decisions locked until After photos are submitted.
                  </p>
                ) : (
                  <>
                    {a.escalation_flag && (
                      <div className="flex items-center gap-2 text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>This submission is escalated — moderators disagreed. Senior review required.</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        onClick={() => setDecisions(d => ({ ...d, [a.id]: { ...dec, decision: 'APPROVE' } }))}
                        className={`flex-1 transition-all ${dec.decision === 'APPROVE'
                          ? 'bg-enb-green text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-enb-green/10 hover:text-enb-green'}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setDecisions(d => ({ ...d, [a.id]: { ...dec, decision: 'REJECT' } }))}
                        className={`flex-1 transition-all ${dec.decision === 'REJECT'
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>

                    {dec.decision && (
                      <div className="space-y-3">
                        <Input
                          placeholder="Reason for your decision (minimum 10 characters)"
                          value={dec.reason}
                          onChange={e => setDecisions(d => ({ ...d, [a.id]: { ...dec, reason: e.target.value } }))}
                          className={dec.reason.length > 0 && dec.reason.length < 10 ? 'border-red-300' : ''}
                        />
                        {dec.reason.length > 0 && dec.reason.length < 10 && (
                          <p className="text-xs text-red-500">{10 - dec.reason.length} more characters needed</p>
                        )}
                        {(timers[a.id] || 0) < 30 && (
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <div className="flex-1 bg-amber-200 rounded-full h-1.5">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000"
                                style={{ width: `${((timers[a.id] || 0) / 30) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-amber-700 font-medium whitespace-nowrap">
                              {30 - (timers[a.id] || 0)}s — review carefully
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={() => submitDecision(a)}
                          disabled={dec.reason.length < 10 || isProcessing || (timers[a.id] || 0) < 30}
                          className="w-full bg-enb-text-primary text-white hover:bg-enb-text-primary/90 disabled:opacity-50"
                        >
                          {isProcessing
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                            : (timers[a.id] || 0) < 30
                              ? `Please review for ${30 - (timers[a.id] || 0)} more seconds`
                              : `Submit ${dec.decision === 'APPROVE' ? 'Approval' : 'Rejection'}`}
                        </Button>
                      </div>
                    )}
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
