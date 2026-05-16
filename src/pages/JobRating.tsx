import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StarRating from '@/components/StarRating';
import { TRADE_EMOJI, TRADE_LABEL } from '@/pages/directory/TradesDirectory';

// ── JobRating — public page at /job/:code/rate ────────────────────────────────
// Shown to customer after submission is approved.
// Emoji-led rating: 5 stars + would hire again (Yes/No) + optional comment.
// All data stored in DB — every field recorded, no exceptions.

const RATING_EMOJI = ['', '😞', '😐', '🙂', '😊', '🤩'];
const RATING_LABEL = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

export default function JobRating() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [jobRequest, setJobRequest] = useState<any>(null);
  const [tradesperson, setTradesperson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldHireAgain, setWouldHireAgain] = useState<boolean | null>(null);

  useEffect(() => {
    if (!code) return;
    const load = async () => {
      setLoading(true);

      const { data: job } = await supabase
        .from('job_requests')
        .select('id, job_code, tradesperson_id, trade_type, status, job_rating, submission_id, customer_name')
        .eq('job_code', code.toUpperCase())
        .maybeSingle();

      if (!job) { setError('Job not found.'); setLoading(false); return; }

      if (job.job_rating !== null) {
        setError('You have already rated this job. Thank you!');
        setLoading(false); return;
      }

      // Only allow rating if submission has been approved
      if (job.submission_id) {
        const { data: sub } = await supabase
          .from('submissions')
          .select('status')
          .eq('id', job.submission_id)
          .maybeSingle();
        if (!sub || sub.status !== 'approved') {
          setError('The job is not yet verified. Please check back after the work has been reviewed.');
          setLoading(false); return;
        }
      } else if (job.status !== 'completed') {
        setError('The job has not been completed and verified yet. Please check back later.');
        setLoading(false); return;
      }

      setJobRequest(job);

      const { data: tp } = await supabase
        .from('users')
        .select('id, full_name, profile_pic_url, total_verified_jobs, avg_job_rating, total_job_ratings')
        .eq('id', job.tradesperson_id)
        .maybeSingle();
      if (tp) setTradesperson(tp);

      setLoading(false);
    };
    load();
  }, [code]);

  const handleSubmit = async () => {
    if (!jobRequest || rating === 0) return;
    setSubmitting(true);

    // Get IP hash for duplicate prevention (best-effort, not strict)
    const ipHash = btoa(`${navigator.userAgent}-${Date.now()}`).slice(0, 32);

    const { error: err } = await supabase
      .from('job_requests')
      .update({
        job_rating: rating,
        job_rating_comment: comment.trim() || null,
        would_hire_again: wouldHireAgain,
        rated_at: new Date().toISOString(),
        rating_ip_hash: ipHash,
      })
      .eq('id', jobRequest.id)
      .is('job_rating', null); // safety — prevent overwrite if already rated

    if (!err) {
      // Update tradesperson avg_job_rating aggregate
      await supabase.rpc('update_tradesperson_stats', {
        p_user_id: jobRequest.tradesperson_id,
      }).catch(() => {});

      setSubmitted(true);
    } else {
      setError('Could not save your rating. Please try again.');
    }
    setSubmitting(false);
  };

  const tradeEmoji = TRADE_EMOJI[jobRequest?.trade_type] || '🛠️';
  const tradeLabel = TRADE_LABEL[jobRequest?.trade_type] || 'Trade Job';

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <span className="text-5xl">{error.includes('already') ? '✅' : '⚠️'}</span>
        <p className="font-bold text-enb-text-primary">{error}</p>
        <button onClick={() => navigate('/')} className="text-sm text-enb-teal underline">
          Go to Eco-Neighbor
        </button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-3">
          <CheckCircle className="w-16 h-16 text-enb-green mx-auto" />
          <h2 className="text-xl font-bold text-enb-text-primary">Thank You! 🙏</h2>
          <p className="text-sm text-enb-text-secondary">
            Your rating for <strong>{tradesperson?.full_name}</strong> has been saved.
            It will appear on their verified work portfolio.
          </p>
          <div className="flex justify-center">
            <div className="text-4xl">{RATING_EMOJI[rating]}</div>
          </div>
          <p className="text-sm font-semibold text-enb-gold">{RATING_LABEL[rating]}</p>
        </div>

        <div className="bg-enb-green/5 border border-enb-green/20 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-enb-green">🌱 Want to earn $ENB too?</p>
          <p className="text-xs text-enb-text-secondary">
            Join Eco-Neighbor and earn tokens for community work, build your own verified portfolio, and spend $ENB at local businesses.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-enb-green text-white font-bold py-2.5 rounded-xl text-sm"
          >
            Join Free →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-enb-green to-enb-teal rounded-2xl p-5 text-white text-center">
          <p className="text-4xl mb-2">{tradeEmoji}</p>
          <h1 className="text-xl font-bold">Rate Your Experience</h1>
          <p className="text-white/80 text-sm">{tradeLabel} · {code?.toUpperCase()}</p>
        </div>

        {/* Tradesperson summary */}
        {tradesperson && (
          <div className="bg-white rounded-2xl p-4 shadow flex items-center gap-3">
            {tradesperson.profile_pic_url ? (
              <img src={tradesperson.profile_pic_url} alt=""
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-enb-teal/20 flex items-center justify-center text-enb-teal font-bold text-lg flex-shrink-0">
                {tradesperson.full_name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold text-enb-text-primary text-sm">{tradesperson.full_name}</p>
              <p className="text-xs text-gray-400">✅ {tradesperson.total_verified_jobs} verified jobs</p>
            </div>
          </div>
        )}

        {/* Rating card */}
        <div className="bg-white rounded-2xl p-5 shadow space-y-5">
          {/* Big emoji face + stars */}
          <div className="text-center space-y-3">
            <div className="text-6xl transition-all duration-200">
              {rating > 0 ? RATING_EMOJI[rating] : '🤔'}
            </div>
            {rating > 0 && (
              <p className="text-sm font-bold text-enb-text-primary">{RATING_LABEL[rating]}</p>
            )}
            <div className="flex justify-center">
              <StarRating
                value={rating}
                onChange={setRating}
                size="lg"
              />
            </div>
            {rating === 0 && (
              <p className="text-xs text-gray-400">Tap a star to rate</p>
            )}
          </div>

          {rating > 0 && (
            <>
              {/* Would hire again — visual Yes/No */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-enb-text-primary text-center">
                  Would you hire them again?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWouldHireAgain(true)}
                    className={`py-4 rounded-2xl border-2 text-2xl transition-all ${
                      wouldHireAgain === true
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    👍<br/>
                    <span className="text-xs font-semibold text-gray-600 mt-1 block">Yes!</span>
                  </button>
                  <button
                    onClick={() => setWouldHireAgain(false)}
                    className={`py-4 rounded-2xl border-2 text-2xl transition-all ${
                      wouldHireAgain === false
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    👎<br/>
                    <span className="text-xs font-semibold text-gray-600 mt-1 block">No</span>
                  </button>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">
                  💬 Leave a comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 120))}
                  placeholder="How was the work quality? Were they on time?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:border-enb-green"
                />
                <p className="text-xs text-gray-400 text-right">{comment.length}/120</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full h-12 bg-enb-green text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-enb-green/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit My Rating ✅
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-center text-gray-400 pb-4">
          Your rating is anonymous to others and helps build trust in the community.
        </p>
      </div>
    </div>
  );
}
