# ENB Web App — Master Backlog
*Last updated: 15 Apr 2026 — App v1.2.0 — Whitepaper v4.9*
*Rule: At the start of every session (2h+ gap), check this file first.*

---

## 🔴 IMMEDIATE — Before Registration Drive

- [ ] **Urdu registration materials** — await translations from Muhammad; produce Urdu PDFs using Noto Nastaliq Urdu font
- [ ] **SECP Private Limited Company registration** — immediate priority before FI cohort
- [ ] CFSP v4.9 Priority Waterfall propagation to web app (5-tier display wherever CFSP shown)
- [ ] Fix duplicate PartnerSignup import in App.tsx (lines 15 and 60) — build warning
- [ ] Fix ScanRedemption success screen: confirm_redemption returns `enb_spent` not `enb_amount` — cosmetic only

---

## 🟡 SHORT TERM — Before FI Cohort Start (July 28, 2026)

- [ ] **FI Dashboard tasks** — review Week 1 checklist in FI portal and map to ENB actions
- [ ] **Giveth June 28 update** (DO NOT EDIT BEFORE THIS DATE): fix title + bundle v4.9 whitepaper update in one edit
- [ ] Squads.so 5-of-7 multi-sig setup for Emergency Reserve treasury
- [ ] ENB token deployment on Solana devnet (test run — free)
- [ ] Solana mainnet token deployment (after devnet confirmed working)
- [ ] WhatsApp Meta Cloud API integration for submission notifications (Phase 2 — after FI)
- [ ] Resend welcome email: verify custom domain sender (currently eco-neighbor.vercel.app placeholder)
- [ ] Facebook Days 2–7 posts (scheduled sequence already written — just post)
- [ ] Gitcoin Passport setup (target score 20+) — passport.gitcoin.co
- [ ] Post in GreenPill Discord
- [ ] GreenPill Network grant application ($5K–$25K — replaces Gitcoin QF which is Ethereum-only)
- [ ] Celo Public Goods grant application ($10K–$100K)
- [ ] Carbon credit methodology document — Verra VCS submission prep
- [ ] Karandaaz GreenFin PKR grant — book April 2026 slot
- [ ] NICAT Rawalpindi tech startup support — book appointment
- [ ] Business Directory professions: add translation layer for constants.ts (currently English-only)

---

## 🔵 PHASE 2 SECURITY — Post FI Cohort

- [ ] RLS on remaining 6 tables: `bug_reports`, `referral_escrow`, `campaigns`, `business_partners`, `partner_applications`, `bridge_requests`
- [ ] Server-side role verification inside all admin RPC functions (currently only frontend-checked)
- [ ] Rate limiting on Account Recovery (max 3 attempts / 15 min / IP) — Supabase Edge Function
- [ ] Move Cloudinary cloud name `dl86obm3b` to `VITE_CLOUDINARY_CLOUD_NAME` env var in all 6 files
- [ ] Cloudinary upload domain restriction on `enb_photos` preset (requires paid Cloudinary plan)

---

## 🔵 PHASE 2 FEATURES — Post FI Cohort

- [ ] **AI Vision Layer 3** — Google Vision API photo verification for submissions (Whitepaper Layer 3 of 7-layer stack). DB columns `ai_confidence_score` + `ai_rejection_reason` already exist — need API integration
- [ ] **NADRA verification** — Step 3 of CNIC flow (confirm CNIC against national database). Requires government API access
- [ ] **Live video check** for identity Step 2 (user holds ID + video selfie). Designed but not built
- [ ] **pHash duplicate photo detection** across submissions (Whitepaper Layer 2 anti-fraud)
- [ ] **Cross-Neighbourhood AI Anomaly Monitor** (Whitepaper Layer 7) — weekly scan for duplicate GPS, same-time clusters, vote-period spikes
- [ ] ENB.GLOBAL Raydium DEX listing (ENB.GLOBAL/USDC pool) — after 1,000 active wallets
- [ ] JazzCash/Easypaisa bridge for ENB.GLOBAL cash conversion (Phase 3+)
- [ ] DAO transition setup (Snapshot.org) — triggers at 10,000 active wallets (Month 18+)
- [ ] Second neighborhood pilot launch — Karachi (Site 2 — Planning Phase)
- [ ] **Burn mechanism** — 2% of every ENB.LOCAL redemption permanently burned (Whitepaper §5.7)
- [ ] **ENB-CSU basket quarterly community vote** mechanism (Whitepaper §24)
- [ ] **8-metric early warning dashboard** for ecosystem collapse indicators (Whitepaper §risk)
- [ ] **Founder Responsibility Dashboard** with vesting consequences for inactivity
- [ ] Auto-replenishment protocol for business partner floats at 30% threshold
- [ ] Missing 3 days Daily Log → WhatsApp alert
- [ ] Missing 7 days → FORMAL_ABSENCE status
- [ ] Float WhatsApp notification at 40% threshold
- [ ] Real ENB Support WhatsApp number in Settings (currently placeholder: 923001234567)
- [ ] Service worker cache-busting

