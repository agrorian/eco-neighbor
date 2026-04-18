# ENB — Master Backlog
*Last updated: 19 Apr 2026 — App v1.3.0 — Whitepaper v5.0*
*Permanent file — update in place. At session start: read CLAUDE.md + ENB_DEVLOG.md + ENB_BACKLOG.md first.*

---

## 🔴 IMMEDIATE — Do This Week

- [ ] **SECP Private Limited Company registration** — URGENT before FI cohort starts Jul 28
- [ ] **Fi.co onboarding sprint** — complete portal deliverables, contact Fi.co leaders
- [ ] **Facebook Stories S2–S5** — post with direct post links (not page link)
  - S2: CFSP/Food waste (Apr 12 post link)
  - S3: Recruitment CTA (Apr 14 post link)
  - S4: Business owners (Apr 11 post link) — post Apr 19 morning before feed
  - S5: Giveth donation (Apr 13 post) — external link giveth.io/project/eco-neighbor-enb
- [ ] **Daily Story teasers Apr 20–May 1** — post each morning 30 min before feed post
- [ ] **Buffer** — confirm all 13 tweets loaded and scheduled correctly (Apr 19–May 1)
- [ ] **Urdu registration materials** — PDFs once Muhammad returns translations

---

## 🟡 SHORT TERM — Before Fi.co Cohort (July 28, 2026)

- [ ] **Fi.co portal** — review Week 1 checklist and map to ENB actions
- [ ] **Giveth June 28 update** ⚠️ DO NOT EDIT BEFORE — bundle in ONE edit:
  - Fix title: "Eco Neighbor ENB" → "Eco-Neighbor ($ENB)"
  - Update whitepaper reference: v4.9 → v5.0
  - Add Fi.co cohort progress (started Jul 28, 2026)
  - Add Facebook page link (facebook.com/ENBEcoNeighbor) + updated numbers
  - Add pilot milestones and partner businesses
  - Update CFSP waterfall description
