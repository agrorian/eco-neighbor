# ENB Dev Log — Daily Work Record
*Each session logged with date, time, actions, logic, and next plan.*
*Multiple entries per day are normal — log every session separately.*

---

## LOG FORMAT (copy this for each new session)

```
### [DATE] — Session [N] — [START TIME] to [END TIME PKT]
**Focus:** [one-line summary of what this session was about]

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | | |

#### 🐛 Bugs Fixed
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| | | |

#### 🗄️ SQL Run
| File | Purpose | Status |
|------|---------|--------|
| | | |

#### 📁 Files Changed
| File | Repo Path | Change Type |
|------|-----------|-------------|
| | | |

#### ⏭️ Next Plan of Action
1. 
2. 
3. 

#### 📝 Notes / Decisions Made
-
```

---

### 14 Apr 2026 — Session 18 — ~6:00 PM to ~11:00 PM PKT
**Focus:** CNIC identity verification system, welcome email, account recovery, dev history page, Urdu Docs 02–04 wiring, version label fixes

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | CNIC verification on SignUpStep2 — optional at signup, ENB locked until verified | Real users may not have CNIC handy; locking ENB creates incentive without blocking signup |
| 2 | Pakistan vs International detection via neighbourhood dropdown | Chaklala Scheme 3 etc = PK required CNIC; "Other / International" = optional free-text ID |
| 3 | Auto-format CNIC as XXXXX-XXXXXXX-X on every keystroke | Standard NADRA format; uniqueness check on blur prevents duplicate accounts |
| 4 | Camera + Gallery upload for CNIC photo (CNIC only — not action submissions) | ID docs may already exist as photos; gallery allowed here, camera enforced for submissions |
| 5 | CnicPrompt.tsx — collapsible amber banner on dashboard for existing users | 16 existing users have no CNIC; they see it on next login with locked ENB explanation |
| 6 | Admin UserManagement Identity column — Verified/Pending/None badges | Admin needed visibility into who submitted CNIC and who hasn't |
| 7 | Admin verify modal — shows ID number, submission date, photo, one-click verify | Admin must review photo against ID manually before marking verified |
| 8 | Unverified account visual system — amber ring, lock badge, Unverified pill, locked ENB balance | Three simultaneous signals make the locked state unmissable |
| 9 | Wallet locked state — amber ENB card with "Verify Identity to Unlock" CTA | Blocks Redeem and Bridge for unverified users |
| 10 | CNIC photos use enb_cnic_private signed Cloudinary preset | Public preset would make CNIC photos guessable by URL; signed = server-token required |
| 11 | Welcome email via Resend Edge Function (supabase/functions/send-welcome-email) | Every new signup gets a complete orientation email covering tier system, actions, referral |
| 12 | Account Recovery screen at /account-recovery | Users who forget their email can find it via CNIC + full name match → masked email reveal |
| 13 | "Can't access your account?" link added to Login page | Entry point to account recovery flow |
| 14 | email_change_count column added — max 2 lifetime email changes | Prevents identity hopping while allowing genuine corrections |
| 15 | Dev History page at /dev-history with whitepaper timeline + app build log | Public transparency page; linked from Welcome screen |
| 16 | Urdu Docs 02 + 03 applied and wired — Login, Signup, Submit Action, Review, Success | All strings translated and useT() wired to components |
| 17 | Urdu Doc 04 applied and wired — Wallet, Referral Hub, Bridge, Redemption QR | 34 new Urdu strings added and components wired |
| 18 | App version corrected to v1.1.0 across sidebar, More.tsx, Settings.tsx | Was showing v4.7 (whitepaper version) instead of app semantic version |
| 19 | Sidebar dir="ltr" + unicodeBidi fix for version string in Urdu mode | RTL page was reversing "$ENB · App v1.1.0" to display backwards |

