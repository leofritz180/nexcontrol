import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToTenant } from '../../../../lib/push'

// Call daily via Vercel Cron or external scheduler
// GET /api/cron/trial-notifications?secret=YOUR_SECRET

export async function GET(req) {
  // Simple auth
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET && secret !== process.env.ASAAS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const today = new Date().toISOString().slice(0, 10)
  let sent = 0, expired = 0

  // Get all tenants in trial
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id,name,trial_end,subscription_status,last_trial_notif_date,trial_expired_notified')
    .eq('subscription_status', 'trial')

  if (!tenants?.length) return NextResponse.json({ sent: 0, expired: 0, msg: 'No trials' })

  const now = new Date()

  for (const t of tenants) {
    const trialEnd = new Date(t.trial_end)
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))

    // Skip if already notified today
    if (t.last_trial_notif_date === today) continue

    if (daysLeft > 0) {
      // Trial active — send daily reminder
      let title, body

      if (daysLeft >= 3) {
        title = 'NexControl'
        body = `Teste grátis ativo - ${daysLeft} dias restantes`
      } else if (daysLeft >= 2) {
        title = 'NexControl'
        body = `Seu teste acaba em ${daysLeft} dias - escolha um plano`
      } else {
        title = 'NexControl'
        body = 'Último dia grátis - assine para não perder acesso'
      }

      await sendPushToTenant(supabase, t.id, { title, body, url: '/billing' })
      await supabase.from('tenants').update({ last_trial_notif_date: today }).eq('id', t.id)
      sent++

    } else if (!t.trial_expired_notified) {
      // Trial expired — send expiration notice + update status
      await sendPushToTenant(supabase, t.id, {
        title: 'NexControl',
        body: 'Teste expirado - assine para continuar usando o NexControl',
        url: '/billing',
      })

      await supabase.from('tenants').update({
        last_trial_notif_date: today,
        trial_expired_notified: true,
      }).eq('id', t.id)

      expired++
    }
  }

  return NextResponse.json({ sent, expired, total: tenants.length })
}
