import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NEIGHBOURHOODS = [
  'Chaklala Scheme 3','Airport Housing Society','Gulrez Housing Society',
  'Bahria Town','PWD Housing Society','Soan Garden','Koral Town',
  'Naval Anchorage','Jinnah Garden','Morgah','Lalazar','Saddar',
  'DHA Phase 1','DHA Phase 2','Gulistan Colony','Walayat Colony',
  'Yusuf Colony','Ayub Colony','Dhok Choudhrian','Car Chowk Area','Other'
];

const PROFESSIONS = [
  'Teacher','Doctor','Nurse','Engineer','Electrician','Plumber',
  'Carpenter','Mechanic','Artist','Student','Business Owner','Developer',
  'Chef','Driver','Farmer','Shopkeeper','Tailor','Contractor',
  'Social Worker','Religious Scholar','Street Vendor','Food Runner',
  'Community Food Guardian','Milkman','Painter / Mason','Retired','Other'
];

export default function SignUpStep2() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [profession, setProfession] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if there's a referral code from Step 1
  useEffect(() => {
    const referralCode = localStorage.getItem('referralCode');
    if (referralCode) {
      console.log('Referral code found in Step 2:', referralCode);
    }
  }, []);

  const handleNext = async () => {
    setLoading(true);
    setError('');

    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save/update profile
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: name,
          neighbourhood: neighborhood,
          profession: profession,
          email: user.email,
          ...(whatsapp ? { whatsapp_number: whatsapp.replace(/\D/g, '') } : {}),
        });

      if (upsertError) throw upsertError;

      // === REFERRAL CLAIM LOGIC ===
      const referralCode = localStorage.getItem('referralCode');

      if (referralCode) {
        console.log('Trying to apply referral code:', referralCode);

        // Find referrer by referral_code
        const { data: referrer, error: refError } = await supabase
          .from('users')
          .select('id, referral_code')
          .eq('referral_code', referralCode.trim())
          .single();

        console.log('Referrer lookup:', { referrer, refError });

        if (refError || !referrer) {
          console.warn('Referrer not found for code:', referralCode);
          // Optional: show user a message
          setError('Referral code not found — bonus not applied