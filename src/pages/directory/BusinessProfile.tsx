import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, Phone, MessageCircle, Share2,
  CheckCircle, Tag, Coins, Loader2, AlertCircle, Star, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  profile_pic_url: string | null;
  cover_pic_url: string | null;
  total_swaps_accepted: number | null;
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
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coverError, setCoverError] = useState(false);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchBusiness();
  }, [id]);

  const fetchBusiness = async () => {
    setLoading(true);
    const { data: biz, error: bizErr } = await supabase
      .from('business_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (bizErr || !biz) { setError('Business not found.'); setLoading(false); return; }
    setBusiness(biz);

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
  const hasSwap = business.enb_float > 0;
  const swapCount = business.total_swaps_accepted || 0;

  const legacyOffer = (!offers.length && business.discount_offer &&
    !business.discount_offer.toLowerCase().includes('tbd') &&
    !business.discount_offer.toLowerCase().includes('to be confirmed'))
    ? business.discount_offer : null;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">

      {/* ── HERO ── */}
      <div className="relative">
        {/* Cover photo */}
        <div className="h-52 w-full overflow-hidden bg-gradient-to-br from-enb-green via-enb-teal to-enb-green/70">
          {business.cover_pic_url && !coverError && (
            <img
              src={business.cover_pic_url}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={() => setCoverError(true)}
            />
          )}
          {/* Gradient overlay so buttons stay readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
        </div>

        {/* Back + Share */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Profile picture — overlaps cover */}
        <div className="absolute -bottom-12 left-5 z-10">
          <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
            {business.profile_pic_url && !profileError ? (
              <img
                src={business.profile_pic_url}
                alt={business.business_name}
                className="w-full h-full object-cover"
                onError={() => setProfileError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-enb-green to-enb-teal flex items-center justify-center">
                <span className="text-white font-bold text-3xl">{initial}</span>
              </div>
            )}
          </div>
        </div>

        {/* ENB badge — top right of cover bottom */}
        {hasSwap && (
          <div className="absolute -bottom-4 right-4 z-10">
            <span className="inline-flex items-center gap-1.5 bg-enb-green text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
              <Zap className="w-3 h-3" /> ENB Accepted
            </span>
          </div>
        )}
      </div>

      {/* ── IDENTITY ── */}
      <div className="px-4 pt-16 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-1.5 flex-wrap">
              {business.business_name}
              {business.is_verified && (
                <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500 flex-shrink-0" />
              )}
            </h1>
            <p className="text-sm text-enb-text-secondary mt-0.5">{business.category}</p>
          </div>
          {swapCount > 0 && (
            <div className="flex items-center gap-1 text-enb-green text-sm font-medium flex-shrink-0">
              <Star className="w-4 h-4 fill-enb-green" />
              <span>{swapCount} SWAP{swapCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-3 mt-3">

        {/* ── CONTACT INFO ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {business.address && (
            <a
              href={business.gps_lat && business.gps_lng
                ? `https://maps.google.com/?q=${business.gps_lat},${business.gps_lng}`
                : undefined}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-enb-green/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-enb-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-enb-text-secondary">Address</p>
                <p className="text-sm font-medium text-enb-text-primary truncate">{business.address}</p>
              </div>
              {business.gps_lat && (
                <span className="text-xs text-enb-green font-medium flex-shrink-0">Maps →</span>
              )}
            </a>
          )}

          {business.hours && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-enb-text-secondary">Hours</p>
                <p className="text-sm font-medium text-enb-text-primary">{business.hours}</p>
              </div>
            </div>
          )}

          {business.phone && (
            <a href={`tel:${business.phone}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-enb-text-secondary">Phone</p>
                <p className="text-sm font-medium text-enb-text-primary">{business.phone}</p>
              </div>
            </a>
          )}

          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-enb-text-secondary">WhatsApp</p>
                <p className="text-sm font-medium text-green-700">{business.whatsapp}</p>
              </div>
            </a>
          )}
        </div>

        {/* ── SWAP CTA ── */}
        {hasSwap && (
          <Link to={`/wallet/redeem?business=${business.id}`}>
            <div className="bg-enb-green rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">SWAP ENB Here</p>
                <p className="text-white/75 text-xs">Use your ENB.LOCAL at this business</p>
              </div>
              <span className="text-white text-lg font-bold">→</span>
            </div>
          </Link>
        )}

        {/* ── ENB SWAP ITEMS ── */}
        {swapOffers.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-enb-text-secondary uppercase tracking-wide px-1 mb-2 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-enb-green" /> ENB Items
            </h2>
            <div className="space-y-2">
              {swapOffers.map(offer => (
                <div key={offer.id} className="bg-white rounded-2xl shadow-sm border border-enb-green/15 overflow-hidden">
                  {offer.photo_url && (
                    <img src={offer.photo_url} alt={offer.item_name}
                      className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-enb-text-primary">{offer.item_name}</span>
                      <span className="bg-enb-green/10 text-enb-green font-bold text-sm px-2.5 py-1 rounded-full">
                        {offer.enb_cost?.toLocaleString()} ENB
                      </span>
                    </div>
                    {offer.description && (
                      <p className="text-xs text-enb-text-secondary mt-1">{offer.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCOUNT OFFERS ── */}
        {discountOffers.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-enb-text-secondary uppercase tracking-wide px-1 mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-500" /> Discount Offers
            </h2>
            <div className="space-y-2">
              {discountOffers.map(offer => (
                <div key={offer.id} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                  {offer.photo_url && (
                    <img src={offer.photo_url} alt={offer.item_name}
                      className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-enb-text-primary">{offer.item_name}</span>
                      <span className="bg-amber-100 text-amber-700 font-bold text-sm px-2.5 py-1 rounded-full">
                        {offer.discount_pct}% off
                      </span>
                    </div>
                    {offer.description && (
                      <p className="text-xs text-enb-text-secondary mt-1">{offer.description}</p>
                    )}
                    {offer.valid_until && (
                      <p className="text-xs text-orange-500 mt-1.5 font-medium">
                        Valid until {new Date(offer.valid_until).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEGACY OFFER ── */}
        {legacyOffer && (
          <div className="bg-enb-green/5 border border-enb-green/20 rounded-2xl p-4">
            <p className="text-xs text-enb-text-secondary mb-1 font-medium uppercase tracking-wide">ENB Offer</p>
            <p className="text-sm text-enb-green font-semibold">{legacyOffer}</p>
          </div>
        )}

        {/* ── NO OFFERS ── */}
        {!offers.length && !legacyOffer && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <Tag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-enb-text-secondary">Offers from this business will appear here once confirmed.</p>
          </div>
        )}

        {/* ── GOOGLE MAPS ── */}
        {business.gps_lat && business.gps_lng && (
          <a
            href={`https://maps.google.com/?q=${business.gps_lat},${business.gps_lng}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-5 h-5 text-enb-green flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm text-enb-text-primary">View on Google Maps</p>
              <p className="text-xs text-gray-400 font-mono">
                {business.gps_lat.toFixed(5)}, {business.gps_lng.toFixed(5)}
              </p>
            </div>
            <span className="text-enb-green text-sm font-medium">Open →</span>
          </a>
        )}
      </div>
    </div>
  );
}
