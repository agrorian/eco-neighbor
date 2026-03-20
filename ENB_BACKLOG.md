# ENB Web App — Master Backlog
*Last updated: 20 Mar 2026*
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
- [x] Dual senior mod — DROPPED: admin escalation queue handles this
- [x] CAPTCHA pool expanded 3 → 15 questions with randomised answer positions
- [x] Mod pair rotation — SQL trigger updated to prevent consecutive same-pair assignments
- [x] Moderator social circle detection — get_mod_agreement_stats() SQL + Mod Collusion Watch card in admin dashboard — mods from same family/friend group can coordinate outside app via WhatsApp. Solution: onboarding process must select mods from DIFFERENT social circles + Neighbourhood Anchor elder acts as social accountability check. Also track mod agreement rate — if two mods agree 100% of the time across many reviews, flag for admin review (statistical anomaly detector)

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
- [x] PartnerManager — Add Partner modal wired to Supabase (was mock data)
- [x] BusinessDirectory — Leaflet map with clickable pins replacing placeholder
- [x] PartnerFloat — Fixed wrong column names (owner_user_id, enb_float)
- [x] More.tsx — Added Founder Sale Gate, Float Monitor, My History links
- [x] Profile.tsx — Edit button navigates to settings, logout calls supabase.auth.signOut()
- [x] MyLog — Reports tab with weekly/monthly PDF download (jsPDF)
- [x] Admin AdminDashboard — Mod Collusion Watch card + agreement rate bars
- [x] Referral system — complete end-to-end fix (URL param, DB save, escrow, payout)
- [x] Auto-approval trigger — trg_auto_evaluate_mod_decision DB trigger
- [x] ROOT CAUSE FIX — approve_submission wrong column names (starts_at, ends_at, moderator_id)
- [x] evaluate_mod_decision — PERFORM→SELECT INTO, result checking, no silent failures
- [x] lifetime_earned — backfilled + updated on every approval going forward
- [x] Bug Report System — marketing modal + /bug-report + /admin/bugs + bug_reports table
- [x] Multi-photo submissions — up to 5 live photos per action
- [x] Real-time balance updates — Wallet, MemberDashboard, TransactionHistory subscriptions
- [x] REFERRAL_REWARD transaction styling — purple/Users icon
- [x] PDF Daily Log — jsPDF namespace fix, section parsing regex, error handling
- [x] GPS map links clickable — opens Google Maps from mod queue and submission queue
- [x] Full datetime on submissions — date + time
- [x] ENB Today vs All Time — admin dashboard two separate metrics
- [x] Escalation loop fixed — trigger guard prevents re-escalation
- [x] Duplicate More nav fixed — mobile nav moderator logic
- [x] EscalationQueue payment — fixed broken code, lifetime_earned updated
- [x] ModQueue timer — 10s for testing (was 30s)
- [x] README.md — proper ENB project README
- [x] Marketing site — Fi.co badge, Giveth links, email protection, 5B stat, investor card

---

## 📋 KNOWN ISSUES (not yet investigated)
- [x] ModQueue timer — confirmed 30s in live code ✅
- [ ] TEST user (intuitionalised@gmail.com) balance cleanup SQL still needs to run

## 📋 KNOWN ISSUES (not yet investigated) — original
- [x] Faisal Khan 2 wallet showed 2x MODERATOR_REWARD entries — RESOLVED: not a bug, airdrop discrepancy
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
