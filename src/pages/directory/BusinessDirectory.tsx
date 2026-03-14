import { useState, useEffect } from 'react';
import { Search, Map as MapIcon, List, Star, Tag, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['All', 'Food', 'Trades', 'Health', 'Retail', 'Education', 'Services', 'Other'];

interface Business {
  id: string;
  business_name: string;
  category: string;
  address: string;
  discount_offer: string;
  enb_float: number;
  is_active: boolean;
  is_verified: boolean;
  gps_lat: number | null;
  gps_lng: number | null;
}

export default function BusinessDirectory() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'category'>('name');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('business_partners')
        .select('id, business_name, category, address, discount_offer, enb_float, is_active, is_verified, gps_lat, gps_lng')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('business_name', { ascending: true });
      if (data) setBusinesses(data);
      setLoading(false);
    };
    fetchBusinesses();
  }, []);

  const filtered = businesses.filter(b => {
    const matchesSearch = b.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.business_name.localeCompare(b.business_name);
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    return 0;
  });

  // Build OpenStreetMap embed URL with markers for all businesses that have GPS
  const buildMapUrl = () => {
    const withGps = filtered.filter(b => b.gps_lat && b.gps_lng);
    if (withGps.length === 0) {
      // Default to Rawalpindi centre
      return 'https://www.openstreetmap.org/export/embed.html?bbox=73.0%2C33.5%2C73.2%2C33.7&layer=mapnik';
    }
    // Centre on first business with GPS
    const lat = withGps[0].gps_lat!;
    const lng = withGps[0].gps_lng!;
    const delta = 0.05;
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    // Add markers using OSM marker param
    const markers = withGps.map(b => `mlat=${b.gps_lat}&mlon=${b.gps_lng}`).join('&');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&${markers}`;
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-enb-text-primary">Directory</h1>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-enb-green' : 'text-gray-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-enb-green' : 'text-gray-400'}`}
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-enb-green text-white'
                  : 'bg-white border border-gray-200 text-enb-text-secondary hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-enb-text-secondary">
          <span>{loading ? '...' : `${filtered.length} results`}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-enb-text-primary outline-none"
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-enb-text-secondary bg-gray-50 rounded-xl">
          <MapIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No businesses found.</p>
          <p className="text-sm mt-1">
            {businesses.length === 0
              ? 'No verified partner businesses yet.'
              : 'Try a different search or category.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {filtered.map((business) => (
            <Link to={`/directory/${business.id}`} key={business.id}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow border-gray-100 mb-4">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-enb-green/10 flex items-center justify-center text-enb-green font-bold text-lg flex-shrink-0">
                    {business.business_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-enb-text-primary truncate">{business.business_name}</h3>
                      {business.enb_float > 0 && (
                        <div className="flex items-center gap-1 text-xs font-medium bg-enb-gold/10 text-enb-gold px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                          <Star className="w-3 h-3 fill-current" />
                          Active
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-enb-text-secondary flex items-center gap-1 mt-1">
                      <Tag className="w-3 h-3" />
                      {business.category}
                      {business.address && ` • ${business.address}`}
                    </div>
                    {business.discount_offer && (
                      <span className="inline-block bg-enb-green/10 text-enb-green text-xs font-bold px-2 py-1 rounded-md mt-2">
                        {business.discount_offer}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        // Real OpenStreetMap embed
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '480px' }}>
            <iframe
              title="ENB Partner Map"
              src={buildMapUrl()}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Showing {filtered.filter(b => b.gps_lat && b.gps_lng).length} of {filtered.length} businesses on map.
            {filtered.some(b => !b.gps_lat) && ' Some businesses have no GPS coordinates set.'}
          </p>
          <a
            href={`https://www.openstreetmap.org/#map=14/33.6007/73.0679`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-enb-teal underline"
          >
            Open full map →
          </a>
        </div>
      )}
    </div>
  );
}
