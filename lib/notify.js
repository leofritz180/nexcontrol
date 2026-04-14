// ═══════════════════════════════════════
// NexControl — Notification System
// Client-side dispatcher → Backend API
// ═══════════════════════════════════════

const fmt = v => Math.abs(Number(v||0)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

// ── Message Generator ──
function generateMessage(event, data) {
  switch (event) {
    case 'meta_created': {
      const raw = data.operador || 'Operador'
      const nome = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
      return {
        title: 'Nova meta!',
        body: `${nome} iniciou ${data.contas||0} DEP na ${(data.rede||'rede').toUpperCase()}`,
      }
    }
    case 'remessa_created': {
      const pos = Number(data.resultado||0) >= 0
      const val = fmt(data.resultado)
      const raw = data.operador || 'Operador'
      const nome = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
      return {
        title: 'Remessa registrada!',
        body: `${nome} finalizou 1 remessa - Resultado: ${pos?'+':'-'}R$ ${val}`,
      }
    }
    case 'meta_closed': {
      const val = fmt(data.lucroFinal)
      const pos = Number(data.lucroFinal||0) >= 0
      return {
        title: 'Meta finalizada!',
        body: `${data.contas||0} DEP ${(data.rede||'').toUpperCase()} encerrada - Resultado: ${pos?'+':'-'}R$ ${val}`,
      }
    }
    default:
      return { title: 'NexControl', body: data.body || '' }
  }
}

// ── Dispatcher — sends to backend API ──
async function dispatch(tenantId, event, data) {
  if (!tenantId) return
  const { title, body } = generateMessage(event, data)
  try {
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, title, body, url: data.url || '/admin' }),
    })
    const json = await res.json()
    console.log('[Push]', event, '→', json)
  } catch (e) {
    // Silent fail
  }
}

// ── Public API ──

export function notifyMetaCreated(tenantId, operador, contas, rede) {
  return dispatch(tenantId, 'meta_created', { operador, contas, rede })
}

export function notifyRemessaCreated(tenantId, operador, rede, resultado) {
  return dispatch(tenantId, 'remessa_created', { operador, rede, resultado })
}

export function notifyMetaClosed(tenantId, contas, rede, lucroFinal) {
  return dispatch(tenantId, 'meta_closed', { contas, rede, lucroFinal })
}
