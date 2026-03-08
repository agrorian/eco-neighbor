import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignUpStep1() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendLink = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/signup/step2`
        }
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send link. Please try again.');
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
          <h2 className="text-2xl font-bold text-enb-text-primary ml-2">Sign Up</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {!sent ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Enter your email and we'll send you a magic link to sign in instantly — no password needed.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSendLink}
              className="w-full mt-4"
              disabled={!value || loading}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-enb-green/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-enb-green" />
            </div>
            <h3 className="text-lg font-semibold text-enb-text-primary">Check your email</h3>
            <p className="text-sm text-gray-500">
              We sent a magic link to <span className="font-medium text-enb-text-primary">{value}</span>.
              Tap the link in the email to continue.
            </p>
            <p className="text-xs text-gray-400">
              Don't see it? Check your spam folder.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-enb-green hover:underline"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}