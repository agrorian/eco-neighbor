# ENB Web App — Master Backlog
*Last updated: 13 Mar 2026*
*Rule: At the start of every session (2h+ gap), check this file first.*

---

## 🔴 IN PROGRESS THIS SESSION
- [x] 30s review timer on Mod Queue (rubber-stamp prevention)
- [x] Airdrop cap + public log (insider abuse prevention)
- [x] GPS neighbourhood cross-check (SQL function created — but limited value, see note)
- [x] Stake scales with reporter balance (harassment prevention)
- [x] Reporter/target same-account detection (reward farming prevention)
- [ ] Escalation UI — senior mod screen for disagreements
- [ ] Sale gate enforcement logic

---

## ⚠️ CORRECTIONS FROM REVIEW
- GPS check catches location fraud only — does NOT prevent staged photos from correct location
- 30s timer prevents accidental rubber-stamping only — does NOT stop coordinated mod fraud
- **Real submission fraud prevention = EXIF timestamp + pHash + AI Vision (see below)**

---

## 🟡 NEXT SESSION (Important)
- [ ] Dual senior mod required to confirm reports (not just admin)
- [ ] CAPTCHA question rotation from larger pool
- [ ] Mod pair rotation — same 2 mods never assigned together twice in a row
- [ ] Moderator social circle problem — mods from same family/friend group can coordinate outside app via WhatsApp. Solution: onboarding process must select mods from DIFFERENT social circles + Neighbourhood Anchor elder acts as social accountability check. Also track mod agreement rate — if two mods agree 100% of the time across many reviews, flag for admin review (statistical anomaly detector)

---

## 🟢 LATER (Lower Priority)
- [ ] pHash duplicate photo detection across submissions
- [ ] AI Vision Moderation on submitted photos
- [ ] Cross-Neighbourhood AI Anomaly Monitor
- [ ] Auto-Generated PDF Reports (weekly/monthly)
- [ ] Vesting consequence logic for founders
- [ ] Missing 3 days Daily Log → WhatsApp alert
- [ ] Missing 7 days → FORMAL_ABSENCE status
- [ ] Float WhatsApp notification at 40% threshold
- [ ] Float auto-replenishment at 30%
- [ ] Governance proposal if Reserve < 20%
- [ ] Real ENB Support WhatsApp number in Settings (currently placeholder: 923001234567)
- [ ] Service worker cache-busting

---

## ✅ COMPLETED (this project)
- [x] Full submission cycle (camera, GPS, CAPTCHA, Cloudinary upload)
- [x] Dual moderator blind review with auto-assignment trigger
- [x] Moderator compensation (500 ENB approve / 200 ENB reject)
- [x] approve_submission function fixed (single clean signature)
- [x] Wallet crash fixed (Shield in wrong import)
- [x] Real ENB logo everywhere (splash, sidebar, PWA icons)
- [x] My History page at /history with submission cards
- [x] Report This button on approved submissions
- [x] Foolproof reporting system v2 (stake, rep requirement, cooldown, mod clawback)
- [x] Moderator role assignment from admin Users panel
- [x] Mod Queue accessible to moderators at /mod-queue (member-level route)
- [x] Admin password reset via SQL function
- [x] Token allocation display (all 7 v4.7 allocations with progress bars)
- [x] Daily Log structured format (5 fields, 2000 char limit)
- [x] Campaign Manager persisting to Supabase
- [x] Navigation consistency mobile/desktop
- [x] Magic-link users auto-upsert to public.users
- [x] Settings persisting neighbourhood/profession fields
- [x] Referral logic in approve_submission
- [x] Maturation Bridge screen
- [x] Business ScanRedemption screen
- [x] Admin UserManagement + Airdrop
- [x] PWA icons updated with real logo
- [x] Founder Sale / Hardship / Partner Float screens

---

## 📋 KNOWN ISSUES (not yet investigated)
- [ ] Faisal Khan 2 wallet showed 2x MODERATOR_REWARD entries (possible double-fire of evaluate_mod_decision)
- [ ] Approved submissions briefly still showed in admin Queue before page refresh
- [ ] Report This button only shown on approved submissions — should also appear on others' submissions in a community feed (future feature)

---

## 🗄️ SUPABASE — SQL Run Log
| Date | File | Status |
|------|------|--------|
| 12 Mar | mod_assignment.sql | ✅ |
| 13 Mar | mod_compensation.sql | ✅ |
| 13 Mar | fix_mod_trigger_and_assign.sql | ✅ |
| 13 Mar | fix_approve_and_admin_tools.sql | ✅ |
| 13 Mar | fix_approve_permanent.sql | ✅ |
| 13 Mar | debug_and_fix_approve.sql | ✅ |
| 13 Mar | file_report_rpc.sql | ✅ |
| 13 Mar | reporting_system_v2.sql | ⏳ PENDING |

---

## 🔐 Credentials & Config
- Admin: qahwakhana@gmail.com
- GitHub: agrorian/eco-neighbor
- Live app: https://eco-neighbor.vercel.app
- Supabase: https://wlbgqygkvlwavmylgteb.supabase.co
- If admin role resets after restart:
  UPDATE users SET role='admin', full_name='Muhammad Faisal K', enb_local_bal=3500, rep_score=1700, tier='Newcomer', is_active=true WHERE email='qahwakhana@gmail.com';
