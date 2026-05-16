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
    version: "v4.9", date: "Mar 2026", type: "PREV",
    title: "CFSP Priority Waterfall Restructured",
    summary: "Schools and orphanages elevated from Tier 3 to Tier 1 (sub-category of Direct Human Consumption) with Pediatric Safety Standard. New Tier 3 = Processed & Value-Added Use (pickling, preservation, cooking classes). All tiers renumbered. Reward schedule updated."
  },
  {
    version: "v5.0", date: "Apr 2026", type: "PREV",
    title: "Complete Tokenomics & Governance Redesign",
    summary: "(1) 2% burn replaced by 10% Community Treasury Contribution — self-sustaining from Day 1. (2) Business Liquidity Gate: businesses earn ENB.GLOBAL via atomic burn-and-mint on Solana. (3) Community Treasury Fund: Stability Fund 30%, Market Making 20%, Insurance Pool 20%, Reserve Buffer 30%. (4) Strategic Partnership Reserve: 75,000,000 ENB.GLOBAL for institutional partnerships. (5) Founding Business Partners removed from Founding Pool — earn via Business Liquidity Gate. (6) 10 Neighborhood Anchors become honorary. (7) Founding Pool restructured to 10 positions descending. (8) Executive Summary rewritten. (9) Web App v1.3.0: CNIC identity, real QR codes, Urdu interface, RLS security, Fi.co accepted, Giveth 100/100."
  },
  {
    version: "v6.0", date: "Apr 2026", type: "PREV",
    title: "Auto-Tranche System & Complete Ecosystem Sustainability Architecture",
    summary: "(1) Auto-Tranche: autonomous 10B ENB mint when CRP reaches 10%, infinite, immutable. (2) T2+ distribution locked in Solana smart contract: CRP 70% / BPR 12% / Liquidity 8% / Dev 5% / Emergency 5% — FCP 0% permanently. (3) Mint authority held by PDA smart contract only — NOT human-accessible. (4) SWAP = Sustainable Work Achieves Prosperity — replaces redemption in all user-facing language. (5) Geographic limits removed. (6) Daily action cap locked at 3 per user per day. (7) CRP Tiered Protection Protocol: 5 fully autonomous zones. (8) Supply rationale completely rewritten. (9) All evening corrections applied."
  },
  {
    version: "v6.1", date: "May 2026", type: "PREV",
    title: "Founding Pool Restructure + Geo Corrections",
    summary: "(1) Community Operations Lead seat dissolved — 65M ENB absorbed into Unallocated Reserve (now 240M / 48%). Tech Lead reduced from 65M to 50M (10%). CGR Lead and Legal Lead seats dissolved. Active founding seats reduced to 5. (2) All Rawalpindi geographic references corrected to Karachi as pilot city. False real-users claim removed. (3) 11 instances of neighbourhood corrected to neighborhood (American English). (4) CFSP Priority Waterfall v4.9 propagated."
  },
  {
    version: "v6.2", date: "May 2026", type: "PREV",
    title: "SWAP Model Canonical + ENB Operations Fund First Spec",
    summary: "(1) SWAP distribution locked: 80% CRP / 3.3% BLG / 2% BSF / 1.3% MM / 1.3% Insurance / 2% Reserve Buffer / 10% Ops Fund. No burn. (2) ENB Operations Fund first specified: Stream A 10% T2+ PDA immutable, Stream B 10% SWAP from Day 1. (3) Maturation Bridge conditions first written: 365-day hold + 50,000 Rep + 25% lifetime cap + max 2 events + 3-year gap. (4) Auto-Tranche T2+ corrected: CRP 60% / BPR 12% / Liquidity 8% / Dev 5% / Emergency 5% / Ops Fund 10% / FCP 0% permanently."
  },
  {
    version: "v6.3", date: "May 2026", type: "PREV",
    title: "Maturation Bridge ECP Correction",
    summary: "(1) ECP (Eligible Conversion Pool) formally defined. 25% cap applies to ECP only — tokens individually aged 365+ days from reviewed_at (both mods approved) — NOT total lifetime earnings. (2) 12.5% per event language removed everywhere. Per-event = 25% of current ECP minus prior conversions. (3) Plumber card corrected (was 20%). Milkman card corrected (was 21,600 ENB). (4) Canonical Amina case study: Event 1 Month 18 = 91,000 ENB.GLOBAL. Event 2 Month 54 = 548,000 ENB.GLOBAL. Lifetime = 639,000 ENB.GLOBAL from 4.5 years of verified civic work."
  },
  {
    version: "v6.4", date: "May 2026", type: "CURRENT",
    title: "Three Missing Sections Added",
    summary: "(1) Section 5.7 SWAP model fully rewritten — canonical v6.3 split documented, old v5.x Community Treasury removed. No burn. (2) Section 23 ENB Operations Fund written in full: Stream A (10% T2+ PDA immutable) + Stream B (10% SWAP from Day 1), three spending tiers, Permitted Uses, Absolute Boundaries, ops_fund_ledger Monthly Super Audit. (3) Section 5.7B ENB Captain Carpool System — Captain Onboarding Gate, GPS session, canonical reward formula (Bike 100 ENB/km cap 3K through Bus/Coaster 300 ENB/km cap 20K, passenger multipliers 1.0–2.5, rating multipliers 0.80–1.20), speed thresholds, Public Captain Profile."
  },
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
    version: "v1.3.0", date: "15 Apr 2026", type: "FEATURE",
    title: "Real QR Codes, /scan Route, Supabase Security Audit, Registration Drive Materials",
    summary: "Real scannable QR codes in GenerateRedemptionQR and ReferralHub — green on white using qrcode npm library, full URL encoding (eco-neighbor.vercel.app/scan?code=UUID). /scan route auto-populates from URL param — business scans QR with phone camera, app opens directly to confirmation screen. Supabase ground truth audit completed: all RPC signatures, table schemas, triggers, and RLS policies verified against live DB. Three security fixes applied: stale submissions policies dropped (circular reference), business_scan_redemption RLS corrected (business→business_partner), legacy cnic column dropped. Registration drive materials created: 4 English PDFs and 4 Urdu PDFs (Noto Nastaliq Urdu font) — Flyer A5, Registration Guide, Action Reference Card, Business Partner MOU Summary."
  },
  {
    version: "v1.4.0", date: "24 Apr 2026", type: "PREV",
    title: "Before/After Verification System + AI Photo Review + reCAPTCHA v3",
    summary: "(1) Before/After submission system for transformation actions (Neighbourhood Cleanup, Tree Planting, Community Painting, Infrastructure Repair, Community Garden, Drain Unclogging) — 4-hour minimum wait enforced, GPS drift check within 100m, camera-lock on all photos. (2) Three-tier moderation pipeline: Gemini AI auto-approve/reject at ≥0.85 confidence, human mod queue for uncertain cases — scales to 100,000+ users without moderator collapse. (3) Gemini 2.0 Flash AI review compares Before and After photos with action-type context, returns verdict + reason + confidence score stored on submission record. (4) Google reCAPTCHA v3 invisible replaces hand-built quiz CAPTCHA — behavioural fraud detection, zero friction for real users. (5) Submission Detail page at /submission/:id — Before section locked and read-only, live HH:MM:SS countdown timer, After section unlocks at timer zero. (6) My History updated — Stage B records filtered from list, after-phase status badges (⏳ waiting / 🟢 ready / ✅ complete). (7) ModQueue updated — PairedSubmissionView shows Before and After photos side-by-side with GPS drift badge, time delta, and AI verdict. (8) DB migration: 9 new columns on submissions (submission_phase, after_unlocks_at, after_submitted, after_submission_id, parent_submission_id, gps_out_of_range, ai_review_verdict, ai_review_reason, ai_review_confidence)."
  },
  {
    version: "v1.4.1", date: "26 Apr 2026", type: "PREV",
    title: "Before/After System — Full Debug & Completion",
    summary: "(1) Camera black screen fixed in ActionForm and AfterPhotoSubmission — root cause was srcObject being assigned before the <video> element mounted in DOM; fixed with useEffect + onloadedmetadata, shutter disabled until videoReady, capturePhoto guards against zero-dimension frames. (2) Quiz CAPTCHA (30 questions) reverted by previous session was restored to invisible Google reCAPTCHA v3 using VITE_RECAPTCHA_SITE_KEY. (3) After submission race condition fixed — onSuccess() now only fires after both INSERT and Before row UPDATE are confirmed, eliminating the stale after_submitted = false re-fetch. (4) RLS policies corrected — missing UPDATE policy added (auth.uid() = user_id), duplicate INSERT policies consolidated, mark_before_submitted() SECURITY DEFINER RPC created as fallback for silent RLS failures. (5) Same moderators now assigned to After submissions — AfterPhotoSubmission copies mod1_id/mod2_id from Before assignment; DB trigger updated to skip submission_phase = 'after' rows entirely. (6) ModQueue phase routing fixed — After assignments now resolve to their Before parent record; deduplication prevents same action appearing twice; decisions locked until After confirmed in DB via onAfterResolved callback (bypasses stale flag). (7) ModQueue header now shows separate Before and After dates instead of always showing Before date. (8) SubmissionDetail infinite spinner fixed — replaced .single() (crashes on multiple rows) with direct fetch by after_submission_id + .maybeSingle() fallback. (9) My History button text now reflects state: View Details (timer running) / Submit After Photos Now (unlocked) / View Submission · Locked & Logged (complete). (10) Locked & Logged UI added to SubmissionDetail — both Before and After cards show Lock icon + exact timestamp; After card shows green Logged & Locked confirmation strip with full date/time and review status badge."
  },
  {
    version: "v1.5.0", date: "30 Apr 2026", type: "PREV",
    title: "Messaging System, Rich Text Editor, @Mentions, Org Structure, Location Picker & Admin Tools",
    summary: "(1) MESSAGING SYSTEM COMPLETE — L2 Broadcast Announcements (SA targeting by role), L3 Direct Messages (WhatsApp-style, online status, gray/blue read receipts), L4 User Inbox with realtime + unread bell badge, L5 Channels (create/generate from org structure, posting modes: open/moderated/admin-only). (2) RICH TEXT EDITOR — Tiptap v3 shared RichTextEditor component across Channels, DMs, and Announcements: block formats, bold/italic/underline/strike/highlight/code, bullet/numbered/task lists, alignment, link, undo/redo, word+char count, Ctrl+Enter to send. (3) @MENTION SYSTEM — type @ to tag any member, cascading dropdown with avatar + role, mention notifications to Inbox, bell count increments. (4) CHANNEL ROLES — 4-tier: Super Admin / Admin / Moderator / Member. Role selector in ChannelInfoPanel, RLS policies for channel_members. (5) ORG STRUCTURE BUILDER — recursive regions tree, departments, org roles with 22 permission toggles, member assignment matrix. Pakistan + 7 provinces seeded. (6) LOCATION PICKER — 195 countries, Pakistan full hierarchy (7 provinces, 100+ cities), free-text neighbourhood. src/data/locations.ts. Wired into Signup and Edit Profile. (7) CENTRAL CONSTANTS — src/lib/constants.ts: 48 professions, business categories, user tiers, user roles. (8) EDIT USER PROFILE — SA edits any user: name, location, profession, WhatsApp, wallet, role, tier, active, CNIC verified. (9) USER MANAGEMENT — full-width table, no horizontal scroll. (10) REVIEWER CONSENT CHECKBOX — mandatory before action submission; reviewer_consent saved to DB. (11) CHANNEL FIXES — channel switching, wrong name/members, Send button reactivity, @mention chip visible on green bubbles, DM refresh loop fixed."
  },
  {
    version: "v1.5.1", date: "09 May 2026", type: "FEATURE",
    title: "SWAP Flow, ARP, Business Profile Rebuild & Ops Fund Ledger",
    summary: "(1) SWAP flow fully tested end-to-end — v6.2 split confirmed in DB: 80% CRP / 10% Ops Fund / 3.3% Business ENB.GLOBAL / 2% BSF / 1.3% Market Making / 1.3% Insurance / 2% Reserve Buffer. (2) confirm_redemption RPC final working version with correct pool distributions. (3) ops_fund_ledger — every SWAP writes a 10% entry to the ledger; complete audit trail from Day 1. (4) Admin Ecosystem Treasury cards — live ENB pool balances visible in admin dashboard. (5) BusinessProfile.tsx + BusinessOffers.tsx fully rebuilt with real Supabase data, offer management, and discount/SWAP flows. (6) ARP (Auto-Replenishment Protocol) complete — check_float_status RPC, PartnerFloat page, PartnerManager replenishment queue: 40% alert → 30% auto-request → fraud flag if no SWAPs present."
  },
  {
    version: "v1.5.2", date: "12 May 2026", type: "FEATURE",
    title: "ENB Doctrine, Carpool v2 — ENB Captain System & Architecture Hardening",
    summary: "(1) ENB DEVELOPMENT DOCTRINE established — 9 architectural bugs found and fixed. Single source of truth enforced across codebase: one write path, one read path, one sync. TIER_NEXT_THRESHOLD and isSuperAdmin() centralised in store/user.ts. (2) Silent RLS failure case study resolved — admin_update_user_profile SECURITY DEFINER RPC created; UserManagement now uses RPC for all updates. (3) Stale closure audit — Wallet, GenerateRedemptionQR, ReferralHub, CnicPrompt all converted to functional prev => pattern. (4) Global realtime subscription added to App.tsx (single subscription, no component-level duplication). (5) TOKEN_REFRESHED + SIGNED_IN handlers added to onAuthStateChange. (6) City-wise dynamic Leaderboard — city + country_code added to DB and Zustand store; filter tabs auto-populate from live DB. (7) ImpactDashboard + FoodSharing geo/terminology cleanup — RCWI replaces Schools & Orphanages, Rawalpindi/Chaklala refs removed, v4.9 labels removed. (8) CARPOOL V2 — ENB CAPTAIN SYSTEM: CaptainOnboarding (license categories, CNIC + license upload, vehicle description), AdminCaptains panel (document viewer, approve/reject/suspend with inbox notifications), CarpoolSession (GPS live map with Leaflet/OSRM, route trail, timer, passenger QR), ConfirmRide (member + non-member QR web flow, 200 ENB passenger reward), RiderProfile (public Captain profile with rides/ratings/reviews). ActionForm carpool gated behind Captain status. Dynamic ENB formula per vehicle: Bike 100/km, Rickshaw 120, Auto-rickshaw 120, Car 150, Van 200, Bus 300 — with passenger and rating multipliers. (9) SQL migrations: captain_applications, ride_confirmations, carpool session columns (17), trg_sync_tier trigger, city/country_code on users, on_captain_approved + on_carpool_approved + update_carpool_rating triggers. (10) Maps strategy locked: Phase 1 Leaflet + OpenStreetMap + OSRM (free); Phase 2 Google Maps Platform — single env var swap, VITE_GOOGLE_MAPS_API_KEY placeholder added to Vercel."
  },
  {
    version: "v1.5.3", date: "13 May 2026", type: "PREV",
    title: "Phantom Bug Fix, Auth Hardening & Multi-Account Switcher Repair",
    summary: "(1) PHANTOM U BUG ELIMINATED — root cause: global realtime subscription was calling setUser with Supabase postgres_changes payload.new that only contained updated columns (DEFAULT replica identity); all other columns including full_name came back as null and were spread over the store. Fix: realtime subscription removed entirely — balances refresh on navigation; safe for civic action app where moderation is async. (2) users table REPLICA IDENTITY set to FULL in DB for correct payload behaviour in future. (3) user.ts phantom guard — setUser now preserves existing full_name if incoming value is blank, with console.trace to identify any future caller with empty data. (4) App.tsx hardened: maybeSingle() replaces single() throughout, INSERT path removed (row creation is SignUpStep2 only), setUser(null) removed from error and catch paths, retry loop with 500ms/1.5s/3s backoff on 0-row JWT race, isLoadingProfile race guard. (5) MyLog.tsx React error #300 fixed — useEffect moved above conditional return (Rules of Hooks violation). (6) AccountSwitcher handleAddAccount: signOut({scope:'local'}) replaces global signOut — server token no longer revoked on Add Account, enabling immediate switch-back without re-login. (7) Service worker restored with NetworkFirst for JS chunks — PWA install and offline capability back. (8) vite.config.ts: JS excluded from precache globPatterns to prevent stale bundle serving on deployment."
  },
  {
    version: "v1.6.0", date: "16 May 2026", type: "PREV",
    title: "Visual Trade Job Selector",
    summary: "TradeJobSelector.tsx: 3-column emoji card grid replaces text dropdown for trade type selection in the community action submission flow. 9 trade types each with: emoji identifier, EN/UR bilingual labels, beforeAfter flag, before/after photo hints in both languages, and emoji scene illustrations. Component-local bilingual data objects (TRADE_TYPES array with en/ur strings) — established as the preferred pattern for domain-specific content going forward, never translations.ts."
  },
  {
    version: "v1.7.0", date: "16 May 2026", type: "CURRENT",
    title: "Unified Rating System & Moderator Performance Dashboard",
    summary: "(1) StarRating.tsx — shared component replacing all inline star implementations. Two modes: interactive (onChange prop) and display-only. Three sizes: sm/md/lg. Used across all rating touchpoints — never duplicate inline again. (2) Captain rates passenger: blind submission system — passenger rates captain at ConfirmRide, captain rates passenger at CarpoolSession end, neither sees the other's rating until both submitted. Rating screen embedded in CarpoolSession after End Ride tap. RiderProfile shows dual rating blocks: As Captain (public) and As Passenger (visible to captains and admin only). submit_captain_passenger_rating RPC saves rating and updates avg_passenger_rating + total_rides_as_passenger on users. (3) Moderator Performance Dashboard at /admin/mod-performance: List 1 shows per-moderator summary table (reviewed, approved, rejected, escalated, approval %, agreement %, AI divergence, fraud flags) — each row clickable to List 2. List 2 shows full action history with per-row review duration timestamps (amber ≥2 days, no warning <2 days), AI verdict with divergence highlight, all filters (time window, outcome, action type, moderator, AI divergence toggle, fraud toggle, search). ModQueue.tsx updated to write mod1_reviewed_at / mod2_reviewed_at on decision submit. DB: captain_rating + captain_comment on ride_confirmations; avg_passenger_rating + total_rides_as_passenger on users; mod1_reviewed_at + mod2_reviewed_at on moderator_assignments."
  },
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
            Starting in Karachi — built to replicate globally.
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
