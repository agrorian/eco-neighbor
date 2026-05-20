import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase , getDb} from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { isTransformationAction, isUnlocked, formatActionLabel } from '@/lib/beforeAfter';
import CountdownTimer from '@/components/CountdownTimer';
import AfterPhotoSubmission from '@/components/AfterPhotoSubmission';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, MapPin, Clock, CheckCircle, Camera, Lock,
  Loader2, ImageOff, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FullSubmission {
  id: string;
  action_type: string;
  description: string;
  status: string;
  submission_phase: string | null;
  after_submission_id: string | null;
  after_unlocks_at: string | null;
  after_submitted: boolean | null;
  parent_submission_id: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_address: string | null;
  photo_urls: string[];
  enb_awarded: number;
  rep_awarded: number;
  submitted_at: string;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  approved:  { color: 'text-enb-green', bg: 'bg-enb-green/10', label: 'Approved' },
  rejected:  { color: 'text-red-500',   bg: 'bg-red-50',        label: 'Rejected' },
  pending:   { color: 'text-enb-gold',  bg: 'bg-enb-gold/10',   label: 'Pending Review' },
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [submission, setSubmission] = useState<FullSubmission | null>(null);
  const [afterRecord, setAfterRecord] = useState<FullSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [afterSubmitted, setAfterSubmitted] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchSubmission(id);
  }, [id]);

  const fetchSubmission = async (subId: string) => {
    setLoading(true);
    const { data } = await getDb()
      .from('submissions')
      .select('*')
      .eq('id', subId)
      .single();

    if (data) {
      setSubmission(data);
      setAfterSubmitted(!!data.after_submitted);
      if (data.after_unlocks_at) {
        setUnlocked(isUnlocked(data.after_unlocks_at));
      }
      // Fetch linked after record if it exists
      if (data.after_submitted) {
        // Prefer fetching by after_submission_id (direct link, always unique)
        // Fall back to parent_submission_id query ordered by most recent
        const afterId = data.after_submission_id;
        const { data: afterData } = afterId
          ? await getDb()
              .from('submissions')
              .select('*')
              .eq('id', afterId)
              .maybeSingle()
          : await getDb()
              .from('submissions')
              .select('*')
              .eq('parent_submission_id', subId)
              .eq('submission_phase', 'after')
              .order('submitted_at', { ascending: false })
              .limit(1)
              .maybeSingle();
        if (afterData) setAfterRecord(afterData);
      }
    }
    setLoading(false);
  };

  const handleAfterSuccess = () => {
    setAfterSubmitted(true);
    if (id) fetchSubmission(id); // refetch to get the after record
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
        <p className="text-enb-text-secondary">Submission not found.</p>
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
      </div>
    );
  }

  const isTransformation = isTransformationAction(submission.action_type);
  const cfg = STATUS_STYLES[submission.status] || STATUS_STYLES.pending;
  const submittedDate = new Date(submission.submitted_at).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // Determine after-phase status label for Recent Activity indicator
  const afterStatus = (() => {
    if (!isTransformation) return null;
    if (afterSubmitted) return 'complete';
    if (!submission.after_unlocks_at) return null;
    if (isUnlocked(submission.after_unlocks_at)) return 'ready';
    return 'waiting';
  })();

  return (
    <div className="pb-32 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-enb-text-primary capitalize">
            {formatActionLabel(submission.action_type)}
          </h1>
          <p className="text-xs text-enb-text-secondary">{submittedDate}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* ── STAGE A — Before Details ─────────────────────── */}
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          {isTransformation && (
            <span className="text-xs font-bold uppercase tracking-wider text-enb-green bg-enb-green/10 px-2 py-0.5 rounded-full">
              Before
            </span>
          )}
          <span className="text-sm font-semibold text-enb-text-primary flex-1">Submission Details</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5" />
            <span>{new Date(submission.submitted_at).toLocaleDateString('en-PK', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}</span>
          </div>
        </div>

        {/* Before photos */}
        {submission.photo_urls?.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {submission.photo_urls.map((url, i) => (
              <button key={i} onClick={() => setViewingPhoto(url)} className="aspect-square overflow-hidden bg-gray-100">
                <img src={url} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <div className="h-24 bg-gray-50 flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-gray-300" />
          </div>
        )}

        <CardContent className="p-4 space-y-3">
          {submission.gps_address && (
            <div className="flex items-start gap-2 text-sm text-enb-text-secondary">
              <MapPin className="w-4 h-4 text-enb-green flex-shrink-0 mt-0.5" />
              <span>{submission.gps_address}</span>
            </div>
          )}
          {submission.description && (
            <p className="text-sm text-enb-text-secondary leading-relaxed whitespace-pre-line">
              {submission.description}
            </p>
          )}
          {submission.status === 'approved' && (
            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
              <span className="text-xs font-bold text-enb-green">+{submission.enb_awarded?.toLocaleString()} ENB</span>
              <span className="text-xs font-bold text-enb-gold">+{submission.rep_awarded} Rep</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── AFTER PHASE (transformation only) ──────────────── */}
      {isTransformation && (
        <>
          {/* Countdown — shown while locked */}
          {afterStatus === 'waiting' && submission.after_unlocks_at && (
            <CountdownTimer
              afterUnlocksAt={submission.after_unlocks_at}
              onUnlocked={() => setUnlocked(true)}
            />
          )}

          {/* After section */}
          <Card className={`border-gray-100 shadow-sm overflow-hidden transition-all ${
            afterStatus === 'complete' ? 'border-enb-green/30' : ''
          }`}>
            <div className={`px-4 py-3 border-b flex items-center gap-2 ${
              afterStatus === 'complete'
                ? 'bg-enb-green/5 border-enb-green/20'
                : afterStatus === 'ready'
                ? 'bg-enb-gold/5 border-enb-gold/20'
                : 'bg-gray-50 border-gray-100'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-enb-gold/10 text-enb-gold">
                After
              </span>
              <span className="text-sm font-semibold text-enb-text-primary flex-1">
                {afterStatus === 'complete'
                  ? 'After Photos Submitted'
                  : afterStatus === 'ready'
                  ? 'Ready to Submit After Photos'
                  : 'After Photos Locked'}
              </span>
              {afterStatus === 'waiting' && <Lock className="w-4 h-4 text-gray-400" />}
              {afterStatus === 'complete' && afterRecord && (
                <div className="flex items-center gap-1.5 text-xs text-enb-green">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{new Date(afterRecord.submitted_at).toLocaleDateString('en-PK', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}</span>
                </div>
              )}
              {afterStatus === 'complete' && !afterRecord && (
                <CheckCircle className="w-4 h-4 text-enb-green" />
              )}
            </div>

            <CardContent className="p-4">
              {/* Complete state — show after photos, locked and logged */}
              {afterStatus === 'complete' && afterRecord && (
                <div className="space-y-4">
                  {afterRecord.photo_urls?.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                      {afterRecord.photo_urls.map((url, i) => (
                        <button key={i} onClick={() => setViewingPhoto(url)} className="aspect-square overflow-hidden bg-gray-100">
                          <img src={url} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  {afterRecord.gps_address && (
                    <div className="flex items-start gap-2 text-sm text-enb-text-secondary">
                      <MapPin className="w-4 h-4 text-enb-green flex-shrink-0 mt-0.5" />
                      <span>{afterRecord.gps_address}</span>
                    </div>
                  )}
                  {afterRecord.description && (
                    <p className="text-sm text-enb-text-secondary leading-relaxed">{afterRecord.description}</p>
                  )}
                  {/* Locked + logged confirmation strip */}
                  <div className="flex items-center gap-2 p-2.5 bg-enb-green/5 border border-enb-green/20 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-enb-green flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-enb-green">Logged &amp; Locked</p>
                      <p className="text-xs text-gray-500 truncate">
                        {new Date(afterRecord.submitted_at).toLocaleDateString('en-PK', {
                          weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      afterRecord.status === 'approved' ? 'bg-enb-green/10 text-enb-green' :
                      afterRecord.status === 'rejected' ? 'bg-red-50 text-red-500' :
                      'bg-enb-gold/10 text-enb-gold'
                    }`}>
                      {afterRecord.status === 'approved' ? 'Approved' :
                       afterRecord.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                    </span>
                  </div>
                </div>
              )}

              {/* Complete but no after record yet loaded */}
              {afterStatus === 'complete' && !afterRecord && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-enb-green" />
                </div>
              )}

              {/* Locked state */}
              {afterStatus === 'waiting' && (
                <div className="flex flex-col items-center py-6 gap-3 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-enb-text-secondary max-w-xs">
                    The After section will unlock once the 4-hour timer finishes. Come back then to submit your proof photos.
                  </p>
                </div>
              )}

              {/* Ready — show AfterPhotoSubmission form */}
              {afterStatus === 'ready' && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <AfterPhotoSubmission
                      submissionId={submission.id}
                      beforeLat={submission.gps_lat}
                      beforeLng={submission.gps_lng}
                      actionType={submission.action_type}
                      beforePhotoUrl={submission.photo_urls?.[0]}
                      onSuccess={handleAfterSuccess}
                    />
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Fullscreen photo viewer */}
      <AnimatePresence>
        {viewingPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingPhoto(null)}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4"
          >
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
            >
              ✕
            </button>
            <img
              src={viewingPhoto}
              alt="Photo"
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
