# 🌿 Eco-Neighbor Token (ENB)
### A Hyper-Local Circular Economy on Solana — Built for Rawalpindi, Pakistan

[![Live App](https://img.shields.io/badge/Live%20App-eco--neighbor.vercel.app-1A6B3C?style=for-the-badge)](https://eco-neighbor.vercel.app)
[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=for-the-badge&logo=solana)](https://solana.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## What is ENB?

Eco-Neighbor Token (ENB) rewards street vendors, daily-wage workers, tradespeople, and community volunteers in **Chaklala Scheme 3, Rawalpindi** for verified civic and ecological actions — using blockchain to build a circular local economy where good deeds earn real value.

> *"A rickshaw driver who cleans the street in front of his stand earns ENB. A vegetable vendor who separates her waste earns ENB. A volunteer who plants a tree earns ENB. They spend it at partner businesses. The economy rewards what matters."*

---

## The Problem

Pakistan's informal economy employs over 70% of the workforce. These workers receive no recognition, no benefits, and no financial tools for the civic contributions they make daily. Blockchain solutions exist but are inaccessible — complex wallets, gas fees, and English-only interfaces create walls that exclude exactly the people they claim to serve.

---

## The Solution

ENB uses a **Web2.5 approach** — email login, no seed phrases, no gas fees for end users — to make blockchain participation as simple as signing up with an email address.

### How it works:
1. A community member submits a civic action (waste collection, tree planting, neighbourhood clean-up) with a live photo and GPS location
2. Two independent moderators blindly review and verify the submission
3. On approval, **ENB.LOCAL tokens** are automatically credited to the member's wallet
4. Tokens are spent at verified local partner businesses for real goods and services
5. Businesses redeem tokens back to the Community Rewards Pool via QR code

---

## Token Design

| Token | Type | Purpose |
|-------|------|---------|
| **ENB.LOCAL** | Non-transferable, whole numbers | Earned via verified civic actions, spent at partner businesses |
| **ENB.GLOBAL** | Freely tradeable on Raydium DEX | Accessible only via Maturation Bridge (365-day hold + 50,000 Rep Score) |

**Total Supply:** 10 Billion ENB (9 decimals, Solana SPL Token-2022)

**ENB-CSU Basket:** 1,000 ENB.LOCAL = roti + paratha + 1 cup of chai at partner businesses

---

## Key Features

### For Community Members
- 📱 Submit civic actions with live camera, GPS, and bilingual CAPTCHA
- 🪙 Earn ENB.LOCAL tokens for verified contributions
- 🏪 Redeem tokens at partner businesses via QR code
- 📊 Track reputation score, tier progression, and full history
- 🤝 Refer neighbours and earn referral rewards

### For Partner Businesses
- 📲 Scan member QR codes to accept ENB.LOCAL
- 📈 Monitor float balance with auto-replenishment alerts
- 🗺️ Listed on interactive community map

### For Moderators
- 🔍 Blind dual-review system — moderators never see each other's decisions
- ⏱️ 30-second minimum review timer (rubber-stamp prevention)
- 🔄 Automatic pair rotation (same 2 mods never assigned consecutively)
- ⚖️ Escalation queue for disagreements — admin makes final call
- 🚨 Statistical collusion detection — pairs with ≥80% agreement flagged

### For Admins
- 👥 Full user management with role assignment and airdrops
- 📋 Submission queue with fraud protection layers
- 📣 Campaign manager with multiplier bonuses
- 🏪 Partner onboarding and float management
- 📊 Mod agreement analytics and collusion watch

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, shadcn/ui |
| State | Zustand, React Router 7 |
| Backend | Supabase (PostgreSQL + Auth + RPC functions) |
| Storage | Cloudinary (live photo uploads) |
| Blockchain | Solana SPL Token-2022, Raydium DEX |
| Auth | Email + Password (no magic links, no seed phrases) |
| Maps | Leaflet.js (OpenStreetMap) |
| Deployment | Vercel (auto-deploy from GitHub) |

---

## Fraud Prevention

ENB has multiple layers of submission fraud prevention:

- **Live camera only** — gallery uploads blocked
- **GPS cross-check** — location verified against registered neighbourhood
- **Bilingual CAPTCHA** — 15-question pool (Urdu + English), randomised answer positions
- **Blind dual moderation** — two independent mods, neither sees the other's decision
- **Report system** — community whistleblowing with 200 ENB stake, 24-hour reward cooldown, mod clawback on confirmed fraud
- **Airdrop caps** — 2,000 ENB max per airdrop, 5,000 ENB/month per user, full audit log
- **Sybil detection** — same-account, referral relationship, and proximity checks

---

## Reputation Tiers

| Tier | Rep Score Required |
|------|-------------------|
| 🌱 Newcomer | 0 |
| 🌿 Helper | 5,000 |
| 🌳 Guardian | 20,000 |
| ⭐ Pillar | 50,000 |
| 🏆 Founder | 100,000 |

---

## Maturation Bridge

Members who hold ENB.LOCAL for 365 days continuously AND reach Pillar tier (50,000 Rep) may convert up to 20% of their lifetime earned balance to **ENB.GLOBAL** — the freely tradeable Solana token — subject to community governance vote for batches over 500,000 ENB.

---

## Project Status

🟢 **Live** at [eco-neighbor.vercel.app](https://eco-neighbor.vercel.app)

Currently in **pilot phase** — Chaklala Scheme 3, Rawalpindi, Pakistan

| Milestone | Status |
|-----------|--------|
| Web app (full submission cycle) | ✅ Complete |
| Dual moderator blind review | ✅ Complete |
| Partner business directory + map | ✅ Complete |
| Fraud protection system | ✅ Complete |
| Responsibility Dashboard | ✅ Complete |
| Maturation Bridge UI | ✅ Complete |
| Solana SPL Token deployment | 🔄 In Progress |
| Carbon credit methodology (Verra VCS) | 🔄 In Progress |
| Chaklala Scheme 3 on-ground pilot | 🔄 Recruiting |

---

## Funding

ENB is seeking public goods funding to scale the Chaklala Scheme 3 pilot to all of Rawalpindi.

- 🌱 **Giveth.io** — [View our project](https://giveth.io)
- 🌍 **GreenPill Network** — Impact-aligned regenerative funding
- 🇵🇰 **Pakistan Startup Fund** — Non-equity government grant
- 🌿 **Verra VCS** — Carbon credit revenue stream (methodology in development)

> ENB is framed as a public goods / impact initiative — not speculative crypto. All token allocations have a 365-day vesting cliff with no exceptions.

---

## Whitepaper

ENB Whitepaper v4.7 is available on request. It covers tokenomics, governance, carbon credit methodology, founding member obligations, vesting schedules, and the Compound Failure risk framework.

---

## Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
#          VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET

# Run locally
npm run dev
```

---

## Contributing

ENB is open source. Community contributions are welcome — especially from developers in Pakistan who understand the local context.

See `ENB_BACKLOG.md` for the current development roadmap and `ENB_DEVLOG.md` for the full session-by-session development history.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contact

**Muhammad Faisal K** — Visionary Founder  
📧 qahwakhana@gmail.com  
🌐 [eco-neighbor.vercel.app](https://eco-neighbor.vercel.app)  
💬 WhatsApp community available on request

---

*Built with ❤️ for the people of Rawalpindi — one verified civic action at a time.*
