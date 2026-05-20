import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Vote, CheckCircle, Clock, AlertCircle, Lock, Loader2, TrendingUp, Plus, Zap, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore, isSuperAdmin as checkSuperAdmin } from '@/store/user';
import { useT } from '@/contexts/LanguageContext';
import { supabase, getDb } from '@/lib/supabase';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposal_type: string;
  status: string;
  min_tier_to_vote: string;
  votes_for: number;
  votes_against: number;
  quorum_required: number;
  voting_ends_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

const PROPOSAL_TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  earn_rate_change:        { label: 'Earn Rate',        color: 'text-enb-green',  bg: 'bg-enb-green/10',  icon: TrendingUp },
  new_action_type:         { label: 'New Action',       color: 'text-blue-600',   bg: 'bg-blue-50',        icon: Plus },
  partner_onboarding:      { label: 'New Partner',      color: 'text-enb-teal',   bg: 'bg-enb-teal/10',   icon: Users },
  cgr_milestone_adjustment:{ label: 'CGR Milestone',    color: 'text-purple-600', bg: 'bg-purple-50',      icon: Zap },
  emergency_reserve_usage: { label: 'Emergency Reserve',color: 'text-red-600',    bg: 'bg-red-50',         icon: Shield },
  general:                 { label: 'General',          color: 'text-gray-600',   bg: 'bg-gray-100',       icon: Vote },
};

const TIER_ORDER = ['Newcomer', 'Helper', 'Guardian', 'Pillar', 'Founder Tier'];

