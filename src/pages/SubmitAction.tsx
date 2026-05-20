import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { supabase, getDb } from '@/lib/supabase';
import ActionSelector from './submit/ActionSelector';
import ActionForm from './submit/ActionForm';
import SubmissionReview from './submit/SubmissionReview';
import SubmissionSuccess from './submit/SubmissionSuccess';
import { isTransformationAction, AFTER_UNLOCK_MS, GPS_ACCURACY_THRESHOLD_M, GPS_DUPLICATE_RADIUS_M } from '@/lib/beforeAfter';
import { getGeminiPrompt, AUTO_APPROVE_THRESHOLD } from '@/lib/geminiPrompts';


type Step = 'select' | 'form' | 'review' | 'success';

const ACTION_REWARDS: Record<string, { enb: number; rep: number }> = {
  neighbourhood_cleanup: { enb: 1000, rep: 500 },
  recycling_dropoff:     { enb: 500,  rep: 200 },
  carpool:               { enb: 0,    rep: 150 },
  food_sharing:          { enb: 800,  rep: 300 },
  skill_workshop:        { enb: 1500, rep: 1000 },
  infrastructure_report: { enb: 300,  rep: 100 },
  trade_job:             { enb: 1000, rep: 800 },
  youth_mentoring:       { enb: 2000, rep: 1500 },
  tree_planting:         { enb: 2000, rep: 1200 },
  waste_reporting:       { enb: 500,  rep: 200 },
};

// GPS_ACCURACY_THRESHOLD_M and GPS_DUPLICATE_RADIUS_M imported from @/lib/beforeAfter

// ── Gemini helpers (single-phase AI review) ──────────────────────────────────
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
  } catch { return null; }
}

async function runSinglePhaseGeminiReview(
  photoUrls: string[],
  actionType: string,
  metadata?: Record<string, any>,
): Promise<{ verdict: 'approve' | 'reject' | 'uncertain'; reason: string; confidence: number }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return { verdict: 'uncertain', reason: 'AI review not configured', confidence: 0 };

  // ── LAPSE 2 FIX: GPS coordinates are now included in metadata and passed
  // to the prompt builder so Gemini can flag location-inconsistent photos.
  const { prompt } = getGeminiPrompt(actionType, metadata);

  const photoData = await Promise.all(photoUrls.slice(0, 3).map(urlToInlineData));
  const validPhotos = photoData.filter(Boolean);

  if (validPhotos.length === 0) {
    return { verdict: 'uncertain', reason: 'Could not load photos for AI review', confidence: 0 };
  }

  const parts: any[] = [
    { text: prompt },
    ...validPhotos.map(d => ({ inlineData: { mimeType: d!.mimeType, data: d!.data } })),
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }) },
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const json = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(raw.replace(/```json|```/gi, '').trim());
    return {
      verdict: (['approve', 'reject', 'uncertain'].includes(parsed.verdict) ? parsed.verdict : 'uncertain') as any,
      reason: parsed.reason || 'No reason provided',
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    };
  } catch {
    return { verdict: 'uncertain', reason: 'AI review failed — routed to human moderator', confidence: 0 };
  }
}

// ── LAPSE 5 FIX: Check whether this submission is a GPS duplicate ──────────
// Queries the last 30 days of the user's submissions for the same action_type.
// Returns true if any prior submission is within GPS_DUPLICATE_RADIUS_M metres.
// Uses the Haversine formula to calculate distance between two GPS coordinates.
function haversineDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function checkGpsDuplicate(
  userId: string,
  actionType: string,
  lat: number,
  lng: number,
): Promise<boolean> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('submissions')
      .select('gps_lat, gps_lng')
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .gte('submitted_at', thirtyDaysAgo)
      .not('gps_lat', 'is', null)
      .not('gps_lng', 'is', null);

    if (error || !data) return false;

    return data.some(prev => {
      if (prev.gps_lat == null || prev.gps_lng == null) return false;
      const dist = haversineDistanceM(lat, lng, Number(prev.gps_lat), Number(prev.gps_lng));
      return dist <= GPS_DUPLICATE_RADIUS_M;
    });
  } catch {
    return false; // Never block a submission on duplicate check failure
  }
}

