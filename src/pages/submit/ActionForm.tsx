import { useState, useRef, useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/user';
import { useT } from '@/contexts/LanguageContext';
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

import { GPS_ACCURACY_THRESHOLD_M } from '@/lib/beforeAfter';
import CarpoolSession, { RideSession } from '@/pages/submit/CarpoolSession';
import TradeJobSelector, { TRADE_TYPES, TradeType } from '@/pages/submit/TradeJobSelector';
import CaptainOnboarding from '@/pages/submit/CaptainOnboarding';

interface ActionFormProps {
  actionType: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const MAX_PHOTOS = 5;

// GPS_ACCURACY_THRESHOLD_M imported from @/lib/beforeAfter — single source of truth

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
  titleUr?: string;
  photoLabel: string;
  photoLabelUr?: string;
  fields: FieldDef[];
  isCarpoolSession?: boolean;
}> = {
  neighbourhood_cleanup: {
    title: 'Neighbourhood Cleanup', titleUr: 'محلہ صفائی',
    hint: 'Take a before photo showing the litter, and an after photo showing the clean area.',
    photoLabel: 'Before & After Photos', photoLabelUr: 'پہلے اور بعد کی تصاویر',
    fields: [
      { id: 'area_size', label: 'Area Cleaned', labelUr: 'صاف کیا گیا علاقہ', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'small',  emoji: '🏠', label: 'Small / Under 50m²',   labelUr: 'چھوٹا / 50 مربع میٹر سے کم' },
          { value: 'medium', emoji: '🛣️', label: 'Medium / 50–200m²',    labelUr: 'درمیانہ / 50–200 مربع میٹر' },
          { value: 'large',  emoji: '🌍', label: 'Large / 200m²+',        labelUr: 'بڑا / 200 مربع میٹر سے زیادہ' },
          { value: 'road',   emoji: '🚗', label: 'Road / Street',         labelUr: 'سڑک / گلی' },
          { value: 'park',   emoji: '🌳', label: 'Park / Open ground',    labelUr: 'پارک / کھلا میدان' },
          { value: 'other',  emoji: '📍', label: 'Other Area',            labelUr: 'دوسرا علاقہ' },
        ],
      },
      { id: 'waste_bags', label: 'Bags of waste collected', labelUr: 'جمع کیے گئے کچرے کے تھیلے', type: 'stepper', required: true,
        min: 1, max: 50, unit: 'bags', unitUr: 'تھیلے', quickPicks: [1, 2, 3, 5, 10] },
      { id: 'duration', label: 'Time spent', labelUr: 'صرف کیا گیا وقت', type: 'stepper', required: true,
        min: 5, max: 240, unit: 'min', unitUr: 'منٹ', quickPicks: [15, 30, 45, 60, 90] },
      { id: 'notes', label: 'Any additional notes', labelUr: 'کوئی اضافی نوٹ', type: 'textarea',
        placeholder: 'Type of waste found, any hazardous items, etc.',
        placeholderUr: 'پائے گئے کچرے کی قسم، کوئی خطرناک اشیاء وغیرہ', required: false },
    ],
  },

  recycling_dropoff: {
    title: 'Recycling Drop-off', titleUr: 'ری سائیکلنگ',
    hint: 'Photo at the recycling centre with your items visible. Include the centre name/sign if possible.',
    photoLabel: 'Photo at Recycling Centre', photoLabelUr: 'ری سائیکلنگ سینٹر پر تصویر',
    fields: [
      { id: 'material_type', label: 'Material Type', labelUr: 'مواد کی قسم', type: 'visual_select_multi', required: true,
        visualOptions: [
          { value: 'Plastic bottles',    emoji: '🍶', label: 'Plastic',     labelUr: 'پلاسٹک' },
          { value: 'Cardboard/Paper',    emoji: '📦', label: 'Cardboard',   labelUr: 'گتہ' },
          { value: 'Glass',              emoji: '🪟', label: 'Glass',       labelUr: 'شیشہ' },
          { value: 'Metal/Cans',         emoji: '🥫', label: 'Metal/Cans',  labelUr: 'دھات / کین' },
          { value: 'Electronics',        emoji: '📱', label: 'Electronics', labelUr: 'الیکٹرونکس' },
          { value: 'Mixed recyclables',  emoji: '♻️', label: 'Mixed',       labelUr: 'ملا جلا' },
        ],
      },
      { id: 'weight_kg', label: 'Approximate weight', labelUr: 'اندازاً وزن', type: 'stepper', required: false,
        min: 1, max: 100, unit: 'kg', unitUr: 'کلو', quickPicks: [1, 2, 5, 10, 20] },
      { id: 'centre_name', label: 'Recycling centre / drop-off point', labelUr: 'ری سائیکلنگ سینٹر کا نام', type: 'text', placeholder: 'e.g. Karachi Waste Collection Point', placeholderUr: 'مثلاً: کراچی کچرہ جمع مرکز', required: true },
    ],
  },

  carpool: {
    title: 'Carpool', titleUr: 'کارپول',
    hint: 'Start a verified ride session. GPS tracks your route automatically — no photos or manual distance entry required.',
    photoLabel: '',
    fields: [],
    isCarpoolSession: true,
  },

  food_sharing: {
    title: 'Food Sharing', titleUr: 'کھانا بانٹنا',
    hint: 'Photo of the food being shared and the recipients (or the handover moment).',
    photoLabel: 'Photo of Food & Recipients', photoLabelUr: 'کھانے اور وصول کنندگان کی تصویر',
    fields: [
      { id: 'food_type', label: 'Type of food', labelUr: 'کھانے کی قسم', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Cooked rice / biryani', emoji: '🍚', label: 'Rice / Biryani',  labelUr: 'چاول / بریانی' },
          { value: 'Bread / roti',          emoji: '🍞', label: 'Bread / Roti',    labelUr: 'روٹی' },
          { value: 'Curry / dal',           emoji: '🥘', label: 'Curry / Dal',     labelUr: 'سالن / دال' },
          { value: 'Fruits / vegetables',   emoji: '🥗', label: 'Fruits / Veg',    labelUr: 'پھل / سبزی' },
          { value: 'Packaged / boxed',      emoji: '📦', label: 'Packaged',        labelUr: 'پیک شدہ' },
          { value: 'Mixed / other',         emoji: '🍱', label: 'Mixed / Other',   labelUr: 'ملا جلا / دیگر' },
        ],
      },
      { id: 'portions', label: 'People fed', labelUr: 'کھانے والے لوگ', type: 'stepper', required: true,
        min: 1, max: 500, unit: 'people', unitUr: 'افراد', quickPicks: [5, 10, 20, 30, 50] },
      { id: 'food_condition', label: 'Food condition', labelUr: 'کھانے کی حالت', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Freshly cooked',      emoji: '🔥', label: 'Freshly cooked',   labelUr: 'تازہ پکا ہوا' },
          { value: 'Same-day packaged',   emoji: '📦', label: 'Same-day packed',  labelUr: 'اسی دن پیک' },
          { value: 'Surplus from event',  emoji: '🎉', label: 'Event surplus',    labelUr: 'تقریب سے بچا' },
          { value: 'Donated dry goods',   emoji: '🌾', label: 'Dry goods',        labelUr: 'خشک اشیاء' },
        ],
      },
      { id: 'recipient_type', label: 'Recipients', labelUr: 'وصول کنندگان', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Families',           emoji: '👨‍👩‍👧', label: 'Families',       labelUr: 'خاندان' },
          { value: 'Daily wage workers', emoji: '👷',    label: 'Workers',        labelUr: 'مزدور' },
          { value: 'Elderly residents',  emoji: '👴',    label: 'Elderly',        labelUr: 'بزرگ' },
          { value: 'Children',           emoji: '👦',    label: 'Children',       labelUr: 'بچے' },
          { value: 'Mixed community',    emoji: '👥',    label: 'Mixed',          labelUr: 'ملا جلا' },
        ],
      },
    ],
  },

  skill_workshop: {
    title: 'Skill Workshop', titleUr: 'ہنر ورکشاپ',
    hint: 'Photo of the session in progress showing you teaching and attendees participating.',
    photoLabel: 'Photo of Workshop in Progress', photoLabelUr: 'ورکشاپ کی تصویر',
    fields: [
      { id: 'skill_topic', label: 'Skill / topic taught', labelUr: 'سکھایا گیا ہنر / موضوع', type: 'text', placeholder: 'e.g. Basic electrical safety, Urdu literacy, ENB app usage', placeholderUr: 'مثلاً: بنیادی بجلی کی حفاظت، اردو خواندگی، ENB ایپ', required: true },
      { id: 'attendees', label: 'Attendees', labelUr: 'شرکاء کی تعداد', type: 'stepper', required: true,
        min: 1, max: 200, unit: 'people', unitUr: 'افراد', quickPicks: [5, 10, 15, 20, 30] },
      { id: 'duration', label: 'Duration', labelUr: 'دورانیہ', type: 'stepper', required: true,
        min: 15, max: 240, unit: 'min', unitUr: 'منٹ', quickPicks: [30, 45, 60, 90, 120] },
      { id: 'audience_type', label: 'Audience', labelUr: 'سامعین', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Youth (under 18)', emoji: '👦', label: 'Youth',        labelUr: 'نوجوان' },
          { value: 'Adults',           emoji: '👨', label: 'Adults',       labelUr: 'بالغ' },
          { value: 'Women only',       emoji: '👩', label: 'Women only',   labelUr: 'صرف خواتین' },
          { value: 'Tradespeople',     emoji: '🔧', label: 'Tradespeople', labelUr: 'ہنرمند' },
          { value: 'Mixed community',  emoji: '👥', label: 'Mixed',        labelUr: 'ملا جلا' },
        ],
      },
      { id: 'notes', label: 'What was covered', labelUr: 'کیا سکھایا گیا', type: 'textarea', placeholder: 'Brief summary of what was taught...', placeholderUr: 'پڑھائے گئے مواد کا مختصر خلاصہ...', required: false },
    ],
  },

  infrastructure_report: {
    title: 'Infrastructure Report', titleUr: 'انفراسٹرکچر رپورٹ',
    hint: 'Clear photo of the issue. Include context (street sign, landmark) so location can be verified.',
    photoLabel: 'Photo of the Issue', photoLabelUr: 'مسئلے کی تصویر',
    fields: [
      { id: 'issue_type', label: 'Type of issue', labelUr: 'مسئلے کی قسم', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Broken road / pothole',    emoji: '🕳️', label: 'Pothole',      labelUr: 'گڑھا / ٹوٹی سڑک' },
          { value: 'Damaged footpath',         emoji: '🚶', label: 'Footpath',     labelUr: 'خراب فٹ پاتھ' },
          { value: 'Leaking water pipe',       emoji: '💧', label: 'Water pipe',   labelUr: 'ٹپکتا پائپ' },
          { value: 'Broken streetlight',       emoji: '💡', label: 'Streetlight',  labelUr: 'خراب لائٹ' },
          { value: 'Sewage overflow',          emoji: '🚽', label: 'Sewage',       labelUr: 'سیوریج' },
          { value: 'Illegal dumping',          emoji: '🗑️', label: 'Dumping',      labelUr: 'غیر قانونی کوڑا' },
          { value: 'Damaged public property',  emoji: '🏚️', label: 'Property',     labelUr: 'سرکاری جائیداد' },
          { value: 'Other',                    emoji: '❓', label: 'Other',        labelUr: 'دیگر' },
        ],
      },
      { id: 'severity', label: 'Severity', labelUr: 'سنگینی', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Minor — cosmetic damage',    emoji: '🟢', label: 'Minor',      labelUr: 'معمولی' },
          { value: 'Moderate — inconvenient',    emoji: '🟡', label: 'Moderate',   labelUr: 'درمیانہ' },
          { value: 'Serious — safety hazard',    emoji: '🟠', label: 'Serious',    labelUr: 'سنگین' },
          { value: 'Critical — immediate danger',emoji: '🔴', label: 'Critical',   labelUr: 'انتہائی خطرناک' },
        ],
      },
      { id: 'landmark', label: 'Nearest landmark or street', labelUr: 'قریبی پہچانی جگہ یا گلی', type: 'text', placeholder: 'e.g. Near Masjid Al-Noor, Karachi', placeholderUr: 'مثلاً: مسجد النور کے قریب، کراچی', required: true },
      { id: 'reported_before', label: 'Reported before?', labelUr: 'کیا پہلے رپورٹ ہو چکا؟', type: 'visual_select', required: false,
        visualOptions: [
          { value: 'No — first report',    emoji: '🆕', label: 'First time',        labelUr: 'پہلی بار' },
          { value: 'Yes — still unresolved', emoji: '⚠️', label: 'Yes, unresolved', labelUr: 'ہاں، حل نہیں' },
          { value: 'Unknown',              emoji: '❓', label: 'Not sure',          labelUr: 'معلوم نہیں' },
        ],
      },
    ],
  },

  trade_job: {
    title: 'Trade Job', titleUr: 'ہنر کا کام',
    hint: '',
    photoLabel: 'Photo of Completed Work', photoLabelUr: 'مکمل کام کی تصویر',
    isTradeJobSelector: true,
    fields: [
      { id: 'trade_type', label: 'Trade / skill used', type: 'select', required: true,
        options: ['Plumbing', 'Electrical', 'Carpentry / woodwork', 'Masonry / construction', 'Painting / decorating', 'Welding / metalwork', 'Auto repair', 'Appliance repair', 'Other trade'] },
      { id: 'job_description', label: 'Work performed', labelUr: 'انجام دیا گیا کام', type: 'text', placeholder: 'e.g. Fixed leaking pipe under kitchen sink', placeholderUr: 'مثلاً: کچن میں ٹوٹا پائپ ٹھیک کیا', required: true },
      { id: 'client_type', label: 'Client type', labelUr: 'گاہک کی قسم', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Household — neighbour',       emoji: '🏘️', label: 'Neighbour',   labelUr: 'پڑوسی' },
          { value: 'Household — family',          emoji: '👨‍👩‍👧', label: 'Family',     labelUr: 'خاندان' },
          { value: 'Small business',              emoji: '🏪', label: 'Business',    labelUr: 'چھوٹا کاروبار' },
          { value: 'Community space / mosque',    emoji: '🕌', label: 'Mosque/Comm', labelUr: 'مسجد / کمیونٹی' },
          { value: 'Public area',                 emoji: '🏛️', label: 'Public',      labelUr: 'عوامی جگہ' },
        ],
      },
      { id: 'duration', label: 'Job duration', labelUr: 'کام کا دورانیہ', type: 'stepper', required: false,
        min: 15, max: 480, unit: 'min', unitUr: 'منٹ', quickPicks: [30, 60, 90, 120, 180] },
      { id: 'customer_confirmed', label: 'Customer confirmation', labelUr: 'گاہک کی تصدیق', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Customer present for photo',      emoji: '📸', label: 'Photo proof',    labelUr: 'تصویر میں موجود' },
          { value: 'Customer confirmed by WhatsApp',  emoji: '💬', label: 'WhatsApp',       labelUr: 'واٹس ایپ سے تصدیق' },
          { value: 'Not yet confirmed',               emoji: '⏳', label: 'Not yet',        labelUr: 'ابھی نہیں' },
        ],
      },
      { id: 'linked_job_code', label: 'Link to Job Code (optional)', labelUr: 'جاب کوڈ (اختیاری)', type: 'text',
        placeholder: 'e.g. ENB-A1B2-C3D4 — leave blank if not applicable', placeholderUr: 'مثلاً: ENB-A1B2-C3D4 — خالی چھوڑیں اگر نہیں', required: false },
    ],
  },

  youth_mentoring: {
    title: 'Youth Mentoring', titleUr: 'نوجوانوں کی رہنمائی',
    hint: 'Photo of the mentoring session. The young person\'s face can be partially obscured for privacy.',
    photoLabel: 'Photo of Mentoring Session', photoLabelUr: 'رہنمائی سیشن کی تصویر',
    fields: [
      { id: 'mentee_count', label: 'Mentees', labelUr: 'زیرِ رہنمائی افراد', type: 'stepper', required: true,
        min: 1, max: 20, unit: 'people', unitUr: 'افراد', quickPicks: [1, 2, 3, 5, 10] },
      { id: 'session_topic', label: 'Topic / area of mentoring', labelUr: 'رہنمائی کا موضوع', type: 'text', placeholder: 'e.g. Career guidance, digital literacy, maths tutoring', placeholderUr: 'مثلاً: کیرئیر رہنمائی، ڈیجیٹل خواندگی، ریاضی', required: true },
      { id: 'duration', label: 'Duration', labelUr: 'دورانیہ', type: 'stepper', required: true,
        min: 15, max: 180, unit: 'min', unitUr: 'منٹ', quickPicks: [30, 45, 60, 90, 120] },
      { id: 'age_group', label: 'Age group', labelUr: 'عمر کا گروپ', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Under 12',                   emoji: '🧒', label: 'Under 12',     labelUr: '12 سال سے کم' },
          { value: '12–15 years',                emoji: '👦', label: '12–15 yrs',    labelUr: '12–15 سال' },
          { value: '16–18 years',                emoji: '🧑', label: '16–18 yrs',    labelUr: '16–18 سال' },
          { value: '18–25 years (young adult)',   emoji: '👨', label: '18–25 yrs',    labelUr: '18–25 سال' },
        ],
      },
      { id: 'session_number', label: 'Part of ongoing programme?', labelUr: 'جاری پروگرام کا حصہ؟', type: 'visual_select', required: false,
        visualOptions: [
          { value: 'One-time session',        emoji: '1️⃣', label: 'One-time',      labelUr: 'ایک بار' },
          { value: 'Session 2',               emoji: '2️⃣', label: 'Session 2',     labelUr: 'سیشن 2' },
          { value: 'Session 3',               emoji: '3️⃣', label: 'Session 3',     labelUr: 'سیشن 3' },
          { value: 'Session 4+',              emoji: '4️⃣', label: 'Session 4+',    labelUr: 'سیشن 4+' },
          { value: 'Ongoing regular sessions',emoji: '🔄', label: 'Ongoing',       labelUr: 'جاری' },
        ],
      },
    ],
  },

  tree_planting: {
    title: 'Tree Planting', titleUr: 'درخت لگانا',
    hint: 'Photo of you planting the tree, showing the sapling in the ground with surrounding area visible.',
    photoLabel: 'Photo of Tree Being Planted', photoLabelUr: 'درخت لگانے کی تصویر',
    fields: [
      { id: 'tree_count', label: 'Trees planted', labelUr: 'لگائے گئے درخت', type: 'stepper', required: true,
        min: 1, max: 50, unit: 'trees', unitUr: 'درخت', quickPicks: [1, 2, 3, 5, 10] },
      { id: 'tree_species', label: 'Tree species (if known)', labelUr: 'درخت کی قسم (اگر معلوم ہو)', type: 'text', placeholder: 'e.g. Neem, Shisham, Unknown', placeholderUr: 'مثلاً: نیم، شیشم، معلوم نہیں', required: false },
      { id: 'location_type', label: 'Planting location', labelUr: 'لگانے کی جگہ', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Public road / footpath',      emoji: '🛣️', label: 'Road/Path',   labelUr: 'سڑک / راستہ' },
          { value: 'Park or open ground',         emoji: '🌳', label: 'Park',        labelUr: 'پارک / میدان' },
          { value: 'School / madrassa grounds',   emoji: '🏫', label: 'School',      labelUr: 'اسکول / مدرسہ' },
          { value: 'Mosque / community grounds',  emoji: '🕌', label: 'Mosque',      labelUr: 'مسجد / کمیونٹی' },
          { value: 'Private garden',              emoji: '🏡', label: 'Garden',      labelUr: 'نجی باغ' },
          { value: 'Community farm',              emoji: '🌾', label: 'Farm',        labelUr: 'کمیونٹی فارم' },
        ],
      },
      { id: 'water_source', label: 'Water source', labelUr: 'پانی کا ذریعہ', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'I will water regularly',       emoji: '🪣', label: 'I will water',   labelUr: 'میں پانی دوں گا' },
          { value: 'Community member will water',  emoji: '👥', label: 'Community',      labelUr: 'کمیونٹی ممبر' },
          { value: 'Rain-fed / natural',           emoji: '🌧️', label: 'Rain-fed',       labelUr: 'بارش / قدرتی' },
          { value: 'Irrigation system nearby',     emoji: '💧', label: 'Irrigation',     labelUr: 'آبپاشی قریب' },
        ],
      },
    ],
  },

  waste_reporting: {
    title: 'Waste Reporting', titleUr: 'کچرہ رپورٹ',
    hint: 'Clear photo showing the dumping site. Include a landmark for location verification.',
    photoLabel: 'Photo of Dumping Site', photoLabelUr: 'کوڑے کی جگہ کی تصویر',
    fields: [
      { id: 'waste_type', label: 'Type of waste', labelUr: 'کچرے کی قسم', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Household garbage',          emoji: '🏠', label: 'Household',    labelUr: 'گھریلو کچرہ' },
          { value: 'Construction debris',        emoji: '🧱', label: 'Construction', labelUr: 'تعمیراتی ملبہ' },
          { value: 'Industrial / chemical waste',emoji: '⚗️', label: 'Industrial',   labelUr: 'صنعتی / کیمیائی' },
          { value: 'Medical waste',              emoji: '🏥', label: 'Medical',      labelUr: 'طبی کچرہ' },
          { value: 'Plastic/packaging',          emoji: '🛍️', label: 'Plastic',      labelUr: 'پلاسٹک' },
          { value: 'Mixed waste',                emoji: '🗑️', label: 'Mixed',        labelUr: 'ملا جلا' },
        ],
      },
      { id: 'quantity', label: 'Estimated quantity', labelUr: 'اندازاً مقدار', type: 'visual_select', required: true,
        visualOptions: [
          { value: 'Small — a few bags',         emoji: '🛍️', label: 'Small',        labelUr: 'چھوٹا — چند تھیلے' },
          { value: 'Medium — pickup truck load', emoji: '🚚', label: 'Medium',       labelUr: 'درمیانہ — ٹرک بھر' },
          { value: 'Large — multiple loads',     emoji: '🚛', label: 'Large',        labelUr: 'بڑا — کئی ٹرک' },
          { value: 'Very large — ongoing site',  emoji: '⚠️', label: 'Very large',   labelUr: 'بہت بڑا — جاری جگہ' },
        ],
      },
      { id: 'landmark', label: 'Nearest landmark or street', labelUr: 'قریبی پہچانی جگہ یا گلی', type: 'text', placeholder: 'e.g. Behind petrol station, G.T. Road', placeholderUr: 'مثلاً: پیٹرول اسٹیشن کے پیچھے', required: true },
      { id: 'ongoing', label: 'Is dumping ongoing?', labelUr: 'کیا کوڑا پھینکنا جاری ہے؟', type: 'visual_select', required: false,
        visualOptions: [
          { value: 'One-time / old dump',    emoji: '📅', label: 'Old dump',      labelUr: 'پرانا / ایک بار' },
          { value: 'Appears to be ongoing',  emoji: '⚠️', label: 'Ongoing',       labelUr: 'جاری لگتا ہے' },
          { value: 'Unknown',               emoji: '❓', label: 'Not sure',       labelUr: 'معلوم نہیں' },
        ],
      },
    ],
  },
};


