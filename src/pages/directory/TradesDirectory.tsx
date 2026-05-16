import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map as MapIcon, List, Loader2, ArrowLeft, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { TRADE_PROFESSION_LIST, TRADE_PROFESSIONS } from '@/lib/constants';

// ── Trade type emoji map — visual-first, no text needed ──────────────────────
export const TRADE_EMOJI: Record<string, string> = {
  plumbing:         '🔧',
  electrical:       '⚡',
  carpentry:        '🪚',
  masonry:          '🧱',
  painting:         '🎨',
  welding:          '🔥',
  auto_repair:      '🚗',
  appliance_repair: '🔌',
  general:          '🛠️',
};

export const TRADE_LABEL: Record<string, string> = {
  plumbing:         'Plumber',
  electrical:       'Electrician',
  carpentry:        'Carpenter',
  masonry:          'Mason',
  painting:         'Painter',
  welding:          'Welder',
  auto_repair:      'Auto Repair',
  appliance_repair: 'Appliance Repair',
  general:          'General Trade',
};

const TRADE_LABEL_UR: Record<string, string> = {
  plumbing:         'پلمبر',
  electrical:       'الیکٹریشن',
  carpentry:        'بڑھئی',
  masonry:          'مستری',
  painting:         'پینٹر',
  welding:          'ویلڈر',
  auto_repair:      'گاڑی مکینک',
  appliance_repair: 'آلات مرمت',
  general:          'عام کاریگر',
};

const AVAILABILITY_CONFIG = {
  available_now: { label: 'Available Now', labelUr: 'ابھی دستیاب', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  busy:          { label: 'Busy',          labelUr: 'مصروف',       color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  not_set:       { label: '',              labelUr: '',             color: '',                             dot: '' },
};

interface Tradesperson {
  id: string;
  full_name: string;
  profile_pic_url: string | null;
  neighbourhood: string | null;
  city: string | null;
  trade_types: string[];
  total_verified_jobs: number;
  avg_job_rating: number;
  total_job_ratings: number;
  trade_availability: string;
  trade_availability_until: string | null;
  cnic_verified: boolean;
  joined_at: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
}

// ── Leaflet map ───────────────────────────────────────────────────────────────
function TradesMap({ people, onSelect }: { people: Tradesperson[]; onSelect: (id: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current || mapInstanceRef.current) return;
      const withGps = people.filter(p => p.gps_lat && p.gps_lng);
      const centre: [number, number] = withGps.length > 0
        ? [withGps[0].gps_lat!, withGps[0].gps_lng!]
        : [24.8607, 67.0011]; // Karachi default
      const map = L.map(mapRef.current).setView(centre, 13);
      mapInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      withGps.forEach(p => {
        const emoji = p.trade_types?.[0] ? (TRADE_EMOJI[p.trade_types[0]] || '🛠️') : '🛠️';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:40px;height:40px;background:#1A6B3C;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
          iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24],
        });
        const marker = L.marker([p.gps_lat!, p.gps_lng!], { icon });
        marker.bindPopup(`
          <div style="min-width:160px;font-family:sans-serif;">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${p.full_name}</div>
            <div style="font-size:12px;color:#666;margin-bottom:8px;">${(p.trade_types || []).map((t: string) => TRADE_LABEL[t] || t).join(', ')}</div>
            <button onclick="window._enbSelectTrade('${p.id}')" style="width:100%;background:#1A6B3C;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;">
              View Profile →
            </button>
          </div>
        `, { maxWidth: 200 });
        marker.addTo(map);
      });

      (window as any)._enbSelectTrade = (id: string) => onSelect(id);
      if (withGps.length > 1) {
        const group = L.featureGroup(withGps.map(p => L.marker([p.gps_lat!, p.gps_lng!])));
        map.fitBounds(group.getBounds().pad(0.2));
      }
    };
    document.head.appendChild(script);
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; delete (window as any)._enbSelectTrade; };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: 480, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}
    />
  );
}

