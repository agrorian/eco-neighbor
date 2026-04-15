import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import ENBLeaf from '@/components/ENBLeaf';
import { ArrowLeft, BookOpen, Code2, ExternalLink } from 'lucide-react';

// ── Data ─────────────────────────────────────────────────────────────────────

const WHITEPAPER_VERSIONS = [
  {
    version: "v1.0", date: "Feb 2026", type: "INITIAL",
    title: "Project Foundation",
    summary: "First articulation of the core concept: a hyper-local community utility token rewarding daily-wage workers for verified civic actions in Rawalpindi, Pakistan. Defined the problem — 3.4 billion informal economy workers are economically invisible despite contributing essential urban labour."
  },
  {
    version: "v2.0", date: "Mar 2026", type: "MAJOR",
    title: "Dual-Layer Architecture + Maturation Bridge",
    summary: "Introduced ENB.LOCAL (non-tradeable community token) and ENB.GLOBAL (tradeable impact investment layer) as permanently separated instruments. Added the Maturation Bridge — a one-way valve requiring 365-day hold + 50,000 Rep Score before any conversion. 9-decimal precision on Solana added."
  },
  {
    version: "v3.0", date: "Mar 2026", type: "MAJOR",
    title: "Universal Referral Programme + Profession Ecosystem",
    summary: "Added the Universal Referral Programme with tiered bonuses. Expanded profession-specific earning cards across 8 categories covering 30+ trades. Street restaurant and painter/mason directory fixes applied."
  },
  {
    version: "v4.0", date: "Mar 2026", type: "MAJOR",
    title: "Community Food Sharing Programme (CFSP)",
    summary: "Largest single addition in ENB history. Complete food redistribution system: Community Food Hubs, Food Runners, 5-tier Priority Waterfall, food safety protocols, CFG guardian role, and full ENB reward schedule for donors, runners, and recipients."
  },
  {
    version: "v4.1–v4.2", date: "Mar 2026", type: "FIX",
    title: "Vesting Corrections + Pakistan Field Strategy",
    summary: "Vesting cliff corrected from 6 months to 12 months for alignment with the Maturation Bridge. Added Part VI: Pakistan Field Strategy — three case studies covering multi-neighbourhood expansion, token flow mechanics, and cash economy adoption."
  },
  {
    version: "v4.3", date: "Mar 2026", type: "FEATURE",
    title: "Founding Contributor Restructure",
    summary: "Replaced the '100 founding members' model with 10 defined Founding Members (specific roles and obligations) + 10 Founding Business Partners. AI Design Acknowledgement added — ENB's collaborative AI development disclosed transparently."
  },
  {
    version: "v4.4", date: "Mar 2026", type: "FIX",
    title: "Arithmetic Correction + Version History Added",
    summary: "Founding member percentages rebalanced to exactly 100% of the 500M Founding Pool. Vesting schedule corrected to 36-month total. Document Version History added as permanent appendix."
  },
  {
    version: "v4.5", date: "Mar 2026", type: "FEATURE",
    title: "Web App Replaces Telegram Bot",
    summary: "Telegram Bot (Make.com + Google Sheets) replaced by the ENB Web App (Vercel + Supabase + Cloudinary) as the primary user-facing platform. Provides structured data ownership, investor credibility, and photo evidence trail for carbon credits."
  },
  {
    version: "v4.6", date: "Mar 2026", type: "FEATURE",
    title: "WhatsApp Replaces Telegram",
    summary: "Telegram replaced by WhatsApp as ENB's community channel — Telegram is government-banned in Pakistan. WhatsApp Community Groups architecture adopted. Database updated from telegram_id to whatsapp_number."
  },
  {
    version: "v4.7", date: "Mar 2026", type: "MAJOR",
    title: "Nine Major Upgrades — Supply, Verification & Accountability",
    summary: "Supply increased from 1B to 10B ENB. 7-Layer Submission Verification Stack built. Responsibility Dashboard with vesting consequences for inactivity. Maturation Bridge formally specified. Auto-Replenishment Protocol for business partner floats. ENB-CSU basket defined: 1,000 ENB = roti + paratha + chai."
  },
  {
    version: "v4.8", date: "Mar 2026", type: "MAJOR",
    title: "Ten Confirmed Decisions — Governance & Tokenomics",
    summary: "Emergency Reserve confirmed at 5%. Community Growth Reserve restructured as meritocratic tier milestone bonuses for all members. 10 Neighborhood Anchors replacing single elder. Maturation Bridge updated to 25% lifetime cap. 50 Founding Business Partners across 10 categories. Development Fund wording made vendor-agnostic."
  },
  {
    version: "v4.9", date: "Mar 2026", type: "CURRENT",
    title: "CFSP Priority Waterfall Restructured",
    summary: "Schools and orphanages elevated from Tier 3 to Tier 1 (sub-category of Direct Human Consumption) with Pediatric Safety Standard. New Tier 3 = Processed & Value-Added Use (pickling, preservation, cooking classes). All tiers renumbered. Reward schedule updated."
  }
];

