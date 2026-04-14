import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'Eco-Neighbor <welcome@eco-neighbor.vercel.app>'
// Use your verified Resend sender — update this to your domain once set up
// For now using the Resend test sender format

interface WelcomeEmailPayload {
  to: string
  full_name: string
  neighbourhood: string
  profession: string
  referral_code?: string
}

function getFirstName(fullName: string): string {
  return fullName?.split(' ')[0] || fullName || 'Community Member'
}

function buildEmailHtml(payload: WelcomeEmailPayload): string {
  const firstName = getFirstName(payload.full_name)
  const appUrl = 'https://eco-neighbor.vercel.app'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Eco-Neighbor ($ENB)</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #F3F6F3; color: #1B2B1E; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #1A6B3C 0%, #00796B 100%); padding: 40px 32px; text-align: center; }
    .logo-circle { width: 70px; height: 70px; background: rgba(255,255,255,0.15); border-radius: 20px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 36px; line-height: 70px; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .tagline { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 8px; font-style: italic; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 22px; font-weight: 700; color: #1B2B1E; margin-bottom: 12px; }
    .intro { font-size: 15px; line-height: 1.7; color: #4D6352; margin-bottom: 28px; }
    .status-card { background: #F0F7F2; border: 1px solid #DDE8DE; border-radius: 16px; padding: 20px 24px; margin-bottom: 28px; }
    .status-card h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #1A6B3C; margin-bottom: 14px; }
    .status-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #DDE8DE; }
    .status-row:last-child { border-bottom: none; }
    .status-label { font-size: 13px; color: #4D6352; }
    .status-value { font-size: 13px; font-weight: 600; color: #1B2B1E; }
    .status-badge { background: #1A6B3C; color: white; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .section-title { font-size: 17px; font-weight: 700; color: #1B2B1E; margin-bottom: 16px; margin-top: 32px; padding-bottom: 8px; border-bottom: 2px solid #DDE8DE; }
    .step-list { list-style: none; margin-bottom: 28px; }
    .step-item { display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; border-bottom: 1px solid #F0F0F0; }
    .step-item:last-child { border-bottom: none; }
    .step-num { width: 32px; height: 32px; background: #1A6B3C; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .step-text { flex: 1; }
    .step-text strong { display: block; font-size: 14px; font-weight: 600; color: #1B2B1E; margin-bottom: 3px; }
    .step-text span { font-size: 13px; color: #4D6352; line-height: 1.5; }
    .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 28px; }
    .action-card { background: #F0F7F2; border: 1px solid #DDE8DE; border-radius: 12px; padding: 14px; }
    .action-card .emoji { font-size: 22px; margin-bottom: 6px; display: block; }
    .action-card strong { font-size: 13px; font-weight: 700; color: #1B2B1E; display: block; margin-bottom: 2px; }
    .action-card .enb { font-size: 12px; color: #1A6B3C; font-weight: 600; }
    .action-card .rep { font-size: 12px; color: #E08D00; font-weight: 600; margin-left: 6px; }
    .tier-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13px; }
    .tier-table th { background: #1B2B1E; color: white; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .tier-table td { padding: 10px 12px; border-bottom: 1px solid #F0F0F0; }
    .tier-table tr:last-child td { border-bottom: none; }
    .tier-table tr:nth-child(even) td { background: #F9F9F9; }
    .tier-name { font-weight: 600; }
    .benefit-box { background: #FFF8E1; border: 1px solid #F9A825; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; }
    .benefit-box h4 { font-size: 14px; font-weight: 700; color: #E08D00; margin-bottom: 10px; }
    .benefit-box ul { list-style: none; }
    .benefit-box li { font-size: 13px; color: #5D4037; padding: 4px 0; line-height: 1.5; }
    .benefit-box li::before { content: "✓ "; font-weight: 700; color: #F9A825; }
    .next-steps { background: #1A6B3C; border-radius: 16px; padding: 24px; margin-bottom: 28px; }
    .next-steps h3 { color: white; font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .next-step-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .next-step-item:last-child { margin-bottom: 0; }
    .check-circle { width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
    .next-step-text { color: rgba(255,255,255,0.9); font-size: 13px; line-height: 1.5; }
    .next-step-text strong { color: white; }
    .cta-button { display: block; background: #1A6B3C; color: white; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; margin: 28px 0; }
    .referral-box { background: #F0F7F2; border: 1px solid #1A6B3C; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; text-align: center; }
    .referral-box p { font-size: 13px; color: #4D6352; margin-bottom: 8px; }
    .referral-code { font-size: 20px; font-weight: 700; color: #1A6B3C; font-family: monospace; letter-spacing: 0.1em; background: white; padding: 8px 20px; border-radius: 8px; border: 1px dashed #1A6B3C; display: inline-block; margin: 8px 0; }
    .referral-earn { font-size: 12px; color: #4D6352; }
    .footer { background: #1B2B1E; padding: 28px 32px; text-align: center; }
    .footer p { color: rgba(255,255,255,0.5); font-size: 12px; line-height: 1.8; }
    .footer a { color: rgba(255,255,255,0.7); text-decoration: none; }
    .footer .tagline-ur { color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 12px; direction: rtl; }
    @media (max-width: 480px) {
      .body { padding: 24px 20px; }
      .header { padding: 28px 20px; }
      .action-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="wrapper">

  <!-- Header -->
  <div class="header">
    <div class="logo-circle">🌿</div>
    <h1>Welcome to Eco-Neighbor</h1>
    <p>$ENB · Community Utility Token · Rawalpindi</p>
    <p class="tagline">Your Neighborhood Work Has Value!</p>
  </div>

  <div class="body">

    <!-- Greeting -->
    <p class="greeting">السلام علیکم, ${firstName}! 👋</p>
    <p class="intro">
      You've just joined something genuinely new — a community where your daily civic work 
      earns you real, spendable tokens. Whether you clean a street, plant a tree, share food 
      with a neighbour, or teach a skill: <strong>Eco-Neighbor sees it, verifies it, and rewards 
      you for it</strong> with ENB tokens you can spend at local partner businesses.
      <br/><br/>
      This email is your orientation guide. Read it once — it will answer most of your questions.
    </p>

    <!-- Current Status Card -->
    <div class="status-card">
      <h3>📋 Your Account Status</h3>
      <div class="status-row">
        <span class="status-label">Name</span>
        <span class="status-value">${payload.full_name}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Neighbourhood</span>
        <span class="status-value">${payload.neighbourhood}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Profession</span>
        <span class="status-value">${payload.profession}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Current Tier</span>
        <span class="status-badge">🌱 Newcomer</span>
      </div>
      <div class="status-row">
        <span class="status-label">ENB.LOCAL Balance</span>
        <span class="status-value">0 ENB (start earning today)</span>
      </div>
      <div class="status-row">
        <span class="status-label">Rep Score</span>
        <span class="status-value">0 Rep (grows with every verified action)</span>
      </div>
    </div>

    <!-- How to Earn -->
    <p class="section-title">💰 How You Earn ENB</p>
    <ol class="step-list">
      <li class="step-item">
        <span class="step-num">1</span>
        <div class="step-text">
          <strong>Do a community action</strong>
          <span>Clean a street, plant a tree, share food, teach a skill, report illegal dumping — any of 10 verified civic action types.</span>
        </div>
      </li>
      <li class="step-item">
        <span class="step-num">2</span>
        <div class="step-text">
          <strong>Submit with live photo + GPS</strong>
          <span>Open the app, tap "Submit Action", take a live photo, let the app capture your GPS location. Takes 2 minutes.</span>
        </div>
      </li>
      <li class="step-item">
        <span class="step-num">3</span>
        <div class="step-text">
          <strong>Moderators verify your submission</strong>
          <span>Two independent community moderators review your submission. Usually approved within 24 hours.</span>
        </div>
      </li>
      <li class="step-item">
        <span class="step-num">4</span>
        <div class="step-text">
          <strong>ENB credited to your wallet instantly</strong>
          <span>Tokens appear in your wallet the moment your action is approved. You'll see them in "My Wallet" in the app.</span>
        </div>
      </li>
    </ol>

    <!-- Action Types -->
    <p class="section-title">🏆 What Actions Earn the Most</p>
    <div class="action-grid">
      <div class="action-card">
        <span class="emoji">🌳</span>
        <strong>Tree Planting</strong>
        <span class="enb">+2,000 ENB</span><span class="rep">+1,200 Rep</span>
      </div>
      <div class="action-card">
        <span class="emoji">👨‍🏫</span>
        <strong>Youth Mentoring</strong>
        <span class="enb">+2,000 ENB</span><span class="rep">+1,500 Rep</span>
      </div>
      <div class="action-card">
        <span class="emoji">🛠️</span>
        <strong>Skill Workshop</strong>
        <span class="enb">+1,500 ENB</span><span class="rep">+1,000 Rep</span>
      </div>
      <div class="action-card">
        <span class="emoji">🧹</span>
        <strong>Neighbourhood Cleanup</strong>
        <span class="enb">+1,000 ENB</span><span class="rep">+500 Rep</span>
      </div>
      <div class="action-card">
        <span class="emoji">🍱</span>
        <strong>Food Sharing</strong>
        <span class="enb">+800 ENB</span><span class="rep">+300 Rep</span>
      </div>
      <div class="action-card">
        <span class="emoji">♻️</span>
        <strong>Recycling Drop-off</strong>
        <span class="enb">+500 ENB</span><span class="rep">+200 Rep</span>
      </div>
    </div>

    <!-- Where to Spend -->
    <div class="benefit-box">
      <h4>🏪 Where You Can Spend Your ENB</h4>
      <ul>
        <li>Local dhabas and tea stalls — discounts on meals and chai</li>
        <li>Grocery shops — reduced prices on daily essentials</li>
        <li>Pharmacies — medicine discounts for you and your family</li>
        <li>Auto mechanics and repair shops</li>
        <li>Any business in our growing partner directory</li>
      </ul>
      <p style="font-size:12px; color:#4D6352; margin-top:10px;">
        1,000 ENB = 1 roti + 1 paratha + 1 cup of chai — this is our community anchor price.
      </p>
    </div>

    <!-- Tier Progression -->
    <p class="section-title">📈 Your Growth in the Ecosystem</p>
    <p style="font-size:13px; color:#4D6352; margin-bottom:16px; line-height:1.6;">
      Every action you take builds your <strong>Rep Score</strong> — your community standing. 
      Higher Rep unlocks more privileges, bigger bonuses, and eventually governance rights. 
      This is directly connected to how frequently and consistently you participate.
    </p>
    <table class="tier-table">
      <thead>
        <tr>
          <th>Tier</th>
          <th>Rep Score</th>
          <th>What You Unlock</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="tier-name">🌱 Newcomer</td>
          <td>0 – 4,999</td>
          <td>Earn ENB, spend at partner businesses</td>
        </tr>
        <tr>
          <td class="tier-name">🌿 Helper</td>
          <td>5,000+</td>
          <td>Verified directory listing + 2,500 ENB bonus milestone reward</td>
        </tr>
        <tr>
          <td class="tier-name">🌳 Guardian</td>
          <td>20,000+</td>
          <td>Vouch for new members + 5,000 ENB bonus milestone reward</td>
        </tr>
        <tr>
          <td class="tier-name">⭐ Pillar</td>
          <td>50,000+</td>
          <td>Governance voting + Maturation Bridge eligible + 7,500 ENB bonus</td>
        </tr>
        <tr>
          <td class="tier-name">🏆 Founder Tier</td>
          <td>100,000+</td>
          <td>DAO seat + Co-governance + 10,000 ENB milestone bonus</td>
        </tr>
      </tbody>
    </table>

    <!-- Referral -->
    ${payload.referral_code ? `
    <div class="referral-box">
      <p><strong>🤝 Your Personal Referral Code</strong></p>
      <div class="referral-code">${payload.referral_code}</div>
      <p class="referral-earn">Share this code — earn <strong>500 ENB</strong> for every friend who joins and completes their first verified action.</p>
      <p style="font-size:11px; color:#888; margin-top:8px;">
        Referral link: ${appUrl}/signup/step1?ref=${payload.referral_code}
      </p>
    </div>
    ` : ''}

    <!-- Next Steps -->
    <div class="next-steps">
      <h3>✅ Your Next Steps</h3>
      <div class="next-step-item">
        <span class="check-circle">1</span>
        <span class="next-step-text"><strong>Submit your first action today</strong> — even a small neighbourhood cleanup counts. The sooner you start, the sooner you earn.</span>
      </div>
      <div class="next-step-item">
        <span class="check-circle">2</span>
        <span class="next-step-text"><strong>Complete your CNIC verification</strong> — go to your dashboard and submit your CNIC to secure your account and unlock full trust status.</span>
      </div>
      <div class="next-step-item">
        <span class="check-circle">3</span>
        <span class="next-step-text"><strong>Explore the Business Directory</strong> — see which local businesses already accept ENB and plan your first redemption.</span>
      </div>
      <div class="next-step-item">
        <span class="check-circle">4</span>
        <span class="next-step-text"><strong>Share your referral code</strong> — every friend you bring earns you 500 ENB when they complete their first verified action.</span>
      </div>
      <div class="next-step-item">
        <span class="check-circle">5</span>
        <span class="next-step-text"><strong>Keep showing up</strong> — your Rep Score compounds. Consistent monthly actions are the fastest path from Newcomer to Helper to Guardian.</span>
      </div>
    </div>

    <!-- CTA -->
    <a href="${appUrl}" class="cta-button">Open Eco-Neighbor App →</a>

    <!-- Important Notes -->
    <p style="font-size:13px; color:#4D6352; line-height:1.7; margin-bottom:20px;">
      <strong>Important things to know:</strong><br/>
      • ENB.LOCAL tokens are <strong>non-transferable and non-sellable</strong> — they exist only within the local economy. This protects the community from speculation.<br/>
      • Your Rep Score can never be bought — only earned through verified civic work.<br/>
      • Photo submissions must be live camera captures — gallery uploads are not accepted.<br/>
      • If your submission is rejected, you'll receive a reason and can resubmit with better evidence.
    </p>

    <p style="font-size:13px; color:#888; line-height:1.7;">
      Questions? Simply reply to this email or visit the app and use the bug report button. 
      We read every message personally.<br/><br/>
      — Muhammad Faisal Khan<br/>
      <em>Visionary Founder, Eco-Neighbor ($ENB)</em><br/>
      Rawalpindi, Pakistan
    </p>

  </div>

  <!-- Footer -->
  <div class="footer">
    <p class="tagline-ur">آپ کی محنت کی قدر ہے</p>
    <p>
      Eco-Neighbor ($ENB) · Starting in Rawalpindi, built to replicate globally<br/>
      <a href="${appUrl}">eco-neighbor.vercel.app</a> · 
      <a href="https://giveth.io/project/eco-neighbor-enb">Giveth</a> · 
      <a href="https://x.com/econeighbor_enb">Twitter</a><br/><br/>
      ENB tokens are community utility tokens, not securities or investments.<br/>
      You received this because you created an Eco-Neighbor account.
    </p>
  </div>

</div>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const payload: WelcomeEmailPayload = await req.json()

    if (!payload.to || !payload.full_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const htmlContent = buildEmailHtml(payload)
    const firstName = getFirstName(payload.full_name)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [payload.to],
        subject: `Welcome to Eco-Neighbor, ${firstName}! 🌿 Here's everything you need to know`,
        html: htmlContent,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      return new Response(JSON.stringify({ error: data }), { status: res.status })
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
