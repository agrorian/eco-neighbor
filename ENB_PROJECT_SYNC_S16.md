# ENB Project Sync Document
**Generated:** 23 Mar 2026 — End of Session 16
**Purpose:** Full context handoff for next Claude session. Read this first before doing anything.
**Live app:** https://eco-neighbor.vercel.app
**Marketing site:** https://eco-neighbor-site.vercel.app
**GitHub (app):** https://github.com/agrorian/eco-neighbor
**GitHub (site):** https://github.com/agrorian/enb-site
**Supabase:** https://wlbgqygkvlwavmylgteb.supabase.co
**Giveth:** https://giveth.io/project/eco-neighbor-enb

---

## ✅ SESSION 16 — WORK COMPLETED

### Business Partner UI
- `BusinessDashboard.tsx` — real Supabase data, float bar, stats, quick links
- `BusinessOffers.tsx` — Discount + ENB Swap offers, photo upload via Cloudinary, pause/resume/delete
- `BusinessHistory.tsx` — redemption history with stats
- `BusinessMobileNav.tsx` — business-specific mobile nav
- `BusinessDesktopSidebar.tsx` — business desktop sidebar with ENB Swap History label
- **Business Admin toggle** — same pattern as Member/Admin Panel, shown for business role
- **Onboarding tab** — shown for onboarding_team role in sidebar

### Partner & Volunteer System
- `partner_applications` table — business signup applications
- `volunteer_applications` table + DOB/CNIC columns
- `business_offers` table + `photo_url` column
- `PartnerSignup.tsx` — saves to Supabase, no discount details at signup
- `VolunteerApply.tsx` — with DOB, CNIC auto-formatter, 1,000 ENB reward
- `OnboardingQueue.tsx` — 3-tab workflow (New/In Progress/Submitted)
- `AdminOnboarding.tsx` — partner approval + volunteer approval panel
- `onboarding_team` SQL functions — mark_contacted, submit_onboarding_complete, approve_partner_application, return_partner_application

### Admin PartnerManager
- Session restore fix — admin stays logged in when creating business accounts
- View Details modal — float edit, GPS lat/lng, email change (admin only)
- `business_name` column confirmed (NOT `name`)

### Business Directory
- Map panel overlay — clicking pin shows mini panel, stays on map, "View Full Details" link
- Share button wired — `navigator.share` on mobile, clipboard copy on desktop
- Category filters now from `constants.ts`

### Constants & Categories
- `src/lib/constants.ts` — single source of truth for all professions and business categories
- 47 professions sorted A→Z
- 25 business categories sorted A→Z (Other last)
- New: Allopathic Doctor, Homeopathic Doctor, Cobbler, Pansar (Unani/Herbal), Pharmacist, Volunteer, Electrician (was already there), Electronics Technician
- New businesses: Electrical Shop (Wires/Lights/Fittings), Electronic Appliances Shop, Dry Fruit Merchant
- Homeopathic Doctor/Shop kept as separate category

### Fixes
- Settings white screen — `useLang()` was imported but never called
- Account switcher dropdown off-screen on mobile — anchored to right edge
- Account switcher stale avatar initials — always derived fresh from name
- Float Monitor visibility — only shows for business role in More menu
- BusinessOffers Save button — partner_id fetched directly not via RPC
- Profession list scrollable — max-h increased
- Redundant Queue removed from admin sidebar

### Database Changes This Session
| Table | Change |
|-------|--------|
| `partner_applications` | Created + added DOB, CNIC, onboarding fields |
| `volunteer_applications` | Created + DOB, CNIC columns |
| `business_offers` | Created + photo_url column |
| `business_partners` | Test Dhaba deleted, Test Electrical Shop inserted correctly |

---

## 📊 CURRENT STATE

### Business Partners
| Business | Owner Email | Float | Status |
|----------|-------------|-------|--------|
| Test Electrical Shop | callfaisal.fed@gmail.com | 5,000 ENB | Active |

