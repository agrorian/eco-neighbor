import { useState, useRef } from 'react';
import { Shield, Camera, X, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

function formatCNIC(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function isValidCNIC(value: string): boolean {
  return value.replace(/\D/g, '').length === 13;
}

const PAKISTAN_NEIGHBOURHOODS = new Set([
  'Chaklala Scheme 3','Airport Housing Society','Gulrez Housing Society',
  'Bahria Town','PWD Housing Society','Soan Garden','Koral Town',
  'Naval Anchorage','Jinnah Garden','Morgah','Lalazar','Saddar',
  'DHA Phase 1','DHA Phase 2','Gulistan Colony','Walayat Colony',
  'Yusuf Colony','Ayub Colony','Dhok Choudhrian','Car Chowk Area',
]);

export default function CnicPrompt() {
  const { user, setUser } = useUserStore();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cnicNumber, setCnicNumber] = useState('');
  const [cnicError, setCnicError] = useState('');
  const [checkingCnic, setCheckingCnic] = useState(false);
  const [cnicPreview, setCnicPreview] = useState('');
  const [cnicPhotoUrl, setCnicPhotoUrl] = useState('');
  const [cnicUploading, setCnicUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!user) return null;
  if (dismissed || saved) return null;

  // Only show if CNIC not yet submitted
  const needsCnic = !user.cnic_number;
  if (!needsCnic) return null;

  const isPakistan = PAKISTAN_NEIGHBOURHOODS.has(user.neighbourhood || '');

  const checkCnicUnique = async (formatted: string) => {
    if (!isValidCNIC(formatted)) return;
    setCheckingCnic(true);
    setCnicError('');
    const digits = formatted.replace(/\D/g, '');
    const { data } = await supabase.from('users').select('id').eq('cnic_number', digits).maybeSingle();
    setCheckingCnic(false);
    if (data && data.id !== user.id) {
      setCnicError('This ID is already registered to another account.');
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setError('Camera access denied.');
    }
  };


  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }

    // Show preview immediately from local file (does not depend on upload)
    const reader = new FileReader();
    reader.onload = (ev) => setCnicPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setCnicUploading(true);
    setCnicPhotoUrl('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'enb_photos'); // unsigned preset — enb_cnic_private requires server-side signing
      formData.append('folder', 'enb_cnic');
      const res = await fetch('https://api.cloudinary.com/v1_1/dl86obm3b/image/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.secure_url) {
        throw new Error(data.error?.message || 'Upload failed');
      }
      setCnicPhotoUrl(data.secure_url);
    } catch (err: any) {
      setError('Photo upload failed — please try again or use the camera.');
      // Keep preview so user sees their image; they can retry without re-selecting
    } finally {
      setCnicUploading(false);
      e.target.value = '';
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCameraActive(false);
      const preview = canvas.toDataURL('image/jpeg', 0.8);
      setCnicPreview(preview);
      setCnicUploading(true);
      try {
        const file = new File([blob], `cnic_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'enb_photos');
        formData.append('folder', 'enb_cnic');
        const res = await fetch('https://api.cloudinary.com/v1_1/dl86obm3b/image/upload', { method: 'POST', body: formData });
        const data = await res.json();
        setCnicPhotoUrl(data.secure_url || '');
      } catch {
        setError('Photo upload failed. Please try again.');
        setCnicPreview('');
      } finally {
        setCnicUploading(false);
      }
    }, 'image/jpeg', 0.85);
  };

  const canSubmit = isPakistan
    ? isValidCNIC(cnicNumber) && !cnicError && cnicPhotoUrl && !cnicUploading
    : (cnicNumber.length >= 3 || true); // international always can submit (optional)

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const digits = isPakistan ? cnicNumber.replace(/\D/g, '') : cnicNumber.trim();

      if (digits) {
        const { data: existing } = await supabase.from('users').select('id').eq('cnic_number', digits).maybeSingle();
        if (existing && existing.id !== user.id) {
          setError('This ID is already registered to another account.');
          setSaving(false);
          return;
        }
      }

      const { error: updateError } = await supabase.from('users').update({
        ...(digits ? { cnic_number: digits } : {}),
        ...(isPakistan && cnicPhotoUrl ? { cnic_photo_url: cnicPhotoUrl } : {}),
        cnic_submitted_at: new Date().toISOString(),
      }).eq('id', user.id);

      if (updateError) throw updateError;

      setUser({ ...user, cnic_number: digits || undefined } as any);
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-enb-gold/40 bg-enb-gold/5 overflow-hidden">
      {/* Header — always visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-enb-gold/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-enb-gold" />
          </div>
          <div>
            <p className="font-semibold text-enb-text-primary text-sm">🔒 Your ENB is Locked</p>
            <p className="text-xs text-enb-text-secondary">
              {isPakistan
                ? 'Submit your CNIC to verify your identity and unlock your earned ENB tokens'
                : 'Optional: verify your identity to unlock full account access'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-enb-gold/20 pt-4">
          {error && (
            <div className="p-3 bg-red-50 rounded-lg text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* CNIC number */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-enb-text-primary">
              {isPakistan ? 'CNIC Number' : 'National ID / Passport Number'}
              {isPakistan && <span className="text-red-500 ml-1">*</span>}
              {!isPakistan && <span className="text-xs text-gray-400 ml-2">(Optional)</span>}
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder={isPakistan ? 'XXXXX-XXXXXXX-X' : 'Any format — passport, national ID, etc.'}
                value={cnicNumber}
                onChange={(e) => {
                  const formatted = isPakistan ? formatCNIC(e.target.value) : e.target.value;
                  setCnicNumber(formatted);
                  setCnicError('');
                }}
                onBlur={() => isPakistan && checkCnicUnique(cnicNumber)}
                maxLength={isPakistan ? 15 : 50}
                className={cnicError ? 'border-red-400' : ''}
              />
              {checkingCnic && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />}
              {isPakistan && isValidCNIC(cnicNumber) && !cnicError && !checkingCnic && (
                <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-enb-green" />
              )}
            </div>
            {cnicError && <p className="text-xs text-red-500">{cnicError}</p>}
          </div>

          {/* Photo for Pakistan only */}
          {isPakistan && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-enb-text-primary">
                Photo of CNIC <span className="text-red-500">*</span>
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 space-y-1.5">
                <p className="text-xs text-blue-700 font-medium">📋 Place front + back side by side → take 1 photo</p>
                <div className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 border border-blue-100">
                  <div className="flex-1 text-center bg-gray-100 rounded px-1 py-1">
                    <p className="text-[10px] font-bold text-gray-600">FRONT</p>
                  </div>
                  <span className="text-gray-400 text-xs font-bold">+</span>
                  <div className="flex-1 text-center bg-gray-100 rounded px-1 py-1">
                    <p className="text-[10px] font-bold text-gray-600">BACK</p>
                  </div>
                  <span className="text-gray-400 text-xs">→</span>
                  <div className="flex-1 text-center bg-enb-green/10 rounded px-1 py-1 border border-enb-green/30">
                    <p className="text-[10px] font-bold text-enb-green">1 PHOTO</p>
                  </div>
                </div>
              </div>

              {cameraActive && (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-40 object-cover rounded-xl" />
                  <canvas ref={canvasRef} className="hidden" />
                  <Button
                    onClick={capturePhoto}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white text-enb-green border-4 border-enb-green"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {cnicPreview && !cameraActive && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={cnicPreview} alt="CNIC" className="w-full h-28 object-cover" />
                  {cnicUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      <span className="text-white text-xs">Uploading…</span>
                    </div>
                  )}
                  {cnicPhotoUrl && !cnicUploading && (
                    <div className="absolute bottom-2 left-2 bg-enb-green text-white text-xs px-2 py-0.5 rounded-full">✓ Uploaded</div>
                  )}
                  {!cnicPhotoUrl && !cnicUploading && (
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">⚠ Upload failed — retry</div>
                  )}
                  <button onClick={() => { setCnicPreview(''); setCnicPhotoUrl(''); }}
                    className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {!cnicPreview && !cameraActive && (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={openCamera} variant="outline"
                    className="h-16 border-dashed border-enb-green/40 text-enb-green hover:bg-enb-green/5 flex flex-col gap-1">
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">Take Photo</span>
                  </Button>
                  <label className="h-16 border-2 border-dashed border-enb-green/40 text-enb-green hover:bg-enb-green/5 flex flex-col gap-1 items-center justify-center rounded-md cursor-pointer transition-colors">
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-xs">Upload from Gallery</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                  </label>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Submit for Verification'}
          </Button>
          <p className="text-xs text-center text-gray-400">
            Your ID is stored securely. Admin review only — never shared publicly.
          </p>
        </div>
      )}
    </div>
  );
}
