import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'

export const dynamic = 'force-dynamic'

const fmtBRL = v => (Number(v) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

function sbAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function authUser(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: 'Bearer ' + token } } }
  )
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

// Calcula metricas pro tenant baseado no tipo solicitado
async function buildPayload(sb, tenantId, type) {
  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const today00 = new Date(todayISO + 'T00:00:00Z').getTime()
  const day7 = today00 - 7 * 86400000
  const day30 = today00 - 30 * 86400000
  // Inicio do mes atual em SP (UTC-3): pega YYYY-MM-01 SP e converte pra UTC
  const spNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const monthStartSP = new Date(spNow.getFullYear(), spNow.getMonth(), 1, 0, 0, 0).getTime() + 3 * 3600000 // +3h pra UTC

  // Fetch base
  const [{ data: metas }, { data: rem }, { data: costs }, { data: ops }, { data: metodos }] = await Promise.all([
    sb.from('metas').select('id, status_fechamento, fechada_em, lucro_final, deleted_at, quantidade_contas, operator_id, rede').eq('tenant_id', tenantId),
    sb.from('remessas').select('id, lucro, prejuizo, resultado, deposito, saque, created_at, meta_id').limit(5000),
    sb.from('costs').select('amount, date').eq('tenant_id', tenantId),
    sb.from('profiles').select('id, nome').eq('tenant_id', tenantId).eq('role', 'operator'),
    sb.from('metodos_registros').select('valor, tipo, modalidade, created_at, deleted_at').eq('tenant_id', tenantId).is('deleted_at', null),
  ])
  const metasValid = (metas || []).filter(m => !m.deleted_at)
  const metaIds = new Set(metasValid.map(m => m.id))
  const remValid = (rem || []).filter(r => metaIds.has(r.meta_id))
  const fechadas = metasValid.filter(m => m.status_fechamento === 'fechada')

  function fechadasIn(start, end) {
    return fechadas.filter(m => {
      if (!m.fechada_em) return false
      const t = new Date(m.fechada_em).getTime()
      return t >= start && (!end || t < end)
    })
  }
  function metodosIn(start, end) {
    return (metodos || []).filter(m => {
      const t = new Date(m.created_at).getTime()
      return t >= start && (!end || t < end)
    })
  }
  function metodosLiquido(list) {
    return list.reduce((a, m) => a + Number(m.valor) * (m.tipo === 'lucro' ? 1 : -1), 0)
  }

  const tomorrow = today00 + 86400000

  if (type === 'lucro_hoje') {
    const cpa = fechadasIn(today00, tomorrow).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    const met = metodosLiquido(metodosIn(today00, tomorrow))
    const total = cpa + met
    const sign = total >= 0 ? '+' : '-'
    return {
      title: 'Lucro de hoje',
      body: '🚀 ' + sign + 'R$ ' + fmtBRL(Math.abs(total)),
      url: '/admin',
      value: total,
    }
  }
  if (type === 'lucro_semana') {
    const cpa = fechadasIn(day7).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    const met = metodosLiquido(metodosIn(day7))
    const total = cpa + met
    const sign = total >= 0 ? '+' : '-'
    return {
      title: 'Lucro da semana',
      body: '🚀 ' + sign + 'R$ ' + fmtBRL(Math.abs(total)),
      url: '/admin',
      value: total,
    }
  }
  if (type === 'lucro_mes') {
    const cpa = fechadasIn(day30).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    const met = metodosLiquido(metodosIn(day30))
    const total = cpa + met
    const sign = total >= 0 ? '+' : '-'
    return {
      title: 'Lucro do mes (ultimos 30d)',
      body: '🚀 ' + sign + 'R$ ' + fmtBRL(Math.abs(total)),
      url: '/admin',
      value: total,
    }
  }
  if (type === 'lucro_mes_atual') {
    const cpa = fechadasIn(monthStartSP).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    const met = metodosLiquido(metodosIn(monthStartSP))
    const total = cpa + met
    const sign = total >= 0 ? '+' : '-'
    return {
      title: 'Lucro do mes atual',
      body: '🚀 ' + sign + 'R$ ' + fmtBRL(Math.abs(total)),
      url: '/admin',
      value: total,
    }
  }
  if (type === 'top_operador') {
    const byOp = new Map()
    for (const m of fechadasIn(day7)) {
      if (!m.operator_id) continue
      byOp.set(m.operator_id, (byOp.get(m.operator_id) || 0) + Number(m.lucro_final || 0))
    }
    const sorted = [...byOp.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted[0]
    if (!top) return { title: 'Top operador (7d)', body: 'Sem dados', url: '/admin' }
    const opName = (ops || []).find(o => o.id === top[0])?.nome || '?'
    return {
      title: 'Top operador · ' + (opName.split(' ')[0]),
      body: '🚀 R$ ' + fmtBRL(top[1]),
      url: '/admin',
    }
  }
  if (type === 'top_rede') {
    const byRede = new Map()
    for (const m of fechadasIn(day7)) {
      const r = m.rede || 'Outras'
      byRede.set(r, (byRede.get(r) || 0) + Number(m.lucro_final || 0))
    }
    const sorted = [...byRede.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted[0]
    if (!top) return { title: 'Top rede (7d)', body: 'Sem dados', url: '/redes' }
    return {
      title: 'Top rede · ' + top[0],
      body: '🚀 R$ ' + fmtBRL(top[1]),
      url: '/redes',
    }
  }
  if (type === 'metas_ativas') {
    const ativas = metasValid.filter(m => (m.status_fechamento || 'aberta') !== 'fechada')
    return {
      title: 'Metas ativas',
      body: String(ativas.length),
      url: '/admin',
    }
  }
  if (type === 'saldo_geral') {
    const cpa = fechadas.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    const custos = (costs || []).reduce((a, c) => a + Number(c.amount || 0), 0)
    const met = metodosLiquido(metodos || [])
    const total = cpa + met - custos
    const sign = total >= 0 ? '+' : '-'
    return {
      title: 'Saldo geral',
      body: '🚀 ' + sign + 'R$ ' + fmtBRL(Math.abs(total)),
      url: '/admin',
    }
  }
  if (type === 'ultima_remessa') {
    const last = [...remValid].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    if (!last) return { title: 'Ultima remessa', body: 'Sem remessas', url: '/admin' }
    const resultado = Number(last.resultado || (Number(last.saque || 0) - Number(last.deposito || 0)))
    const sign = resultado >= 0 ? '+' : '-'
    return {
      title: 'Ultima remessa',
      body: '🚀 ' + sign + 'R$ ' + fmtBRL(Math.abs(resultado)),
      url: '/admin',
    }
  }
  return null
}

export async function POST(req) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, silent } = await req.json().catch(() => ({}))
  if (!type) return NextResponse.json({ error: 'type obrigatorio' }, { status: 400 })

  const sb = sbAdmin()
  const { data: prof } = await sb.from('profiles').select('tenant_id, role').eq('id', user.id).maybeSingle()
  if (!prof?.tenant_id) return NextResponse.json({ error: 'Sem tenant' }, { status: 404 })

  const payload = await buildPayload(sb, prof.tenant_id, type)
  if (!payload) return NextResponse.json({ error: 'Tipo nao reconhecido' }, { status: 400 })

  // Modo silent: usado pela voz — so calcula e retorna o valor, sem disparar push.
  if (silent) {
    return NextResponse.json({ ok: true, sent: 0, silent: true, payload })
  }

  const result = await sendPushToUser(sb, user.id, {
    ...payload,
    tag: 'self_' + type + '_' + Date.now(),
  })

  return NextResponse.json({ ok: true, sent: result?.sent || 0, payload })
}