const APP_VERSIONS = [
  {
    version: "v0.1.0", date: "10 Mar 2026", type: "INITIAL",
    title: "Project Initialisation",
    summary: "React 19 + Vite 6 + Tailwind CSS 4 + Supabase bootstrapped. Basic email/password auth. ENB token constants defined. Vercel deployment configured."
  },
  {
    version: "v0.2.0", date: "13 Mar 2026", type: "FEATURE",
    title: "Moderation System + Fraud Reporting",
    summary: "Dual blind moderator review with 30-second minimum timer. Mod pair rotation trigger. Moderator compensation (500 ENB approve / 200 ENB reject). Escalation queue. Fraud reporting system v2 with dynamic stake and GPS neighbourhood cross-check."
  },
  {
    version: "v0.3.0", date: "13 Mar 2026", type: "FEATURE",
    title: "My History + Transaction History + ENB Logo",
    summary: "My History page with submission cards and status badges. Transaction history with styled MODERATOR_REWARD entries. Real ENB leaf logo deployed across all screens and PWA icons."
  },
  {
    version: "v0.4.0", date: "13 Mar 2026", type: "FEATURE",
    title: "Airdrop Cap + GPS Cross-Check + Admin Tools",
    summary: "Admin airdrop capped with public audit log. GPS neighborhood cross-check flags submissions outside registered area. Admin password reset tool added."
  },
  {
    version: "v0.5.0", date: "13 Mar 2026", type: "FEATURE",
    title: "Multi-Account Switcher",
    summary: "Switch between multiple logged-in accounts without re-entering passwords. Sessions stored via Supabase tokens only. Available on desktop sidebar and mobile nav."
  },
  {
    version: "v0.6.0", date: "13 Mar 2026", type: "FEATURE",
    title: "CAPTCHA Pool + Mod Collusion Watch",
    summary: "Behavioural CAPTCHA expanded to 15 bilingual Urdu/English questions with randomised positions. Mod Collusion Watch card in admin dashboard flags pairs with 80%+ agreement rate."
  },
  {
    version: "v0.7.0", date: "19 Mar 2026", type: "FEATURE",
    title: "Referral System + Auto-Approval Trigger + Fi.co",
    summary: "Universal Referral Programme fixed end-to-end: URL param capture, DB persistence, immediate escrow payout on first approved action. Auto-approval DB trigger rebuilt. Fi.co Pakistan Core Program 2026 acceptance confirmed."
  },
  {
    version: "v0.8.0", date: "20 Mar 2026", type: "FIX",
    title: "Root Cause Fix — Silent Approval Failures",
    summary: "Discovered and fixed the root cause of silent approve_submission failures (wrong column names since Day 1). Real-time balance updates via Supabase subscriptions. jsPDF Daily Log PDF download fixed. All 13 stuck submissions approved."
  },
  {
    version: "v0.9.0", date: "22 Mar 2026", type: "FEATURE",
    title: "Business Partner System + Onboarding Team",
    summary: "Complete business partner UI: dashboard, offers (discount + ENB Swap), history, settings. Onboarding team role and volunteer application queue. PartnerManager rebuilt with full Add Partner flow. BusinessDirectory with Leaflet.js map and clickable pins."
  },
  {
    version: "v0.10.0", date: "23 Mar 2026", type: "FEATURE",
    title: "Escalation Queue + Daily Log Reports + Profile Photos",
    summary: "Escalation queue with side-by-side mod decisions, 45-second timer, 750 ENB reward. My Log rebuilt with Reports tab: weekly/monthly navigation, attendance cards, multi-page PDF download. Profile and business partner photo upload."
  },
  {
    version: "v1.0.0", date: "24 Mar 2026", type: "MAJOR",
    title: "Brand Design System + Tailored Action Forms",
    summary: "Full ENB brand design system: typography scale, color variables, warm surface, shadow scale. Tailored submission forms for all 10 civic action types with custom fields. Dashboard routing fixed. Business partner white screen resolved. Urdu Phase 1 complete."
  },
  {
    version: "v1.1.0", date: "7 Apr 2026", type: "FEATURE",
    title: "Governance Live, CFSP Page, Community Impact v4.9, Bug Reporting Fixes",
    summary: "Governance wired to live DB: real proposals, tier-based voting, quorum tracker, proposal type badges. Dedicated Community Food Sharing Programme page with 3 roles, 3 collection modes, v4.9 Priority Waterfall, and Food Runner registration. Community Impact rebuilt with v4.9 tokenomics and food stats. Desktop sidebar now shows Food Sharing, Community Impact and Governance for all members. Bug reporting fixed: screen source auto-detected, screen_path and source columns added to DB, silent insert failures resolved. telegram_id column dropped from DB."
  },
  {
    version: "v1.2.0", date: "15 Apr 2026", type: "FEATURE",
    title: "CNIC Identity, RLS Security, Full Urdu Translation, Governance Proposals",
    summary: "CNIC identity verification system: optional at signup, ENB locked until admin verified, signed Cloudinary preset for ID photos, Pakistan CNIC auto-format, duplicate detection. Row Level Security enabled on users, submissions, moderator_assignments, redemptions with JWT app_metadata role policies. Custom access token hook deployed. Welcome email via Resend Edge Function. Account Recovery screen. CAPTCHA expanded to 30 questions across 3 categories with 4 options each. Governance Create Proposal UI for admin. All 6 Urdu translation docs applied — full Urdu support across all screens including Settings, Daily Log, Wallet, Bridge, Leaderboard, Directory, Community Impact, Governance, ModQueue. Cancel Redemption QR bug fixed. Admin pending count fixed. ENB/Rep reward state reset bug fixed."
  },
  {
    version: "v1.3.0", date: "15 Apr 2026", type: "CURRENT",
    title: "Real QR Codes, /scan Route, Supabase Security Audit, Registration Drive Materials",
    summary: "Real scannable QR codes in GenerateRedemptionQR and ReferralHub — green on white using qrcode npm library, full URL encoding (eco-neighbor.vercel.app/scan?code=UUID). /scan route auto-populates from URL param — business scans QR with phone camera, app opens directly to confirmation screen. Supabase ground truth audit completed: all RPC signatures, table schemas, triggers, and RLS policies verified against live DB. Three security fixes applied: stale submissions policies dropped (circular reference), business_scan_redemption RLS corrected (business→business_partner), legacy cnic column dropped. Registration drive materials created: 4 English PDFs and 4 Urdu PDFs (Noto Nastaliq Urdu font) — Flyer A5, Registration Guide, Action Reference Card, Business Partner MOU Summary."
  }
];

