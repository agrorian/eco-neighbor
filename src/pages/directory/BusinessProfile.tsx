import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Star, Clock, Phone, Globe, Share2, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock Data (In a real app, fetch based on ID)
const BUSINESS_DATA = {
  id: '1',
  name: 'Green Leaf Cafe',
  category: 'Food & Drink',
  verified: true,
  address: '123 Eco Lane, Green City',
  distance: '0.2 km',
  rating: 4.8,
  reviews: 124,
  tier: 'Grove',
  hours: 'Mon-Fri: 8am - 6pm',
  phone: '+1 (555) 123-4567',
  website: 'www.greenleafcafe.com',
  description: 'Organic, locally sourced ingredients with a zero-waste philosophy. Bring your own cup for an extra discount!',
  offer: {
    title: '10% Off Any Purchase',
    description: 'Get 10% off your total bill when you pay with ENB or show your member QR code.',
    terms: 'Valid for dine-in and takeout. Cannot be combined with other offers.',
  },
  image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop',
  reviewsList: [
    { id: 1, user: 'Alice G.', rating: 5, text: 'Amazing vegan options! Love the zero-waste vibe.', date: '2 days ago' },
    { id: 2, user: 'Bob M.', rating: 4, text: 'Great coffee, but a bit pricey without the ENB discount.', date: '1 week ago' },
  ]
};

export default function BusinessProfile() {
  const { id } = useParams();
  // In a real app, use `id` to fetch data.
  const business = BUSINESS_DATA; 

  return (
    <div className="pb-24">
      {/* Header Image */}
      <div className="relative h-64 w-full">
        <img src={business.image} alt={business.name} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4">
          <Link to="/directory">
            <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white rounded-full backdrop-blur-sm">
              <ArrowLeft className="w-5 h-5 text-enb-text-primary" />
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white rounded-full backdrop-blur-sm">
            <Share2 className="w-5 h-5 text-enb-text-primary" />
          </Button>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        <Card className="shadow-lg border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
                  {business.name}
                  {business.verified && <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />}
                </h1>
                <p className="text-sm text-enb-text-secondary">{business.category}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 bg-enb-gold/10 text-enb-gold px-2 py-1 rounded-lg font-bold text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  {business.rating}
                </div>
                <span className="text-xs text-gray-400 mt-1">{business.reviews} reviews</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-enb-text-secondary mt-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {business.distance}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-enb-green" />
                Open Now
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Offer Section */}
        <div className="bg-gradient-to-r from-enb-green/10 to-enb-teal/10 p-6 rounded-2xl border border-enb-green/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-enb-green mb-1">{business.offer.title}</h3>
              <p className="text-sm text-enb-text-secondary">{business.offer.description}</p>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <QrCode className="w-8 h-8 text-enb-text-primary" />
            </div>
          </div>
          <Link to="/wallet/redeem">
            <Button className="w-full bg-enb-green hover:bg-enb-green/90 text-white font-bold shadow-lg shadow-enb-green/20">
              Redeem Offer
            </Button>
          </Link>
          <p className="text-xs text-gray-400 mt-3 text-center">{business.offer.terms}</p>
        </div>

        {/* Info Section */}
        <div className="space-y-4">
          <h3 className="font-bold text-enb-text-primary text-lg">Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-enb-text-secondary">{business.address}</span>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-enb-text-secondary">{business.hours}</span>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-enb-text-secondary">{business.phone}</span>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" className="text-enb-green hover:underline">
                {business.website}
              </a>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-2">
          <h3 className="font-bold text-enb-text-primary text-lg">About</h3>
          <p className="text-sm text-enb-text-secondary leading-relaxed">
            {business.description}
          </p>
        </div>

        {/* Reviews Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-enb-text-primary text-lg">Reviews</h3>
            <Button variant="ghost" size="sm" className="text-enb-green hover:text-enb-green/80">View All</Button>
          </div>
          <div className="space-y-4">
            {business.reviewsList.map((review) => (
              <div key={review.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-enb-text-primary">{review.user}</span>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-enb-gold fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-sm text-enb-text-secondary">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
