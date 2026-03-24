import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ACTION_LABELS: Record<string, string> = {
  neighbourhood_cleanup: 'Neighbourhood Cleanup',
  recycling_dropoff: 'Recycling Drop-off',
  waste_reporting: 'Waste Reporting',
  infrastructure_report: 'Infrastructure Report',
  trade_job: 'Trade Job',
  tree_planting: 'Tree Planting',
  carpool: 'Carpool',
  skill_workshop: 'Skill Workshop',
  food_sharing: 'Food Sharing',
  water_reporting: 'Water Reporting',
}

serve(async (req) => {
  try {
    const payload = await req.json()
    
    // Only handle INSERT events on moderator_assignments
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
    }

    const assignment = payload.record
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch submission details
    const { data: submission } = await supabase
      .from('submissions')
      .select('action_type, description, gps_address, gps_lat, gps_lng, submitted_at, photo_urls')
      .eq('id', assignment.submission_id)
      .single()

    if (!submission) {
      return new Response(JSON.stringify({ ok: false, error: 'Submission not found' }), { status: 200 })
    }

    // Fetch submitter info
    const { data: submitter } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', (await supabase.from('submissions').select('user_id').eq('id', assignment.submission_id).single()).data?.user_id)
      .single()

    // Fetch mod emails
    const modIds = [assignment.mod1_id, assignment.mod2_id].filter(Boolean)
    const { data: mods } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', modIds)

    if (!mods || mods.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'No mods found' }), { status: 200 })
    }

    const actionLabel = ACTION_LABELS[submission.action_type] || submission.action_type.replace(/_/g, ' ')
    const submittedAt = new Date(submission.submitted_at).toLocaleString('en-PK', {
      timeZone: 'Asia/Karachi',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    const gpsLink = submission.gps_lat && submission.gps_lng
      ? `https://maps.google.com/?q=${submission.gps_lat},${submission.gps_lng}`
      : null
    const location = submission.gps_address || (gpsLink ? `${submission.gps_lat}, ${submission.gps_lng}` : 'Not recorded')

    // Send email to each mod
    const emailPromises = mods.map(async (mod) => {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 580px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: #1A6B3C; padding: 24px 28px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="background: #F9A825; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-weight: bold; font-size: 18px;">🌿</span>
        </div>
        <div>
          <h1 style="color: white; margin: 0; font-size: 18px;">Eco-Neighbor</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">Moderation Required</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding: 28px;">
      <p style="color: #333; font-size: 15px; margin-top: 0;">Hi <strong>${mod.full_name || mod.email}</strong>,</p>
      <p style="color: #555; font-size: 14px;">A new civic action has been submitted and assigned to you for review.</p>

      <!-- Submission card -->
      <div style="background: #f8fdf9; border: 1px solid #d4edda; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #888; font-size: 12px; width: 120px; vertical-align: top;">ACTION TYPE</td>
            <td style="padding: 6px 0; color: #1A6B3C; font-weight: bold; font-size: 14px;">${actionLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888; font-size: 12px; vertical-align: top;">SUBMITTED BY</td>
            <td style="padding: 6px 0; color: #333; font-size: 13px;">${submitter?.full_name || 'Unknown'} (${submitter?.email || ''})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888; font-size: 12px; vertical-align: top;">DATE & TIME</td>
            <td style="padding: 6px 0; color: #333; font-size: 13px;">${submittedAt} PKT</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888; font-size: 12px; vertical-align: top;">LOCATION</td>
            <td style="padding: 6px 0; color: #333; font-size: 13px;">
              ${gpsLink ? `<a href="${gpsLink}" style="color: #1A6B3C;">${location}</a>` : location}
            </td>
          </tr>
          ${submission.description ? `
          <tr>
            <td style="padding: 6px 0; color: #888; font-size: 12px; vertical-align: top;">DESCRIPTION</td>
            <td style="padding: 6px 0; color: #333; font-size: 13px;">${submission.description.substring(0, 200)}${submission.description.length > 200 ? '...' : ''}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Photo preview -->
      ${submission.photo_urls?.[0] ? `
      <p style="color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">PHOTO PROOF</p>
      <img src="${submission.photo_urls[0]}" alt="Submission photo" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; border: 1px solid #e0e0e0;" />
      ` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin: 24px 0 8px;">
        <a href="https://eco-neighbor.vercel.app/mod-queue" 
           style="background: #1A6B3C; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
          Review in Mod Queue →
        </a>
      </div>

      <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 16px;">
        You are receiving this because you are an active moderator on Eco-Neighbor.<br>
        Please review within 24 hours. Both moderators must decide before the submission is processed.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #1A6B3C; padding: 14px 28px; text-align: center;">
      <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 0;">
        Eco-Neighbor Token · eco-neighbor.vercel.app · Chaklala Scheme 3, Rawalpindi
      </p>
    </div>
  </div>
</body>
</html>`

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Eco-Neighbor <onboarding@resend.dev>',
          to: [mod.email],
          subject: `[ENB] New Action Assigned — ${actionLabel}`,
          html,
        }),
      })

      const result = await response.json()
      return { mod: mod.email, status: response.status, result }
    })

    const results = await Promise.all(emailPromises)
    
    return new Response(
      JSON.stringify({ ok: true, emails_sent: results.length, results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500 }
    )
  }
})
