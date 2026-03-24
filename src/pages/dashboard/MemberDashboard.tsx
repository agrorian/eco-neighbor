import React from 'react';
import ENBLeaf from '@/components/ENBLeaf';
import { supabase } from '@/lib/supabase';
import { useT } from '@/contexts/LanguageContext';
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
        <Link to="/impact">
          <Button variant="secondary" size="sm" className="bg-white text-enb-green hover:bg-white/90 border-none">
            View Details <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

interface PublicAction {
  id: string; action_type: string; neighbourhood: string | null;
  enb_earned: number; created_at: string;
}

const ImpactCounter = () => {
  const { l } = useT();
  const [stats, setStats] = React.useState({ actions: 0, enb: 0 });
  const [showModal, setShowModal] = React.useState(false);
  const [modalType, setModalType] = React.useState<'actions' | 'enb'>('actions');
  const [publicActions, setPublicActions] = React.useState<PublicAction[]>([]);
  const [loadingActions, setLoadingActions] = React.useState(false);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: approvedCount } = await supabase
          .from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved');
        const { data: usersData } = await supabase.from('users').select('lifetime_earned');
        const totalEnb = (usersData || []).reduce((sum: number, u: any) => sum + (Number(u.lifetime_earned) || 0), 0);
        setStats({ actions: approvedCount || 0, enb: totalEnb });
      } catch (e) { /* silent */ }
    };
    fetchStats();
  }, []);

  const openModal = async (type: 'actions' | 'enb') => {
    setModalType(type);
    setShowModal(true);
    if (publicActions.length > 0) return;
    setLoadingActions(true);
    const { data } = await supabase
      .from('submissions')
      .select('id, action_type, neighbourhood, enb_earned, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);
    setPublicActions(data || []);
    setLoadingActions(false);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => openModal('actionsl('dashboard', 'verifiedActions')enbl('dashboard', 'enbDistributed')actions' ? `${stats.actions.toLocaleString()} Verified Actions` : `${(stats.enb/1000).toFixed(1)}k ENB Distributed`}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingActions ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-enb-green border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Area</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">ENB</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicActions.map((a, i) => (
                      <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="p-3 capitalize font-medium">{a.action_type?.replace(/_/g,' ') || '—'}</td>
                        <td className="p-3 text-gray-500 text-xs">{a.neighbourhood || 'Chaklala'}</td>
                        <td className="p-3 text-right text-enb-green font-bold">+{(a.enb_earned || 0).toLocaleString()}</td>
                        <td className="p-3 text-right text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString('en-PK', { day:'numeric', month:'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 text-center text-xs text-gray-400">
              Showing most recent 50 — no personal information displayed
            </div>
          </div>
        </div>
      )}
    </>
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
        console.error('Recent activity exception:l('dashboard', 'recentActivity')dashboard', 'noActivity')}
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

export default function MemberDashboard()
  const { l, isUrdu } = useT();  // Urdu wiring {
  const { user, setUser } = useUserStore();

  // Real-time subscription — balance and rep update instantly when DB changes
  React.useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`dashboard-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) setUser({ ...user, ...payload.new });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  if (!user) return null;
  const tier = getTier(user.rep_score);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">
            Hi, {user.full_name?.split(' l('dashboard', 'repScore')dashboard', 'submitActionl('dashboard', 'findBusiness')dashboard', 'myHistory')}</span>
          </Button>
        </Link>
      </div>

      <ImpactCounter />
      <RecentActivity />
    </div>
  );
}
