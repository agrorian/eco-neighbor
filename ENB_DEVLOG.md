# ENB Dev Log — Daily Work Record
*Permanent file — append new sessions at the top, never delete old entries.*
*At session start: read CLAUDE.md + ENB_DEVLOG.md + ENB_BACKLOG.md first.*

---

### 18 Apr 2026 — Whitepaper Corrections + Marketing Site + Documents — All day PKT
**Focus:** Final whitepaper v5.0 corrections, marketing site index.html full audit and fix, 3 synced documents built, file naming convention established

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | Whitepaper v5.0 — all table corrections | Summary table SPR at row 2, Anchors 0%/Honorary, FBP deleted, correct percentages |
| 2 | Whitepaper v5.0 — detailed roster table corrected | SPR row #2 added, COL renumbered to #3, rows 3-8 cascade-renumbered |
| 3 | Whitepaper v5.0 — version history cleaned | Single CURRENT row, single PREV row for v4.9 |
| 4 | Whitepaper v5.0 — header corrected | header1.xml: v4.7 → v5.0, March → April 2026 |
| 5 | Whitepaper v5.0 — app version corrected | v1.2.0 → v1.3.0 in all 3 active references |
| 6 | Whitepaper v5.0 — remaining burn language removed | Body text updated to 10% treasury routing |
| 7 | marketing site index.html — 12 bugs fixed | Full list in Bugs Fixed section below |
| 8 | index.html verified — 27/27 audit checks passed | Counter, Emergency Reserve, mobile nav, all version refs |
| 9 | Impact Investor Pitch Deck v5.0 (HTML) | 15 slides, keyboard+touch+dot nav, all v5.0 specs, Business Liquidity Gate slide, Treasury Fund slide |
| 10 | Grant Application v5.0 (Word docx) | GreenPill/Celo/UNICEF CryptoFund — 10 sections, full v5.0 content, CFSP waterfall table |
| 11 | ENB Master Technical Document v5.0 (Word docx) | 10 parts: token specs, architecture ASCII, tokenomics, founding pool, Business Liquidity Gate flow, Maturation Bridge, Supabase ground truth, 7-layer stack, CFSP waterfall, hard rules |
| 12 | File naming convention established | Permanent: CLAUDE.md / ENB_DEVLOG.md / ENB_BACKLOG.md (no date stamps ever again) |
| 13 | Morning Briefing Routine prompt written | Ready to paste into Claude Routines — see CLAUDE.md Section 23 |
| 14 | Routines capabilities and limitations explained | Routines can READ project files but CANNOT write/modify/delete them — manual upload still required |
| 15 | CLAUDE.md v7 produced | Updated for all 18 Apr decisions, permanent filename |
| 16 | ENB_DEVLOG.md updated | This entry appended at top |
| 17 | ENB_BACKLOG.md updated | Marketing site items marked complete, document sync items updated |

#### 🐛 Bugs Fixed (marketing site index.html)
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| Counter showing 0 for 3.4B | data-target="3,400,000,000" — commas make parseInt() return NaN | data-target="3400000000" |
| Emergency Reserve bar at 10% width | CSS width:10% despite 5% allocation | width:5% |
| Duplicate impact-note in 5B stat | Two <div class="impact-note"> stacked | Merged into one |
| Reveal animation never triggered | .reveal started at opacity:1 so IntersectionObserver found nothing to animate | opacity:0 + translateY(20px) start state |
| Hero badge showing v4.9 | Stale version reference | v5.0 |
| Whitepaper request mailto links → v4.9 | Stale in subject + body of mailto | v5.0 |
| Footer version labels → v4.9 | Two footer instances | v5.0 |
| Gitcoin QF investor card | Gitcoin QF = Ethereum only, ruled out for ENB | Replaced with GreenPill Network card |
| Layer metaphor → Gitcoin QF | Old text in ENB.GLOBAL layer | GreenPill · Celo Public Goods |
| Footer "Giveth QF Round" label | Misleading label | Changed to "Support on Giveth" |
| Mobile hamburger menu never opened | onclick used this.nextElementSibling which pointed at nothing | id="navLinks", getElementById(), .show CSS rule added |
| Tokenomics alloc-detail → Gitcoin | Stale reference | GreenPill, Celo, UNICEF CryptoFund, municipal grants |

