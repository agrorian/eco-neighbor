import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, MapPin, Camera, X, Plus,
  Loader2, RefreshCw, Filter, Brain, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

// ── Types ─────────────────────────────────────────────────────────────────────
const REPORTING_TYPES = new Set([
  'infrastructure_report',
  'waste_reporting',
]);

const ACTION_LABELS: Record<string, string> = {
  infrastructure_report: 'Infrastructure Issue',
  waste_reporting:       'Illegal Dumping / Waste',
};

const ACTION_ICONS: Record<string, string> = {
  infrastructure_report: '🔧',
  waste_reporting:       '🗑️',
};

interface Report {
  id: string;
  action_type: string;
  description: string | null;
  photo_urls: string[];
  gps_lat: number | null;
  gps_lng: number | null;
  gps_address: string | null;
  submitted_at: string;
  status: string;
  report_status: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  user_id: string;
  enb_awarded: number;
}

type FilterType = 'all' | 'open' | 'resolved';

// ── Resolution Modal ──────────────────────────────────────────────────────────
interface ResolutionModalProps {
  report: Report;
  onClose: () => void;
  onSuccess: () => void;
}

function ResolutionModal({ report, onClose, onSuccess }: ResolutionModalProps) {
  const { user } = useUserStore();
  const [photos, setPhotos] = useState<{ preview: string; url: string | null; uploading: boolean }[]>([]);
  const [note, setNote] = useState('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAddress, setGpsAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    acquireGPS();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const acquireGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        setGpsLoading(false);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const j = await r.json();
          setGpsAddress(j.display_name?.split(',').slice(0, 3).join(', ') || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        } catch {
          setGpsAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        }
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const openCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied. Please allow camera in browser settings.');
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
    const newPhoto = { preview: dataUrl, url: null, uploading: true };
    setPhotos(prev => [...prev, newPhoto]);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dl86obm3b';
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'enb_photos';
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const form = new FormData();
      form.append('file', blob, 'resolution.jpg');
      form.append('upload_preset', preset);
      form.append('folder', 'enb_resolutions');
      return fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
    }).then(r => r.json()).then(data => {
      setPhotos(prev => prev.map(p => p.preview === dataUrl ? { ...p, url: data.secure_url || null, uploading: false } : p));
    }).catch(() => {
      setPhotos(prev => prev.map(p => p.preview === dataUrl ? { ...p, uploading: false } : p));
    });
  }, []);

  const handleSubmit = async () => {
    if (!user || !gpsLat) return;
    const uploadedUrls = photos.filter(p => p.url).map(p => p.url!);
    if (uploadedUrls.length === 0) return;

    setSubmitting(true); setError('');
    try {
      const { error: insertErr } = await supabase.from('submissions').insert({
        user_id: user.id,
        action_type: 'resolution',
        parent_submission_id: report.id,
        submission_phase: null,
        photo_urls: uploadedUrls,
        description: note || `Resolution for: ${ACTION_LABELS[report.action_type] || report.action_type}`,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        gps_address: gpsAddress || null,
        status: 'pending',
        enb_awarded: 300,
        rep_awarded: 150,
        image_source: 'CAMERA',
        submitted_at: new Date().toISOString(),
      });
      if (insertErr) throw insertErr;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const anyUploading = photos.some(p => p.uploading);
  const canSubmit = photos.filter(p => p.url).length > 0 && !!gpsLat && !submitting && !anyUploading;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-enb-text-primary">Submit Resolution</h2>
            <p className="text-xs text-enb-text-secondary mt-0.5">
              {ACTION_ICONS[report.action_type]} {ACTION_LABELS[report.action_type] || report.action_type}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Reward preview */}
          <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 text-sm">
            <p className="font-semibold text-enb-green mb-1">🌿 Earn for closing the loop</p>
            <p className="text-enb-text-secondary">Submit proof that this issue has been fixed and earn <strong>+300 ENB</strong> + <strong>+150 Rep</strong> once verified by moderators.</p>
          </div>

          {/* Original report reference */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-start gap-3">
            {report.photo_urls?.[0] && (
              <img src={report.photo_urls[0]} alt="Original report" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Original Report</p>
              {report.gps_address && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />{report.gps_address}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                Reported {new Date(report.submitted_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* GPS */}
          <div className={`flex items-center gap-3 p-3 border rounded-xl text-sm ${gpsLat ? 'bg-enb-green/10 border-enb-green/20 text-enb-green' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
            {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            <span className="font-medium flex-1 text-xs">
              {gpsLoading ? 'Detecting location…' : gpsLat ? `📍 ${gpsAddress || 'Location acquired'}` : 'GPS required — tap Retry'}
            </span>
            {!gpsLat && !gpsLoading && <button onClick={acquireGPS} className="text-xs underline text-enb-green font-semibold">Retry</button>}
            {gpsLat && <CheckCircle className="w-4 h-4" />}
          </div>

          {/* Camera */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-enb-text-primary">
              Resolution Photo <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-400 ml-2">Camera only — prove the issue is fixed</span>
            </label>

            {cameraActive && (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-56 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <Button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white text-enb-green border-4 border-enb-green">
                  <Camera className="w-5 h-5" />
                </Button>
                <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraActive(false); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img src={p.preview} className="w-full h-full object-cover" />
                    {p.uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
                    {!p.uploading && p.url && <div className="absolute bottom-1 left-1 bg-enb-green text-white text-[10px] px-1 py-0.5 rounded-full">✓</div>}
                    {!p.uploading && <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>}
                  </div>
                ))}
                {!cameraActive && (
                  <button onClick={openCamera} className="w-20 h-20 rounded-xl border-2 border-dashed border-enb-green bg-enb-green/5 flex flex-col items-center justify-center gap-1 text-enb-green">
                    <Plus className="w-4 h-4" /><span className="text-xs">Add</span>
                  </button>
                )}
              </div>
            )}

            {photos.length === 0 && !cameraActive && (
              <div>
                <Button onClick={openCamera} variant="ghost" className="w-full h-20 border-2 border-dashed border-enb-green bg-enb-green/5 text-enb-green flex flex-col gap-1 rounded-xl">
                  <Camera className="w-6 h-6" /><span className="text-sm font-medium">Open Camera</span>
                </Button>
                {cameraError && <p className="text-xs text-red-500 mt-1">{cameraError}</p>}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-semibold text-enb-text-primary">Note <span className="text-gray-400 font-normal">(optional)</span></label>
            <Textarea placeholder="Describe how the issue was resolved…" value={note} onChange={e => setNote(e.target.value)} className="mt-1.5 resize-none h-16 text-sm" maxLength={300} />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full h-12 bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : anyUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : 'Submit Resolution (+300 ENB)'}
          </Button>

          <p className="text-xs text-center text-gray-400">
            {!gpsLat ? '📍 GPS location required' : photos.filter(p => p.url).length === 0 ? '📷 At least one photo required' : 'Reviewed by moderators before ENB is awarded'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CommunityIssues() {
  const { user } = useUserStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('open');
  const [resolvingReport, setResolvingReport] = useState<Report | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('id, action_type, description, photo_urls, gps_lat, gps_lng, gps_address, submitted_at, status, report_status, resolved_at, resolved_by, user_id, enb_awarded')
      .in('action_type', Array.from(REPORTING_TYPES))
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = reports.filter(r => {
    if (filter === 'open') return r.report_status === 'open' || r.report_status === null;
    if (filter === 'resolved') return r.report_status === 'resolved';
    return true;
  });

  const openCount = reports.filter(r => r.report_status === 'open' || r.report_status === null).length;
  const resolvedCount = reports.filter(r => r.report_status === 'resolved').length;

  const handleResolutionSuccess = () => {
    setSuccessId(resolvingReport?.id || null);
    setResolvingReport(null);
    setTimeout(() => setSuccessId(null), 4000);
    fetchReports();
  };

  if (!user) return null;

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          Community Issues
        </h1>
        <p className="text-sm text-enb-text-secondary mt-0.5">
          Verified civic problems in your neighborhood. See something fixed? Submit a resolution and earn ENB.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{openCount}</div>
          <div className="text-xs text-orange-500 font-medium uppercase tracking-wide mt-0.5">Open Issues</div>
        </div>
        <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-enb-green">{resolvedCount}</div>
          <div className="text-xs text-enb-green font-medium uppercase tracking-wide mt-0.5">Resolved</div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-semibold">How resolution works</p>
        <p>When a reported issue is fixed (pothole filled, dump cleared, light repaired), any community member can submit a resolution photo. Moderators verify it and you earn <strong>300 ENB + 150 Rep</strong> for closing the civic loop.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['open', 'resolved', 'all'] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${filter === f ? 'bg-enb-text-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'open' ? `Open (${openCount})` : f === 'resolved' ? `Resolved (${resolvedCount})` : 'All'}
          </button>
        ))}
        <button onClick={fetchReports} className="ml-auto p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Success toast */}
      {successId && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-enb-green text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Resolution submitted — pending moderator review
        </div>
      )}

      {/* Report cards */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-enb-green" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-30" />
          <p className="font-medium">{filter === 'open' ? 'No open issues right now' : filter === 'resolved' ? 'No resolved issues yet' : 'No issues reported yet'}</p>
          <p className="text-xs mt-1">
            {filter === 'open' ? 'Issues appear here once verified by moderators' : 'Resolved issues will appear here once community members submit proof'}
          </p>
        </div>
      ) : (
        filtered.map(report => {
          const isResolved = report.report_status === 'resolved';
          const isMyReport = report.user_id === user.id;
          const alreadySubmittedResolution = successId === report.id;

          return (
            <Card key={report.id} className={`border-gray-100 shadow-sm overflow-hidden ${isResolved ? 'opacity-75' : ''}`}>
              {/* Photo */}
              {report.photo_urls?.[0] && (
                <div className="h-44 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setViewingPhoto(report.photo_urls[0])}>
                  <img src={report.photo_urls[0]} alt="Issue" className="w-full h-full object-cover" />
                </div>
              )}

              <CardContent className="p-4 space-y-3">
                {/* Title row */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-enb-text-primary text-base">
                      {ACTION_ICONS[report.action_type]} {ACTION_LABELS[report.action_type] || report.action_type}
                    </h3>
                    {report.gps_address ? (
                      <a
                        href={`https://maps.google.com/?q=${report.gps_lat},${report.gps_lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-enb-green flex items-center gap-1 mt-0.5 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        <MapPin className="w-3 h-3" />{report.gps_address}
                        <span className="text-gray-400">(tap to verify)</span>
                      </a>
                    ) : report.gps_lat ? (
                      <a href={`https://maps.google.com/?q=${report.gps_lat},${report.gps_lng}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-enb-green flex items-center gap-1 mt-0.5 hover:underline">
                        <MapPin className="w-3 h-3" />{Number(report.gps_lat).toFixed(5)}, {Number(report.gps_lng).toFixed(5)}
                      </a>
                    ) : null}
                  </div>
                  {/* Status badge */}
                  {isResolved ? (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-enb-green/10 text-enb-green">
                      <CheckCircle className="w-3 h-3" /> Resolved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">
                      <Clock className="w-3 h-3" /> Open
                    </span>
                  )}
                </div>

                {/* Description */}
                {report.description && (
                  <p className="text-sm text-enb-text-secondary bg-gray-50 rounded-lg p-3 line-clamp-2">{report.description}</p>
                )}

                {/* Date + resolved info */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Reported {new Date(report.submitted_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {isResolved && report.resolved_at && (
                    <span className="text-enb-green font-medium">
                      ✅ Resolved {new Date(report.resolved_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                {/* Resolution CTA */}
                {!isResolved && !isMyReport && (
                  alreadySubmittedResolution ? (
                    <div className="flex items-center gap-2 text-sm text-enb-green bg-enb-green/5 border border-enb-green/20 rounded-xl p-3">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Resolution submitted — pending moderator review</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setResolvingReport(report)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved (+300 ENB)
                    </Button>
                  )
                )}

                {/* Own report — can't self-resolve */}
                {!isResolved && isMyReport && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>You reported this issue. Another community member can submit the resolution.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Resolution modal */}
      {resolvingReport && (
        <ResolutionModal
          report={resolvingReport}
          onClose={() => setResolvingReport(null)}
          onSuccess={handleResolutionSuccess}
        />
      )}

      {/* Fullscreen photo */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4" onClick={() => setViewingPhoto(null)}>
          <button onClick={() => setViewingPhoto(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center">✕</button>
          <img src={viewingPhoto} alt="Issue" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
