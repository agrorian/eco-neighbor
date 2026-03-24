import React from 'react';
import ENBLeaf from '@/components/ENBLeaf';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Star, MapPin, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore, getTier } from '@/store/user';
import { Link } from 'react-router-dom';

const ActiveCampaignBanner = () => {
  const [campaign, setCampaign] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('name, multiplier, ends_at')
          .eq('is_active', true)
          .order('ends_at', { ascending: true })
          .limit(1);
        if (data && data.length > 0) setCampaign(data[0]);
      } catch (e) { /* silent */ }
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

const ACTION_LABELS: Record<string, string> = {
  neighbourhood_cleanup: 'Neighbourhood Cleanup',
  food_sharing: 'Food Sharing',
  skill_workshop: 'Skill Workshop',
  tree_planting: 'Tree Planting',
  carpool: 'Carpool',
  recycling: 'Recycling',
  mentoring: 'Mentoring',
  verified_trade_job: 'Verified Trade Job',
  community_event: 'Community Event',
  other: 'Community Action',
};
const formatAction = (raw: string) =>
  ACTION_LABELS[raw] || raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const ImpactCounter = () => {
  const [stats, setStats] = React.useState({ actions: 0, enb: 0 });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Step 1: count approved submissions
        const { count: approvedCount } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved');

        // Step 2: sum lifetime_earned from users (most reliable ENB total)
        const { data: usersData } = await supabase.from('users').select('lifetime_earned');
        const totalEnb = (usersData || []).reduce(
          (sum: number, u: any) => sum + (Number(u.lifetime_earned) || 0), 0
        );
        setStats({ actions: approvedCount || 0, enb: totalEnb });
      } catch (e) { /* silent */ }
    };
    fetchStats();
  }, []);

  const [showModal, setShowModal] = React.useState(false);
  const [modalType, setModalType] = React.useState<'actions' | 'enb'>('actions');
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchRows = async () => {
    setLoading(true);
    setRows([]);

    // Step 1: fetch approved submissions — CORRECT column names: enb_awarded, submitted_at
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, user_id, action_type, neighbourhood, enb_awarded, submitted_at')
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false })
      .limit(50);

    if (!submissions || submissions.length === 0) {
      setLoading(false);
      return;
    }

    // Step 2: get first names only — never email, never phone
    const uniqueUserIds = [...new Set(submissions.map((s: any) => s.user_id).filter(Boolean))];
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', uniqueUserIds);

    const nameMap: Record<string, string> = {};
    (usersData || []).forEach((u: any) => {
      nameMap[u.id] = (u.full_name || '').split(' ')[0] || 'Member';
    });

    setRows(submissions.map((s: any) => ({
      ...s,
      first_name: nameMap[s.user_id] || 'Member',
    })));
    setLoading(false);
  };

  const openModal = (type: 'actions' | 'enb') => {
    setModalType(type);
    setShowModal(true);
    fetchRows(); // always fresh fetch — no early-return guard
  };

  const closeModal = () => {
    setShowModal(false);
    setRows([]);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => openModal('actions')} className="text-left w-full">
          <Card className="bg-enb-green/5 border-enb-green/10 hover:border-enb-green/30 transition-colors cursor-pointer min-h-[80px]">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-enb-green mb-1">{stats.actions.toLocaleString()}</div>
              <div className="text-xs text-enb-text-secondary uppercase tracking-wider">Verified Actions</div>
              <div className="text-xs text-enb-green/50 mt-1">tap to view ↗</div>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => openModal('enb')} className="text-left w-full">
          <Card className="bg-enb-gold/5 border-enb-gold/10 hover:border-enb-gold/30 transition-colors cursor-pointer min-h-[80px]">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-enb-gold mb-1">{(stats.enb / 1000).toFixed(1)}k</div>
              <div className="text-xs text-enb-text-secondary uppercase tracking-wider">ENB Distributed</div>
              <div className="text-xs text-enb-gold/50 mt-1">tap to view ↗</div>
            </CardContent>
          </Card>
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-enb-text-primary">
                  {modalType === 'actions'
                    ? `${stats.actions.toLocaleString()} Verified Actions`
                    : `${(stats.enb / 1000).toFixed(1)}k ENB Distributed`}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Community activity · First names only · No private info</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-7 h-7 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">Loading community data...</span>
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No verified actions yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ENB</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a, i) => (
                      <tr key={a.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-enb-green/10 flex items-center justify-center text-[10px] font-bold text-enb-green flex-shrink-0">
                              {a.first_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-enb-text-primary">{a.first_name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-medium text-enb-text-primary">{formatAction(a.action_type || '')}</span>
                          {a.neighbourhood && <div className="text-[10px] text-gray-400 mt-0.5">{a.neighbourhood}</div>}
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-enb-green text-xs">+{(a.enb_awarded || 0).toLocaleString()}</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[10px] text-gray-400">
                            {a.submitted_at
                              ? new Date(a.submitted_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
                              : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-gray-400">Most recent {rows.length} shown</span>
              <span className="text-xs text-gray-300">· First names only · No private info</span>
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
      {loading && <div className="text-sm text-enb-text-secondary text-center py-4">Loading...</div>}
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
            {item.rep_change > 0 && <div className="text-xs text-enb-gold">+{item.rep_change} Rep</div>}
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
    case 'Helper':   return '🌿';
    case 'Guardian': return '🌳';
    case 'Pillar':   return '⭐';
    case 'Founder':  return '🏆';
    default:         return '🌱';
  }
};

export default function MemberDashboard() {
  const { user, setUser } = useUserStore();

  React.useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`dashboard-user-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        (payload) => { if (payload.new) setUser({ ...user, ...payload.new }); }
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
