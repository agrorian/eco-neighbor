# ENB — Master Backlog
*Last updated: 21 Apr 2026 (evening corrections) — App v1.3.0 — Whitepaper v5.0 (v6.0 pending) — v1.4.0 in design*
*At session start: read CLAUDE.md + ENB_DEVLOG.md + ENB_BACKLOG.md first.*

---

## 🔴 IMMEDIATE — Do This Week

- [ ] **100 real community users in 7 days** — friends, relatives, WhatsApp group, field campaign
- [ ] **WhatsApp community group** — create immediately, invite all contacts
- [ ] **Fi.co Step 3** — complete profile, upload photo, add session dates to calendar, register for one bonus event
- [ ] **Fi.co Step 4** — email megant@founderinstitute.com requesting Traction Track — paste contents in portal
- [ ] **Facebook Stories S2–S5** — post with direct post links
- [ ] **Daily Story teasers Apr 22–May 1** — 30 min before each feed post
- [ ] **SECP Private Limited Company registration** — URGENT before Jul 28

---

## 🟡 SHORT TERM — App Development Window (Chat 6)

- [ ] **v1.4.0 — Before/After submission system** — full spec in CLAUDE.md Section 15
- [ ] **v1.4.0 — Reporting + Resolution tracking** — spec in CLAUDE.md Section 16
- [ ] **v1.4.0 — SWAP language update** — frontend only, backend RPCs unchanged
- [ ] **Dev History — v5.0 whitepaper entry** — content: Community Treasury, Business Liquidity Gate, SPR, Anchors honorary, FBP removed, Metamorphosis, Part B deleted
- [ ] **Dev History — v1.4.0 entry** — add AFTER deployment only
- [ ] CFSP v4.9 waterfall propagation to web app
- [ ] Fix ScanRedemption success screen (enb_spent vs enb_amount — cosmetic)
- [ ] Fix duplicate PartnerSignup import App.tsx lines 15+60
- [ ] TEST user balance cleanup SQL

---

## 🟡 SHORT TERM — Whitepaper/Documents Window

- [ ] **Whitepaper v6.0** (major version bump — removes fixed supply) — surgical edits to v5.0 .docx base:
  - Base: ENB_Whitepaper_v5_0.docx (90 pages, 1,147 lines) — MUST use this as base, never generate from scratch
  - Add new Section 3A: Auto-Tranche System with all tables, simulation data, CRP tiered protocol
  - Update cover: "Fixed Supply" → "Auto-Tranche Architecture • Infinite Supply"
  - Update Section 2.3 Technical Spec table: Mint Authority → PDA only (not renounced)
  - Update Section 22.4 Token Flow Step 3: "2% IS BURNED" → 10% Community Treasury
  - Update Section 24 Technical Specs: Total Supply + Mint Authority rows
  - Rewrite Section 30: Supply Rationale (auto-tranche replaces fixed supply argument)
  - Throughout: "redemption" → "SWAP" (user-facing only, not RPC function names)
  - Throughout: Ticker T1/T2/T3 as TRUE SUPERSCRIPT (not caret notation)
  - Throughout: Remove geographic radius restriction language
  - Version History: Add v6.0 row
  - Output must be approximately 90 pages. If significantly shorter, REJECT and retry.
- [ ] **Glossary** — full 64 term definitions for whitepaper appendix
- [ ] Founding Members Handbook v2.0 — v5.0 pool update

---

## 🟡 SHORT TERM — Social Media / Marketing Window

- [ ] **Marketing site updates** — surgical edits to existing index.html (2,305 lines) — MUST use as base, never regenerate from scratch:
  - Add Auto-Tranche System section (between tokenomics and testimonials)
  - Remove all geographic radius restriction language
  - Replace all "redemption" with "SWAP"
  - Update ticker references: $ENB with T1/T2/T3 as `<sup>` tags (true superscript)
  - Update version references v5.0 → v6.0 in footer
  - Existing 14 sections must remain intact
  - Output must be approximately 2,300+ lines. If significantly shorter, REJECT and retry.
