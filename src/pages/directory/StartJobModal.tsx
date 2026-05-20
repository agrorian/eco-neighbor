import { useState } from 'react';
import { X, Loader2, Copy, Check, AlertTriangle, MessageCircle } from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { useNavigate } from 'react-router-dom';
import { TRADE_EMOJI, TRADE_LABEL } from './TradesDirectory';

// ── StartJobModal — generates Job Code for street encounter ───────────────────
// Only shown on isOwnProfile = true. The tradesperson generates the code,
// shares it with the customer. Customer confirms at /job/:code.
// RLS: only tradesperson can insert job_requests with their own tradesperson_id.

interface Props {
  tradespersonId: string;
  tradespersonName: string;
  tradeTypes: string[];
  customerId?: string; // if opened from a conversation, pre-fill the recipient
  onClose: () => void;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/I/1 ambiguity
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function StartJobModal({ tradespersonId, tradespersonName, tradeTypes, customerId, onClose }: Props) {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [selectedTrade, setSelectedTrade] = useState(tradeTypes[0] || 'general');
  const [step, setStep] = useState<'select' | 'code'>('select');
  const [jobCode, setJobCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genError, setGenError] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);

  // Fetch recent conversation partners when code is generated
  const fetchRecentContacts = async () => {
    if (!user) return;
    const { data } = await getDb()
      .from('messages')
      .select('sender_id, recipient_id')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!data) return;
    const partnerIds = [...new Set(
      data.map(m => m.sender_id === user.id ? m.recipient_id : m.sender_id)
    )].slice(0, 6);

    if (partnerIds.length === 0) return;
    const { data: users } = await getDb()
      .from('users')
      .select('id, full_name')
      .in('id', partnerIds);

    if (users) setContacts(users.map(u => ({ id: u.id, name: u.full_name })));
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setGenError('');

    const code = generateCode();

    const { error } = await getDb().from('job_requests').insert({
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
    fetchRecentContacts(); // load contacts for the send picker
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/job/${jobCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Send the job link directly to the customer via in-app message
  const sendLinkToCustomer = async (recipientId: string) => {
    if (!user || !jobCode) return;
    setMessageSending(true);
    const url = `${window.location.origin}/job/${jobCode}`;
    const content = `<p>Here is your Job Code link to confirm our job agreement:</p><p><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p><p>Job Code: <strong>${jobCode}</strong></p><p>Please open this link and enter your details to confirm the job. شکریہ 🔑</p>`;
    await getDb().from('messages').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      message_type: 'direct',
      content,
      channel_id: null,
      team_id: null,
    });
    setMessageSending(false);
    setMessageSent(true);
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
              {/* Visual explanation — worded to apply to both parties */}
              <div className="bg-enb-green/5 border border-enb-green/20 rounded-2xl p-4 text-center space-y-2">
                <p className="text-3xl">📱 → 🤝 → ✅</p>
                <p className="text-sm text-enb-text-secondary">
                  A unique Job Code links this job to both parties.
                  Share the code or QR with your customer — they confirm the job,
                  you complete the work and submit for verification.
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
              {/* Job Code display — big, high contrast */}
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

              {/* Copy link */}
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
                Customer scans → confirms the job → your submission links automatically after approval
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium"
              >
                Done — I'll submit my work after completing the job
              </button>

              {/* Send via message — contact picker */}
              {!messageSent && (
                <div className="space-y-2">
                  {!showContactPicker ? (
                    <button
                      onClick={() => setShowContactPicker(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-enb-teal/10 text-enb-teal border border-enb-teal/20 text-sm font-semibold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send Link via Message
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 text-center">Send to which customer?</p>
                      {contacts.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">No recent contacts found</p>
                      ) : (
                        <div className="space-y-1.5">
                          {contacts.map(c => (
                            <button
                              key={c.id}
                              onClick={() => sendLinkToCustomer(c.id)}
                              disabled={messageSending}
                              className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-enb-teal/40 hover:bg-enb-teal/5 transition-all text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-enb-teal/20 flex items-center justify-center text-enb-teal font-bold text-sm flex-shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-enb-text-primary">{c.name}</span>
                              {messageSending && <Loader2 className="w-4 h-4 animate-spin ml-auto text-enb-teal" />}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setShowContactPicker(false)}
                        className="w-full text-xs text-gray-400 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
              {messageSent && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-enb-green font-medium">
                  <Check className="w-4 h-4" /> Link sent to customer ✓
                </div>
              )}

              {/* Reminder — submit trade job action to record in portfolio */}
              <div className="bg-enb-gold/10 border border-enb-gold/20 rounded-xl p-3 text-xs text-enb-text-secondary">
                <p className="font-semibold text-enb-gold mb-1">📋 Don't forget:</p>
                After completing the work, go to <strong>Community Action → Trade Job</strong> and submit your before/after photos. This records the job in your verified portfolio and earns you ENB tokens.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
