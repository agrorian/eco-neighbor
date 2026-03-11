import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase puts the token in the URL hash when user clicks the reset link.
    // onAuthStateChange fires with SIGNED_IN when Supabase processes it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if session already exists (page reload case)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetPassword = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      // Redirect to home after 2 seconds
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
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

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-enb-green p-2 rounded-xl">
            <div className="w-5 h-5 text-white font-bold text-xs flex items-center justify-center">🌿</div>
          </div>
          <span className="font-bold text-lg text-enb-text-primary">Eco-Neighbor</span>
        </div>

        {done ? (
          /* Success state */
          <div className="text-center py-4 space-y-4">
            <CheckCircle className="w-16 h-16 text-enb-green mx-auto" />
            <h3 className="font-bold text-enb-text-primary text-xl">Password Updated!</h3>
            <p className="text-sm text-gray-500">
              Your password has been set successfully. Redirecting you to the app...
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-enb-green mx-auto" />
          </div>

        ) : !sessionReady ? (
          /* Waiting for Supabase to process the token */
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-enb-green mx-auto" />
            <p className="text-sm text-gray-500">Verifying your reset link...</p>
            <p className="text-xs text-gray-400">
              If this takes too long,{' '}
              <button onClick={() => navigate('/login')} className="text-enb-green underline">
                go back to login
              </button>
              {' '}and request a new link.
            </p>
          </div>

        ) : (
          /* Password form */
          <>
            <h2 className="text-2xl font-bold text-enb-text-primary mb-2">Set New Password</h2>
            <p className="text-sm text-gray-500 mb-6">
              Choose a strong password for your Eco-Neighbor account.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-enb-text-primary">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
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
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSetPassword()}
                />
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= (i + 1) * 3
                        ? password.length >= 10 ? 'bg-enb-green' : 'bg-enb-gold'
                        : 'bg-gray-100'
                    }`} />
                  ))}
                </div>
              )}

              <Button
                onClick={handleSetPassword}
                disabled={!password || !confirmPassword || loading}
                className="w-full bg-enb-green hover:bg-enb-green/90 text-white mt-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                  : 'Set New Password'
                }
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