---

## 📋 REPORTS PENDING (ENB Founder Reports Window)

- [ ] **Whitepaper vs App Feature Gap Analysis** — full comparison of what's in whitepaper vs what's live in app
- [ ] **Founder Report Templates 2–6** (Template 1 complete)

---

## ✅ COMPLETED (Sessions 1–20)

### QR Code & Redemption (Session 20 — 15 Apr 2026)
- [x] Real scannable QR code in GenerateRedemptionQR.tsx (qrcode npm, Option B full URL)
- [x] Real scannable QR code in ReferralHub.tsx
- [x] /scan route auto-populates from ?code= URL param
- [x] confirm_redemption called correctly: (p_qr_code text) only — no p_business_id
- [x] cancel_redemption_qr verified: uses p_qr_token (not p_qr_code)
- [x] toUpperCase() removed from QR code lookup (DB stores lowercase UUIDs)
- [x] maxLength increased from 12 to 36 in ScanRedemption manual entry
- [x] npm install qrcode @types/qrcode

### SQL Fixes (Session 20 — 15 Apr 2026)
- [x] Stale submissions policies dropped (circular SELECT FROM users pattern)
- [x] business_scan_redemption RLS fixed ('business' → 'business_partner')
- [x] Legacy cnic column dropped from users table
- [x] users_referral_children policy confirmed live

### Registration Drive Materials (Session 20 — 15 Apr 2026)
- [x] 4 English PDFs: Flyer A5, Registration Guide, Action Reference Card, MOU Summary
- [x] 4 English Word docs for translation workflow
- [x] 4 Urdu PDFs with Noto Nastaliq Urdu font (pending translation review)
- [x] Noto Nastaliq Urdu font (Regular + Bold) integrated

### Supabase Ground Truth Audit (Session 20 — 15 Apr 2026)
- [x] Full table/column schema documented (all 25 tables)
- [x] All RPC signatures verified from pg_proc
- [x] All triggers documented
- [x] All RLS policies documented
- [x] Ground truth stored in CLAUDE.md Section 13

### Security (Session 19 — 15 Apr 2026)
- [x] RLS enabled on `users` table with 7 JWT app_metadata policies
- [x] RLS enabled on `submissions` table with 5 policies
- [x] RLS enabled on `moderator_assignments` table with 4 policies
- [x] RLS enabled on `redemptions` table with 5 policies
- [x] JWT custom access token hook: `public.custom_access_token_hook` deployed
- [x] Role synced to `auth.users.raw_app_meta_data` via trigger on every role change
- [x] `telegram_id` column dropped from users table
- [x] Cloudinary `enb_cnic_private` signed preset created for CNIC photos
- [x] Security Audit report generated: ENB_Security_Audit_April2026.docx

### Identity & CNIC (Session 18 — 14 Apr 2026)
- [x] CNIC identity system — optional signup, ENB locked until admin verified
- [x] Admin Identity column — Verified/Pending/None badges
- [x] Welcome email via Resend Edge Function deployed
- [x] Account Recovery at /account-recovery
- [x] Dev History page at /dev-history

### Urdu Translations (Sessions 16–19)
- [x] Docs 01–06 all applied and wired (all components)

