import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, Loader2, AlertCircle, X, Plus, MapPin, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { gpsDistanceMetres, MAX_GPS_DRIFT_METRES } from '@/lib/beforeAfter';

interface Photo {
  preview: string;
  cloudinaryUrl?: string;
  uploading?: boolean;
}

interface AfterPhotoSubmissionProps {
  submissionId: string;      // Stage A (before) id
  beforeLat: number | null;
  beforeLng: number | null;
  actionType: string;        // e.g. 'neighbourhood_cleanup'
  beforePhotoUrl?: string;   // first photo from Stage A — passed to Gemini for comparison
  onSuccess: () => void;
}

// ── Cloudinary Upload ─────────────────────────────────────────────────────────
async function uploadToCloudinary(dataUrl: string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dl86obm3b';
  // Always use the unsigned preset for after photos — never the signed CNIC preset
  const preset = 'enb_photos';
  const blob = await fetch(dataUrl).then(r => r.blob());
  const form = new FormData();
  form.append('file', blob, 'after_photo.jpg');
  form.append('upload_preset', preset);
  form.append('folder', 'enb/submissions/after');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST', body: form,
  });
  if (!res.ok) throw new Error('Photo upload failed');
  const json = await res.json();
  return json.secure_url;
}

// ── Gemini AI Review ──────────────────────────────────────────────────────────
// Appends Cloudinary resize transforms to keep base64 payload under Gemini's limit
function toOptimizedUrl(url: string): string {
  return url.includes('res.cloudinary.com')
    ? url.replace('/upload/', '/upload/w_800,q_70,f_jpg/')
    : url;
}

