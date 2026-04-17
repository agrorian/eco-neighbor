# ENB Dev Log — Daily Work Record
*Each session logged with date, time, actions, logic, and next plan.*
*Multiple entries per day are normal — log every session separately.*

---

## LOG FORMAT (copy this for each new session)

```
### [DATE] — Session [N] — [START TIME] to [END TIME PKT]
**Focus:** [one-line summary]

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | | |

#### 🐛 Bugs Fixed
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| | | |

#### 🗄️ SQL Run
| Command | Purpose | Status |
|---------|---------|--------|
| | | |

#### 📁 Files Changed
| File | Repo Path | Change Type |
|------|-----------|-------------|
| | | |

#### ⏭️ Next Plan of Action
1. 
2. 

#### 📝 Notes / Decisions Made
-
```

---

### 17 Apr 2026 — Whitepaper Session — ~8:00 AM to ~6:00 PM PKT
**Focus:** Whitepaper v5.0 complete build — full tokenomics redesign, new mechanisms, all corrections

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | 3rd-party critique review and analysis | Hostile reviewer + systems thinker lens; separated valid risks from wrong recommendations |
| 2 | 2% burn → 10% Community Treasury Contribution | Burn creates no real benefit for ENB.LOCAL; treasury recycles value into ecosystem |
| 3 | Business Liquidity Gate designed | Businesses earn ENB.GLOBAL via atomic burn-and-mint; 1/3 of 10% to business, 2/3 to treasury pools |
| 4 | Community Treasury Fund designed | 4 pools: Stability 30%, Market Making 20%, Insurance 20%, Reserve 30% |
| 5 | Strategic Partnership Reserve designed | 75,000,000 ENB.GLOBAL at position #2 (15%); max 5M per partner; deliverable-tied vesting |
| 6 | Founding Business Partners removed from Founding Pool | Earn via Business Liquidity Gate instead — no upfront gift, participation is the catch |
| 7 | Neighborhood Anchors made honorary | 0 token allocation; recognition only (named acknowledgement, event invitations, advisory input) |
| 8 | Founding Pool restructured to 10 positions descending | SPR at #2, all positions reordered by percentage |
| 9 | Business Liquidity Gate conditions locked | 365-day hold, Pillar Tier, 50K ENB per release, 2 releases/year, 6-month gap, no lifetime cap |
| 10 | Atomic burn-and-mint confirmed feasible on Solana | PDA holds mint authority; burn LOCAL → mint GLOBAL atomically; total supply unchanged |
| 11 | Rep Points for swap acceptance added | Businesses earn Rep Points on every swap — can reach Pillar Tier through transaction volume |
| 12 | Business Liquidity Gate terminology locked | "Conversion" is wrong — tokens already ENB.GLOBAL; correct term is "Release" or "DEX Unlock" |
| 13 | 65M freed from FBP + 10M freed from Anchors = 75M | All redirected to Strategic Partnership Reserve |
| 14 | Part B (Founding Business Partners section) deleted from whitepaper | 72,532 chars of XML removed |
| 15 | Executive Summary rewritten — 10-point v5.0 list | Replaces "Nine Major Upgrades" box that was copy-pasted unchanged across v4.7/v4.8/v4.9 |
| 16 | App version v1.2.0 → v1.3.0 throughout whitepaper | v1.3.0 was confirmed current in Web App Dev Chat 5 (15 Apr 2026) |
| 17 | Header fixed: v4.7 → v5.0, March → April 2026 | header1.xml was not touched by document.xml edits — fixed separately |
| 18 | \n\n escape sequences fixed in Section 3.3 | Literal \n\n was rendering as text in the cliff/vesting section |
| 19 | Summary table corrected | SPR at row 2, Anchors = Honorary 0%, FBP row deleted |
| 20 | Detailed roster table corrected | SPR inserted at #2, all rows renumbered, COL moved to #3 |
| 21 | Duplicate v5.0 version history row merged | Combined title + best content from both rows into one |
| 22 | v4.9 PREV PREV → single PREV | Removed duplicate label |
| 23 | v5.0 CURRENT PREV → single CURRENT | Removed PREV label from current version row |
| 24 | v5.0 merged title set | "COMPLETE TOKENOMICS & GOVERNANCE REDESIGN — BUSINESS LIQUIDITY GATE, TREASURY FUND & STRATEGIC PARTNERSHIP RESERVE" |
| 25 | FBP references in body text updated | Roadmap Phase 1/2, roadmap table, Community Day ceremony — changed to "business partners" |
| 26 | Remaining burn references in body updated | "portion permanently burned" → 10% treasury routing description |
| 27 | CLAUDE.md v6 created | Reflects all v5.0 decisions, v1.3.0 app version, updated founding pool |
| 28 | BACKLOG updated | Removed obsolete burn mechanism item, added Business Liquidity Gate + Treasury Fund as Phase 2 features |
| 29 | DEVLOG updated | This entry |

