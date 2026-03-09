import { useState } from 'react';
import { motion } from 'motion/react';
import { Vote, CheckCircle, Clock, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';

const PROPOSALS = [
  { id: 1, title: 'Expand Recycling Centers to North District', status: 'Active', votes: 1240, endsIn: '2 days', description: 'Proposal to allocate 50,000 ENB from the community treasury to set up 3 new recycling hubs.' },
  { id: 2, title: 'Increase Community Cleanup Rewards', status: 'Active', votes: 850, endsIn: '5 days', description: 'Boost ENB rewards for verified cleanup actions by 20% for the next quarter.' },
  { id: 3, title: 'Partner with Local Schools', status: 'Passed', votes: 2100, endsIn: 'Ended', description: 'Launch an educational program in 5 local schools to teach sustainability.' },
];

export default function Governance() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  if (!user) return null;

  const isPillar = ['Pillar', 'Founder'].includes(user.tier);

  return (
    <div className="space-y-6 pb-24">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-enb-text-primary">Governance</h1>
        <p className="text-sm text-enb-text-secondary">Vote on the future of Eco-Neighbor</p>
      </header>

      {/* Voting Power Card */}
      <Card className="bg-gradient-to-r from-enb-text-primary to-gray-800 text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm text-white/70 uppercase tracking-wider font-medium">Your Voting Power</div>
              <div className="text-3xl font-bold mt-1">{user.rep_score} VP</div>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <Vote className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {!isPillar && (
            <div className="bg-white/10 rounded-lg p-3 text-sm flex items-start gap-3">
              <Lock className="w-5 h-5 text-enb-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-enb-gold">Voting Locked</span>
                <p className="text-white/80 text-xs mt-1">
                  Reach <span className="font-bold text-white">Pillar Tier</span> (50,000 Rep) to unlock voting rights. Keep earning Rep!
                </p>
              </div>
            </div>
          )}
          {isPillar && (
             <div className="bg-enb-green/20 rounded-lg p-3 text-sm flex items-center gap-2 text-enb-green font-bold border border-enb-green/30">
               <CheckCircle className="w-4 h-4" />
               You are eligible to vote
             </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'active' ? 'text-enb-green' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Active Proposals
          {activeTab === 'active' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-enb-green" />}
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'past' ? 'text-enb-green' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Past Votes
          {activeTab === 'past' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-enb-green" />}
        </button>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {PROPOSALS.filter(p => activeTab === 'active' ? p.status === 'Active' : p.status !== 'Active').map((proposal) => (
          <Card key={proposal.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${proposal.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {proposal.status}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {proposal.endsIn}
                </div>
              </div>
              
              <h3 className="font-bold text-enb-text-primary mb-2">{proposal.title}</h3>
              <p className="text-sm text-enb-text-secondary mb-4 line-clamp-2">
                {proposal.description}
              </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <div className="text-xs text-gray-500">
                  <span className="font-bold text-enb-text-primary">{proposal.votes}</span> votes cast
                </div>
                {activeTab === 'active' && (
                  <Button size="sm" disabled={!isPillar} className={`${isPillar ? 'bg-enb-text-primary hover:bg-enb-text-primary/90' : 'bg-gray-200 text-gray-400'} text-white`}>
                    Vote Now
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                {activeTab === 'past' && (
                  <Button size="sm" variant="outline">View Results</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {PROPOSALS.filter(p => activeTab === 'active' ? p.status === 'Active' : p.status !== 'Active').length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No {activeTab} proposals found.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 text-sm text-blue-700">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          Governance is currently in Beta. Proposals are submitted by the core team but voted on by the community.
        </p>
      </div>
    </div>
  );
}