### Users (key ones)
| User | Role | ENB | Notes |
|------|------|-----|-------|
| Muhammad Faisal K | admin | ~14,750 | qahwakhana@gmail.com |
| Faisal Khan 2 | moderator | ~16,500 | pioustechno@gmail.com |
| Eco Neighbor | moderator | ~9,000 | econeighborisenb@gmail.com |
| Asmat | moderator | ~7,500 | zmaeamaan@gmail.com |
| TEST | moderator | ~5,500 | intuitionalised@gmail.com |
| Test Electrical Shop | business | 0 | callfaisal.fed@gmail.com |

---

## 📋 NEXT SESSION PRIORITIES

### 🔴 First
1. **Urdu Phase 2** — wire `useT()` into Login, SignUpStep1, SignUpStep2, MemberDashboard, ActionForm, Wallet, More
2. **Domain setup** — econeighbor.org purchased on Spaceship → add to Vercel (2 DNS) + Resend (2 DNS) → update Edge Function from address
3. **Business Partner signup on marketing website** — currently only in app, needs to be on eco-neighbor-site too
4. **Partner Support Head role** — future in-house position, supervises onboarding_team volunteers

### 🟡 App Development
5. **Homeopathic Doctor/Shop** — multi-select checkboxes on business signup (doctor + shop separately)
6. **Business Admin toggle redesign** — confirmed correct pattern (same as Member/Admin Panel)
7. **Partner signup from Welcome page** — add "Register Your Business" link on welcome screen
8. **Float auto-replenishment** — 40% WhatsApp alert, 30% auto top-up
9. **Real WhatsApp number** in Settings (placeholder: 923001234567)
10. **Fi.co pitch** — March 24, 2026 12:00–1:30 PM PKT

### 🟢 Later
11. pHash duplicate photo detection
12. AI Vision Moderation
13. Devnet SOL (faucets still rate limited)
14. Sale gate enforcement logic
15. Referral code format ENB-XXXX-XXXX
16. Service worker cache-busting

---

## 🌐 DOMAIN SETUP (when purchased)
**Spaceship:** econeighbor.org (~PKR 1,809/yr)

**Step 1 — Vercel:**
- Project → Settings → Domains → Add `econeighbor.org`
- Add CNAME + A record at Spaceship (Vercel provides values)

**Step 2 — Resend:**
- Resend → Domains → Add `econeighbor.org`
- Add 2 TXT records at Spaceship
- Wait ~30 mins for verification

**Step 3 — Update Edge Functions:**
```
from: 'Eco-Neighbor <onboarding@resend.dev>'
→ from: 'Eco-Neighbor <notifications@econeighbor.org>'
```
Redeploy both `notify-mods` and `notify-absence`

---

## ⚠️ IMPORTANT NOTES
- Always upload src.zip + ENB_BACKLOG.md + ENB_DEVLOG.md + this sync doc
- `business_partners` column is `business_name` (NOT `name`)
- `volunteer_applications` has `dob` and `cnic` columns
- `business_offers` category values: `'discount'` and `'swap'` (NOT `'redemption'`)
- ENB onboarding reward = 1,000 ENB (NOT 2,000)
- Resend API key: `re_eHSzkb69_3Q42Ncs4k2tNkPm2E5EoNecq`
- Fi.co pitch: **March 24, 2026 — 12:00–1:30 PM PKT** — TOMORROW

---

## 🔐 CREDENTIALS
```
Admin:          qahwakhana@gmail.com
Project email:  econeighborisenb@gmail.com
GitHub app:     agrorian/eco-neighbor
GitHub site:    agrorian/enb-site
Supabase anon:  sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
Cloudinary:     dl86obm3b / preset: enb_photos
Solana wallet:  9aVMAop3d3t3uwD4YGYyswScJW9NeUoaPEa8abyF94Hb (id.json)
Resend:         re_eHSzkb69_3Q42Ncs4k2tNkPm2E5EoNecq
Domain pending: econeighbor.org on Spaceship.com
```

**If admin role resets:**
```sql
UPDATE users SET role='admin', full_name='Muhammad Faisal K',
enb_local_bal=14750, rep_score=2900, tier='Newcomer', is_active=true
WHERE email='qahwakhana@gmail.com';
```
