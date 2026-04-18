# ENB — Master Backlog
*Last updated: 18 Apr 2026 — App v1.3.0 — Whitepaper v5.0*
*Permanent file — update in place. At session start: read CLAUDE.md + ENB_DEVLOG.md + ENB_BACKLOG.md first.*

---

## 🔴 IMMEDIATE — Before Registration Drive / FI Cohort

- [ ] **Urdu registration materials** — Muhammad translating; produce Urdu PDFs using Noto Nastaliq Urdu font once returned
- [ ] **SECP Private Limited Company registration** — URGENT before FI cohort starts Jul 28
- [ ] CFSP v4.9 Priority Waterfall propagation to web app (5-tier display wherever CFSP shown)
- [ ] Fix duplicate PartnerSignup import in App.tsx (lines 15 + 60) — build warning only
- [ ] Fix ScanRedemption success screen: confirm_redemption returns `enb_spent` not `enb_amount` — cosmetic

---

## 🟡 SHORT TERM — Before FI Cohort (July 28, 2026)

- [ ] **FI Dashboard tasks** — review Week 1 checklist in FI portal and map to ENB actions
- [ ] **Giveth June 28 update** ⚠️ DO NOT EDIT BEFORE — bundle these in ONE edit:
  - Fix title: "Eco Neighbor ENB" → "Eco-Neighbor ($ENB)"
  - Update whitepaper reference: v4.9 → v5.0
  - Add Fi.co cohort progress (started Jul 28, 2026)
  - Add Facebook page link + updated follower numbers
  - Add pilot milestones and partner businesses
  - Update CFSP waterfall description to v4.9 5-tier structure
