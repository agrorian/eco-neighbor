# ENB Dev Log — Daily Work Record
*Permanent file — append new sessions at the top, never delete old entries.*
*At session start: read CLAUDE.md + ENB_DEVLOG.md + ENB_BACKLOG.md first.*

---

### 19 Apr 2026 — Social Media Content Session
**Window:** Social Media Content
**Focus:** 20 Facebook posts, 13 Twitter tweets, Facebook Stories, Buffer setup, Urdu BiDi fix, image review

#### ✅ Completed
| # | Action | Notes |
|---|--------|-------|
| 1 | Facebook URL corrected | EcoNeighborENB → ENBEcoNeighbor in CLAUDE.md (was wrong in lines 55 + 208) |
| 2 | CLAUDE.md v8.1 produced | FB URL fix, decision log entry added |
| 3 | 7 Facebook posts (Days 8–14) reproduced | Full English + Urdu + Gemini image prompts |
| 4 | 7 Gemini images reviewed | All 7 approved ✅ — consistent branding, authentic Rawalpindi settings |
| 5 | Facebook Stories strategy defined | 3 story types: Did You Know, Feed Teasers, Behind-the-Scenes |
| 6 | Stories S1–S5 planned | Using existing 7 posts as source images |
| 7 | Story S1 (Ustad Hamid) executed | Text overlay corrected, direct post link added, posted ✅ |
| 8 | Facebook scheduling corrected | Posts 8–13 on Apr 19–24, post 14 on May 1 |
| 9 | 6 new Facebook posts (Days 15–20) written | Apr 25–30 gap filled |
| 10 | BiDi problem identified and solved | $ENB mid-sentence breaks RTL rendering on Facebook |
| 11 | Urdu writing house rules locked | $ENB standalone only; ٹوکن mid-sentence; numbers in Urdu words |
| 12 | واسطہ replaces بچولیا | Permanently across all Urdu ENB content |
| 13 | All 6 Urdu posts rewritten under new rules | No LTR characters mid-sentence |
| 14 | 5 remaining Gemini images reviewed | All 5 approved ✅ — Bibi Zainab doorway named best of entire series |
| 15 | 6 Twitter posts (initial batch) written | Some date conflicts identified and corrected |
| 16 | 13 Twitter posts written — full Apr 19–May 1 | One per day, matching Facebook theme and image |
| 17 | Twitter schedule rebuilt from scratch | Clean master schedule, no gaps, no duplicates |
| 18 | Buffer recommended and adopted | Free tool for Twitter + Facebook scheduling |
| 19 | Meta Business Suite recommended | Free Facebook-only scheduler as alternative |
| 20 | Claude windows named and scoped | Social Media Content / App Development / Whitepaper / Funding |
| 21 | CLAUDE.md v9.0 produced | All session decisions incorporated |
| 22 | ENB_DEVLOG.md updated | This entry |
| 23 | ENB_BACKLOG.md updated | Tasks marked complete, new tasks added |

#### 📱 Facebook Posts — Final Schedule
| Day | Date | Theme | Image | Status |
|---|---|---|---|---|
| 8 | Apr 19 | Fi.co acceptance | Aerial Rawalpindi | ✅ Scheduled |
| 9 | Apr 20 | App v1.3.0 | Hands + QR | ✅ Scheduled |
| 10 | Apr 21 | CFSP food story | Tiffins kitchen | ✅ Scheduled |
| 11 | Apr 22 | 47 professions | Street market | ✅ Scheduled |
| 12 | Apr 23 | Liquidity Gate | Ustad Hamid | ✅ Scheduled |
| 13 | Apr 24 | Community Treasury | Roundabout | ✅ Scheduled |
| 15 | Apr 25 | The Moderator | Split screen | ✅ Scheduled |
| 16 | Apr 26 | Bibi Zainab | Doorway ⭐ | ✅ Scheduled |
| 17 | Apr 27 | Circular economy | Stone well | ✅ Scheduled |
| 18 | Apr 28 | Neighborhood Anchor | Elder in alley | ✅ Scheduled |
| 19 | Apr 29 | Anti-fraud 7 layers | Shield rings | ✅ Scheduled |
| 20 | Apr 30 | Labour Day eve | Night street | ✅ Scheduled |
| 14 | May 1 | Labour Day closing | Workers sunrise | ✅ Scheduled |

#### 🐦 Twitter Posts — Final Schedule
13 tweets, Apr 19–May 1, one per day, same images as Facebook, via Buffer.

#### 🔑 Key Decisions Made
- BiDi rule: $ENB never mid-sentence in Urdu — use ٹوکن
- واسطہ replaces بچولیا permanently
- Buffer adopted for post scheduling
- Facebook Stories: post 30 minutes before each feed post
- Direct post links (not page links) used in Stories link buttons
- Claude windows formally named and scoped

