// ─────────────────────────────────────────────────────────────────────────
// Service worker — guarda o login (token) e envia os depositos pro NexControl.
// Com host_permissions, o fetch cross-origin funciona sem CORS.
// ─────────────────────────────────────────────────────────────────────────
import { SUPABASE_URL, SUPABASE_ANON, API_BASE } from './config.js'

async function getStored() {
  return new Promise(r => chrome.storage.local.get(['auth'], d => r(d.auth || null)))
}
async function setStored(auth) {
  return new Promise(r => chrome.storage.local.set({ auth }, r))
}

// Login por email/senha (Supabase password grant)
async function login(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON },
    body: JSON.stringify({ email, password }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j.access_token) return { ok: false, error: j.error_description || j.msg || 'Login falhou' }
  const auth = {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + (j.expires_in || 3600) * 1000,
    email: j.user?.email || email,
  }
  await setStored(auth)
  return { ok: true, email: auth.email }
}

async function refresh(auth) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON },
    body: JSON.stringify({ refresh_token: auth.refresh_token }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j.access_token) return null
  const next = { ...auth, access_token: j.access_token, refresh_token: j.refresh_token || auth.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000 }
  await setStored(next)
  return next
}

async function validToken() {
  let auth = await getStored()
  if (!auth) return null
  if (Date.now() > auth.expires_at - 60000) auth = await refresh(auth)
  return auth
}

async function ingest(order_id, valor, casa) {
  const auth = await validToken()
  if (!auth) return { ok: false, error: 'not_logged_in' }
  const r = await fetch(`${API_BASE}/api/deposit-capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.access_token },
    body: JSON.stringify({ action: 'ingest', order_id, valor, casa }),
  })
  return r.json().catch(() => ({ ok: false }))
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'deposit') {
        const res = await ingest(msg.order_id, msg.valor, msg.casa)
        // badge com o nº de depositos da sessao (feedback visual)
        if (res && res.count != null) {
          chrome.action.setBadgeText({ text: String(res.count) })
          chrome.action.setBadgeBackgroundColor({ color: '#10b981' })
        }
        sendResponse(res)
      } else if (msg.type === 'login') {
        sendResponse(await login(msg.email, msg.password))
      } else if (msg.type === 'logout') {
        await setStored(null); chrome.action.setBadgeText({ text: '' }); sendResponse({ ok: true })
      } else if (msg.type === 'status') {
        const auth = await getStored(); sendResponse({ ok: true, email: auth?.email || null })
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || 'erro' })
    }
  })()
  return true // resposta assincrona
})
