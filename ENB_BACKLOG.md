# ENB — Master Backlog
*Last updated: 20 Apr 2026 — App v1.3.0 — Whitepaper v5.0 — v1.4.0 in design*
*Permanent file — update in place. At session start: read CLAUDE.md + ENB_DEVLOG.md + ENB_BACKLOG.md first.*

---

## 🔴 IMMEDIATE — Do This Week

- [ ] **100 real community users in 7 days** — friends, relatives, WhatsApp outreach, field campaign in Chaklala Scheme 3
- [ ] **WhatsApp community group** — create immediately, invite all contacts, share app link
- [ ] **Fi.co Step 3** — complete profile, upload photo, add all session dates to calendar, register for one bonus event, note event name for submission
- [ ] **Fi.co Step 4** — email megant@founderinstitute.com requesting Traction Track — paste email contents in portal field
- [ ] **Facebook Stories S2–S5** — post with direct post links (not page link)
- [ ] **Daily Story teasers Apr 21–May 1** — post 30 min before each feed post
- [ ] **SECP Private Limited Company registration** — URGENT before FI cohort Jul 28

---

## 🟡 SHORT TERM — App Development Window

- [ ] **v1.4.0 — Before/After submission system** — full spec in CLAUDE.md Section 14, ready to build
- [ ] **v1.4.0 — Reporting + Resolution tracking** — spec in CLAUDE.md Section 15, ready to build
- [ ] **v1.4.0 — SWAP language update** — replace "redemption" with "SWAP" in all frontend UI. Backend RPCs unchanged
- [ ] **Dev History — v5.0 whitepaper entry** — content written and ready (see DEVLOG 20 Apr)
- [ ] **Dev History — v1.4.0 entry** — add AFTER deployment only, not before
- [ ] CFSP v4.9 waterfall propagation to web app
- [ ] Fix ScanRedemption success screen (enb_spent vs enb_amount — cosmetic)
- [ ] Fix duplicate PartnerSignup import App.tsx lines 15+60 (build warning)
- [ ] TEST user (intuitionalised@gmail.com) balance cleanup SQL

---

## 🟡 SHORT TERM — This Window (Social Media Content)

- [ ] **Glossary — full 64 term definitions** for whitepaper appendix
- [ ] **Glossary — app screen** bilingual EN + Urdu — plain language for Rawalpindi workers
- [ ] **SWAP propagation** — update whitepaper, marketing site, social media templates
- [ ] **Next social media batch** — May 2026 onwards (Facebook + Twitter)
- [ ] **Fi.co Step 3 bonus event** — note event name for portal submission field
- [ ] **Fi.co track email** — draft and send to megant@founderinstitute.com

---

## 🟡 SHORT TERM — Before Fi.co Cohort (July 28)

- [ ] **Giveth June 28 update** ⚠️ DO NOT EDIT BEFORE — bundle ONE edit:
  - Fix title: "Eco Neighbor ENB" → "Eco-Neighbor ($ENB)"
  - Update whitepaper v4.9 → v5.0
  - Add Fi.co cohort progress
  - Add Facebook page link (facebook.com/ENBEcoNeighbor)
  - Update CFSP waterfall description
- [ ] GreenPill Network grant application ($5K–$25K)
- [ ] Celo Public Goods grant application ($10K–$100K)
- [ ] Post in GreenPill Discord
- [ ] Gitcoin Passport setup (target score 20+)
- [ ] Squads.so 5-of-7 multi-sig setup
- [ ] ENB token deployment on Solana devnet
- [ ] Whitepaper vs App Feature Gap Analysis
- [ ] Founding Members Handbook v2.0 — v5.0 pool update
- [ ] Karandaaz GreenFin PKR grant — book slot
- [ ] NICAT Rawalpindi — book appointment
- [ ] Business Directory professions translation layer

---

## ⏳ POST-DOMAIN TASKS

- [ ] Wire Resend for partnership_enquiries instant notification
- [ ] Wire Resend for whitepaper_requests instant notification
- [ ] Auto-send whitepaper PDF via Resend
- [ ] Replace all vercel URLs with domain throughout site
- [ ] Set up domain email

