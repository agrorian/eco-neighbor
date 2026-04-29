import { useState, useMemo } from 'react';
import { Search, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// ── 64 ENB Terms — Plain language definitions ─────────────────────────────────
interface GlossaryTerm {
  term: string;
  urdu?: string;
  definition: string;
}

interface GlossaryCategory {
  category: string;
  emoji: string;
  terms: GlossaryTerm[];
}

const GLOSSARY: GlossaryCategory[] = [
  {
    category: 'Token Terms',
    emoji: '🪙',
    terms: [
      {
        term: '$ENB',
        definition: 'The official ticker symbol for the Eco-Neighbor token. When you see $ENB, it refers to the token in general — the digital currency that powers the Eco-Neighbor ecosystem.',
      },
      {
        term: 'ENB.LOCAL',
        definition: 'The version of ENB you earn by doing verified civic actions. It stays within the community — you cannot trade it on an exchange. You spend it at partner businesses via SWAP. Always shown as whole numbers (no decimals).',
      },
      {
        term: 'ENB.GLOBAL',
        definition: 'The tradeable version of ENB that exists on the Solana blockchain. You can only access ENB.GLOBAL through the Maturation Bridge (for founding contributors) or the Business Liquidity Gate (for qualifying businesses). It can be bought and sold on Raydium DEX.',
      },
      {
        term: 'SWAP (Sustainable Work Achieves Prosperity)',
        definition: 'The act of exchanging your ENB.LOCAL at a partner business in return for goods or services. A SWAP is what happens when the shopkeeper scans your QR code and accepts your ENB. We say SWAP, not "redemption" — your work achieved something, you are not "redeeming" a coupon.',
      },
      {
        term: 'Metamorphosis',
        definition: 'The word used when ENB.LOCAL converts into ENB.GLOBAL. Like a caterpillar becoming a butterfly — the token changes form permanently. This only happens through the Maturation Bridge and is irreversible.',
      },
      {
        term: 'Maturation Bridge',
        definition: 'The mechanism that allows founding contributors to convert a portion of their ENB.LOCAL into ENB.GLOBAL. It has strict rules: a 12-month cliff, a 25% lifetime cap, maximum 2 conversion events, and a minimum 3-year gap between events.',
      },
    ],
  },
  {
    category: 'Pool & Treasury Terms',
    emoji: '🏦',
    terms: [
      {
        term: 'Community Rewards Pool (CRP)',
        definition: 'The largest pool — 50% of all ENB (5 billion tokens). This is the only source of ENB rewards for verified civic actions. It is exclusively for community members and is never used for anything else. It does not get replenished.',
      },
      {
        term: 'Business Partner Reserve (BPR)',
        definition: '15% of all ENB (1.5 billion tokens). Reserved for onboarding partner businesses who accept ENB.LOCAL via SWAP. Businesses that join the network can receive ENB from this pool to support their participation.',
      },
      {
        term: 'ENB.GLOBAL Liquidity Pool',
        definition: '10% of all ENB (1 billion tokens). This supports trading on Raydium DEX — it ensures there is always enough ENB available for buyers and sellers to trade without large price swings.',
      },
      {
        term: 'Impact Grants & Marketing',
        definition: '10% of all ENB (1 billion tokens). Used for grants (Gitcoin, Giveth, GreenPill) and marketing efforts. This pool helps grow the ecosystem and fund civic impact initiatives.',
      },
      {
        term: 'Founding Contributor Pool (FCP)',
        definition: '5% of all ENB (500 million tokens). Allocated to the founding team — the people who built Eco-Neighbor. All FCP tokens have a 12-month cliff and a 36-month vesting schedule. No founding contributor can access their tokens before Month 12.',
      },
      {
        term: 'Development Fund',
        definition: '5% of all ENB (500 million tokens). Reserved for technical development — app improvements, blockchain infrastructure, developer fees, and platform maintenance.',
      },
      {
        term: 'Emergency Reserve',
        definition: '5% of all ENB (500 million tokens). A safety net held for ecosystem emergencies — security incidents, market crises, or unforeseen events that require rapid response. Not to be touched under normal circumstances.',
      },
      {
        term: 'Community Treasury',
        definition: 'On every SWAP transaction, 10% of the ENB spent is automatically routed to the Community Treasury. This is split into 5 sub-pools that fund ecosystem stability. It is the self-sustaining financial engine of Eco-Neighbor.',
      },
      {
        term: 'Business Stability Fund',
        definition: 'One of the 5 Community Treasury sub-pools — receives 2% of every SWAP. Used to support partner businesses during difficult periods and ensure they remain active in the ENB network.',
      },
      {
        term: 'Market Making & Liquidity',
        definition: 'One of the 5 Community Treasury sub-pools — receives 1.3% of every SWAP. Used to maintain healthy ENB.GLOBAL trading conditions on Raydium DEX.',
      },
      {
        term: 'Insurance & Incident Pool',
        definition: 'One of the 5 Community Treasury sub-pools — receives 1.3% of every SWAP. Used to cover costs from fraud incidents, security breaches, or verified disputes.',
      },
      {
        term: 'Reserve Buffer',
        definition: 'One of the 5 Community Treasury sub-pools — receives 2% of every SWAP. A general-purpose reserve for unexpected ecosystem needs not covered by other pools.',
      },
      {
        term: 'Strategic Partnership Reserve (SPR)',
        definition: '75 million ENB within the Founding Contributor Pool. Reserved for strategic partners — organizations or individuals who bring significant value to the ecosystem. Maximum 5 million ENB per partner.',
      },
      {
        term: 'Community Growth Reserve (CGR)',
        definition: '35 million ENB within the Founding Contributor Pool. Used for milestone bonuses — when a community member reaches Helper, Guardian, Pillar, or Founder Tier, they receive a one-time CGR bonus. The programme ends permanently when this pool runs out.',
      },
    ],
  },
  {
    category: 'People & Roles',
    emoji: '👥',
    terms: [
      {
        term: 'Visionary Founder',
        definition: 'Muhammad Faisal Khan — the founder of Eco-Neighbor. The Visionary Founder holds 20% of the Founding Contributor Pool (100 million ENB), subject to the same 12-month cliff and vesting schedule as all other contributors. No exceptions.',
      },
      {
        term: 'Neighborhood Anchor',
        definition: 'An honorary community leadership role. There are 10 Neighborhood Anchors — respected members of the community who help hold the neighborhood together. They receive 1 million ENB each (2% of FCP total) as recognition. They do not manage money and do not have admin authority.',
      },
      {
        term: 'Moderator',
        definition: 'A community member who reviews civic action submissions and decides whether to approve or reject them. The system uses Dual Blind Moderation — two moderators review the same submission independently without knowing who the other is. Moderators earn 500 ENB per approval and 200 ENB per rejection.',
      },
      {
        term: 'Food Runner',
        definition: 'A CFSP volunteer role. Food Runners collect surplus food from donors (restaurants, bakeries, vendors) and deliver it to the Community Food Hub or directly to Priority Recipients. Requires Helper Tier and access to a vehicle. Earns ENB per delivery.',
      },
      {
        term: 'Food Guardian',
        definition: 'A CFSP volunteer role. The Food Guardian oversees food safety and distribution at the Community Food Hub. They conduct the mandatory Three-Point Safety Check on every food donation before it is distributed. Requires Guardian Tier.',
      },
      {
        term: 'Food Donor',
        definition: 'Anyone who donates surplus food to the CFSP — restaurants, bakeries, street vendors, households, schools. Donors earn ENB based on which tier their food reaches in the Priority Waterfall.',
      },
      {
        term: 'Founding Business Partner',
        definition: 'A business that joins the ENB network before the public launch. Founding Business Partners get preferential ENB terms from the Business Partner Reserve and are listed in the Business Directory as early adopters.',
      },
      {
        term: 'Founding Member',
        definition: 'A community member who registers on the ENB app before the public launch. Founding Members may be eligible for Community Growth Reserve milestone bonuses and early access to governance features.',
      },
    ],
  },
  {
    category: 'Reputation & Governance',
    emoji: '⭐',
    terms: [
      {
        term: 'Reputation Score',
        definition: 'A cumulative score earned through verified civic actions. Every approved submission adds Rep to your score. Rep cannot be taken away. It determines your Tier, your access to features, and your influence in governance.',
      },
      {
        term: 'Newcomer 🌱',
        definition: 'The starting tier for all new members. Reputation score: 0 to 4,999. You can submit civic actions, earn ENB, and use SWAP at partner businesses.',
      },
      {
        term: 'Helper 🌿',
        definition: 'Tier unlocked at 5,000 Rep. Enables: Food Runner registration, access to advanced civic actions, Community Growth Reserve milestone bonus of 5,000 ENB.',
      },
      {
        term: 'Guardian 🌳',
        definition: 'Tier unlocked at 20,000 Rep. Enables: ability to vouch for new members, Food Guardian role, access to governance proposals, Community Growth Reserve milestone bonus of 7,500 ENB.',
      },
      {
        term: 'Pillar ⭐',
        definition: 'Tier unlocked at 50,000 Rep. Enables: full governance participation, Maturation Bridge access (for qualifying contributors), Business Liquidity Gate access, Community Growth Reserve milestone bonus of 10,000 ENB.',
      },
      {
        term: 'Founder Tier 🏆',
        definition: 'The highest tier, unlocked at 100,000 Rep. Enables: co-governance of the ecosystem, DAO seat, all previous tier benefits. Community Growth Reserve milestone bonus of 10,000 ENB (same as Pillar).',
      },
      {
        term: 'Dual Blind Moderation',
        definition: 'The fairness system for reviewing submissions. Two independent moderators each review the same submission separately, without knowing who the other moderator is or what they decided. If they agree, the decision stands. If they disagree, the case escalates to a Senior Moderator.',
      },
      {
        term: 'Quorum',
        definition: 'The minimum number of community members who must participate in a governance vote for the result to be valid. If fewer than the quorum threshold vote, the proposal is deferred. Prevents a small group from making decisions for the whole community.',
      },
    ],
  },
  {
    category: 'Submission & Verification',
    emoji: '📸',
    terms: [
      {
        term: 'Civic Action',
        definition: 'Any verified community contribution that earns ENB. Examples: cleaning your street, planting a tree, reporting a pothole, carpooling, sharing food, teaching a skill. Civic actions must be photographed as live proof — no old photos accepted.',
      },
      {
        term: 'Transformation Action',
        definition: 'A civic action that physically changes a location over time — requiring both a Before photo and an After photo. Examples: Neighbourhood Cleanup, Tree Planting, Community Painting. The After photo can only be submitted 4 hours after the Before photo.',
      },
      {
        term: 'Reporting Action',
        definition: 'A civic action that documents a problem at a point in time — a single photo submission. Examples: reporting a pothole, reporting illegal dumping. These feed the Community Issues Board where other members can submit resolutions.',
      },
      {
        term: 'Before Submission',
        definition: 'Stage A of a Transformation Action. You photograph the location before you do the work — showing the problem or the starting condition. The GPS is locked, the timestamp is locked, and gallery uploads are blocked. You must use the live camera.',
      },
      {
        term: 'After Submission',
        definition: 'Stage B of a Transformation Action. After at least 4 hours have passed, you return to the same location (within 20 metres) and photograph the result of your work. Gemini AI compares the Before and After photos to verify a real change occurred.',
      },
      {
        term: 'Proof of Work',
        definition: 'The evidence you submit with a civic action — photos, GPS location, and timestamp. Proof of Work is what moderators and AI review to decide if ENB should be awarded. It must be genuine, live, and taken at the actual location.',
      },
      {
        term: 'Proof of Impact',
        definition: 'A Phase 2 concept. Where Proof of Work shows that you did something, Proof of Impact will show that it made a lasting difference — sustained change over weeks or months. Not yet built in the app.',
      },
      {
        term: 'Genesis Block',
        definition: 'The official start date of the Eco-Neighbor live ecosystem. All records, rewards, and civic contributions begin from this date. Everything before the Genesis Block is pilot/test data.',
      },
      {
        term: 'Camera Lock',
        definition: 'A technical restriction that prevents users from uploading photos from their phone gallery. All civic action photos must be taken live through the app\'s camera at the time of the action. This prevents old or fake photos from being submitted.',
      },
      {
        term: 'GPS Pin Lock',
        definition: 'The GPS coordinates are captured automatically at the moment you take your photo. You cannot manually enter or alter the location. This verifies that the photo was taken at the actual civic action location.',
      },
    ],
  },
  {
    category: 'Programme Terms',
    emoji: '🍱',
    terms: [
      {
        term: 'Community Food Sharing Programme (CFSP)',
        definition: 'The ENB food redistribution programme. Surplus food from restaurants, bakeries, and households is collected and distributed to community members in need — same night, in strict priority order. Note: "Programme" uses British spelling — this is locked and never changed.',
      },
      {
        term: 'CFSP Priority Waterfall',
        definition: 'The 5-tier order in which food is distributed. T1a: direct human consumption (workers, elderly, homeless). T1b: schools and orphanages (Paediatric Safety Standard). T2: community kitchen. T3: processed/value-added. T4: animal feed. T5: composting/biogas. Food always moves to the highest tier that can absorb it.',
      },
      {
        term: 'Pediatric Safety Standard',
        definition: 'The strict food safety requirement for Tier 1b deliveries to schools and orphanages. Cooked food must be prepared within 2 hours (not 4). Must be in a covered insulated container. Must be a nutritionally complete meal. An allergen log must be maintained. No exceptions.',
      },
      {
        term: 'Business Liquidity Gate',
        definition: 'The mechanism that allows qualifying partner businesses to convert accumulated ENB.LOCAL into ENB.GLOBAL. Available to Pillar Tier businesses that meet specific criteria. Different from the Maturation Bridge which is for founding contributors.',
      },
      {
        term: 'Community Issues Board',
        definition: 'The board inside the app showing all approved civic reports (potholes, dumping sites, broken infrastructure). Community members can see open issues near them and submit resolution photos to earn ENB when issues are fixed. Phase 1 is live in the app.',
      },
      {
        term: 'Resolution Submission',
        definition: 'A photo submission proving that a previously reported civic issue has been fixed. Any community member (except the original reporter) can submit a resolution. Earns 300 ENB + 150 Rep once approved by moderators. The original report is then marked Resolved.',
      },
    ],
  },
  {
    category: 'Technical Terms',
    emoji: '⚙️',
    terms: [
      {
        term: 'ENB-CSU Basket',
        definition: 'Community Stability Unit. A basket of everyday goods used to measure ENB\'s real-world value — 1,000 ENB is pegged in spirit to the cost of a roti + paratha + chai in Rawalpindi. This keeps ENB grounded in local economic reality rather than speculation.',
      },
      {
        term: 'Solana SPL Token-2022',
        definition: 'The blockchain standard that ENB is built on. Solana is chosen for its low transaction fees (fractions of a cent) and high speed. SPL Token-2022 is the specific technical standard that supports the ENB.LOCAL/ENB.GLOBAL dual-token design.',
      },
      {
        term: 'Atomic Burn-and-Mint',
        definition: 'The on-chain process of converting ENB.LOCAL to ENB.GLOBAL. The ENB.LOCAL tokens are permanently destroyed ("burned") and an equivalent amount of ENB.GLOBAL is created ("minted") in a single transaction. It cannot be reversed.',
      },
      {
        term: 'PDA (Program Derived Address)',
        definition: 'A special Solana blockchain address that holds the mint authority for ENB. It is controlled by code (a smart contract), not by any single person. This prevents anyone — including the founder — from printing new ENB tokens unilaterally.',
      },
      {
        term: 'RLS (Row Level Security)',
        definition: 'The database access control system used in Supabase. RLS rules ensure that each user can only see and edit their own data. For example, you cannot see another user\'s CNIC photo or wallet balance. Admins and moderators have additional access appropriate to their role.',
      },
      {
        term: 'DEX (Decentralised Exchange)',
        definition: 'A trading platform where ENB.GLOBAL can be bought and sold without a central intermediary. Eco-Neighbor uses Raydium, a DEX built on Solana. Anyone with a Solana wallet can trade ENB.GLOBAL on Raydium once it is listed.',
      },
      {
        term: 'Verra VCS',
        definition: 'Verified Carbon Standard — the leading international methodology for certifying carbon credits. ENB is developing a carbon credit methodology under Verra VCS, meaning that civic actions (tree planting, food diversion from landfill) could generate verified carbon credits that can be sold on carbon markets.',
      },
      {
        term: 'Gemini AI Review',
        definition: 'The AI system (Google Gemini 2.0 Flash) that reviews Before and After photos for Transformation Actions. It compares the two photos and gives a verdict: approve, reject, or uncertain. High-confidence results are processed automatically. Uncertain cases go to human moderators.',
      },
    ],
  },
  {
    category: 'Branding & Communication',
    emoji: '📢',
    terms: [
      {
        term: 'SWAP',
        definition: 'Sustainable Work Achieves Prosperity. This is the word used for exchanging ENB.LOCAL at a partner business. Never say "redeem" or "redemption" — the word SWAP reflects the values of the ecosystem: your work achieved this.',
      },
      {
        term: '#ReFi (Regenerative Finance)',
        definition: 'The category that Eco-Neighbor belongs to. ReFi uses financial tools to regenerate communities and ecosystems — not just to extract profit. Eco-Neighbor is always described as #ReFi. Never #DeFi, which implies speculation and trading.',
      },
      {
        term: 'ENB DNA',
        definition: 'The core values and principles that define every ENB decision: community first, anti-speculation, proof of real work, hyper-local before global, informal economy workers are the primary beneficiaries. When in doubt about any decision, check it against the ENB DNA.',
      },
      {
        term: 'Urdu Tagline',
        definition: 'آپ کی محنت کی قدر ہے — meaning "Your neighborhood work has value" (or more literally: "Your hard work is valued"). This is the emotional core of the ENB message in Urdu. It is canonical and never changes.',
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Glossary() {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['Token Terms']));

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return GLOSSARY;
    return GLOSSARY
      .map(cat => ({
        ...cat,
        terms: cat.terms.filter(
          t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q),
        ),
      }))
      .filter(cat => cat.terms.length > 0);
  }, [search]);

  const totalTerms = GLOSSARY.reduce((sum, c) => sum + c.terms.length, 0);

  // When searching, expand all matching categories
  const effectiveOpen = search.trim()
    ? new Set(filtered.map(c => c.category))
    : openCategories;

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-enb-green" />
          ENB Glossary
        </h1>
        <p className="text-sm text-enb-text-secondary mt-0.5">
          {totalTerms} terms — plain language definitions for every ENB concept
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search terms or definitions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No terms match "{search}"</p>
          <p className="text-xs mt-1">Try a different word</p>
        </div>
      )}

      {/* Category accordions */}
      {filtered.map(cat => {
        const isOpen = effectiveOpen.has(cat.category);
        return (
          <Card key={cat.category} className="border-gray-100 shadow-sm overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat.category)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{cat.emoji}</span>
                <div className="text-left">
                  <p className="font-bold text-enb-text-primary text-sm">{cat.category}</p>
                  <p className="text-xs text-gray-400">{cat.terms.length} term{cat.terms.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {isOpen
                ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>

            {/* Terms list */}
            {isOpen && (
              <CardContent className="px-4 pb-4 pt-0 space-y-4 border-t border-gray-100">
                {cat.terms.map((t, idx) => (
                  <div
                    key={t.term}
                    className={`pt-4 ${idx > 0 ? 'border-t border-gray-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-enb-text-primary text-sm leading-tight">{t.term}</h3>
                      {t.urdu && (
                        <span className="text-xs text-enb-green font-medium text-right flex-shrink-0" dir="rtl">
                          {t.urdu}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-enb-text-secondary leading-relaxed">{t.definition}</p>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Footer note */}
      <div className="text-center text-xs text-gray-400 pb-4">
        <p>Eco-Neighbor ($ENB) · Glossary v1.0 · {totalTerms} canonical terms</p>
        <p className="mt-0.5">All definitions are locked to the ENB canonical spec.</p>
      </div>
    </div>
  );
}
