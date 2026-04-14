# ECO-NEIGHBOR ($ENB) — MASTER CLAUDE SYNC DOCUMENT
**Last updated: 15 April 2026**
**Version: 3.0**
**Maintained by: Muhammad Faisal Khan (Founder) + Claude (AI Collaborator)**

---

## 1. PROJECT IDENTITY — LOCKED, NEVER CHANGE

| Field | Value |
|-------|-------|
| **Canonical name** | Eco-Neighbor ($ENB) — hyphen always |
| **Ticker** | $ENB |
| **Tagline (EN)** | Your Neighborhood Work Has Value! |
| **Tagline (UR)** | آپ کی محنت کی قدر ہے |
| **Positioning** | Starting in Rawalpindi, built to replicate globally |
| **Blockchain** | Solana (SPL Token-2022, 9 decimals, 10B fixed supply) |
| **Spelling** | American English — Neighbor/Neighborhood, NO exceptions |
| **Exception** | "Community Food Sharing Programme" = proper noun, British spelling locked |
| **Category** | #ReFi (Regenerative Finance) — NEVER #DeFi |
| **Community channel** | WhatsApp (Telegram is banned in Pakistan) |
| **ENB is NOT** | A speculative token. Never use: moon, pump, to the moon, price prediction |
| **ENB IS** | Public goods infrastructure. Community reward system. Non-extractive. |

---

## 2. LIVE LINKS & CREDENTIALS

| Platform | URL / Handle |
|----------|-------------|
| **Live app** | https://eco-neighbor.vercel.app |
| **Marketing site** | https://eco-neighbor-site.vercel.app |
| **GitHub** | https://github.com/agrorian/eco-neighbor |
| **Giveth project** | https://giveth.io/project/eco-neighbor-enb |
| **Giveth edit** | https://giveth.io/project/16688/edit |
| **DeVouch** | https://devouch.xyz/project/giveth/16688 |
| **Facebook page** | https://www.facebook.com/EcoNeighborENB |
| **Twitter/X project** | https://x.com/econeighbor_enb |
| **Twitter/X founder** | https://x.com/mansehra2020 |
| **Discord server** | Eco-Neighbor ($ENB)'s server |
| **Gitcoin Passport** | https://passport.gitcoin.co |
| **Founder email** | econeighborisenb@gmail.com |
| **Admin email** | qahwakhana@gmail.com |
| **Supabase** | wlbgqygkvlwavmylgteb.supabase.co |
| **Cloudinary** | Cloud: dl86obm3b, Presets: enb_photos (unsigned), enb_profiles (unsigned), enb_cnic_private (signed) |
| **Resend** | re_eHSzkb69_3Q42Ncs4k... (get full key from resend.com — key truncated for security) |

---

## 3. TOKENOMICS — LOCKED (must sum to exactly 100%)

| Pool | Amount | % |
|------|--------|---|
| Community Rewards Pool (CRP) | 5,000,000,000 | 50% |
| Business Partner Reserve | 1,500,000,000 | 15% |
| ENB.GLOBAL Liquidity Pool | 1,000,000,000 | 10% |
| Impact Grants & Marketing | 1,000,000,000 | 10% |
| Founding Contributor Pool | 500,000,000 | 5% |
| Development Fund | 500,000,000 | 5% |
| Emergency Reserve | 500,000,000 | 5% |
| **TOTAL** | **10,000,000,000** | **100%** |

**CRP rule:** CRP is exclusively for verified civic actions. Never for CGR replenishment, tier bonuses, or any other purpose.

---

## 4. FOUNDING CONTRIBUTOR POOL BREAKDOWN (500M ENB = 100%)

| Role | ENB | % |
|------|-----|---|
| Visionary Founder | 100,000,000 | 20% |
| Community Operations Lead | 65,000,000 | 13% |
| Technical Lead | 65,000,000 | 13% |
| 50 Founding Business Partners (1.3M each) | 65,000,000 | 13% |
| Community Food Guardian Lead | 35,000,000 | 7% |
| Microfinance & Partnerships Lead | 35,000,000 | 7% |
| Marketing & Adoption Lead | 35,000,000 | 7% |
| Community Growth Reserve (CGR) | 35,000,000 | 7% |
| Legal & Compliance Lead | 30,000,000 | 6% |
| Carbon & Impact Data Lead | 25,000,000 | 5% |
| 10 Neighborhood Anchors (1M each) | 10,000,000 | 2% |