- [ ] **Next batch social media posts** — May 2026 onwards (Facebook + Twitter)
- [ ] GreenPill Network grant application ($5K–$25K)
- [ ] Celo Public Goods grant application ($10K–$100K)
- [ ] Post in GreenPill Discord
- [ ] Gitcoin Passport setup (target score 20+)
- [ ] Squads.so 5-of-7 multi-sig setup
- [ ] ENB token deployment on Solana devnet (test run — free)
- [ ] Whitepaper vs App Feature Gap Analysis
- [ ] Founding Members Handbook v2.0 — update to v5.0 founding pool (SPR at #2, Anchors 0%)
- [ ] Fix duplicate PartnerSignup import App.tsx lines 15+60 (build warning only)
- [ ] Fix ScanRedemption success screen (enb_spent vs enb_amount — cosmetic)
- [ ] Karandaaz GreenFin PKR grant — book slot
- [ ] NICAT Rawalpindi tech startup support — book appointment
- [ ] Business Directory professions: translation layer for constants.ts
- [ ] CFSP v4.9 waterfall propagation to web app

---

## ⏳ POST-DOMAIN TASKS

- [ ] Wire Resend to notify Muhammad instantly on `partnership_enquiries` submissions
- [ ] Wire Resend to notify Muhammad instantly on `whitepaper_requests` submissions
- [ ] Auto-send whitepaper PDF via Resend Edge Function on request
- [ ] Replace all eco-neighbor-site.vercel.app references with domain URL throughout site
- [ ] Set up domain email (e.g. hello@eco-neighbor.com)
- [ ] Update Whitepaper request modal: remove "manual fulfilment" language once automated

---

## 🔵 PHASE 2 SECURITY — Post FI Cohort

- [ ] RLS on 6 remaining tables: `bug_reports`, `referral_escrow`, `campaigns`, `business_partners`, `partner_applications`, `bridge_requests`
- [ ] Server-side role verification inside admin RPC functions
- [ ] Rate limiting on Account Recovery (max 3 attempts / 15 min / IP)
- [ ] Move Cloudinary cloud name to env var in all 6 files
- [ ] Cloudinary upload domain restriction on `enb_photos` preset

---

## 🔵 PHASE 2 FEATURES — Post FI Cohort

### v5.0 On-Chain (designed in whitepaper — not yet built)
- [ ] Business Liquidity Gate smart contract — atomic burn-and-mint on Solana
- [ ] Community Treasury Fund — smart contract routing 10% to 4 pools
- [ ] ENB-CSU basket quarterly community vote mechanism
- [ ] 8-metric early warning dashboard

### Verification Stack (v5.0 planned)
- [ ] AI Vision Layer 3 — Google Vision API (DB columns exist)
- [ ] pHash duplicate photo detection (Layer 2)
- [ ] Cross-Neighborhood AI Anomaly Monitor (Layer 7)
- [ ] NADRA verification — Step 3 of CNIC flow (government API)

### Growth & Scale
- [ ] ENB.GLOBAL Raydium DEX listing — after 1,000 active wallets
- [ ] Solana mainnet token deployment — after devnet confirmed
- [ ] Second neighborhood pilot — Karachi (planning only)
- [ ] DAO transition (Snapshot.org) — at 10,000 active wallets
- [ ] WhatsApp Meta Cloud API for submission notifications

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
| 7 | Ecosystem Sustainability Analysis | 🟡 PARTIAL (v4.4) | Medium |
| 8 | Failure Scenario Analysis | 🟡 PARTIAL (v4.4) | Medium |
| 9 | Carbon Credit Methodology | 🟡 PARTIAL (v4.7) | Medium |
| 10 | Founders Agreement | 🟡 PARTIAL (v4.6) | Medium |
| 11 | Carbon Revenue Model | 🟡 PARTIAL (v4.7) | Medium |
| 12 | ENB Master Snapshot | 🟡 PARTIAL (v4.8) | Medium |
| 13 | NDA / IP / Tech Agreement | 🟢 LOW RISK (v4.6) | Low |
| 14 | FI Strategy Reference | ✅ CURRENT (15 Apr) | Done |
| 15 | Security Audit Report | ✅ CURRENT (15 Apr) | Done |
| 16 | Registration Drive Materials (EN) | ✅ CURRENT (15 Apr) | Done |
| 17 | Registration Drive Materials (Urdu) | ⏳ PENDING TRANSLATION | High |
| 18 | Founder Monthly Report Template | ✅ CURRENT (15 Apr) | Done |

---

## ✅ COMPLETED — 19 Apr 2026 (Social Media Session)

- [x] Facebook URL corrected: EcoNeighborENB → ENBEcoNeighbor in CLAUDE.md
- [x] 7 Facebook posts (Days 8–14) — content + Gemini prompts + Urdu versions
- [x] 7 Gemini images reviewed and approved (all ✅)
- [x] Facebook Stories strategy defined (3 types)
- [x] Story S1 (Ustad Hamid) posted with direct post link
- [x] Story S1 text corrected (text moved to bottom third, redundant line removed)
- [x] 6 Facebook posts (Days 15–20) written for Apr 25–30 gap
- [x] Urdu BiDi problem diagnosed and solved
- [x] Urdu writing house rules locked ($ENB standalone, ٹوکن mid-sentence)
- [x] واسطہ replaces بچولیا permanently
- [x] All 6 Urdu posts rewritten under new rules
- [x] 5 remaining Gemini images reviewed and approved (all ✅)
- [x] 13 Twitter tweets written (Apr 19–May 1, one per day)
- [x] Twitter schedule rebuilt — clean, no gaps, no duplicates
- [x] Buffer adopted for scheduling
- [x] Claude windows named and scoped
- [x] CLAUDE.md v9.0 produced
- [x] ENB_DEVLOG.md updated
- [x] ENB_BACKLOG.md updated

---

## ✅ COMPLETED — 18 Apr 2026 (Marketing Site Evening)
- [x] File truncation fixed
- [x] IntersectionObserver reveal fixed
- [x] CFSP section added
- [x] Traction section added
- [x] Why ENB Survives section added
- [x] Business Liquidity Gate section added
- [x] Community Treasury section added (correct math)
- [x] Treasury pool math corrected (Market Making + Insurance = 2 separate rows)
- [x] Partnership Enquiry modal built → partnership_enquiries table
- [x] Whitepaper Request modal built → whitepaper_requests table
- [x] 35/35 integrity checks passed

### Marketing Site — 18 Apr 2026 (Morning)
- [x] 12 bugs fixed, 27/27 audit checks passed

### Supabase — 18 Apr 2026
- [x] CREATE TABLE partnership_enquiries + RLS + policies
- [x] CREATE TABLE whitepaper_requests + RLS + policies

### Documents — 17–18 Apr 2026
- [x] Whitepaper v5.0 complete
- [x] Impact Investor Pitch Deck v5.0 HTML
- [x] Grant Application v5.0
- [x] ENB Master Technical Document v5.0

### App v1.3.0 — 15 Apr 2026
- [x] Real scannable QR codes
- [x] /scan route auto-populates
- [x] RPC params corrected
- [x] Daily log rich text + 3000 char limit
- [x] Registration drive materials (4 EN + 4 Urdu PDFs)

### Security / RLS Phase 1 — 15 Apr 2026
- [x] RLS: users (7), submissions (5), moderator_assignments (4), redemptions (5)
- [x] JWT custom access token hook + role sync trigger

### Identity & Features — 14 Apr 2026
- [x] CNIC identity verification system
- [x] Welcome email (Resend Edge Function)
- [x] Account Recovery + Dev History pages
- [x] Urdu Docs 02–04 wired

### Community Features — 7 Apr 2026
- [x] Governance.tsx + FoodSharing.tsx + ImpactDashboard.tsx
- [x] FloatingBugButton with 25-route auto-detection

### Earlier Sessions (Mar–Apr 2026)
- [x] Full submission cycle, dual blind moderation, moderator compensation
- [x] Referral system, Business Partner system, BusinessDirectory map
- [x] CAPTCHA pool (30 questions), multi-photo submissions
- [x] Marketing site live, Giveth 100/100, Fi.co accepted
- [x] Founding Members Handbook v2.0, Monthly Founder Report Template
- [x] Full Urdu interface (Docs 01–06 all applied)

---

## ⚠️ KNOWN ISSUES

- [ ] TEST user (intuitionalised@gmail.com) balance cleanup SQL still needed
- [ ] ScanRedemption success screen: enb_spent vs enb_amount (cosmetic only)
- [ ] Duplicate PartnerSignup import App.tsx lines 15+60 (build warning, not breaking)
- [ ] Business Directory profession names English-only (constants.ts needs translation layer)

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
- Buffer: buffer.com (Twitter + Facebook scheduling)
- Giveth: giveth.io/project/eco-neighbor-enb ⚠️ DO NOT EDIT before June 28, 2026