// ── LAPSE 3 FIX: Neighbourhood boundary point-in-polygon check ───────────────
// Queries the neighbourhood_boundaries table (PostGIS) to determine whether
// the submission GPS falls inside the user's registered area.
// Uses three-tier fallback: town/tehsil (level 7) → district (level 6) → skip.
// Never hard-rejects — sets gps_outside_boundary flag for human moderator review.
// Returns: true = outside boundary (flag), false = inside, null = no polygon found
async function checkGpsBoundary(
  userNeighbourhood: string | null,
  userCity: string | null,
  lat: number,
  lng: number,
): Promise<boolean | null> {
  if (!userNeighbourhood && !userCity) return null;

  try {
    // Extract clean search terms from potentially long formatted strings.
    // neighbourhood may be "Malir Model, Karachi, PK-SD, Pakistan" — extract
    // just the first meaningful word/phrase before the first comma.
    // city is typically clean ("Karachi") — use as-is.
    const cleanNeighbourhood = userNeighbourhood
      ? userNeighbourhood.split(',')[0].trim()
      : null;
    const cleanCity = userCity ? userCity.trim() : null;

    // Build search terms — try neighbourhood first (most precise),
    // then city. Skip terms that are too short to be meaningful.
    const searchTerms = [cleanNeighbourhood, cleanCity]
      .filter((t): t is string => !!t && t.length > 2);

    for (const term of searchTerms) {
      const { data, error } = await getDb().rpc('check_point_in_boundary', {
        p_lat: lat,
        p_lng: lng,
        p_name: term,
      });

      if (error || data === null) continue; // No boundary found for this term — try next

      if (data === true) {
        // Point is confirmed inside this boundary — definitely not outside, stop checking
        return false;
      }

      // data === false: point is outside this named boundary.
      // Only flag if the term was a specific neighbourhood match (not just city).
      // City-level mismatches are too broad — Malir is part of greater Karachi
      // but a separate administrative district. Don't flag city-level mismatches.
      if (term === cleanNeighbourhood && cleanNeighbourhood !== cleanCity) {
        return true; // Outside their specific registered neighbourhood
      }
      // City-level mismatch — inconclusive, try next term or skip
    }

    // No conclusive match found — cannot determine, skip flagging
    return null;
  } catch {
    return null; // Never block submission on boundary check failure
  }
}

// Action types that use Before/After flow (AI runs in AfterPhotoSubmission)
const BEFORE_AFTER_ACTIONS = ['neighbourhood_cleanup', 'tree_planting'];
// Action types with GPS+session data as primary evidence (no photo AI needed)
const GPS_ONLY_ACTIONS = ['carpool'];

