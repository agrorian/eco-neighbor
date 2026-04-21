# ENB Dev Log — Daily Work Record
*Permanent file — append new sessions at the top, never delete old entries.*
*At session start: read CLAUDE.md + ENB_DEVLOG.md + ENB_BACKLOG.md first.*

---

### 21 Apr 2026 (Evening) — Corrections to Afternoon Session Output
**Window:** Social Media Content (continued)
**Focus:** Review and correction of 4 issues identified in afternoon's CLAUDE.md and handover material

#### ✅ Corrections Applied
| # | Correction | Reason |
|---|------------|--------|
| 1 | CRP Critical Zone — removed "DAO 48hr vote" | Auto-Tranche is fully autonomous. No human vote at any zone. Critical is a safety net only, not a decision point. |
| 2 | Ticker superscript format clarified | T1/T2/T3 must render as TRUE superscript in Word (`<w:vertAlign w:val="superscript"/>`) and HTML (`<sup>T1</sup>`). Caret notation only acceptable in plain text. |
| 3 | Mint authority — PDA only, not renounced | For auto-tranche to work, mint authority must be retained by PDA smart contract. PDA is immutable and autonomous. No human access. |
| 4 | Whitepaper version bump corrected | v5.1 → v6.0 (major bump). Removing fixed supply is as fundamental as the 2% burn → 10% Community Treasury change that justified v4.x → v5.0. |

#### 🔑 Process Issues Identified
- Afternoon session generated CLAUDE.md v11.0 from scratch instead of extending the previous 409-line version — this compressed the file and risked losing content
- Afternoon session generated Whitepaper v6.0 from scratch instead of using v5.0 as base — resulted in 16-page skeleton vs 90-page full document
- Afternoon session generated marketing site index.html from memory instead of using uploaded file as base — resulted in wrong structure

#### 🛡️ Process Rule Reinforced
**"Always read Project Files first. Never generate from scratch when a base file exists. CLAUDE.md, DEVLOG, and BACKLOG only ever grow — never shrink."**

This rule is not negotiable. It exists specifically to prevent today's errors. The rule will be monitored strictly from here onwards.

#### 🏗️ Pending (moved to next window in Opus 4.7)
- Produce Whitepaper v6.0 using v5.0 .docx as base (surgical XML edits only)
- Produce updated marketing site using index.html as base (targeted edits only)
- Validate output page count / line count matches expected magnitude

#### 📝 Notes
- All 3 saved versions (3rd last, 2nd last, last) of CLAUDE.md, DEVLOG, and BACKLOG were compared side-by-side and confirmed identical at 409/160/208 lines respectively
- No information was lost between last night's versions — only between last night's and today's compressed version
- Evening correction applied to last night's 409-line CLAUDE.md (not the compressed version), producing v11.1 with 4 corrections and new Section 25

---

### 21 Apr 2026 — CRP Simulation + Auto-Tranche System Design
**Window:** Social Media Content
**Focus:** CRP depletion modelling, auto-tranche architecture, ecosystem sustainability design

#### ✅ Completed
| # | Action | Notes |
|---|--------|-------|
| 1 | Fi.co Steps 1+2 confirmed submitted | Verified in portal screenshot |
| 2 | Fi.co track identified as Launch | Should be Traction — email Megan pending |
| 3 | User growth simulation — Scenario A | 5 referrals, 7d cycles → 9.7M users by Aug 1 |
| 4 | User growth simulation — Scenario B | 2 referrals, 15d cycles → 6,300 by Aug 1 |
| 5 | User growth simulation — Scenario C | 2 referrals, 15d→30d, variable actions → 204,700 by Dec 31 |
| 6 | CRP consumption simulation — all 3 scenarios | Without tranche: depletes Day 74/151/216 |
| 7 | Daily action cap locked | 3 actions per user per day — permanent |
| 8 | SWAP recovery analysis | Only 1.5% of consumption at scale — insufficient alone |
| 9 | CRP Tiered Protection Protocol designed | 5 zones: Green/Yellow/Amber/Red/Critical |
| 10 | Auto-tranche system designed and locked | 10B mint at 10% CRP trigger — infinite |
| 11 | T2+ distribution locked | CRP 70% / BPR 12% / Liq 8% / Dev 5% / Emergency 5% |
| 12 | FCP in tranches: 0% forever | Permanently locked — founding reward was T1 only |
| 13 | Grants in tranches: 0% | Organic growth replaces |
| 14 | Ticker format locked | $ENB^T1, $ENB^T2... superscript |
| 15 | Geographic limits removed | Multiple neighborhoods, cities, simultaneous launch permitted |
| 16 | Auto-tranche simulation run | CRP never hits zero — T10 reached by Mar 28, 2027 |
| 17 | All simulation tables presented | Tables 1A/1B/1C/2A/2B/2C/3/4/5/6/7 |
| 18 | Charts generated | CRP health, user growth, total supply, tranche dashboard |
| 19 | Window management rule established | New window at 100 attachments OR new build phase |
| 20 | CLAUDE.md v11.0 produced | All decisions incorporated |
| 21 | ENB_DEVLOG.md updated | This entry |
| 22 | ENB_BACKLOG.md updated | Tasks prioritised |

