import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Phone, Loader2, AlertTriangle, CheckCircle, Star, Briefcase, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import StarRating from '@/components/StarRating';
import { TRADE_EMOJI, TRADE_LABEL } from './TradesDirectory';
import StartJobModal from './StartJobModal';
import AvailabilityPicker from '@/components/AvailabilityPicker';

interface TradesPersonData {
  id: string;
  full_name: string;
  profile_pic_url: string | null;
  neighbourhood: string | null;
  city: string | null;
  profession: string | null;
  whatsapp_number: string | null;
  trade_types: string[];
  total_verified_jobs: number;
  avg_job_rating: number;
  total_job_ratings: number;
  trade_availability: string;
  trade_availability_until: string | null;
  trade_availability_schedule: Record<string, { from: string; to: string }> | null;
  cnic_verified: boolean;
  joined_at: string;
  avg_carpool_rating: number;
  rep_score: number;
}

interface JobRecord {
  id: string;
  action_type: string;
  description: string | null;
  photo_urls: string[];
  gps_address: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  status: string;
}

interface JobRating {
  submission_id: string;
  job_rating: number;
  job_rating_comment: string | null;
  would_hire_again: boolean | null;
  customer_name: string | null;
  rated_at: string | null;
}

const AVAILABILITY_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  available_now: { emoji: '🟢', label: 'Available Now', color: 'text-green-700 bg-green-50 border-green-200' },
  busy:          { emoji: '🟡', label: 'Busy',          color: 'text-amber-700 bg-amber-50 border-amber-200' },
  not_set:       { emoji: '⚪', label: 'Status not set', color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

function formatSchedule(schedule: Record<string, { from: string; to: string }> | null): string {
  if (!schedule) return '';
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const active = days.filter(d => schedule[d]);
  if (active.length === 0) return '';
  if (active.length === 7) return `Every day ${schedule[active[0]].from}–${schedule[active[0]].to}`;

  // Group consecutive days
  const parts: string[] = [];
  let i = 0;
  while (i < active.length) {
    let j = i;
    while (j + 1 < active.length) {
      const curr = days.indexOf(active[j]);
      const next = days.indexOf(active[j + 1]);
      if (next === curr + 1) j++;
      else break;
    }
    const from = schedule[active[i]].from;
    const to = schedule[active[j]].to;
    const label = i === j ? active[i] : `${active[i]}–${active[j]}`;
    parts.push(`${label} ${from}–${to}`);
    i = j + 1;
  }
  return parts.join(', ');
}

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
}

