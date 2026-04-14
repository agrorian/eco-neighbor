# ENB Web App — Master Backlog
*Last updated: 15 Apr 2026 — App v1.1.0 — Whitepaper v4.9*
*Rule: At the start of every session (2h+ gap), check this file first.*

---

## 🔴 IMMEDIATE — Before Next Real User Onboarding

- [ ] **Urdu Doc 05** — Directory, Leaderboard, Profile screens (Muhammad translating)
- [ ] **Urdu Doc 06** — Community screens: Food Sharing, Impact Dashboard, Governance (Muhammad translating)
- [ ] Wire useT() to all remaining untranslated components after Docs 05+06
- [ ] **SECP Private Limited Company registration** — immediate priority before FI cohort
- [ ] Marketing site tokenomics: "5%+5%" → single 5% Emergency Reserve line
- [ ] CFSP v4.9 Priority Waterfall propagation to web app (5-tier display wherever CFSP shown)

---

## 🟡 SHORT TERM — Before FI Cohort Start (July 28, 2026)

- [ ] **FI Dashboard tasks** — review Week 1 checklist in FI portal and map to ENB actions
- [ ] **Giveth June 28 update** (DO NOT EDIT BEFORE THIS DATE): fix title "Eco Neighbor ENB" → "Eco-Neighbor ($ENB)" + bundle v4.9 whitepaper update in one edit
- [ ] Squads.so 5-of-7 multi-sig setup for Emergency Reserve treasury
- [ ] ENB token deployment on Solana devnet (test run — free)
- [ ] Solana mainnet token deployment (after devnet confirmed working)
- [ ] **CAPTCHA pool expansion** — 30+ questions across 3 categories (local knowledge / ENB ecosystem / civic awareness), multiple choice 4 options
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
- [ ] Account Recovery rate limiting (3 attempts / 15 min / IP)
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

- [ ] **Whitepaper vs App Feature Gap Analysis** — full comparison of what's in whitepaper vs what's live in app. Every whitepaper section checked. Pending items logged with priority. To be done in ENB Founder Reports chat window.

---

## ✅ COMPLETED (Sessions 1–19)

### Security (Session 19 — 15 Apr 2026)
- [x] RLS enabled on `users` table with 7 JWT app_metadata policies
- [x] RLS enabled on `submissions` table with 5 policies
- [x] RLS enabled on `moderator_assignments` table with 4 policies
- [x] JWT custom access token hook: `public.custom_access_token_hook` deployed
- [x] Role synced to `auth.users.raw_app_meta_data` via trigger on every role change
- [x] JWT circular reference bug fixed — uses app_metadata path not SELECT FROM users
- [x] `telegram_id` column dropped from users table
- [x] Cloudinary `enb_cnic_private` signed preset created for CNIC photos
- [x] Cloudinary strict referral domain set to eco-neighbor.vercel.app
- [x] Security Audit report generated: ENB_Security_Audit_April2026.docx
- [x] GitHub repo — confirmed public by design (transparency = trust for ReFi grants)

### Identity & CNIC (Session 18 — 14 Apr 2026)
- [x] CNIC identity system — optional at signup, ENB locked until admin verified
- [x] Pakistan auto-formatted CNIC (XXXXX-XXXXXXX-X) + uniqueness check
- [x] International users — optional free-text National ID / Passport field
- [x] CNIC gallery upload allowed (CNIC only — action submissions remain camera-only)
- [x] CnicPrompt.tsx — dashboard banner for existing users without CNIC
- [x] Admin Identity column — Verified/Pending/None badges in UserManagement
- [x] Admin verify modal — ID number, photo, one-click verify
- [x] Unverified visual system — amber ring + lock badge + Unverified pill + locked ENB
- [x] Wallet locked state — blocks Redeem/Bridge for unverified users
- [x] cnic_number, cnic_photo_url, cnic_verified, cnic_submitted_at columns added
- [x] email_change_count column added (2 lifetime email changes maximum)

### Features (Session 18 — 14 Apr 2026)
- [x] Welcome email via Resend Edge Function — full orientation email on every signup
- [x] Account Recovery screen at /account-recovery (CNIC + name → masked email → link)
- [x] Dev History page at /dev-history (public, whitepaper timeline + app build log)
- [x] App version corrected to v1.1.0 across sidebar, More.tsx, Settings.tsx
- [x] Sidebar LTR fix for version string in Urdu RTL mode

