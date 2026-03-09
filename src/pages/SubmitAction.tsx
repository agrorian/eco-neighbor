import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActionSelector from './submit/ActionSelector';
import ActionForm from './submit/ActionForm';
import SubmissionReview from './submit/SubmissionReview';
import SubmissionSuccess from './submit/SubmissionSuccess';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

const ACTION_REWARDS: Record<string, { enb: number; rep: number }> = {
  neighbourhood_cleanup:  { enb: 1000, rep: 500 },
  recycling_dropoff:      { enb: 500,  rep: 200 },
  carpool:                { enb: 300,  rep: 100 },
  food_sharing:           { enb: 800,  rep: 300 },
  skill_workshop:         { enb: 1500, rep: 1000 },
  infrastructure_report:  { enb: 300,  rep: 100 },
  trade_job:              { enb: 1000, rep: 800 },
  youth_mentoring:        { enb: 2000, rep: 1500 },
  tree_planting:          { enb: 2000, rep: 1200 },
  waste_reporting:        { enb: 500,  rep: 200 },
};

export default function SubmitAction() {
  const { user } = useUserStore();
  const [step, setStep] = useState<'select' | 'form' | 'review' | 'success'>('select');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    setStep('form');
  };

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    setStep('review');
  };

  const handleReviewConfirm = async () => {
    if (!user || !selectedAction) return;
    setSubmitting(true);
    try {
      const rewards = ACTION_REWARDS[selectedAction] || { enb: 0, rep: 0 };

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          action_type: selectedAction,
          description: formData.description || '',
          photo_urls: formData.photo ? [formData.photo] : [],
          gps_lat: formData.gps_lat || null,
          gps_lng: formData.gps_lng || null,
          gps_address: formData.location || null,
          status: 'pending',
          enb_awarded: rewards.enb,
          rep_awarded: rewards.rep,
        });

      if (submissionError) throw submissionError;

      // Transaction will be inserted by admin when approving the submission
      setStep('success');
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'form') { setStep('select'); setSelectedAction(null); }
    else if (step === 'review') { setStep('form'); }
  };

  return (
    <div className="min-h-screen bg-enb-surface pb-24">
      <header className="bg-white border-b border-gray-100 p-6 sticky top-0 z-10 shadow-sm flex items-center gap-4">
        {step !== 'select' && step !== 'success' && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2">
            <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Submit Action</h1>
          <p className="text-sm text-enb-text-secondary">Record your impact to earn ENB</p>
        </div>
      </header>
      <div className="p-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <ActionSelector onSelect={handleActionSelect} />
            </motion.div>
          )}
          {step === 'form' && selectedAction && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ActionForm actionType={selectedAction} onSubmit={handleFormSubmit} onBack={handleBack} />
            </motion.div>
          )}
          {step === 'review' && formData && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <SubmissionReview data={formData} onConfirm={handleReviewConfirm} onEdit={handleBack} submitting={submitting} />
            </motion.div>
          )}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <SubmissionSuccess actionType={selectedAction || undefined} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
