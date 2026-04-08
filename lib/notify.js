// Client-side notification helper — call after important actions
// Sends push to admin of the tenant via API route

export async function notifyAdmin(tenantId, { title, body, url }) {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, title, body, url: url || '/admin' }),
    })
  } catch (e) {
    // Silent fail — push is non-critical
  }
}

export function notifyMetaCreated(tenantId, operadorNome, metaTitulo, rede) {
  return notifyAdmin(tenantId, {
    title: 'Nova meta criada',
    body: `${operadorNome} criou "${metaTitulo}" na rede ${rede}`,
    url: '/admin',
  })
}

export function notifyRemessaCreated(tenantId, operadorNome, rede, resultado) {
  const pos = resultado >= 0
  const val = Math.abs(resultado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  return notifyAdmin(tenantId, {
    title: pos ? `Remessa +R$ ${val}` : `Remessa -R$ ${val}`,
    body: `${operadorNome} · ${rede} · ${pos ? 'Lucro' : 'Prejuizo'}: R$ ${val}`,
    url: '/admin',
  })
}

export function notifyMetaFinalized(tenantId, operadorNome, metaTitulo) {
  return notifyAdmin(tenantId, {
    title: 'Meta finalizada',
    body: `${operadorNome} finalizou "${metaTitulo}"`,
    url: '/admin',
  })
}

export function notifyMetaClosed(tenantId, metaTitulo, lucroFinal) {
  const val = Math.abs(lucroFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  return notifyAdmin(tenantId, {
    title: `Meta fechada: +R$ ${val}`,
    body: `"${metaTitulo}" encerrada com lucro final de R$ ${val}`,
    url: '/admin',
  })
}
