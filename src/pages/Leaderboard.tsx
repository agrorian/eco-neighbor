import { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/store/user';

const LEADERBOARD_DATA = [
  { rank: 1, name: "Ahmed K.", neighborhood: "Bahria Town", enb: 18500, rep: 9800, actions: 45, avatar: "https://ui-avatars.com/api/?name=AK&background=1A6B3C&color=fff" },
  { rank: 2, name: "Fatima R.", neighborhood: "Chaklala Scheme 3", enb: 15200, rep: 8400, actions: 38, avatar: "https://ui-avatars.com/api/?name=FR&background=2E8B57&color=fff" },
  { rank: 3, name: "Usman T.", neighborhood: "DHA Phase 1", enb: 12800, rep: 7100, actions: 32, avatar: "https://ui-avatars.com/api/?name=UT&background=3CB371&color=fff" },
  { rank: 4, name: "Sana M.", neighborhood: "Soan Garden", enb: 11000, rep: 6500, actions: 28, avatar: "https://ui-avatars.com/api/?name=SM&background=228B22&color=fff" },
  { rank: 5, name: "Bilal H.", neighborhood: "PWD Housing Society", enb: 9500, rep: 5800, actions: 25, avatar: "https://ui-avatars.com/api/?name=BH&background=006400&color=fff" },
  { rank: 6, name: "Zara A.", neighborhood: "Gulrez Housing Society", enb: 8800, rep: 5200, actions: 22, avatar: "https://ui-avatars.com/api/?name=ZA&background=1A6B3C&color=fff" },
  { rank: 7, name: "Hassan N.", neighborhood: "Koral Town", enb: 7500, rep: 4600, actions: 19, avatar: "https://ui-avatars.com/api/?name=HN&background=2E8B57&color=fff" },
  { rank: 8, name: "Ayesha B.", neighborhood: "Naval Anchorage", enb: 6900, rep: 4100, actions: 17, avatar: "https://ui-avatars.com/api/?name=AB&background=3CB371&color=fff" },
  { rank: 9, name: "Omar F.", neighborhood: "Jinnah Garden", enb: 5800, rep: 3500, actions: 14, avatar: "https://ui-avatars.com/api/?name=OF&background=228B22&color=fff" },
  { rank: 10, name: "Nadia S.", neighborhood: "Morgah", enb: 4900, rep: 2900, actions: 12, avatar: "https://ui-avatars.com/api/?name=NS&background=006400&color=fff" },
];

const NEIGHBORHOODS = ['All', 'Bahria Town', 'Chaklala Scheme 3', 'DHA Phase 1', 'Soan Garden', 'PWD Housing Society', 'Gulrez Housing Society', 'Koral Town'];
const METRICS = [
  { id: 'enb', label: 'ENB Earned' },
  { id: 'rep', label: 'Rep Score' },
  { id: 'actions', label: 'Actions' },
];

function Crown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

export default function Leaderboard() {
  const { user } = useUserStore();
  const [metric, setMetric] = useState('enb');
  const [neighborhood, setNeighborhood] = useState('All');

  const filteredData = LEADERBOARD_DATA
    .filter(d => neighborhood === 'All' || d.neighborhood === neighborhood)
    .sort((a, b) => {
      const valA = a[metric as keyof typeof a];
      const valB = b[metric as keyof typeof b];
      if (typeof valA === 'number' && typeof valB === 'number') return valB - valA;
      return 0;
    });

  const userRow = {
    rank: '—',
    name: 'You',
    neighborhood: user?.neighbourhood || 'Your Neighbourhood',
    enb: user?.enb_local_bal ?? 0,
    rep: user?.rep_score ?? 0,
    actions: 0,
  };

  return (
    <div className="space-y-6 pb-24 relative min-h-screen">
      <header className="space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-enb-text-primary">Leaderboard</h1>
          <p className="text-sm text-enb-text-secondary">Top contributors this month</p>
        </div>

        <Card className="bg-gradient-to-r from-enb-gold/20 to-enb-warning/10 border-enb-gold/30 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-enb-gold flex items-center justify-center shadow-lg shadow-enb-gold/30">
            <Crown className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <div className="text-xs font-bold text-enb-gold uppercase tracking-wider">Last Month's Winner</div>
            <div className="font-bold text-enb-text-primary">Ahmed K. (Bahria Town)</div>
            <div className="text-xs text-enb-text-secondary">18,500 ENB Earned</div>
          </div>
        </Card>

        {/* Neighbourhood Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {NEIGHBORHOODS.map(n => (
            <button
              key={n}
              onClick={() => setNeighborhood(n)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                neighborhood === n
                  ? 'bg-enb-text-primary text-white'
                  : 'bg-white border border-gray-200 text-enb-text-secondary hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Metric Toggles */}
        <div className="bg-gray-100 p-1 rounded-xl flex">
          {METRICS.map(m => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                metric === m.id ? 'bg-white text-enb-green shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-3">
        {filteredData.map((entry, index) => (
          <motion.div key={entry.rank} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <div className={`flex items-center p-4 bg-white rounded-xl border ${index < 3 ? 'border-enb-gold/30 shadow-sm' : 'border-gray-100'}`}>
              <div className="w-8 font-bold text-gray-400 text-center">
                {index === 0 ? <Trophy className="w-5 h-5 text-enb-gold mx-auto fill-current" /> :
                 index === 1 ? <Medal className="w-5 h-5 text-gray-400 mx-auto" /> :
                 index === 2 ? <Medal className="w-5 h-5 text-orange-400 mx-auto" /> :
                 entry.rank}
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden mx-3 border border-gray-100">
                <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-enb-text-primary text-sm">{entry.name}</div>
                <div className="text-xs text-enb-text-secondary">{entry.neighborhood}</div>
              </div>
              <div className="text-right font-bold text-enb-green">
                {metric === 'enb' && `${entry.enb.toLocaleString()} ENB`}
                {metric === 'rep' && `${entry.rep.toLocaleString()} Rep`}
                {metric === 'actions' && `${entry.actions} actions`}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sticky User Row */}
      <div className="fixed bottom-20 left-4 right-4 z-20">
        <div className="bg-enb-text-primary text-white p-4 rounded-xl shadow-xl flex items-center border border-gray-700">
          <div className="w-8 font-bold text-gray-400 text-center text-sm">{userRow.rank}</div>
          <div className="w-10 h-10 rounded-full overflow-hidden mx-3 border-2 border-enb-green bg-enb-green/20 flex items-center justify-center text-enb-green font-bold text-sm">
            {(user?.full_name || user?.email || 'Y').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">You</div>
            <div className="text-xs text-gray-400">{userRow.neighborhood}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-enb-green">
              {metric === 'enb' && `${userRow.enb.toLocaleString()} ENB`}
              {metric === 'rep' && `${userRow.rep.toLocaleString()} Rep`}
              {metric === 'actions' && `${userRow.actions} actions`}
            </div>
            <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
              <ArrowUp className="w-3 h-3 text-enb-green" />
              Keep going!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