export default function SubmitAction() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('select');
  const [selectedAction, setSelectedAction] = useState('');
  const [formData, setFormData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    setStep('form');
  };

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    setStep('review');
  };

  const handleConfirmSubmit = async () => {
    if (!user || !formData) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const actionKey = formData.actionType || selectedAction;
      const rewards = ACTION_REWARDS[actionKey];
      if (!rewards) {
        throw new Error(`Unknown action type: ${actionKey}`);
      }

      // Parse GPS
      let lat: number | null = null;
      let lng: number | null = null;
      if (formData.gpsLat) {
        lat = formData.gpsLat;
        lng = formData.gpsLng;
      } else if (formData.location) {
        const parts = formData.location.split(',');
        if (parts.length === 2) { lat = parseFloat(parts[0]); lng = parseFloat(parts[1]); }
      }

      // ── LAPSE 1 FIX: read accuracy from formData ─────────────────────────
      const gpsAccuracyM: number | null = formData.gpsAccuracyM ?? null;
      const gpsLowAccuracy: boolean = formData.gpsLowAccuracy === true;

      const isTransformation = isTransformationAction(actionKey);
      const isReporting = ['infrastructure_report', 'waste_reporting'].includes(actionKey);
      const now = new Date();
      const afterUnlocksAt = isTransformation
        ? new Date(now.getTime() + AFTER_UNLOCK_MS).toISOString()
        : null;

      // ── Dynamic ENB for carpool ──────────────────────────────────────────
      let enbAwarded = rewards.enb;
      const isCarpool = actionKey === 'carpool';
      const rideSession = formData.rideSession;
      if (isCarpool && rideSession) {
        const BASE_RATE: Record<string, number> = {
          'Bike': 100, 'Rickshaw': 120, 'Auto-rickshaw': 120,
          'Car': 150, 'Van/Minivan': 200, 'Bus/Coaster': 300,
        };
        const ENB_CAP: Record<string, number> = {
          'Bike': 3000, 'Rickshaw': 4000, 'Auto-rickshaw': 4000,
          'Car': 5000, 'Van/Minivan': 10000, 'Bus/Coaster': 20000,
        };
        const PASSENGER_MULT = [0, 1.0, 1.3, 1.6, 2.0, 2.5];
        const base = BASE_RATE[rideSession.vehicleType] || 150;
        const pMult = PASSENGER_MULT[Math.min(rideSession.passengers, 5)] || 2.5;
        const cap = ENB_CAP[rideSession.vehicleType] || 5000;
        enbAwarded = Math.min(Math.round(base * rideSession.calculatedDistanceKm * pMult), cap);
      }

      // ── LAPSE 5 FIX: check for GPS duplicate submissions ─────────────────
      let gpsDuplicateFlag = false;
      if (lat !== null && lng !== null) {
        gpsDuplicateFlag = await checkGpsDuplicate(user.id, actionKey, lat, lng);
      }

      // ── LAPSE 3 FIX: neighbourhood boundary check ─────────────────────────
      // Check if submission GPS falls inside the user's registered area.
      // Uses PostGIS ST_Contains via check_point_in_boundary RPC.
      // null = no polygon found for this area (common for unmapped areas)
      // true = outside boundary → flag for human review
      // false = inside boundary → clean
      let gpsOutsideBoundary: boolean = false;
      if (lat !== null && lng !== null) {
        const neighbourhood = user.neighbourhood || null;
        const city = user.city || null;
        const boundaryResult = await checkGpsBoundary(neighbourhood, city, lat, lng);
        if (boundaryResult === true) {
          gpsOutsideBoundary = true;
        }
      }

      // ── Build enriched metadata for Gemini AI review ───────────────────
      // This metadata powers the AI-first fraud detection system.
      // Gemini receives: GPS, accuracy, duplicate flag, time, user trust level.
      // The more context Gemini has, the more autonomously it can decide.
      let userVerifiedCount = 0;
      try {
        const { count } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'approved');
        userVerifiedCount = count || 0;
      } catch {
        userVerifiedCount = 0; // Never block submission on this query failure
      }

      const geminiMetadata: Record<string, any> = {
        ...(formData.customFields || {}),
        // GPS context (Lapse 2 fix)
        gps_lat: lat,
        gps_lng: lng,
        gps_accuracy_m: gpsAccuracyM,
        gps_low_accuracy: gpsLowAccuracy,
        gps_duplicate_flag: gpsDuplicateFlag,
        // Submission time context
        submitted_at: now.toISOString(),
        // User trust level
        user_verified_count: userVerifiedCount,
      };

      // ── Gemini AI review for single-phase actions ────────────────────────
      let aiVerdict: 'approve' | 'reject' | 'uncertain' = 'uncertain';
      let aiReason = 'AI review not applicable';
      let aiConfidence = 0;
      let aiAutoStatus: string = 'pending';

      const photoUrlsForAI = formData.photoUrls?.length > 0
        ? formData.photoUrls
        : (formData.photo ? [formData.photo] : []);

      const shouldRunAI = (
        !BEFORE_AFTER_ACTIONS.includes(actionKey) &&
        !GPS_ONLY_ACTIONS.includes(actionKey) &&
        photoUrlsForAI.length > 0 &&
        import.meta.env.VITE_GEMINI_API_KEY
      );

      if (shouldRunAI) {
        try {
          const aiResult = await runSinglePhaseGeminiReview(
            photoUrlsForAI,
            actionKey,
            geminiMetadata, // ← LAPSE 2 FIX: enriched metadata with GPS
          );
          aiVerdict = aiResult.verdict;
          aiReason = aiResult.reason;
          aiConfidence = aiResult.confidence;

          // ── LAPSE 1 FIX: override auto-approve if GPS accuracy is poor ──
          // Low-accuracy submissions must be seen by a human moderator even
          // if Gemini is confident. GPS drift of 500m+ can mask indoor fraud.
          const gpsOverridesAutoDecision = gpsLowAccuracy || gpsDuplicateFlag || gpsOutsideBoundary;

          if (!gpsOverridesAutoDecision && aiVerdict === 'approve' && aiConfidence >= AUTO_APPROVE_THRESHOLD) {
            aiAutoStatus = 'approved';
          } else if (!gpsOverridesAutoDecision && aiVerdict === 'reject' && aiConfidence >= AUTO_APPROVE_THRESHOLD) {
            aiAutoStatus = 'rejected';
          } else {
            aiAutoStatus = 'pending';
          }
        } catch {
          aiAutoStatus = 'pending';
        }
      } else {
        // For Before/After and GPS-only actions, still respect GPS overrides
        if (gpsLowAccuracy || gpsDuplicateFlag) {
          aiAutoStatus = 'pending';
        }
      }

      const { error } = await getDb().from('submissions').insert({
        user_id: user.id,
        action_type: actionKey,
        description: formData.description,
        photo_urls: formData.photoUrls?.length > 0
          ? formData.photoUrls
          : (formData.photo ? [formData.photo] : []),
        gps_lat: lat,
        gps_lng: lng,
        gps_address: formData.gpsAddress || formData.location || null,
        // ── GPS flags (Lapses 1, 3, 5) ───────────────────────────────────
        gps_accuracy_m: gpsAccuracyM,
        gps_duplicate_flag: gpsDuplicateFlag,
        gps_outside_boundary: gpsOutsideBoundary,  // boundary polygon check — separate from gps_out_of_range (Before/After drift)
        status: aiAutoStatus,
        ai_review_verdict: aiVerdict,
        ai_review_reason: aiReason,
        ai_review_confidence: aiConfidence,
        enb_awarded: enbAwarded,
        rep_awarded: rewards.rep,
        image_source: formData.imageSource || 'CAMERA',
        captcha_score: formData.captchaScore || null,
        submitted_at: now.toISOString(),
        submission_phase: isTransformation ? 'before' : null,
        after_unlocks_at: afterUnlocksAt,
        after_submitted: isTransformation ? false : null,
        report_status: isReporting ? 'open' : null,
        reviewer_consent: formData.consentGiven === true,
        custom_fields: formData.customFields || null,
        // ── Carpool session fields ────────────────────────────────────────
        ...(isCarpool && rideSession ? {
          origin_lat:              rideSession.originLat,
          origin_lng:              rideSession.originLng,
          origin_timestamp:        rideSession.originTimestamp,
          origin_accuracy_m:       rideSession.originAccuracyM,
          destination_lat:         rideSession.destinationLat,
          destination_lng:         rideSession.destinationLng,
          destination_timestamp:   rideSession.destinationTimestamp,
          calculated_distance_km:  rideSession.calculatedDistanceKm,
          calculated_duration_min: rideSession.calculatedDurationMin,
          avg_speed_kmh:           rideSession.avgSpeedKmh,
          speed_flagged:           rideSession.speedFlagged,
          gps_waypoints:           rideSession.waypoints,
          ride_token:              rideSession.rideToken,
          ride_enb_base:           enbAwarded,
          ride_enb_topup:          0,
          vehicle_type:            rideSession.vehicleType,
          confirmed_passengers:    0,
        } : {}),
      });

      if (error) throw error;

      // ── Wire linked job code → job_requests.submission_id ───────────────
      if (actionKey === 'trade_job' && formData.linkedJobCode) {
        try {
          const { data: newSub } = await supabase
            .from('submissions')
            .select('id')
            .eq('user_id', user.id)
            .eq('action_type', 'trade_job')
            .order('submitted_at', { ascending: false })
            .limit(1)
            .single();

          if (newSub?.id) {
            await supabase
              .from('job_requests')
              .update({ submission_id: newSub.id })
              .eq('job_code', formData.linkedJobCode.trim().toUpperCase())
              .eq('tradesperson_id', user.id);
          }
        } catch {
          // Silent — job_code link is best-effort
        }
      }

      // ── Save captain's passenger rating if provided ──────────────────────
      if (isCarpool && rideSession?.passengerRating && user?.id) {
        try {
          const { data: sub } = await supabase
            .from('submissions')
            .select('id')
            .eq('ride_token', rideSession.rideToken)
            .eq('user_id', user.id)
            .single();

          if (sub?.id) {
            await getDb().rpc('submit_captain_passenger_rating', {
              p_submission_id:  sub.id,
              p_captain_id:     user.id,
              p_rating:         rideSession.passengerRating,
              p_comment:        rideSession.passengerRatingComment || null,
            });
          }
        } catch {
          // Silent
        }
      }

      setStep('success');
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      {step === 'select' && (
        <ActionSelector onSelect={handleActionSelect} />
      )}
      {step === 'form' && (
        <ActionForm
          actionType={selectedAction}
          onSubmit={handleFormSubmit}
          onBack={() => setStep('select')}
        />
      )}
      {step === 'review' && formData && (
        <>
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              ⚠️ {submitError}
            </div>
          )}
          <SubmissionReview
            data={formData}
            onConfirm={handleConfirmSubmit}
            onEdit={() => setStep('form')}
            submitting={submitting}
          />
        </>
      )}
      {step === 'success' && (
        <SubmissionSuccess actionType={selectedAction} />
      )}
    </div>
  );
}