#### 🐛 Bugs Fixed
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| ENB/Rep always saving 500/200 regardless of action type | React Suspense reset selectedAction state to '' between steps; ACTION_REWARDS[''] = undefined → fallback 500/200 | Fixed: use formData.actionType (from ActionForm) as primary source of truth |
| CNIC gallery JSX syntax error | `{l('common', 'loading')}` inside ternary expression added extra braces | Removed wrapping braces: `l('common', 'loading')` |
| ReferralHub ternary JSX error | Same double-brace pattern in escrow_type ternary | Fixed to `? l('wallet', 'refFirstAction')` |
| Identity column missing from UserManagement table | Python string replacement failed silently — header and cell code never inserted | Rewrote insertion directly targeting exact strings |
| MobileNav translations never deployed | File generated in earlier session but never pushed to GitHub | Copied and pushed in this session |
| Sidebar version showing whitepaper version v4.7 | Wrong version source used for label | Updated to App v1.1.0 with LTR enforcement |

#### 🗄️ SQL Run
| Command | Purpose | Status |
|---------|---------|--------|
| `ALTER TABLE users ADD COLUMN cnic_number TEXT UNIQUE` | Store CNIC for identity verification | ✅ |
| `ALTER TABLE users ADD COLUMN cnic_photo_url TEXT` | Cloudinary URL for CNIC photo | ✅ |
| `ALTER TABLE users ADD COLUMN cnic_verified BOOLEAN DEFAULT FALSE` | Track admin verification status | ✅ |
| `ALTER TABLE users ADD COLUMN cnic_submitted_at TIMESTAMPTZ` | Submission timestamp | ✅ |
| `ALTER TABLE users ADD COLUMN email_change_count INTEGER DEFAULT 0` | Limit email changes to 2 lifetime | ✅ |
| `ALTER TABLE users DROP COLUMN IF EXISTS telegram_id` | Remove deprecated column | ✅ |

#### 📁 Files Changed
| File | Repo Path | Change Type |
|------|-----------|-------------|
| SignUpStep2.tsx | src/pages/onboarding/ | Modified — CNIC section + email trigger |
| CnicPrompt.tsx | src/components/ | New |
| AccountRecovery.tsx | src/pages/onboarding/ | New |
| VersionHistory.tsx | src/pages/about/ | New |
| send-welcome-email/index.ts | supabase/functions/ | New |
| UserManagement.tsx | src/pages/admin/ | Modified — Identity column + verify modal |
| MemberDashboard.tsx | src/pages/dashboard/ | Modified — amber ring, lock badge, locked ENB |
| Wallet.tsx | src/pages/ | Modified — locked ENB card state |
| DesktopSidebar.tsx | src/components/layout/ | Modified — version label + LTR fix |
| MobileNav.tsx | src/components/layout/ | Modified — useT() wired (was never pushed) |
| More.tsx | src/pages/ | Modified — version label |
| Settings.tsx | src/pages/ | Modified — version label |
| user.ts | src/store/ | Modified — cnic fields added to interface |
| translations.ts | src/lib/ | Modified — Docs 02, 03, 04 + action descriptions |
| Login.tsx | src/pages/onboarding/ | Modified — recovery link added |
| App.tsx | src/ | Modified — /dev-history + /account-recovery routes |

#### ⏭️ Next Plan of Action
1. Urdu Docs 05 + 06 — Muhammad translating; wire when ready
2. RLS security hardening (Phase 1 + 2)
3. FI Dashboard task review

#### 📝 Notes / Decisions Made
- CNIC is optional at signup by design — friction must not block registration
- Gallery upload allowed for CNIC ONLY — this is identity documentation, not fraud vector
- Signed Cloudinary preset enb_cnic_private created — CNIC photos are not publicly accessible
- Account recovery requires BOTH CNIC + full name match — prevents ID card theft misuse
- WhatsApp Meta API deferred to Phase 2 — setup complexity too high before FI cohort
- GitHub repo stays public — transparency is core to ENB's ReFi positioning
- App version (v1.1.0) and Whitepaper version (v4.9) are now clearly separated

---

