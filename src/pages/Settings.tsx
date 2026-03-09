import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Shield, HelpCircle, LogOut, MessageCircle, Save, User, ChevronRight } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const { user, setUser, logout } = useUserStore();
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp_number || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          whatsapp_number: whatsapp.replace(/\D/g, '') || null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setUser({ ...user, full_name: fullName, whatsapp_number: whatsapp });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-enb-text-primary">Settings</h1>
        <p className="text-enb-text-secondary">Manage your account and preferences</p>
      </header>

      {/* Profile Settings */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <User className="w-4 h-4 text-enb-green" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

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

          {error && <p className="text-sm text-red-500">{error}</p>}

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

      {/* Account Info */}
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
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-enb-text-primary">Neighbourhood</p>
              <p className="text-xs text-enb-text-secondary">{user?.neighbourhood || '—'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-enb-text-primary">Profession</p>
              <p className="text-xs text-enb-text-secondary">{user?.profession || '—'}</p>
            </div>
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