**CGR milestone bonuses:** Helper 2,500 ENB | Guardian 5,000 ENB | Pillar 7,500 ENB | Founder Tier 10,000 ENB. When depleted, programme ends. No replenishment ever.

---

## 5. VESTING SCHEDULE (ALL founders, contributors, advisors)

- **Cliff:** 12 months (365 days). Zero tokens before Day 365. No exceptions.
- **Month 12:** 25% released as lump sum
- **Months 13–36:** Remaining 75% in 24 equal monthly tranches (1/24th per month)
- **Total vesting period:** 36 months

---

## 6. MATURATION BRIDGE — LOCKED

- **Time lock:** 365-day continuous hold (no movement)
- **Lifetime cap:** 25% of total lifetime earned balance — ever
- **Max conversions:** 2 events maximum
- **Minimum gap:** 3 years between conversion events
- **Per event:** 12.5% of lifetime balance
- **Reputation gate:** Minimum 50,000 Rep Score (Pillar Tier)
- **Governance:** Batch >500,000 ENB requires community vote

---

## 7. REPUTATION TIERS

| Score | Tier | Key Privilege |
|-------|------|---------------|
| 0–4,999 | Newcomer 🌱 | Basic earn/spend |
| 5,000–19,999 | Helper 🌿 | Verified directory listing |
| 20,000–49,999 | Guardian 🌳 | Can vouch for members |
| 50,000–99,999 | Pillar ⭐ | Governance + Bridge eligible |
| 100,000+ | Founder Tier 🏆 | Co-governance + DAO seat |

---

## 8. TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, shadcn/ui |
| State | Zustand, React Router 7 |
| Backend | Supabase JS 2.98 (Postgres + Auth) |
| Media | Cloudinary (camera lock for submissions; gallery allowed for CNIC only) |
| Hosting | Vercel (auto-deploy from GitHub main) |
| Blockchain | Solana SPL Token-2022 |
| DEX | Raydium (ENB.GLOBAL/USDC) |
| Multi-sig | Squads.so (5-of-7, pending setup) |
| Email | Resend (Edge Function: send-welcome-email deployed) |

**Critical DB rules:**
- RLS ENABLED on: users, submissions, moderator_assignments
- RLS uses JWT app_metadata path: `auth.jwt() -> 'app_metadata' ->> 'user_role'`
- JWT hook deployed: `public.custom_access_token_hook` — role embedded in app_metadata on login
- Role sync trigger: `sync_user_role_to_auth` fires on INSERT OR UPDATE OF role
- After any role change → user must log out and back in to get updated JWT
- No joins in Supabase queries — two-step queries only
- React hooks must appear before any conditional returns
- Never use regex for Urdu — rewrite complete files from scratch
- DB column `neighbourhood_cleanup` — do NOT change spelling (legacy column)
- ENB/Rep rewards: use `formData.actionType` not `selectedAction` (state resets between Suspense steps)

---

## 9. CURRENT PLATFORM STATUS (as of 15 April 2026)

| Platform | Status | Notes |
|----------|--------|-------|
| Live app | ✅ Active | eco-neighbor.vercel.app — **v1.1.0** |
| Giveth listing | ✅ 100/100 Perfect Score | Listed, Active |
| Giveth GIVbacks | ✅ Submitted | Waiting for review |
| Twitter @econeighbor_enb | ✅ Active | 27+ posts |
| Twitter @mansehra2020 | ✅ Active | Public, bio added |
| ENB Discord | ✅ Created | Eco-Neighbor ($ENB)'s server |
| Giveth Discord | ✅ Joined + posted | #shill-your-project posted |
| Facebook page | ✅ Live | facebook.com/EcoNeighborENB |
| Gitcoin GG25 | ⏳ Pending | GG24 ended, GG25 not yet open |
| Gitcoin Passport | ⏳ Pending | passport.gitcoin.co — target score 20+ |
| Squads.so multi-sig | ⏳ Pending | Needed for mainnet deployment |
| SECP registration | ⏳ Pending | Private Limited Company — immediate priority |
| Solana mainnet token | ⏳ Pending | Devnet testing done |
| Giveth QF round | ❌ Wrong chain | Ethereum only — not for ENB |
| Gitcoin QF | ❌ Ruled out | Ethereum only — replace with GreenPill + Celo |
| Fi.co accelerator | ✅ Accepted | July 28 – October 22, 2026 |
| Verra VCS carbon | ⏳ In progress | Methodology drafting |
| RLS security | ✅ Phase 1+2 live | users + submissions + moderator_assignments |
| Welcome email | ✅ Deployed | Resend Edge Function live |
| CNIC verification | ✅ Live | Optional at signup, ENB locked until verified |
| Account Recovery | ✅ Live | /account-recovery — CNIC + name → masked email |
| Dev History page | ✅ Live | /dev-history — public, no auth required |