#### 📁 Files Changed
| File | Location | Change |
|------|-----------|--------|
| ENB_Whitepaper_v5.0.docx | outputs/ | Final corrected version — all table/header/version fixes |
| index.html | outputs/ → GitHub enb-site | 12 bugs fixed, 27/27 audit checks pass |
| ENB_Impact_Investor_Pitch_Deck_v5.html | outputs/ | New — 15 slides, v5.0 specs |
| ENB_Grant_Application_v5.docx | outputs/ | New — GreenPill/Celo/UNICEF, 10 sections |
| ENB_Master_Technical_Document_v5.docx | outputs/ | New — 10 parts, complete technical reference |
| CLAUDE.md | outputs/ → Project Files + GitHub root | v7.0, permanent filename |
| ENB_DEVLOG.md | outputs/ → Project Files + GitHub root | 18 Apr session appended |
| ENB_BACKLOG.md | outputs/ → Project Files + GitHub root | Updated |

#### ⏭️ Next Plan of Action
1. Muhammad: Upload CLAUDE.md, ENB_DEVLOG.md, ENB_BACKLOG.md to Project Files (delete old dated files)
2. Muhammad: Push index.html to GitHub enb-site repo (`git add index.html && git commit -m "fix: counter, mobile nav, v5.0 refs, GreenPill" && git push`)
3. Muhammad: Set up Morning Briefing Routine in Claude (paste CLAUDE.md Section 23 prompt)
4. Continue App: CFSP waterfall propagation to web app, Phase 2 RLS (6 tables)
5. Founding Members Handbook v2.0 — update to v5.0 founding pool

#### 📝 Notes / Decisions Made
- PERMANENT FILE NAMES from today: CLAUDE.md / ENB_DEVLOG.md / ENB_BACKLOG.md — no date stamps
- Old dated files (CLAUDE_updated_v*_*.md) should be deleted from Project Files
- Routines: can read project files but CANNOT write/modify/delete — Muhammad must still manually replace files after each session
- Marketing site counter: animateCounter() already formats output correctly — only data-target value needed fixing (remove commas)
- 27/27 audit checks confirmed on index.html before delivery

---

### 17 Apr 2026 — Whitepaper v5.0 Build — ~8:00 AM to ~6:00 PM PKT
**Focus:** Complete Whitepaper v5.0 — full tokenomics redesign, Business Liquidity Gate, Community Treasury Fund, Strategic Partnership Reserve

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | 3rd-party critique reviewed | Hostile reviewer lens; separated valid risks from wrong recommendations |
| 2 | 2% burn → 10% Community Treasury Contribution | Treasury recycles value instead of destroying it |
| 3 | Business Liquidity Gate designed | Businesses earn ENB.GLOBAL via atomic burn-and-mint; no external fund needed |
| 4 | Community Treasury Fund designed | 4 pools: Stability 30%, Market Making 20%, Insurance 20%, Reserve 30% |
| 5 | Strategic Partnership Reserve designed | 75M ENB.GLOBAL at position #2 (15%); max 5M per partner; deliverable-tied vesting |
| 6 | Founding Business Partners removed from Founding Pool | Earn via Business Liquidity Gate — no upfront allocation |
| 7 | Neighborhood Anchors made honorary | 0 tokens; recognition only |
| 8 | Founding Pool restructured — 10 positions descending | SPR at #2; all positions reordered by % |
| 9 | Business Liquidity Gate conditions locked | 365-day hold, Pillar Tier, 50K ENB/release, 2 releases/year, 6-month gap, NO lifetime cap |
| 10 | Atomic burn-and-mint confirmed feasible on Solana | PDA holds mint authority; total supply unchanged |
| 11 | Part B deleted from whitepaper | 72,532 chars of XML removed |
| 12 | Executive Summary rewritten — 10-point v5.0 list | "Nine Major Upgrades" copy-paste from v4.7/v4.8/v4.9 replaced |
| 13 | App version v1.2.0 → v1.3.0 throughout | v1.3.0 confirmed in Chat 5 (15 Apr) |
| 14 | FBP references in body text updated | Roadmap, Community Day — changed to "business partners" |
| 15 | CLAUDE.md v6 produced | All v5.0 decisions captured |

