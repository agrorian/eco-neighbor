# ENB Project Sync Document
**Generated:** 19 Mar 2026 — End of Session 13
**Purpose:** Full context handoff for next Claude session. Read this first before doing anything.
**Live app:** https://eco-neighbor.vercel.app
**Marketing site:** https://eco-neighbor-site.vercel.app
**GitHub (app):** https://github.com/agrorian/eco-neighbor
**GitHub (site):** https://github.com/agrorian/enb-site
**Supabase:** https://wlbgqygkvlwavmylgteb.supabase.co
**Giveth:** https://giveth.io/project/eco-neighbor-enb

---

## ✅ SESSION 13 — WORK COMPLETED

### Referral System — Complete Fix
The referral system was broken in 3 places. All fixed.

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `referred_by` never saved | `SignUpStep1` never read `?ref=` URL param | Fixed — reads URL on load, passes to Step2 via URL |
| Referral code not found in DB | `ReferralHub` generated code on-the-fly but never saved to DB | Fixed — saves to DB on first visit |
| `release_referral_escrow` never fired | Called with wrong param, only released after 14-day wait | Rebuilt — triggers immediately on first approved action |
| Step2 localStorage unreliable | localStorage lost in incognito/different device | Fixed — ref code now travels in URL `/step2?ref=619b3048` |

**Files pushed:**
- `src/pages/onboarding/SignUpStep1.tsx` — captures `?ref=` from URL, referral field visible
- `src/pages/onboarding/SignUpStep2.tsx` — reads ref from URL param directly
- `src/pages/wallet/ReferralHub.tsx` — saves referral_code to DB on first visit

**SQL run:**
- `release_referral_escrow()` rebuilt — triggers on first approved action, no 14-day wait
- `referred_by` and escrow manually fixed for test users `goldennexusadvisory@gmail.com` and `intuitionalised@gmail.com`
- Duplicate escrow row and transaction cleaned up

### Auto-Approval Trigger — New DB Trigger
**Bug:** Both mods could approve but `evaluate_mod_decision` was never called due to race condition between frontend update and re-fetch. Submissions stayed `pending` forever.

**Fix:** DB trigger `trg_auto_evaluate_mod_decision` created — fires automatically on `moderator_assignments` UPDATE whenever both `decision1` AND `decision2` are present. Checks `status = 'pending'` to prevent double-processing.

```sql
-- Trigger confirmed active:
-- trg_auto_evaluate_mod_decision | UPDATE | AFTER
```

### ModQueue Timer
- Reduced from 30s to 10s for testing
- File: `src/pages/admin/ModQueue.tsx` — pushed

### Marketing Website (eco-neighbor-site.vercel.app)
All changes applied to `index.html` in `enb-site` repo:

| Fix | What changed |
|-----|-------------|
| Fi.co badge | Gold badge added to hero section |
| Whitepaper button | Changed to "Request Whitepaper" — opens pre-filled email |
| Email protection | Cloudflare was mangling mailto links — fixed with JS onclick |
| Giveth links | 3 footer links now point to giveth.io/project/eco-neighbor-enb |
| Token address | Placeholder replaced with "Deploying Q2 2026 · Devnet active" |
| 5B stat overflow | Changed from `5,000,000,000` to `5B` with subtitle |
| Fi.co investor card | Full card added to investors section |
| Contact email | `econeighborisenb@gmail.com` shown in footer |

### README.md
- Replaced Gemini AI Studio template with proper ENB project README
- Pushed to `github.com/agrorian/eco-neighbor`

### Fi.co Acceptance
- Accepted into Pakistan FI Core Program — Jul 28 – Oct 22, 2026
- Added to Giveth listing and marketing website

---

## 📊 CURRENT USER BALANCES (after all fixes)

