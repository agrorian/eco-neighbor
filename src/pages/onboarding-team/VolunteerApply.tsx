import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, Loader2, Users, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

export default function VolunteerApply() {
  const { user } = useUserStore();
  if (!user) return <Navigate to="/login" replace />;
  // Already onboarding team or admin — no need to apply
  if (['onboarding_team', 'admin'].includes(user.role || '')) return <Navigate to="/" replace />;

  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!motivation.trim()) { setError('Please tell us why you want to join.'); return; }
    setLoading(true); setError('');

    const { error: dbError } = await supabase.from('volunteer_applications').insert({
      user_id: user.id,
      role_applied: 'onboarding_team',
      motivation: motivation.trim(),
      experience: experience.trim() || null,
      availability: availability.trim() || null,
      status: 'pending',
    });

    if (dbError) { setError('Submission failed. Please try again.'); setLoading(false); return; }
    setSuccess(true); setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 space-y-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-24 h-24 bg-enb-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-enb-green" />
          </div>
        </motion.div>
        <h1 className="text-2xl font-bold text-enb-text-primary">Application Submitted!</h1>
        <p className="text-enb-text-secondary max-w-xs mx-auto text-sm">
          Thank you for volunteering. The admin team will review your application and get back to you soon.
        </p>
        <Link to="/more"><Button className="mt-4 bg-enb-green text-white">Back to More</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 max-w-lg mx-auto pb-24">
      <header className="flex items-center gap-3">
        <Link to="/more">
          <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Join Onboarding Team</h1>
          <p className="text-sm text-enb-text-secondary">Help bring local businesses into the ENB network</p>
        </div>
      </header>

      {/* What you'll do */}
      <div className="bg-enb-green rounded-2xl p-4 text-white space-y-2">
        <p className="font-bold text-sm">What Onboarding Team Members Do</p>
        <div className="space-y-1.5 text-sm text-white/90">
          {[
            { icon: Users, text: 'Contact businesses that apply to join ENB' },
            { icon: Star, text: 'Complete their profile — offers, discounts, float' },
            { icon: CheckCircle, text: 'Submit for admin approval when ready' },
            { icon: Clock, text: 'Earn 2,000 ENB for every business that goes live' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary">
              Why do you want to join the onboarding team? <span className="text-red-400">*</span>
            </label>
            <Textarea
              placeholder="Tell us your motivation and what you can bring to this role..."
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              className="resize-none h-28"
              maxLength={500}
            />
            <p className="text-xs text-gray-400">{motivation.length}/500</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary">
              Any relevant experience? <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <Textarea
              placeholder="e.g. sales, community work, running a business..."
              value={experience}
              onChange={e => setExperience(e.target.value)}
              className="resize-none h-20"
              maxLength={300}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary">
              Hours available per week <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <Textarea
              placeholder="e.g. 5-10 hours, evenings and weekends..."
              value={availability}
              onChange={e => setAvailability(e.target.value)}
              className="resize-none h-16"
              maxLength={200}
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

          <Button onClick={handleSubmit} disabled={loading || !motivation.trim()} className="w-full h-12 bg-enb-green text-white">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : <>Submit Application</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
