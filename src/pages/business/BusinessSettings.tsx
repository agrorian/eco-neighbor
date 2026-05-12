import { useState, useRef, useEffect } from 'react';
import { Camera, Save, Loader2, User, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

function formatCnic(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return digits.slice(0,5) + '-' + digits.slice(5);
  return digits.slice(0,5) + '-' + digits.slice(5,12) + '-' + digits.slice(12);
}

export default function BusinessSettings() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [partnerId, setPartnerId] = useState('');

  // Profile fields
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hours, setHours] = useState('');
  const [ownerDob, setOwnerDob] = useState('');
  const [ownerCnic, setOwnerCnic] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [coverPic, setCoverPic] = useState('');

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;  // ENB DOCTRINE: guard user.id not just user
    supabase.from('business_partners').select('*').eq('owner_user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setPartnerId(data.id);
          setBusinessName(data.business_name || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setWhatsapp(data.whatsapp || '');
          setHours(data.hours || '');
          setOwnerDob(data.owner_dob || '');
          setOwnerCnic(data.owner_cnic || '');
          setProfilePic(data.profile_pic_url || '');
          setCoverPic(data.cover_pic_url || '');
        }
        setLoading(false);
      });
  }, [user?.id]);

  const uploadImage = async (file: File, type: 'profile' | 'cover') => {
    if (type === 'profile') setProfileUploading(true);
    else setCoverUploading(true);
    const fd = new FormData();
    fd.append('file', file); fd.append('upload_preset', 'enb_photos');
    fd.append('folder', 'enb/profiles/businesses');
    const res = await fetch('https://api.cloudinary.com/v1_1/dl86obm3b/image/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.secure_url) {
      if (type === 'profile') setProfilePic(data.secure_url);
      else setCoverPic(data.secure_url);
    }
    if (type === 'profile') setProfileUploading(false);
    else setCoverUploading(false);
  };

  const handleSave = async () => {
    if (!partnerId) return;
    setSaving(true); setError(''); setSaved(false);
    const { error: dbError } = await supabase.from('business_partners').update({
      business_name: businessName.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      hours: hours.trim() || null,
      owner_dob: ownerDob || null,
      owner_cnic: ownerCnic || null,
      profile_pic_url: profilePic || null,
      cover_pic_url: coverPic || null,
    }).eq('id', partnerId);
    if (dbError) { setError('Failed to save. Please try again.'); }
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-enb-green" /></div>;

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">Business Profile</h1>
        <p className="text-sm text-enb-text-secondary">Update your business listing and owner details</p>
      </header>

      {/* Cover + Profile pics */}
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-enb-green to-enb-teal">
          {coverPic && <img src={coverPic} alt="Cover" className="w-full h-full object-cover" />}
          <button onClick={() => coverInputRef.current?.click()}
            className="absolute top-2 right-2 bg-black/30 text-white rounded-full p-1.5 hover:bg-black/50">
            {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover')} />
        </div>
        <CardContent className="p-5">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl border-4 border-white bg-enb-green/10 flex items-center justify-center overflow-hidden shadow-md">
                {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-enb-green">{businessName.charAt(0) || '?'}</span>}
              </div>
              <button onClick={() => profileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-enb-green text-white rounded-full flex items-center justify-center shadow">
                {profileUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
              <input ref={profileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'profile')} />
            </div>
            <div className="pb-1">
              <p className="text-xs text-gray-400">Tap camera icons to update photos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business info */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-enb-green" /> Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-enb-text-primary mb-1 block">Business Name</label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-enb-text-primary mb-1 block">Address</label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-enb-text-primary mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92..." />
            </div>
            <div>
              <label className="text-sm font-medium text-enb-text-primary mb-1 block">WhatsApp</label>
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+92..." />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-enb-text-primary mb-1 block">Business Hours</label>
            <Input value={hours} onChange={e => setHours(e.target.value)} placeholder="e.g. Mon-Sat: 9am - 9pm" />
          </div>
        </CardContent>
      </Card>

      {/* Owner info */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-enb-green" /> Owner Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-enb-text-primary mb-1 block">Date of Birth</label>
              <input type="date" value={ownerDob} onChange={e => setOwnerDob(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-enb-green/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-enb-text-primary mb-1 block">CNIC</label>
              <Input value={ownerCnic} onChange={e => setOwnerCnic(formatCnic(e.target.value))}
                placeholder="XXXXX-XXXXXXX-X" maxLength={15} className="font-mono" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Owner details are kept private and only visible to admin.</p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
      {saved && <p className="text-sm text-enb-green bg-green-50 border border-green-200 rounded-lg p-3">✓ Profile saved successfully</p>}

      <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-enb-green text-white shadow-lg shadow-enb-green/20">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
      </Button>
    </div>
  );
}
