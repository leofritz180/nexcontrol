// ─────────────────────────────────────────────────────────────────────────
// Service worker — envia os depositos pro NexControl usando a CHAVE DE CAPTURA
// do config.js (sem login por perfil/aba). Com host_permissions, o fetch
// cross-origin funciona sem CORS.
// ─────────────────────────────────────────────────────────────────────────
import { CAPTURE_KEY, API_BASE } from './config.js'

async function ingest(order_id, valor, casa, tipo) {
  if (!CAPTURE_KEY) return { ok: false, error: 'no_key' }
  const r = await fetch(`${API_BASE}/api/deposit-capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-capture-key': CAPTURE_KEY },
    body: JSON.stringify({ action: 'ingest', order_id, valor, casa, tipo: tipo || 'deposito' }),
  })
  return r.json().catch(() => ({ ok: false }))
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'deposit') {
        const res = await ingest(msg.order_id, msg.valor, msg.casa, msg.tipo)
        if (res && res.count != null) {
          chrome.action.setBadgeText({ text: String(res.count) })
          chrome.action.setBadgeBackgroundColor({ color: '#10b981' })
        }
        sendResponse(res)
      } else if (msg.type === 'status') {
        sendResponse({ ok: true, hasKey: !!CAPTURE_KEY })
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || 'erro' })
    }
  })()
  return true
})
