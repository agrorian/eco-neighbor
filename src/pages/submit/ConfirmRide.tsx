import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

// Passenger confirmation page — works for both ENB members (in-app) and non-members (web QR)
export default function ConfirmRide() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [enbEarned, setEnbEarned] = useState(0);

  useEffect(() => {
    if (!token) return;
    const fetchRide = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, action_type, vehicle_type, calculated_distance_km, calculated_duration_min, submitted_at, user_id, users!user_id(full_name)')
        .eq('ride_token', token)
        .eq('action_type', 'carpool')
        .single();
      if (error || !data) {
        setError('Ride not found or confirmation window has expired.');
      } else {
        setSubmission(data);
      }
      setLoading(false);
    };
    fetchRide();
  }, [token]);

  const handleConfirm = async () => {
    if (!submission || rating === 0) return;
    setSubmitting(true);

    const isAppUser = !!user;
    const confirmationType = isAppUser ? 'app' : 'qr_web';
    const enbToPassenger = isAppUser ? 200 : 0;
    const enbToDriver = isAppUser ? 100 : 75;

    // Insert confirmation record
    const { error: confErr } = await supabase.from('ride_confirmations').insert({
      submission_id: submission.id,
      passenger_user_id: user?.id || null,
      confirmation_type: confirmationType,
      rating,
      comment: comment.trim() || null,
      enb_credited_to_driver: enbToDriver,
      enb_credited_to_passenger: enbToPassenger,
    });

    if (confErr) { setSubmitting(false); setError('Confirmation failed. Please try again.'); return; }

    // Credit passenger ENB (if ENB member)
    if (isAppUser && user) {
      await supabase.rpc('award_enb', {
        p_user_id: user.id,
        p_enb_amount: enbToPassenger,
        p_rep_amount: 50,
        p_reason: `Carpool passenger confirmation — ride ${token}`,
      }).catch(() => {});
    }

    // Credit driver top-up via RPC
    await supabase.rpc('carpool_passenger_topup', {
      p_submission_id: submission.id,
      p_enb_topup: enbToDriver,
      p_new_rating: rating,
    }).catch(() => {});

    setEnbEarned(enbToPassenger);
    setConfirmed(true);
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 text-enb-green animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-3">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <p className="text-enb-text-primary font-semibold">{error}</p>
        <Button variant="ghost" onClick={() => navigate('/')}>Go to Eco-Neighbor</Button>
      </div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-4 max-w-sm">
        <CheckCircle className="w-16 h-16 text-enb-green mx-auto" />
        <h2 className="text-xl font-bold text-enb-text-primary">Ride Confirmed!</h2>
        <p className="text-enb-text-secondary text-sm">
          Thank you for confirming this carpool. Your rating helps build trust in the community.
        </p>
        {enbEarned > 0 && (
          <div className="bg-enb-gold/10 border border-enb-gold/30 rounded-xl p-4">
            <p className="text-2xl font-bold text-enb-gold">+{enbEarned} $ENB</p>
            <p className="text-xs text-gray-500 mt-1">Credited to your wallet</p>
          </div>
        )}
        <Button onClick={() => navigate('/')} className="w-full bg-enb-green text-white">
          Open Eco-Neighbor
        </Button>
      </div>
    </div>
  );

  const driverName = (submission?.users as any)?.full_name || 'Your driver';
  const distKm = submission?.calculated_distance_km;
  const vehicleType = submission?.vehicle_type || 'vehicle';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-enb-green p-6 text-white text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🚗</span>
          </div>
          <h1 className="text-lg font-bold">Confirm Your Ride</h1>
          <p className="text-white/80 text-sm mt-1">with {driverName}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Ride summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Vehicle</span>
              <span className="font-medium text-enb-text-primary">{vehicleType}</span>
            </div>
            {distKm && (
              <div className="flex justify-between">
                <span className="text-gray-500">Distance</span>
                <span className="font-medium text-enb-text-primary">{distKm} km</span>
              </div>
            )}
          </div>

          {/* Star rating */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-enb-text-primary">How was your ride?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      s <= (hoverRating || rating)
                        ? 'text-enb-gold fill-enb-gold'
                        : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-gray-400">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </p>
            )}
          </div>

          {/* Optional comment */}
          {rating > 0 && (
            <div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, 100))}
                placeholder="Any comments? (optional)"
                className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none h-16 focus:outline-none focus:border-enb-green"
              />
              <p className="text-xs text-gray-400 text-right">{comment.length}/100</p>
            </div>
          )}

          {/* ENB reward hint */}
          {user && (
            <div className="bg-enb-gold/10 border border-enb-gold/20 rounded-xl p-3 text-center">
              <p className="text-sm font-semibold text-enb-gold">+200 $ENB for you</p>
              <p className="text-xs text-gray-500">Credited instantly on confirmation</p>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={rating === 0 || submitting}
            className="w-full h-12 bg-enb-green hover:bg-enb-green/90 text-white disabled:opacity-50"
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirming...</>
              : 'Confirm Ride'}
          </Button>

          <p className="text-xs text-center text-gray-400">
            By confirming, you verify that you were a passenger on this carpool.
          </p>
        </div>
      </div>
    </div>
  );
}