### Earlier Sessions (Mar 2026)
- [x] Full submission cycle (camera, GPS, CAPTCHA, Cloudinary upload)
- [x] Dual moderator blind review with auto-assignment trigger
- [x] Moderator compensation (500 ENB approve / 200 ENB reject)
- [x] Real ENB logo everywhere (splash, sidebar, PWA icons)
- [x] My History page at /history
- [x] Escalation queue
- [x] Referral system — complete end-to-end
- [x] Business Partner system — dashboard, offers, history, settings
- [x] BusinessDirectory with Leaflet.js map
- [x] Multi-photo submissions (up to 5 live photos)
- [x] ENB brand design system
- [x] Tailored submission forms for all 10 civic action types
- [x] CAPTCHA pool — 30 questions, 3 categories, 4 options each
- [x] ImpactDashboard.tsx — 7 tokenomics pools, CFSP v4.9 waterfall
- [x] Governance.tsx — live Supabase proposals, quorum bars, tier voting
- [x] FoodSharing.tsx — 3 CFSP roles, 3 collection modes, Food Runner modal
- [x] FloatingBugButton — auto-detects screen from 25-route mapping
- [x] Giveth listing — 100/100 score, GIVbacks submitted
- [x] Fi.co Pakistan South Asia 2026 cohort — accepted (Jul 28 – Oct 22)
- [x] Marketing site — live at eco-neighbor-site.vercel.app
- [x] Marketing site Emergency Reserve fix (5%+5% → single 5%)

---

## 🗄️ SUPABASE — SQL Run Log
| Date | Command | Purpose | Status |
|------|---------|---------|--------|
| 12 Mar | mod_assignment.sql | Mod assignment trigger | ✅ |
| 13 Mar | mod_compensation.sql | Moderator pay | ✅ |
| 13 Mar | fix_approve_permanent.sql | Approve function fix | ✅ |
| 14 Apr | ADD COLUMN cnic_* (4 columns) | CNIC identity system | ✅ |
| 14 Apr | ADD COLUMN email_change_count | Email change limit | ✅ |
| 14 Apr | DROP COLUMN telegram_id | Remove deprecated col | ✅ |
| 15 Apr | ENABLE RLS users + 7 policies | Phase 1 security | ✅ |
| 15 Apr | ENABLE RLS submissions + 5 policies | Phase 2 security | ✅ |
| 15 Apr | ENABLE RLS moderator_assignments + 4 policies | Phase 2 security | ✅ |
| 15 Apr | ENABLE RLS redemptions + 5 policies | Phase 2 security | ✅ |
| 15 Apr | CREATE FUNCTION custom_access_token_hook | JWT role embedding | ✅ |
| 15 Apr | CREATE FUNCTION sync_user_role_to_auth + trigger | Role sync | ✅ |
| 15 Apr | UPDATE auth.users SET raw_app_meta_data | Backfill roles | ✅ |
| 15 Apr | DROP POLICY "Admins can read/update all submissions" | Remove stale policies | ✅ |
| 15 Apr | DROP + CREATE business_scan_redemption policy | Fix 'business'→'business_partner' | ✅ |
| 15 Apr | ALTER TABLE users DROP COLUMN cnic | Remove legacy column | ✅ |

---

## 🔐 Credentials & Config
- Admin: qahwakhana@gmail.com
- Founder email: econeighborisenb@gmail.com
- GitHub app: agrorian/eco-neighbor
- GitHub site: agrorian/enb-site
- Live app: https://eco-neighbor.vercel.app
- Marketing site: https://eco-neighbor-site.vercel.app
- Supabase project: wlbgqygkvlwavmylgteb
- Supabase anon key: sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
- Cloudinary: dl86obm3b / presets: enb_photos (unsigned), enb_profiles (unsigned), enb_cnic_private (signed)
- Resend: re_eHSzkb69_3Q42Ncs4k... (get full key from resend.com)
- Twitter: @econeighbor_enb / @mansehra2020
- Giveth: https://giveth.io/project/eco-neighbor-enb (DO NOT EDIT before June 28, 2026)

---

## ⚠️ KNOWN ISSUES
- [ ] TEST user (intuitionalised@gmail.com) balance cleanup SQL still needs to run
- [ ] reporting_system_v2.sql — still marked pending from March (verify if needed)
- [ ] Approved submissions briefly still show in admin Queue before page refresh (cosmetic)
- [ ] ScanRedemption success screen shows empty member_name/enb_amount — confirm_redemption returns enb_spent not enb_amount (cosmetic)
- [ ] Duplicate PartnerSignup import in App.tsx lines 15 and 60 (build warning, not breaking)
