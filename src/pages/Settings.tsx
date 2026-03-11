import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Shield, HelpCircle, LogOut, MessageCircle, Save, User, ChevronRight, KeyRound } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

const NEIGHBOURHOODS = [
  'Chaklala Scheme 3','Airport Housing Society','Gulrez Housing Society',
  'Bahria Town','PWD Housing Society','Soan Garden','Koral Town',
  'Naval Anchorage','Jinnah Garden','Morgah','Lalazar','Saddar',
  'DHA Phase 1','DHA Phase 2','Gulistan Colony','Walayat Colony',
  'Yusuf Colony','Ayub Colony','Dhok Choudhrian','Car Chowk Area','Other'
];

const PROFESSIONS = [
  'Teacher','Doctor','Engineer','Shopkeeper','Plumber','Electrician',
  'Driver','Farmer','Student','Homemaker','Street Vendor','Milkman',
  'Painter / Mason','Community Food Guardian','Food Runner','Other'
];

export default function Settings() {
  const { user, setUser, logout } = useUserStore();

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp_number || '');
  const [neighbourhood, setNeighbourhood] = useState(user?.neighbourhood || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password reset
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setProfileError('');
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          whatsapp_number: whatsapp.replace(/\D/g, '') || null,
          neighbourhood: neighbourhood || null,
          profession: profession || null,
        })
        .eq('id', user.id);
      if (error) throw error;
      setUser({ ...user, full_name: fullName, whatsapp_number: whatsapp, neighbourhood, profession });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    setResetError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    window.location.href = '/';
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-enb-text-primary">Settings</h1>
        <p className="text-enb-text-secondary">Manage your account and preferences</p>
      </header>

      {/* Profile Card */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <User className="w-4 h-4 text-enb-green" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              WhatsApp Number
            </label>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+92 300 1234567"
            />
            <p className="text-xs text-gray-400">Used for action approval notifications. No marketing messages ever.</p>
          </div>

          {/* Neighbourhood */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Neighbourhood</label>
            <Select value={neighbourhood} onValueChange={setNeighbourhood}>
              <SelectTrigger>
                <SelectValue placeholder="Select your neighbourhood" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {NEIGHBOURHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Profession */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Profession</label>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger>
                <SelectValue placeholder="Select your profession" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {profileError && <p className="text-sm text-red-500">{profileError}</p>}

          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Card */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <Shield className="w-4 h-4 text-enb-teal" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-enb-text-primary">Email Address</p>
              <p className="text-xs text-enb-text-secondary">{user?.email || '—'}</p>
            </div>
          </div>

          {/* Change Password */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-enb-text-primary">Password</p>
                <p className="text-xs text-enb-text-secondary">Send a reset link to your email</p>
              </div>
            </div>
            {resetSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✅ Reset link sent to <strong>{user?.email}</strong>. Check your inbox.
              </div>
            ) : (
              <>
                {resetError && <p className="text-xs text-red-500 mb-2">{resetError}</p>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="w-full border-enb-teal/30 text-enb-teal hover:bg-enb-teal/5"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  {resetLoading ? 'Sending...' : 'Change Password'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <Bell className="w-4 h-4 text-enb-gold" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-enb-text-primary">WhatsApp Alerts</p>
              <p className="text-xs text-enb-text-secondary">Action approvals, ENB credited, campaign alerts</p>
            </div>
            <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${whatsapp ? 'bg-enb-green' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${whatsapp ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
          {!whatsapp && (
            <p className="text-xs text-orange-500 mt-2">Add your WhatsApp number above to enable notifications.</p>
          )}
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-2">
          <a
            href="https://wa.me/923001234567?text=Hi%20ENB%20Support%2C%20I%20need%20help%20with..."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-enb-text-secondary" />
              <span className="text-sm font-medium text-enb-text-primary">Help & Support (WhatsApp)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </a>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        size="lg"
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 shadow-none"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Log Out
      </Button>
    </div>
  );
}