- [ ] Next social media batch — May 2026 onwards (Facebook + Twitter)
- [ ] **Giveth June 28 update** ⚠️ DO NOT EDIT BEFORE — bundle ONE edit:
  - Fix title → "Eco-Neighbor ($ENB)"
  - Whitepaper v4.9 → v6.0
  - Add Fi.co cohort progress
  - Add Facebook link
  - Update CFSP description
  - Add auto-tranche system mention
- [ ] GreenPill Network grant application ($5K–$25K)
- [ ] Celo Public Goods grant application ($10K–$100K)
- [ ] Post in GreenPill Discord
- [ ] Gitcoin Passport setup (target 20+)

---

## ⏳ POST-DOMAIN TASKS

- [ ] Wire Resend for partnership_enquiries + whitepaper_requests
- [ ] Auto-send whitepaper PDF
- [ ] Replace all vercel URLs with domain
- [ ] Domain email setup

---

## 🔵 PHASE 2 — Smart Contracts

- [ ] **Auto-tranche smart contract** — Solana, autonomous, immutable T2+ distribution
- [ ] Business Liquidity Gate smart contract
- [ ] Community Treasury Fund smart contract
- [ ] ENB token mainnet deployment (triggers v2.0.0)
- [ ] Raydium DEX listing

---

## 🔵 PHASE 2 — Security

- [ ] RLS Phase 2 — 6 remaining tables
- [ ] Server-side role verification in admin RPCs
- [ ] Rate limiting on Account Recovery
- [ ] Move Cloudinary cloud name to env var

---

## 🔵 PHASE 2 — Features

- [ ] WhatsApp Meta Cloud API notifications (4hr After timer)
- [ ] Community Issues Board escalation pathway to municipality
- [ ] Video submission (30–60 seconds) — after Phase 1 confirmed
- [ ] Native app / PWA — true push notifications
- [ ] ENB-CSU basket quarterly vote
- [ ] 8-metric early warning dashboard
- [ ] Cross-Neighborhood AI Anomaly Monitor (Layer 7)
- [ ] NADRA verification (Step 3 CNIC)
- [ ] Raydium DEX listing (after 1,000 active wallets)
- [ ] Second pilot — Karachi (planning only)
- [ ] DAO transition (10,000 active wallets)

---

## 📋 REPORTS PENDING

- [x] Template 1 — Monthly Founder Update ✅
- [ ] Template 2 — Quarterly Ecosystem Report
- [ ] Template 3 — Community Day Event Report
- [ ] Template 4 — Founding Member Compliance Review
- [ ] Template 5 — 6-Month Impact Report
- [ ] Template 6 — Annual Governance & Impact Report

---

## 📋 DOCUMENT SYNC STATUS

| # | Document | Status | Priority |
|---|----------|--------|----------|
| 1 | Whitepaper v6.0 | 🔴 Auto-tranche section needed + all 4 evening corrections | Critical |
| 2 | Founding Members Handbook v2.0 | 🟡 Needs v5.0 pool update | High |
| 3 | Glossary (64 terms) | 🔴 Not yet written | High |
| 4 | Impact Investor Pitch Deck HTML | ✅ v5.0 — 17 Apr | Done |
| 5 | Grant Application (GreenPill/Celo/UNICEF) | ✅ v5.0 — 17 Apr | Done |
| 6 | ENB Master Technical Document | ✅ v5.0 — 17 Apr | Done |
| 7 | Marketing Site index.html | 🟡 SWAP + tranche update needed | High |
| 8 | Whitepaper v5.0 | ✅ Final — 18 Apr | Done |
| 9 | Registration Drive Materials (Urdu) | ⏳ PENDING TRANSLATION | High |
| 10 | Ecosystem Sustainability Analysis | 🟡 PARTIAL (v4.4) | Medium |
| 11 | Failure Scenario Analysis | 🟡 PARTIAL (v4.4) | Medium |
| 12 | Carbon Credit Methodology | 🟡 PARTIAL (v4.7) | Medium |
| 13 | Founders Agreement | 🟡 PARTIAL (v4.6) | Medium |

