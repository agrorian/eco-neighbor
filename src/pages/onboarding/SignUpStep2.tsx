import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, MessageCircle, Camera, Shield, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PAKISTAN_NEIGHBOURHOODS = [
  'Chaklala Scheme 3','Airport Housing Society','Gulrez Housing Society',
  'Bahria Town','PWD Housing Society','Soan Garden','Koral Town',
  'Naval Anchorage','Jinnah Garden','Morgah','Lalazar','Saddar',
  'DHA Phase 1','DHA Phase 2','Gulistan Colony','Walayat Colony',
  'Yusuf Colony','Ayub Colony','Dhok Choudhrian','Car Chowk Area',
];

const INTERNATIONAL_NEIGHBOURHOODS = [
  'Other / International',
];

const NEIGHBOURHOODS = [...PAKISTAN_NEIGHBOURHOODS, ...INTERNATIONAL_NEIGHBOURHOODS];

const PAKISTAN_NEIGHBOURHOODS_SET = new Set(PAKISTAN_NEIGHBOURHOODS);

const PROFESSIONS = [
  'Teacher','Doctor','Nurse','Engineer','Electrician','Plumber',
  'Carpenter','Mechanic','Artist','Student','Business Owner','Developer',
  'Chef','Driver','Farmer','Shopkeeper','Tailor','Contractor',
  'Social Worker','Religious Scholar','Street Vendor','Food Runner',
  'Community Food Guardian','Milkman','Painter / Mason','Retired','Other'
];