// ─── Photo guide data — bilingual, visual-first ──────────────────────────────
interface PhotoGuideData {
  beforeAfter: boolean | null;
  beforeScene?: string;
  afterScene?: string;
  beforeHint_en?: string;
  beforeHint_ur?: string;
  afterHint_en?: string;
  afterHint_ur?: string;
  singleHint_en?: string;
  singleHint_ur?: string;
}

const PHOTO_GUIDES: Record<string, PhotoGuideData> = {
  neighbourhood_cleanup: {
    beforeAfter: true,
    beforeScene: '🗑️🧺❌',
    afterScene:  '✨🌿✅',
    beforeHint_en: 'Take a photo of the litter, rubbish pile, or dirty area BEFORE you start cleaning',
    beforeHint_ur: 'صفائی شروع کرنے سے پہلے کوڑے، گندگی یا غلیظ جگہ کی تصویر لیں',
    afterHint_en: 'Take a photo of the same area AFTER cleaning — show how clean it looks now',
    afterHint_ur: 'صفائی کے بعد اسی جگہ کی تصویر لیں — دکھائیں کہ اب کتنی صاف ہے',
  },
  recycling_dropoff: {
    beforeAfter: false,
    afterScene: '♻️📦✅',
    singleHint_en: 'Take a photo at the recycling centre with your items clearly visible. Include the drop-off sign or location name if possible.',
    singleHint_ur: 'ری سائیکلنگ سینٹر پر اپنے سامان کے ساتھ تصویر لیں۔ ہو سکے تو جگہ کا نام یا بورڈ بھی دکھائیں۔',
  },
  carpool: { beforeAfter: null },
  food_sharing: {
    beforeAfter: false,
    afterScene: '🍱🤲👥',
    singleHint_en: 'Take a photo of the food being handed over to the recipients. Show both the food and the people receiving it clearly.',
    singleHint_ur: 'کھانا دینے کا لمحہ تصویر میں قید کریں۔ کھانا اور وصول کرنے والے لوگ دونوں واضح نظر آئیں۔',
  },
  skill_workshop: {
    beforeAfter: false,
    afterScene: '👨‍🏫📋👥',
    singleHint_en: 'Take a photo during the session showing you teaching and attendees actively participating. Group photo preferred.',
    singleHint_ur: 'سیشن کے دوران تصویر لیں جس میں آپ پڑھا رہے ہوں اور شرکاء توجہ سے سن رہے ہوں۔',
  },
  infrastructure_report: {
    beforeAfter: false,
    afterScene: '🚧📍📷',
    singleHint_en: 'Take a clear photo of the issue — broken road, leaking pipe, damaged streetlight. Include a nearby landmark or street sign.',
    singleHint_ur: 'مسئلے کی واضح تصویر لیں — ٹوٹی سڑک، ٹپکتا پائپ، خراب بلب۔ قریبی نشانی یا گلی کا نام بھی دکھائیں۔',
  },
  trade_job: { beforeAfter: null },
  youth_mentoring: {
    beforeAfter: false,
    afterScene: '🤝💡📚',
    singleHint_en: "Take a photo during the mentoring session. The young person's face can be partially covered for privacy if needed.",
    singleHint_ur: 'رہنمائی سیشن کے دوران تصویر لیں۔ نوجوان کا چہرہ ضرورت پڑنے پر تھوڑا چھپایا جا سکتا ہے۔',
  },
  tree_planting: {
    beforeAfter: true,
    beforeScene: '⛏️🕳️🌱',
    afterScene:  '🌳✅💧',
    beforeHint_en: 'Take a photo of the empty spot or hole dug BEFORE planting — show the ground and location clearly',
    beforeHint_ur: 'درخت لگانے سے پہلے خالی جگہ یا کھودے گئے گڑھے کی تصویر لیں — جگہ واضح نظر آئے',
    afterHint_en: 'Take a photo of the planted sapling in the ground AFTER planting — show the tree, soil and surrounding area',
    afterHint_ur: 'درخت لگانے کے بعد پودے کی تصویر لیں — درخت، مٹی اور آس پاس کی جگہ واضح ہو',
  },
  waste_reporting: {
    beforeAfter: false,
    afterScene: '🗑️📍⚠️',
    singleHint_en: 'Take a clear photo of the illegal dump site. Show the full extent of the waste and include a landmark or street in the background.',
    singleHint_ur: 'غیر قانونی کوڑے کی جگہ کی واضح تصویر لیں۔ پورا کوڑا اور پیچھے کوئی پہچانی جگہ یا گلی نظر آئے۔',
  },
};

