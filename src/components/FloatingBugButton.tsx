import { useState } from 'react';
import { Bug, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { useLocation } from 'react-router-dom';

export default function FloatingBugButton() {
  const { user } = useUserStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Don't show on bug report page or auth pages
  const hiddenPaths = ['/bug-report', '/login', '/signup', '/', '/about'];
  if (hiddenPaths.includes(location.pathname) && location.pathname === '/') return null;
  if (['/login', '/signup/step1', '/signup/step2', '/about'].includes(location.pathname)) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    await supabase.from('bug_reports').insert({
      title: title.trim(),
      description: description.trim(),
      screen: location.pathname,
      severity,
      user_id: user?.id || null,
      email: user?.email || null,
      browser_info: navigator.userAgent,
      source: 'floating_button',
      status: 'open',
    });
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
      setTitle('');
      setDescription('');
      setSeverity('medium');
    }, 2000);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 md:bottom-6 right-4 z-40 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Report a bug"
        >
          <Bug className="w-4 h-4" />
        </button>
      )}

      {/* Bug report panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-red-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bug className="w-4 h-4" />
              <span className="font-semibold text-sm">Report a Bug</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {success ? (
            <div className="p-6 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-enb-green mx-auto" />
              <p className="font-semibold text-enb-text-primary">Thanks! Bug reported.</p>
              <p className="text-xs text-gray-500">We'll look into it shortly.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5">
                📍 Screen: <span className="font-mono font-medium">{location.pathname}</span>
              </div>

              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Brief title *"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
              />

              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 h-20"
                placeholder="What happened? What did you expect? *"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
              />

              <div className="flex gap-2">
                {['low', 'medium', 'high', 'critical'].map(s => (
                  <button key={s} onClick={() => setSeverity(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      severity === s
                        ? s === 'critical' ? 'bg-red-500 text-white'
                          : s === 'high' ? 'bg-orange-500 text-white'
                          : s === 'medium' ? 'bg-yellow-500 text-white'
                          : 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>{s}</button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !description.trim()}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
