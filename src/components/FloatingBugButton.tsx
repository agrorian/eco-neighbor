import { useState } from 'react';
import { Bug, X, Send, Loader2, CheckCircle, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { useLocation } from 'react-router-dom';

const SCREEN_NAMES: Record<string, string> = {
  '/':                    'Dashboard',
  '/submit':              'Submit Action',
  '/wallet':              'Wallet',
  '/wallet/redeem':       'Generate QR',
  '/wallet/referrals':    'Referral Hub',
  '/bridge':              'Maturation Bridge',
  '/directory':           'Business Directory',
  '/leaderboard':         'Leaderboard',
  '/impact':              'Community Impact',
  '/food-sharing':        'Food Sharing',
  '/governance':          'Governance',
  '/history':             'My History',
  '/my-log':              'Daily Log',
  '/profile':             'Profile',
  '/settings':            'Settings',
  '/more':                'More',
  '/partner-signup':      'Become a Partner',
  '/volunteer-apply':     'Join Onboarding Team',
  '/onboarding-queue':    'Onboarding Queue',
  '/mod-queue':           'Mod Queue',
  '/admin':               'Admin Dashboard',
  '/admin/users':         'Admin — Members',
  '/admin/campaigns':     'Admin — Campaigns',
  '/admin/partners':      'Admin — Partners',
  '/admin/bridge':        'Admin — Bridge Manager',
  '/admin/escalation':    'Admin — Escalation Queue',
  '/admin/bug-reports':   'Admin — Bug Reports',
  '/admin/onboarding':    'Admin — Onboarding',
  '/partner-float':       'Float Monitor',
  '/founder-sale':        'Founder Sale Gate',
  '/report':              'Report Submission',
};

function getScreenName(pathname: string): string {
  if (SCREEN_NAMES[pathname]) return SCREEN_NAMES[pathname];
  const partial = Object.keys(SCREEN_NAMES).find(k => k !== '/' && pathname.startsWith(k));
  if (partial) return SCREEN_NAMES[partial];
  return pathname;
}

const HIDDEN_PATHS = ['/login', '/signup/step1', '/signup/step2', '/about', '/bug-report'];

export default function FloatingBugButton() {
  const { user } = useUserStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const screenName = getScreenName(location.pathname);

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);

    await supabase.from('bug_reports').insert({
      title: title.trim(),
      description: description.trim(),
      screen: screenName,
      screen_path: location.pathname,
      severity,
      user_id: user?.id || null,
      email: user?.email || null,
      browser_info: navigator.userAgent.substring(0, 200),
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

  const handleClose = () => {
    setOpen(false);
    setTitle('');
    setDescription('');
    setSeverity('medium');
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 md:bottom-6 right-4 z-40 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title={`Report a bug on ${screenName}`}
        >
          <Bug className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-red-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bug className="w-4 h-4" />
              <span className="font-semibold text-sm">Report a Bug</span>
            </div>
            <button onClick={handleClose} className="text-white/80 hover:text-white">
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

              {/* Auto-detected screen — locked */}
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-red-400 font-medium uppercase tracking-wide">Reported from</div>
                  <div className="text-sm font-bold text-red-600 truncate">{screenName}</div>
                </div>
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
                placeholder="What happened? What did you expect?"
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
                          : s === 'high'   ? 'bg-orange-500 text-white'
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