#### 📁 Files Changed
| File | Location | Change |
|------|-----------|--------|
| ENB_Whitepaper_v5.0.docx | /mnt/user-data/outputs/ | Complete rebuild from v4.9 |
| CLAUDE_updated_v6_17-April-2026.md | /home/claude/ | New — reflects all v5.0 decisions |
| ENB_BACKLOG.md | /home/claude/ | Updated — removed stale items, added v5.0 features |
| ENB_DEVLOG.md | /home/claude/ | This entry added |

#### ⏭️ Next Plan of Action
1. Muhammad: Replace project files with CLAUDE.md v6, BACKLOG, DEVLOG; push to GitHub
2. Muhammad: Download ENB_Whitepaper_v5.0.docx and replace in project folder
3. Sync high-priority out-of-sync documents — Impact Investor Pitch Deck, Grant Application, Master Technical Doc
4. Founder Report Template 2 — Quarterly Ecosystem Report
5. Continue App Development: CFSP waterfall propagation, Phase 2 RLS

#### 📝 Notes / Decisions Made
- Web App v1.3.0 was confirmed in Web App Dev Chat 5 (15 Apr 2026) — CLAUDE.md v5 incorrectly listed v1.2.0
- Business Liquidity Gate has no lifetime cap — this is intentional and correct; businesses reward sustained participation without ceiling
- The word "conversion" applies only to ENB.LOCAL → ENB.GLOBAL metamorphosis (Maturation Bridge). Business earning ENB.GLOBAL via swaps = "release" or "DEX unlock" — the tokens are already GLOBAL
- 50,000 ENB per release event is the governance threshold — a mechanic must accept ~500 swaps at 100 ENB/each to unlock one release event
- All FBP references in version history table rows are intentional historical records — do not change them
- Document Sync Protocol: every future whitepaper version increment triggers mandatory review of all documents in CLAUDE.md Section 21
- Memory instruction added: Claude must read CLAUDE.md + DEVLOG + BACKLOG at start of every ENB session

---

### 15 Apr 2026 — Session 20 — ~6:00 PM to ~11:30 PM PKT
**Focus:** QR code implementation, /scan route fixes, registration drive materials, Supabase ground truth audit, documentation

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | Real scannable QR code in GenerateRedemptionQR.tsx | qrcode npm; Option B full URL encoding; green on white; 200px |
| 2 | Real scannable QR code in ReferralHub.tsx | Same library; referral URL encoded; 160px with caption |
| 3 | /scan route auto-populate from ?code= URL param | useSearchParams() reads code on mount; calls processCode() immediately |
| 4 | fix: cancel_redemption_qr uses p_qr_token | Ground truth confirmed p_qr_token is correct param |
| 5 | fix: confirm_redemption is (p_qr_code text) only | Single-param signature; removed p_business_id |
| 6 | fix: remove toUpperCase() from ScanRedemption | DB stores lowercase UUIDs |
| 7 | fix: maxLength 12→36 in ScanRedemption | QR codes are UUIDs (36 chars) |
| 8 | SQL: DROP stale submissions policies | Circular SELECT FROM users pattern |
| 9 | SQL: Fix business_scan_redemption RLS | 'business' → 'business_partner' |
| 10 | SQL: DROP COLUMN cnic | Legacy column removed |
| 11 | Supabase full ground truth audit | All tables/columns/RPC/triggers/RLS documented in CLAUDE.md |
| 12 | npm install qrcode @types/qrcode | 25 packages |
| 13 | 4 English registration drive PDFs | Flyer A5, Registration Guide, Action Reference Card, Business Partner MOU Summary |
| 14 | 4 English Word docs for translation | Same 4 documents |
| 15 | 4 Urdu PDFs with Noto Nastaliq Urdu font | RTL, dark green/gold branding |
| 16 | Noto Nastaliq Urdu font integrated | Regular + Bold extracted and registered |
| 17 | Daily log rich text toolbar | Bold, bullet list, numbered list, newline buttons |
| 18 | Daily log char limit 2000→3000 | |
| 19 | App version bumped to v1.3.0 | DesktopSidebar, Settings, More, VersionHistory.tsx |
| 20 | CLAUDE.md v5 written | All decisions from Session 20 |
| 21 | DEVLOG Session 20 added | |
| 22 | BACKLOG updated | |

#### 🐛 Bugs Fixed
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| QR code was text display | No QR library | qrcode npm + toDataURL() → img tag |
| confirm_redemption always failed | Wrong params (p_qr_token + p_business_id) | Single param p_qr_code |
| cancel_redemption_qr failed | Previous "fix" used wrong param name | Reverted to p_qr_token |
| ScanRedemption rejected valid codes | toUpperCase() on lowercase UUID | Removed toUpperCase() |
| ScanRedemption rejected long codes | maxLength={12} | Changed to maxLength={36} |
| business_scan_redemption RLS never matched | role='business' vs actual 'business_partner' | Dropped + recreated |

#### 🗄️ SQL Run
| Command | Purpose | Status |
|---------|---------|--------|
| DROP POLICY "Admins can read all submissions" ON submissions | Remove stale | ✅ |
| DROP POLICY "Admins can update submissions" ON submissions | Remove stale | ✅ |
| DROP + CREATE business_scan_redemption ON redemptions | Fix role | ✅ |
| ALTER TABLE users DROP COLUMN IF EXISTS cnic | Remove legacy | ✅ |

