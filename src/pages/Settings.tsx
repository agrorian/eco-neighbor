import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Shield, HelpCircle, LogOut, MessageCircle, Save, User, KeyRound, Camera, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import LanguageToggle from '@/components/LanguageToggle';
import { useLang, useT } from '@/contexts/LanguageContext';
import { PROFESSIONS } from '@/lib/constants';

const NEIGHBOURHOODS = [
  'Chaklala Scheme 3','Airport Housing Society','Gulrez Housing Society',
  'Bahria Town','PWD Housing Society','Soan Garden','Koral Town',
  'Naval Anchorage','Jinnah Garden','Morgah','Lalazar','Saddar',
  'DHA Phase 1','DHA Phase 2','Gulistan Colony','Walayat Colony',
  'Yusuf Colony','Ayub Colony','Dhok Choudhrian','Car Chowk Area','Other'
];

function formatCnic(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return digits.slice(0,5) + '-' + digits.slice(5);
  return digits.slice(0,5) + '-' + digits.slice(5,12) + '-' + digits.slice(12);
}

export default function Settings() {
  const { user, setUser, logout } = useUserStore();
  const { lang } = useLang();
  const { l } = useT();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp_number || '');
  const [neighbourhood, setNeighbourhood] = useState(user?.neighbourhood || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [dob, setDob] = useState((user as any)?.dob || '');
  const [cnic, setCnic] = useState((user as any)?.cnic || '');
  const [profilePic, setProfilePic] = useState((user as any)?.profile_pic_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const uploadPhoto = async (file: File) => {
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'enb_photos');
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dl86obm3b/image/upload', {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (data.secure_url) setProfilePic(data.secure_url);
    } catch { /* silent */ }
    setPhotoUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true); setProfileError(''); setSaved(false);
    const { error } = await supabase.from('users').update({
      full_name: fullName.trim(),
      whatsapp_number: whatsapp.trim() || null,
      neighbourhood: neighbourhood || null,
      profession: profession || null,
      dob: dob || null,
      cnic: cnic || null,
      profile_pic_url: profilePic || null,
    }).eq('id', user.id);

    if (error) { setProfileError(l('settings', 'saveError')); setSaving(false); return; }
    setUser({ ...user, full_name: fullName.trim(), whatsapp_number: whatsapp.trim() || undefined, profile_pic_url: profilePic || undefined } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true); setResetError(''); setResetSent(false);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setResetError(error.message); setResetLoading(false); return; }
    setResetSent(true); setResetLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">{l('settings', 'title')}</h1>
        <p className="text-enb-text-secondary">{l('settings', 'subtitle')}</p>
      </header>

      {/* Language */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-enb-text-primary">
              {lang === 'en' ? '🌐 Language / زبان' : '🌐 زبان / Language'}
            </p>
            <p className="text-sm text-enb-text-secondary">
              {lang === 'en' ? 'English — Tap to switch to Urdu' : 'اردو — انگریزی پر جائیں'}
            </p>
          </div>
          <LanguageToggle />
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-enb-green" /> {l('settings', 'profileInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Profile picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-enb-green/10 flex items-center justify-center overflow-hidden border-2 border-enb-green/20">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-enb-green">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-enb-green text-white rounded-full flex items-center justify-center shadow-sm hover:bg-enb-green/90"
              >
                {photoUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            </div>
            <div>
              <p className="font-medium text-sm text-enb-text-primary">{l('settings', 'profilePhoto')}</p>
              <p className="text-xs text-gray-400">{l('settings', 'tapCamera')}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-enb-text-primary mb-1 block">{l('settings', 'fullName')}</label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={l('settings', 'fullNamePlaceholder')} />
          </div>

          <div>
            <label className="text-sm font-medium text-enb-text-primary mb-1 block">{l('settings', 'whatsapp')}</label>
            <Input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+92 300 1234567" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-enb-text-primary mb-1 block">{l('settings', 'dob')}</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                max={new Date(Date.now() - 16*365*24*60*60*1000).toISOString().split('T')[0]}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-enb-green/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-enb-text-primary mb-1 block">{l('settings', 'cnic')}</label>
              <Input value={cnic} onChange={e => setCnic(formatCnic(e.target.value))}
                placeholder="XXXXX-XXXXXXX-X" maxLength={15} className="font-mono" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-enb-text-primary mb-1 block">{l('settings', 'neighbourhood')}</label>
            <Select value={neighbourhood} onValueChange={setNeighbourhood}>
              <SelectTrigger><SelectValue placeholder={l('settings', 'selectNeighbourhood')} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {NEIGHBOURHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-enb-text-primary mb-1 block">{l('settings', 'profession')}</label>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger><SelectValue placeholder={l('settings', 'selectProfession')} /></SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {profileError && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{profileError}</p>}
          {saved && <p className="text-sm text-enb-green bg-green-50 p-3 rounded-lg">✓ {l('settings', 'saved')}</p>}

          <Button onClick={handleSaveProfile} disabled={saving} className="w-full bg-enb-green text-white">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{l('settings', 'saving')}</> : <><Save className="w-4 h-4 mr-2" />{l('settings', 'saveChanges')}</>}
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-enb-green" /> {l('settings', 'account')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-enb-text-primary mb-1 block">{l('settings', 'emailAddress')}</label>
            <Input value={user.email || ''} disabled className="bg-gray-50 text-gray-400" />
          </div>
          <div>
            <Button onClick={handlePasswordReset} disabled={resetLoading || resetSent} variant="outline" className="w-full">
              <KeyRound className="w-4 h-4 mr-2" />
              {resetLoading ? l('settings', 'sending') : resetSent ? `✓ ${l('settings', 'resetSent')}` : l('settings', 'changePassword')}
            </Button>
            {resetError && <p className="text-sm text-red-500 mt-1">{resetError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full justify-start gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" /> {l('settings', 'whatsappSupport')}
            </Button>
          </a>
          <a href="/bug-report">
            <Button variant="outline" className="w-full justify-start gap-2">
              <HelpCircle className="w-4 h-4 text-enb-teal" /> {l('settings', 'reportProblem')}
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button onClick={handleLogout} variant="outline" className="w-full border-red-100 text-red-600 hover:bg-red-50">
        <LogOut className="w-4 h-4 mr-2" /> {l('settings', 'logOut')}
      </Button>

      <p className="text-center text-xs text-gray-400">Eco-Neighbor · ENB Token · App v1.3.0</p>
    </div>
  );
}