---

## 10. FUNDING PIPELINE

| Source | Status | Amount | Notes |
|--------|--------|--------|-------|
| Giveth GIVbacks | Submitted, awaiting review | GIV tokens for donors | 1-2 weeks |
| GreenPill Network | Not started | $5K–$25K | Replaces Gitcoin QF |
| Celo Public Goods | Not started | $10K–$100K | Rolling applications |
| UNICEF CryptoFund | Not started | $50K–$100K | Rolling |
| Karandaaz GreenFin | Not started | PKR grants | Book April 2026 slot |
| NICAT Rawalpindi | Not started | Tech support | Book appointment |
| FI Demo Day investors | Target Oct 2026 | $25K–$100K SAFE | Valuation cap $1–2M, 20% discount |

**⚠️ Gitcoin QF ruled out — Ethereum-only chain. Remove from all pitch materials and whitepaper references.**

---

## 11. CANONICAL DECISIONS LOG

| Decision | Value | Date |
|----------|-------|------|
| Positioning statement | Starting in Rawalpindi, built to replicate globally | 28 March 2026 |
| Urdu tagline | آپ کی محنت کی قدر ہے | 28 March 2026 |
| Business offer DB categories | 'discount' and 'swap' (not 'redemption') | Prior session |
| CFSP Waterfall v4.9 | T1: Direct Human Consumption (workers/elderly/schools/orphanages + Pediatric Standard) → T2: Community Kitchen → T3: Processed/Value-Added → T4: Animal Feed → T5: Composting/Biogas | 3 April 2026 |
| Whitepaper version | v4.9 current (v4.8 superseded) | 3 April 2026 |
| App version | v1.1.0 (semantic versioning — separate from whitepaper version) | 15 April 2026 |
| CNIC policy | Optional at signup; ENB locked until admin verified; gallery upload for CNIC only | 15 April 2026 |
| GitHub visibility | Public — transparency is core to ReFi positioning | 15 April 2026 |
| Gitcoin QF | Ruled out — Ethereum only | 15 April 2026 |
| FI equity | Sign 2.5% Warrant at Week 8 — fair for 40+ mentors | 15 April 2026 |
| FI Demo Day investment | SAFE not equity; tokens and equity strictly separate | 15 April 2026 |
| Karachi vs Rawalpindi | Keep Chaklala Scheme 3 as Pilot 1; Karachi = Site 2 Planning Phase only | 15 April 2026 |

---

## 12. SECURITY STATUS (as of 15 April 2026)

**See full report:** ENB_Security_Audit_April2026.docx

| Layer | Status | Notes |
|-------|--------|-------|
| RLS — users table | ✅ ENABLED | 7 policies, JWT app_metadata role check |
| RLS — submissions table | ✅ ENABLED | 5 policies |
| RLS — moderator_assignments | ✅ ENABLED | 4 policies |
| RLS — 6 remaining tables | ⚠️ PENDING Phase 2 | bug_reports, referral_escrow, campaigns, business_partners, partner_applications, bridge_requests |
| JWT custom hook | ✅ DEPLOYED | public.custom_access_token_hook |
| Role sync trigger | ✅ DEPLOYED | sync_user_role_to_auth |
| CNIC photos | ✅ PROTECTED | enb_cnic_private signed preset |
| Cloudinary domain restriction | ⚠️ PARTIAL | Strict referral domain set; per-preset restriction requires paid plan |
| Admin RPC role checks | ⚠️ PENDING Phase 2 | Server-side role verification in RPC functions |
| Account Recovery rate limiting | ⚠️ PENDING Phase 2 | 3 attempts / 15 min / IP |
| AI Vision Layer 3 | 📋 PHASE 2 | DB columns exist; Google Vision API integration pending |
| NADRA verification | 📋 PHASE 3 | Government API access required |
| Squads.so multi-sig | ⏳ PENDING | Needed before mainnet deployment |

