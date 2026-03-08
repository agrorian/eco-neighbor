import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Bell, Shield, Globe, HelpCircle, LogOut } from 'lucide-react';
import { useUserStore } from '@/store/user';

export default function Settings() {
  const { logout } = useUserStore();

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-enb-text-primary">Settings</h1>
        <p className="text-enb-text-secondary">Manage your preferences and account</p>
      </header>

      <div className="space-y-4">
        <Card className="border-l-4 border-l-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-left">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Profile Information
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left">
              <Shield className="w-4 h-4 mr-2" />
              Security & Privacy
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-left">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left">
              <Globe className="w-4 h-4 mr-2" />
              Language & Region
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-left">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help Center
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