// Auto-format CNIC as XXXXX-XXXXXXX-X
function formatCNIC(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function isValidCNIC(value: string): boolean {
  return value.replace(/\D/g, '').length === 13;
}

export default function SignUpStep2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Profile fields
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [profession, setProfession] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // CNIC fields
  const [cnicNumber, setCnicNumber] = useState('');
  const [cnicPhotoUrl, setCnicPhotoUrl] = useState('');
  const [cnicUploading, setCnicUploading] = useState(false);
  const [cnicCameraActive, setCnicCameraActive] = useState(false);
  const [cnicPreview, setCnicPreview] = useState('');
  const [cnicError, setCnicError] = useState('');
  const [checkingCnic, setCheckingCnic] = useState(false);

  // International ID
  const [intlId, setIntlId] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPakistan = PAKISTAN_NEIGHBOURHOODS_SET.has(neighborhood);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Reset CNIC fields when neighbourhood type changes
  useEffect(() => {
    setCnicNumber('');
    setCnicPhotoUrl('');
    setCnicPreview('');
    setIntlId('');
    setCnicError('');
  }, [isPakistan]);

  const getReferralCode = (): string => {
    const fromUrl = searchParams.get('ref');
    if (fromUrl) return fromUrl.trim();
    return sessionStorage.getItem('referralCode') || localStorage.getItem('referralCode') || '';
  };

  // Check CNIC uniqueness on blur
  const checkCnicUnique = async (formatted: string) => {
    if (!isValidCNIC(formatted)) return;
    setCheckingCnic(true);
    setCnicError('');
    const digits = formatted.replace(/\D/g, '');
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('cnic_number', digits)
      .maybeSingle();
    setCheckingCnic(false);
    if (data) {
      setCnicError('This ID number is already registered. Each person may only have one account.');
    }
  };

  const handleCnicChange = (val: string) => {
    const formatted = formatCNIC(val);
    setCnicNumber(formatted);
    setCnicError('');
  };

  // Camera for CNIC photo
  const openCnicCamera = async () => {
    setCnicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCnicCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setCnicError('Camera access denied. Please allow camera access to take a photo of your ID.');
    }
  };

  const captureCnicPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCnicCameraActive(false);

      const preview = canvas.toDataURL('image/jpeg', 0.8);
      setCnicPreview(preview);
      setCnicUploading(true);

      try {
        const file = new File([blob], `cnic_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'enb_photos');
        formData.append('folder', 'enb_cnic');
        const res = await fetch('https://api.cloudinary.com/v1_1/dl86obm3b/image/upload', {
          method: 'POST', body: formData,
        });
        const data = await res.json();
        setCnicPhotoUrl(data.secure_url || '');
      } catch {
        setCnicError('Photo upload failed. Please try again.');
        setCnicPreview('');
      } finally {
        setCnicUploading(false);
      }
    }, 'image/jpeg', 0.85);
  };

  const removeCnicPhoto = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCnicCameraActive(false);
    setCnicPreview('');
    setCnicPhotoUrl('');
  };

  // Validation
  // CNIC is optional for everyone — but if entered, must be valid
  const isPkValid = !cnicNumber || (isValidCNIC(cnicNumber) && !cnicError);

  const canProceed = name && neighborhood && profession && isPkValid && !loading && !checkingCnic;

  const handleNext = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build CNIC data
      const cnicDigits = isPakistan
        ? cnicNumber.replace(/\D/g, '')
        : (intlId.trim() || null);

      // Double-check uniqueness before saving
      if (cnicDigits) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('cnic_number', cnicDigits)
          .maybeSingle();
        if (existing && existing.id !== user.id) {
          setError('This ID number is already registered. Each person may only have one account.');
          setLoading(false);
          return;
        }
      }

      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: name,
          neighbourhood: neighborhood,
          profession: profession,
          email: user.email,
          ...(whatsapp ? { whatsapp_number: whatsapp.replace(/\D/g, '') } : {}),
          ...(cnicDigits ? { cnic_number: cnicDigits } : {}),
          ...(isPakistan && cnicPhotoUrl ? { cnic_photo_url: cnicPhotoUrl, cnic_submitted_at: new Date().toISOString() } : {}),
          ...(intlId.trim() ? { cnic_submitted_at: new Date().toISOString() } : {}),
        });

      if (upsertError) throw upsertError;

      // Referral claim
      const referralCode = getReferralCode();
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users').select('id, referral_code, full_name')
          .eq('referral_code', referralCode).single();

        if (referrer && referrer.id !== user.id) {
          await supabase.from('users').update({ referred_by: referrer.id }).eq('id', user.id);
          await supabase.from('referral_escrow').insert({
            referrer_id: referrer.id, referred_id: user.id, enb_amount: 500,
            escrow_type: 'FIRST_ACTION',
            release_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            released: false,
          });
        }
        localStorage.removeItem('referralCode');
        sessionStorage.removeItem('referralCode');
      }

      // Fire welcome email — non-blocking, don't await
      supabase.functions.invoke('send-welcome-email', {
        body: {
          to: user.email,
          full_name: name,
          neighbourhood: neighborhood,
          profession: profession,
          referral_code: (await supabase.from('users').select('referral_code').eq('id', user.id).single()).data?.referral_code,
        }
      }).catch((e: any) => console.warn('Welcome email failed silently:', e));

      navigate('/onboarding/wallet');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-enb-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-enb-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-enb-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg relative z-10">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-enb-text-primary ml-2">Complete Profile</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Full Name</label>
            <Input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Neighbourhood */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Neighbourhood</label>
            <Select onValueChange={setNeighborhood}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your neighbourhood" />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                <SelectItem value="__pk_header__" disabled className="text-xs text-gray-400 font-semibold uppercase">— Pakistan —</SelectItem>
                {PAKISTAN_NEIGHBOURHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                <SelectItem value="__intl_header__" disabled className="text-xs text-gray-400 font-semibold uppercase">— International —</SelectItem>
                <SelectItem value="Other / International">Other / International</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Profession */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Profession</label>
            <Select onValueChange={setProfession}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your profession" />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              WhatsApp Number
              <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <Input type="tel" placeholder="+92 300 1234567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            <p className="text-xs text-gray-400">We'll send approval notifications via WhatsApp. No spam.</p>
          </div>

          {/* ── CNIC / ID Section ── */}
          {neighborhood && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-enb-green" />
                <span className="text-sm font-semibold text-enb-text-primary">
                  {isPakistan ? 'CNIC Verification' : 'Identity Verification'}
                </span>
                {!isPakistan && (
                  <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                )}
              </div>

              <p className="text-xs text-enb-text-secondary">
                {isPakistan
                  ? 'Your CNIC is optional at signup, but your earned ENB will be locked until your identity is verified. One account per person — protects the whole community.'
                  : 'International members may optionally provide a National ID or Passport number for identity verification.'}
              </p>

              {/* Pakistan: CNIC number + photo */}
              {isPakistan && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-enb-text-primary">
                      CNIC Number <span className="text-gray-400 font-normal text-xs ml-1">(Optional — but required to unlock ENB)</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="XXXXX-XXXXXXX-X"
                        value={cnicNumber}
                        onChange={(e) => handleCnicChange(e.target.value)}
                        onBlur={() => checkCnicUnique(cnicNumber)}
                        maxLength={15}
                        className={cnicError ? 'border-red-400 focus:border-red-400' : isValidCNIC(cnicNumber) && !cnicError ? 'border-enb-green/50' : ''}
                      />
                      {checkingCnic && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />}
                      {isValidCNIC(cnicNumber) && !cnicError && !checkingCnic && (
                        <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-enb-green" />
                      )}
                    </div>
                    {cnicError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {cnicError}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">Format: 12345-1234567-1 (13 digits, auto-formatted)</p>
                  </div>

                  {/* CNIC Photo */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-enb-text-primary">
                      Photo of CNIC <span className="text-gray-400 font-normal text-xs ml-1">(Optional)</span>
                    </label>
                    <p className="text-xs text-gray-400">Take a clear photo of your CNIC card. Both sides if possible.</p>

                    {/* Camera viewfinder */}
                    {cnicCameraActive && (
                      <div className="relative rounded-xl overflow-hidden bg-black">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-48 object-cover rounded-xl" />
                        <canvas ref={canvasRef} className="hidden" />
                        <Button
                          onClick={captureCnicPhoto}
                          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white text-enb-green border-4 border-enb-green hover:bg-enb-green hover:text-white"
                        >
                          <Camera className="w-5 h-5" />
                        </Button>
                      </div>
                    )}

                    {/* Photo preview */}
                    {cnicPreview && !cnicCameraActive && (
                      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200">
                        <img src={cnicPreview} alt="CNIC" className="w-full h-36 object-cover" />
                        {cnicUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                            <span className="text-white text-sm">Uploading...</span>
                          </div>
                        )}
                        {!cnicUploading && cnicPhotoUrl && (
                          <div className="absolute bottom-2 left-2 bg-enb-green text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Uploaded
                          </div>
                        )}
                        <button
                          onClick={removeCnicPhoto}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Open camera button */}
                    {!cnicPreview && !cnicCameraActive && (
                      <Button
                        onClick={openCnicCamera}
                        variant="outline"
                        className="w-full h-20 border-2 border-dashed border-enb-green/40 text-enb-green hover:bg-enb-green/5 flex flex-col gap-1"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-xs">Open Camera to Photograph CNIC</span>
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* International: optional free-text ID */}
              {!isPakistan && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-enb-text-primary">
                    National ID / Passport Number
                    <span className="text-gray-400 font-normal text-xs ml-2">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Any format — passport, national ID, etc."
                    value={intlId}
                    onChange={(e) => setIntlId(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Providing an ID helps prevent duplicate accounts and builds community trust. Not mandatory for international members.
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleNext}
            className="w-full mt-4 bg-enb-green hover:bg-enb-green/90 text-white"
            disabled={!canProceed}
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              : cnicUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading photo...</>
              : checkingCnic ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking ID...</>
              : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>

          {neighborhood && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 leading-relaxed text-center">
                ⚠️ <strong>Skipping identity verification?</strong> You can still join and submit actions, but your earned ENB will remain <strong>locked</strong> until you verify your CNIC from the dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