- [ ] Squads.so 5-of-7 multi-sig setup for Emergency Reserve treasury
- [ ] ENB token deployment on Solana devnet (test run — free)
- [ ] Solana mainnet token deployment (after devnet confirmed working)
- [ ] WhatsApp Meta Cloud API integration for submission notifications (Phase 2)
- [ ] Resend welcome email: verify custom domain sender (currently eco-neighbor.vercel.app placeholder)
- [ ] Facebook Days 2–7 posts (scheduled sequence ready — just post)
- [ ] Gitcoin Passport setup (target 20+) — passport.gitcoin.co
- [ ] Post in GreenPill Discord
- [ ] GreenPill Network grant application ($5K–$25K)
- [ ] Celo Public Goods grant application ($10K–$100K)
- [ ] Carbon credit methodology document — Verra VCS submission prep
- [ ] Karandaaz GreenFin PKR grant — book April 2026 slot
- [ ] NICAT Rawalpindi tech startup support — book appointment
- [ ] Business Directory professions: add translation layer for constants.ts
- [ ] Whitepaper vs App Feature Gap Analysis (for Founder Reports window)
- [ ] Founding Members Handbook v2.0 — update to v5.0 founding pool (SPR at #2, Anchors honorary 0%)

---

## 🔵 PHASE 2 SECURITY — Post FI Cohort

- [ ] RLS on 6 remaining tables: `bug_reports`, `referral_escrow`, `campaigns`, `business_partners`, `partner_applications`, `bridge_requests`
- [ ] Server-side role verification inside admin RPC functions (currently only frontend-checked)
- [ ] Rate limiting on Account Recovery (max 3 attempts / 15 min / IP)
- [ ] Move Cloudinary cloud name `dl86obm3b` to `VITE_CLOUDINARY_CLOUD_NAME` env var
- [ ] Cloudinary upload domain restriction on `enb_photos` preset (requires paid plan)

---

## 🔵 PHASE 2 FEATURES — Post FI Cohort

### Verification Stack (v5.0 planned, not yet built)
- [ ] AI Vision Layer 3 — Google Vision API. DB columns exist — need API integration
- [ ] pHash duplicate photo detection across submissions (Layer 2 anti-fraud)
- [ ] Cross-Neighborhood AI Anomaly Monitor (Layer 7) — weekly scan
- [ ] NADRA verification — Step 3 of CNIC flow (government API required)
- [ ] Live video check for identity Step 2

### v5.0 Tokenomics Features (designed in whitepaper, not yet in app)
- [ ] **Business Liquidity Gate smart contract** — atomic burn-and-mint on Solana
- [ ] **Community Treasury Fund** — smart contract routing 10% to 4 pools on each redemption
- [ ] **Business Stability Fund** — trigger conditions + subsidy request flow
- [ ] **Dynamic daily earning cap** — per-wallet daily limit tied to treasury health
- [ ] **Post-detection anti-collusion slashing** — clawback after Layer 7 fraud detection
- [ ] **Strategic Partnership Reserve management UI** — governance vote flow
- [ ] **ENB-CSU basket quarterly community vote** mechanism
- [ ] **8-metric early warning dashboard** for ecosystem collapse indicators
- [ ] **Founder Responsibility Dashboard** with vesting consequences for inactivity

### Blockchain & DeFi
- [ ] ENB.GLOBAL Raydium DEX listing (ENB.GLOBAL/USDC pool) — after 1,000 active wallets
- [ ] JazzCash/Easypaisa bridge for ENB.GLOBAL cash conversion (Phase 3+)
- [ ] DAO transition setup (Snapshot.org) — triggers at 10,000 active wallets

### Community & UX
- [ ] Auto-replenishment protocol for business partner floats at 30% threshold
- [ ] Missing 3 days Daily Log → WhatsApp alert
- [ ] Missing 7 days → FORMAL_ABSENCE status
- [ ] Float WhatsApp notification at 40% threshold
- [ ] Real ENB Support WhatsApp number in Settings (currently: 923001234567 placeholder)
- [ ] Service worker cache-busting
- [ ] Second neighborhood pilot launch — Karachi (planning only)

---

## 📋 REPORTS PENDING

- [x] ~~Template 1 — Monthly Founder Update~~ ✅ Done (15 Apr 2026)
- [ ] Template 2 — Quarterly Ecosystem Report
- [ ] Template 3 — Community Day Event Report
- [ ] Template 4 — Founding Member Compliance Review
- [ ] Template 5 — 6-Month Impact Report
- [ ] Template 6 — Annual Governance & Impact Report
- [ ] Whitepaper vs App Feature Gap Analysis

---

## 📋 DOCUMENT SYNC STATUS

| # | Document | Status | Priority |
|---|----------|--------|----------|
| 1 | Founding Members Handbook v2.0 | 🟡 Needs v5.0 pool update | High |
| 2 | Impact Investor Pitch Deck HTML | ✅ v5.0 — 17 Apr | Done |
| 3 | Grant Application (GreenPill/Celo/UNICEF) | ✅ v5.0 — 17 Apr | Done |
| 4 | ENB Master Technical Document | ✅ v5.0 — 17 Apr | Done |
| 5 | Marketing Site index.html | ✅ Fixed — 18 Apr | Done |
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

## ✅ COMPLETED (Sessions 1–20 + 17–18 Apr 2026)

### Marketing Site (18 Apr 2026)
- [x] Counter bug fixed — data-target="3400000000" (removed commas)
- [x] Emergency Reserve bar corrected — width:5% (was 10%)
- [x] Reveal animation fixed — starts hidden (opacity:0)
- [x] Mobile hamburger menu fixed — getElementById + .show CSS
- [x] Hero badge v4.9 → v5.0
- [x] All whitepaper request links → v5.0
- [x] Footer version labels → v5.0
- [x] Gitcoin QF investor card → GreenPill Network
- [x] Layer metaphor → GreenPill · Celo Public Goods
- [x] Footer "Giveth QF Round" → "Support on Giveth"
- [x] Tokenomics detail → GreenPill, Celo, UNICEF CryptoFund
- [x] Urdu tagline added to footer
- [x] 27/27 audit checks confirmed

### Documents (17–18 Apr 2026)
- [x] Whitepaper v5.0 — complete (all corrections applied)
- [x] Impact Investor Pitch Deck v5.0 HTML (15 slides)
- [x] Grant Application v5.0 (GreenPill/Celo/UNICEF)
- [x] ENB Master Technical Document v5.0

### App v1.3.0 (15 Apr 2026)
- [x] Real scannable QR codes (qrcode npm, Option B full URL)
- [x] /scan route auto-populates from ?code= URL param
- [x] confirm_redemption correct params (p_qr_code only)
- [x] cancel_redemption_qr correct params (p_qr_token)
- [x] toUpperCase() removed from QR lookup
- [x] maxLength 12→36 in ScanRedemption
- [x] Daily log rich text toolbar + 3000 char limit
- [x] App version v1.3.0 across all locations

### Security / RLS Phase 1 (15 Apr 2026)
- [x] RLS: users (7 policies), submissions (5), moderator_assignments (4), redemptions (5)
- [x] JWT custom access token hook deployed
- [x] Role sync trigger deployed
- [x] telegram_id column dropped
- [x] Cloudinary enb_cnic_private signed preset
- [x] Security Audit report generated

### Identity & CNIC (14 Apr 2026)
- [x] CNIC identity system — optional signup, ENB locked until verified
- [x] Welcome email via Resend Edge Function
- [x] Account Recovery at /account-recovery
- [x] Dev History page at /dev-history

### Urdu Translations (Sessions 14–19)
- [x] Docs 01–06 all applied and wired (all screens)

### Community Features (Session 17 — 7 Apr 2026)
- [x] Governance.tsx — live DB proposals, quorum bars, tier voting
- [x] FoodSharing.tsx — 3 roles, 3 modes, Food Runner modal
- [x] ImpactDashboard.tsx — v4.9 tokenomics + CFSP waterfall
- [x] Sidebar: Community pages visible to all members
- [x] FloatingBugButton — 25-route screen auto-detection

### Earlier Sessions (Mar–Apr 2026)
- [x] Full submission cycle (camera, GPS, CAPTCHA, Cloudinary, 5 photos)
- [x] Dual moderator blind review + auto-assignment trigger
- [x] Moderator compensation (500 ENB approve / 200 ENB reject)
- [x] Escalation queue + whistleblower mechanism
- [x] My History /history + My Log rich text
- [x] Referral system end-to-end with escrow
- [x] Business Partner system (dashboard, offers, history, settings)
- [x] BusinessDirectory with Leaflet.js map
- [x] CAPTCHA pool — 30 questions, 3 categories, 4 options each
- [x] ENB brand design system + real ENB logo throughout
- [x] Marketing site live (eco-neighbor-site.vercel.app)
- [x] Marketing site Emergency Reserve fix (5%+5% → single 5%)
- [x] Giveth listing — 100/100 score, GIVbacks submitted
- [x] Fi.co Pakistan South Asia 2026 — accepted (Jul 28 – Oct 22)
- [x] Founding Members Handbook v2.0 (v4.9 specs)
- [x] Monthly Founder Update Template (Template 1 of 6)

---

## ⚠️ KNOWN ISSUES

- [ ] TEST user (intuitionalised@gmail.com) balance cleanup SQL still needs to run
- [ ] ScanRedemption success screen: empty member_name/enb_amount (confirm_redemption returns enb_spent not enb_amount — cosmetic)
- [ ] Duplicate PartnerSignup import in App.tsx lines 15+60 (build warning, not breaking)
- [ ] Business Directory profession names English-only (constants.ts needs translation layer)

---

## 🔐 Credentials & Config

- Admin: qahwakhana@gmail.com
- Founder: econeighborisenb@gmail.com
- GitHub app: agrorian/eco-neighbor
- GitHub site: agrorian/enb-site
- Live app: https://eco-neighbor.vercel.app
- Marketing site: https://eco-neighbor-site.vercel.app
- Supabase project: wlbgqygkvlwavmylgteb
- Supabase anon key: sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
- Cloudinary: dl86obm3b / enb_photos (unsigned), enb_profiles (unsigned), enb_cnic_private (signed)
- Resend: re_eHSzkb69_3Q42Ncs4k... (get full key from resend.com)
- Twitter: @econeighbor_enb / @mansehra2020
- Giveth: https://giveth.io/project/eco-neighbor-enb ⚠️ DO NOT EDIT before June 28, 2026
