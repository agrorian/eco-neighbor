import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { saveCurrentSession } from '@/components/AccountSwitcher';

type Mode = 'login' | 'reset';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Save session for account switcher
      if (data.session && data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', data.user.id)
          .single();
        saveCurrentSession(
          { ...data.user, full_name: profile?.full_name, role: profile?.role },
          data.session
        );
      }
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-enb-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-enb-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-enb-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg relative z-10">

        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => mode === 'reset' ? (setMode('login'), setError(''), setResetSent(false)) : navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-enb-text-primary ml-2">
            {mode === 'login' ? 'Log In' : 'Reset Password'}
          </h2>
        </div>

        {/* Reset success state */}
        {resetSent ? (
          <div className="text-center py-4 space-y-4">
            <div className="text-5xl">📧</div>
            <h3 className="font-bold text-enb-text-primary text-lg">Check your email</h3>
            <p className="text-sm text-gray-500">
              We sent a password reset link to <strong>{email}</strong>.<br />
              Click the link in the email to set a new password, then come back and log in.
            </p>
            <Button
              onClick={() => { setMode('login'); setResetSent(false); setError(''); }}
              className="w-full bg-enb-green text-white"
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email field — shared between both modes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-enb-text-primary">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={(e) => mode === 'login' && e.key === 'Enter' && handleLogin()}
                />
              </div>

              {/* Password field — login mode only */}
              {mode === 'login' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-enb-text-primary">Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); }}
                      className="text-xs text-enb-green hover:underline flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Reset mode helper text */}
              {mode === 'reset' && (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  Enter your email address and we'll send you a link to set a new password. This also works if you previously signed in with a magic link.
                </p>
              )}

              {/* Primary action button */}
              {mode === 'login' ? (
                <Button
                  onClick={handleLogin}
                  className="w-full mt-2 bg-enb-dark text-white"
                  disabled={!email || !password || loading}
                >
                  {loading ? 'Logging in...' : 'Log In'}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              ) : (
                <Button
                  onClick={handleResetPassword}
                  className="w-full mt-2 bg-enb-green text-white"
                  disabled={!email || loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              )}

              {/* Footer links */}
              <div className="flex items-center justify-center gap-4 pt-2 text-sm text-gray-400">
                {mode === 'login' ? (
                  <span>
                    Don't have an account?{' '}
                    <button onClick={() => navigate('/signup/step1')} className="text-enb-green font-medium hover:underline">
                      Sign up
                    </button>
                  </span>
                ) : (
                  <button onClick={() => { setMode('login'); setError(''); }} className="text-enb-green font-medium hover:underline">
                    Back to Login
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