### 15 Apr 2026 — Session 19 — ~12:00 AM to ~2:00 AM PKT
**Focus:** RLS implementation (Phase 1 + 2), security audit, ENB/Rep bug fix, admin dashboard fixes, session documentation

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | JWT custom access token hook — public.custom_access_token_hook | Embeds user_role in JWT app_metadata on every login; enables RLS without circular reference |
| 2 | Role synced to auth.users.raw_app_meta_data via trigger | sync_user_role_to_auth trigger fires on INSERT OR UPDATE OF role; keeps JWT role always current |
| 3 | RLS Phase 1 — users table | 7 policies covering own row access + admin/moderator/onboarding read-all |
| 4 | RLS Phase 2 — submissions table | 5 policies covering own + approved public + admin/mod full access |
| 5 | RLS Phase 2 — moderator_assignments table | 4 policies covering admin full + mod select/insert/update |
| 6 | Leaderboard public read policy | All authenticated users can read basic fields; leaderboard is intentionally public community feature |
| 7 | Admin dashboard pending count fixed | Was excluding mod-assigned submissions from count; now shows ALL pending |
| 8 | Queue removed from admin sidebar | Redundant with Mod Queue — caused confusion |
| 9 | Security audit conducted and documented | Full report: ENB_Security_Audit_April2026.docx |
| 10 | ENB/Rep reward bug fixed | formData.actionType used instead of selectedAction which resets between Suspense steps |
| 11 | Dual-mod assignment confirmed working | moderator_assignments table has mod1_id/decision1 + mod2_id/decision2 per row |
| 12 | Session Devlog, Backlog, Security Audit all generated | .md files + .docx versions created |

#### 🐛 Bugs Fixed
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| First RLS attempt broke all roles | Admin policy used SELECT FROM users to check role → circular reference (RLS blocks the check itself) | Switched to auth.jwt() -> 'app_metadata' ->> 'user_role' path |
| Users table showing only 1 user after RLS | JWT token hadn't been refreshed since hook deployment | Log out + back in required to get new token with app_metadata role |
| Leaderboard showing only self | users RLS select_own policy blocked cross-user reads | Added users_leaderboard_public policy for authenticated users |
| Admin pending count showing 0 | Query excluded mod-assigned submissions | Removed exclusion — admin sees all pending |
| Mod Queue showing wrong user roles | moderator_assignments had no RLS, queries returning empty | Enabled RLS + added 4 policies |
| ENB/Rep always 500/200 on all submissions | selectedAction state reset by React Suspense between steps | Use formData.actionType from ActionForm as primary key for ACTION_REWARDS lookup |

#### 🗄️ SQL Run
| Command | Purpose | Status |
|---------|---------|--------|
| `ALTER TABLE users ENABLE ROW LEVEL SECURITY` + 7 policies | Phase 1 RLS | ✅ |
| `ALTER TABLE submissions ENABLE ROW LEVEL SECURITY` + 5 policies | Phase 2 RLS | ✅ |
| `ALTER TABLE moderator_assignments ENABLE ROW LEVEL SECURITY` + 4 policies | Phase 2 RLS | ✅ |
| `CREATE FUNCTION public.custom_access_token_hook` | JWT role embedding | ✅ |
| `CREATE FUNCTION public.sync_user_role_to_auth + trigger` | Role sync on change | ✅ |
| `UPDATE auth.users SET raw_app_meta_data` | Backfill existing roles | ✅ |
| RLS rollback SQL (ran once, then rolled back when circular ref discovered) | Emergency rollback | ✅ rolled back |

#### 📁 Files Changed
| File | Repo Path | Change Type |
|------|-----------|-------------|
| SubmitAction.tsx | src/pages/ | Modified — rewards use formData.actionType |
| AdminDashboard.tsx | src/pages/admin/ | Modified — pending count shows all |
| AdminLayout.tsx | src/pages/admin/ | Modified — Queue removed from sidebar |
| VersionHistory.tsx | src/pages/about/ | Modified — v1.1.0 added as CURRENT |

#### ⏭️ Next Plan of Action
1. Urdu Docs 05 + 06 — apply translations + wire components
2. FI Dashboard tasks — review and map to ENB actions
3. CAPTCHA pool expansion — 30+ questions, 3 categories, multiple choice
4. Phase 3 RLS — remaining 6 tables (bug_reports, referral_escrow, campaigns, business_partners, partner_applications, bridge_requests)
5. Whitepaper vs App gap analysis — ENB Founder Reports window

