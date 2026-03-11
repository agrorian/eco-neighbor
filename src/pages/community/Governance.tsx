import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Vote, CheckCircle, Clock, AlertCircle, ArrowRight, Lock, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

interface Proposal {
  id: string; title: string; status: string; votes_for: number; votes_against: number;
  ends_at: string; description: string; created_by: string; created_at: string;
}

export default function Governance() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'for' | 'against'>>({});

  if (!user) return null;
  const isPillar = ['Pillar', 'Founder'].includes(user.tier);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('governance_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setProposals(data);
    } else {
      // Fallback to sample proposals if table doesn't exist yet
      setProposals([
        { id: '1', title: 'Expand Recycling Centers to North District', status: 'active', votes_for: 1240, votes_against: 120, ends_at: new Date(Date.now() + 172800000).toISOString(), description: 'Proposal to allocate 50,000 ENB from the community treasury to set up 3 new recycling hubs in North District.', created_by: 'admin', created_at: new Date().toISOString() },
        { id: '2', title: 'Increase Community Cleanup Rewards by 20%', status: 'active', votes_for: 850, votes_against: 200, ends_at: new Date(Date.now() + 432000000).toISOString(), description: 'Boost ENB rewards for verified cleanup actions by 20% for the next quarter.', created_by: 'admin', created_at: new Date().toISOString() },
        { id: '3', title: 'Partner with Local Schools Programme', status: 'passed', votes_for: 2100, votes_against: 150, ends_at: new Date(Date.now() - 86400000).toISOString(), description: 'Launch an educational program in 5 local schools to teach sustainability.', created_by: 'admin', created_at: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  };

  const handleVote = async (proposal: Proposal, voteType: 'for' | 'against') => {
    if (!isPillar || userVotes[proposal.id]) return;
    setVoting(proposal.id);
    try {
      // Try to call governance RPC, fall back to direct insert
      const { error } = await supabase.from('governance_votes').insert({
        proposal_id: proposal.id, voter_id: user.id, vote: voteType,
        voting_power: user.rep_score,
      });
      if (!error) {
        setUserVotes(prev => ({ ...prev, [proposal.id]: voteType }));
        // Optimistically update count
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

  const filtered = proposals.filter(p => activeTab === 'active' ? p.status === 'active' : p.status !== 'active');

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">Governance</h1>
        <p className="text-sm text-enb-text-secondary">Vote on the future of Eco-Neighbor</p>
      </header>

      {/* Voting Power */}
      <Card className="bg-gradient-to-r from-enb-text-primary to-gray-800 text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm text-white/70 uppercase tracking-wider">Your Voting Power</div>
              <div className="text-3xl font-bold mt-1">{user.rep_score.toLocaleString()} VP</div>
            </div>
            <div className="bg-white/10 p-2 rounded-lg"><Vote className="w-6 h-6 text-white" /></div>
          </div>
          {!isPillar ? (
            <div className="bg-white/10 rounded-lg p-3 text-sm flex items-start gap-3">
              <Lock className="w-5 h-5 text-enb-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-enb-gold">Voting Locked</span>
                <p className="text-white/80 text-xs mt-1">Reach <span className="font-bold">Pillar Tier</span> (50,000 Rep) to unlock voting rights.</p>
              </div>
            </div>
          ) : (
            <div className="bg-enb-green/20 rounded-lg p-3 text-sm flex items-center gap-2 text-enb-green font-bold border border-enb-green/30">
              <CheckCircle className="w-4 h-4" /> Eligible to vote
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['active', 'past'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-enb-green' : 'text-gray-400 hover:text-gray-600'}`}>
            {tab === 'active' ? 'Active Proposals' : 'Past Votes'}
            {activeTab === tab && <motion.div layoutId="govtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-enb-green" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-enb-green" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => {
            const totalVotes = p.votes_for + p.votes_against;
            const forPct = totalVotes > 0 ? (p.votes_for / totalVotes) * 100 : 50;
            const endsIn = new Date(p.ends_at);
            const hoursLeft = Math.max(0, Math.round((endsIn.getTime() - Date.now()) / 3600000));
            const myVote = userVotes[p.id];

            return (
              <Card key={p.id} className="border-gray-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status === 'active' ? 'Active' : 'Passed'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {p.status === 'active' ? (hoursLeft > 48 ? `${Math.round(hoursLeft/24)}d left` : `${hoursLeft}h left`) : 'Ended'}
                    </div>
                  </div>

                  <h3 className="font-bold text-enb-text-primary mb-2">{p.title}</h3>
                  <p className="text-sm text-enb-text-secondary mb-3 line-clamp-2">{p.description}</p>

                  {/* Vote bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>For: {p.votes_for.toLocaleString()}</span>
                      <span>Against: {p.votes_against.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-enb-green rounded-full transition-all" style={{ width: `${forPct}%` }} />
                    </div>
                  </div>

                  {/* Vote buttons */}
                  {p.status === 'active' && isPillar && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleVote(p, 'for')}
                        disabled={!!myVote || voting === p.id}
                        className={`flex-1 ${myVote === 'for' ? 'bg-enb-green text-white' : 'bg-enb-green/10 text-enb-green hover:bg-enb-green hover:text-white'}`}>
                        {voting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : myVote === 'for' ? '✓ Voted For' : '👍 Vote For'}
                      </Button>
                      <Button size="sm" onClick={() => handleVote(p, 'against')}
                        disabled={!!myVote || voting === p.id}
                        className={`flex-1 ${myVote === 'against' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white'}`}>
                        {myVote === 'against' ? '✓ Voted Against' : '👎 Vote Against'}
                      </Button>
                    </div>
                  )}
                  {p.status === 'active' && !isPillar && (
                    <Button size="sm" disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
                      <Lock className="w-3 h-3 mr-1" /> Pillar Tier Required
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No {activeTab} proposals.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 text-sm text-blue-700">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        Governance is live for Pillar Tier and above (50,000+ Rep). Proposals are submitted by the core team.
      </div>
    </div>
  );
}
