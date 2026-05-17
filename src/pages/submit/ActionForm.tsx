import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, MapPin, CheckCircle, Loader2, AlertCircle, X, Plus, Users, Clock, Weight, TreePine, Car, Wrench, Package, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// ── reCAPTCHA v3 (invisible) ─────────────────────────────────────────────────
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).grecaptcha) { resolve(); return; }
    if (document.getElementById('recaptcha-script')) {
      // Already injected — wait for it
      const interval = setInterval(() => {
        if ((window as any).grecaptcha) { clearInterval(interval); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

async function getRecaptchaToken(action: string): Promise<string> {
  await loadRecaptchaScript();
  return new Promise((resolve, reject) => {
    (window as any).grecaptcha.ready(() => {
      (window as any).grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then(resolve)
        .catch(reject);
    });
  });
}

import CarpoolSession, { RideSession } from '@/pages/submit/CarpoolSession';
import TradeJobSelector, { TRADE_TYPES, TradeType } from '@/pages/submit/TradeJobSelector';
import CaptainOnboarding from '@/pages/submit/CaptainOnboarding';

interface ActionFormProps {
  actionType: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const MAX_PHOTOS = 5;

interface PhotoItem {
  preview: string;
  cloudinaryUrl: string | null;
  uploading: boolean;
  file: File;
}

// ─── Per-action config ──────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, {
  title: string;
  hint: string;
  photoLabel: string;
  fields: FieldDef[];
  isCarpoolSession?: boolean;
}> = {
  neighbourhood_cleanup: {
    title: 'Neighbourhood Cleanup',
    hint: 'Take a before photo showing the litter, and an after photo showing the clean area.',
    photoLabel: 'Before & After Photos',
    fields: [
      { id: 'area_size', label: 'Area Cleaned', type: 'select', required: true,
        options: ['Small (under 50m²)', 'Medium (50–200m²)', 'Large (200m²+)', 'Road/Street stretch', 'Park or open ground'] },
      { id: 'waste_bags', label: 'Bags of waste collected', type: 'number', placeholder: 'e.g. 3', required: true },
      { id: 'duration', label: 'Time spent (minutes)', type: 'number', placeholder: 'e.g. 45', required: true },
      { id: 'notes', label: 'Any additional notes', type: 'textarea', placeholder: 'Type of waste found, any hazardous items, etc.', required: false },
    ],
  },

  recycling_dropoff: {
    title: 'Recycling Drop-off',
    hint: 'Photo at the recycling centre with your items visible. Include the centre name/sign if possible.',
    photoLabel: 'Photo at Recycling Centre',
    fields: [
      { id: 'material_type', label: 'Material Type', type: 'multiselect', required: true,
        options: ['Plastic bottles', 'Cardboard/Paper', 'Glass', 'Metal/Cans', 'Electronics', 'Mixed recyclables'] },
      { id: 'weight_kg', label: 'Approximate weight (kg)', type: 'number', placeholder: 'e.g. 5', required: false },
      { id: 'centre_name', label: 'Recycling centre / drop-off point', type: 'text', placeholder: 'e.g. Chaklala Waste Collection Point', required: true },
    ],
  },

  carpool: {
    title: 'Carpool',
    hint: 'Start a verified ride session. GPS tracks your route automatically — no photos or manual distance entry required.',
    photoLabel: '',
    fields: [],  // Carpool uses CarpoolSession component — not the standard field renderer
    isCarpoolSession: true,
  },

  food_sharing: {
    title: 'Food Sharing',
    hint: 'Photo of the food being shared and the recipients (or the handover moment).',
    photoLabel: 'Photo of Food & Recipients',
    fields: [
      { id: 'food_type', label: 'Type of food shared', type: 'text', placeholder: 'e.g. Cooked rice, bread, vegetables', required: true },
      { id: 'portions', label: 'Number of portions / people fed', type: 'number', placeholder: 'e.g. 10', required: true },
      { id: 'food_condition', label: 'Food condition', type: 'select', required: true,
        options: ['Freshly cooked', 'Same-day packaged', 'Surplus from event', 'Donated dry goods'] },
      { id: 'recipient_type', label: 'Recipients', type: 'select', required: true,
        options: ['Families', 'Daily wage workers', 'Elderly residents', 'Children', 'Mixed community'] },
    ],
  },

  skill_workshop: {
    title: 'Skill Workshop',
    hint: 'Photo of the session in progress showing you teaching and attendees participating.',
    photoLabel: 'Photo of Workshop in Progress',
    fields: [
      { id: 'skill_topic', label: 'Skill / topic taught', type: 'text', placeholder: 'e.g. Basic electrical safety, Urdu literacy, ENB app usage', required: true },
      { id: 'attendees', label: 'Number of attendees', type: 'number', placeholder: 'e.g. 12', required: true },
      { id: 'duration', label: 'Duration (minutes)', type: 'number', placeholder: 'e.g. 60', required: true },
      { id: 'audience_type', label: 'Audience', type: 'select', required: true,
        options: ['Youth (under 18)', 'Adults', 'Women only', 'Tradespeople', 'Mixed community'] },
      { id: 'notes', label: 'What was covered', type: 'textarea', placeholder: 'Brief summary of what was taught...', required: false },
    ],
  },

  infrastructure_report: {
    title: 'Infrastructure Report',
    hint: 'Clear photo of the issue. Include context (street sign, landmark) so location can be verified.',
    photoLabel: 'Photo of the Issue',
    fields: [
      { id: 'issue_type', label: 'Type of issue', type: 'select', required: true,
        options: ['Broken road / pothole', 'Damaged footpath', 'Leaking water pipe', 'Broken streetlight', 'Sewage overflow', 'Illegal dumping', 'Damaged public property', 'Other'] },
      { id: 'severity', label: 'Severity', type: 'select', required: true,
        options: ['Minor — cosmetic damage', 'Moderate — inconvenient', 'Serious — safety hazard', 'Critical — immediate danger'] },
      { id: 'landmark', label: 'Nearest landmark or street', type: 'text', placeholder: 'e.g. Near Masjid Al-Noor, Chaklala Scheme 3', required: true },
      { id: 'reported_before', label: 'Has this been reported before?', type: 'select', required: false,
        options: ['No — first report', 'Yes — still unresolved', 'Unknown'] },
    ],
  },

  trade_job: {
    title: 'Trade Job',
    hint: '',  // Visual selector replaces text hint for trade jobs
    photoLabel: 'Photo of Completed Work',
    isTradeJobSelector: true,  // Uses TradeJobSelector component instead of dropdown
    fields: [
      { id: 'trade_type', label: 'Trade / skill used', type: 'select', required: true,
        options: ['Plumbing', 'Electrical', 'Carpentry / woodwork', 'Masonry / construction', 'Painting / decorating', 'Welding / metalwork', 'Auto repair', 'Appliance repair', 'Other trade'] },
      { id: 'job_description', label: 'Work performed', type: 'text', placeholder: 'e.g. Fixed leaking pipe under kitchen sink', required: true },
      { id: 'client_type', label: 'Client type', type: 'select', required: true,
        options: ['Household — neighbour', 'Household — family', 'Small business', 'Community space / mosque', 'Public area'] },
      { id: 'duration', label: 'Job duration (minutes)', type: 'number', placeholder: 'e.g. 90', required: false },
      { id: 'customer_confirmed', label: 'Customer confirmation', type: 'select', required: true,
        options: ['Customer present for photo', 'Customer confirmed by WhatsApp', 'Not yet confirmed'] },
      // Optional: link to the job code generated via StartJobModal so the pending
      // job moves from "Pending" to "Portfolio" when this submission is approved.
      { id: 'linked_job_code', label: 'Link to Job Code (optional)', type: 'text',
        placeholder: 'e.g. ENB-A1B2-C3D4 — leave blank if not applicable', required: false },
    ],
  },

  youth_mentoring: {
    title: 'Youth Mentoring',
    hint: 'Photo of the mentoring session. The young person\'s face can be partially obscured for privacy.',
    photoLabel: 'Photo of Mentoring Session',
    fields: [
      { id: 'mentee_count', label: 'Number of mentees', type: 'number', placeholder: 'e.g. 2', required: true },
      { id: 'session_topic', label: 'Topic / area of mentoring', type: 'text', placeholder: 'e.g. Career guidance, digital literacy, maths tutoring', required: true },
      { id: 'duration', label: 'Session duration (minutes)', type: 'number', placeholder: 'e.g. 60', required: true },
      { id: 'age_group', label: 'Age group of mentees', type: 'select', required: true,
        options: ['Under 12', '12–15 years', '16–18 years', '18–25 years (young adult)'] },
      { id: 'session_number', label: 'Is this part of an ongoing programme?', type: 'select', required: false,
        options: ['One-time session', 'Session 2', 'Session 3', 'Session 4+', 'Ongoing regular sessions'] },
    ],
  },

  tree_planting: {
    title: 'Tree Planting',
    hint: 'Photo of you planting the tree, showing the sapling in the ground with surrounding area visible.',
    photoLabel: 'Photo of Tree Being Planted',
    fields: [
      { id: 'tree_count', label: 'Number of trees planted', type: 'number', placeholder: 'e.g. 3', required: true },
      { id: 'tree_species', label: 'Tree species (if known)', type: 'text', placeholder: 'e.g. Neem, Eucalyptus, Shisham, Unknown', required: false },
      { id: 'location_type', label: 'Planting location', type: 'select', required: true,
        options: ['Public road / footpath', 'Park or open ground', 'School / madrassa grounds', 'Mosque / community grounds', 'Private garden', 'Community farm'] },
      { id: 'water_source', label: 'Water source for maintenance', type: 'select', required: true,
        options: ['I will water regularly', 'Community member will water', 'Rain-fed / natural', 'Irrigation system nearby'] },
    ],
  },

  waste_reporting: {
    title: 'Waste Reporting',
    hint: 'Clear photo showing the dumping site. Include a landmark for location verification.',
    photoLabel: 'Photo of Dumping Site',
    fields: [
      { id: 'waste_type', label: 'Type of waste', type: 'select', required: true,
        options: ['Household garbage', 'Construction debris', 'Industrial / chemical waste', 'Medical waste', 'Plastic/packaging', 'Mixed waste'] },
      { id: 'quantity', label: 'Estimated quantity', type: 'select', required: true,
        options: ['Small — a few bags', 'Medium — pickup truck load', 'Large — multiple loads', 'Very large — ongoing site'] },
      { id: 'landmark', label: 'Nearest landmark or street', type: 'text', placeholder: 'e.g. Behind petrol station, G.T. Road', required: true },
      { id: 'ongoing', label: 'Is dumping ongoing?', type: 'select', required: false,
        options: ['One-time / old dump', 'Appears to be ongoing', 'Unknown'] },
    ],
  },
};

// ─── Field types ────────────────────────────────────────────────────────────
interface FieldDef {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'multiselect';
  placeholder?: string;
  options?: string[];
  required: boolean;
}

// ─── Custom fields renderer ─────────────────────────────────────────────────
function ActionFields({ fields, values, onChange }: {
  fields: FieldDef[];
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.id} className="space-y-1.5">
          <label className="text-sm font-medium text-enb-text-primary">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === 'text' && (
            <Input
              value={values[field.id] || ''}
              onChange={e => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          )}

          {field.type === 'number' && (
            <Input
              type="number"
              min="1"
              value={values[field.id] || ''}
              onChange={e => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          )}

          {field.type === 'textarea' && (
            <Textarea
              value={values[field.id] || ''}
              onChange={e => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="resize-none h-20 bg-white"
            />
          )}

          {field.type === 'select' && (
            <div className="flex flex-col gap-1.5">
              {field.options!.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(field.id, opt)}
                  className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    values[field.id] === opt
                      ? 'bg-enb-green text-white border-enb-green'
                      : 'bg-white border-gray-200 text-enb-text-primary hover:border-enb-green/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {field.type === 'multiselect' && (
            <div className="flex flex-wrap gap-2">
              {field.options!.map(opt => {
                const selected: string[] = values[field.id] || [];
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (isSelected) onChange(field.id, selected.filter(s => s !== opt));
                      else onChange(field.id, [...selected, opt]);
                    }}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-enb-green text-white border-enb-green'
                        : 'bg-white border-gray-200 text-enb-text-primary hover:border-enb-green/40'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ActionForm({ actionType, onSubmit, onBack }: ActionFormProps) {
  const config = ACTION_CONFIG[actionType] || {
    title: actionType.replace(/_/g, ' '),
    hint: 'Take a clear photo showing your action.',
    photoLabel: 'Photo Proof',
    fields: [],
  };

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [formStartTime] = useState(Date.now());
  const [touchEvents, setTouchEvents] = useState(0);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const handler = () => setTouchEvents(n => n + 1);
    window.addEventListener('touchstart', handler, { passive: true });
    return () => window.removeEventListener('touchstart', handler);
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  // Attach stream AFTER cameraActive=true renders <video> into DOM
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

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setVideoReady(false);
  };

  const openCamera = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    setCameraError('');
    setVideoReady(false);
    try {
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
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Camera access denied. Civic action photos must be taken live — gallery uploads not accepted.'
      );
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video.videoWidth || !video.videoHeight) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `action_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const preview = canvas.toDataURL('image/jpeg', 0.8);
      if (preview.length < 1000) return; // sanity check — black frame guard
      const newPhoto: PhotoItem = { preview, cloudinaryUrl: null, uploading: true, file };
      setPhotos(prev => [...prev, newPhoto]);
      stopCamera();
      uploadPhoto(file, preview);
    }, 'image/jpeg', 0.85);
  }, []);

  const uploadPhoto = async (file: File, preview: string) => {
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dl86obm3b';
      const preset = import.meta.env.VITE_CLOUDINARY_ACTION_PRESET || 'enb_photos';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      formData.append('folder', 'enb/submissions/before');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      setPhotos(prev => prev.map(p =>
        p.preview === preview
          ? { ...p, cloudinaryUrl: data.secure_url || null, uploading: false }
          : p
      ));
    } catch {
      setPhotos(prev => prev.map(p =>
        p.preview === preview ? { ...p, uploading: false } : p
      ));
    }
  };

  const removePhoto = (preview: string) => {
    setPhotos(prev => prev.filter(p => p.preview !== preview));
  };

  const handleGetLocation = () => {
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        setGpsAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Check all required custom fields are filled
  const requiredFieldsMet = config.fields
    .filter(f => f.required)
    .every(f => {
      const val = fieldValues[f.id];
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== '' && val !== null;
    });

  const anyUploading = photos.some(p => p.uploading);
  const [consentGiven, setConsentGiven] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeType | null>(null);
  const isTradeJob = actionType === 'trade_job';

  // ── Carpool session state ─────────────────────────────────────────────────
  const [carpoolVehicle, setCarpoolVehicle] = useState('Car');
  const [carpoolPassengers, setCarpoolPassengers] = useState(1);
  const [carpoolSessionActive, setCarpoolSessionActive] = useState(false);
  const [carpoolSession, setCarpoolSession] = useState<RideSession | null>(null);
  const [approvedVehicles, setApprovedVehicles] = useState<string[]>([]);
  const [captainApproved, setCaptainApproved] = useState(false);

  const canSubmit = photos.length > 0 && !anyUploading && requiredFieldsMet && !!gpsLat && consentGiven
    && (!isTradeJob || selectedTrade !== null);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setCaptchaError('');

    let captchaScore = 0.5;
    let recaptchaToken = '';

    if (RECAPTCHA_SITE_KEY) {
      try {
        recaptchaToken = await getRecaptchaToken('submit_action');
        // Score is server-side validated via reCAPTCHA; use behavioural proxy for Supabase record
        const timeMs = Date.now() - formStartTime;
        captchaScore = parseFloat(
          (Math.min(timeMs / 10000, 1) * 0.4 + Math.min(touchEvents / 5, 1) * 0.3 + 0.3).toFixed(2)
        );
        setCaptchaVerified(true);
      } catch {
        setCaptchaError('Security check failed. Please refresh the page and try again.');
        return;
      }
    } else {
      // No key configured — still compute behavioural score
      const timeMs = Date.now() - formStartTime;
      captchaScore = parseFloat(
        (Math.min(timeMs / 10000, 1) * 0.4 + Math.min(touchEvents / 5, 1) * 0.3 + 0.3).toFixed(2)
      );
    }
    const uploadedUrls = photos.filter(p => p.cloudinaryUrl).map(p => p.cloudinaryUrl as string);

    // Serialise custom fields into a structured description string
    const fieldLines = config.fields
      .filter(f => fieldValues[f.id] !== undefined && fieldValues[f.id] !== '')
      .map(f => {
        const val = Array.isArray(fieldValues[f.id]) ? fieldValues[f.id].join(', ') : fieldValues[f.id];
        return `${f.label}: ${val}`;
      });

    const structuredDescription = fieldLines.join('\n');

    onSubmit({
      actionType,
      photo: uploadedUrls[0] || photos[0].preview,
      photoUrls: uploadedUrls.length > 0 ? uploadedUrls : photos.map(p => p.preview),
      photoCount: photos.length,
      description: structuredDescription,
      customFields: {
        ...fieldValues,
        ...(isTradeJob && selectedTrade ? {
          trade_type: selectedTrade.id,
          trade_before_after: selectedTrade.beforeAfter,
        } : {}),
      },
      // Pass linked_job_code so SubmitAction can wire submission_id → job_requests
      linkedJobCode: isTradeJob ? (fieldValues['linked_job_code'] || null) : null,
      gpsLat,
      gpsLng,
      gpsAddress,
      imageSource: 'CAMERA',
      captchaScore,
      recaptchaToken,
      timestamp: new Date().toISOString(),
      consentGiven,
    });
  };

  // ── Carpool session rendering ────────────────────────────────────────────
  if (config.isCarpoolSession) {
    if (carpoolSessionActive) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-enb-text-primary">Carpool</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Ride in progress</span>
          </div>
          <CarpoolSession
            vehicleType={carpoolVehicle}
            passengers={carpoolPassengers}
            onRideComplete={(session) => {
              setCarpoolSession(session);
              setCarpoolSessionActive(false);
              // Build submission payload and pass to parent
              onSubmit({
                actionType: 'carpool',
                description: [
                  `Vehicle: ${session.vehicleType}`,
                  `Passengers: ${session.passengers}`,
                  `Distance: ${session.calculatedDistanceKm} km`,
                  `Duration: ${session.calculatedDurationMin} min`,
                  `Speed: ${session.avgSpeedKmh} km/h${session.speedFlagged ? ' ⚠️ flagged' : ''}`,
                  `Ride token: ${session.rideToken}`,
                ].join('\n'),
                customFields: {
                  vehicle_type: session.vehicleType,
                  passengers: session.passengers,
                  distance_km: session.calculatedDistanceKm,
                  duration_min: session.calculatedDurationMin,
                  avg_speed_kmh: session.avgSpeedKmh,
                  speed_flagged: session.speedFlagged,
                  ride_token: session.rideToken,
                  waypoints: session.waypoints,
                },
                photo: null,
                photoUrls: [],
                photoCount: 0,
                gpsLat: session.originLat,
                gpsLng: session.originLng,
                gpsAddress: `${session.originLat.toFixed(5)}, ${session.originLng.toFixed(5)}`,
                imageSource: 'GPS_SESSION',
                captchaScore: 0.9,
                recaptchaToken: '',
                timestamp: session.originTimestamp,
                consentGiven: true,
                rideSession: session,
              });
            }}
            onCancel={() => setCarpoolSessionActive(false)}
          />
        </div>
      );
    }

    // Pre-ride setup screen — only shown after Captain approval sets approvedVehicles
    const VEHICLES = approvedVehicles.length > 0 ? approvedVehicles : [];
    const maxPassengers = carpoolVehicle === 'Bike' ? 1 : 8;
    const canStartRide = carpoolPassengers >= 1 && VEHICLES.length > 0;

    // Show CaptainOnboarding if not yet approved
    if (!captainApproved) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-enb-text-secondary text-sm">← Back</button>
            <h2 className="text-xl font-bold text-enb-text-primary">Carpool</h2>
            <div className="w-16" />
          </div>
          <CaptainOnboarding
            onApproved={(vehicleTypes) => {
              setApprovedVehicles(vehicleTypes);
              setCaptainApproved(true);
              if (vehicleTypes.length > 0) setCarpoolVehicle(vehicleTypes[0]);
            }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-enb-text-secondary text-sm">← Back</button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-enb-text-primary">Carpool</h2>
            <span className="text-xs bg-enb-gold/20 text-enb-gold font-bold px-2 py-0.5 rounded-full">🚗 Captain</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 text-sm text-enb-text-secondary">
          {config.hint}
        </div>

        {/* Vehicle type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-enb-text-primary">Vehicle Type <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLES.map(v => (
              <button
                key={v}
                onClick={() => {
                  setCarpoolVehicle(v);
                  if (v === 'Bike') setCarpoolPassengers(1);
                }}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                  carpoolVehicle === v
                    ? 'bg-enb-green text-white border-enb-green'
                    : 'bg-white border-gray-200 text-enb-text-primary'
                }`}
              >
                {v === 'Bike' && '🌿 '}
                {v}
                {v === 'Bike' && <span className="block text-xs opacity-70 font-normal">Most eco-friendly</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Passenger count */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-enb-text-primary">
            Passengers (excluding you) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCarpoolPassengers(p => Math.max(1, p - 1))}
              className="w-10 h-10 rounded-full border border-gray-200 text-lg font-bold text-enb-text-primary"
            >−</button>
            <span className="text-2xl font-bold text-enb-green w-8 text-center">{carpoolPassengers}</span>
            <button
              onClick={() => setCarpoolPassengers(p => Math.min(maxPassengers, p + 1))}
              className="w-10 h-10 rounded-full border border-gray-200 text-lg font-bold text-enb-text-primary"
            >+</button>
          </div>
          {carpoolVehicle === 'Bike' && (
            <p className="text-xs text-gray-400">Bike allows max 1 pillion passenger</p>
          )}
        </div>

        {/* Estimated ENB preview */}
        <div className="bg-enb-gold/10 border border-enb-gold/20 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Estimated reward per km</p>
          <p className="text-xl font-bold text-enb-gold">
            {Math.round(({
              'Bike': 100, 'Rickshaw': 120, 'Auto-rickshaw': 120,
              'Car': 150, 'Van/Minivan': 200, 'Bus/Coaster': 300
            }[carpoolVehicle] || 150) * ([1.0,1.0,1.3,1.6,2.0,2.5][Math.min(carpoolPassengers,5)]))} $ENB/km
          </p>
          <p className="text-xs text-gray-400 mt-1">+ bonuses when passengers confirm the ride</p>
        </div>

        <button
          onClick={() => setCarpoolSessionActive(true)}
          disabled={!canStartRide}
          className={`w-full h-14 rounded-xl text-lg font-bold transition-all shadow-lg ${
            canStartRide
              ? 'bg-enb-green text-white shadow-enb-green/20 hover:bg-enb-green/90'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          🚗 Start Ride
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-enb-text-secondary -ml-2">← Back</Button>
        <h2 className="text-xl font-bold text-enb-text-primary">{config.title}</h2>
        <div className="w-16" />
      </div>

      {/* Photo guidance hint */}
      <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 flex items-start gap-3">
        <Camera className="w-5 h-5 text-enb-green flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-enb-green mb-0.5">Photo guidance</p>
          <p className="text-sm text-enb-text-secondary">{config.hint}</p>
        </div>
      </div>

      {/* ── Photo Section ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-enb-text-primary">
            {config.photoLabel} <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS} photos</span>
        </div>

        {cameraActive && (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef} autoPlay playsInline muted
              className="w-full max-h-64 object-cover rounded-xl"
            />
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
          </div>
        )}

        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, idx) => (
              <div key={photo.preview} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={photo.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                {photo.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {!photo.uploading && photo.cloudinaryUrl && (
                  <div className="absolute bottom-1 left-1 bg-enb-green text-white text-[10px] px-1.5 py-0.5 rounded-full">✓</div>
                )}
                {!photo.uploading && (
                  <button
                    onClick={() => removePhoto(photo.preview)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {photos.length < MAX_PHOTOS && !cameraActive && (
              <button
                onClick={openCamera}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-enb-green bg-enb-green/5 hover:bg-enb-green/10 flex flex-col items-center justify-center gap-1 text-enb-green flex-shrink-0"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-medium">Add</span>
              </button>
            )}
          </div>
        )}

        {photos.length === 0 && !cameraActive && (
          <div>
            <Button
              onClick={openCamera}
              className="w-full h-24 border-2 border-dashed border-enb-green bg-enb-green/5 hover:bg-enb-green/10 text-enb-green flex flex-col gap-2 rounded-xl"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Open Camera</span>
            </Button>
            {cameraError && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {cameraError}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1 text-center">Gallery uploads not accepted — live photos only</p>
          </div>
        )}
      </div>

      {/* ── GPS Location ── */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-enb-text-primary">GPS Location <span className="text-red-500">*</span></label>
        <div
          onClick={!gpsAddress ? handleGetLocation : undefined}
          className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${gpsAddress ? 'bg-enb-green/10 border-enb-green/20 text-enb-green' : 'bg-white border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-50'}`}
        >
          {loadingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {gpsAddress ? `📍 ${gpsAddress}` : loadingLocation ? 'Detecting...' : 'Tap to detect GPS location'}
          </span>
          {gpsAddress && <CheckCircle className="w-4 h-4 ml-auto" />}
        </div>
      </div>

      {/* ── Trade Job: visual selector ── */}
      {isTradeJob && (
        <div className="space-y-1">
          <TradeJobSelector
            selected={selectedTrade?.id || null}
            onSelect={(trade) => {
              setSelectedTrade(trade);
              setFieldValues(prev => ({ ...prev, trade_type: trade.id }));
            }}
          />
        </div>
      )}

      {/* ── Custom Action Fields ── */}
      {config.fields.length > 0 && (
        <div className="space-y-1">
          {!isTradeJob && (
            <p className="text-sm font-semibold text-enb-text-primary mb-3">Action Details</p>
          )}
          <ActionFields
            fields={config.fields.filter(f => !(isTradeJob && f.id === 'trade_type'))}
            values={fieldValues}
            onChange={(id, val) => setFieldValues(prev => ({ ...prev, [id]: val }))}
          />
        </div>
      )}

      {/* ── reCAPTCHA v3 (invisible) ── */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-enb-green flex-shrink-0" />
        <p className="text-xs text-gray-500 flex-1">
          Protected by Google reCAPTCHA —{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy</a>
          {' & '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</a>
        </p>
      </div>
      {captchaError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{captchaError}
        </div>
      )}

      {/* ── Reviewer Consent ── */}
      <button
        type="button"
        onClick={() => setConsentGiven(v => !v)}
        className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left
          ${consentGiven
            ? 'border-enb-green bg-enb-green/5'
            : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
      >
        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors
          ${consentGiven ? 'bg-enb-green border-enb-green' : 'border-gray-300 bg-white'}`}>
          {consentGiven && (
            <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="2,6 5,9 10,3" />
            </svg>
          )}
        </div>
        <p className="text-xs text-enb-text-secondary leading-relaxed">
          I consent to my verified action photos and location being shared with ENB's grant reviewers
          and impact auditors for verification purposes. My personal identity will not be disclosed.
        </p>
      </button>

      {/* ── Submit ── */}
      <Button
        onClick={() => { handleSubmit(); }}
        disabled={!canSubmit}
        className="w-full h-12 text-lg shadow-lg shadow-enb-green/20 bg-enb-green hover:bg-enb-green/90 text-white"
      >
        {anyUploading
          ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Uploading photos...</>
          : 'Review Submission'}
      </Button>

      {/* Validation hint */}
      {!canSubmit && photos.length > 0 && !anyUploading && (
        <p className="text-xs text-center text-gray-400">
          {!gpsLat ? '📍 GPS location required' :
           !requiredFieldsMet ? '📋 Please fill all required fields' :
           !consentGiven ? '☑️ Please tick the consent box above' : ''}
        </p>
      )}
    </div>
  );
}
