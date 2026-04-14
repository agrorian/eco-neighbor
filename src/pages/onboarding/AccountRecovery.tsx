import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Shield, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Step = 'lookup' | 'confirm' | 'sent';

function formatCNIC(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const [domainName, ...tld] = domain.split('.');

  // Mask local: keep first 2 and last 1 char, rest are *
  const maskedLocal = local.length <= 3
    ? local[0] + '***'
    : local.slice(0, 2) + '*'.repeat(Math.min(local.length - 3, 5)) + local.slice(-1);

  // Mask domain: keep first 2 chars, rest are *
  const maskedDomain = domainName.length <= 2
    ? domainName
    : domainName.slice(0, 2) + '***';

  return `${maskedLocal}@${maskedDomain}.${tld.join('.')}`;
}

export default function AccountRecovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('lookup');

  // Step 1 state
  const [cnicNumber, setCnicNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2 state
  const [maskedEmail, setMaskedEmail] = useState('');
  const [actualEmail, setActualEmail] = useState('');
  const [confirming, setConfirming] = useState(false);

  const handleLookup = async () => {
    if (!cnicNumber || !fullName.trim()) return;
    setLoading(true);
    setError('');

    try {
      const digits = cnicNumber.replace(/\D/g, '');
      if (digits.length !== 13) {
        setError('Please enter a valid 13-digit CNIC number.');
        setLoading(false);
        return;
      }

      // Query by CNIC number only — then verify name matches
      const { data, error: queryError } = await supabase
        .from('users')
        .select('id, email, full_name, cnic_number')
        .eq('cnic_number', digits)
        .maybeSingle();

      if (queryError) throw queryError;

      if (!data) {
        setError('No account found with this CNIC number. If you registered without a CNIC, please use "Forgot Password" instead.');
        setLoading(false);
        return;
      }

      // Case-insensitive name comparison (trim both)
      const submittedName = fullName.trim().toLowerCase();
      const storedName = (data.full_name || '').trim().toLowerCase();

      if (submittedName !== storedName) {
        setError('The name you entered does not match the name registered with this CNIC. Please check and try again.');
        setLoading(false);
        return;
      }

      // Both CNIC and name match — show masked email
      setActualEmail(data.email);
      setMaskedEmail(maskEmail(data.email));
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLink = async () => {
    setConfirming(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(actualEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setStep('sent');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification link. Please try again.');
    } finally {
      setConfirming(false);
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
            onClick={() => step === 'lookup' ? navigate('/login') : setStep('lookup')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="ml-2">
            <h2 className="text-2xl font-bold text-enb-text-primary">Account Recovery</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 'lookup' && 'Step 1 of 2 — Verify your identity'}
              {step === 'confirm' && 'Step 2 of 2 — Confirm your email'}
              {step === 'sent' && 'Recovery link sent'}
            </p>
          </div>
        </div>

        {/* ── STEP 1: CNIC + Name Lookup ── */}
        {step === 'lookup' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-enb-green/5 rounded-xl border border-enb-green/20">
              <Shield className="w-5 h-5 text-enb-green mt-0.5 flex-shrink-0" />
              <p className="text-sm text-enb-text-secondary leading-relaxed">
                If you can't access the email address linked to your account, enter your 
                <strong> CNIC number</strong> and the <strong>full name</strong> you registered with. 
                We'll show you the email account connected to your ID.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">
                CNIC Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="XXXXX-XXXXXXX-X"
                value={cnicNumber}
                onChange={(e) => { setCnicNumber(formatCNIC(e.target.value)); setError(''); }}
                maxLength={15}
              />
              <p className="text-xs text-gray-400">Enter your 13-digit Pakistan CNIC</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">
                Full Name (as registered) <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Your full name — must match exactly"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(''); }}
              />
              <p className="text-xs text-gray-400">
                Enter your name exactly as you typed it during registration
              </p>
            </div>

            <Button
              onClick={handleLookup}
              className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
              disabled={!cnicNumber || !fullName.trim() || loading || cnicNumber.replace(/\D/g, '').length !== 13}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</>
                : <>Find My Account <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>

            <div className="pt-2 space-y-2 text-center">
              <p className="text-xs text-gray-400">
                Know your email but forgot your password?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-enb-green hover:underline font-medium"
                >
                  Use Forgot Password instead
                </button>
              </p>
              <p className="text-xs text-gray-400">
                Don't have an account yet?{' '}
                <button
                  onClick={() => navigate('/signup/step1')}
                  className="text-enb-green hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Confirm Email ── */}
        {step === 'confirm' && (
          <div className="space-y-5">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-enb-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-enb-green" />
              </div>
              <h3 className="font-bold text-enb-text-primary text-lg mb-2">Account Found</h3>
              <p className="text-sm text-enb-text-secondary">
                We found an account linked to your CNIC. The registered email address is:
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">Registered Email</p>
              <p className="text-xl font-mono font-bold text-enb-text-primary tracking-wide">
                {maskedEmail}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <p className="text-sm text-enb-text-secondary leading-relaxed">
              Is this your email address? We'll send a secure verification link to this email. 
              Open the link to access your account.
            </p>

            <Button
              onClick={handleSendLink}
              className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
              disabled={confirming}
            >
              {confirming
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending link...</>
                : <>Yes, send me the link <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Not your email?</strong> If you no longer have access to this email address, 
                you'll need to contact an admin to request an email change. 
                Email changes are limited to 2 times per account lifetime.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setStep('lookup')}
              className="w-full"
            >
              That's not my email — go back
            </Button>
          </div>
        )}

        {/* ── STEP 3: Link Sent ── */}
        {step === 'sent' && (
          <div className="space-y-5 text-center">
            <div className="py-6">
              <div className="w-20 h-20 bg-enb-green/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-enb-green" />
              </div>
              <h3 className="font-bold text-enb-text-primary text-xl mb-3">Recovery Link Sent!</h3>
              <p className="text-sm text-enb-text-secondary leading-relaxed mb-4">
                We've sent a secure access link to:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                <p className="font-mono font-bold text-enb-text-primary">{maskedEmail}</p>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Open your email and click the link to access your account. 
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
            </div>

            <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 text-left">
              <p className="text-sm text-enb-text-secondary leading-relaxed">
                <strong className="text-enb-green">Once you're back in:</strong> Go to Settings 
                to update your email address if needed. You can change your email a maximum of 
                <strong> 2 times</strong> over your account lifetime — to keep one person permanently 
                connected to one account.
              </p>
            </div>

            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
            >
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