#### 📝 Notes
- Bibi Zainab doorway image (Day 16) — unanimously the strongest human image in the entire 20-post series
- Seven shield rings image (Day 19) — strongest infrastructure/trust image
- Stone well courtyard (Day 17) — most visually creative concept execution
- All 20 Gemini images approved, zero rejections — consistent branding throughout

---

### 18 Apr 2026 — Marketing Site Full Upgrade — Evening Session (~3:00 PM to ~10:00 PM PKT)
**Focus:** Marketing site v5.0 upgrade — 5 new sections, 2 modals, all content fixes, treasury math correction, file truncation fix

#### ✅ Completed
| # | Action | Notes |
|---|--------|-------|
| 1 | Diagnosed root cause of blank sections | File was truncated at `document.querySele` — unclosed script tag caused browser to parse all HTML as JS |
| 2 | Fixed file truncation | Appended correct closing: querySelectorAll + </script></body></html> |
| 3 | Fixed IntersectionObserver reveal system | threshold:0 + positive rootMargin + 600ms setTimeout fallback + immediate revealVisible() on load |
| 4 | Added CFSP section | 5-tier Priority Waterfall (T1a–T5), 3 CFSP roles with ENB earnings, carbon callout (4.2 kg CO₂e) |
| 5 | Added Traction section | 6 cards: Fi.co, Giveth 100/100, App v1.3.0, Urdu interface, CNIC, Whitepaper v5.0 |
| 6 | Added Why ENB Survives section | 7-row comparison table + Strategic Partnership Reserve box |
| 7 | Added Business Liquidity Gate section | 4-step atomic flow + 6 condition cards |
| 8 | Added Community Treasury section | 5 pool rows (correct math) + burn vs recycle comparison |
| 9 | Fixed treasury pool math | Market Making (20%=1.3%) and Insurance (20%=1.3%) split into TWO separate rows |
| 10 | Fixed stale content | 40+→47 professions, Maturation Bridge spec corrected, stale FBP line removed |
| 11 | Fixed Founding Contributors alloc-detail | "max 10%/year sale restriction" → "12-month cliff · 25% at Month 12 · 36-month vest" |
| 12 | Fixed ENB.GLOBAL layer card | Old "Founder sale restriction" → "Maturation Bridge: 25% lifetime cap · 365-day hold · max 2 conversions" |
| 13 | Updated nav links | Added Food Sharing + Traction nav items |
| 14 | Expanded Impact grid | 4 cards → 6 cards (added 47 professions, 4.2 kg CO₂e) |
| 15 | Built Partnership Enquiry modal | Form → Supabase partnership_enquiries |
| 16 | Built Whitepaper Request modal | Form → Supabase whitepaper_requests (manual fulfilment) |
| 17 | Created Supabase tables | partnership_enquiries + whitepaper_requests — RLS + anon INSERT |
| 18 | Removed email address from footer | Replaced with modals |
| 19 | Fixed ENB.LOCAL Metamorphosis | "metamorphoses" → "Metamorphosis" |
| 20 | Ran 35-point integrity audit | All checks passed |
| 21 | Produced CLAUDE.md v8.0, DEVLOG, BACKLOG | Session documentation complete |

---

### 18 Apr 2026 — Morning Session — (~8:00 AM to ~3:00 PM PKT)
**Focus:** Whitepaper v5.0 final corrections, marketing site initial fixes, file naming convention, Morning Briefing Routine setup

#### ✅ Completed
| # | Action | Notes |
|---|--------|-------|
| 1 | Whitepaper v5.0 — all table corrections | Summary table SPR at row 2, Anchors 0%/Honorary, FBP deleted |
| 2 | Whitepaper v5.0 — detailed roster table corrected | SPR row #2, COL to #3, cascade renumber |
| 3 | Whitepaper v5.0 — header corrected | header1.xml: v4.7→v5.0, March→April 2026 |
| 4 | Whitepaper v5.0 — app version | v1.2.0→v1.3.0 in all 3 active references |
| 5 | Whitepaper v5.0 — version history | Single CURRENT, single PREV — no duplicates |
| 6 | Marketing site — 12 initial bugs fixed | Counter, Emergency Reserve bar, reveal CSS, v4.9→v5.0, Gitcoin→GreenPill, mobile nav, footer labels |
| 7 | Marketing site — verified 27/27 checks | All fixes confirmed |
| 8 | File naming convention established | Permanent: CLAUDE.md / ENB_DEVLOG.md / ENB_BACKLOG.md |
| 9 | Impact Investor Pitch Deck v5.0 | 15-slide HTML |
| 10 | Grant Application v5.0 (docx) | GreenPill/Celo/UNICEF |
| 11 | ENB Master Technical Document v5.0 (docx) | 10 parts |
| 12 | Morning Briefing Routine prompt written | Daily use |

---

### 17 Apr 2026 — Whitepaper v5.0 Build — ~8:00 AM to ~6:00 PM PKT
**Focus:** Complete Whitepaper v5.0 — full tokenomics redesign, Business Liquidity Gate, Community Treasury Fund, Strategic Partnership Reserve