#### 📝 Notes / Decisions Made
- RLS is now live on 3 critical tables — users, submissions, moderator_assignments
- JWT hook uses app_metadata path (not claims) — confirmed working after log out/in
- 6 tables still without RLS — non-critical for pilot but must complete before scaling
- Admin Queue page kept (route exists) but removed from sidebar — still accessible if needed
- AI Vision Layer 3 is Phase 2 — DB columns (ai_confidence_score, ai_rejection_reason) exist but unused
- Security Audit report generated with full status of all findings

---

### 15 Apr 2026 — Session 19 Continued — ~3:00 AM to ~9:00 AM PKT
**Focus:** Urdu translation completion, QR cancel fix, Governance improvements, CNIC guidance, CAPTCHA expansion, admin fixes, session documentation

#### ✅ Completed
| # | Action | Logic / Why |
|---|--------|-------------|
| 1 | CNIC photo guidance updated — front+back in one image | Banking-standard approach; AI/NADRA verification works best with single composite image |
| 2 | CAPTCHA expanded to 30 questions across 3 categories | Category 1: Local knowledge (7), Category 2: ENB ecosystem (14), Category 3: Civic awareness (9). 4 options each — harder to guess |
| 3 | Urdu Docs 05 + 06 applied to translations.ts | Doc 05: Directory, Leaderboard, Profile, Settings (34 strings). Doc 06: Impact, Governance, Log, Bug (37 strings) |
| 4 | translations.ts syntax fixed — new sections appended correctly | Sections were being added outside the object closing brace; fixed insertion point |
| 5 | useT() wired to: BusinessDirectory, Leaderboard, ImpactDashboard, Governance | All 4 components now use l() for all visible strings |
| 6 | Settings.tsx fully translated | All 23 strings wired: profile info, field labels, placeholders, account section, save/logout buttons |
| 7 | Daily Log fully translated | useT() added, getCategoryLabel() helper for 5 categories, all form labels and placeholders |
| 8 | Transaction History component translated | useT() added, moderation reward descriptions translated via content matching |
| 9 | ModQueue translated | Blind Review Protocol, no assignments message, title all wired |
| 10 | Governance tier descriptions translated | All 5 tiers use l('tiers', 'X') + l('governance', 'tierX') for descriptions |
| 11 | Governance info paragraph translated | Founding Team + Community Moderators note now in Urdu |
| 12 | Governance Create Proposal UI built | Button visible to admin only, modal with: title, description, proposal type (6 types), min tier, quorum, voting days |
| 13 | Governance tier descriptions corrected per whitepaper | Helper/Guardian have NO voting rights (app text was wrong); Pillar = full governance |
| 14 | Cancel Redemption QR fixed | RPC searched qr_token column but actual column is qr_code; CREATE OR REPLACE FUNCTION fix applied |
| 15 | RLS on redemptions table | ALTER TABLE + 5 policies: own select/insert/update, admin all, business select |
| 16 | Admin dashboard pending count fixed | Was excluding mod-assigned submissions; now shows ALL pending including mod-assigned |
| 17 | Admin sidebar Queue removed | Redundant with Mod Queue; cleaned up |
| 18 | ImpactDashboard white screen fixed | useT import was missing; added import statement |
| 19 | VersionHistory updated to v1.2.0 | Added as CURRENT with full summary of sessions 18–19 work |
| 20 | UserManagement Verify Identity dropdown option fixed | Was missing from live repo (previous replacement failed silently); added correctly |

