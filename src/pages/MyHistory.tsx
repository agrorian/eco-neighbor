import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import {
  History, MapPin, AlertTriangle, CheckCircle, XCircle,
  Clock, Loader2, Camera, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  isTransformationAction,
  isUnlocked,
  getTimeUntilUnlock,
  formatActionLabel,
} from '@/lib/beforeAfter';

interface Submission {
  id: string;
  action_type: string;
  description: string;
  status: string;
  enb_awarded: number;
  rep_awarded: number;
  submitted_at: string;
  photo_urls: string[];
  gps_address: string;
  submission_phase: string | null;
  after_unlocks_at: string | null;
  after_submitted: boolean | null;
  parent_submission_id: string | null;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: 'text-enb-green', bg: 'bg-enb-green/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
  pending: { icon: Clock, color: 'text-enb-gold', bg: 'bg-enb-gold/10', label: 'Pending Review' },
};

function AfterPhaseBadge({ sub }: { sub: Submission }) {
  const [, forceUpdate] = useState(0);

  // Tick every minute so timer text stays fresh
  useEffect(() => {
    if (!sub.after_unlocks_at || sub.after_submitted) return;
    const interval = setInterval(() => forceUpdate(n => n + 1), 60_000);
    return () => clearInterval(interval);
  }, [sub.after_unlocks_at, sub.after_submitted]);

  if (!isTransformationAction(sub.action_type)) return null;
  // Only show on Stage A records
  if (sub.submission_phase === 'after' || sub.parent_submission_id) return null;

  if (sub.after_submitted) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-enb-green/10 text-enb-green">
        <CheckCircle className="w-3 h-3" /> Complete
      </span>
    );
  }

  if (!sub.after_unlocks_at) return null;

  if (isUnlocked(sub.after_unlocks_at)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-enb-gold/10 text-enb-gold animate-pulse">
        🟢 After photos ready
      </span>
    );
  }

  const { hrs, mins } = getTimeUntilUnlock(sub.after_unlocks_at);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      <Clock className="w-3 h-3" />
      After in {hrs}h {mins}m
    </span>
  );
}

export default function MyHistory() {
  const { user } = useUserStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('submissions')
        .select(
          'id, action_type, description, status, enb_awarded, rep_awarded, submitted_at, ' +
          'photo_urls, gps_address, submission_phase, after_unlocks_at, after_submitted, parent_submission_id',
        )
        .eq('user_id', user.id)
        // Only show Stage A / legacy records — after records are nested inside detail
        .or('submission_phase.is.null,submission_phase.eq.before')
        .order('submitted_at', { ascending: false });
      setSubmissions(data || []);
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="space-y-5 pb-24">
      <header className="flex items-center gap-3 mb-2">
        <History className="w-6 h-6 text-enb-gold" />
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">My History</h1>
          <p className="text-sm text-enb-text-secondary">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-400">No submissions yet</p>
          <p className="text-xs text-gray-400 mt-1">Your submitted actions will appear here</p>
          <Link to="/submit">
            <Button className="mt-4 bg-enb-green text-white">Submit Your First Action</Button>
          </Link>
        </div>
      ) : (
        submissions.map(sub => {
          const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          const isTransform = isTransformationAction(sub.action_type);

          return (
            <Card key={sub.id} className="border-gray-100 shadow-sm overflow-hidden">
              {/* Photo */}
              {sub.photo_urls?.[0] ? (
                <div className="h-44 overflow-hidden bg-gray-100">
                  <img src={sub.photo_urls[0]} alt="submission" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-20 bg-gray-50 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-300" />
                </div>
              )}

              <CardContent className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-enb-text-primary capitalize text-base">
                      {formatActionLabel(sub.action_type)}
                    </h3>
                    {sub.gps_address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{sub.gps_address}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* After-phase indicator */}
                <AfterPhaseBadge sub={sub} />

                {/* Description */}
                {sub.description && (
                  <p className="text-sm text-enb-text-secondary line-clamp-2">{sub.description}</p>
                )}

                {/* Rewards / status row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {new Date(sub.submitted_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  {sub.status === 'approved' && (
                    <div className="flex gap-3">
                      <span className="font-bold text-enb-green">+{sub.enb_awarded?.toLocaleString() || 500} ENB</span>
                      <span className="font-bold text-enb-gold">+{sub.rep_awarded || 200} Rep</span>
                    </div>
                  )}
                  {sub.status === 'pending' && (
                    <span className="text-enb-gold font-medium">Awaiting review</span>
                  )}
                  {sub.status === 'rejected' && (
                    <span className="text-red-400 font-medium">Not approved</span>
                  )}
                </div>

                {/* View Detail — for transformation actions */}
                {isTransform && (
                  <div className="pt-1 border-t border-gray-100">
                    <Link to={`/submission/${sub.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full text-xs font-medium flex items-center justify-center gap-1 ${
                          sub.after_submitted
                            ? 'text-enb-green hover:bg-enb-green/5 hover:text-enb-green'
                            : isUnlocked(sub.after_unlocks_at)
                            ? 'text-enb-gold hover:bg-enb-gold/5 hover:text-enb-gold'
                            : 'text-enb-text-secondary hover:bg-gray-50'
                        }`}
                      >
                        {sub.after_submitted ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            View Submission · Locked &amp; Logged
                          </>
                        ) : isUnlocked(sub.after_unlocks_at) ? (
                          <>
                            <Camera className="w-3.5 h-3.5" />
                            Submit After Photos Now
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            View Details
                          </>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Report concern — only on approved non-transformation submissions */}
                {sub.status === 'approved' && !isTransform && (
                  <div className="pt-1 border-t border-gray-100">
                    <Link to={`/report?submission=${sub.id}&target=${user.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-orange-500 hover:bg-orange-50 hover:text-orange-600 text-xs font-medium"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                        Report a concern about this submission
                      </Button>
                    </Link>
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
