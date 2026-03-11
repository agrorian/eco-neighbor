import { useState } from 'react';
import { ArrowLeft, Heart, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

export default function FounderHardship() {
  const { user } = useUserStore();
  if (!user || !['founder', 'admin'].includes(user.role)) return <Navigate to="/" replace />;

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { error } = await supabase.from('hardship_applications').insert({
        founder_id: user.id,
        reason: reason.trim(),
        status: 'PENDING',
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
      <div className="w-20 h-20 bg-enb-green/10 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-enb-green" />
      </div>
      <h2 className="text-xl font-bold text-enb-text-primary">Application Submitted</h2>
      <p className="text-enb-text-secondary max-w-xs">Your hardship application has been submitted for governance review. The 5-of-7 multi-sig will vote within 7 days.</p>
      <Link to="/founder-sale"><Button className="bg-enb-green text-white">Back to Sale Gate</Button></Link>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto p-4">
      <header className="flex items-center gap-4">
        <Link to="/founder-sale"><Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" /> Hardship Application
          </h1>
          <p className="text-sm text-enb-text-secondary">Request emergency sale window exemption</p>
        </div>
      </header>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        This application triggers a governance vote by the 5-of-7 multi-sig Founding Council. Approval grants a one-time exemption from the standard sale window limits.
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Reason for Hardship Request</label>
            <Textarea
              placeholder="Describe your circumstances in detail. Be specific about the financial need and how it relates to your ENB holdings..."
              className="h-40 resize-none bg-white"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-400">Supporting documents can be submitted via WhatsApp to the Founding Team after this application.</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleSubmit} disabled={!reason.trim() || submitting}
            className="w-full bg-enb-green hover:bg-enb-green/90 text-white">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit Application'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
