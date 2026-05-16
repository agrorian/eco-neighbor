import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TRADE_EMOJI, TRADE_LABEL } from '@/pages/directory/TradesDirectory';

// ── JobConfirmation — public page at /job/:code ───────────────────────────────
// Customer arrives here after tradesperson shows them the Job Code.
// Works for non-members (no login required).
// After confirming, the job is linked and the customer gets a rating link later.

const ENB_BENEFITS = [
  { emoji: '💰', text: 'Earn $ENB tokens for community work' },
  { emoji: '🔧', text: 'Build a verified digital work portfolio' },
  { emoji: '⭐', text: 'Grow your reputation in the community' },
  { emoji: '🏪', text: 'Spend $ENB at local partner businesses' },
  { emoji: '🚗', text: 'Join ENB Carpools — earn for rides' },
  { emoji: '🌱', text: 'Be part of Karachi\'s civic economy' },
  { emoji: '📱', text: 'Free to join — no hidden fees ever' },
];

export default function JobConfirmation() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [jobRequest, setJobRequest] = useState<any>(null);
  const [tradesperson, setTradesperson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');

  useEffect(() => {
    if (!code) return;
    const load = async () => {
      setLoading(true);
      const { data: job } = await supabase
        .from('job_requests')
        .select('id, job_code, tradesperson_id, trade_type, status, expires_at, customer_confirmed_at')
        .eq('job_code', code.toUpperCase())
        .maybeSingle();

      if (!job) { setError('Job code not found. Please check and try again.'); setLoading(false); return; }

      if (new Date(job.expires_at) < new Date()) {
        setError('This job code has expired. Please ask the tradesperson to generate a new one.');
        setLoading(false); return;
      }

      if (job.status !== 'pending') {
        setError('This job code has already been used.');
        setLoading(false); return;
      }

      setJobRequest(job);

      // Fetch tradesperson info
      const { data: tp } = await supabase
        .from('users')
        .select('id, full_name, profile_pic_url, city, total_verified_jobs, avg_job_rating, total_job_ratings, cnic_verified')
        .eq('id', job.tradesperson_id)
        .maybeSingle();
      if (tp) setTradesperson(tp);

      setLoading(false);
    };
    load();
  }, [code]);

  const handleConfirm = async () => {
    if (!jobRequest || !customerName.trim() || !customerPhone.trim()) return;
    setSubmitting(true);

    const { error: err } = await supabase
      .from('job_requests')
      .update({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        problem_description: problemDesc.trim() || null,
        agreed_price: agreedPrice ? parseFloat(agreedPrice) : null,
        status: 'customer_confirmed',
        customer_confirmed_at: new Date().toISOString(),
      })
      .eq('id', jobRequest.id)
      .eq('status', 'pending'); // safety check

    if (err) { setSubmitting(false); setError('Confirmation failed. Please try again.'); return; }

    setConfirmed(true);
    setSubmitting(false);
  };

  const tradeEmoji = TRADE_EMOJI[jobRequest?.trade_type] || '🛠️';
  const tradeLabel = TRADE_LABEL[jobRequest?.trade_type] || jobRequest?.trade_type || 'Trade Job';
  const showRating = tradesperson?.total_job_ratings >= 3;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <span className="text-6xl">❌</span>
        <p className="font-bold text-enb-text-primary text-lg">{error}</p>
        <button onClick={() => navigate('/')} className="text-sm text-enb-teal underline">
          Go to Eco-Neighbor App
        </button>
      </div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-5">
        {/* Success */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg space-y-3">
          <CheckCircle className="w-16 h-16 text-enb-green mx-auto" />
          <h2 className="text-xl font-bold text-enb-text-primary">Job Confirmed! ✅</h2>
          <p className="text-sm text-enb-text-secondary">
            Your job with <strong>{tradesperson?.full_name}</strong> is now recorded in the ENB system.
            After the work is done and verified, you'll get a link to rate the experience.
          </p>
          <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-3">
            <p className="text-xs text-gray-500">Job Code</p>
            <p className="text-2xl font-black font-mono tracking-widest text-enb-green">{code?.toUpperCase()}</p>
          </div>
        </div>

        {/* ENB membership pitch — marketing hook for non-members */}
        <div className="bg-white rounded-2xl p-5 shadow space-y-4">
          <p className="font-bold text-enb-green text-base flex items-center gap-2">
            🌱 Join Eco-Neighbor — It's Free
          </p>
          <p className="text-sm text-enb-text-secondary">
            ENB members earn tokens for community work, build verified portfolios, and spend $ENB at local businesses. Here's what you get:
          </p>
          <div className="space-y-2">
            {ENB_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-xl flex-shrink-0">{b.emoji}</span>
                <span className="text-sm text-enb-text-primary">{b.text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-enb-green text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-enb-green/20"
          >
            Create My Free Account →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="bg-enb-green rounded-2xl p-5 text-white text-center">
          <p className="text-4xl mb-2">{tradeEmoji}</p>
          <h1 className="text-xl font-bold">Confirm Your Job</h1>
          <p className="text-white/80 text-sm mt-1">{tradeLabel} Service</p>
          <div className="mt-3 bg-white/20 rounded-xl px-4 py-2 inline-block">
            <p className="text-xs text-white/70">Job Code</p>
            <p className="text-2xl font-black font-mono tracking-widest">{code?.toUpperCase()}</p>
          </div>
        </div>

        {/* Tradesperson info card */}
        {tradesperson && (
          <div className="bg-white rounded-2xl p-4 shadow flex items-center gap-4">
            {tradesperson.profile_pic_url ? (
              <img src={tradesperson.profile_pic_url} alt={tradesperson.full_name}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-enb-teal/20 flex items-center justify-center flex-shrink-0 text-xl font-bold text-enb-teal">
                {tradesperson.full_name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-enb-text-primary">{tradesperson.full_name}</p>
              <p className="text-xs text-gray-500">{tradesperson.city || ''}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-500">✅ {tradesperson.total_verified_jobs} verified jobs</span>
                {showRating && (
                  <span className="text-xs text-gray-500">⭐ {Number(tradesperson.avg_job_rating).toFixed(1)}</span>
                )}
                {tradesperson.cnic_verified && (
                  <span className="text-xs text-enb-green font-medium">🪪 Verified</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl p-5 shadow space-y-4">
          <p className="text-sm font-semibold text-enb-text-primary">Your details</p>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">
              👤 Your Name <span className="text-red-400">*</span>
            </label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="e.g. Ahmed Khan"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-enb-green"
            />
          </div>

          {/* Phone — required */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">
              📱 Mobile Number <span className="text-red-400">*</span>
            </label>
            <input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="03XX-XXXXXXX"
              type="tel"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-enb-green"
            />
            <p className="text-xs text-gray-400">
              Used only to link you to this job and send you a rating link after completion.
            </p>
          </div>

          {/* Problem description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">🔧 Describe the problem</label>
            <textarea
              value={problemDesc}
              onChange={e => setProblemDesc(e.target.value)}
              placeholder="e.g. Pipe is leaking under the kitchen sink..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:border-enb-green"
            />
          </div>

          {/* Agreed price — optional */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">💵 Agreed price (optional)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 font-medium">Rs.</span>
              <input
                value={agreedPrice}
                onChange={e => setAgreedPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                type="number"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-enb-green"
              />
            </div>
            <p className="text-xs text-gray-400">
              Cash payment is between you and the tradesperson. ENB only records the job — not the payment.
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!customerName.trim() || !customerPhone.trim() || submitting}
            className="w-full h-12 bg-enb-green text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-enb-green/20"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            ✅ Confirm This Job
          </button>

          <p className="text-xs text-center text-gray-400">
            By confirming, you verify that you agreed to hire this tradesperson for this work.
          </p>
        </div>
      </div>
    </div>
  );
}
