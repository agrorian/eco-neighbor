import { useState, useEffect, useRef } from 'react';
import { Shield, Car, CheckCircle, Clock, XCircle, Upload, Loader2, ChevronDown, ChevronUp, Camera, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { useT } from '@/contexts/LanguageContext';

const LICENSE_CATEGORIES = [
  { id: 'motorcycle', label: 'Motorcycle',                   labelUr: 'موٹرسائیکل',              unlocks: ['Bike'],                          unlocksUr: ['بائیک'],                                      icon: '🛵' },
  { id: 'ltv',        label: 'LTV — Light Transport Vehicle', labelUr: 'ہلکی ٹرانسپورٹ گاڑی',    unlocks: ['Car', 'Rickshaw', 'Auto-rickshaw'], unlocksUr: ['کار', 'رکشہ', 'آٹو رکشہ'],                   icon: '🚗' },
  { id: 'htv',        label: 'HTV — Heavy Transport Vehicle', labelUr: 'بھاری ٹرانسپورٹ گاڑی',   unlocks: ['Van/Minivan', 'Bus/Coaster'],       unlocksUr: ['وین / منی وین', 'بس / کوسٹر'],               icon: '🚌' },
];

const PERKS = [
  { icon: '💰', en: 'Earn $ENB per km — dynamic formula based on vehicle, passengers & rating', ur: 'فی کلومیٹر $ENB کمائیں — گاڑی، مسافر اور ریٹنگ کی بنیاد پر' },
  { icon: '⭐', en: 'Build your public Captain profile with verified ratings and reviews', ur: 'تصدیق شدہ ریٹنگز کے ساتھ اپنا عوامی کیپٹن پروفائل بنائیں' },
  { icon: '🏆', en: 'ENB Captain badge on your community profile', ur: 'آپ کے پروفائل پر ENB کیپٹن بیج' },
  { icon: '📱', en: 'Passengers can message and rate you directly in-app', ur: 'مسافر آپ کو براہ راست ایپ میں پیغام اور ریٹنگ دے سکتے ہیں' },
  { icon: '🌿', en: 'Contribute to verified carbon offset records (Verra VCS — coming)', ur: 'تصدیق شدہ کاربن آفسیٹ ریکارڈ میں حصہ ڈالیں (Verra VCS — جلد آ رہا ہے)' },
];

type AppStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';

interface CaptainApp {
  id: string;
  status: AppStatus;
  license_categories: string[];
  approved_vehicle_types: string[];
  admin_note: string | null;
  applied_at: string;
  reviewed_at: string | null;
}

interface Props {
  onApproved: (vehicleTypes: string[]) => void;
}

export default function CaptainOnboarding({ onApproved }: Props) {
  const { user } = useUserStore();
  const { isUrdu } = useT();
  const [app, setApp] = useState<CaptainApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [licenseCategories, setLicenseCategories] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');
  const [cnicFrontUrl, setCnicFrontUrl] = useState('');
  const [cnicBackUrl, setCnicBackUrl] = useState('');
  const [licenseFrontUrl, setLicenseFrontUrl] = useState('');
  const [vehicleDesc, setVehicleDesc] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) fetchApplication();
  }, [user?.id]);

  const fetchApplication = async () => {
    if (!user || !user.id) return;  // guard: never query with undefined id
    setLoading(true);
    const { data } = await supabase
      .from('captain_applications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();  // use maybeSingle — returns null instead of error when no row exists
    if (data) {
      setApp(data);
      if (data.status === 'approved') {
        onApproved(data.approved_vehicle_types || []);
      }
    }
    setLoading(false);
  };

  const uploadDoc = async (file: File, field: string) => {
    setUploading(field);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dl86obm3b';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'enb_cnic_private');
    formData.append('folder', 'enb/captain_docs');
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (field === 'cnic_front') setCnicFrontUrl(data.secure_url);
      if (field === 'cnic_back') setCnicBackUrl(data.secure_url);
      if (field === 'license_front') setLicenseFrontUrl(data.secure_url);
    } catch {
      setError('Document upload failed. Please try again.');
    }
    setUploading(null);
  };

  const handleFileInput = (field: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadDoc(file, field);
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!user || !user.id) return;
    if (licenseCategories.length === 0) { setError('Please select at least one license category.'); return; }
    if (!licenseFrontUrl) { setError('Please upload your driving license.'); return; }
    if (!cnicFrontUrl) { setError('Please upload your CNIC front.'); return; }
    setSubmitting(true);
    setError('');
    const { error: err } = await getDb().from('captain_applications').upsert({
      user_id: user.id,
      status: 'pending',
      license_categories: licenseCategories,
      cnic_front_url: cnicFrontUrl,
      cnic_back_url: cnicBackUrl || null,
      license_front_url: licenseFrontUrl,
      vehicle_description: vehicleDesc || null,
      motivation: motivation || null,
      applied_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    fetchApplication();
    setShowForm(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
    </div>
  );

  // ── APPROVED — should not reach here (parent redirects) ──────────────────
  if (app?.status === 'approved') return null;

  // ── PENDING ──────────────────────────────────────────────────────────────
  if (app?.status === 'pending') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Clock className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
          <p className="font-semibold text-amber-800">Application Under Review</p>
          <p className="text-sm text-amber-700 mt-0.5">
            We'll notify you via inbox when your ENB Captain status is approved. This usually takes 1–2 business days.
          </p>
        </div>
      </div>
      <div className="text-xs text-gray-400 text-center">
        Applied {new Date(app.applied_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );

  // ── REJECTED ─────────────────────────────────────────────────────────────
  if (app?.status === 'rejected') return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-800">Application Not Approved</p>
          {app.admin_note && (
            <p className="text-sm text-red-700 mt-1">Reason: {app.admin_note}</p>
          )}
          <p className="text-sm text-red-600 mt-2">
            Please address the issues above and reapply.
          </p>
        </div>
      </div>
      <Button
        onClick={() => setShowForm(true)}
        className="w-full bg-enb-green text-white"
      >
        Reapply as ENB Captain
      </Button>
    </div>
  );

  // ── SUSPENDED ─────────────────────────────────────────────────────────────
  if (app?.status === 'suspended') return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
      <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-800">Captain Status Suspended</p>
        <p className="text-sm text-red-700 mt-1">{app.admin_note || 'Please contact support.'}</p>
      </div>
    </div>
  );

  // ── NO APPLICATION YET — CTA + Form ──────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Hero CTA */}
      <div className="bg-gradient-to-br from-enb-green to-enb-teal rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isUrdu ? 'ENB کیپٹن بنیں' : 'Become an ENB Captain'}</h2>
            <p className="text-white/80 text-sm">{isUrdu ? 'تصدیق شدہ کمیونٹی سواری' : 'Verified community ride-sharing'}</p>
          </div>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">
          {isUrdu
            ? 'ENB کیپٹن تصدیق شدہ ڈرائیور ہوتے ہیں جو ہر مسافر کے لیے $ENB کماتے ہیں۔ ایک بار درخواست دیں، ہمیشہ کے لیے سواری کریں۔'
            : 'ENB Captains are verified drivers who earn $ENB for every passenger they carry. Apply once, ride forever.'}
        </p>
      </div>

      {/* Perks */}
      <Card className="border-gray-100 p-4 space-y-3">
        <p className="text-sm font-semibold text-enb-text-primary">{isUrdu ? 'کیپٹن فوائد' : 'Captain Benefits'}</p>
        {PERKS.map((p, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-lg shrink-0">{p.icon}</span>
            <p className="text-sm text-enb-text-secondary">{isUrdu ? p.ur : p.en}</p>
          </div>
        ))}
      </Card>

      {/* Vehicle unlock preview */}
      <Card className="border-gray-100 p-4 space-y-3">
        <p className="text-sm font-semibold text-enb-text-primary">{isUrdu ? 'لائسنس کے مطابق گاڑیاں' : 'Vehicles by License Type'}</p>
        {LICENSE_CATEGORIES.map(cat => (
          <div key={cat.id} className="flex items-start gap-3">
            <span className="text-lg shrink-0">{cat.icon}</span>
            <div>
              <p className="text-sm font-medium text-enb-text-primary">{isUrdu ? cat.labelUr : cat.label}</p>
              <p className="text-xs text-gray-400">{isUrdu ? 'کھلتی ہیں: ' : 'Unlocks: '}{isUrdu ? cat.unlocksUr.join('، ') : cat.unlocks.join(', ')}</p>
            </div>
          </div>
        ))}
      </Card>

      {/* Apply button / Form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full h-12 bg-enb-green hover:bg-enb-green/90 text-white text-base font-semibold shadow-lg shadow-enb-green/20"
        >
          {isUrdu ? 'ابھی درخواست دیں — ENB کیپٹن بنیں' : 'Apply Now — Become an ENB Captain'}
        </Button>
      ) : (
        <Card className="border-enb-green/20 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-enb-text-primary">{isUrdu ? 'کیپٹن درخواست' : 'Captain Application'}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* License categories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">
              {isUrdu ? 'لائسنس کی اقسام' : 'License Categories'} <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400">{isUrdu ? "اپنے لائسنس کے مطابق سب کا انتخاب کریں" : "Select all that apply to your license"}</p>
            {LICENSE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setLicenseCategories(prev =>
                  prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                )}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  licenseCategories.includes(cat.id)
                    ? 'bg-enb-green text-white border-enb-green'
                    : 'bg-white border-gray-200 text-enb-text-primary'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <div>
                  <div>{isUrdu ? cat.labelUr : cat.label}</div>
                  <div className={`text-xs font-normal ${licenseCategories.includes(cat.id) ? 'text-white/70' : 'text-gray-400'}`}>
                    {isUrdu ? 'کھلتی ہیں: ' : 'Unlocks: '}{isUrdu ? cat.unlocksUr.join('، ') : cat.unlocks.join(', ')}
                  </div>
                </div>
                {licenseCategories.includes(cat.id) && <CheckCircle className="w-4 h-4 ml-auto shrink-0" />}
              </button>
            ))}
          </div>

          {/* Document uploads */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-enb-text-primary">{isUrdu ? 'ضروری دستاویزات' : 'Documents Required'}</label>

            {[
              { field: 'cnic_front', label: isUrdu ? 'شناختی کارڈ — سامنے' : 'CNIC — Front', url: cnicFrontUrl, required: true },
              { field: 'cnic_back', label: isUrdu ? 'شناختی کارڈ — پیچھے' : 'CNIC — Back', url: cnicBackUrl, required: false },
              { field: 'license_front', label: isUrdu ? 'ڈرائیونگ لائسنس' : 'Driving License', url: licenseFrontUrl, required: true },
            ].map(doc => (
              <div key={doc.field}>
                <p className="text-xs text-gray-500 mb-1">
                  {doc.label} {doc.required && <span className="text-red-500">*</span>}
                </p>
                {doc.url ? (
                  <div className="flex items-center gap-2 p-2 bg-enb-green/10 border border-enb-green/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-enb-green shrink-0" />
                    <span className="text-xs text-enb-green font-medium flex-1">Uploaded ✓</span>
                    <button
                      onClick={() => {
                        if (doc.field === 'cnic_front') setCnicFrontUrl('');
                        if (doc.field === 'cnic_back') setCnicBackUrl('');
                        if (doc.field === 'license_front') setLicenseFrontUrl('');
                      }}
                      className="text-gray-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleFileInput(doc.field)}
                    disabled={uploading === doc.field}
                    className="w-full flex items-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm hover:border-enb-green/40 transition-colors"
                  >
                    {uploading === doc.field
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Upload className="w-4 h-4" />}
                    {uploading === doc.field ? (isUrdu ? 'اپلوڈ ہو رہا ہے...' : 'Uploading...') : `${isUrdu ? 'اپلوڈ کریں: ' : 'Upload '}${doc.label}`}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Vehicle description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-enb-text-primary">
              {isUrdu ? 'گاڑی کی تفصیل' : 'Vehicle Description'} <span className="text-gray-400 font-normal">({isUrdu ? 'اختیاری' : 'optional'})</span>
            </label>
            <input
              value={vehicleDesc}
              onChange={e => setVehicleDesc(e.target.value)}
              placeholder={isUrdu ? "مثلاً: سفید ٹویوٹا کرولا 2019، نمبر پلیٹ ABC-123" : "e.g. White Toyota Corolla 2019, Registration ABC-123"}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-enb-green"
            />
          </div>

          {/* Motivation */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-enb-text-primary">
              {isUrdu ? 'آپ ENB کیپٹن کیوں بننا چاہتے ہیں؟' : 'Why do you want to be an ENB Captain?'} <span className="text-gray-400 font-normal">({isUrdu ? 'اختیاری' : 'optional'})</span>
            </label>
            <textarea
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              placeholder={isUrdu ? "اپنے بارے میں بتائیں اور شامل ہونے کی وجہ..." : "Tell us a bit about yourself and why you'd like to join..."}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none h-20 focus:outline-none focus:border-enb-green"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || !!uploading}
            className="w-full h-12 bg-enb-green hover:bg-enb-green/90 text-white font-semibold disabled:opacity-50"
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isUrdu ? 'جمع ہو رہا ہے...' : 'Submitting...'}</>
              : (isUrdu ? 'کیپٹن درخواست جمع کریں' : 'Submit Captain Application')}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            {isUrdu ? 'آپ کے دستاویزات محفوظ ہیں اور صرف ENB منتظمین دیکھ سکتے ہیں۔' : 'Your documents are stored securely and only visible to ENB administrators.'}
          </p>
        </Card>
      )}
    </div>
  );
}
