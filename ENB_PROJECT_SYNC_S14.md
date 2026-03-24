# ENB Project Sync Document
**Generated:** 20 Mar 2026 — End of Session 14
**Purpose:** Full context handoff for next Claude session. Read this first before doing anything.
**Live app:** https://eco-neighbor.vercel.app
**Marketing site:** https://eco-neighbor-site.vercel.app
**GitHub (app):** https://github.com/agrorian/eco-neighbor
**GitHub (site):** https://github.com/agrorian/enb-site
**Supabase:** https://wlbgqygkvlwavmylgteb.supabase.co
**Giveth:** https://giveth.io/project/eco-neighbor-enb

---

## ✅ SESSION 14 — WORK COMPLETED

### Root Cause Fixed — approve_submission Silent Failures
The single most important fix of the entire project. Every submission approval had been silently failing since day one due to **3 wrong column names** in the `approve_submission` SQL function:

| Wrong | Correct |
|-------|---------|
| `start_date` | `starts_at` |
| `end_date` | `ends_at` |
| `reviewed_by` | `moderator_id` |

These caused the function to throw exceptions caught by `EXCEPTION WHEN OTHERS` which returned `{"success": false}` — but `evaluate_mod_decision` used `PERFORM` which ignores return values, so it returned `"approved"` while doing nothing. All 13 previously stuck submissions are now approved.

### SQL Functions Rebuilt (All in Supabase)
| Function | What Changed |
|----------|-------------|
| `approve_submission` | Fixed column names, added `lifetime_earned` update, removed silent exception hiding |
| `evaluate_mod_decision` | Changed `PERFORM` to `SELECT INTO` to capture and check results, added `already_processed` guard |
| `auto_evaluate_mod_decision` (trigger) | Added escalation guard — won't re-escalate when senior mod clears flag |

### Database Fixes
- `lifetime_earned` backfilled for all users — set equal to `enb_local_bal`
- Duplicate `approve_submission` function (integer vs numeric) resolved — dropped integer version
- All 13 stuck submissions approved
- Escalated submission approved via escalation queue

### Features Built
- **Bug Report System** — modal on marketing site + app page at `/bug-report` + admin panel at `/admin/bugs`
- **Multi-photo submissions** — up to 5 live photos per action, photo strip UI, parallel Cloudinary upload
- **Real-time balance updates** — Supabase subscriptions on `Wallet.tsx`, `MemberDashboard.tsx`, `TransactionHistory.tsx`
- **REFERRAL_REWARD transaction styling** — purple/Users icon in transaction history
- **PDF Daily Log Report** — fixed jsPDF namespace, fixed section parsing regex, added error handling and loading state
- **Clickable GPS map links** — tap GPS coordinate opens Google Maps in mod queue and submission queue
- **Full datetime on submissions** — date + time shown, not just date
- **ENB Today vs All Time** — admin dashboard now shows two separate ENB distribution metrics
- **Escalation loop fixed** — trigger no longer re-escalates when senior mod resolves
- **Duplicate More nav fixed** — mobile nav logic corrected for moderator role
- **Admin panel white screen fixed** — TypeScript error from stale `enbDistributedToday` reference
- **EscalationQueue senior mod payment** — fixed broken `supabase.rpc as any` line, now updates `lifetime_earned`

### Current Verified Stats
- **14 approved submissions**
- **0 pending**
- **10 users**
- **47.5k ENB distributed (all time)**
- **14 verified actions showing on dashboard** ✅

---

## 📊 CURRENT USER BALANCES

| User | Role | ENB | Rep | Notes |
|------|------|-----|-----|-------|
| Muhammad Faisal K | admin | ~14,250 | 2,900 | Includes escalation rewards |
| Faisal Khan 2 | moderator | ~12,500 | 0 | |
| Eco Neighbor | moderator | ~8,500 | 0 | |
| Asmat | moderator | ~6,500 | 0 | |
| intuitionalised | member | ~2,500 | 500 | Test referral user |
| goldennexusadvisory | member | ~750 | 0 | Test referral user |

---

## 🗄️ SQL RUN LOG (Session 14)