// ── Helpers ───────────────────────────────────────────────────────────────────

type BadgeType = 'INITIAL' | 'FEATURE' | 'FIX' | 'MAJOR' | 'CURRENT';

function typeBadge(type: BadgeType) {
  const styles: Record<BadgeType, string> = {
    INITIAL:  'bg-gray-100 text-gray-600 border-gray-200',
    FEATURE:  'bg-teal-50 text-teal-700 border-teal-200',
    FIX:      'bg-orange-50 text-orange-600 border-orange-200',
    MAJOR:    'bg-enb-green/10 text-enb-green border-enb-green/30',
    CURRENT:  'bg-enb-gold/10 text-enb-gold-dark border-enb-gold/40',
  };
  return styles[type] || styles.INITIAL;
}

function dotColor(type: BadgeType) {
  const colors: Record<BadgeType, string> = {
    INITIAL:  'bg-gray-300',
    FEATURE:  'bg-enb-teal',
    FIX:      'bg-orange-400',
    MAJOR:    'bg-enb-green',
    CURRENT:  'bg-enb-gold',
  };
  return colors[type] || 'bg-gray-300';
}

// ── Whitepaper timeline ───────────────────────────────────────────────────────

function WhitepaperTimeline() {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-enb-border" />

      <div className="space-y-6">
        {WHITEPAPER_VERSIONS.map((v, i) => {
          const isCurrent = v.type === 'CURRENT';
          return (
            <motion.div
              key={v.version}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative flex gap-5"
            >
              {/* Dot */}
              <div className="relative z-10 flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${dotColor(v.type as BadgeType)}`}>
                  {isCurrent ? (
                    <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  ) : (
                    <span className="text-white font-bold text-[10px]">{v.version.replace('v', '')}</span>
                  )}
                </div>
              </div>

              {/* Card */}
              <div className={`flex-1 rounded-2xl border p-5 shadow-sm mb-1 ${
                isCurrent
                  ? 'border-enb-gold bg-enb-gold/5 shadow-enb-green'
                  : 'border-enb-border bg-white'
              }`}>
                {isCurrent && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-enb-gold animate-pulse" />
                    <span className="text-xs font-bold text-enb-gold uppercase tracking-widest">Current Version</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono font-bold text-enb-green text-sm">{v.version}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeBadge(v.type as BadgeType)}`}>
                    {v.type}
                  </span>
                  <span className="text-xs text-enb-text-muted">{v.date}</span>
                </div>
                <h3 className="font-bold text-enb-text-primary text-base mb-1.5">{v.title}</h3>
                <p className="text-sm text-enb-text-secondary leading-relaxed">{v.summary}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── App build log grid ────────────────────────────────────────────────────────

function AppBuildLog() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {APP_VERSIONS.map((v, i) => {
        const isMajor = v.type === 'MAJOR';
        return (
          <motion.div
            key={v.version}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl border p-5 shadow-sm flex flex-col gap-2 ${
              isMajor
                ? 'border-enb-green/30 bg-enb-green/5'
                : 'border-enb-border bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-enb-green text-sm">{v.version}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeBadge(v.type as BadgeType)}`}>
                {v.type}
              </span>
            </div>
            <div className="text-xs text-enb-text-muted">{v.date}</div>
            <h3 className="font-bold text-enb-text-primary text-sm leading-snug">{v.title}</h3>
            <p className="text-xs text-enb-text-secondary leading-relaxed flex-1">{v.summary}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VersionHistory() {
  const [activeTab, setActiveTab] = useState<'whitepaper' | 'app'>('whitepaper');

  return (
    <div className="min-h-screen bg-enb-surface">
      {/* Header */}
      <div className="bg-white border-b border-enb-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-enb-text-secondary hover:text-enb-green transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="bg-enb-green p-1.5 rounded-lg">
              <ENBLeaf size={20} />
            </div>
            <div>
              <h1 className="font-bold text-enb-text-primary text-base leading-tight">ENB Development History</h1>
              <p className="text-xs text-enb-text-muted">Built in public. Every decision documented.</p>
            </div>
          </div>
          <a
            href="https://eco-neighbor.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-enb-green font-medium flex items-center gap-1 hover:underline"
          >
            Live App <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-0">
          <button
            onClick={() => setActiveTab('whitepaper')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'whitepaper'
                ? 'border-enb-green text-enb-green'
                : 'border-transparent text-enb-text-secondary hover:text-enb-text-primary'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Whitepaper Versions
            <span className="text-xs bg-enb-green/10 text-enb-green px-1.5 py-0.5 rounded-full font-bold">
              {WHITEPAPER_VERSIONS.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'app'
                ? 'border-enb-green text-enb-green'
                : 'border-transparent text-enb-text-secondary hover:text-enb-text-primary'
            }`}
          >
            <Code2 className="w-4 h-4" />
            App Build Log
            <span className="text-xs bg-enb-green/10 text-enb-green px-1.5 py-0.5 rounded-full font-bold">
              {APP_VERSIONS.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {activeTab === 'whitepaper' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-enb-text-primary">Whitepaper Version History</h2>
              <p className="text-sm text-enb-text-secondary mt-1">
                Every major design decision, correction, and expansion — from the first concept to the current canonical version.
              </p>
            </div>
            <WhitepaperTimeline />
          </div>
        )}

        {activeTab === 'app' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-enb-text-primary">App Build Log</h2>
              <p className="text-sm text-enb-text-secondary mt-1">
                Semantic version history of the ENB Web App — from first commit to production launch.
                Built with React 19, Vite 6, Tailwind CSS 4, Supabase, and Vercel.
              </p>
            </div>
            <AppBuildLog />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-enb-border text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-enb-green p-1.5 rounded-lg">
              <ENBLeaf size={16} />
            </div>
            <span className="font-bold text-enb-text-primary">Eco-Neighbor $ENB</span>
          </div>
          <p className="text-xs text-enb-text-muted">
            Starting in Rawalpindi — built to replicate globally.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link to="/" className="text-enb-green hover:underline">Launch App</Link>
            <Link to="/about" className="text-enb-text-secondary hover:text-enb-green">What is ENB?</Link>
            <a href="https://giveth.io/project/eco-neighbor-enb" target="_blank" rel="noopener noreferrer" className="text-enb-text-secondary hover:text-enb-green">Giveth Profile</a>
          </div>
        </div>
      </div>
    </div>
  );
}
