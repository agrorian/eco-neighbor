import { useState, useEffect, useRef } from 'react';
import { Search, Map as MapIcon, List, Star, Tag, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
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

// Leaflet map component — loaded dynamically to avoid SSR issues
function LeafletMap({ businesses, onSelect }: { businesses: Business[]; onSelect: (id: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Dynamically load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const withGps = businesses.filter(b => b.gps_lat && b.gps_lng);
      const centre: [number, number] = withGps.length > 0
        ? [withGps[0].gps_lat!, withGps[0].gps_lng!]
        : [33.6007, 73.0679]; // Rawalpindi default

      const map = L.map(mapRef.current).setView(centre, 14);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom green marker icon
      const greenIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 32px; height: 32px;
          background: #1A6B3C;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      withGps.forEach(b => {
        const marker = L.marker([b.gps_lat!, b.gps_lng!], { icon: greenIcon });

        const popupHtml = `
          <div style="min-width:180px; font-family: sans-serif;">
            <div style="font-weight:700; font-size:14px; color:#1a1a1a; margin-bottom:4px;">
              ${b.business_name}
            </div>
            <div style="font-size:12px; color:#666; margin-bottom:4px;">
              ${b.category}${b.address ? ' · ' + b.address : ''}
            </div>
            ${b.discount_offer ? `<div style="background:#f0fdf4; color:#1A6B3C; font-size:12px; font-weight:600; padding:4px 8px; border-radius:6px; margin-bottom:8px;">${b.discount_offer}</div>` : ''}
            <button
              onclick="window._enbSelectBusiness('${b.id}')"
              style="width:100%; background:#1A6B3C; color:white; border:none; border-radius:8px; padding:6px 12px; font-size:13px; font-weight:600; cursor:pointer;"
            >
              View Business →
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 240 });
        marker.addTo(map);
      });

      // Global callback for popup button clicks
      (window as any)._enbSelectBusiness = (id: string) => {
        onSelect(id);
      };

      // Fit map to all markers if more than one
      if (withGps.length > 1) {
        const group = L.featureGroup(
          withGps.map(b => L.marker([b.gps_lat!, b.gps_lng!]))
        );
        map.fitBounds(group.getBounds().pad(0.2));
      }
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      delete (window as any)._enbSelectBusiness;
    };
  }, []);

  const withGps = businesses.filter(b => b.gps_lat && b.gps_lng);

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        style={{ height: '480px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}
      />
      <p className="text-xs text-gray-400 text-center">
        {withGps.length} of {businesses.length} businesses have GPS coordinates. Click a pin to view details.
        {businesses.some(b => !b.gps_lat) && ' Businesses without GPS do not appear on the map.'}
      </p>
    </div>
  );
}

export default function BusinessDirectory() {
  const navigate = useNavigate();
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
        <LeafletMap
          businesses={filtered}
          onSelect={(id) => navigate(`/directory/${id}`)}
        />
      )}
    </div>
  );
}