---

## 🔵 PHASE 2 SECURITY — Post FI Cohort

- [ ] RLS on 6 remaining tables: bug_reports, referral_escrow, campaigns, business_partners, partner_applications, bridge_requests
- [ ] Server-side role verification inside admin RPC functions
- [ ] Rate limiting on Account Recovery
- [ ] Move Cloudinary cloud name to env var
- [ ] Cloudinary upload domain restriction on enb_photos preset

---

## 🔵 PHASE 2 FEATURES — Post FI Cohort

### v1.4.0+ Features Designed, Not Yet Built
- [ ] Community Issues Board escalation pathway to municipality (auto-PDF generation)
- [ ] Video submission option (30–60 seconds) — after Phase 1 volume + infrastructure confirmed
- [ ] WhatsApp Meta Cloud API — 4-hour timer notification when After unlocks
- [ ] Resolution submission tracking — map of resolved vs unresolved reports

### v5.0 On-Chain
- [ ] Business Liquidity Gate smart contract — atomic burn-and-mint on Solana
- [ ] Community Treasury Fund smart contract
- [ ] ENB-CSU basket quarterly community vote
- [ ] 8-metric early warning dashboard

### Verification Stack
- [ ] AI Vision Layer 3 — Google Vision API
- [ ] pHash duplicate photo detection (Layer 2)
- [ ] Cross-Neighborhood AI Anomaly Monitor (Layer 7)
- [ ] NADRA verification — Step 3 of CNIC flow

### Growth & Scale
- [ ] ENB.GLOBAL Raydium DEX listing — after 1,000 active wallets
- [ ] Solana mainnet token deployment — after devnet confirmed (triggers v2.0.0)
- [ ] Second neighborhood pilot — Karachi (planning only)
- [ ] DAO transition (Snapshot.org) — at 10,000 active wallets
- [ ] Native app (PWA or React Native) — for true push notifications

---

## 📋 REPORTS PENDING

- [x] ~~Template 1 — Monthly Founder Update~~ ✅ Done (15 Apr 2026)
- [ ] Template 2 — Quarterly Ecosystem Report
- [ ] Template 3 — Community Day Event Report
- [ ] Template 4 — Founding Member Compliance Review
- [ ] Template 5 — 6-Month Impact Report
- [ ] Template 6 — Annual Governance & Impact Report

---

## 📋 DOCUMENT SYNC STATUS

| # | Document | Status | Priority |
|---|----------|--------|----------|
| 1 | Founding Members Handbook v2.0 | 🟡 Needs v5.0 pool update | High |
| 2 | Impact Investor Pitch Deck HTML | ✅ v5.0 — 17 Apr | Done |
| 3 | Grant Application (GreenPill/Celo/UNICEF) | ✅ v5.0 — 17 Apr | Done |
| 4 | ENB Master Technical Document | ✅ v5.0 — 17 Apr | Done |
| 5 | Marketing Site index.html | ✅ Fully upgraded — 18 Apr | Done |
| 6 | Whitepaper v5.0 | ✅ Final — 18 Apr | Done |
| 7 | Glossary (64 terms) | 🔴 Not yet written | High |
| 8 | Ecosystem Sustainability Analysis | 🟡 PARTIAL (v4.4) | Medium |
| 9 | Failure Scenario Analysis | 🟡 PARTIAL (v4.4) | Medium |
| 10 | Carbon Credit Methodology | 🟡 PARTIAL (v4.7) | Medium |
| 11 | Founders Agreement | 🟡 PARTIAL (v4.6) | Medium |
| 12 | Carbon Revenue Model | 🟡 PARTIAL (v4.7) | Medium |
| 13 | ENB Master Snapshot | 🟡 PARTIAL (v4.8) | Medium |
| 14 | NDA / IP / Tech Agreement | 🟢 LOW RISK (v4.6) | Low |
| 15 | FI Strategy Reference | ✅ CURRENT (15 Apr) | Done |
| 16 | Security Audit Report | ✅ CURRENT (15 Apr) | Done |
| 17 | Registration Drive Materials (EN) | ✅ CURRENT (15 Apr) | Done |
| 18 | Registration Drive Materials (Urdu) | ⏳ PENDING TRANSLATION | High |
| 19 | Founder Monthly Report Template | ✅ CURRENT (15 Apr) | Done |

