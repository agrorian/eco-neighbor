import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, Globe, Share2, CheckCircle, Tag, Coins, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface BusinessData {
  id: string;
  business_name: string;
  category: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  discount_offer: string | null;
  enb_float: number;
  is_verified: boolean;
  is_active: boolean;
  gps_lat: number | null;
  gps_lng: number | null;
  hours: string | null;
}

interface Offer {
  id: string;
  category: 'discount' | 'swap';
  item_name: string;
  description: string | null;
  discount_pct: number | null;
  enb_cost: number | null;
  valid_until: string | null;
  photo_url: string | null;
  is_active: boolean;
}

export default function BusinessProfile() {
  const { id } = useParams();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchBusiness();
  }, [id]);

  const fetchBusiness = async () => {
    setLoading(true);

    // Step 1: Get business data
    const { data: biz, error: bizErr } = await supabase
      .from('business_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (bizErr || !biz) { setError('Business not found.'); setLoading(false); return; }
    setBusiness(biz);

    // Step 2: Get active offers
    const { data: offersData } = await supabase
      .from('business_offers')
      .select('*')
      .eq('partner_id', id)
      .eq('is_active', true)
      .order('category');

    setOffers(offersData || []);
    setLoading(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: business?.business_name || 'ENB Partner', url }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
    </div>
  );

  if (error || !business) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
      <AlertCircle className="w-10 h-10 text-gray-300" />
      <p className="text-enb-text-secondary">{error || 'Business not found.'}</p>
      <Link to="/directory"><Button variant="outline">Back to Directory</Button></Link>
    </div>
  );

  const discountOffers = offers.filter(o => o.category === 'discount');
  const swapOffers = offers.filter(o => o.category === 'swap');
  const initial = business.business_name.charAt(0).toUpperCase();

  // Show discount_offer field only if no structured offers exist and it's not TBD
  const legacyOffer = (!offers.length && business.discount_offer &&
    !business.discount_offer.toLowerCase().includes('tbd') &&
    !business.discount_offer.toLowerCase().includes('to be confirmed'))
    ? business.discount_offer : null;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="relative h-48 w-full bg-gradient-to-br from-enb-green to-enb-teal flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-4xl">
          {initial}
        </div>
        <div className="absolute top-4 left-4">
          <Link to="/directory">
            <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white rounded-full backdrop-blur-sm">
              <ArrowLeft className="w-5 h-5 text-enb-text-primary" />
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white rounded-full backdrop-blur-sm" onClick={handleShare}>
            <Share2 className="w-5 h-5 text-enb-text-primary" />
          </Button>
        </div>
      </div>

      <div className="px-4 md:px-6 -mt-6 relative z-10 space-y-4">
        {/* Business card */}
        <Card className="shadow-lg border-none">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
                  {business.business_name}
                  {business.is_verified && <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />}
                </h1>
                <p className="text-sm text-enb-text-secondary">{business.category}</p>
              </div>
              {business.enb_float > 0 && (
                <span className="bg-enb-green/10 text-enb-green text-xs font-bold px-2 py-1 rounded-full">
                  ENB Accepted
                </span>
              )}
            </div>

            <div className="space-y-2 mt-3">
              {business.address && (
                <div className="flex items-start gap-2 text-sm text-enb-text-secondary">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  {business.gps_lat && business.gps_lng ? (
                    <a href={`https://maps.google.com/?q=${business.gps_lat},${business.gps_lng}`}
                      target="_blank" rel="noopener noreferrer" className="text-enb-green hover:underline">
                      {business.address}
                    </a>
                  ) : business.address}
                </div>
              )}
              {business.hours && (
                <div className="flex items-center gap-2 text-sm text-enb-text-secondary">
                  <Clock className="w-4 h-4 text-gray-400" />{business.hours}
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 text-sm text-enb-text-secondary">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${business.phone}`} className="hover:text-enb-green">{business.phone}</a>
                </div>
              )}
              {business.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-enb-text-secondary">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                    WhatsApp: {business.whatsapp}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ENB Swap Items */}
        {swapOffers.length > 0 && (
          <Card className="border-enb-green/20 shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-bold text-enb-text-primary flex items-center gap-2 mb-3">
                <Coins className="w-5 h-5 text-enb-green" /> ENB Swap Items
              </h2>
              <div className="space-y-3">
                {swapOffers.map(offer => (
                  <div key={offer.id} className="border border-enb-green/20 rounded-xl p-3 bg-enb-green/5">
                    {offer.photo_url && (
                      <img src={offer.photo_url} alt={offer.item_name}
                        className="w-full h-32 object-cover rounded-lg mb-2" />
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-enb-text-primary">{offer.item_name}</span>
                      <span className="font-bold text-enb-green">{offer.enb_cost?.toLocaleString()} ENB</span>
                    </div>
                    {offer.description && <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>}
                  </div>
                ))}
              </div>
              <Link to="/wallet/redeem">
                <Button className="w-full mt-3 bg-enb-green text-white">
                  Redeem ENB Here →
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Discount Offers */}
        {discountOffers.length > 0 && (
          <Card className="border-amber-200 shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-bold text-enb-text-primary flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-amber-600" /> Discount Offers
              </h2>
              <div className="space-y-3">
                {discountOffers.map(offer => (
                  <div key={offer.id} className="border border-amber-200 rounded-xl p-3 bg-amber-50/50">
                    {offer.photo_url && (
                      <img src={offer.photo_url} alt={offer.item_name}
                        className="w-full h-32 object-cover rounded-lg mb-2" />
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-enb-text-primary">{offer.item_name}</span>
                      <span className="font-bold text-amber-700">{offer.discount_pct}% off</span>
                    </div>
                    {offer.description && <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>}
                    {offer.valid_until && (
                      <p className="text-xs text-orange-500 mt-0.5">
                        Valid until {new Date(offer.valid_until).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legacy discount_offer field */}
        {legacyOffer && (
          <Card className="border-enb-green/20 shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-bold text-enb-text-primary mb-2">ENB Offer</h2>
              <p className="text-sm text-enb-green font-semibold">{legacyOffer}</p>
            </CardContent>
          </Card>
        )}

        {/* No offers yet */}
        {!offers.length && !legacyOffer && (
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 text-center text-sm text-gray-400">
              <p>Offers from this business will appear here once confirmed.</p>
            </CardContent>
          </Card>
        )}

        {/* GPS Map */}
        {business.gps_lat && business.gps_lng && (
          <Card className="border-gray-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <a href={`https://maps.google.com/?q=${business.gps_lat},${business.gps_lng}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <MapPin className="w-5 h-5 text-enb-green" />
                <div>
                  <p className="font-medium text-sm text-enb-text-primary">View on Google Maps</p>
                  <p className="text-xs text-gray-400 font-mono">{business.gps_lat.toFixed(5)}, {business.gps_lng.toFixed(5)}</p>
                </div>
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