---

## 13. GIVETH QUARTERLY UPDATE SCHEDULE

| Date | Action |
|------|--------|
| 28 June 2026 | First quarterly update |
| 28 September 2026 | Second quarterly update |
| 28 December 2026 | Third quarterly update |
| 28 March 2027 | Fourth quarterly update |

**⚠️ DO NOT edit Giveth project description before 28 June 2026.**

### June 28 Giveth Update Checklist (bundle ALL these changes in one edit)
- [ ] Fix project title: "Eco Neighbor ENB" → "Eco-Neighbor ($ENB)"
- [ ] Change "Whitepaper V4.8" → "Whitepaper V4.9" in Traction bullet
- [ ] Add Fi.co accelerator progress update
- [ ] Add Founder Institute Pakistan South Asia 2026 cohort — started July 28
- [ ] Add Facebook page link
- [ ] Update community/follower numbers
- [ ] Add any new partner businesses or pilot milestones
- [ ] Update CFSP waterfall to v4.9 5-tier structure if mentioned

---

## 14. TWITTER FILTER SYSTEM

| Signal | Action |
|--------|--------|
| "moon / pump / collab / DM me / nice execution" | Ignore + Mute |
| "when airdrop" | Firm public reply — ENB has no airdrops |
| "charts look interesting / DM for analysis" | Ignore |
| ".eth address, mentions Giveth/GreenPill/Gitcoin" | Check profile, engage if genuine |
| Asks specific question about ENB mission | Reply in full — treasure these |
| Mentions Rawalpindi / Pakistan | Top priority engagement |
| Generic follow, no message | No action needed |

---

## 15. OPEN TASKS BY WINDOW

### APP DEVELOPMENT WINDOW
- [x] ~~Remove telegram_id column~~ ✅ Done 14 Apr 2026
- [ ] **Urdu Doc 05** — Directory, Leaderboard, Profile (Muhammad translating)
- [ ] **Urdu Doc 06** — Community screens: Food Sharing, Impact, Governance (Muhammad translating)
- [ ] Wire useT() to remaining untranslated components after Docs 05+06
- [ ] Marketing site tokenomics fix: "5%+5%" → single 5% Emergency Reserve
- [ ] Propagate CFSP v4.9 Priority Waterfall to web app
- [ ] CAPTCHA pool expansion — 30+ questions, 3 categories, multiple choice
- [ ] Phase 2 RLS — 6 remaining tables
- [ ] FI Dashboard tasks — review and action
- [ ] Whitepaper vs App gap analysis → ENB Founder Reports window

### FUNDING WINDOW
- [x] ~~Create Facebook page + post Day 1~~ ✅ Done 8 Apr 2026
- [ ] Post Tweet 2 from campaign sequence
- [ ] Post founder origin post on @mansehra2020
- [ ] Set up Gitcoin Passport (target score 20+)
- [ ] Engage SECP lawyer for Private Limited registration
- [ ] Post in GreenPill Discord
- [ ] Facebook Days 2–7 posts
- [ ] GreenPill + Celo grant applications

### WHITEPAPER WINDOW
- Current canonical version: v4.9 (ENB_Whitepaper_v4.9.docx)
- v4.8 superseded
- Note: Gitcoin QF references in whitepaper must be updated to GreenPill + Celo

### LEGAL / STRUCTURE WINDOW
- SECP Private Limited Company — immediate priority
- Section 42 Not-for-Profit — longer term
- Squads.so multi-sig setup pending

### ENB FOUNDER REPORTS WINDOW (NEW)
- [ ] **Whitepaper vs App Feature Gap Analysis** — full comparison of every whitepaper feature vs what's live. Every section checked. Pending items logged with priority. Generate as formal report.

---

## 16. URDU TRANSLATION STATUS

| Doc | Screens | Status |
|-----|---------|--------|
| Doc 01 | Dashboard, Nav, Tiers | ✅ Applied + Wired |
| Doc 02 | Login, Signup, Welcome, About | ✅ Applied + Wired |
| Doc 03 | Submit Action, Form, Review, Success | ✅ Applied + Wired |
| Doc 04 | Wallet, Referral Hub, Bridge, Redemption QR | ✅ Applied + Wired |
| Doc 05 | Directory, Leaderboard, Profile | ⏳ Muhammad translating |
| Doc 06 | Community: Food Sharing, Impact, Governance | ⏳ Muhammad translating |