#### 📝 Notes / Decisions Made
- v1.3.0 confirmed current — Web App Dev Chat 5 (15 Apr 2026)
- Business Liquidity Gate has no lifetime cap — intentional; rewards sustained participation
- "Conversion" = Maturation Bridge only; business ENB.GLOBAL earning = "Release" or "DEX Unlock"
- All FBP references in version history rows = intentional historical records; do not change

---

### 15 Apr 2026 — Session 20 — ~6:00 PM to ~11:30 PM PKT
**Focus:** QR code implementation, /scan route, registration materials, Supabase audit, app v1.3.0

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | Real scannable QR code in GenerateRedemptionQR.tsx | qrcode npm; Option B full URL; green on white; 200px |
| 2 | Real QR in ReferralHub.tsx | 160px with caption |
| 3 | /scan route auto-populate from ?code= URL param | Business scans → app opens → auto-processes |
| 4 | confirm_redemption (p_qr_code text) only | Single param; removed p_business_id |
| 5 | cancel_redemption_qr uses p_qr_token | Ground truth verified |
| 6 | Remove toUpperCase() from ScanRedemption | DB stores lowercase UUIDs |
| 7 | maxLength 12→36 in ScanRedemption | QR codes = 36-char UUIDs |
| 8 | SQL: Drop stale submissions policies | Circular SELECT FROM users |
| 9 | SQL: Fix business_scan_redemption RLS | 'business' → 'business_partner' |
| 10 | SQL: DROP COLUMN cnic | Legacy column |
| 11 | Full Supabase ground truth audit | All tables/RPC/triggers/RLS documented |
| 12 | 4 English + 4 Urdu registration drive materials | PDFs with Noto Nastaliq Urdu font |
| 13 | Daily log rich text toolbar + 3000 char limit | Bold, bullet, numbered list buttons |
| 14 | App version bumped to v1.3.0 | DesktopSidebar, Settings, More, VersionHistory |

#### 🐛 Bugs Fixed
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| QR code was text | No QR library | qrcode npm + toDataURL() |
| confirm_redemption failed | Wrong params | Single param p_qr_code |
| cancel_redemption_qr failed | Wrong param | p_qr_token |
| ScanRedemption rejected valid codes | toUpperCase() | Removed |
| ScanRedemption rejected long codes | maxLength={12} | maxLength={36} |
| business_scan_redemption RLS | 'business' vs 'business_partner' | Dropped + recreated |

---

### 15 Apr 2026 — Session 19 — ~12:00 PM to ~6:00 PM PKT
**Focus:** Urdu Docs 05+06, RLS Phase 1 security, JWT hooks

#### ✅ Key Items
- Urdu Docs 05+06 applied (all screens now bilingual)
- RLS enabled: users (7 policies), submissions (5), moderator_assignments (4), redemptions (5)
- JWT custom access token hook deployed: public.custom_access_token_hook
- Role sync trigger deployed: sync_user_role_to_auth

---

### 14 Apr 2026 — Session 18 — ~6:00 PM to ~11:00 PM PKT
**Focus:** CNIC identity, welcome email, account recovery, Urdu Docs 02-04

