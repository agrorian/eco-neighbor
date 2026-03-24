# ENB Project Sync Document
**Generated:** 21 Mar 2026 — End of Session 15
**Purpose:** Full context handoff for next Claude session. Read this first before doing anything.
**Live app:** https://eco-neighbor.vercel.app
**Marketing site:** https://eco-neighbor-site.vercel.app
**GitHub (app):** https://github.com/agrorian/eco-neighbor
**GitHub (site):** https://github.com/agrorian/enb-site
**Supabase:** https://wlbgqygkvlwavmylgteb.supabase.co
**Giveth:** https://giveth.io/project/eco-neighbor-enb

---

## ✅ SESSION 15 — WORK COMPLETED

### Multi-Account Switcher
- Tap user avatar (bottom-left sidebar) → dropdown shows saved accounts → switch in ~2 seconds
- Stores Supabase session tokens in localStorage — never passwords
- Auto-saves session on every login
- Shows for all roles (not restricted to admin/mod)
- Files: `src/components/AccountSwitcher.tsx` (NEW), `src/components/layout/DesktopSidebar.tsx`, `src/components/layout/MobileNav.tsx`, `src/pages/onboarding/Login.tsx`

### Admin Dashboard — Pending Submissions List
- Expandable list of all pending submissions with photo thumbnail, submitter email, action type, date/time, assigned mods + decisions, GPS link
- Click row to expand: full photos, description, GPS (clickable to Google Maps), mod decisions
- Queue nav item removed from admin sidebar
- "Go to Queue" button removed from expanded detail (replaced with close button)
- Files: `src/pages/admin/AdminDashboard.tsx`, `src/pages/admin/AdminLayout.tsx`

### Mod Email Notifications (notify-mods Edge Function)
- Deployed to Supabase Edge Functions
- Webhook on `moderator_assignments` INSERT fires email to both assigned mods
- Beautiful HTML email with photo, description, GPS link, "Review in Mod Queue" CTA
- Subject: `[ENB] New Action Assigned — {action_type}`
- **Current limitation:** Resend free tier only delivers to `qahwakhana@gmail.com` until domain is verified
- **Fix:** Purchase `econeighbor.org` on Spaceship (~PKR 1,809/yr), verify in Resend, update one line in Edge Function
- Muhammad has domain purchase in calendar

### Daily Log Absence Alerts
- SQL function `check_daily_log_absences()` — checks all admin/mod/founder/organiser roles
- Day 3: warning email to user
- Day 7: FORMAL_ABSENCE recorded in daily_logs + email to user + admin alert to Muhammad
- Cron job: runs daily at 19:05 UTC (00:05 PKT) via pg_cron
- Edge Function `notify-absence` deployed to Supabase
- Admin dashboard shows "Daily Log Absence Alerts" card when anyone hits 3+ days
- New columns added to users: `consecutive_absences`, `last_log_date`, `formal_absence_flagged`, `absence_alert_sent_at`
- New column added to daily_logs: `is_formal_absence`
- **Current state:** All 5 users at 0 consecutive absences, last_log_date = 2026-03-21 ✅

### Daily Log Timezone Fix
- Was using UTC date — showed yesterday's log as today's for PKT users after midnight
- Fixed with `getPKTDate()` helper using `Asia/Karachi` timezone throughout MyLog.tsx
- `submit_daily_log` SQL function also fixed to use `(NOW() AT TIME ZONE 'Asia/Karachi')::DATE`
- File: `src/pages/MyLog.tsx`

### Volunteer Profession Added
- Added `Volunteer` between `Social Worker` and `Religious Scholar` in signup dropdown
- File: `src/pages/onboarding/SignUpStep2.tsx`

### About / What is ENB Page
- New page at `/about` — mobile-first, comprehensive
- Sections: How It Works (4 steps), What You Can Earn (6 actions with ENB amounts), Where You Can Spend (6 partner types), Reputation Tiers (5 tiers), Two Types of ENB (LOCAL vs GLOBAL), Join CTA
- "What is ENB?" link on Welcome screen upgraded from tiny footer text to prominent card with icon, title, subtitle, arrow
- Files: `src/pages/onboarding/About.tsx` (NEW), `src/pages/onboarding/Welcome.tsx`, `src/App.tsx`

### Urdu/English Language Switch (Phase 1)
- Complete translation system built — 438 lines covering all key UI sections
- Sections translated: Common, Welcome, Login, Signup, Dashboard, Submit Action, Wallet, Navigation, Tiers, Action Types, About, Settings
- Language toggle button: 🇵🇰/🇬🇧 — shows on Welcome screen (top right), Settings page, Desktop Sidebar (bottom)
- RTL layout auto-applied when Urdu selected (`dir="rtl"` on root)
- Noto Nastaliq Urdu font loaded from Google Fonts
- Language preference saved in localStorage — persists across sessions
- **Phase 1 complete:** Infrastructure built, Welcome screen translated ✅
- **Phase 2 pending:** Wire `useT()` hook into Login, Signup, Dashboard, Submit Action, Wallet screens
- Files: `src/lib/translations.ts` (NEW), `src/contexts/LanguageContext.tsx` (NEW), `src/components/LanguageToggle.tsx` (NEW), `src/pages/onboarding/Welcome.tsx`, `src/App.tsx`, `src/pages/Settings.tsx`, `src/components/layout/DesktopSidebar.tsx`, `src/index.css`

---

## 📊 CURRENT STATE

