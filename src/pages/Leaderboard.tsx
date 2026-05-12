import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { useT } from '@/contexts/LanguageContext';

const METRICS = [
  { id: 'enb_local_bal', labelKey: 'enbEarned' },
  { id: 'rep_score',     labelKey: 'repScore'  },
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
  city: string;
  enb_local_bal: number;
  rep_score: number;
  tier: string;
}

export default function Leaderboard() {
  const { l } = useT();
  const { user } = useUserStore();
  const [metric, setMetric]           = useState('enb_local_bal');
  const [city, setCity]               = useState('All');
  const [cities, setCities]           = useState<string[]>([]);
  const [data, setData]               = useState<LeaderEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [userRank, setUserRank]       = useState<number | null>(null);

  // Fetch distinct cities from DB once on mount
  useEffect(() => {
    const fetchCities = async () => {
      setCitiesLoading(true);
      const { data: rows } = await supabase
        .from('users')
        .select('city')
        .eq('is_active', true)
        .not('city', 'is', null);

      if (rows) {
        const unique = Array.from(
          new Set(rows.map((r: any) => r.city).filter(Boolean))
        ).sort() as string[];
        setCities(unique);
      }
      setCitiesLoading(false);
    };
    fetchCities();
  }, []);

  // Fetch leaderboard whenever metric or city changes
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      let query = supabase
        .from('users')
        .select('id, full_name, neighbourhood, city, enb_local_bal, rep_score, tier')
        .eq('is_active', true)
        .order(metric as any, { ascending: false })
        .limit(50);

      if (city !== 'All') {
        query = query.eq('city', city);
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
  }, [metric, city, user?.id]);

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

  // Location label shown under each leaderboard entry
  // Show neighbourhood if available, otherwise city, otherwise —
  const locationLabel = (entry: LeaderEntry) => {
    if (entry.neighbourhood) return entry.neighbourhood;
    if (entry.city) return entry.city;
    return '—';
  };

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">{l('leaderboard', 'title')}</h1>
        <p className="text-sm text-enb-text-secondary mt-1">{l('leaderboard', 'subtitle')}</p>
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
            {l('leaderboard', m.labelKey as any)}
          </button>
        ))}
      </div>

      {/* City Filter — dynamic from DB */}
      <div className="overflow-x-auto -mx-6 px-6">
        {citiesLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-20 bg-gray-100 rounded-full animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
            {['All', ...cities].map(c => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                  city === c
                    ? 'bg-enb-green text-white border-enb-green'
                    : 'bg-white text-enb-text-secondary border-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* City context label */}
      {city !== 'All' && !loading && data.length > 0 && (
        <p className="text-xs text-enb-text-secondary -mt-2">
          Showing top {data.length} members in <span className="font-semibold text-enb-green">{city}</span>
        </p>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-enb-text-secondary">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm">{l('leaderboard', 'noData')}</p>
            {city !== 'All' && (
              <p className="text-xs mt-2 text-gray-400">
                No members in {city} yet.{' '}
                <button className="text-enb-green underline" onClick={() => setCity('All')}>
                  View all cities
                </button>
              </p>
            )}
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
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <Card className={`border ${isCurrentUser ? 'border-enb-teal bg-enb-teal/5' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
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
                      <div className="text-xs text-enb-text-secondary truncate">{locationLabel(entry)}</div>
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

      {/* Current user rank if outside top 50 */}
      {user && userRank === null && !loading && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-center text-enb-text-secondary">
            You are not in the top 50 yet. Keep submitting actions to climb the ranks!
          </p>
        </div>
      )}
    </div>
  );
}