#### ✅ Key Items
- CNIC verification system — optional signup, ENB locked until admin verified
- CNIC uses enb_cnic_private signed Cloudinary preset (security)
- Welcome email via Resend Edge Function deployed
- Account Recovery at /account-recovery (CNIC + name → masked email)
- Dev History page at /dev-history (public)
- Urdu Docs 02+03+04 wired (Login, Signup, Wallet, Bridge, Redemption QR)
- App version → v1.1.0

---

### 7 Apr 2026 — Session 17 — PKT
**Focus:** Community features — Governance, CFSP, Impact Dashboard

#### ✅ Key Items
- Governance.tsx: live DB proposals, tier-based voting, quorum bars, proposal type badges
- FoodSharing.tsx: 3 CFSP roles, 3 collection modes, v4.9 waterfall, Food Runner registration modal
- ImpactDashboard.tsx: 7 tokenomics pools, CFSP v4.9 waterfall, food stats
- Sidebar: Food Sharing, Community Impact, Governance now visible to all members (was gated)
- FloatingBugButton: auto-detects screen from 25-route mapping; source + screen_path in DB

---

### Sessions 1–16 (Mar–Apr 2026) — Cumulative Summary

**App built from scratch to v1.1.0:**
- Full submission cycle (camera, GPS, CAPTCHA, Cloudinary, 5 photos)
- Dual moderator blind review + auto-assignment trigger
- Moderator compensation (500 ENB approve / 200 ENB reject)
- Escalation queue + whistleblower mechanism
- My History /history + My Log with rich text
- Referral system end-to-end with escrow
- Business Partner system (dashboard, offers, history, settings, Leaflet map directory)
- CAPTCHA pool: 30 questions, 3 categories, 4 options each
- Urdu translation: Docs 01–04 applied across all screens
- ENB brand design system + real ENB logo throughout
- Marketing site live (eco-neighbor-site.vercel.app)
- Giveth listing: 100/100 perfect score, GIVbacks submitted
- Fi.co Pakistan South Asia 2026 cohort: accepted (Jul 28 – Oct 22, 2026)
- Founding Members Handbook v2.0
- Monthly Founder Update Template (Template 1 of 6)
- WhatsApp as community channel (Telegram banned in Pakistan)

---

## 🗄️ SUPABASE — Complete SQL Run Log

| Date | Command | Purpose | Status |
|------|---------|---------|--------|
| 12 Mar | mod_assignment.sql | Mod assignment trigger | ✅ |
| 13 Mar | mod_compensation.sql | Moderator pay | ✅ |
| 13 Mar | fix_approve_permanent.sql | Approve function fix | ✅ |
| 14 Apr | ADD COLUMN cnic_number, cnic_photo_url, cnic_verified, cnic_submitted_at | CNIC identity | ✅ |
| 14 Apr | ADD COLUMN email_change_count | Email limit | ✅ |
| 14 Apr | DROP COLUMN telegram_id | Remove deprecated | ✅ |
| 15 Apr | ENABLE RLS users + 7 policies | Phase 1 security | ✅ |
| 15 Apr | ENABLE RLS submissions + 5 policies | Phase 1 security | ✅ |
| 15 Apr | ENABLE RLS moderator_assignments + 4 policies | Phase 1 security | ✅ |
| 15 Apr | ENABLE RLS redemptions + 5 policies | Phase 1 security | ✅ |
| 15 Apr | CREATE FUNCTION custom_access_token_hook | JWT role embedding | ✅ |
| 15 Apr | CREATE FUNCTION sync_user_role_to_auth + trigger | Role sync | ✅ |
| 15 Apr | UPDATE auth.users SET raw_app_meta_data | Backfill roles | ✅ |
| 15 Apr | DROP POLICY "Admins can read/update all submissions" | Stale circular-ref | ✅ |
| 15 Apr | DROP + CREATE business_scan_redemption ON redemptions | Fix role name | ✅ |
| 15 Apr | ALTER TABLE users DROP COLUMN cnic | Remove legacy | ✅ |