export default function TradesProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUserStore();

  const [person, setPerson] = useState<TradesPersonData | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [ratings, setRatings] = useState<JobRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAvailPicker, setShowAvailPicker] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);

      const { data: p } = await supabase
        .from('users')
        .select('id, full_name, profile_pic_url, neighbourhood, city, profession, whatsapp_number, trade_types, total_verified_jobs, avg_job_rating, total_job_ratings, trade_availability, trade_availability_until, trade_availability_schedule, cnic_verified, joined_at, avg_carpool_rating, rep_score')
        .eq('id', userId)
        .gt('total_verified_jobs', 0)
        .maybeSingle();

      if (!p) { setError('Profile not found or no verified jobs yet.'); setLoading(false); return; }
      setPerson(p);

      // Approved trade job submissions — the portfolio
      const { data: jobData } = await supabase
        .from('submissions')
        .select('id, action_type, description, photo_urls, gps_address, submitted_at, reviewed_at, status')
        .eq('user_id', userId)
        .eq('action_type', 'trade_job')
        .eq('status', 'approved')
        .order('reviewed_at', { ascending: false })
        .limit(20);
      if (jobData) setJobs(jobData);

      // Customer ratings from job_requests
      const { data: ratingData } = await supabase
        .from('job_requests')
        .select('submission_id, job_rating, job_rating_comment, would_hire_again, customer_name, rated_at')
        .eq('tradesperson_id', userId)
        .not('job_rating', 'is', null)
        .order('rated_at', { ascending: false });
      if (ratingData) setRatings(ratingData);

      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-enb-green animate-spin" />
    </div>
  );

  if (error || !person) return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-center p-6">
      <span className="text-5xl">🔍</span>
      <p className="font-semibold text-enb-text-primary">{error || 'Profile not found'}</p>
      <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const avail = AVAILABILITY_CONFIG[person.trade_availability] || AVAILABILITY_CONFIG.not_set;
  const scheduleText = formatSchedule(person.trade_availability_schedule);
  const showRating = person.total_job_ratings >= 3;
  const initials = person.full_name.charAt(0).toUpperCase();
  const location = person.city || person.neighbourhood?.split(',')[0] || '';

  // ENB member benefits — shown on public page to non-members (marketing hook)
  const ENB_BENEFITS = [
    '✅ Earn $ENB tokens for verified community work',
    '🔧 Get a verified digital portfolio of your jobs',
    '⭐ Build your reputation — visible to thousands',
    '🏪 Spend $ENB at local partner businesses',
    '🚗 Join ENB Carpools — earn for rides you already give',
    '🌱 Be part of Karachi\'s first civic economy',
    '📱 Free to join — no hidden fees ever',
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-enb-text-secondary">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero card */}
      <Card className="border-gray-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-enb-teal to-blue-600" />
        <div className="px-5 pb-5 -mt-12">
          {/* Avatar */}
          <div className="relative mb-3 inline-block">
            {person.profile_pic_url ? (
              <img src={person.profile_pic_url} alt={person.full_name}
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-md object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-enb-teal/20 flex items-center justify-center">
                <span className="text-white text-2xl font-bold text-enb-teal">{initials}</span>
              </div>
            )}
            {/* Primary trade emoji badge */}
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-xl border border-gray-100">
              {TRADE_EMOJI[person.trade_types?.[0]] || '🛠️'}
            </div>
          </div>

          <h1 className="text-xl font-bold text-enb-text-primary">{person.full_name}</h1>

          {/* Trade type badges */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {(person.trade_types || []).map(t => (
              <span key={t} className="inline-flex items-center gap-1 bg-enb-teal/10 text-enb-teal text-xs font-semibold px-2.5 py-1 rounded-full border border-enb-teal/20">
                {TRADE_EMOJI[t] || '🛠️'} {TRADE_LABEL[t] || t}
              </span>
            ))}
          </div>

          {/* Location + joined */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
            {location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Since {formatJoined(person.joined_at)}</span>
            {person.cnic_verified && (
              <span className="flex items-center gap-1 text-enb-green font-medium">
                <CheckCircle className="w-3 h-3" /> CNIC Verified
              </span>
            )}
          </div>

          {/* Availability banner */}
          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${avail.color}`}>
            <span>{avail.emoji}</span>
            <span>{avail.label}</span>
            {scheduleText && <span className="text-xs font-normal opacity-70 ml-auto">{scheduleText}</span>}
            {isOwnProfile && (
              <button
                onClick={() => setShowAvailPicker(true)}
                className="ml-auto text-xs underline opacity-70 hover:opacity-100"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats — visual emoji-led grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-gray-100 p-4 text-center">
          <p className="text-2xl mb-1">✅</p>
          <p className="text-xl font-bold text-enb-text-primary">{person.total_verified_jobs}</p>
          <p className="text-xs text-gray-400">Verified Jobs</p>
        </Card>
        <Card className="border-gray-100 p-4 text-center">
          <p className="text-2xl mb-1">⭐</p>
          {showRating ? (
            <>
              <p className="text-xl font-bold text-enb-text-primary">{Number(person.avg_job_rating).toFixed(1)}</p>
              <p className="text-xs text-gray-400">({person.total_job_ratings} reviews)</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-300">—</p>
              <p className="text-xs text-gray-400">No reviews yet</p>
            </>
          )}
        </Card>
        <Card className="border-gray-100 p-4 text-center">
          <p className="text-2xl mb-1">🏆</p>
          <p className="text-xl font-bold text-enb-text-primary">{person.rep_score.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Rep Score</p>
        </Card>
      </div>

      {/* Action buttons — not shown on own profile */}
      {!isOwnProfile && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowJobModal(true)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-enb-green text-white shadow-lg shadow-enb-green/20 col-span-2"
          >
            <span className="text-2xl">💼</span>
            <span className="text-sm font-bold">Hire This Person</span>
          </button>
          <button
            onClick={() => navigate(`/messages/${userId}`)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-enb-teal/10 text-enb-teal border border-enb-teal/20"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-semibold">Message</span>
          </button>
        </div>
      )}

      {/* WhatsApp */}
      {!isOwnProfile && person.whatsapp_number && (
        <button
          onClick={() => window.open(`https://wa.me/${person.whatsapp_number!.replace(/\D/g, '')}`, '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-green-400 text-green-600 font-semibold text-sm bg-green-50"
        >
          <span className="text-xl">💬</span> Contact on WhatsApp
        </button>
      )}

      {/* Portfolio — the digital resume */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-enb-text-primary flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-enb-teal" />
          Verified Work Portfolio
          <span className="text-sm font-normal text-gray-400 ml-auto">{jobs.length} jobs</span>
        </h2>

        {jobs.length === 0 ? (
          <Card className="border-gray-100 p-8 text-center">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-sm text-enb-text-secondary">Portfolio loading...</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => {
              const jobRating = ratings.find(r => r.submission_id === job.id);
              const beforePhoto = job.photo_urls?.[0];
              const afterPhoto = job.photo_urls?.[1] || job.photo_urls?.[0];

              return (
                <Card key={job.id} className="border-gray-100 overflow-hidden">
                  {/* Before/After photos */}
                  {beforePhoto && (
                    <div className="grid grid-cols-2 gap-0.5 h-32">
                      <div className="relative overflow-hidden bg-gray-100">
                        <img src={beforePhoto} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">Before</span>
                      </div>
                      <div className="relative overflow-hidden bg-gray-100">
                        <img src={afterPhoto} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-xs bg-enb-green/80 text-white px-1.5 py-0.5 rounded font-medium">After ✅</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-enb-text-primary flex items-center gap-1">
                          {TRADE_EMOJI[job.action_type] || '🛠️'} Verified Job
                        </p>
                        {job.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{job.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(job.reviewed_at || job.submitted_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {job.gps_address && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          📍 {job.gps_address.split(',')[0]}
                        </span>
                      )}
                      <span className="text-xs text-enb-green font-medium flex items-center gap-0.5 ml-auto">
                        ✅ Verified by ENB Moderators
                      </span>
                    </div>

                    {/* Customer rating for this job */}
                    {jobRating && (
                      <div className="bg-enb-gold/5 border border-enb-gold/20 rounded-xl p-2.5 space-y-1">
                        <div className="flex items-center gap-2">
                          <StarRating value={jobRating.job_rating} size="sm" />
                          {jobRating.would_hire_again !== null && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              jobRating.would_hire_again ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {jobRating.would_hire_again ? '👍 Would hire again' : '👎 Would not rehire'}
                            </span>
                          )}
                        </div>
                        {jobRating.job_rating_comment && (
                          <p className="text-xs text-gray-500 italic">"{jobRating.job_rating_comment}"</p>
                        )}
                        <p className="text-xs text-gray-400">
                          — {jobRating.customer_name || 'Customer'}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ENB membership benefits — shown to non-logged-in visitors */}
      {!currentUser && (
        <Card className="border-enb-green/20 bg-enb-green/5 p-5 space-y-3">
          <p className="text-base font-bold text-enb-green flex items-center gap-2">
            🌱 Join Eco-Neighbor — It's Free
          </p>
          <p className="text-sm text-enb-text-secondary">
            As an ENB member you can hire this tradesperson, rate their work, and earn $ENB tokens for your own community actions.
          </p>
          <div className="space-y-1.5">
            {ENB_BENEFITS.map((b, i) => (
              <p key={i} className="text-sm text-enb-text-primary">{b}</p>
            ))}
          </div>
          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-enb-green text-white font-bold py-3 rounded-xl text-sm mt-2"
          >
            Create Free Account →
          </button>
        </Card>
      )}

      {/* Modals */}
      {showJobModal && userId && (
        <StartJobModal
          tradespersonId={userId}
          tradespersonName={person.full_name}
          tradeTypes={person.trade_types}
          onClose={() => setShowJobModal(false)}
        />
      )}

      {showAvailPicker && isOwnProfile && (
        <AvailabilityPicker
          initialAvailability={person.trade_availability}
          initialSchedule={person.trade_availability_schedule}
          onClose={() => setShowAvailPicker(false)}
          onSaved={(avail, schedule) => {
            setPerson(prev => prev ? { ...prev, trade_availability: avail, trade_availability_schedule: schedule } : prev);
          }}
        />
      )}
    </div>
  );
}
