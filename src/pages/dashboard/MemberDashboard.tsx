import React from 'react';
import ENBLeaf from '@/components/ENBLeaf';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { Leaf, ArrowRight, Clock, Star, MapPin, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore, getTier } from '@/store/user';
import { Link } from 'react-router-dom';

const ActiveCampaignBanner = () => {
  const [campaign, setCampaign] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchCampaign = async () => {
      try {
        // Use limit(1) without .single() to avoid throwing on empty result
        const { data } = await supabase
          .from('campaigns')
          .select('name, multiplier, ends_at')
          .eq('is_active', true)
          .order('ends_at', { ascending: true })
          .limit(1);
        if (data && data.length > 0) setCampaign(data[0]);
      } catch (e) {
        // Silently ignore — no campaign is fine
      }
    };
    fetchCampaign();
  }, []);

  if (!campaign) return null;

  const endsAt = new Date(campaign.ends_at);
  const hoursLeft = Math.max(0, Math.round((endsAt.getTime() - Date.now()) / 3600000));
  const timeLabel = hoursLeft >= 48 ? `${Math.round(hoursLeft / 24)}d left` : `${hoursLeft}h left`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-enb-green to-enb-teal rounded-2xl p-6 text-white mb-6 relative overflow-hidden shadow-lg shadow-enb-green/20"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
            {campaign.multiplier}× Bonus Active
          </div>
          {campaign.ends_at && (
            <div className="flex items-center gap-1 text-xs font-medium bg-black/20 px-2 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              <span>{timeLabel}</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold mb-1">{campaign.name}</h3>
        <p className="text-white/90 text-sm mb-4 max-w-xs">
          Earn {campaign.multiplier}× ENB for eligible actions during this campaign!
        </p>
        <Link to="/admin/campaigns">
          <Button variant="secondary" size="sm" className="bg-white text-enb-green hover:bg-white/90 border-none">
            View Campaign <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

const ImpactCounter = () => {
  const [stats, setStats] = React.useState({ actions: 0, enb: 0 });

  React.useEffect(() => {
    const fetch = async () => {
      try {
        const [aRes, tRes] = await Promise.all([
          supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
          supabase.from('transactions').select('enb_amount').eq('type', 'credit'),
        ]);
        const totalEnb = (tRes.data || []).reduce((s: number, t: any) => s + (t.enb_amount || 0), 0);
        setStats({ actions: aRes.count || 0, enb: totalEnb });
      } catch (e) { /* silent */ }
    };
    fetch();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card className="bg-enb-green/5 border-enb-green/10">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-enb-green mb-1">{stats.actions.toLocaleString()}</div>
          <div className="text-xs text-enb-text-secondary uppercase tracking-wider">Verified Actions</div>
        </CardContent>
      </Card>
      <Card className="bg-enb-gold/5 border-enb-gold/10">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-enb-gold mb-1">{(stats.enb / 1000).toFixed(1)}k</div>
          <div className="text-xs text-enb-text-secondary uppercase tracking-wider">ENB Distributed</div>
        </CardContent>
      </Card>
    </div>
  );
};

const RecentActivity = () => {
  const { user } = useUserStore();
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) return;
    const fetchTx = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('id, description, enb_amount, rep_change, created_at, type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) console.error('Recent activity error:', error);
        if (data) setTransactions(data);
      } catch (e) {
        console.error('Recent activity exception:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [user?.id]);

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-enb-text-primary text-lg">Recent Activity</h3>
      {loading && (
        <div className="text-sm text-enb-text-secondary text-center py-4">Loading...</div>
      )}
      {!loading && transactions.length === 0 && (
        <div className="text-sm text-enb-text-secondary text-center py-8 bg-gray-50 rounded-xl">
          No activity yet — submit your first community action!
        </div>
      )}
      {transactions.map((item, i) => (
        <div key={item.id || i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-enb-green/10 text-enb-green flex-shrink-0">
              <ENBLeaf size={20} />
            </div>
            <div>
              <div className="font-medium text-enb-text-primary text-sm">{item.description}</div>
              <div className="text-xs text-enb-text-secondary">
                {new Date(item.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="font-bold text-enb-green text-sm">+{(item.enb_amount || 0).toLocaleString()} ENB</div>
            {item.rep_change > 0 && (
              <div className="text-xs text-enb-gold">+{item.rep_change} Rep</div>
            )}
          </div>
        </div>
      ))}
      {transactions.length > 0 && (
        <Link to="/wallet">
          <Button variant="ghost" className="w-full text-sm text-enb-text-secondary hover:text-enb-green">
            View full history →
          </Button>
        </Link>
      )}
    </div>
  );
};

const getTierIcon = (repScore: number) => {
  const tier = getTier(repScore);
  switch (tier) {
    case 'Newcomer': return '🌱';
    case 'Helper': return '🌿';
    case 'Guardian': return '🌳';
    case 'Pillar': return '⭐';
    case 'Founder': return '🏆';
    default: return '🌱';
  }
};

export default function MemberDashboard() {
  const { user } = useUserStore();
  if (!user) return null;
  const tier = getTier(user.rep_score);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">
            Hi, {user.full_name?.split(' ')[0] || user.email} {getTierIcon(user.rep_score)}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-enb-text-secondary font-medium bg-gray-100 px-2 py-0.5 rounded-md">
              {tier} Tier
            </span>
            <span className="text-sm text-enb-text-secondary">•</span>
            <span className="text-sm text-enb-text-secondary font-medium flex items-center gap-1">
              <Star className="w-3 h-3 text-enb-gold fill-current" />
              {user.rep_score} Rep
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-enb-gold">{(user.enb_local_bal || 0).toLocaleString()}</div>
          <div className="text-xs text-enb-text-secondary uppercase tracking-wider font-medium">ENB.LOCAL</div>
        </div>
      </div>

      <ActiveCampaignBanner />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/submit">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200">
            <ENBLeaf size={24} />
            <span className="text-xs font-medium">Submit Action</span>
          </Button>
        </Link>
        <Link to="/directory">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200">
            <MapPin className="w-6 h-6 text-enb-teal" />
            <span className="text-xs font-medium">Find Business</span>
          </Button>
        </Link>
        <Link to="/history">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200">
            <History className="w-6 h-6 text-enb-gold" />
            <span className="text-xs font-medium">My History</span>
          </Button>
        </Link>
      </div>

      <ImpactCounter />
      <RecentActivity />
    </div>
  );
}
