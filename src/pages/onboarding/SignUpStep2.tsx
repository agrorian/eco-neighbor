import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NEIGHBOURHOODS = [
  'Chaklala Scheme 3',
  'Airport Housing Society',
  'Gulrez Housing Society',
  'Bahria Town',
  'PWD Housing Society',
  'Soan Garden',
  'Koral Town',
  'Naval Anchorage',
  'Jinnah Garden',
  'Morgah',
  'Lalazar',
  'Saddar',
  'DHA Phase 1',
  'DHA Phase 2',
  'Gulistan Colony',
  'Walayat Colony',
  'Yusuf Colony',
  'Ayub Colony',
  'Dhok Choudhrian',
  'Car Chowk Area',
  'Other'
];

const PROFESSIONS = [
  'Teacher',
  'Doctor',
  'Nurse',
  'Engineer',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Mechanic',
  'Artist',
  'Student',
  'Business Owner',
  'Developer',
  'Chef',
  'Driver',
  'Farmer',
  'Shopkeeper',
  'Tailor',
  'Contractor',
  'Social Worker',
  'Religious Scholar',
  'Retired',
  'Other'
];

export default function SignUpStep2() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [profession, setProfession] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: name,
          neighbourhood: neighborhood,
          profession: profession,
          email: user.email
        });
      if (error) throw error;
      navigate('/onboarding/wallet');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
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
          <h2 className="text-2xl font-bold text-enb-text-primary ml-2">Complete Profile</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Full Name</label>
            <Input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Neighbourhood</label>
            <Select onValueChange={setNeighborhood}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your neighbourhood" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {NEIGHBOURHOODS.map(n => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Profession</label>
            <Select onValueChange={setProfession}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your profession" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {PROFESSIONS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Profile Photo <span className="text-gray-400 font-normal">(Optional)</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group bg-white">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-enb-green/10 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-enb-green" />
              </div>
              <p className="text-xs text-gray-400">Upload or drag & drop</p>
              <input type="file" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            </div>
          </div>

          <Button onClick={handleNext} className="w-full mt-4" disabled={!name || !neighborhood || !profession || loading}>
            {loading ? 'Saving...' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}