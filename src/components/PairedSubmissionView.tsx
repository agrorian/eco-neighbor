/**
 * PairedSubmissionView — Moderator component
 * Shows a Before (Stage A) submission alongside its After (Stage B) record side-by-side.
 * Used inside SubmissionQueue / ModQueue for transformation actions.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { gpsDistanceMetres, formatActionLabel } from '@/lib/beforeAfter';
import { Clock, MapPin, Camera, AlertTriangle, CheckCircle, Loader2, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Submission {
  id: string;
  action_type: string;
  description: string;
  status: string;
  submission_phase: string | null;
  photo_urls: string[];
  gps_lat: number | null;
  gps_lng: number | null;
  gps_address: string | null;
  submitted_at: string;
  after_submitted: boolean | null;
  gps_out_of_range?: boolean;
}

interface PairedSubmissionViewProps {
  beforeSubmission: Submission;
}

function formatDelta(ms: number): string {
  const hrs = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hrs > 0) return `${hrs}h ${mins}m after Before`;
  return `${mins}m after Before`;
}

function PhotoGrid({ urls, label }: { urls: string[]; label: string }) {
  const [viewing, setViewing] = useState<string | null>(null);
  if (!urls?.length) {
    return (
      <div className="h-32 bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-2 border border-dashed border-gray-200">
        <ImageOff className="w-6 h-6 text-gray-300" />
        <span className="text-xs text-gray-400">No {label} photos</span>
      </div>
    );
  }
  return (
    <>
      <div className={`grid gap-1 ${urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setViewing(url)}
            className="aspect-square overflow-hidden rounded-xl bg-gray-100"
          >
            <img src={url} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {viewing && (
        <div
          onClick={() => setViewing(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        >
          <img src={viewing} alt="Full size" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </>
  );
}

export default function PairedSubmissionView({ beforeSubmission: sub }: PairedSubmissionViewProps) {
  const [afterRecord, setAfterRecord] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  // Guard: this component must only receive 'before' phase submissions.
  // If an 'after' record is passed in (ModQueue bug), render nothing.
  if (sub.submission_phase === 'after') return null;

  useEffect(() => {
    const fetchAfter = async () => {
      setLoading(true);
      // Always query by parent_submission_id — don't rely solely on the
      // after_submitted flag which can be stale due to race conditions.
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('parent_submission_id', sub.id)
        .eq('submission_phase', 'after')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setAfterRecord(data || null);
      setLoading(false);
    };
    fetchAfter();
  }, [sub.id]);

  const gpsDistance =
    afterRecord?.gps_lat != null && afterRecord?.gps_lng != null &&
    sub.gps_lat != null && sub.gps_lng != null
      ? Math.round(gpsDistanceMetres(sub.gps_lat, sub.gps_lng, afterRecord.gps_lat, afterRecord.gps_lng))
      : null;

  const timeDelta =
    afterRecord
      ? new Date(afterRecord.submitted_at).getTime() - new Date(sub.submitted_at).getTime()
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-enb-text-primary capitalize">
          {formatActionLabel(sub.action_type)}
        </h3>
        <span className="text-xs text-gray-400">
          {new Date(sub.submitted_at).toLocaleDateString('en-PK', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      </div>

      {/* Time delta */}
      {timeDelta != null && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700 font-medium">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          After photos submitted {formatDelta(timeDelta)}
        </div>
      )}

      {/* GPS drift warning */}
      {(gpsDistance != null && gpsDistance > 100) || afterRecord?.gps_out_of_range ? (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          GPS drift: After location is {gpsDistance}m from Before location (max 100m)
        </div>
      ) : gpsDistance != null ? (
        <div className="flex items-center gap-2 bg-enb-green/5 border border-enb-green/20 rounded-xl px-3 py-2 text-xs text-enb-green font-medium">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          GPS verified — {gpsDistance}m between Before & After locations
        </div>
      ) : null}

      {/* Side-by-side panel */}
      <div className="grid grid-cols-2 gap-3">
        {/* Before */}
        <Card className="border-gray-100 shadow-sm">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 rounded-t-xl">
            <span className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">Before</span>
          </div>
          <CardContent className="p-3 space-y-3">
            <PhotoGrid urls={sub.photo_urls} label="Before" />
            {sub.gps_address && (
              <div className="flex items-start gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{sub.gps_address}</span>
              </div>
            )}
            {sub.description && (
              <p className="text-xs text-enb-text-secondary line-clamp-3">{sub.description}</p>
            )}
            <div className="text-xs text-gray-400">
              {new Date(sub.submitted_at).toLocaleTimeString('en-PK', {
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
          </CardContent>
        </Card>

        {/* After */}
        <Card className={`border-gray-100 shadow-sm ${!afterRecord && !loading ? 'opacity-50' : ''}`}>
          <div className={`px-3 py-2 border-b rounded-t-xl ${
            afterRecord ? 'bg-enb-green/5 border-enb-green/20' : 'bg-gray-50 border-gray-100'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              afterRecord ? 'text-enb-green' : 'text-gray-400'
            }`}>After</span>
          </div>
          <CardContent className="p-3 space-y-3">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : afterRecord ? (
              <>
                <PhotoGrid urls={afterRecord.photo_urls} label="After" />
                {afterRecord.gps_address && (
                  <div className="flex items-start gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{afterRecord.gps_address}</span>
                  </div>
                )}
                {afterRecord.description && (
                  <p className="text-xs text-enb-text-secondary line-clamp-3">{afterRecord.description}</p>
                )}
                <div className="text-xs text-gray-400">
                  {new Date(afterRecord.submitted_at).toLocaleTimeString('en-PK', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 gap-2 text-center">
                <Camera className="w-6 h-6 text-gray-300" />
                <p className="text-xs text-gray-400">After photos not yet submitted</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
