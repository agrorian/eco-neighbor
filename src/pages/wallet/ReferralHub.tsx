import { useState } from 'react';
import { Share2, Users, Copy, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';

export default function ReferralHub() {
  const { user } = useUserStore();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const nameSlug = (user.full_name || user.email || 'ENB').toUpperCase().replace(/\s+/g, '').slice(0, 4);
  const referralCode = `ENB-${nameSlug}-${user.id.slice(0, 4).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 p-6 max-w-lg mx-auto pb-24">
      <header className="mb-6 flex items-center gap-4">
        <Link to="/wallet">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Referral Hub</h1>
          <p className="text-sm text-enb-text-secondary">Invite friends and earn ENB</p>
        </div>
      </header>

      <Card className="bg-gradient-to-br from-enb-green/10 to-enb-teal/10 border-none shadow-sm">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-8 h-8 text-enb-green" />
          </div>
          <h2 className="text-lg font-bold text-enb-text-primary">Invite Friends, Earn Rewards</h2>
          <p className="text-sm text-enb-text-secondary max-w-xs mx-auto">
            Share your unique code. When your friend signs up and completes their first verified action, you earn{' '}
            <span className="font-bold text-enb-green">500 ENB</span>. Doubles to{' '}
            <span className="font-bold text-enb-green">1,000 ENB</span> if they reach Helper Tier within 90 days!
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="font-mono text-lg font-bold tracking-widest text-enb-text-primary">{referralCode}</div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="text-enb-green hover:bg-enb-green/10">
            {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <Button className="w-full h-12 text-lg bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20">
          <Share2 className="w-5 h-5 mr-2" />
          Share Link
        </Button>
      </div>

      {/* Reward Tiers Info */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-enb-text-primary text-sm">Referral Reward Tiers</h3>
          {[
            { label: 'Refer an individual user', reward: '500 ENB' },
            { label: 'Refer a business partner', reward: '2,000 ENB' },
            { label: 'Refer a skilled tradesperson', reward: '1,000 ENB' },
            { label: 'Mentorship Multiplier (reach Guardian together)', reward: '3,000 ENB bonus' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-enb-text-secondary">{item.label}</span>
              <span className="font-bold text-enb-green">{item.reward}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-4">
        <h3 className="font-bold text-enb-text-primary text-lg mb-4">Your Referrals</h3>
        <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No referrals yet. Share your code to start earning!</p>
        </div>
      </div>
    </div>
  );
}