#### 🔑 Key Decisions Locked Today
| Decision | Value |
|---|---|
| Daily action cap | 3/user/day — permanent |
| Auto-tranche trigger | CRP reaches 10% of current tranche |
| Auto-tranche size | 10B ENB per tranche |
| Auto-tranche cap | Infinite |
| T2+ distribution | 70/12/8/5/5 — immutable smart contract |
| FCP share | 0% in any tranche beyond T1 — permanent |
| Ticker | $ENB^T1, $ENB^T2... |
| Geographic limits | Removed — multi-city permitted |
| Tranche distribution lock | Smart contract — no governance override |

#### 📊 Simulation Summary
| Scenario | Referrals | Cycles | Users Aug 1 | CRP depletes (no tranche) | CRP depletes (with tranche) |
|---|---|---|---|---|---|
| A — Viral | 5 | 7d | 9,765,600 | Day 74 | Never |
| B — Plausible | 2 | 15d | 6,300 | Day 151 | Never |
| C — Conservative | 2 | 15d→30d | 6,300 | Day 216 | Never |

#### 📝 Notes
- Auto-tranche is the single most important architectural decision in ENB history
- The ticker becoming a tranche counter is both a practical identifier and a marketing asset
- Geographic limits removal frees the ecosystem to grow naturally
- Whitepaper v5.1 needs a dedicated Auto-Tranche System section
- Marketing site needs update to reflect tranche system and geographic freedom
- All simulation data and charts ready for whitepaper and Fi.co presentations

#### 🏗️ Pending Build Work (App Dev Chat 6)
- v1.4.0: Before/After submission, Reporting/Resolution, SWAP language update
- Dev History: v5.0 whitepaper entry + v1.4.0 entry after deployment

---

### 20 Apr 2026 — Fi.co Onboarding + Product Architecture
**Window:** Social Media Content
**Focus:** Fi.co Steps 1+2, SWAP, Before/After, Reporting/Resolution, versioning, glossary

#### ✅ Key Items
- Fi.co Steps 1+2 submitted
- SWAP locked — Sustainable Work Achieves Prosperity
- Before/After submission system designed (v1.4.0)
- GPS radius: 20 metres
- Reporting + Resolution framework
- Community Issues Board Option B
- Semantic versioning locked
- Glossary: 64 terms, 20 critical in CLAUDE.md
- Founding Core Team terminology
- Genesis Block formalised
- Early joiner multiplier concept (10%–100%, TBD)

---

### 19 Apr 2026 — Social Media Content Session
**Focus:** 20 FB posts, 13 tweets, Stories, Buffer, Urdu BiDi fix

#### ✅ Key Items
- Facebook URL corrected: ENBEcoNeighbor
- 20 Facebook posts + 13 Twitter tweets scheduled Apr 19–May 1
- Urdu BiDi rules locked, واسطہ replaces بچولیا
- All 20 Gemini images approved
- Buffer adopted for scheduling
- Story S1 posted

---

### 18 Apr 2026 — Marketing Site Full Upgrade
**Focus:** v5.0 site — 5 new sections, 2 modals, treasury math, truncation fix
- 35/35 integrity checks passed
- partnership_enquiries + whitepaper_requests tables created

---

### 18 Apr 2026 — Morning Session
**Focus:** Whitepaper v5.0 corrections, marketing site fixes
- Whitepaper v5.0 all corrections applied
- Impact Investor Pitch Deck v5.0, Grant Application v5.0, Technical Document v5.0

---

### 17 Apr 2026 — Whitepaper v5.0 Build
- 2% burn → 10% Community Treasury
- Business Liquidity Gate, Strategic Partnership Reserve
- Neighborhood Anchors honorary, FBP removed from pool

---

### 15 Apr 2026 — App v1.3.0
- Real QR codes, /scan route, RLS Phase 1
- JWT hook, role sync trigger
- 4 EN + 4 Urdu registration PDFs

---

### 14 Apr 2026 — Identity & Features
- CNIC verification, welcome email, Account Recovery
- Urdu Docs 02–04

---

### 7 Apr 2026 — Community Features (v1.1.0)
- Governance.tsx, FoodSharing.tsx, ImpactDashboard.tsx
- FloatingBugButton 25-route detection

---

### Sessions 1–16 (Mar–Apr 2026)
Full submission cycle, moderation, referral, business partner, BusinessDirectory, CAPTCHA, marketing site, Giveth 100/100, Fi.co accepted, Founding Members Handbook, Urdu interface complete.

---

## 🗄️ SUPABASE — SQL Run Log

| Date | Command | Status |
|------|---------|--------|
| 12 Mar | mod_assignment.sql | ✅ |
| 13 Mar | mod_compensation.sql | ✅ |
| 14 Apr | ADD COLUMN cnic_number/photo_url/verified | ✅ |
| 14 Apr | DROP COLUMN telegram_id | ✅ |
| 15 Apr | ENABLE RLS all 4 tables + policies | ✅ |
| 15 Apr | JWT hook + role sync trigger | ✅ |
| 15 Apr | DROP/CREATE stale policies | ✅ |
| 18 Apr | CREATE TABLE partnership_enquiries + RLS | ✅ |
| 18 Apr | CREATE TABLE whitepaper_requests + RLS | ✅ |