### User Balances
| User | Role | ENB | Rep | Absences |
|------|------|-----|-----|----------|
| Muhammad Faisal K | admin | ~15,000+ | 2,900+ | 0 |
| Faisal Khan 2 | moderator | ~12,500 | 0 | 0 |
| Eco Neighbor | moderator | ~8,500 | 0 | 0 |
| Asmat | moderator | ~6,500 | 0 | 0 |
| TEST (intuitionalised) | moderator | ~2,500 | 500 | 0 |

### Supabase Edge Functions Deployed
| Function | Purpose | Status |
|----------|---------|--------|
| `notify-mods` | Email mods when submission assigned | ✅ Live |
| `notify-absence` | Email alerts for 3-day/7-day absences | ✅ Live |

### Cron Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| `daily-absence-check` | 19:05 UTC daily | Runs `check_daily_log_absences()` |

---

## 📋 NEXT SESSION PRIORITIES

### 🔴 First Thing
1. **Urdu Phase 2** — Wire `useT()` into: Login, SignUpStep1, SignUpStep2, MemberDashboard, ActionForm, Wallet, More, Settings fully
2. **Domain purchase** — Muhammad buying `econeighbor.org` on Spaceship (~PKR 1,809). Once bought: add to Vercel (2 DNS records) + add to Resend (2 DNS records) + update Edge Function `from` address → all mod emails work

### 🟡 App Development
3. **Float auto-replenishment** — 40% WhatsApp alert, 30% auto top-up from Business Partner Reserve
4. **Real WhatsApp number** in Settings (currently placeholder 923001234567)
5. **Sale gate enforcement** — wire founder sale window dates to actual logic (low priority until token launch)
6. **Daily Log absence alerts** — emails currently only deliver to qahwakhana@gmail.com (Resend domain limitation — fixed when domain purchased)

### 🟢 Later
7. pHash duplicate photo detection
8. AI Vision Moderation on photos
9. Vesting consequence logic for founders
10. Service worker cache-busting
11. Referral code format ENB-XXXX-XXXX (cosmetic)
12. Devnet SOL — faucets all rate limited, try again later

---

## 🔄 URDU PHASE 2 — IMPLEMENTATION NOTES
**For next session**

Pattern for wiring each screen:
```tsx
import { useT } from '@/contexts/LanguageContext';

export default function Login() {
  const { l, isUrdu } = useT();
  // Replace hardcoded strings:
  // <h1>Welcome Back</h1>  →  <h1>{l('login', 'title')}</h1>
  // <label>Email</label>   →  <label>{l('login', 'email')}</label>
  // Add className={isUrdu ? 'font-urdu' : ''} to text elements
}
```

Screens to wire (in priority order):
1. `Login.tsx` — login/reset password form
2. `SignUpStep1.tsx` — email/password
3. `SignUpStep2.tsx` — name/neighbourhood/profession
4. `MemberDashboard.tsx` — main dashboard
5. `ActionForm.tsx` — submit action
6. `Wallet.tsx` — wallet screen
7. `More.tsx` — more menu
8. `MobileNav.tsx` — bottom nav labels

---

## 🌐 DOMAIN SETUP (when purchased)

**Step 1 — Vercel:**
- Vercel dashboard → eco-neighbor project → Settings → Domains → Add `econeighbor.org`
- Add two DNS records at Spaceship: CNAME + A record (Vercel provides exact values)

**Step 2 — Resend:**
- Resend → Domains → Add Domain → `econeighbor.org`
- Add two TXT records at Spaceship (Resend provides exact values)
- Wait for verification (usually 30 mins - 2 hours)

**Step 3 — Update Edge Function:**
- In `supabase/functions/notify-mods/index.ts` change:
  `from: 'Eco-Neighbor <onboarding@resend.dev>'`
  to: `from: 'Eco-Neighbor <notifications@econeighbor.org>'`
- Redeploy: `supabase functions deploy notify-mods`
- Same update for `notify-absence/index.ts`

---

## ⚠️ IMPORTANT NOTES FOR NEXT SESSION
- Always upload src.zip + ENB_BACKLOG.md + ENB_DEVLOG.md + this sync doc at session start
- `approve_submission` has correct column names — DO NOT revert
- `submit_daily_log` uses PKT timezone — DO NOT revert to CURRENT_DATE
- `check_daily_log_absences` uses `joined_at` not `created_at`
- Ramzan Cleanup Drive campaign expires in ~4 days — check if still active
- Fi.co pitch event: **Mar 24, 2026 — 12:00–1:30 PM PKT** — 3 days away!
- `src/lib/` and `src/contexts/` folders now exist in the project

---

## 🔐 CREDENTIALS & CONFIG
```
Admin email:        qahwakhana@gmail.com
Project email:      econeighborisenb@gmail.com
GitHub app:         agrorian/eco-neighbor
GitHub site:        agrorian/enb-site
Supabase anon key:  sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
Cloudinary:         dl86obm3b / preset: enb_photos
Solana wallet:      DSV9PnPRSPkpGtjozJGAa81LSCRDQTYcYHaz42enczv9
Solana network:     devnet (faucets rate limited — try again later)
Resend API key:     re_eHSzkb69_3Q42Ncs4k2tNkPm2E5EoNecq
Fi.co program:      Jul 28 – Oct 22, 2026
Domain (pending):   econeighbor.org on Spaceship.com
```

**If admin role resets:**
```sql
UPDATE users SET role='admin', full_name='Muhammad Faisal K',
enb_local_bal=15000, rep_score=2900, tier='Newcomer', is_active=true
WHERE email='qahwakhana@gmail.com';
```