#### ✅ Key Completed Items
- 2% burn → 10% Community Treasury Contribution
- Business Liquidity Gate designed (atomic burn-and-mint, no lifetime cap)
- Community Treasury Fund (4 pools)
- Strategic Partnership Reserve (75M ENB, position #2, max 5M/partner)
- Founding Business Partners removed from pool — earn via Gate
- Neighborhood Anchors honorary (0 tokens)
- Part B deleted from whitepaper
- Executive Summary rewritten — 10-point v5.0 list
- App version v1.3.0 confirmed and applied throughout

---

### 15 Apr 2026 — Session 20 — ~6:00 PM to ~11:30 PM PKT
**Focus:** QR codes, /scan route, registration materials, Supabase audit, app v1.3.0

#### ✅ Key Items
- Real scannable QR codes (qrcode npm, Option B full URL)
- /scan route auto-populates from ?code= URL param
- confirm_redemption (p_qr_code only) + cancel_redemption_qr (p_qr_token)
- toUpperCase() removed — DB stores lowercase UUIDs
- Full Supabase ground truth audit
- 4 English + 4 Urdu registration drive PDFs
- Daily log rich text toolbar + 3000 char limit
- App version v1.3.0

---

### 15 Apr 2026 — Session 19 — ~12:00 PM to ~6:00 PM PKT
**Focus:** Urdu Docs 05+06, RLS Phase 1 security, JWT hooks

#### ✅ Key Items
- Urdu Docs 05+06 applied (all screens bilingual)
- RLS enabled: users (7), submissions (5), moderator_assignments (4), redemptions (5)
- JWT custom access token hook deployed
- Role sync trigger deployed

---

### 14 Apr 2026 — Session 18 — ~6:00 PM to ~11:00 PM PKT
**Focus:** CNIC identity, welcome email, account recovery, Urdu Docs 02-04

#### ✅ Key Items
- CNIC verification (optional signup, ENB locked until admin verified)
- enb_cnic_private signed Cloudinary preset
- Welcome email via Resend Edge Function
- Account Recovery at /account-recovery
- Dev History at /dev-history
- Urdu Docs 02+03+04 wired

---

### 7 Apr 2026 — Session 17 — PKT
**Focus:** Community features

#### ✅ Key Items
- Governance.tsx (live DB, tier voting, quorum bars)
- FoodSharing.tsx (3 CFSP roles, 3 modes, v4.9 waterfall, Food Runner modal)
- ImpactDashboard.tsx (v4.9 tokenomics + CFSP waterfall)
- Sidebar community pages visible to all members
- FloatingBugButton — 25-route screen auto-detection

---

### Sessions 1–16 (Mar–Apr 2026) — Cumulative Summary

Full submission cycle · Dual moderator blind review · Moderator compensation · Escalation queue · Referral system · Business Partner system · BusinessDirectory (Leaflet.js) · CAPTCHA pool (30 questions) · Multi-photo submissions · ENB brand design · Marketing site live · Giveth 100/100 · Fi.co accepted · Founding Members Handbook v2.0 · Monthly Founder Update Template

---

## 🗄️ SUPABASE — Complete SQL Run Log

| Date | Command | Purpose | Status |
|------|---------|---------|--------|
| 12 Mar | mod_assignment.sql | Mod assignment trigger | ✅ |
| 13 Mar | mod_compensation.sql | Moderator pay | ✅ |
| 14 Apr | ADD COLUMN cnic_number/photo_url/verified/submitted_at | CNIC identity | ✅ |
| 14 Apr | ADD COLUMN email_change_count | Email limit | ✅ |
| 14 Apr | DROP COLUMN telegram_id | Remove deprecated | ✅ |
| 15 Apr | ENABLE RLS users + 7 policies | Phase 1 security | ✅ |
| 15 Apr | ENABLE RLS submissions + 5 policies | Phase 1 security | ✅ |
| 15 Apr | ENABLE RLS moderator_assignments + 4 policies | Phase 1 security | ✅ |
| 15 Apr | ENABLE RLS redemptions + 5 policies | Phase 1 security | ✅ |
| 15 Apr | CREATE FUNCTION custom_access_token_hook | JWT role embedding | ✅ |
| 15 Apr | CREATE FUNCTION sync_user_role_to_auth + trigger | Role sync | ✅ |
| 15 Apr | UPDATE auth.users SET raw_app_meta_data | Backfill roles | ✅ |
| 15 Apr | DROP stale submissions policies | Remove circular-ref | ✅ |
| 15 Apr | DROP + CREATE business_scan_redemption policy | Fix role name | ✅ |
| 15 Apr | ALTER TABLE users DROP COLUMN cnic | Remove legacy | ✅ |
| 18 Apr | CREATE TABLE partnership_enquiries + RLS | Marketing site modal | ✅ |
| 18 Apr | CREATE TABLE whitepaper_requests + RLS | Marketing site modal | ✅ |
