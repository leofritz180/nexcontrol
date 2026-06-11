import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/data-correction/get?user_id=XXX
// Retorna a correcao de BAU pendente do tenant do admin (opt-in).
// Bug: ao EDITAR remessa o bau nao somava no resultado. Aqui detectamos as
// remessas afetadas e a diferenca a favor do cliente. Nada e' alterado aqui.

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

export async function scanTenant(s, tenantId) {
  let all = [], from = 0
  for (;;) {
    const { data } = await s.from('remessas')
      .select('id,meta_id,deposito,saque,bau,resultado,contas_remessa')
      .eq('tenant_id', tenantId).gt('bau', 0).range(from, from + 999)
    if (!data || !data.length) break
    all = all.concat(data)
    if (data.length < 1000) break
    from += 1000
  }
  const bad = all.filter(r => {
    const esp = Number(((Number(r.saque || 0) - Number(r.deposito || 0)) + Number(r.bau || 0)).toFixed(2))
    return Math.abs(Number(r.resultado || 0) - esp) > 0.01
  })
  let delta = 0
  bad.forEach(r => {
    const novo = Number(((Number(r.saque) - Number(r.deposito)) + Number(r.bau)).toFixed(2))
    delta += novo - Number(r.resultado || 0)
  })
  return { bad, delta: Number(delta.toFixed(2)) }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) return NextResponse.json({ pending: false })
    const s = sb()
    const { data: prof } = await s.from('profiles').select('id,tenant_id,role').eq('id', userId).maybeSingle()
    if (!prof || prof.role !== 'admin' || !prof.tenant_id) return NextResponse.json({ pending: false })
    // ja resolvido (aplicado ou recusado)?
    const { data: done } = await s.from('winback_log')
      .select('id').eq('tenant_id', prof.tenant_id).eq('segment', 'bau_corr_resolved').limit(1)
    if (done && done.length) return NextResponse.json({ pending: false })
    const { bad, delta } = await scanTenant(s, prof.tenant_id)
    if (!bad.length) return NextResponse.json({ pending: false })
    return NextResponse.json({ pending: true, delta, count: bad.length })
  } catch (e) {
    return NextResponse.json({ pending: false, error: e.message })
  }
}