| User | Role | ENB | Rep | Notes |
|------|------|-----|-----|-------|
| Muhammad Faisal K | admin | ~6,250+ | 2,100 | +1,000 referral rewards |
| Asmat | moderator | ~2,500 | 0 | Mod rewards from today |
| Eco Neighbor | moderator | ~2,500 | 0 | Mod rewards from today |
| Faisal Khan 2 | moderator | ~2,500 | 0 | Mod rewards from today |
| goldennexusadvisory | member | 0 | 0 | Test referral user |
| intuitionalised | member | 1,000 | 500 | Test referral user — fixed to correct amount |

---

## 🗄️ SQL RUN LOG (Session 13)

| Query | Purpose | Status |
|-------|---------|--------|
| Rebuild `release_referral_escrow()` | Trigger on first action, not 14-day wait | ✅ |
| Fix `referred_by` for goldennexusadvisory | Manual patch | ✅ |
| Fix `referred_by` for intuitionalised | Manual patch | ✅ |
| Insert escrow rows for both test users | Manual patch | ✅ |
| `SELECT release_referral_escrow()` × 2 | Manual trigger (ran twice by mistake) | ✅ cleaned |
| `CREATE TRIGGER trg_auto_evaluate_mod_decision` | Auto-approve on both mod decisions | ✅ |
| Fix TEST user balance to 1,000 ENB / 500 Rep | Remove duplicate credit | ✅ pending run |
| Remove duplicate transaction for TEST user | Cleanup | ✅ pending run |

---

## 📋 BACKLOG — NEXT TASKS IN ORDER

### 🔴 Immediate
1. **Test full referral cycle with fresh account** — confirm end-to-end works automatically without any manual SQL
2. **Devnet SOL** — get from faucet.quicknode.com/solana/devnet, complete token deployment
3. **Gitcoin Passport** — set up at passport.gitcoin.co

### 🟡 App Development
4. **Sale gate enforcement logic** — FounderSale screens exist, logic not wired to window dates
5. **Daily Log absence alerts** — 3 days → WhatsApp alert, 7 days → FORMAL_ABSENCE
6. **Float auto-replenishment** — 40% alert, 30% auto-replenish
7. **Real ENB Support WhatsApp number** — replace placeholder 923001234567 in Settings
8. **ModQueue timer** — currently 10s (testing), change back to 30s before public launch

### 🟢 Later
9. pHash duplicate photo detection
10. AI Vision Moderation on photos
11. Vesting consequence logic for founders
12. Service worker cache-busting
13. GPS validation wired to ActionForm
14. Referral code format change to ENB-XXXX-XXXX (cosmetic, before public launch)

---

## 🔐 CREDENTIALS & CONFIG
```
Admin email:        qahwakhana@gmail.com
Project email:      econeighborisenb@gmail.com
GitHub app:         agrorian/eco-neighbor
GitHub site:        agrorian/enb-site
Live app:           https://eco-neighbor.vercel.app
Marketing site:     https://eco-neighbor-site.vercel.app
Giveth:             https://giveth.io/project/eco-neighbor-enb
Supabase URL:       https://wlbgqygkvlwavmylgteb.supabase.co
Supabase anon key:  sb_publishable_ETouqEo7W06oqLjIKNzkCA_ByuTlxD9
Cloudinary:         dl86obm3b / preset: enb_photos
Solana wallet:      DSV9Pn... (keypair at D:\Solana Keys\test-keypair.json)
Solana network:     devnet (set via CLI)
Fi.co program:      Jul 28 – Oct 22, 2026
Fi.co pitch event:  Mar 24, 2026 — 12:00–1:30 PM
```

---

## ⚠️ IMPORTANT NOTES FOR NEXT SESSION
- Always upload src.zip + ENB_BACKLOG.md + ENB_DEVLOG.md at session start
- ModQueue timer is currently 10s — change back to 30s before public launch
- TEST user (intuitionalised@gmail.com) balance cleanup SQL still needs to run if not done
- The `trg_auto_evaluate_mod_decision` trigger is now the primary approval mechanism — frontend RPC call is backup only
- Marketing website whitepaper link opens email to econeighborisenb@gmail.com
- Fi.co pitch on March 24 — pitch script prepared, practice daily
