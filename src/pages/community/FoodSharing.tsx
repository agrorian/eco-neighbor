import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Apple, Bike, Shield, ClipboardList, ChevronDown, ChevronUp,
  CheckCircle, Loader2, AlertCircle, Leaf, Flame, Users,
  MapPin, Phone, Truck, X, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import { supabase, getDb } from '@/lib/supabase';

// ── CFSP Priority Waterfall — Canonical ──────────────────────────────────────
// T1 has two sub-categories (a) and (b) per whitepaper v6.2
const WATERFALL = [
  {
    tier: '1a', tierNum: 1,
    label: 'Direct Human Consumption',
    subLabel: '(a) Community Recipients',
    color: 'bg-enb-green', textColor: 'text-enb-green',
    recipients: 'Daily-wage workers at shift end, elderly & disabled, registered food-insecure households, homeless individuals at identified locations — delivered by Food Runner',
    reward: '1,000 ENB/batch + 500 ENB Priority Recipient bonus',
    note: '',
    urgent: true,
  },
  {
    tier: '1b', tierNum: 1,
    label: 'Direct Human Consumption',
    subLabel: '(b) Residential Child Welfare Institutions',
    color: 'bg-enb-green', textColor: 'text-enb-green',
    recipients: 'Residential Child Welfare Institutions registered within neighborhood perimeter — Paediatric Safety Standard applies',
    reward: '1,000 ENB/batch + 800 ENB Paediatric Delivery Bonus',
    note: 'Cooked within 2hrs · insulated covered container · allergen log maintained · nutritionally complete meal only',
    urgent: true,
  },
  {
    tier: '2', tierNum: 2,
    label: 'Community Kitchen',
    subLabel: '',
    color: 'bg-enb-teal', textColor: 'text-enb-teal',
    recipients: 'Volunteer cooks transform surplus into bulk meals — served at Community Day events, weekly community lunches, Seasonal Bonus Campaigns',
    reward: '800 ENB/batch + carbon credit record generated',
    note: '',
    urgent: false,
  },
  {
    tier: '3', tierNum: 3,
    label: 'Processed / Value-Added Use',
    subLabel: '',
    color: 'bg-blue-400', textColor: 'text-blue-600',
    recipients: 'Surplus converted to pickles, preserves, jams, chutneys by registered community volunteers — used in cooking classes that teach preservation skills',
    reward: '600 ENB/batch + 300 ENB bonus if product listed on ENB app for community purchase',
    note: '',
    urgent: false,
  },
  {
    tier: '4', tierNum: 4,
    label: 'Animal Feed',
    subLabel: '',
    color: 'bg-enb-gold', textColor: 'text-yellow-700',
    recipients: 'Food past the human safety window but not spoiled — registered livestock keepers, dairy operations, animal shelters, stray animal feeders',
    reward: '300 ENB/batch — acknowledges this is better than landfill',
    note: '',
    urgent: false,
  },
  {
    tier: '5', tierNum: 5,
    label: 'Composting / Biogas',
    subLabel: '',
    color: 'bg-gray-400', textColor: 'text-gray-600',
    recipients: 'Genuinely spoiled items, mouldy bread, rotten produce — community compost points feed local gardens; Phase 2: biogas partnership converts waste to cooking gas',
    reward: '200 ENB/kg composted — lowest tier, still rewarded',
    note: '',
    urgent: false,
  },
];