| Query | Purpose | Status |
|-------|---------|--------|
| Fix `approve_submission` column names | `starts_at`, `ends_at`, `moderator_id` | ✅ |
| Rebuild `evaluate_mod_decision` | PERFORM → SELECT INTO, result checking | ✅ |
| Rebuild `auto_evaluate_mod_decision` trigger | Escalation guard added | ✅ |
| `DROP FUNCTION approve_submission(UUID,UUID,INTEGER,INTEGER,TEXT)` | Remove duplicate integer version | ✅ |
| `UPDATE users SET lifetime_earned = enb_local_bal` | Backfill all users | ✅ |
| Approve all 6 stuck submissions | `evaluate_mod_decision` batch call | ✅ |
| Approve escalated submission manually | `approve_submission` direct call | ✅ |
| Fix `qahwakhana@gmail.com` lifetime_earned | Set = enb_local_bal | ✅ |
| `CREATE TABLE bug_reports` | Bug reporting system | ✅ |

---

## 📋 NEXT SESSION PRIORITIES

### 🔴 First Thing Next Session
1. **Multi-account switcher** — tap user avatar bottom-left → see saved accounts → switch in 2 seconds. Admin/mod only feature. Builds like Gmail account switching. Medium difficulty, ~2 hours. See design notes below.
2. **Devnet SOL** — try faucet.quicknode.com/solana/devnet or faucet.alchemy.com/faucets/solana-devnet (24h+ has passed since last attempt)

### 🟡 App Development
3. **ModQueue timer** — currently 30s in live code ✅ (was briefly 10s, reverted)
4. **Sale gate enforcement logic** — FounderSale screens exist, logic not wired to window dates
5. **Daily Log absence alerts** — 3 days → WhatsApp alert, 7 days → FORMAL_ABSENCE
6. **Float auto-replenishment** — 40% alert, 30% auto-replenish
7. **Real ENB Support WhatsApp number** — replace placeholder 923001234567 in Settings

### 🟢 Later
8. pHash duplicate photo detection
9. AI Vision Moderation on photos
10. Vesting consequence logic for founders
11. Service worker cache-busting
12. GPS validation wired to ActionForm
13. Referral code format ENB-XXXX-XXXX (cosmetic, before public launch)

---

## 🔄 MULTI-ACCOUNT SWITCHER — DESIGN NOTES
**For next session — build this first**

### What it does:
Tap user avatar (bottom-left sidebar) → dropdown shows all saved accounts → tap any → auto sign-out + sign-in in ~2 seconds → "Add account" option opens login form

### How it works:
- Store account sessions in `localStorage` as `enb_saved_accounts: [{email, access_token, refresh_token, full_name, role, avatar_initial}]`
- On switch: call `supabase.auth.setSession({access_token, refresh_token})` — no password needed
- If token expired: show password prompt for that account only
- Only show switcher to admin/moderator roles (testing convenience feature)

### Files to modify:
- `src/components/layout/Sidebar.tsx` or wherever the user avatar renders at bottom
- `src/components/layout/MobileNav.tsx` — bottom user section
- New component: `src/components/AccountSwitcher.tsx`

### Key rule: Never store passwords — only Supabase session tokens

---

## ⚠️ IMPORTANT NOTES FOR NEXT SESSION
- Always upload src.zip + ENB_BACKLOG.md + ENB_DEVLOG.md + this sync doc at session start
- `approve_submission` now has correct column names — DO NOT revert
- `lifetime_earned` = `enb_local_bal` for all users (no spending has occurred yet)
- Once ENB spending (redemptions) begins, `lifetime_earned` will diverge from `enb_local_bal` — that's correct by design
- Ramzan Cleanup Drive campaign is active (1.5x multiplier) — expires in ~5 days
- Fi.co pitch event: **Mar 24, 2026 — 12:00–1:30 PM PKT** — practice pitch daily

---

## 🔐 CREDENTIALS & CONFIG
```
Admin email:        qahwakhana@gmail.com
Project email:      econeighborisenb@gmail.com
GitHub app:         agrorian/eco-neighbor
GitHub site:        agrorian/enb-site
Supabase anon key:  sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
Cloudinary:         dl86obm3b / preset: enb_photos
Solana wallet:      DSV9Pn... (keypair at D:\Solana Keys\test-keypair.json)
Solana network:     devnet (set via CLI)
Fi.co program:      Jul 28 – Oct 22, 2026
```

**If admin role resets:**
```sql
UPDATE users SET role='admin', full_name='Muhammad Faisal K', 
enb_local_bal=14250, rep_score=2900, tier='Newcomer', is_active=true 
WHERE email='qahwakhana@gmail.com';
```
