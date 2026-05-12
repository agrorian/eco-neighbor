import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import ActionSelector from './submit/ActionSelector';
import ActionForm from './submit/ActionForm';
import SubmissionReview from './submit/SubmissionReview';
import SubmissionSuccess from './submit/SubmissionSuccess';
import { isTransformationAction, AFTER_UNLOCK_MS } from '@/lib/beforeAfter';

type Step = 'select' | 'form' | 'review' | 'success';

const ACTION_REWARDS: Record<string, { enb: number; rep: number }> = {
  neighbourhood_cleanup: { enb: 1000, rep: 500 },
  recycling_dropoff:     { enb: 500,  rep: 200 },
  carpool:               { enb: 0,    rep: 150 }, // ENB calculated dynamically from ride session
  food_sharing:          { enb: 800,  rep: 300 },
  skill_workshop:        { enb: 1500, rep: 1000 },
  infrastructure_report: { enb: 300,  rep: 100 },
  trade_job:             { enb: 1000, rep: 800 },
  youth_mentoring:       { enb: 2000, rep: 1500 },
  tree_planting:         { enb: 2000, rep: 1200 },
  waste_reporting:       { enb: 500,  rep: 200 },
};

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
      // actionKey is the single source of truth — formData.actionType takes priority
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

      const isTransformation = isTransformationAction(actionKey);
      const isReporting = ['infrastructure_report', 'waste_reporting'].includes(actionKey);
      const now = new Date();
      const afterUnlocksAt = isTransformation
        ? new Date(now.getTime() + AFTER_UNLOCK_MS).toISOString()
        : null;

      // ── Dynamic ENB for carpool ──────────────────────────────────────────────
      let enbAwarded = rewards.enb;
      const isCarpool = actionKey === 'carpool';
      const rideSession = formData.rideSession;
      if (isCarpool && rideSession) {
        // Import calcRideEnb inline — matches canonical formula
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

      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        action_type: actionKey,
        description: formData.description,
        photo_urls: formData.photoUrls?.length > 0
          ? formData.photoUrls
          : (formData.photo ? [formData.photo] : []),
        gps_lat: lat,
        gps_lng: lng,
        gps_address: formData.gpsAddress || formData.location || null,
        status: 'pending',
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
        // ── Carpool session fields ──────────────────────────────────────────
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
