import { motion } from 'motion/react';
import { Leaf, Users, Store, CheckCircle, Share2, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const IMPACT_DATA = [
  { month: 'Jan', co2: 120, waste: 450 },
  { month: 'Feb', co2: 150, waste: 520 },
  { month: 'Mar', co2: 180, waste: 600 },
  { month: 'Apr', co2: 220, waste: 750 },
  { month: 'May', co2: 280, waste: 890 },
  { month: 'Jun', co2: 350, waste: 1100 },
];

const StatCard = ({ icon: Icon, value, label, color }: { icon: any, value: string, label: string, color: string }) => (
  <Card className="border-gray-100 shadow-sm overflow-hidden">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-enb-text-primary">{value}</div>
        <div className="text-xs text-enb-text-secondary uppercase tracking-wider">{label}</div>
      </div>
    </CardContent>
  </Card>
);

export default function ImpactDashboard() {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Eco-Neighbor Impact',
        text: 'Check out the amazing impact our community has made! 350kg CO2e offset this month alone.',
        url: window.location.href,
      });
    } else {
      alert('Share feature not supported on this device.');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-enb-text-primary">Community Impact</h1>
        <p className="text-enb-text-secondary">Together, we are making a difference.</p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={Globe} value="12.5t" label="CO2e Offset" color="bg-blue-100 text-blue-600" />
        <StatCard icon={Leaf} value="45.2k" label="Waste Saved (kg)" color="bg-enb-green/10 text-enb-green" />
        <StatCard icon={CheckCircle} value="8,942" label="Verified Actions" color="bg-enb-teal/10 text-enb-teal" />
        <StatCard icon={Store} value="150+" label="Local Partners" color="bg-enb-gold/10 text-enb-gold" />
      </div>

      {/* Chart */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-enb-text-primary">Impact Timeline</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={IMPACT_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="waste" fill="#1A6B3C" radius={[4, 4, 0, 0]} name="Waste Saved (kg)" />
              <Bar dataKey="co2" fill="#3B82F6" radius={[4, 4, 0, 0]} name="CO2 Offset (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Community Growth */}
      <Card className="bg-gradient-to-br from-enb-green to-enb-teal text-white border-none shadow-lg shadow-enb-green/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-4xl font-bold mb-1">1,204</div>
            <div className="text-sm text-white/80 uppercase tracking-wider font-medium">Active Neighbors</div>
          </div>
          <p className="text-sm text-white/90 max-w-xs mx-auto">
            Our community has grown by 15% this month! Invite your friends to join the movement.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleShare} className="w-full h-12 text-lg bg-enb-text-primary text-white hover:bg-enb-text-primary/90 shadow-lg">
        <Share2 className="w-5 h-5 mr-2" />
        Share Impact
      </Button>
    </div>
  );
}