export default function Governance() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'for' | 'against'>>({});

  if (!user) return null;

  const userTierIndex = TIER_ORDER.indexOf(user.tier);
  const { l } = useT();
  const isPillarOrAbove = userTierIndex >= TIER_ORDER.indexOf('Pillar');
  const isAdminOrFounder = checkSuperAdmin(user.role) || user.role === 'founder';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '', description: '', proposal_type: 'general',
    min_tier_to_vote: 'Pillar', quorum_required: 10,
    voting_days: 7,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchProposals();
    fetchUserVotes();
  }, []);

  const handleCreateProposal = async () => {
    if (!newProposal.title.trim() || !newProposal.description.trim()) {
      setCreateError('Title and description are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + newProposal.voting_days);
    const { error } = await getDb().from('governance_proposals').insert({
      title: newProposal.title.trim(),
      description: newProposal.description.trim(),
      proposal_type: newProposal.proposal_type,
      status: 'active',
      min_tier_to_vote: newProposal.min_tier_to_vote,
      quorum_required: newProposal.quorum_required,
      votes_for: 0,
      votes_against: 0,
      voting_ends_at: endsAt.toISOString(),
    });
    setCreating(false);
    if (error) { setCreateError(error.message); return; }
    setShowCreateModal(false);
    setNewProposal({ title: '', description: '', proposal_type: 'general', min_tier_to_vote: 'Pillar', quorum_required: 10, voting_days: 7 });
    fetchProposals();
  };

  const fetchProposals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('governance_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setProposals(data);
    }
    setLoading(false);
  };

  const fetchUserVotes = async () => {
    const { data } = await supabase
      .from('governance_votes')
      .select('proposal_id, vote')
      .eq('user_id', user.id);
    if (data) {
      const votes: Record<string, 'for' | 'against'> = {};
      data.forEach((v: any) => { votes[v.proposal_id] = v.vote; });
      setUserVotes(votes);
    }
  };

  const canVoteOnProposal = (proposal: Proposal) => {
    const requiredIndex = TIER_ORDER.indexOf(proposal.min_tier_to_vote);
    return userTierIndex >= requiredIndex;
  };

  const handleVote = async (proposal: Proposal, voteType: 'for' | 'against') => {
    if (!canVoteOnProposal(proposal) || userVotes[proposal.id]) return;
    setVoting(proposal.id);
    try {
      const { error } = await getDb().from('governance_votes').insert({
        proposal_id: proposal.id,
        user_id: user.id,
        vote: voteType,
      });
      if (!error) {
        setUserVotes(prev => ({ ...prev, [proposal.id]: voteType }));
        // Update vote counts via RPC or optimistically
        await getDb().from('governance_proposals').update({
          votes_for: proposal.votes_for + (voteType === 'for' ? 1 : 0),
          votes_against: proposal.votes_against + (voteType === 'against' ? 1 : 0),
        }).eq('id', proposal.id);
        setProposals(prev => prev.map(p => p.id === proposal.id
          ? { ...p, votes_for: p.votes_for + (voteType === 'for' ? 1 : 0), votes_against: p.votes_against + (voteType === 'against' ? 1 : 0) }
          : p));
      }
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setVoting(null);
    }
  };

  const filtered = proposals.filter(p =>
    activeTab === 'active' ? p.status === 'active' : p.status !== 'active'
  );

  const activeCount = proposals.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">{l('governance', 'title')}</h1>
        <p className="text-sm text-enb-text-secondary mt-1">{l('governance', 'subtitle')}</p>
      </header>

      {/* Voting Power Card */}
      <Card className="bg-gradient-to-r from-enb-text-primary to-gray-800 text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs text-white/60 uppercase tracking-wider mb-1">Your Reputation Score</div>
              <div className="text-3xl font-bold">{user.rep_score.toLocaleString()}</div>
              <div className="text-xs text-white/60 mt-1">Tier: <span className="text-enb-gold font-bold">{user.tier}</span></div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <Vote className="w-6 h-6 text-white" />
            </div>
          </div>

          {!isPillarOrAbove ? (
            <div className="bg-white/10 rounded-xl p-3 text-sm flex items-start gap-3">
              <Lock className="w-5 h-5 text-enb-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-enb-gold">{l('governance', 'locked')}</span>
                <p className="text-white/70 text-xs mt-1">
                  Reach <span className="font-bold text-white">Pillar Tier</span> (50,000 Rep) to unlock voting on standard proposals.
                  Emergency Reserve proposals require Pillar tier minimum.
                </p>
                <div className="mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-enb-gold rounded-full transition-all"
                    style={{ width: `${Math.min(100, (user.rep_score / 50000) * 100)}%` }}
                  />
                </div>
                <p className="text-white/50 text-xs mt-1">{user.rep_score.toLocaleString()} / 50,000</p>
              </div>
            </div>
          ) : (
            <div className="bg-enb-green/20 rounded-xl p-3 text-sm flex items-center gap-2 text-enb-green font-bold border border-enb-green/30">
              <CheckCircle className="w-4 h-4" /> Eligible to vote · {activeCount} active proposal{activeCount !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Proposal button — admin only */}
      {isAdminOrFounder && (
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-enb-green hover:bg-enb-green/90 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Proposal
        </Button>
      )}

      {/* How Governance Works */}
      <Card className="border-gray-100 shadow-sm bg-enb-green/5">
        <CardContent className="p-4">
          <h3 className="font-bold text-enb-text-primary text-sm mb-3">{l('governance', 'howItWorks')}</h3>
          <div className="space-y-2">
            {[
              { tier: '🌱 ' + l('tiers', 'Newcomer'), desc: l('governance', 'tierNewcomer'), color: 'text-gray-500' },
              { tier: '🌿 ' + l('tiers', 'Helper'), desc: l('governance', 'tierHelper'), color: 'text-enb-teal' },
              { tier: '🌳 ' + l('tiers', 'Guardian'), desc: l('governance', 'tierGuardian'), color: 'text-blue-600' },
              { tier: '⭐ ' + l('tiers', 'Pillar'), desc: l('governance', 'tierPillar'), color: 'text-enb-green' },
              { tier: '🏆 ' + l('tiers', 'Founder') + ' Tier', desc: l('governance', 'tierFounder'), color: 'text-enb-gold' },
            ].map((row, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`font-bold min-w-[80px] ${row.color}`}>{row.tier}</span>
                <span className="text-enb-text-secondary">{row.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
            {l('governance', 'info')}
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['active', 'past'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-enb-green' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab === 'active' ? `${l('governance', 'activeProposals')}${activeCount > 0 ? ` (${activeCount})` : ''}` : l('governance', 'pastVotes')}
            {activeTab === tab && (
              <motion.div layoutId="govtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-enb-green" />
            )}
          </button>
        ))}
      </div>

      {/* Proposals */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p, i) => {
            const totalVotes = p.votes_for + p.votes_against;
            const forPct = totalVotes > 0 ? (p.votes_for / totalVotes) * 100 : 50;
            const quorumPct = Math.min(100, (totalVotes / p.quorum_required) * 100);
            const quorumMet = totalVotes >= p.quorum_required;
            const endsAt = new Date(p.voting_ends_at);
            const hoursLeft = Math.max(0, Math.round((endsAt.getTime() - Date.now()) / 3600000));
            const myVote = userVotes[p.id];
            const canVote = canVoteOnProposal(p);
            const typeMeta = PROPOSAL_TYPE_META[p.proposal_type] || PROPOSAL_TYPE_META.general;
            const TypeIcon = typeMeta.icon;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-gray-100 shadow-sm">
                  <CardContent className="p-5">
                    {/* Header row */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${typeMeta.bg} ${typeMeta.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeMeta.label}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'active' ? 'bg-green-100 text-green-700' :
                          p.status === 'passed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {p.status === 'active' ? 'Active' : p.status === 'passed' ? 'Passed' : 'Rejected'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 ml-2">
                        <Clock className="w-3 h-3" />
                        {p.status === 'active'
                          ? (hoursLeft > 48 ? `${Math.round(hoursLeft / 24)}d left` : `${hoursLeft}h left`)
                          : 'Ended'}
                      </div>
                    </div>

                    <h3 className="font-bold text-enb-text-primary mb-2">{p.title}</h3>
                    <p className="text-sm text-enb-text-secondary mb-4 line-clamp-3">{p.description}</p>

                    {/* Vote bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="text-enb-green font-medium">👍 {p.votes_for} For</span>
                        <span className="text-red-500 font-medium">👎 {p.votes_against} Against</span>
                      </div>
                      <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-enb-green rounded-full transition-all"
                          style={{ width: `${forPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Quorum tracker */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Quorum: {totalVotes}/{p.quorum_required} votes</span>
                        <span className={quorumMet ? 'text-enb-green font-bold' : 'text-gray-400'}>
                          {quorumMet ? '✓ Met' : `${p.quorum_required - totalVotes} more needed`}
                        </span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${quorumMet ? 'bg-enb-green' : 'bg-enb-gold'}`}
                          style={{ width: `${quorumPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Required tier */}
                    <div className="text-xs text-gray-400 mb-3">
                      Min. tier to vote: <span className="font-bold text-gray-600">{p.min_tier_to_vote}</span>
                    </div>

                    {/* Vote buttons */}
                    {p.status === 'active' && (
                      <>
                        {myVote ? (
                          <div className={`text-center text-sm font-bold py-2 rounded-xl ${myVote === 'for' ? 'bg-enb-green/10 text-enb-green' : 'bg-red-50 text-red-500'}`}>
                            {myVote === 'for' ? '✓ You voted For' : '✓ You voted Against'}
                          </div>
                        ) : canVote ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVote(p, 'for')}
                              disabled={voting === p.id}
                              className="flex-1 bg-enb-green/10 text-enb-green hover:bg-enb-green hover:text-white font-bold"
                            >
                              {voting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '👍 Vote For'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleVote(p, 'against')}
                              disabled={voting === p.id}
                              className="flex-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold"
                            >
                              👎 Vote Against
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                            <Lock className="w-4 h-4 shrink-0" />
                            <span>Requires <strong>{p.min_tier_to_vote}</strong> tier to vote on this proposal</span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No {activeTab} proposals</p>
              <p className="text-xs mt-1">Check back soon — proposals are submitted by the founding team.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Proposal Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); setCreateError(''); }}>
        <DialogContent className="max-w-md">
          <div className="space-y-4 p-2">
            <div>
              <h3 className="font-bold text-enb-text-primary text-lg">Create New Proposal</h3>
              <p className="text-xs text-gray-500 mt-1">Proposals are visible to all members. Voting rights depend on tier.</p>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{createError}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title *</label>
                <Input
                  value={newProposal.title}
                  onChange={(e) => setNewProposal(p => ({ ...p, title: e.target.value }))}
                  placeholder="Short, clear proposal title"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description *</label>
                <textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal(p => ({ ...p, description: e.target.value }))}
                  placeholder="Full description of what is being proposed and why..."
                  rows={4}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-enb-green/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
                  <select
                    value={newProposal.proposal_type}
                    onChange={(e) => setNewProposal(p => ({ ...p, proposal_type: e.target.value }))}
                    className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-enb-green/30"
                  >
                    <option value="general">General</option>
                    <option value="earn_rate_change">Earn Rate Change</option>
                    <option value="new_action_type">New Action Type</option>
                    <option value="partner_onboarding">New Partner</option>
                    <option value="cgr_milestone_adjustment">CGR Milestone</option>
                    <option value="emergency_reserve_usage">Emergency Reserve</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Min Tier to Vote</label>
                  <select
                    value={newProposal.min_tier_to_vote}
                    onChange={(e) => setNewProposal(p => ({ ...p, min_tier_to_vote: e.target.value }))}
                    className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-enb-green/30"
                  >
                    <option value="Pillar">Pillar (50,000+ Rep)</option>
                    <option value="Founder Tier">Founder Tier (100,000+ Rep)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quorum (votes needed)</label>
                  <Input
                    type="number"
                    min={1}
                    value={newProposal.quorum_required}
                    onChange={(e) => setNewProposal(p => ({ ...p, quorum_required: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Voting Period (days)</label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={newProposal.voting_days}
                    onChange={(e) => setNewProposal(p => ({ ...p, voting_days: parseInt(e.target.value) || 7 }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleCreateProposal}
                disabled={creating || !newProposal.title.trim() || !newProposal.description.trim()}
                className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white"
              >
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Proposal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