// ── Tradesperson card — visual-first ──────────────────────────────────────────
function TradeCard({ person, isUrdu, onClick }: { person: Tradesperson; isUrdu: boolean; onClick: () => void }) {
  const avail = AVAILABILITY_CONFIG[person.trade_availability as keyof typeof AVAILABILITY_CONFIG] || AVAILABILITY_CONFIG.not_set;
  const primaryTrade = person.trade_types?.[0];
  const emoji = primaryTrade ? (TRADE_EMOJI[primaryTrade] || '🛠️') : '🛠️';
  const tradeLabel = primaryTrade
    ? (isUrdu ? (TRADE_LABEL_UR[primaryTrade] || primaryTrade) : (TRADE_LABEL[primaryTrade] || primaryTrade))
    : (isUrdu ? 'کاریگر' : 'Tradesperson');

  const showRating = person.total_job_ratings >= 3;
  const location = person.city || person.neighbourhood?.split(',')[0] || '';
  const initials = (person.full_name || 'T').charAt(0).toUpperCase();

  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="border-gray-100 hover:border-enb-green/30 hover:shadow-md transition-all p-4">
        <div className="flex items-center gap-4">
          {/* Avatar with trade emoji overlay */}
          <div className="relative flex-shrink-0">
            {person.profile_pic_url ? (
              <img src={person.profile_pic_url} alt={person.full_name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-enb-teal/10 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-2xl font-bold text-enb-teal">{initials}</span>
              </div>
            )}
            {/* Trade emoji badge */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-base border border-gray-100">
              {emoji}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-enb-text-primary truncate">{person.full_name}</h3>
                {/* Trade type badge */}
                <span className="inline-block bg-enb-teal/10 text-enb-teal text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5">
                  {emoji} {tradeLabel}
                </span>
              </div>
              {/* Availability dot */}
              {avail.dot && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${avail.color}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${avail.dot} animate-pulse`} />
                  {isUrdu ? avail.labelUr : avail.label}
                </div>
              )}
            </div>

            {/* Stats row — emoji-led for low-literacy */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                ✅ <span className="font-semibold text-enb-text-primary">{person.total_verified_jobs}</span>
                {isUrdu ? 'کام' : 'jobs'}
              </span>
              {showRating && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  ⭐ <span className="font-semibold text-enb-text-primary">{Number(person.avg_job_rating).toFixed(1)}</span>
                  <span className="text-gray-400">({person.total_job_ratings})</span>
                </span>
              )}
              {location && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  📍 {location}
                </span>
              )}
              {person.cnic_verified && (
                <span className="text-xs text-enb-green flex items-center gap-0.5 font-medium">
                  🪪 {isUrdu ? 'تصدیق شدہ' : 'Verified'}
                </span>
              )}
            </div>

            {/* Additional trade types */}
            {(person.trade_types?.length || 0) > 1 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {person.trade_types.slice(1, 4).map(t => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {TRADE_EMOJI[t] || '🛠️'} {isUrdu ? (TRADE_LABEL_UR[t] || t) : (TRADE_LABEL[t] || t)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TradesDirectory() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const isUrdu = false; // TODO: wire to language context

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [people, setPeople] = useState<Tradesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTrade, setFilterTrade] = useState('all');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'jobs' | 'rating' | 'recent'>('jobs');
  const [mapSelected, setMapSelected] = useState<Tradesperson | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      // Show members who either have verified trade jobs OR whose profession is a known trade
      const { data } = await supabase
        .from('users')
        .select('id, full_name, profile_pic_url, neighbourhood, city, profession, trade_types, total_verified_jobs, avg_job_rating, total_job_ratings, trade_availability, trade_availability_until, cnic_verified, joined_at')
        .or(`total_verified_jobs.gt.0,profession.in.(${TRADE_PROFESSION_LIST.map(p => `"${p}"`).join(',')})`)
        .order('total_verified_jobs', { ascending: false });

      if (data) {
        // Enrich trade_types from profession if trade_types is empty
        const enriched = data.map(p => ({
          ...p,
          trade_types: p.trade_types?.length > 0
            ? p.trade_types
            : p.profession && TRADE_PROFESSIONS[p.profession]
              ? [TRADE_PROFESSIONS[p.profession]]
              : [],
        }));
        setPeople(enriched);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // Filter + sort
  const filtered = people.filter(p => {
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTrade !== 'all' && !(p.trade_types || []).includes(filterTrade)) return false;
    if (filterAvailable && p.trade_availability !== 'available_now') return false;
    if (filterMinRating > 0 && p.total_job_ratings < 3) return false;
    if (filterMinRating > 0 && p.avg_job_rating < filterMinRating) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'jobs') return b.total_verified_jobs - a.total_verified_jobs;
    if (sortBy === 'rating') return b.avg_job_rating - a.avg_job_rating;
    return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
  });

  const allTradeTypes = [...new Set(people.flatMap(p => p.trade_types || []))];

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/directory')} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-enb-text-primary">
            🔧 {isUrdu ? 'ہنرمند ڈائریکٹری' : 'Trades Directory'}
          </h1>
          <p className="text-xs text-enb-text-secondary">
            {isUrdu ? 'تصدیق شدہ کاریگر تلاش کریں' : 'Find verified local tradespeople'}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-enb-green' : 'text-gray-400'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-enb-green' : 'text-gray-400'}`}>
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isUrdu ? 'نام سے تلاش کریں...' : 'Search by name...'}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-enb-green bg-white"
        />
      </div>

      {/* Trade type filter — emoji chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterTrade('all')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            filterTrade === 'all' ? 'bg-enb-green text-white' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          🛠️ {isUrdu ? 'سب' : 'All'}
        </button>
        {allTradeTypes.map(t => (
          <button
            key={t}
            onClick={() => setFilterTrade(t === filterTrade ? 'all' : t)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              filterTrade === t ? 'bg-enb-teal text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {TRADE_EMOJI[t] || '🛠️'} {isUrdu ? (TRADE_LABEL_UR[t] || t) : (TRADE_LABEL[t] || t)}
          </button>
        ))}
      </div>

      {/* Quick filters row */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterAvailable(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filterAvailable ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-current" />
          {isUrdu ? 'ابھی دستیاب' : 'Available Now'}
        </button>
        {[3, 4].map(r => (
          <button
            key={r}
            onClick={() => setFilterMinRating(filterMinRating === r ? 0 : r)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterMinRating === r ? 'bg-enb-gold text-white border-enb-gold' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            {'⭐'.repeat(r)}+ {isUrdu ? 'ریٹنگ' : 'rating'}
          </button>
        ))}
        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="ml-auto text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white text-gray-600 focus:outline-none"
        >
          <option value="jobs">{isUrdu ? 'سب سے زیادہ کام' : 'Most jobs'}</option>
          <option value="rating">{isUrdu ? 'بہترین ریٹنگ' : 'Highest rated'}</option>
          <option value="recent">{isUrdu ? 'نئے ممبر' : 'Newest'}</option>
        </select>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-gray-400">
          {filtered.length} {isUrdu ? 'کاریگر ملے' : `tradesperson${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-enb-green" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-enb-text-primary">
            {isUrdu ? 'کوئی نتیجہ نہیں' : 'No tradespeople found'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {isUrdu ? 'فلٹر تبدیل کریں' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filtered.map(p => (
            <TradeCard
              key={p.id}
              person={p}
              isUrdu={isUrdu}
              onClick={() => navigate(`/directory/trades/${p.id}`)}
            />
          ))}
        </div>
      ) : (
        <>
          <TradesMap
            people={filtered}
            onSelect={id => setMapSelected(filtered.find(p => p.id === id) || null)}
          />
          {mapSelected && (
            <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000] p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{TRADE_EMOJI[mapSelected.trade_types?.[0]] || '🛠️'}</div>
                <div className="flex-1">
                  <p className="font-bold text-enb-text-primary">{mapSelected.full_name}</p>
                  <p className="text-xs text-gray-500">{(mapSelected.trade_types || []).map(t => TRADE_LABEL[t]).join(', ')}</p>
                </div>
                <button onClick={() => setMapSelected(null)} className="text-gray-300 text-xl">×</button>
              </div>
              <button
                onClick={() => navigate(`/directory/trades/${mapSelected.id}`)}
                className="w-full mt-3 bg-enb-green text-white text-sm font-semibold py-2.5 rounded-xl"
              >
                {isUrdu ? 'پروفائل دیکھیں ←' : 'View Profile →'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