### Bug Fixes (Sessions 18–19)
- [x] ENB/Rep always saving 500/200 — fixed by using formData.actionType
- [x] Admin dashboard pending count showing 0 — fixed to show all pending
- [x] Queue removed from admin sidebar (redundant with Mod Queue)
- [x] MobileNav translations — was generated but never pushed; pushed in session 18
- [x] UserManagement Identity column — was missing from table; inserted correctly

### Urdu Translations (Sessions 16–18)
- [x] Doc 01: Dashboard, nav, tiers applied and wired
- [x] Doc 02: Login, Signup, Welcome, About applied and wired
- [x] Doc 03: Submit Action, Action Types, Form, Review, Success applied and wired
- [x] Doc 04: Wallet, Referral Hub, Bridge, Redemption QR applied and wired
- [x] ActionSelector.tsx fully wired with useT()
- [x] Wallet.tsx, ReferralHub.tsx, MaturationBridge.tsx, GenerateRedemptionQR.tsx all wired

### Earlier Sessions (Mar 2026)
- [x] Full submission cycle (camera, GPS, CAPTCHA, Cloudinary upload)
- [x] Dual moderator blind review with auto-assignment trigger
- [x] Moderator compensation (500 ENB approve / 200 ENB reject)
- [x] approve_submission function fixed (single clean signature)
- [x] Real ENB logo everywhere (splash, sidebar, PWA icons)
- [x] My History page at /history with submission cards
- [x] Report This button + foolproof reporting system v2
- [x] Escalation queue with side-by-side mod decisions, 45-second timer
- [x] Root cause fix — approve_submission wrong column names
- [x] Referral system — complete end-to-end (URL param, DB save, escrow, payout)
- [x] Auto-approval trigger — trg_auto_evaluate_mod_decision
- [x] Business Partner system — dashboard, offers, history, settings
- [x] Onboarding team role + volunteer application queue
- [x] BusinessDirectory with Leaflet.js map + clickable pins
- [x] Multi-photo submissions (up to 5 live photos)
- [x] Real-time balance updates via Supabase subscriptions
- [x] ENB brand design system — typography, colors, warm surface
- [x] Tailored submission forms for all 10 civic action types
- [x] CAPTCHA pool — 15 bilingual Urdu/English questions
- [x] Mod Collusion Watch — agreement rate bars in admin dashboard
- [x] Account Switcher — multiple logged-in sessions
- [x] ImpactDashboard.tsx — 7 tokenomics pools, CFSP v4.9 waterfall
- [x] Governance.tsx — live Supabase proposals, quorum bars, tier voting
- [x] FoodSharing.tsx — 3 CFSP roles, 3 collection modes, Food Runner modal
- [x] FloatingBugButton — auto-detects screen from 25-route mapping
- [x] Giveth listing — 100/100 score, GIVbacks submitted
- [x] Fi.co Pakistan South Asia 2026 cohort — accepted (Jul 28 – Oct 22)
- [x] Marketing site — live at eco-neighbor-site.vercel.app

---

## 🗄️ SUPABASE — SQL Run Log
| Date | Command | Purpose | Status |
|------|---------|---------|--------|
| 12 Mar | mod_assignment.sql | Mod assignment trigger | ✅ |
| 13 Mar | mod_compensation.sql | Moderator pay | ✅ |
| 13 Mar | fix_approve_permanent.sql | Approve function fix | ✅ |
| 13 Mar | reporting_system_v2.sql | Fraud reporting | ⏳ PENDING |
| 14 Apr | ADD COLUMN cnic_* (4 columns) | CNIC identity system | ✅ |
| 14 Apr | ADD COLUMN email_change_count | Email change limit | ✅ |
| 14 Apr | DROP COLUMN telegram_id | Remove deprecated col | ✅ |
| 15 Apr | ENABLE RLS users + 7 policies | Phase 1 security | ✅ |
| 15 Apr | ENABLE RLS submissions + 5 policies | Phase 2 security | ✅ |
| 15 Apr | ENABLE RLS moderator_assignments + 4 policies | Phase 2 security | ✅ |
| 15 Apr | CREATE FUNCTION custom_access_token_hook | JWT role embedding | ✅ |
| 15 Apr | CREATE FUNCTION sync_user_role_to_auth + trigger | Role sync | ✅ |
| 15 Apr | UPDATE auth.users SET raw_app_meta_data | Backfill roles | ✅ |

---

## 🔐 Credentials & Config
- Admin: qahwakhana@gmail.com
- Founder email: econeighborisenb@gmail.com
- GitHub: agrorian/eco-neighbor
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
- [ ] Approved submissions briefly still show in admin Queue before page refresh