async function urlToInlineData(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const res = await fetch(toOptimizedUrl(url));
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || 'image/jpeg';
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = (reader.result as string).split(',')[1];
        resolve({ mimeType, data: b64 });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

type GeminiVerdict = 'approve' | 'reject' | 'uncertain';
interface GeminiResult { verdict: GeminiVerdict; reason: string; confidence: number; }

async function runGeminiReview(
  beforeUrl: string,
  afterUrls: string[],
  actionType: string,
): Promise<GeminiResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return { verdict: 'uncertain', reason: 'AI review not configured — routed to human moderator', confidence: 0 };

  const label = actionType.replace(/_/g, ' ');
  const prompt = `You are a civic action verifier for Eco-Neighbor, a community token system starting in Karachi, Pakistan.
A user claims to have completed a "${label}".

IMAGE ORDER: First image = BEFORE. Remaining = AFTER (taken 4+ hours later at the same location).

Did a genuine "${label}" take place? Respond ONLY with this exact JSON — no other text:
{"verdict":"approve"|"reject"|"uncertain","reason":"One plain-English sentence","confidence":0.0}

Rules:
- approve (≥0.75 confidence): Clear visible improvement matching the claim
- reject (≥0.75 confidence): Identical/staged photos, irrelevant, or no change
- uncertain: Poor light, unclear, or ambiguous — human moderator will decide`;

  const [beforeData, ...afterData] = await Promise.all([
    urlToInlineData(beforeUrl),
    ...afterUrls.slice(0, 3).map(urlToInlineData),
  ]);

  if (!beforeData) return { verdict: 'uncertain', reason: 'Could not load Before photo for AI review', confidence: 0 };

  const parts: any[] = [
    { text: prompt },
    { inlineData: { mimeType: beforeData.mimeType, data: beforeData.data } },
    ...afterData.filter(Boolean).map(d => ({ inlineData: { mimeType: d!.mimeType, data: d!.data } })),
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) },
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const json = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(raw.replace(/```json|```/gi, '').trim());
    return {
      verdict: (['approve', 'reject', 'uncertain'].includes(parsed.verdict) ? parsed.verdict : 'uncertain') as GeminiVerdict,
      reason: parsed.reason || 'No reason provided',
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    };
  } catch {
    return { verdict: 'uncertain', reason: 'AI review failed — routed to human moderator', confidence: 0 };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AfterPhotoSubmission({
  submissionId,
  beforeLat,
  beforeLng,
  actionType,
  beforePhotoUrl,
  onSuccess,
}: AfterPhotoSubmissionProps) {
  const { user } = useUserStore(); // ← fixes missing user_id bug
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [note, setNote] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAddress, setGpsAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsWarning, setGpsWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [submitError, setSubmitError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => { acquireGPS(); return () => stopCamera(); }, []);

  // Once cameraActive flips to true the <video> element mounts —
  // attach the stream in the next effect so the ref is guaranteed to exist.
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const v = videoRef.current;
      v.srcObject = streamRef.current;
      setVideoReady(false);
      v.onloadedmetadata = () => {
        v.play().catch(() => {});
        setVideoReady(true);
      };
    }
  }, [cameraActive]);

  const acquireGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsLat(lat); setGpsLng(lng); setGpsLoading(false);
        if (beforeLat != null && beforeLng != null) {
          const dist = gpsDistanceMetres(beforeLat, beforeLng, lat, lng);
          if (dist > MAX_GPS_DRIFT_METRES) {
            setGpsWarning(`⚠️ You appear to be ${Math.round(dist)}m from the original location (max ${MAX_GPS_DRIFT_METRES}m). This will be flagged for moderators.`);
          }
        }
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const j = await r.json();
          setGpsAddress(j.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch { setGpsAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`); }
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const openCamera = async () => {
    setCameraError('');
    setVideoReady(false);
    try {
      // Request rear camera first; fall back to any camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      // srcObject assigned in useEffect after setCameraActive(true) renders <video>
      setCameraActive(true);
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permissions in your browser settings.'
        : err?.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : 'Could not start camera. Please try again.';
      setCameraError(msg);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setVideoReady(false);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    // If dimensions aren't ready yet (stream not fully started), bail
    if (!v.videoWidth || !v.videoHeight) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    // Sanity check: a valid JPEG data URL is much longer than this
    if (dataUrl.length < 1000) return;
    stopCamera();
    setPhotos(prev => [...prev, { preview: dataUrl, uploading: true }]);
    uploadToCloudinary(dataUrl)
      .then(url => setPhotos(prev => prev.map(p => p.preview === dataUrl ? { ...p, cloudinaryUrl: url, uploading: false } : p)))
      .catch(() => setPhotos(prev => prev.map(p => p.preview === dataUrl ? { ...p, uploading: false } : p)));
  }, []);

  const anyUploading = photos.some(p => p.uploading);
  const canSubmit = photos.length > 0 && !anyUploading && gpsLat != null && !!user;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true); setSubmitError('');
    try {
      const photoUrls = photos.filter(p => p.cloudinaryUrl).map(p => p.cloudinaryUrl!);
      const effectiveUrls = photoUrls.length > 0 ? photoUrls : photos.map(p => p.preview);
      const gpsFlag = beforeLat != null && beforeLng != null && gpsLat != null && gpsLng != null
        ? gpsDistanceMetres(beforeLat, beforeLng, gpsLat, gpsLng) > MAX_GPS_DRIFT_METRES
        : false;

      // Gemini review
      let aiVerdict: GeminiVerdict = 'uncertain';
      let aiReason = 'AI review not configured';
      let aiConfidence = 0;
      if (beforePhotoUrl && import.meta.env.VITE_GEMINI_API_KEY) {
        setAiStatus('running');
        const r = await runGeminiReview(beforePhotoUrl, effectiveUrls, actionType);
        aiVerdict = r.verdict; aiReason = r.reason; aiConfidence = r.confidence;
        setAiStatus('done');
      }

      // Auto-decision: ≥0.85 confidence → skip human queue
      const autoStatus =
        aiVerdict === 'approve' && aiConfidence >= 0.85 ? 'approved' :
        aiVerdict === 'reject'  && aiConfidence >= 0.85 ? 'rejected' :
        'pending';

      const { data: afterRec, error: insertErr } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          parent_submission_id: submissionId,
          submission_phase: 'after',
          action_type: actionType,
          photo_urls: effectiveUrls,
          gps_lat: gpsLat,
          gps_lng: gpsLng,
          gps_address: gpsAddress || null,
          description: note.trim() || `${actionType.replace(/_/g, ' ')} — after photo`,
          status: autoStatus,
          submitted_at: new Date().toISOString(),
          gps_out_of_range: gpsFlag,
          image_source: 'CAMERA',
          ai_review_verdict: aiVerdict,
          ai_review_reason: aiReason,
          ai_review_confidence: aiConfidence,
          enb_awarded: 0,   // rewards belong to the Before record only
          rep_awarded: 0,
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      // ⚠️ CRITICAL: await this update before calling onSuccess()
      // Otherwise SubmissionDetail re-fetches Before while after_submitted is still false
      const { error: updateErr, count: updateCount } = await supabase
        .from('submissions')
        .update({ after_submitted: true, after_submission_id: afterRec.id })
        .eq('id', submissionId)
        .select(); // select() forces Supabase to return affected rows

      if (updateErr) throw new Error(`Before record update failed: ${updateErr.message}`);
      // RLS silent failure: update ran but matched 0 rows (policy blocked it)
      // In this case we use an RPC fallback that runs with SECURITY DEFINER
      if (!updateCount || updateCount === 0) {
        const { error: rpcErr } = await supabase.rpc('mark_before_submitted', {
          p_submission_id: submissionId,
          p_after_id: afterRec.id,
        });
        if (rpcErr) throw new Error(`RLS blocked update and RPC fallback failed: ${rpcErr.message}`);
      }

      // Assign the SAME two moderators to the After submission as the Before.
      // This ensures both mods see Before + After side-by-side in their queue.
      const { data: beforeAssignment } = await supabase
        .from('moderator_assignments')
        .select('mod1_id, mod2_id')
        .eq('submission_id', submissionId)
        .limit(1)
        .maybeSingle();

      if (beforeAssignment?.mod1_id && beforeAssignment?.mod2_id) {
        await supabase
          .from('moderator_assignments')
          .insert({
            submission_id: afterRec.id,
            mod1_id: beforeAssignment.mod1_id,
            mod2_id: beforeAssignment.mod2_id,
            escalation_flag: false,
          });
      }
      // If no Before assignment exists yet (edge case), the DB trigger
      // will create one for the After record automatically.

      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
      setAiStatus('idle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* GPS */}
      <div className={`flex items-center gap-3 p-3 border rounded-xl text-sm ${gpsLat != null ? 'bg-enb-green/10 border-enb-green/20 text-enb-green' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        <span className="font-medium flex-1">
          {gpsLoading ? 'Detecting GPS…' : gpsLat != null ? `📍 ${gpsAddress || 'Location acquired'}` : 'GPS not yet acquired'}
        </span>
        {gpsLat == null && !gpsLoading && <button onClick={acquireGPS} className="text-xs underline text-enb-green font-semibold">Retry</button>}
        {gpsLat != null && <CheckCircle className="w-4 h-4" />}
      </div>

      {gpsWarning && (
        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{gpsWarning}</span>
        </div>
      )}

      {/* Camera */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-enb-text-primary">After Photos <span className="text-red-500">*</span></label>
          <span className="text-xs text-gray-400">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </div>
        {cameraActive && (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-64 object-cover rounded-xl" />
            <canvas ref={canvasRef} className="hidden" />
            {/* Loading overlay while stream initialises */}
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            <Button
              onClick={capturePhoto}
              disabled={!videoReady}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white text-enb-green border-4 border-enb-green hover:bg-enb-green hover:text-white disabled:opacity-50"
            >
              <Camera className="w-6 h-6" />
            </Button>
            <button onClick={stopCamera} className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {photos.map((p, i) => (
              <div key={p.preview} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={p.preview} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                {p.uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>}
                {!p.uploading && p.cloudinaryUrl && <div className="absolute bottom-1 left-1 bg-enb-green text-white text-[10px] px-1.5 py-0.5 rounded-full">✓</div>}
                {!p.uploading && <button onClick={() => setPhotos(prev => prev.filter(x => x.preview !== p.preview))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>}
              </div>
            ))}
            {!cameraActive && (
              <button onClick={openCamera} className="w-24 h-24 rounded-xl border-2 border-dashed border-enb-green bg-enb-green/5 hover:bg-enb-green/10 flex flex-col items-center justify-center gap-1 text-enb-green flex-shrink-0">
                <Plus className="w-5 h-5" /><span className="text-xs font-medium">Add</span>
              </button>
            )}
          </div>
        )}
        {photos.length === 0 && !cameraActive && (
          <div>
            <Button onClick={openCamera} className="w-full h-24 border-2 border-dashed border-enb-green bg-enb-green/5 hover:bg-enb-green/10 text-enb-green flex flex-col gap-2 rounded-xl" variant="ghost">
              <Camera className="w-8 h-8" /><span className="text-sm font-medium">Open Camera</span>
            </Button>
            {cameraError && <div className="mt-2 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-sm text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{cameraError}</div>}
            <p className="text-xs text-gray-400 mt-1 text-center">Gallery uploads not accepted — live camera only</p>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-enb-text-primary">Note (optional)</label>
        <Textarea placeholder="Describe what was accomplished…" value={note} onChange={e => setNote(e.target.value)} className="resize-none h-20 text-sm" maxLength={500} />
        <p className="text-xs text-right text-gray-400">{note.length}/500</p>
      </div>

      {aiStatus === 'running' && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <Brain className="w-4 h-4 animate-pulse flex-shrink-0" />
          <span>AI is reviewing your photos… this takes a few seconds</span>
        </div>
      )}

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{submitError}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full h-12 bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20 text-base">
        {submitting && aiStatus === 'running' ? <><Brain className="w-5 h-5 mr-2 animate-pulse" />AI reviewing photos…</>
          : submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting…</>
          : anyUploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Uploading photos…</>
          : 'Submit After Photos'}
      </Button>

      {!canSubmit && !submitting && !anyUploading && (
        <p className="text-xs text-center text-gray-400">
          {gpsLat == null ? '📍 GPS location required' : photos.length === 0 ? '📷 At least one photo required' : ''}
        </p>
      )}
      <p className="text-xs text-center text-gray-400 leading-relaxed">
        High-confidence AI results are processed automatically. Uncertain cases go to a human moderator.
      </p>
    </div>
  );
}