**Urdu wiring rules:**
- Never use regex for Urdu replacement — rewrites complete files from scratch
- Use `useT()` hook with `l(section, key)` pattern
- `isUrdu` boolean available for RTL layout adjustments
- All new strings go in translations.ts under correct section
- After adding strings to translations.ts — immediately wire the component in same commit

---

## 17. HOW TO USE THIS DOCUMENT

**For Claude in any window:** Read this document at the start of every session. It is the single source of truth for all ENB decisions, platform statuses, and canonical locked values. Never contradict anything in this document without explicit instruction from Muhammad Faisal Khan.

**For Muhammad:** Update this document whenever a major decision is made, a platform goes live, or a status changes. Share the updated version at the start of each new session. Current filename: `CLAUDE_updated_v4_15-April-2026.md`

---

## 18. DOCUMENT SYNC PROTOCOL — WHITEPAPER VERSION ALIGNMENT

### TRIGGER
Any whitepaper version increment (e.g., v4.9 → v5.0) automatically requires a sync review of all documents listed below.

### DOCUMENT REGISTRY & SYNC STATUS (as of Whitepaper v4.9)

| # | Document | Last Synced | v4.9 Status | Priority |
|---|----------|-------------|-------------|----------|
| 1 | **Founding Members Handbook** | v2.0 — 13 Apr 2026 | ✅ SYNCED | Done |
| 2 | **FBP Obligations Report** | v4.9 — Apr 2026 | ✅ SYNCED | Done |
| 3 | **Impact Investor Pitch Deck (HTML)** | v4.7 | 🔴 OUT OF SYNC | High |
| 4 | **Gitcoin Grant Application** | v4.7 | 🔴 OUT OF SYNC | High — also update Gitcoin→GreenPill |
| 5 | **ENB Master Technical Document** | v4.7 | 🔴 OUT OF SYNC | High |
| 6 | **ENB Ecosystem Sustainability Analysis** | v4.4 | 🟡 PARTIAL | Medium |
| 7 | **ENB Failure Scenario Analysis** | v4.4 | 🟡 PARTIAL | Medium |
| 8 | **Carbon Credit Methodology Document** | v4.7 | 🟡 PARTIAL | Medium |
| 9 | **Founders Agreement (Legal)** | v4.6 | 🟡 PARTIAL | Medium |
| 10 | **ENB Landing Page HTML** | v4.7 | 🟡 PARTIAL | Medium |
| 11 | **NDA / IP / Tech Contributor Agreement** | v4.6 | 🟢 LOW RISK | Low |
| 12 | **Carbon Revenue Model** | v4.7 | 🟡 PARTIAL | Medium |
| 13 | **ENB Master Snapshot Document** | v4.8 | 🟡 PARTIAL | Medium |
| 14 | **FI Strategy Reference Document** | NEW — 15 Apr 2026 | ✅ CURRENT | Done |
| 15 | **Security Audit Report** | NEW — 15 Apr 2026 | ✅ CURRENT | Done |

### WHAT EACH DOCUMENT MUST ALWAYS SHOW

| Item | Correct Value |
|------|--------------|
| Total supply | 10,000,000,000 ENB (10 Billion) — never 1B |
| Neighborhood spelling | Neighbor / Neighborhood (no U, ever) |
| Maturation Bridge cap | 25% lifetime, max 2 conversions, 3-year gap, 12.5% per event |
| Vesting | 12-month cliff, 25% Month 12, 1/24th monthly M13–M36 |
| ENB.LOCAL decimals | Whole numbers only |
| Whitepaper version reference | v4.9 (current) |
| CFSP Waterfall | T1: Direct Human (incl. schools/orphanages) → T2: Kitchen → T3: Processed → T4: Animal Feed → T5: Composting |
| Neighborhood Anchors | 10 Anchors, 2% / 10,000,000 ENB, 1,000,000 each |
| Visionary Founder allocation | 100,000,000 ENB (20%) |
| CRP rule | Exclusively for verified civic actions — never anything else |
| Funding sources | GreenPill + Celo (NOT Gitcoin QF — Ethereum only) |

---

**Version:** 3.0 — 15 April 2026
