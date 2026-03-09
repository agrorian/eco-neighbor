import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';

const NEIGHBOURHOODS = ['All', 'Bahria Town', 'Chaklala Scheme 3', 'DHA Phase 1', 'Soan Garden', 'PWD Housing Society', 'Gulrez Housing Society', 'Koral Town'];
const METRICS = [
  { id: 'enb_local_bal', label: 'ENB Earned' },
  { id: 'rep_score', label: 'Rep Score' },
];

function Crown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

interface LeaderEntry {
  id: string;
  full_name: string;
  neighbourhood: string;
  enb_local_bal: number;
  rep_score: number;
  tier: string;
}

export default function Leaderboard() {
  const { user } = useUserStore();
  const [metric, setMetric] = useState('enb_local_bal');
  const [neighbourhood, setNeighbourhood] = useState('All');
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      let query = supabase
        .from('users')
        .select('id, full_name, neighbourhood, enb_local_bal, rep_score, tier')
        .eq('is_active', true)
        .order(metric as any, { ascending: false })
        .limit(10);

      if (neighbourhood !== 'All') {
        query = query.eq('neighbourhood', neighbourhood);
      }

      const { data: rows } = await query;
      if (rows) {
        setData(rows);
        if (user) {
          const rank = rows.findIndex(r => r.id === user.id);
          setUserRank(rank >= 0 ? rank + 1 : null);
        }
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, [metric, neighbourhood, user?.id]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />;
    if (rank === 2) return <Trophy className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-4 h-4 text-amber-600" />;
    return <span className="text-sm font-bold text-enb-text-secondary">{rank}</span>;
  };

  const displayValue = (entry: LeaderEntry) => {
    if (metric === 'enb_local_bal') return `${(entry.enb_local_bal || 0).toLocaleString()} ENB`;
    return `${(entry.rep_score || 0).toLocaleString()} Rep`;
  };

  const anonymiseName = (name: string) => {
    if (!name) return 'Member';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  };

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">Leaderboard</h1>
        <p className="text-sm text-enb-text-secondary mt-1">Top contributors this month</p>
      </header>

      {/* Metric Toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {METRICS.map(m => (
          <button
            key={m.id}
            onClick={() => setMetric(m.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              metric === m.id ? 'bg-white text-enb-green shadow-sm' : 'text-enb-text-secondary'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Neighbourhood Filter */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
          {NEIGHBOURHOODS.map(n => (
            <button
              key={n}
              onClick={() => setNeighbourhood(n)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                neighbourhood === n
                  ? 'bg-enb-green text-white border-enb-green'
                  : 'bg-white text-enb-text-secondary border-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-enb-text-secondary">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm">No data yet for this filter.</p>
          </div>
        ) : (
          data.map((entry, i) => {
            const rank = i + 1;
            const isCurrentUser = entry.id === user?.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={`border ${isCurrentUser ? 'border-enb-teal bg-enb-teal/5' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-enb-green text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {(entry.full_name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-enb-text-primary truncate">
                        {anonymiseName(entry.full_name || 'Member')}
                        {isCurrentUser && <span className="ml-2 text-xs text-enb-teal font-bold">(You)</span>}
                      </div>
                      <div className="text-xs text-enb-text-secondary truncate">{entry.neighbourhood || '—'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-enb-gold text-sm">{displayValue(entry)}</div>
                      <div className="text-xs text-enb-text-secondary">{entry.tier || 'Newcomer'}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Current user rank if outside top 10 */}
      {user && userRank === null && !loading && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-center text-enb-text-secondary">
            You are not in the top 10 yet. Keep submitting actions to climb the ranks!
          </p>
        </div>
      )}
    </div>
  );
}
