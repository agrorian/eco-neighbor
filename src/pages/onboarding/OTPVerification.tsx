import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || '';
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex(v => !v);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired code. Please try again.');
      } else {
        navigate('/signup/step2');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setResendSuccess(false);
    setError('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendError) {
        setError(resendError.message || 'Failed to resend. Please try again.');
      } else {
        setResendCooldown(60);
        setResendSuccess(true);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const allFilled = otp.every(d => d !== '');

  return (
    <div className="min-h-screen bg-enb-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs — matches Welcome/Login/SignUp pattern */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-enb-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-enb-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg relative z-10">

        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/signup/step1')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-enb-text-primary ml-2">Verify Email</h2>
        </div>

        {/* Icon + instruction */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-enb-green/10 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-enb-green" />
          </div>
          <p className="text-sm text-enb-text-secondary leading-relaxed">
            We sent a 6-digit verification code to
          </p>
          <p className="text-sm font-semibold text-enb-text-primary mt-1 truncate max-w-full px-2">
            {email || 'your email address'}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Resend success banner */}
        {resendSuccess && !error && (
          <div className="mb-5 p-3 bg-enb-green/5 border border-enb-green/20 rounded-xl text-sm text-enb-green font-medium">
            ✅ New code sent — check your inbox.
          </div>
        )}

        {/* OTP digit inputs */}
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={[
                'w-11 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all',
                'focus:ring-2 focus:ring-enb-green/20',
                digit
                  ? 'border-enb-green bg-enb-green/5 text-enb-green'
                  : 'border-enb-border bg-enb-surface text-enb-text-primary',
                error ? '!border-red-300' : '',
              ].join(' ')}
              style={{ height: '3.25rem' }}
            />
          ))}
        </div>

        {/* Verify button */}
        <Button
          onClick={handleVerify}
          disabled={!allFilled || loading}
          className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
        >
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </Button>

        {/* Resend row */}
        <div className="mt-5 text-center">
          <p className="text-sm text-enb-text-secondary">
            Didn't receive the code?{' '}
            {resendCooldown > 0 ? (
              <span className="text-enb-text-muted">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-enb-green font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                {resending ? 'Sending…' : 'Resend Code'}
              </button>
            )}
          </p>
        </div>

        {/* Urdu tagline */}
        <p className="mt-8 text-center text-xs text-enb-text-muted" dir="rtl">
          آپ کی محنت کی قدر ہے
        </p>
      </div>

      {/* Wrong email link below the card */}
      <p className="mt-4 text-sm text-enb-text-secondary relative z-10">
        Wrong email?{' '}
        <button
          onClick={() => navigate('/signup/step1')}
          className="text-enb-green font-medium hover:underline"
        >
          Go back
        </button>
      </p>
    </div>
  );
}
