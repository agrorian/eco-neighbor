import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Map as MapIcon, List, Filter, Star, MapPin, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

// Mock Data
const BUSINESSES = [
  { id: 1, name: 'Green Leaf Cafe', category: 'Food', discount: '10% Off', rep: 95, distance: '0.2 km', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop' },
  { id: 2, name: 'Eco Fix-It', category: 'Trades', discount: '5% Off Labor', rep: 88, distance: '1.5 km', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?q=80&w=1000&auto=format&fit=crop' },
  { id: 3, name: 'Nature\'s Pantry', category: 'Retail', discount: 'Free Bag', rep: 92, distance: '0.8 km', image: 'https://images.unsplash.com/photo-1604719312566-b76d4685332e?q=80&w=1000&auto=format&fit=crop' },
  { id: 4, name: 'Wellness Yoga', category: 'Health', discount: 'First Class Free', rep: 98, distance: '2.1 km', image: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=1000&auto=format&fit=crop' },
  { id: 5, name: 'Re-Cycle Shop', category: 'Retail', discount: '15% Off Used', rep: 85, distance: '3.0 km', image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1000&auto=format&fit=crop' },
];

const CATEGORIES = ['All', 'Food', 'Trades', 'Health', 'Retail', 'Education'];

export default function BusinessDirectory() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'distance' | 'discount' | 'rep'>('distance');

  const filteredBusinesses = BUSINESSES.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
    if (sortBy === 'rep') return b.rep - a.rep;
    return 0; // Simplified discount sort
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
          <span>{filteredBusinesses.length} results</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-enb-text-primary outline-none"
            >
              <option value="distance">Distance</option>
              <option value="rep">Reputation</option>
              <option value="discount">Discount</option>
            </select>
          </div>
        </div>
      </header>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredBusinesses.map((business) => (
            <Link to={`/directory/${business.id}`} key={business.id}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow border-gray-100 mb-4">
                <div className="flex h-32">
                  <div className="w-32 shrink-0">
                    <img src={business.image} alt={business.name} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-enb-text-primary truncate">{business.name}</h3>
                        <div className="flex items-center gap-1 text-xs font-medium bg-enb-gold/10 text-enb-gold px-1.5 py-0.5 rounded">
                          <Star className="w-3 h-3 fill-current" />
                          {business.rep}
                        </div>
                      </div>
                      <div className="text-xs text-enb-text-secondary flex items-center gap-1 mt-1">
                        <Tag className="w-3 h-3" />
                        {business.category} • {business.distance}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block bg-enb-green/10 text-enb-green text-xs font-bold px-2 py-1 rounded-md">
                        {business.discount}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 relative overflow-hidden">
          {/* Placeholder for Map View */}
          <div className="absolute inset-0 bg-[url('https://www.openstreetmap.org/assets/osm_logo-414674681335d3d99999999999999999.svg')] bg-center bg-no-repeat opacity-10" />
          <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm z-10">
            <MapIcon className="w-12 h-12 text-enb-green mx-auto mb-3" />
            <h3 className="font-bold text-enb-text-primary mb-1">Interactive Map View</h3>
            <p className="text-sm text-enb-text-secondary mb-4">
              Visualize eco-friendly businesses near you.
            </p>
            <Button variant="outline" onClick={() => setViewMode('list')}>
              Switch to List View
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
