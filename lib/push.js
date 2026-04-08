// Server-side push utilities — use in API routes only
import webpush from 'web-push'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:contato@nexcontrol.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
}

// Send push to a single subscription object
export async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, expired: true, endpoint: subscription.endpoint }
    }
    return { success: false, error: err.message }
  }
}

// Send push to all subscriptions of a user
export async function sendPushToUser(supabaseAdmin, userId, payload) {
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions').select('*').eq('user_id', userId)
  if (!subs?.length) return { sent: 0 }

  let sent = 0
  for (const sub of subs) {
    const result = await sendPush(sub, payload)
    if (result.success) sent++
    if (result.expired) {
      await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
    }
  }
  return { sent }
}

// Send push to admins of a tenant only
export async function sendPushToTenant(supabaseAdmin, tenantId, payload) {
  // Get admin user IDs for this tenant
  const { data: admins } = await supabaseAdmin
    .from('profiles').select('id').eq('tenant_id', tenantId).eq('role', 'admin')
  const adminIds = (admins || []).map(a => a.id)
  if (!adminIds.length) return { sent: 0 }

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions').select('*').eq('tenant_id', tenantId).in('user_id', adminIds)
  if (!subs?.length) return { sent: 0 }

  let sent = 0
  for (const sub of subs) {
    const result = await sendPush(sub, payload)
    if (result.success) sent++
    if (result.expired) {
      await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
    }
  }
  return { sent }
}
