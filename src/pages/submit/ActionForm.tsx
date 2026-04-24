import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, Loader2, AlertCircle, X, Plus, Users, Clock, Weight, TreePine, Car, Wrench, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface ActionFormProps {
  actionType: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const MAX_PHOTOS = 5;

// Behavioural CAPTCHA — 15 questions, randomised correct answer positions
const CAPTCHA_QUESTIONS = [

  // ── CATEGORY 1: LOCAL KNOWLEDGE (proves they know Rawalpindi / Pakistan) ──
  {
    q: 'Chaklala Scheme 3 kis shehar mein hai?',
    options: ['Lahore', 'Rawalpindi', 'Karachi', 'Peshawar'],
    correct: 1,
  },
  {
    q: 'Pakistan mein qaumi shanaakhti card ka naam kya hai?',
    options: ['Aadhar Card', 'CNIC', 'NIC', 'Smart Card'],
    correct: 1,
  },
  {
    q: 'Pakistan mein rozana kitni namazein farz hain?',
    options: ['3', '4', '5', '6'],
    correct: 2,
  },
  {
    q: 'Rawalpindi kis sube mein hai?',
    options: ['Sindh', 'KPK', 'Punjab', 'Balochistan'],
    correct: 2,
  },
  {
    q: 'Pakistan ka qaumi khel kaunsa hai?',
    options: ['Cricket', 'Hockey', 'Football', 'Kabaddi'],
    correct: 1,
  },
  {
    q: 'Mohalle ki safai ke liye kaun zimmedar hai?',
    options: ['Sirf government', 'Har mohalle wala', 'Sirf safai wale', 'Koi nahi'],
    correct: 1,
  },
  {
    q: 'Pakistan ka qaumi phool kaunsa hai?',
    options: ['Gulab', 'Chameli', 'Yasmin', 'Lotus'],
    correct: 1,
  },

  // ── CATEGORY 2: ENB ECOSYSTEM KNOWLEDGE (proves they read the app) ──
  {
    q: 'ENB ka matlab kya hai?',
    options: ['Eco-Neighbor', 'Energy Building', 'Earn Now Better', 'Eco Network Bank'],
    correct: 0,
  },
  {
    q: 'Helper Tier ke liye kitne Rep Score chahiye?',
    options: ['1,000', '2,500', '5,000', '10,000'],
    correct: 2,
  },
  {
    q: 'Kya ENB.LOCAL ko DEX par becha ja sakta hai?',
    options: ['Haan, kabhi bhi', 'Nahi, yeh non-tradeable hai', 'Haan, sirf Pillar Tier ke liye', 'Haan, 1 saal baad'],
    correct: 1,
  },
  {
    q: 'Har submission ko kitne moderators review karte hain?',
    options: ['1', '2', '3', '4'],
    correct: 1,
  },
  {
    q: 'CNIC verify nahi hua toh aapke ENB ka kya hoga?',
    options: ['Delete ho jayenge', 'Locked rahenge', 'Double ho jayenge', 'Kuch nahi hoga'],
    correct: 1,
  },
  {
    q: 'Neighbourhood Cleanup karne par kitne ENB milte hain?',
    options: ['500', '750', '1,000', '2,000'],
    correct: 2,
  },
  {
    q: 'Maturation Bridge ke liye minimum Rep Score kya hai?',
    options: ['5,000', '20,000', '50,000', '100,000'],
    correct: 2,
  },
  {
    q: 'ENB app mein action submit karte waqt photo kaise leni chahiye?',
    options: ['Gallery se koi bhi photo', 'Live camera se', 'Internet se download karke', 'Screenshot se'],
    correct: 1,
  },
  {
    q: 'Tree planting karne par kitne ENB milte hain?',
    options: ['500', '1,000', '1,500', '2,000'],
    correct: 3,
  },
  {
    q: 'ENB community channel kaun sa hai?',
    options: ['Telegram', 'WhatsApp', 'Facebook', 'Discord'],
    correct: 1,
  },
  {
    q: 'Referral code se apne dost ko join karane par kitne ENB milte hain?',
    options: ['100', '250', '500', '1,000'],
    correct: 2,
  },

  // ── CATEGORY 3: CIVIC AWARENESS (reinforces mission values) ──
  {
    q: 'Agar aap sadak par illegal kachra dekhen toh kya karein?',
    options: ['Ignore karein', 'ENB app mein report karein', 'Khud bhi wahan daalein', 'Doosron ko batayein aur chalte rahein'],
    correct: 1,
  },
  {
    q: 'Inme se kaunsa ENB community action hai?',
    options: ['TV dekhna', 'Social media chalana', 'Darakhton ki plantng', 'Dukan mein baithna'],
    correct: 2,
  },
  {
    q: 'Apne mohalle ki safai karna kaisi baat hai?',
    options: ['Bekar kaam', 'Sirf government ka kaam', 'Puri community ki zimmedari', 'Waste of time'],
    correct: 2,
  },
  {
    q: 'Khanay ki fizool barbadi rokne se kya faida hota hai?',
    options: ['Koi faida nahi', 'Maahol behtar hota hai aur zarooratmandoN ki madad hoti hai', 'Sirf paisa bachta hai', 'Koi farq nahi padta'],
    correct: 1,
  },
  {
    q: 'Hunar sikhana (skill workshop) ENB mein kyun reward hota hai?',
    options: ['Kyunke yeh asaan hai', 'Kyunke yeh community ko strong banata hai', 'Kyunke yeh fun hai', 'Kyunke rules mein hai'],
    correct: 1,
  },
  {
    q: 'Which of these is a valid ENB civic action?',
    options: ['Watching TV at home', 'Planting a tree in the neighbourhood', 'Sleeping all day', 'Shopping at a mall'],
    correct: 1,
  },
  {
    q: 'If you see a broken streetlight, the right action is:',
    options: ['Ignore it', 'Report it on the ENB app to earn ENB', 'Break another one', 'Tell your friends and forget about it'],
    correct: 1,
  },
  {
    q: 'Why does ENB reward carpooling?',
    options: ['It saves money only', 'It reduces traffic and air pollution', 'It is faster than driving alone', 'It is a fun activity'],
    correct: 1,
  },
  {
    q: 'Food sharing in ENB is rewarded because:',
    options: ['It is easy to do', 'It reduces waste and feeds people in need', 'It is a tradition', 'It earns the most ENB'],
    correct: 1,
  },
  {
    q: 'What makes ENB different from regular money?',
    options: ['You can invest it in stocks', 'It is earned only through verified community service — not bought', 'It can be exchanged for dollars', 'It expires after one month'],
    correct: 1,
  },
  {
    q: 'ENB.LOCAL tokens ka maqsad kya hai?',
    options: ['DEX par trading karna', 'Mahalle mein services aur discounts ke liye kharch karna', 'Bank mein jama karna', 'Online shopping ke liye'],
    correct: 1,
  },
  {
    q: 'Ek achha shehri apne mohalle ke liye kya karta hai?',
    options: ['Sirf apne ghar ki fikr karta hai', 'Doosron ki madad karta hai aur maahol behtar banata hai', 'Bahar nahi jaata', 'Sirf social media use karta hai'],
    correct: 1,
  },
];

interface PhotoItem {
  preview: string;
  cloudinaryUrl: string | null;
  uploading: boolean;
  file: File;
}

// ─── Per-action config ──────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, {
  title: string;
  hint: string;             // what photos to take
  photoLabel: string;
  fields: FieldDef[];
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
    hint: 'Photo inside the vehicle showing multiple passengers. Faces can be blurred if preferred.',
    photoLabel: 'Photo with Passengers',
    fields: [
      { id: 'passengers', label: 'Number of passengers (excluding driver)', type: 'number', placeholder: 'e.g. 3', required: true },
      { id: 'route', label: 'Route / destination', type: 'text', placeholder: 'e.g. Chaklala Scheme 3 to Blue Area', required: true },
      { id: 'vehicle_type', label: 'Vehicle type', type: 'select', required: true,
        options: ['Car', 'Van/Minivan', 'Rickshaw', 'Auto-rickshaw', 'Bus/Coaster'] },
      { id: 'distance_km', label: 'Approximate distance (km)', type: 'number', placeholder: 'e.g. 12', required: false },
    ],
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
    hint: 'Photo of the completed work. Before/after photos are strongly recommended for higher approval rate.',
    photoLabel: 'Photo of Completed Work',
    fields: [
      { id: 'trade_type', label: 'Trade / skill used', type: 'select', required: true,
        options: ['Plumbing', 'Electrical', 'Carpentry / woodwork', 'Masonry / construction', 'Painting / decorating', 'Welding / metalwork', 'Auto repair', 'Appliance repair', 'Other trade'] },
      { id: 'job_description', label: 'Work performed', type: 'text', placeholder: 'e.g. Fixed leaking pipe under kitchen sink', required: true },
      { id: 'client_type', label: 'Client type', type: 'select', required: true,
        options: ['Household — neighbour', 'Household — family', 'Small business', 'Community space / mosque', 'Public area'] },
      { id: 'duration', label: 'Job duration (minutes)', type: 'number', placeholder: 'e.g. 90', required: false },
      { id: 'customer_confirmed', label: 'Customer confirmation', type: 'select', required: true,
        options: ['Customer present for photo', 'Customer confirmed by WhatsApp', 'Not yet confirmed'] },
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
  const [captchaIdx] = useState(() => Math.floor(Math.random() * CAPTCHA_QUESTIONS.length));
  const [captchaAnswer, setCaptchaAnswer] = useState<number | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [formStartTime] = useState(Date.now());
  const [touchEvents, setTouchEvents] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const captcha = CAPTCHA_QUESTIONS[captchaIdx];

  useEffect(() => {
    const handler = () => setTouchEvents(n => n + 1);
    window.addEventListener('touchstart', handler, { passive: true });
    return () => window.removeEventListener('touchstart', handler);
  }, []);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const openCamera = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          const p = videoRef.current.play();
          if (p !== undefined) p.catch(() => videoRef.current?.play());
        }
      }, 100);
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

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `action_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const preview = canvas.toDataURL('image/jpeg', 0.8);
      const newPhoto: PhotoItem = { preview, cloudinaryUrl: null, uploading: true, file };
      setPhotos(prev => [...prev, newPhoto]);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCameraActive(false);
      uploadPhoto(file, preview);
    }, 'image/jpeg', 0.85);
  };

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
  const canSubmit = photos.length > 0 && !anyUploading && requiredFieldsMet && gpsLat && captchaAnswer !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (captchaAnswer !== captcha.correct) { setCaptchaFailed(true); return; }

    const timeMs = Date.now() - formStartTime;
    const captchaScore = parseFloat((Math.min(timeMs / 10000, 1) * 0.4 + Math.min(touchEvents / 5, 1) * 0.3 + 0.3).toFixed(2));
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
      customFields: fieldValues,
      gpsLat,
      gpsLng,
      gpsAddress,
      imageSource: 'CAMERA',
      captchaScore,
      timestamp: new Date().toISOString(),
    });
  };

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
              onClick={() => videoRef.current?.play()}
            />
            <canvas ref={canvasRef} className="hidden" />
            <Button
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white text-enb-green border-4 border-enb-green hover:bg-enb-green hover:text-white"
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

      {/* ── Custom Action Fields ── */}
      {config.fields.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-enb-text-primary mb-3">Action Details</p>
          <ActionFields
            fields={config.fields}
            values={fieldValues}
            onChange={(id, val) => setFieldValues(prev => ({ ...prev, [id]: val }))}
          />
        </div>
      )}

      {/* ── CAPTCHA ── */}
      <div className="space-y-2 bg-enb-green/5 border border-enb-green/20 rounded-xl p-4">
        <label className="text-sm font-bold text-enb-text-primary">Quick Check 🌿</label>
        <p className="text-sm text-enb-text-secondary">{captcha.q}</p>
        <div className="flex flex-col gap-2 mt-2">
          {captcha.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { setCaptchaAnswer(i); setCaptchaFailed(false); }}
              className={`text-left p-3 rounded-lg border text-sm font-medium transition-all ${captchaAnswer === i ? 'bg-enb-green text-white border-enb-green' : 'bg-white border-gray-200 text-enb-text-primary hover:border-enb-green'}`}
            >
              {opt}
            </button>
          ))}
        </div>
        {captchaFailed && (
          <p className="text-sm text-red-500 mt-1">⚠️ Please answer the question correctly to continue.</p>
        )}
      </div>

      {/* ── Submit ── */}
      <Button
        onClick={handleSubmit}
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
           captchaAnswer === null ? '🌿 Please answer the quick check' : ''}
        </p>
      )}
    </div>
  );
}
