# ENB Project Sync Document
**Generated:** 24 Mar 2026 — End of Session 17
**Live app:** https://eco-neighbor.vercel.app
**Marketing site:** https://eco-neighbor-site.vercel.app
**GitHub (app):** https://github.com/agrorian/eco-neighbor
**GitHub (site):** https://github.com/agrorian/enb-site

---

## ✅ SESSION 17 — COMPLETED

### Bug Fixes Deployed
- QR Cancel & Refund — `cancel_redemption_qr()` SQL + button in GenerateRedemptionQR
- Auto-release cron for expired QR codes every 5 min
- Floating 🐞 bug button on every screen (FloatingBugButton.tsx)
- PartnerSignup GPS map pin picker
- TBD filtered from Business Directory list + map popup
- Float warning threshold — uses actual enb_float from DB not hardcoded 150,000
- Volunteer role approval via SECURITY DEFINER RPC (was silently failing)
- Role constraint updated — onboarding_team added to users_role_check
- Faisal aye role fixed to onboarding_team
- last_log_date updated to 2026-03-24 for admin
- generate_log_report now counts weekdays from joined_at (not full month)
- Account switcher mobile overflow fixed (right-0 anchor)
- Account switcher stale avatar initial fixed
- partnerNav undefined error fixed in DesktopSidebar
- ENB Master Snapshot document created (7-section Word doc)
- Tokenomics: Emergency 2.5% + Community Builder 2.5% = 5% (NOT 5%+5%)

### SQL Run This Session
| File | Status |
|------|--------|
| add_offer_photo.sql | ✅ |
| fix_partner_gps_and_enb.sql | ✅ — 1,000 ENB restored to admin |
| fix_redemption_qr.sql | ✅ |
| fix_volunteer_role.sql | ✅ |
| ALTER TABLE users ADD onboarding_team to role constraint | ✅ |
| approve_volunteer SECURITY DEFINER function | ✅ |

---

## ⚠️ KNOWN ISSUES (not fully fixed — recurring)

These issues have been attempted multiple times this session but keep getting broken
by subsequent pushes. Fix them properly in ONE dedicated pass next session:

| # | Issue | Root Cause |
|---|-------|-----------|
| 1 | Business Partner: Member View dashboard missing | Role routing conflict — business role needs clean `/` → MemberDashboard handling |
| 2 | Business Admin toggle → white screen on /business/offers | BusinessOffers may have JSX error from edit modal addition |
| 3 | Verified Actions / ENB Distributed — blank rectangle | MemberDashboard reverted too many times — need single clean deploy |
| 4 | "Become a Partner" shows for business users | partnerNav fix keeps getting broken by sidebar rebuilds |
| 5 | Urdu Phase 2 — toggle switches RTL but stays in English | useT() wiring caused repeated build failures — needs complete file rewrites not patches |
| 6 | Campaign banner → /impact (no dedicated campaign page) | No campaign detail page exists yet |
| 7 | BusinessProfile offers not clickable | Need clearer Redeem CTA |
| 8 | Profile photo not showing after save | profile_pic_url not loading in App.tsx on login |

**CRITICAL RULE FOR NEXT SESSION:**
Before fixing any of the above, read the CURRENT deployed file first.
Do NOT patch from memory. Build complete replacement files, not string replacements.

---

## 📋 AGENDA — NEXT SESSIONS (from Session 1 message)

### 🔴 Priority (in order)
1. **Brand design system** — fonts, colors, spacing, component library. App is too blunt/small
2. **Tailored action submission screens** — Carpool, Skill Workshop, etc. each need custom fields
3. **Tailored business category screens** — Doctor vs Shop vs Mechanic etc.
4. **Semantic versioning document** — chronological from day 1
5. **Proofread + standardise terminology** — neighbor spelling, category names, etc.
6. **Tokenomics fix on marketing site** — change 5%+5% to 2.5%+2.5% (manual edit in enb-site repo)
7. **Urdu Phase 2 PROPERLY** — rewrite each file completely, not string replacement patches
8. **Fix recurring issues above** — in ONE clean dedicated pass

### 🟡 From Sync Doc S16
- Domain setup (econeighbor.org DNS)
- Business Partner signup on marketing site
- Float auto-replenishment at 30%
- WhatsApp alert at 40%
- Partner Support Head role
- Campaign detail page

---

## 🔐 CREDENTIALS
```
Admin:          qahwakhana@gmail.com
Supabase anon:  sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
Cloudinary:     dl86obm3b / preset: enb_photos
Resend:         re_eHSzkb69_3Q42Ncs4k2tNkPm2E5EoNecq
Solana wallet:  9aVMAop3d3t3uwD4YGYyswScJW9NeUoaPEa8abyF94Hb
GitHub app:     agrorian/eco-neighbor
GitHub site:    agrorian/enb-site
Domain pending: econeighbor.org on Spaceship.com
```

**If admin role resets:**
```sql
UPDATE users SET role='admin', full_name='Muhammad Faisal K',
enb_local_bal=15750, rep_score=2900, tier='Newcomer', is_active=true
WHERE email='qahwakhana@gmail.com';
```

## ⚠️ KEY ARCHITECTURAL NOTES
- `business_partners` column: `business_name` (NOT `name`)
- `business_offers` category: `'discount'` and `'swap'` (NOT `'redemption'`)
- ENB onboarding reward = 1,000 ENB
- Volunteer reward = 1,000 ENB per onboarded business
- `volunteer_applications` has `dob` and `cnic` columns
- Role constraint now includes: member, business, admin, moderator, organiser, founder, onboarding_team
- Urdu: DO NOT use string replacement regex. Write complete files from scratch.
- Always read current deployed file before editing. src_new may be stale.