---

## ✅ COMPLETED — 21 Apr 2026 (Evening Corrections)

- [x] CRP Critical Zone corrected — fully autonomous, no DAO vote anywhere
- [x] Mint authority clarified — held by PDA, not renounced
- [x] Ticker superscript format locked — T1/T2/T3 as true superscript
- [x] Whitepaper version bump corrected — v5.1 → v6.0 (major bump)
- [x] CLAUDE.md v11.1 — 4 corrections applied + new Section 25 capturing corrections
- [x] ENB_DEVLOG.md — evening correction entry added
- [x] ENB_BACKLOG.md — v6.0 references throughout, surgical edit instructions added
- [x] Process rule reinforced — never generate from scratch when base file exists

## ✅ COMPLETED — 21 Apr 2026

- [x] User growth simulations — Scenarios A, B, C
- [x] CRP consumption simulations — all 3 scenarios
- [x] Daily action cap locked — 3/user/day permanent
- [x] Auto-tranche system designed and locked
- [x] T2+ distribution locked — 70/12/8/5/5
- [x] CRP Tiered Protection Protocol designed
- [x] Geographic limits removed
- [x] Ticker format locked — $ENB^T1, $ENB^T2...
- [x] Auto-tranche simulation with infinite minting
- [x] All simulation tables and charts produced
- [x] CLAUDE.md v11.0 produced
- [x] Window management rule established

## ✅ COMPLETED — 20 Apr 2026

- [x] Fi.co Steps 1+2 submitted
- [x] SWAP locked — Sustainable Work Achieves Prosperity
- [x] Before/After submission system designed
- [x] Reporting + Resolution framework designed
- [x] Semantic versioning locked
- [x] Glossary 20 critical terms in CLAUDE.md

## ✅ COMPLETED — 19 Apr 2026

- [x] 20 Facebook posts + 13 Twitter tweets scheduled
- [x] Urdu BiDi rules locked
- [x] All 20 Gemini images approved
- [x] Buffer adopted

## ✅ COMPLETED — 18 Apr 2026

- [x] Marketing site fully upgraded (5 sections, 2 modals)
- [x] Whitepaper v5.0 complete
- [x] Supabase tables: partnership_enquiries + whitepaper_requests

## ✅ COMPLETED — Earlier Sessions

- [x] App v1.3.0 — QR codes, RLS, Urdu, registration materials
- [x] CNIC verification, welcome email, account recovery
- [x] Governance, FoodSharing, ImpactDashboard, FloatingBugButton
- [x] Full submission cycle, moderation, business partner systems
- [x] Giveth 100/100, Fi.co accepted, full Urdu interface

---

## ⚠️ KNOWN ISSUES

- [ ] TEST user (intuitionalised@gmail.com) balance cleanup SQL needed
- [ ] ScanRedemption: enb_spent vs enb_amount (cosmetic)
- [ ] Duplicate PartnerSignup import App.tsx (build warning)
- [ ] Business Directory profession names English-only

---

## 🔐 Credentials

- Admin: qahwakhana@gmail.com | Founder: econeighborisenb@gmail.com
- GitHub app: agrorian/eco-neighbor | GitHub site: agrorian/enb-site
- Live app: https://eco-neighbor.vercel.app
- Marketing site: https://eco-neighbor-site.vercel.app
- Facebook: https://www.facebook.com/ENBEcoNeighbor
- Twitter: @econeighbor_enb / @mansehra2020
- Supabase: wlbgqygkvlwavmylgteb | anon: sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
- Cloudinary: dl86obm3b | Resend: re_eHSzkb69... (get full from resend.com)
- Buffer: buffer.com
- Giveth: giveth.io/project/eco-neighbor-enb ⚠️ DO NOT EDIT before June 28, 2026