#### 🐛 Bugs Fixed
| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| Cancel Redemption QR stuck on "Cancelling..." | RPC `cancel_redemption_qr` searched `qr_token` but column is `qr_code` | Rewrote RPC with `qr_code` in both SELECT and UPDATE |
| ImpactDashboard white screen | `useT` hook called inside component but import statement missing | Added `import { useT } from '@/contexts/LanguageContext'` |
| translations.ts build error "Expected ; but found :" | New translation sections were appended after closing `};` instead of inside the object | Fixed insertion point; also removed stray double comma `},,` |
| Governance tier rows showing English in Urdu mode | Tier descriptions were hardcoded strings in JSX array | Replaced with `l('governance', 'tierX')` calls per tier |
| Daily Log category dropdown showing English | Categories rendered from `CATEGORY_LABELS` object directly without translation | Added `getCategoryLabel()` helper using `l('log', 'catX')` |
| Moderation reward description untranslated in Dashboard | `item.description` comes from DB in English | Added content-matching translation: if description includes 'Moderation reward' + 'approved' → use translated string |
| CNIC verified not clearing after admin approval | `setUser()` in App.tsx didn't pass cnic_verified field | Added cnic_verified, cnic_number, cnic_photo_url, cnic_submitted_at to setUser() |

#### 🗄️ SQL Run
| Command | Purpose | Status |
|---------|---------|--------|
| `ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY` + 5 policies | Redemptions RLS | ✅ |
| `CREATE OR REPLACE FUNCTION cancel_redemption_qr` | Fix qr_token → qr_code column reference | ✅ |
| Governance dummy proposals | Added 6 test proposals via SQL for UI testing | ✅ |

#### 📁 Files Changed
| File | Repo Path | Change Type |
|------|-----------|-------------|
| translations.ts | src/lib/ | Modified — Docs 05+06 + all missing keys added (settings, log, governance, modqueue, impact, dashboard) |
| Settings.tsx | src/pages/ | Modified — fully wired with useT(), all 23 strings |
| MyLog.tsx | src/pages/ | Modified — useT() added, getCategoryLabel(), all labels |
| TransactionHistory.tsx | src/pages/wallet/ | Modified — useT() added, moderation reward translation |
| ModQueue.tsx | src/pages/admin/ | Modified — useT() added, 4 key strings |
| ImpactDashboard.tsx | src/pages/community/ | Modified — useT import added, all stat card labels |
| Governance.tsx | src/pages/community/ | Modified — tier descriptions, Create Proposal modal, info paragraph |
| BusinessDirectory.tsx | src/pages/directory/ | Modified — useT wired |
| Leaderboard.tsx | src/pages/ | Modified — useT wired, tab labels dynamic |
| MemberDashboard.tsx | src/pages/dashboard/ | Modified — activity description translation |
| ActionForm.tsx | src/pages/submit/ | Modified — 30 CAPTCHA questions |
| GenerateRedemptionQR.tsx | src/pages/wallet/ | Modified — cancel error exposed |
| AdminDashboard.tsx | src/pages/admin/ | Modified — pending count shows all |
| AdminLayout.tsx | src/pages/admin/ | Modified — Queue removed |
| UserManagement.tsx | src/pages/admin/ | Modified — Verify Identity option fixed |
| VersionHistory.tsx | src/pages/about/ | Modified — v1.2.0 added as CURRENT |

#### ⏭️ Next Plan of Action (Window 5)
1. Real QR Code — replace text code with scannable image (qrcode npm library, Option B: full URL encoding)
2. /scan route — business scans QR → opens ScanRedemption auto-populated
3. Registration Drive printable materials (A5 flyer, guides, poster, reference card)
4. Phase 2 RLS — remaining 6 tables
5. CFSP v4.9 waterfall propagation to web app
6. Marketing site Emergency Reserve fix

#### 📝 Notes / Decisions Made
- App version incremented to v1.2.0 (was v1.1.0) — reflects CNIC system + full Urdu translation
- Business Directory professions: stored in constants.ts as English — cannot be translated without full constants translation layer. Added to backlog.
- Leaderboard user names and neighbourhood names: DB data, cannot be translated (they're real names)
- Governance proposal content from DB: English only — future feature to support bilingual proposals
- CNIC photo: single image (front + back side by side) confirmed as banking-standard approach for AI/NADRA compatibility
- QR Code: Decision made to use Option B (full URL) — business scans → app opens directly
- translations.ts rule: ALWAYS insert new sections BEFORE the closing `};` using `rfind('\n};')` — never append after
- translations.ts syntax check: bracket count `{` must equal `}` count before every push
