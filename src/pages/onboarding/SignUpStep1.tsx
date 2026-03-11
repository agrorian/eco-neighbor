import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignUpStep1() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    setIsExistingUser(false);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        // Supabase returns this when email exists (with or without password)
        if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('user already')
        ) {
          setIsExistingUser(true);
          setError('This email is already registered. If you signed in before with a magic link, use "Set Password" below to add a password to your account.');
        } else {
          throw error;
        }
        return;
      }
      navigate('/signup/step2');
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!email) { setError('Please enter your email address first.'); return; }
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
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-enb-text-primary ml-2">Create Account</h2>
        </div>

        {resetSent ? (
          <div className="text-center py-6 space-y-4">
            <div className="text-4xl">📧</div>
            <h3 className="font-bold text-enb-text-primary text-lg">Check your email</h3>
            <p className="text-sm text-gray-500">
              We sent a password setup link to <strong>{email}</strong>. Click it to set your password, then come back and log in.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full bg-enb-green text-white">
              Go to Login
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-enb-text-primary">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setIsExistingUser(false); setError(''); }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-enb-text-primary">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-enb-text-primary">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                />
              </div>

              <Button
                onClick={handleSignUp}
                className="w-full mt-4 bg-enb-dark text-white"
                disabled={!email || !password || !confirmPassword || loading}
              >
                {loading ? 'Creating account...' : 'Continue'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              {/* Show "Set Password" option when email already exists */}
              {isExistingUser && (
                <Button
                  onClick={handleSetPassword}
                  variant="outline"
                  className="w-full border-enb-green text-enb-green hover:bg-enb-green/5"
                  disabled={loading}
                >
                  📧 Send Password Setup Link
                </Button>
              )}

              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-enb-green font-medium hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
