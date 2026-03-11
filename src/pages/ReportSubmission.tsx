import { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CATEGORIES = [
  { value: 'fake_photo', label: '📷 Fake or staged photo', description: 'Photo appears to be fabricated or from another event' },
  { value: 'bribe', label: '💰 Moderator bribe attempt', description: 'Someone tried to influence a moderator\'s decision' },
  { value: 'duplicate', label: '🔁 Duplicate account', description: 'Same person using multiple accounts' },
  { value: 'other', label: '⚠️ Other concern', description: 'Any other suspicious activity' },
];

export default function ReportSubmission() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('target');
  const submissionId = searchParams.get('submission');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async () => {
    if (!category || !description.trim() || !targetId) return;
    setSubmitting(true);
    setError('');
    try {
      const { data, error } = await supabase.rpc('file_report', {
        p_reporter_id: user.id,
        p_target_id: targetId,
        p_submission_id: submissionId || null,
        p_category: category,
        p_description: description.trim(),
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Report failed');
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-enb-green/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-enb-green" />
        </div>
        <h2 className="text-2xl font-bold text-enb-text-primary">Report Submitted</h2>
        <p className="text-enb-text-secondary max-w-xs">
          Thank you for helping keep the community honest. If confirmed, you'll earn 2,000 ENB as a whistleblower reward.
        </p>
        <Button onClick={() => navigate(-1)} className="bg-enb-green text-white">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto p-4">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" /> Report a Concern
          </h1>
          <p className="text-sm text-enb-text-secondary">Your identity is kept confidential</p>
        </div>
      </header>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <p className="font-bold mb-1">Whistleblower Programme</p>
        <p>Confirmed reports earn <span className="font-bold">2,000 ENB</span>. False reports may result in penalties. 3 confirmed flags on a wallet trigger automatic suspension.</p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-bold text-enb-text-primary">What are you reporting?</label>
        {CATEGORIES.map(c => (
          <div key={c.value} onClick={() => setCategory(c.value)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${category === c.value ? 'border-enb-green bg-enb-green/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className="font-medium text-enb-text-primary text-sm">{c.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-enb-text-primary">Describe what you observed</label>
        <Textarea
          placeholder="Please provide as much detail as possible..."
          className="h-32 resize-none bg-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSubmit} disabled={!category || !description.trim() || !targetId || submitting}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white">
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit Report'}
      </Button>

      {!targetId && (
        <p className="text-xs text-red-500 text-center">No target specified. Use the Report button on a submission or profile.</p>
      )}
    </div>
  );
}
