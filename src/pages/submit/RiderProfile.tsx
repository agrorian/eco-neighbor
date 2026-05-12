import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Car, MessageCircle, Phone, MessageSquare, ArrowLeft, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface RiderData {
  id: string;
  full_name: string;
  profile_pic_url?: string;
  whatsapp_number?: string;
  neighbourhood?: string;
  city?: string;
  is_carpool_rider: boolean;
  total_carpool_rides: number;
  avg_carpool_rating: number;
  captain_applications?: { status: string; approved_vehicle_types: string[]; license_categories: string[] }[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  confirmed_at: string;
  confirmation_type: string;
  passenger_user_id: string | null;
  passenger_name?: string;
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`${sz} transition-colors ${
            s <= Math.round(rating) ? 'text-enb-gold fill-enb-gold' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function RiderProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUserStore();

  const [rider, setRider] = useState<RiderData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    const fetchRider = async () => {
      setLoading(true);

      // Fetch rider profile
      const { data: riderData, error: riderErr } = await supabase
        .from('users')
        .select('id, full_name, profile_pic_url, whatsapp_number, neighbourhood, city, is_carpool_rider, total_carpool_rides, avg_carpool_rating, captain_applications(status, approved_vehicle_types, license_categories)')
        .eq('id', userId)
        .single();

      if (riderErr || !riderData || !riderData.is_carpool_rider) {
        setError('Rider profile not found.');
        setLoading(false);
        return;
      }
      setRider(riderData);

      // Fetch reviews from ride_confirmations joined with submissions
      const { data: confirmData } = await supabase
        .from('ride_confirmations')
        .select(`
          id, rating, comment, confirmed_at, confirmation_type, passenger_user_id,
          submissions!submission_id(user_id)
        `)
        .not('rating', 'is', null)
        .order('confirmed_at', { ascending: false })
        .limit(30);

      if (confirmData) {
        // Filter to only this rider's confirmations
        const riderReviews = confirmData.filter(
          (r: any) => r.submissions?.user_id === userId
        );

        // Fetch passenger names for app confirmations
        const passengerIds = riderReviews
          .filter(r => r.passenger_user_id)
          .map(r => r.passenger_user_id);

        let nameMap: Record<string, string> = {};
        if (passengerIds.length > 0) {
          const { data: passengers } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', passengerIds);
          if (passengers) {
            passengers.forEach((p: any) => { nameMap[p.id] = p.full_name; });
          }
        }

        setReviews(riderReviews.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          confirmed_at: r.confirmed_at,
          confirmation_type: r.confirmation_type,
          passenger_user_id: r.passenger_user_id,
          passenger_name: r.passenger_user_id ? nameMap[r.passenger_user_id] : null,
        })));
      }

      setLoading(false);
    };

    fetchRider();
  }, [userId]);

  const handleInAppMessage = () => {
    if (!userId) return;
    navigate(`/messages/${userId}`);
  };

  const handleWhatsApp = () => {
    if (!rider?.whatsapp_number) return;
    const number = rider.whatsapp_number.replace(/\D/g, '');
    window.open(`https://wa.me/${number}`, '_blank');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const anonymiseName = (name: string) => {
    if (!name) return 'Passenger';
    const parts = name.trim().split(' ');
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.` : parts[0];
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-enb-green animate-spin" />
    </div>
  );

  if (error || !rider) return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-3">
      <AlertTriangle className="w-10 h-10 text-amber-400" />
      <p className="text-enb-text-secondary text-sm">{error || 'Rider not found.'}</p>
      <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const isOwnProfile = currentUser?.id === userId;
  const initials = (rider.full_name || 'R').charAt(0).toUpperCase();
  const location = rider.city || (rider.neighbourhood?.split(',')[1]?.trim()) || '';

  return (
    <div className="space-y-5 pb-24">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-enb-text-secondary"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero card */}
      <Card className="border-gray-100 overflow-hidden">
        {/* Green header band */}
        <div className="h-20 bg-gradient-to-r from-enb-green to-enb-teal" />

        <div className="px-5 pb-5 -mt-10">
          {/* Avatar */}
          <div className="relative mb-3">
            {rider.profile_pic_url ? (
              <img
                src={rider.profile_pic_url}
                alt={rider.full_name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-enb-green flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
            )}
            {/* ENB Captain badge */}
            <div className="absolute -bottom-1 -right-1 bg-enb-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              🚗 ENB Captain
            </div>
          </div>

          {/* Name + location */}
          <h1 className="text-xl font-bold text-enb-text-primary">{rider.full_name}</h1>
          {location && (
            <p className="text-sm text-enb-text-secondary mt-0.5">{location}</p>
          )}

          {/* Stats row */}
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-enb-green">{rider.total_carpool_rides}</p>
              <p className="text-xs text-gray-400">Rides</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-enb-gold">
                  {rider.avg_carpool_rating > 0 ? Number(rider.avg_carpool_rating).toFixed(1) : '—'}
                </p>
                {rider.avg_carpool_rating > 0 && (
                  <Star className="w-5 h-5 text-enb-gold fill-enb-gold mb-1" />
                )}
              </div>
              <p className="text-xs text-gray-400">Rating</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-2xl font-bold text-enb-text-primary">{reviews.length}</p>
              <p className="text-xs text-gray-400">Reviews</p>
            </div>
          </div>

          {/* Star display */}
          {rider.avg_carpool_rating > 0 && (
            <div className="mt-3">
              <StarRow rating={rider.avg_carpool_rating} size="lg" />
            </div>
          )}

          {/* Approved vehicle types */}
          {(rider.captain_applications?.[0]?.approved_vehicle_types || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rider.captain_applications![0].approved_vehicle_types.map(v => (
                <span key={v} className="text-xs px-2 py-1 bg-enb-green/10 text-enb-green rounded-lg font-medium border border-enb-green/20">
                  {v}
                </span>
              ))}
            </div>
          )}
          {/* Verified Captain badge */}
          <div className="mt-3 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-enb-green" />
            <span className="text-xs text-enb-green font-semibold">Verified ENB Captain — License & CNIC checked</span>
          </div>
        </div>
      </Card>

      {/* Action buttons — not shown on own profile */}
      {!isOwnProfile && (
        <div className="grid grid-cols-3 gap-2">
          {/* In-app message */}
          <button
            onClick={handleInAppMessage}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-enb-green/30 bg-enb-green/5 text-enb-green"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">Message</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={rider.whatsapp_number ? handleWhatsApp : undefined}
            disabled={!rider.whatsapp_number}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              rider.whatsapp_number
                ? 'border-green-300 bg-green-50 text-green-600'
                : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">WhatsApp</span>
          </button>

          {/* Call — placeholder for future */}
          <button
            disabled
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed relative"
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs font-medium">Call</span>
            <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-enb-gold text-white px-1.5 py-0.5 rounded-full font-bold">
              Soon
            </span>
          </button>
        </div>
      )}

      {/* Reviews section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-enb-text-primary">
          Passenger Reviews
          {reviews.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({reviews.length})</span>
          )}
        </h2>

        {reviews.length === 0 ? (
          <Card className="border-gray-100 p-6 text-center">
            <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-enb-text-secondary">No reviews yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Reviews appear after passengers confirm rides.
            </p>
          </Card>
        ) : (
          reviews.map(review => (
            <Card key={review.id} className="border-gray-100 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-enb-teal/20 flex items-center justify-center text-enb-teal font-bold text-sm shrink-0">
                    {review.passenger_name
                      ? review.passenger_name.charAt(0).toUpperCase()
                      : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-enb-text-primary">
                      {review.passenger_name
                        ? anonymiseName(review.passenger_name)
                        : 'Anonymous Passenger'}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(review.confirmed_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StarRow rating={review.rating} />
                  {review.confirmation_type === 'app' && (
                    <CheckCircle className="w-3.5 h-3.5 text-enb-green ml-1" title="Verified ENB member" />
                  )}
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-enb-text-secondary leading-relaxed pl-10">
                  "{review.comment}"
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