// ── Collection Modes ──────────────────────────────────────────────────────────
const MODES = [
  {
    mode: 'A', label: 'Active Pickup', icon: Bike, color: 'text-enb-green', bg: 'bg-enb-green/10',
    desc: 'A Food Runner is dispatched via the app to collect food from the donor and deliver it to the Community Food Hub or directly to a Priority Recipient.',
    bestFor: 'Restaurants, dhabas, school canteens — high-volume cooked food with 2–4 hour safety windows.',
  },
  {
    mode: 'B', label: 'Self Drop-Off', icon: Truck, color: 'text-enb-teal', bg: 'bg-enb-teal/10',
    desc: 'The business owner brings surplus food to the Community Food Hub during their natural daily movement. ENB is credited immediately upon CFG intake confirmation.',
    bestFor: 'Street vendors, bakeries, grocers, milkmen — food with longer windows and natural route alignment.',
  },
  {
    mode: 'C', label: 'On-Site Sharing', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50',
    desc: 'Food stays at the business. The app sends a push notification: "Bread available at Ahmed\'s Bakery — free until 7 PM." Recipients come directly. Both donor and each recipient earn ENB.',
    bestFor: 'Small quantities, bakeries, tea stalls, fruit vendors — food with several hours remaining.',
  },
];

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    icon: Bike, label: 'Food Runner', color: 'text-enb-green', bg: 'bg-enb-green/10',
    requirement: 'Helper Tier+ · Vehicle access (motorbike, bicycle, or rickshaw)',
    earnings: [
      '1,000 ENB per successful pickup-and-delivery run (GPS verified)',
      '500 ENB bonus — same-night cooked food delivered within 2-hour safety window',
      '300 ENB extra per Priority Recipient delivery (elderly, disabled, child household)',
      '2,500 ENB monthly bonus for 20+ runs with zero failed pickups',
      '200 ENB per additional efficient stop added to an existing route',
    ],
  },
  {
    icon: ClipboardList, label: 'Community Food Guardian (CFG)', color: 'text-enb-teal', bg: 'bg-enb-teal/10',
    requirement: 'Guardian Tier+ · Appointed by ENB Governance · Operates Community Food Hub',
    earnings: [
      '2,000 ENB/month base stipend from Community Rewards Pool',
      '500 ENB per verified intake batch logged correctly in the app',
      '300 ENB per food safety check passed with no incidents',
      '1,000 ENB monthly zero-waste bonus (all food redistributed within safety window)',
      '5,000 ENB annual bonus for 12 consecutive months without a food safety incident',
    ],
  },
  {
    icon: Shield, label: 'Food Safety Moderator', color: 'text-purple-600', bg: 'bg-purple-50',
    requirement: 'Pillar Tier+ · Elected by community · Monthly unannounced audits',
    earnings: [
      '3,000 ENB/month stipend',
      '1,000 ENB per completed audit report',
      'Authority to suspend a Food Runner, CFG, or donor for safety violations',
      'Trains new CFGs — 2,000 ENB per CFG successfully onboarded',
    ],
  },
];

