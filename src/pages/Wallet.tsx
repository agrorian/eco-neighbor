import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, QrCode, Users } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import TransactionHistory from './wallet/TransactionHistory';

export default function Wallet() {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (!user) return;
    const refreshBalance = async () => {
      const { data } = await supabase
        .from('users')
        .select('enb_local_bal, enb_global_bal, rep_score, tier')
        .eq('id', user.id)
        .single();
      if (data) setUser({ ...user, ...data });
    };
    refreshBalance();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-enb-text-primary">My Wallet</h1>
        <p className="text-enb-text-secondary">Manage your ENB tokens and transactions</p>
      </header>

      {/* Rep Score & Tier */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-enb-gold/10 flex items-center justify-center text-enb-gold font-bold">
            {user.tier?.charAt(0) || 'N'}
          </div>
          <div>
            <div className="font-bold text-enb-text-primary">{user.tier} Tier</div>
            <div className="text-xs text-enb-text-secondary">Rep Score: {user.rep_score}</div>
          </div>
        </div>
        <Link to="/leaderboard">
          <Button variant="ghost" size="sm" className="text-enb-gold hover:text-enb-gold hover:bg-enb-gold/10">
            View Progress
          </Button>
        </Link>
      </div>

      {/* Token Cards — stack on mobile, side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ENB.LOCAL Card */}
        <Card className="border-l-4 border-l-enb-green shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-enb-text-secondary uppercase tracking-wider">ENB.LOCAL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-enb-green mb-1">
              {(user.enb_local_bal || 0).toLocaleString()}
            </div>
            <p className="text-xs text-enb-text-secondary mb-5">Community Rewards (Non-transferable)</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/wallet/redeem">
                <Button variant="outline" size="sm" className="w-full">
                  <QrCode className="w-4 h-4 mr-2 flex-shrink-0" />
                  Redeem
                </Button>
              </Link>
              <Link to="/bridge">
                <Button variant="outline" size="sm" className="w-full text-enb-gold border-enb-gold/20 hover:bg-enb-gold/5">
                  <RefreshCw className="w-4 h-4 mr-2 flex-shrink-0" />
                  Bridge
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ENB.GLOBAL Card */}
        <Card className="border-l-4 border-l-enb-gold shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-enb-text-secondary uppercase tracking-wider">ENB.GLOBAL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-enb-gold mb-1">
              {(user.enb_global_bal || 0).toLocaleString()}
            </div>
            <p className="text-xs text-enb-text-secondary mb-5">Tradeable Token (Solana)</p>
            <div className="grid grid-cols-2 gap-2">
              <Button className="w-full bg-enb-dark text-white hover:bg-enb-dark/90 shadow-sm text-sm" size="sm">
                <ArrowUpRight className="w-4 h-4 mr-2 flex-shrink-0" />
                Send
              </Button>
              <Button variant="outline" size="sm" className="w-full text-sm">
                <ArrowDownLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                Receive
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Banner */}
      <Link to="/wallet/referrals">
        <div className="bg-gradient-to-r from-enb-green/10 to-enb-teal/10 p-4 rounded-xl border border-enb-green/20 flex items-center justify-between cursor-pointer hover:bg-enb-green/20 transition-colors">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-enb-green flex-shrink-0" />
            <div>
              <div className="font-bold text-enb-text-primary">Invite Friends</div>
              <div className="text-xs text-enb-text-secondary">Earn 500 ENB for every referral</div>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-enb-green flex-shrink-0" />
        </div>
      </Link>

      <TransactionHistory />
    </div>
  );
}
