import { useState, useEffect } from 'react';
import { Share2, Users, Copy, CheckCircle, ArrowLeft, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ReferredUser {
  id: string; full_name: string; email: string; tier: string;
  referral_reward_paid: boolean; referral_milestone_paid: boolean; created_at: string;
}

interface EscrowItem {
  id: string; enb_amount: number; escrow_type: string; release_date: string; released: boolean;
}

export default function ReferralHub() {
  const { user } = useUserStore();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferredUser[]>([]);
  const [escrow, setEscrow] = useState<EscrowItem[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  // Use stored referral_code or generate from name+id
  const referralCode = user.referral_code ||
    `ENB-${(user.full_name || user.email || 'ENB').toUpperCase().replace(/\s+/g, '').slice(0, 4)}-${user.id.slice(0, 4).toUpperCase()}`;

  const referralLink = `${window.location.origin}/signup/step1?ref=${referralCode}`;

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    const [refRes, escrowRes] = await Promise.all([
      supabase.from('users').select('id, full_name, email, tier, referral_reward_paid, referral_milestone_paid, created_at')
        .eq('referred_by', user!.id).order('created_at', { ascending: false }),
      supabase.from('referral_escrow').select('*').eq('referrer_id', user!.id).order('created_at', { ascending: false }),
    ]);
    if (refRes.data) setReferrals(refRes.data);
    if (escrowRes.data) setEscrow(escrowRes.data);
    setLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `Join me on Eco-Neighbor and earn ENB tokens for community actions! Use my referral link: ${referralLink}`;
    if (navigator.share) {
      navigator.share({ title: 'Join Eco-Neighbor', text, url: referralLink });
    } else {
      handleCopy(referralLink);
    }
  };

  const pendingEscrow = escrow.filter(e => !e.released).reduce((sum, e) => sum + e.enb_amount, 0);
  const releasedTotal = escrow.filter(e => e.released).reduce((sum, e) => sum + e.enb_amount, 0);

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto pb-24">
      <header className="flex items-center gap-4">
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

      {/* Rewards Card */}
      <Card className="bg-gradient-to-br from-enb-green/10 to-enb-teal/10 border-none shadow-sm">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-7 h-7 text-enb-green" />
          </div>
          <h2 className="text-lg font-bold text-enb-text-primary">Invite Friends, Earn Rewards</h2>
          <p className="text-sm text-enb-text-secondary max-w-xs mx-auto">
            When your friend completes their first verified action: <span className="font-bold text-enb-green">500 ENB</span>.
            If they reach Helper Tier within 90 days: <span className="font-bold text-enb-green">+500 ENB bonus</span> (1,000 total).
            14-day escrow applies per whitepaper anti-gaming policy.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-white/70 rounded-lg p-3">
              <div className="text-xl font-bold text-enb-gold">{releasedTotal.toLocaleString()}</div>
              <div className="text-xs text-gray-500">ENB Earned</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="text-xl font-bold text-orange-500">{pendingEscrow.toLocaleString()}</div>
              <div className="text-xs text-gray-500">In Escrow</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your Referral Code</label>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="font-mono text-lg font-bold tracking-widest text-enb-text-primary">{referralCode}</div>
          <Button variant="ghost" size="sm" onClick={() => handleCopy(referralCode)} className="text-enb-green hover:bg-enb-green/10">
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <Button onClick={handleShare} className="w-full h-11 bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20">
          <Share2 className="w-4 h-4 mr-2" /> Share Referral Link
        </Button>
      </div>

      {/* Escrow pending */}
      {escrow.filter(e => !e.released).length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Escrow</label>
          {escrow.filter(e => !e.released).map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="text-sm font-medium text-orange-800">{e.enb_amount.toLocaleString()} ENB</div>
                  <div className="text-xs text-orange-600">{e.escrow_type === 'FIRST_ACTION' ? 'First action bonus' : 'Helper milestone'}</div>
                </div>
              </div>
              <div className="text-xs text-orange-500">
                Releases {new Date(e.release_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Your Referrals */}
      <div className="space-y-3">
        <h3 className="font-bold text-enb-text-primary">Your Referrals ({referrals.length})</h3>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No referrals yet. Share your code to start earning!</p>
          </div>
        ) : (
          referrals.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-enb-green/10 rounded-full flex items-center justify-center font-bold text-enb-green text-sm">
                  {(r.full_name || r.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-enb-text-primary text-sm">{r.full_name || r.email}</div>
                  <div className="text-xs text-gray-400">{r.tier} • Joined {new Date(r.created_at).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
              <div className="text-right">
                {r.referral_milestone_paid ? (
                  <span className="text-xs bg-enb-green/10 text-enb-green px-2 py-0.5 rounded-full font-medium">1,000 ENB ✓</span>
                ) : r.referral_reward_paid ? (
                  <span className="text-xs bg-enb-gold/10 text-enb-gold px-2 py-0.5 rounded-full font-medium">500 ENB ✓</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Pending</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