// ── Registration Modal ────────────────────────────────────────────────────────
function RegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useUserStore();
  const [vehicle, setVehicle] = useState('');
  const [phone, setPhone] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const tierOrder = ['Newcomer', 'Helper', 'Guardian', 'Pillar', 'Founder Tier'];
  const tierIndex = tierOrder.indexOf(user.tier);
  const meetsRequirement = tierIndex >= tierOrder.indexOf('Helper');

  const handleSubmit = async () => {
    if (!vehicle) { setError('Please select your vehicle type.'); return; }
    if (!phone.trim()) { setError('Please provide a contact number.'); return; }
    if (!motivation.trim()) { setError('Please tell us a bit about yourself.'); return; }
    setLoading(true); setError('');

    const { error: dbError } = await getDb().from('volunteer_applications').insert({
      user_id: user.id,
      role_applied: 'food_runner',
      motivation: `Vehicle: ${vehicle}\nPhone: ${phone}\n\n${motivation.trim()}`,
      availability: user.neighbourhood || null,
      status: 'pending',
    });

    if (dbError) { setError('Submission failed. Please try again.'); setLoading(false); return; }
    onSuccess();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-0">
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-enb-text-primary">Register as Food Runner</h2>
            <p className="text-xs text-enb-text-secondary mt-0.5">Your application will be reviewed by the team</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!meetsRequirement ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <div className="font-bold mb-1">Helper Tier Required</div>
            <p>Food Runners must reach Helper Tier (5,000 Rep Score) before registering. Keep earning ENB through verified civic actions to reach this tier.</p>
            <p className="mt-2 font-medium">Your current tier: <span className="text-enb-green">{user.tier}</span> ({user.rep_score.toLocaleString()} / 5,000 Rep)</p>
          </div>
        ) : (
          <>
            {/* Pre-filled info */}
            <div className="bg-enb-green/5 rounded-xl p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-enb-text-secondary">Name</span>
                <span className="font-medium text-enb-text-primary">{user.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enb-text-secondary">Tier</span>
                <span className="font-medium text-enb-green">{user.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enb-text-secondary">Neighborhood</span>
                <span className="font-medium text-enb-text-primary">{user.neighbourhood || 'Not set'}</span>
              </div>
            </div>

            {/* Vehicle type */}
            <div>
              <label className="block text-sm font-medium text-enb-text-primary mb-2">
                <Bike className="w-4 h-4 inline mr-1 text-enb-green" /> Vehicle Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Motorbike', 'Bicycle', 'Rickshaw', 'Car', 'On foot', 'Other'].map(v => (
                  <button
                    key={v}
                    onClick={() => setVehicle(v)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
                      vehicle === v
                        ? 'bg-enb-green text-white border-enb-green'
                        : 'border-gray-200 text-gray-600 hover:border-enb-green/40'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-enb-text-primary mb-1">
                <Phone className="w-4 h-4 inline mr-1 text-enb-green" /> Contact Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="03xx-xxxxxxx"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-enb-green/30"
              />
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-sm font-medium text-enb-text-primary mb-1">
                Why do you want to be a Food Runner? *
              </label>
              <textarea
                value={motivation}
                onChange={e => setMotivation(e.target.value)}
                rows={3}
                placeholder="Tell us about your availability, your route area, and why you want to help..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-enb-green/30 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-enb-green text-white hover:bg-enb-green/90 py-3 rounded-xl font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Submit Application
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Applications are reviewed within 3–5 days. You'll be notified via the app.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FoodSharing() {
  const { user } = useUserStore();
  const [stats, setStats] = useState({ donations: 0, kgDiverted: 0, runners: 0 });
  const [showModal, setShowModal] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [expandedMode, setExpandedMode] = useState<number | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  if (!user) return null;

  useEffect(() => {
    const fetchStats = async () => {
      // Food donations stats - two-step queries
      const { data: foodData } = await getDb()
        .from('food_donations')
        .select('quantity_kg')
        .eq('status', 'completed');

      const kgDiverted = (foodData || []).reduce((sum, f) => sum + (Number(f.quantity_kg) || 0), 0);

      const { count: donationCount } = await getDb()
        .from('food_donations')
        .select('id', { count: 'exact', head: true });

      // Check existing food_runner applications
      const { count: runnerCount } = await getDb()
        .from('volunteer_applications')
        .select('id', { count: 'exact', head: true })
        .eq('role_applied', 'food_runner');

      // Check if this user already applied
      const { count: myApp } = await getDb()
        .from('volunteer_applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role_applied', 'food_runner');

      setStats({ donations: donationCount || 0, kgDiverted, runners: runnerCount || 0 });
      setAlreadyApplied((myApp || 0) > 0);
    };
    fetchStats();
  }, [registered]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">Food Sharing Programme</h1>
        <p className="text-sm text-enb-text-secondary mt-1">Community Food Sharing Programme</p>
      </header>

      {/* Hero card */}
      <Card className="bg-gradient-to-br from-enb-green to-enb-teal border-none shadow-lg text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-2xl p-3 shrink-0">
              <Apple className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Every night, restaurants discard 8–15 kg of food.</h2>
              <p className="text-white/80 text-sm mt-2">A hungry rickshaw driver finishes his shift 400 metres away. The Community Food Sharing Programme connects them — with every transaction verified on Solana and every participant rewarded in ENB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: stats.donations.toLocaleString(), label: 'Food Donations', icon: Apple, color: 'text-orange-500', bg: 'bg-orange-50' },
          { value: `${stats.kgDiverted.toFixed(1)} kg`, label: 'From Landfill', icon: Leaf, color: 'text-enb-green', bg: 'bg-enb-green/10' },
          { value: stats.runners.toLocaleString(), label: 'Food Runners', icon: Bike, color: 'text-enb-teal', bg: 'bg-enb-teal/10' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-3 flex flex-col items-center text-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="text-lg font-bold text-enb-text-primary">{s.value}</div>
                <div className="text-xs text-enb-text-secondary leading-tight">{s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Register CTA */}
      {registered || alreadyApplied ? (
        <Card className="border-enb-green/30 bg-enb-green/5 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-enb-green/10 rounded-full p-3 shrink-0">
              <CheckCircle className="w-6 h-6 text-enb-green" />
            </div>
            <div>
              <div className="font-bold text-enb-green">Application Submitted!</div>
              <p className="text-sm text-enb-text-secondary mt-0.5">Your Food Runner application is under review. You'll be notified within 3–5 days.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-orange-100 rounded-full p-2 shrink-0">
                <Bike className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-bold text-enb-text-primary">Become a Food Runner</div>
                <p className="text-sm text-enb-text-secondary mt-0.5">Earn 1,000 ENB per run. Help connect surplus food with people who need it — in your own neighbourhood, tonight.</p>
              </div>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="w-full bg-enb-green text-white hover:bg-enb-green/90 font-bold py-3 rounded-xl"
            >
              <Bike className="w-4 h-4 mr-2" /> Register as Food Runner
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">Requires Helper Tier (5,000 Rep Score)</p>
          </CardContent>
        </Card>
      )}

      {/* How to submit a food sharing action */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Apple className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-enb-text-primary">Already sharing food?</h3>
          </div>
          <p className="text-sm text-enb-text-secondary mb-4">Any community member can earn ENB for food sharing right now. Go to Submit Action and select <strong>Food Sharing</strong> to log your contribution and earn 800 ENB.</p>
          <div className="bg-enb-green/5 rounded-xl p-3 text-sm text-enb-green font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Earn 800 ENB + 300 Rep per verified food sharing action
          </div>
        </CardContent>
      </Card>

      {/* 3 Roles */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-enb-green" /> The Three Roles
          </CardTitle>
          <p className="text-xs text-enb-text-secondary">Every role is ENB-incentivised. Every action is on-chain.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {ROLES.map((role, i) => {
            const Icon = role.icon;
            const isOpen = expandedRole === i;
            return (
              <div key={i} className={`rounded-xl border transition-colors ${isOpen ? 'border-enb-green/30 bg-enb-green/5' : 'border-gray-100'}`}>
                <button
                  onClick={() => setExpandedRole(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.bg}`}>
                      <Icon className={`w-5 h-5 ${role.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm text-enb-text-primary">{role.label}</div>
                      <div className="text-xs text-enb-text-secondary">{role.requirement}</div>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-1">
                        <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wide mb-2">Earnings</p>
                        {role.earnings.map((e, j) => (
                          <div key={j} className="flex items-start gap-2 text-sm text-enb-text-secondary">
                            <span className="text-enb-green mt-0.5 shrink-0">•</span>
                            <span>{e}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 3 Collection Modes */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <Truck className="w-4 h-4 text-enb-teal" /> Three Collection Modes
          </CardTitle>
          <p className="text-xs text-enb-text-secondary">Each food source is assigned its optimal collection mode.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {MODES.map((mode, i) => {
            const Icon = mode.icon;
            const isOpen = expandedMode === i;
            return (
              <div key={i} className={`rounded-xl border transition-colors ${isOpen ? 'border-enb-teal/30 bg-enb-teal/5' : 'border-gray-100'}`}>
                <button
                  onClick={() => setExpandedMode(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode.bg} font-bold text-lg ${mode.color}`}>
                      {mode.mode}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm text-enb-text-primary">Mode {mode.mode} — {mode.label}</div>
                      <div className="text-xs text-enb-text-secondary line-clamp-1">{mode.bestFor}</div>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        <p className="text-sm text-enb-text-secondary">{mode.desc}</p>
                        <div className="bg-white rounded-lg border border-gray-100 p-3 text-xs text-gray-500">
                          <span className="font-bold text-gray-700">Best for: </span>{mode.bestFor}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Priority Waterfall */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Priority Waterfall
          </CardTitle>
          <p className="text-xs text-enb-text-secondary">Food moves through this hierarchy in strict priority order. No edible food goes to landfill while any lower-tier use remains available.</p>
        </CardHeader>
        <CardContent className="space-y-1">

          {/* Critical Time Rule */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-700">⚡ Critical Time Rule</p>
              <p className="text-xs text-red-600 mt-0.5">Cooked food from a restaurant must reach a recipient within <strong>2–4 hours</strong> of preparation. This is a food safety biological reality — not a bureaucratic rule. The CFSP is designed for <strong>same-night redistribution</strong>. The Community Food Hub is a rapid-response distribution point, not a storage facility.</p>
            </div>
          </div>

          {WATERFALL.map((w, idx) => {
            const showTierBadge = idx === 0 || WATERFALL[idx - 1].tierNum !== w.tierNum;
            return (
              <div key={w.tier} className={`flex items-start gap-3 py-3 ${idx < WATERFALL.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${showTierBadge ? w.color : 'bg-transparent border-2 border-dashed border-gray-200'}`}>
                  {showTierBadge ? w.tierNum : ''}
                </div>
                <div className="flex-1 min-w-0">
                  {showTierBadge && (
                    <div className={`font-bold text-sm ${w.textColor}`}>{w.label}</div>
                  )}
                  {w.subLabel && (
                    <div className="text-xs font-semibold text-enb-text-primary mt-0.5">{w.subLabel}</div>
                  )}
                  <div className="text-xs text-enb-text-secondary mt-0.5">{w.recipients}</div>
                  <div className="text-xs font-semibold text-enb-green mt-1.5 flex items-center gap-1">
                    🌿 {w.reward}
                  </div>
                  {w.note && (
                    <div className="text-xs text-orange-600 font-medium mt-1 flex items-start gap-1 bg-orange-50 rounded-lg px-2 py-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> {w.note}
                    </div>
                  )}
                  {w.urgent && (
                    <div className="text-[10px] text-red-500 font-medium mt-1">⚡ 2–4 hour delivery window</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Three-Point Safety Check */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-enb-text-primary mb-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-enb-green" /> Three-Point Safety Check — Mandatory at Every Intake
            </p>
            <div className="space-y-1.5">
              {[
                { num: 1, method: 'SIGHT — Visual Inspection', pass: 'Colour correct, no visible mould, container clean, sealed packaging intact', fail: 'Any visible mould, discolouration, or broken seal → immediate rejection' },
                { num: 2, method: 'SMELL — Olfactory Test', pass: 'Fresh or neutral smell', fail: 'Any sour, fermented, or off odour in cooked food → immediate rejection' },
                { num: 3, method: 'TIME — Freshness Assessment', pass: 'Cooked within last 4hrs → human distribution. 4–8hrs → animal feed only', fail: 'Over 8hrs → composting only. Expired packaged goods → composting' },
              ].map(c => (
                <div key={c.num} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                  <span className="font-bold text-enb-text-primary">Check {c.num}: {c.method}</span>
                  <div className="flex gap-3 mt-1">
                    <span className="text-enb-green font-medium">✓ {c.pass}</span>
                  </div>
                  <div className="text-red-500 mt-0.5">✗ {c.fail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-1 border-t border-gray-100 text-xs text-gray-400 flex items-start gap-2">
            <Leaf className="w-3.5 h-3.5 text-enb-green shrink-0 mt-0.5" />
            Every kilogram diverted generates an on-chain carbon offset record — feeding ENB's Verra VCS carbon credit methodology currently in development.
          </div>
        </CardContent>
      </Card>

      {/* Food source timing guide */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-enb-text-primary flex items-center gap-2">
            <MapPin className="w-4 h-4 text-enb-green" /> When to Collect — By Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { source: 'Restaurant / Dhaba', time: '8–10 PM', window: '2–4 hrs', urgent: true },
              { source: 'Bakery', time: '5–7 PM', window: '6–12 hrs', urgent: false },
              { source: 'School / Office Canteen', time: '1–2 PM', window: '2–3 hrs', urgent: true },
              { source: 'Street Fruit/Veg Vendor', time: '6–7 PM', window: '4–8 hrs', urgent: false },
              { source: 'Wholesale Market', time: '4–6 AM', window: '6–24 hrs', urgent: false },
              { source: 'Milkman / Dairy', time: '7–9 AM', window: '24–48 hrs', urgent: false },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="text-enb-text-primary font-medium">{row.source}</span>
                <div className="text-right">
                  <div className="text-xs text-enb-text-secondary">{row.time}</div>
                  <div className={`text-xs font-bold ${row.urgent ? 'text-red-500' : 'text-enb-green'}`}>
                    {row.urgent ? '⚡ ' : ''}{row.window}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registration modal */}
      <AnimatePresence>
        {showModal && (
          <RegisterModal
            onClose={() => setShowModal(false)}
            onSuccess={() => { setShowModal(false); setRegistered(true); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