---

## ✅ COMPLETED — 20 Apr 2026

- [x] Fi.co Step 1 submitted — onboarding video reflection
- [x] Fi.co Step 2 submitted — Rule of One mapped to ENB
- [x] SWAP acronym locked — Sustainable Work Achieves Prosperity
- [x] SWAP Urdu translation — پائیدار محنت خوشحالی لاتی ہے
- [x] Rule of One fully mapped to Eco-Neighbor
- [x] Killer Feature redefined — verified work record, not the token
- [x] Revenue split clarified — 3.3% business / 6.7% ecosystem
- [x] Founding Core Team terminology locked
- [x] Early joiner multiplier concept decided
- [x] Before/After submission system fully designed
- [x] GPS radius corrected — 20 metres
- [x] Transformation vs Reporting action types defined
- [x] Reporting + Resolution framework designed
- [x] Community Issues Board Option B decided
- [x] Push notification stack assessed
- [x] Semantic versioning locked
- [x] v1.4.0 feature set defined
- [x] Genesis Block concept formalised
- [x] Glossary — 64 terms identified, 20 critical in CLAUDE.md
- [x] Fi.co track assessed — Launch (need Traction)
- [x] Real user gap identified — 100 in 7 days target set

## ✅ COMPLETED — 19 Apr 2026

- [x] Facebook URL corrected: ENBEcoNeighbor
- [x] 20 Facebook posts written and scheduled (Apr 19–May 1)
- [x] 13 Twitter tweets written and scheduled (Apr 19–May 1)
- [x] Urdu BiDi rules locked
- [x] واسطہ replaces بچولیا permanently
- [x] All 20 Gemini images reviewed and approved
- [x] Buffer adopted for scheduling
- [x] Facebook Story S1 posted

## ✅ COMPLETED — 18 Apr 2026 (Evening)
- [x] Marketing site file truncation fixed
- [x] 5 new sections added to marketing site
- [x] Partnership Enquiry + Whitepaper Request modals built
- [x] Supabase tables: partnership_enquiries + whitepaper_requests
- [x] Treasury pool math corrected

## ✅ COMPLETED — Earlier Sessions
- [x] Whitepaper v5.0 complete
- [x] App v1.3.0 — QR codes, /scan, RLS, Urdu, registration materials
- [x] CNIC verification, welcome email, account recovery
- [x] Governance, FoodSharing, ImpactDashboard, FloatingBugButton
- [x] Full submission cycle, moderation, referral, business partner systems
- [x] Marketing site live, Giveth 100/100, Fi.co accepted
- [x] Full Urdu interface (Docs 01–06 all applied)

---

## ⚠️ KNOWN ISSUES

- [ ] TEST user (intuitionalised@gmail.com) balance cleanup SQL still needed
- [ ] ScanRedemption success screen: enb_spent vs enb_amount (cosmetic)
- [ ] Duplicate PartnerSignup import App.tsx lines 15+60 (build warning)
- [ ] Business Directory profession names English-only (translation layer needed)

---

## 🔐 Credentials

- Admin: qahwakhana@gmail.com | Founder: econeighborisenb@gmail.com
- GitHub app: agrorian/eco-neighbor | GitHub site: agrorian/enb-site
- Live app: https://eco-neighbor.vercel.app
- Marketing site: https://eco-neighbor-site.vercel.app
- Facebook: https://www.facebook.com/ENBEcoNeighbor
- Twitter: @econeighbor_enb / @mansehra2020
- Supabase: wlbgqygkvlwavmylgteb | anon key: sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
- Cloudinary: dl86obm3b | Resend: re_eHSzkb69... (get full from resend.com)
- Buffer: buffer.com
- Giveth: giveth.io/project/eco-neighbor-enb ⚠️ DO NOT EDIT before June 28, 2026
