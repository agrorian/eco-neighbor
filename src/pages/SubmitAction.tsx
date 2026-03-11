import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import ActionSelector from './submit/ActionSelector';
import ActionForm from './submit/ActionForm';
import SubmissionReview from './submit/SubmissionReview';
import SubmissionSuccess from './submit/SubmissionSuccess';

type Step = 'select' | 'form' | 'review' | 'success';

const ACTION_REWARDS: Record<string, { enb: number; rep: number }> = {
  neighbourhood_cleanup: { enb: 1000, rep: 500 },
  recycling_dropoff:     { enb: 500,  rep: 200 },
  carpool:               { enb: 300,  rep: 100 },
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
      const rewards = ACTION_REWARDS[selectedAction] || { enb: 500, rep: 200 };
      
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

      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        action_type: selectedAction,
        description: formData.description,
        photo_urls: formData.photoUrls?.length > 0 ? formData.photoUrls : (formData.photo ? [formData.photo] : []),
        gps_lat: lat,
        gps_lng: lng,
        gps_address: formData.gpsAddress || formData.location || null,
        status: 'pending',
        enb_awarded: rewards.enb,
        rep_awarded: rewards.rep,
        image_source: formData.imageSource || 'CAMERA',
        captcha_score: formData.captchaScore || null,
        submitted_at: new Date().toISOString(),
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
