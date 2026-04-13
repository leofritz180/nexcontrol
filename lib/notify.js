// ═══════════════════════════════════════
// NexControl — Notification System
// Client-side dispatcher → Backend API
// ═══════════════════════════════════════

const fmt = v => Math.abs(Number(v||0)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

// ── Message Generator ──
function generateMessage(event, data) {
  switch (event) {
    case 'meta_created': {
      const nome = data.operador || 'Operador'
      return {
        title: `Op. ${nome} iniciou meta - ${data.contas||0} DEP na ${(data.rede||'rede').toUpperCase()}`,
        body: '',
      }
    }
    case 'remessa_created': {
      const pos = Number(data.resultado||0) >= 0
      const val = fmt(data.resultado)
      const nome = data.operador || 'Operador'
      return {
        title: `Op. ${nome} finalizou 1 remessa - ${pos?'Lucro':'Prejuízo'}: R$ ${val}`,
        body: '',
      }
    }
    case 'meta_closed': {
      const val = fmt(data.lucroFinal)
      const pos = Number(data.lucroFinal||0) >= 0
      return {
        title: `Meta encerrada - ${data.contas||0} DEP ${(data.rede||'').toUpperCase()} - ${pos?'Lucro':'Prejuízo'}: R$ ${val}`,
        body: '',
      }
    }
    default:
      return { title: data.body || 'NexControl', body: '' }
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
