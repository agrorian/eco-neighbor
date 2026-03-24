import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useT } from '@/contexts/LanguageContext';

export default function SignUpStep1() {
  const { l, isUrdu } = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Capture ?ref= from URL on load — save to BOTH localStorage AND sessionStorage
  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) {
      const clean = refFromUrl.trim();
      setReferralCode(clean);
      localStorage.setItem('referralCode', clean);
      sessionStorage.setItem('referralCode', clean);
    } else {
      // Check storage (handles page refresh)
      const saved = sessionStorage.getItem('referralCode') || localStorage.getItem('referralCode');
      if (saved) setReferralCode(saved);
    }
  }, []);

  const handleReferralChange = (val: string) => {
    const clean = val.trim();
    setReferralCode(clean);
    if (clean) {
      localStorage.setItem('referralCode', clean);
      sessionStorage.setItem('referralCode', clean);
    } else {
      localStorage.removeItem('referralCode');
      sessionStorage.removeItem('referralCode');
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    setIsExistingUser(false);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
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
      // Pass referral code in URL to Step2 so it survives navigation
      const ref = referralCode.trim();
      navigate(ref ? `/signup/step2?ref=${ref}` : '/signup/step2');
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
      setError(err.message || 'Failed to send reset email.l('signup', 'step1Title')/loginl('login', 'email')l('login', 'password')text' : 'passwordl('login', 'passwordPlaceholder')Enter' && handleSignUp()}
                />
              </div>

              {/* Referral Code Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-enb-text-primary flex items-center gap-2">
                  <Gift className="w-4 h-4 text-enb-gold" />
                  Referral Code
                  <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 619b3048"
                  value={referralCode}
                  onChange={(e) => handleReferralChange(e.target.value)}
                  className={referralCode ? 'border-enb-green bg-enb-green/5 font-mono' : ''}
                />
                {referralCode && (
                  <p className="text-xs text-enb-green font-medium">
                    ✅ Referral code applied — you and your referrer earn 500 ENB after your first action!
                  </p>
                )}
              </div>

              <Button
                onClick={handleSignUp}
                className="w-full mt-4 bg-enb-dark text-white"
                disabled={!email || !password || !confirmPassword || loading}
              >
                {loading ? l('common', 'loading') : l('common', 'continuel('login', 'noAccount') '}
                <button onClick={() => navigate('/login')} className="text-enb-green font-medium hover:underline">
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