#### 📁 Files Changed
| File | Repo Path | Change |
|------|-----------|--------|
| GenerateRedemptionQR.tsx | src/pages/wallet/ | Real QR, fixed cancel p_qr_token, Save button |
| ScanRedemption.tsx | src/pages/dashboard/ | useSearchParams, correct RPC params, remove toUpperCase, maxLength=36 |
| ReferralHub.tsx | src/pages/wallet/ | Real QR image |
| MyLog.tsx | src/pages/ | Rich text toolbar, 3000 char limit |
| DesktopSidebar.tsx | src/components/layout/ | App version v1.3.0 |
| Settings.tsx | src/pages/ | App version v1.3.0 |
| More.tsx | src/pages/ | App version v1.3.0 |
| VersionHistory.tsx | src/pages/about/ | v1.3.0 as CURRENT |

#### ⏭️ Next Plan of Action
1. Urdu registration materials — await translation from Muhammad
2. Phase 2 RLS — 6 remaining tables
3. CFSP v4.9 waterfall propagation to web app
4. Fix duplicate PartnerSignup import in App.tsx
5. FI Dashboard Week 1 checklist review

#### 📝 Notes / Decisions Made
- App version v1.3.0 (NOT v1.2.0 — DEVLOG note at Session 19 was wrong; VersionHistory.tsx correctly shows v1.3.0)
- qrcode library generates lowercase UUID QR codes — never apply toUpperCase() before RPC calls
- Supabase ground truth now in CLAUDE.md Section 13 — always verify RPC signatures before writing frontend code
- Project Sync Documents discontinued — CLAUDE.md + DEVLOG + BACKLOG replace them

---

### 15 Apr 2026 — Session 19 — ~12:00 PM to ~6:00 PM PKT
**Focus:** Full Urdu translation (Docs 05+06), RLS Phase 1 security, CNIC system completion, governance dummy data

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | Urdu Docs 05+06 applied and wired | Settings, Log, Governance, Directory, ModQueue, Impact fully bilingual |
| 2 | RLS enabled on users table — 7 JWT policies | Phase 1 security complete for users |
| 3 | RLS enabled on submissions — 5 policies | Two stale policies removed first |
| 4 | RLS enabled on moderator_assignments — 4 policies | |
| 5 | RLS enabled on redemptions — 5 policies | business_scan corrected to 'business_partner' |
| 6 | JWT custom access token hook deployed | public.custom_access_token_hook |
| 7 | Role sync trigger deployed | sync_user_role_to_auth fires on role change |
| 8 | Auth.users backfill — all existing roles synced | |
| 9 | Governance dummy proposals added | 6 test proposals via SQL |
| 10 | QR code: Decision B (full URL) confirmed | eco-neighbor.vercel.app/scan?code=UUID |
| 11 | App version incremented to v1.2.0 in VersionHistory | (Note: this was later corrected to v1.3.0 in Session 20) |

#### 📝 Notes / Decisions Made
- App version note: Session 19 incremented to v1.2.0 but Session 20 further incremented to v1.3.0 — v1.3.0 is the correct current version
- translations.ts: ALWAYS insert before closing `};` using rfind('\n};')
- translations.ts syntax check: bracket count must match before every push

---

### 14 Apr 2026 — Session 18 — ~6:00 PM to ~11:00 PM PKT
**Focus:** CNIC identity system, welcome email, account recovery, dev history page, Urdu Docs 02-04

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | CNIC verification on SignUpStep2 | Optional at signup, ENB locked until verified |
| 2 | Pakistan vs International detection via neighbourhood dropdown | Chaklala Scheme 3 etc = PK required; "Other/International" = optional |
| 3 | Auto-format CNIC as XXXXX-XXXXXXX-X | Standard NADRA format; uniqueness check on blur |
| 4 | Camera + Gallery upload for CNIC photo | Gallery allowed for CNIC only (not submissions) |
| 5 | CnicPrompt.tsx — amber banner on dashboard | 16 existing users notified |
| 6 | Admin UserManagement Identity column | Verified/Pending/None badges |
| 7 | Admin verify modal — shows photo, one-click verify | Admin reviews photo manually |
| 8 | Wallet locked state — amber card with CTA | Blocks Redeem and Bridge for unverified |
| 9 | CNIC photos use enb_cnic_private signed Cloudinary preset | Security — not guessable by URL |
| 10 | Welcome email via Resend Edge Function | Every new signup gets orientation email |
| 11 | Account Recovery at /account-recovery | CNIC + full name match → masked email reveal |
| 12 | email_change_count column — max 2 lifetime | Prevents identity hopping |
| 13 | Dev History page at /dev-history | Public transparency page |
| 14 | Urdu Docs 02+03 applied and wired | Login, Signup, Submit Action, Review |
| 15 | Urdu Doc 04 applied and wired | Wallet, Referral Hub, Bridge, Redemption QR |
| 16 | App version corrected to v1.1.0 | Was showing v4.7 (whitepaper version) |
