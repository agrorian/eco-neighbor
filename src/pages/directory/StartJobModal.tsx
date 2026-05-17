import { useState } from 'react';
import { X, Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { TRADE_EMOJI, TRADE_LABEL } from './TradesDirectory';

// ── StartJobModal — generates Job Code for street encounter ───────────────────
// IMPORTANT: Only the tradesperson can generate a job code (RLS enforced).
// This modal should only be shown when isOwnProfile = true.
// When a customer views a tradesperson's profile, they see a "Send Request"
// button instead, which sends an in-app message to the tradesperson.

interface Props {
  tradespersonId: string;
  tradespersonName: string;
  tradeTypes: string[];
  onClose: () => void;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function StartJobModal({ tradespersonId, tradespersonName, tradeTypes, onClose }: Props) {
  const { user } = useUserStore();
  const [selectedTrade, setSelectedTrade] = useState(tradeTypes[0] || 'general');
  const [step, setStep] = useState<'select' | 'code'>('select');
  const [jobCode, setJobCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genError, setGenError] = useState('');

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setGenError('');

    const code = generateCode();

    const { error } = await supabase.from('job_requests').insert({
      job_code: code,
      tradesperson_id: tradespersonId,
      trade_type: selectedTrade,
      status: 'pending',
    });

    if (error) {
      setGenError('Could not generate code. Please try again.');
      setGenerating(false);
      return;
    }

    setJobCode(code);
    setStep('code');
    setGenerating(false);
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/job/${jobCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const confirmUrl = jobCode ? `${window.location.origin}/job/${jobCode}` : '';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-enb-green">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            💼 Start a Job
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'select' ? (
            <>
              {/* Visual explanation — worded for both parties */}
              <div className="bg-enb-green/5 border border-enb-green/20 rounded-2xl p-4 text-center space-y-2">
                <p className="text-3xl">📱 → 🤝 → ✅</p>
                <p className="text-sm text-enb-text-secondary">
                  A unique Job Code links this job to both you and your customer.
                  Share the code or QR with them — they confirm the job, you complete the work and submit.
                </p>
              </div>

              {/* Trade type selection */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-enb-text-primary">What type of job?</p>
                <div className="grid grid-cols-2 gap-2">
                  {tradeTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTrade(t)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedTrade === t
                          ? 'border-enb-green bg-enb-green/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-2xl">{TRADE_EMOJI[t] || '🛠️'}</span>
                      <span className="text-sm font-medium text-enb-text-primary">{TRADE_LABEL[t] || t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer warning */}
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-base">⏱️</span>
                Code expires in 30 minutes — generate only when the customer is with you
              </div>

              {genError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {genError}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-12 bg-enb-green text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-enb-green/20 disabled:opacity-60"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  : '🔑 Generate Job Code'}
              </button>
            </>
          ) : (
            <>
              {/* Job Code display */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">Share this code with your customer</p>
                <div className="bg-enb-green rounded-2xl p-6 shadow-lg">
                  <p className="text-5xl font-black font-mono tracking-widest text-white">
                    {jobCode}
                  </p>
                  <p className="text-white/70 text-xs mt-2">Job Code — valid 30 minutes</p>
                </div>
              </div>

              {/* Visual workflow */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { emoji: '📱', label: 'Show code' },
                  { emoji: '✍️', label: 'Customer confirms' },
                  { emoji: '✅', label: 'Job linked!' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl">{s.emoji}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Share link */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Or share this link with your customer</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-500 flex-1 truncate">{confirmUrl}</p>
                  <button onClick={handleCopy} className="flex-shrink-0 text-enb-green">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* QR code */}
              <div className="flex justify-center">
                <div className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(confirmUrl)}`}
                    alt="Job Code QR"
                    className="w-40 h-40"
                  />
                </div>
              </div>
              <p className="text-xs text-center text-gray-400">
                Customer scans → confirms job → your submission links automatically
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium"
              >
                Done — I'll submit my work after completing the job
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── StartJobModal — tradesperson taps "Start a Job" → generates Job Code ──────
// Covers Scenario 3: street encounter where customer + tradesperson agree in person
// Job Code is 6 alphanumeric chars, expires 30 minutes after creation (DB default)

interface Props {
  tradespersonId: string;
  tradespersonName: string;
  tradeTypes: string[];
  onClose: () => void;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/I/1 ambiguity
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function StartJobModal({ tradespersonId, tradespersonName, tradeTypes, onClose }: Props) {
  const { user } = useUserStore();
  const [selectedTrade, setSelectedTrade] = useState(tradeTypes[0] || 'general');
  const [step, setStep] = useState<'select' | 'code'>('select');
  const [jobCode, setJobCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);

    const code = generateCode();

    const { error } = await supabase.from('job_requests').insert({
      job_code: code,
      tradesperson_id: tradespersonId,
      trade_type: selectedTrade,
      status: 'pending',
      // expires_at defaults to NOW() + 30 minutes via DB default
    });

    if (!error) {
      setJobCode(code);
      setStep('code');
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/job/${jobCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const confirmUrl = jobCode ? `${window.location.origin}/job/${jobCode}` : '';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-enb-green">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            💼 Start a Job
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'select' ? (
            <>
              {/* Visual explanation */}
              <div className="bg-enb-green/5 border border-enb-green/20 rounded-2xl p-4 text-center space-y-2">
                <p className="text-3xl">📱 → 🤝 → ✅</p>
                <p className="text-sm text-enb-text-secondary">
                  Generate a Job Code. Show it to your customer. They enter it to confirm the job. You complete the work and submit.
                </p>
              </div>

              {/* Trade type selection */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-enb-text-primary">What type of job?</p>
                <div className="grid grid-cols-2 gap-2">
                  {tradeTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTrade(t)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedTrade === t
                          ? 'border-enb-green bg-enb-green/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-2xl">{TRADE_EMOJI[t] || '🛠️'}</span>
                      <span className="text-sm font-medium text-enb-text-primary">{TRADE_LABEL[t] || t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer warning */}
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-base">⏱️</span>
                Code expires in 30 minutes — generate only when the customer is with you
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-12 bg-enb-green text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-enb-green/20"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  : '🔑 Generate Job Code'}
              </button>
            </>
          ) : (
            <>
              {/* Job Code display — big, high contrast, visual-first */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">Show this code to your customer</p>
                <div className="bg-enb-green rounded-2xl p-6 shadow-lg">
                  <p className="text-5xl font-black font-mono tracking-widest text-white">
                    {jobCode}
                  </p>
                  <p className="text-white/70 text-xs mt-2">Job Code — valid 30 minutes</p>
                </div>
              </div>

              {/* Visual workflow */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { emoji: '📱', step: '1', label: 'Show code' },
                  { emoji: '✍️', step: '2', label: 'Customer enters' },
                  { emoji: '✅', step: '3', label: 'Job linked!' },
                ].map(s => (
                  <div key={s.step} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl">{s.emoji}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Share link */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Or share this link with your customer</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-500 flex-1 truncate">{confirmUrl}</p>
                  <button onClick={handleCopy} className="flex-shrink-0 text-enb-green">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* QR code */}
              <div className="flex justify-center">
                <div className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(confirmUrl)}`}
                    alt="Job Code QR"
                    className="w-40 h-40"
                  />
                </div>
              </div>
              <p className="text-xs text-center text-gray-400">
                Customer scans → confirms job → your submission links automatically
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium"
              >
                Done — I'll submit my work after completing the job
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