// ─── PhotoGuide component ─────────────────────────────────────────────────────
function PhotoGuide({ actionType, isUrdu }: { actionType: string; isUrdu: boolean }) {
  const guide = PHOTO_GUIDES[actionType];
  if (!guide || guide.beforeAfter === null) return null;

  if (guide.beforeAfter) {
    return (
      <div className="space-y-2">
        <p className={`text-xs font-semibold text-enb-text-secondary uppercase tracking-wide ${isUrdu ? 'text-sm normal-case' : ''}`}>
          {isUrdu ? 'تصویر کی ہدایات' : 'Photo Instructions'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
            <div className="text-xl leading-none">{guide.beforeScene}</div>
            <div className={`text-[10px] font-bold text-orange-700 uppercase tracking-wide ${isUrdu ? 'text-xs normal-case' : ''}`}>
              {isUrdu ? 'پہلے کی تصویر' : 'BEFORE Photo'}
            </div>
            <p className={`text-xs text-orange-800 leading-tight ${isUrdu ? 'text-sm' : ''}`}>
              {isUrdu ? guide.beforeHint_ur : guide.beforeHint_en}
            </p>
            <div className="flex items-center gap-1 text-orange-600">
              <span className="text-base">📷</span>
              <span className={`text-[10px] font-semibold ${isUrdu ? 'text-xs' : ''}`}>
                {isUrdu ? 'ابھی تصویر لیں' : 'Take photo now'}
              </span>
            </div>
          </div>
          <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-3 space-y-2">
            <div className="text-xl leading-none">{guide.afterScene}</div>
            <div className={`text-[10px] font-bold text-enb-green uppercase tracking-wide ${isUrdu ? 'text-xs normal-case' : ''}`}>
              {isUrdu ? 'بعد کی تصویر' : 'AFTER Photo'}
            </div>
            <p className={`text-xs text-enb-text-secondary leading-tight ${isUrdu ? 'text-sm' : ''}`}>
              {isUrdu ? guide.afterHint_ur : guide.afterHint_en}
            </p>
            <div className="flex items-center gap-1 text-enb-green">
              <span className="text-base">📷</span>
              <span className={`text-[10px] font-semibold ${isUrdu ? 'text-xs' : ''}`}>
                {isUrdu ? 'کام کے بعد لیں' : 'Take after work'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">{guide.afterScene}</span>
        <div className={`text-xs font-bold text-enb-green uppercase tracking-wide ${isUrdu ? 'text-sm normal-case' : ''}`}>
          {isUrdu ? 'تصویر کی ہدایت' : 'Photo Instruction'}
        </div>
      </div>
      <p className={`text-xs text-enb-text-secondary leading-relaxed ${isUrdu ? 'text-sm' : ''}`}>
        {isUrdu ? guide.singleHint_ur : guide.singleHint_en}
      </p>
      <div className="flex items-center gap-1.5 text-enb-green pt-1">
        <span className="text-base">📷</span>
        <span className="text-xs font-semibold">
          {isUrdu ? 'واضح تصویر لیں' : 'Take a clear photo'}
        </span>
      </div>
    </div>
  );
}

// ─── Field types ────────────────────────────────────────────────────────────
interface FieldDef {
  id: string;
  label: string;
  labelUr?: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'multiselect' | 'visual_select' | 'visual_select_multi' | 'stepper';
  placeholder?: string;
  placeholderUr?: string;
  options?: string[];
  optionsUr?: string[];
  visualOptions?: {
    value: string;
    emoji: string;
    label: string;
    labelUr?: string;
  }[];
  min?: number;
  max?: number;
  unit?: string;
  unitUr?: string;
  quickPicks?: number[];
  required: boolean;
}

// ─── Custom fields renderer ─────────────────────────────────────────────────
function ActionFields({ fields, values, onChange, isUrdu }: {
  fields: FieldDef[];
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
  isUrdu?: boolean;
}) {
  return (
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.id} className="space-y-1.5">
          <label className="text-sm font-medium text-enb-text-primary">
            {isUrdu && field.labelUr ? field.labelUr : field.label}
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
              placeholder={isUrdu && field.placeholderUr ? field.placeholderUr : field.placeholder}
              className="resize-none h-20 bg-white"
            />
          )}

          {field.type === 'select' && (
            <div className="flex flex-col gap-1.5">
              {field.options!.map((opt, idx) => {
                const label = isUrdu && field.optionsUr?.[idx] ? field.optionsUr[idx] : opt;
                return (
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
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {field.type === 'multiselect' && (
            <div className="flex flex-wrap gap-2">
              {field.options!.map((opt, idx) => {
                const selected: string[] = values[field.id] || [];
                const isSelected = selected.includes(opt);
                const label = isUrdu && field.optionsUr?.[idx] ? field.optionsUr[idx] : opt;
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
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {field.type === 'visual_select' && (
            <div className="grid grid-cols-2 gap-2">
              {field.visualOptions!.map(opt => {
                const isSelected = values[field.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(field.id, opt.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all
                      ${isSelected
                        ? 'bg-enb-green border-enb-green text-white shadow-sm'
                        : 'bg-white border-gray-200 text-enb-text-primary hover:border-enb-green/40'
                      }`}
                  >
                    <span className="text-2xl leading-none" role="img" aria-hidden="true">{opt.emoji}</span>
                    <span className={`text-xs font-semibold text-center leading-tight ${isSelected ? 'text-white' : 'text-enb-text-primary'}`}>
                      {isUrdu && opt.labelUr ? opt.labelUr : opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {field.type === 'visual_select_multi' && (
            <div className="grid grid-cols-3 gap-2">
              {field.visualOptions!.map(opt => {
                const selected: string[] = Array.isArray(values[field.id]) ? values[field.id] : [];
                const isSelected = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) onChange(field.id, selected.filter(s => s !== opt.value));
                      else onChange(field.id, [...selected, opt.value]);
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all
                      ${isSelected
                        ? 'bg-enb-green border-enb-green text-white shadow-sm'
                        : 'bg-white border-gray-200 text-enb-text-primary hover:border-enb-green/40'
                      }`}
                  >
                    <span className="text-2xl leading-none" role="img" aria-hidden="true">{opt.emoji}</span>
                    <span className={`text-xs font-semibold text-center leading-tight ${isSelected ? 'text-white' : 'text-enb-text-primary'}`}>
                      {isUrdu && opt.labelUr ? opt.labelUr : opt.label}
                    </span>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {field.type === 'stepper' && (() => {
            const current = Number(values[field.id] || field.min || 1);
            const min = field.min ?? 1;
            const max = field.max ?? 999;
            const unit = (isUrdu && field.unitUr) ? field.unitUr : (field.unit || '');
            return (
              <div className="space-y-2">
                {field.quickPicks && (
                  <div className="flex gap-2 flex-wrap">
                    {field.quickPicks.map(qp => (
                      <button
                        key={qp}
                        type="button"
                        onClick={() => onChange(field.id, qp)}
                        className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${
                          current === qp
                            ? 'bg-enb-green text-white border-enb-green'
                            : 'bg-white border-gray-200 text-enb-text-secondary hover:border-enb-green/40'
                        }`}
                      >
                        {qp}{unit ? ` ${unit}` : ''}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onChange(field.id, Math.max(min, current - 1))}
                    disabled={current <= min}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center
                      text-xl font-bold text-enb-text-primary disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-bold text-enb-text-primary">{current}</span>
                    {unit && <span className="text-sm text-enb-text-secondary ml-1">{unit}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(field.id, Math.min(max, current + 1))}
                    disabled={current >= max}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center
                      text-xl font-bold text-enb-text-primary disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })()}
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

  const { isUrdu } = useT();

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  // ── LAPSE 1 FIX: store GPS accuracy in metres ────────────────────────────
  const [gpsAccuracyM, setGpsAccuracyM] = useState<number | null>(null);
  const [gpsLowAccuracy, setGpsLowAccuracy] = useState(false);
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
      if (preview.length < 1000) return;
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
      const { user: _uEnv } = useUserStore.getState();
      const _envFolder = _uEnv?.environment === 'test' ? 'enb/test/submissions/before' : 'enb/real/submissions/before';
      formData.append('folder', _envFolder);
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

  // ── LAPSE 1 FIX: capture accuracy and flag if poor ───────────────────────
  const handleGetLocation = () => {
    setLoadingLocation(true);
    setGpsLowAccuracy(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy; // metres — always present
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        setGpsAccuracyM(accuracy);
        setGpsAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        // Flag visually if accuracy is poor — will also force human review in SubmitAction
        if (accuracy > GPS_ACCURACY_THRESHOLD_M) {
          setGpsLowAccuracy(true);
        }
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const requiredFieldsMet = config.fields
    .filter(f => f.required)
    .every(f => {
      if (f.type === 'stepper') return fieldValues[f.id] !== undefined || (f.min ?? 1) >= 1;
      if (f.type === 'visual_select_multi') { const v = fieldValues[f.id]; return Array.isArray(v) && v.length > 0; }
      const val = fieldValues[f.id];
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== '' && val !== null;
    });

  const anyUploading = photos.some(p => p.uploading);
  const [consentGiven, setConsentGiven] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeType | null>(null);
  const isTradeJob = actionType === 'trade_job';

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
      const timeMs = Date.now() - formStartTime;
      captchaScore = parseFloat(
        (Math.min(timeMs / 10000, 1) * 0.4 + Math.min(touchEvents / 5, 1) * 0.3 + 0.3).toFixed(2)
      );
    }
    const uploadedUrls = photos.filter(p => p.cloudinaryUrl).map(p => p.cloudinaryUrl as string);

    const normalisedValues = { ...fieldValues };
    config.fields.forEach(f => {
      if (f.type === 'stepper' && normalisedValues[f.id] !== undefined) {
        normalisedValues[f.id] = Number(normalisedValues[f.id]) || (f.min ?? 1);
      }
    });

    const fieldLines = config.fields
      .filter(f => normalisedValues[f.id] !== undefined && normalisedValues[f.id] !== '')
      .map(f => {
        const val = Array.isArray(normalisedValues[f.id]) ? normalisedValues[f.id].join(', ') : normalisedValues[f.id];
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
        ...normalisedValues,
        ...(isTradeJob && selectedTrade ? {
          trade_type: selectedTrade.id,
          trade_before_after: selectedTrade.beforeAfter,
        } : {}),
      },
      linkedJobCode: isTradeJob ? (fieldValues['linked_job_code'] || null) : null,
      gpsLat,
      gpsLng,
      gpsAddress,
      // ── LAPSE 1 FIX: pass accuracy to SubmitAction ───────────────────────
      gpsAccuracyM,
      gpsLowAccuracy,
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
            <h2 className="text-xl font-bold text-enb-text-primary">{isUrdu ? "کارپول" : "Carpool"}</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{isUrdu ? "سفر جاری ہے" : "Ride in progress"}</span>
          </div>
          <CarpoolSession
            vehicleType={carpoolVehicle}
            passengers={carpoolPassengers}
            onRideComplete={(session) => {
              setCarpoolSession(session);
              setCarpoolSessionActive(false);
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
                gpsAccuracyM: session.originAccuracyM || null,
                gpsLowAccuracy: session.originAccuracyM != null && session.originAccuracyM > GPS_ACCURACY_THRESHOLD_M,
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

    const VEHICLES = approvedVehicles.length > 0 ? approvedVehicles : [];
    const maxPassengers = carpoolVehicle === 'Bike' ? 1 : 8;
    const canStartRide = carpoolPassengers >= 1 && VEHICLES.length > 0;

    if (!captainApproved) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-enb-text-secondary text-sm">{isUrdu ? "→ واپس" : "← Back"}</button>
            <h2 className="text-xl font-bold text-enb-text-primary">{isUrdu ? "کارپول" : "Carpool"}</h2>
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
          <button onClick={onBack} className="text-enb-text-secondary text-sm">{isUrdu ? "→ واپس" : "← Back"}</button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-enb-text-primary">Carpool</h2>
            <span className="text-xs bg-enb-gold/20 text-enb-gold font-bold px-2 py-0.5 rounded-full">🚗 Captain</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 text-sm text-enb-text-secondary">
          {config.hint}
        </div>

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
        <Button variant="ghost" onClick={onBack} className="text-enb-text-secondary -ml-2">{isUrdu ? "→ واپس" : "← Back"}</Button>
        <h2 className="text-xl font-bold text-enb-text-primary">{isUrdu && config.titleUr ? config.titleUr : config.title}</h2>
        <div className="w-16" />
      </div>

      <PhotoGuide actionType={actionType} isUrdu={isUrdu} />

      {/* ── Photo Section ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-enb-text-primary">
            {isUrdu && config.photoLabelUr ? config.photoLabelUr : config.photoLabel} <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS} {isUrdu ? 'تصاویر' : 'photos'}</span>
        </div>

        {cameraActive && (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef} autoPlay playsInline muted
              className="w-full max-h-64 object-cover rounded-xl"
            />
            <canvas ref={canvasRef} className="hidden" />
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
              <span className="text-sm font-medium">{isUrdu ? 'کیمرہ کھولیں' : 'Open Camera'}</span>
            </Button>
            {cameraError && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {cameraError}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1 text-center">{isUrdu ? 'گیلری سے اپلوڈ نہیں — صرف لائیو تصویر' : 'Gallery uploads not accepted — live photos only'}</p>
          </div>
        )}
      </div>

      {/* ── GPS Location ── */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-enb-text-primary">{isUrdu ? 'جی پی ایس مقام' : 'GPS Location'} <span className="text-red-500">*</span></label>
        <div
          onClick={!gpsAddress ? handleGetLocation : undefined}
          className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${
            gpsAddress
              ? gpsLowAccuracy
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-enb-green/10 border-enb-green/20 text-enb-green'
              : 'bg-white border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-50'
          }`}
        >
          {loadingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
          <span className="text-sm font-medium flex-1">
            {gpsAddress
              ? `📍 ${gpsAddress}`
              : loadingLocation
              ? (isUrdu ? 'تلاش ہو رہا ہے...' : 'Detecting...')
              : (isUrdu ? 'جی پی ایس مقام حاصل کریں' : 'Tap to detect GPS location')}
          </span>
          {gpsAddress && !gpsLowAccuracy && <CheckCircle className="w-4 h-4 ml-auto" />}
          {gpsLowAccuracy && <AlertTriangle className="w-4 h-4 ml-auto text-amber-500" />}
        </div>
        {/* ── LAPSE 1 FIX: show accuracy badge and low-accuracy warning ──────── */}
        {gpsAccuracyM !== null && (
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              gpsLowAccuracy
                ? 'bg-amber-100 text-amber-700'
                : 'bg-enb-green/10 text-enb-green'
            }`}>
              {isUrdu ? 'درستگی' : 'Accuracy'}: ±{Math.round(gpsAccuracyM)}m
            </span>
            {gpsLowAccuracy && (
              <span className="text-xs text-amber-600">
                {isUrdu
                  ? 'کم درستگی — انسانی جائزے کے لیے بھیجا جائے گا'
                  : 'Low accuracy — will be sent for human review'}
              </span>
            )}
          </div>
        )}
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
            <p className="text-sm font-semibold text-enb-text-primary mb-3">{isUrdu ? "کام کی تفصیل" : "Action Details"}</p>
          )}
          <ActionFields
            fields={config.fields.filter(f => !(isTradeJob && f.id === 'trade_type'))}
            values={fieldValues}
            onChange={(id, val) => setFieldValues(prev => ({ ...prev, [id]: val }))}
            isUrdu={isUrdu}
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
          {isUrdu
            ? 'میں اپنی تصدیق شدہ تصاویر اور مقام کو ENB کے گرانٹ جائزہ کاروں اور اثرات کے آڈیٹرز کے ساتھ شیئر کرنے کی اجازت دیتا/دیتی ہوں۔ میری ذاتی شناخت ظاہر نہیں کی جائے گی۔'
            : "I consent to my verified action photos and location being shared with ENB's grant reviewers and impact auditors for verification purposes. My personal identity will not be disclosed."}
        </p>
      </button>

      {/* ── Submit ── */}
      <Button
        onClick={() => { handleSubmit(); }}
        disabled={!canSubmit}
        className="w-full h-12 text-lg shadow-lg shadow-enb-green/20 bg-enb-green hover:bg-enb-green/90 text-white"
      >
        {anyUploading
          ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isUrdu ? 'تصاویر اپلوڈ ہو رہی ہیں...' : 'Uploading photos...'}</>
          : (isUrdu ? 'جمع کریں' : 'Review Submission')}
      </Button>

      {!canSubmit && photos.length > 0 && !anyUploading && (
        <p className="text-xs text-center text-gray-400">
          {!gpsLat ? (isUrdu ? '📍 جی پی ایس مقام ضروری ہے' : '📍 GPS location required') :
           !requiredFieldsMet ? (isUrdu ? '📋 تمام ضروری خانے بھریں' : '📋 Please fill all required fields') :
           !consentGiven ? (isUrdu ? '☑️ اوپر رضامندی کا خانہ ٹک کریں' : '☑️ Please tick the consent box above') : ''}
        </p>
      )}
    </div>
  );
}
