import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { scanTenant } from '../get/route'

export const dynamic = 'force-dynamic'

// POST /api/data-correction/resolve  { user_id, action: 'apply' | 'dismiss' }
// apply  -> recalcula as remessas afetadas ((saque-deposito)+bau) e ajusta o
//           lucro_final das metas FECHADAS pelo delta exato. Opt-in do admin.
// dismiss-> nao altera nada, so marca como resolvido (nao reaparece).

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

export async function POST(req) {
  try {
    const { user_id, action } = await req.json()
    if (!user_id || !['apply', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'bad request' }, { status: 400 })
    }
    const s = sb()
    const { data: prof } = await s.from('profiles').select('id,tenant_id,role').eq('id', user_id).maybeSingle()
    if (!prof || prof.role !== 'admin' || !prof.tenant_id) {
      return NextResponse.json({ error: 'not admin' }, { status: 403 })
    }
    // ja resolvido? (idempotente)
    const { data: done } = await s.from('winback_log')
      .select('id').eq('tenant_id', prof.tenant_id).eq('segment', 'bau_corr_resolved').limit(1)
    if (done && done.length) return NextResponse.json({ ok: true, already: true })

    const { bad, delta } = await scanTenant(s, prof.tenant_id)
    let applied = 0

    if (action === 'apply' && bad.length) {
      const metaDelta = {}
      for (const r of bad) {
        const novo = Number(((Number(r.saque) - Number(r.deposito)) + Number(r.bau)).toFixed(2))
        const lucro = novo > 0 ? novo : 0
        const prej = novo < 0 ? Math.abs(novo) : 0
        const contas = Number(r.contas_remessa || 0)
        await s.from('remessas').update({
          resultado: novo, lucro, prejuizo: prej,
          resultado_por_conta: contas > 0 ? Number((novo / contas).toFixed(2)) : 0,
        }).eq('id', r.id)
        metaDelta[r.meta_id] = (metaDelta[r.meta_id] || 0) + (novo - Number(r.resultado || 0))
        applied++
      }
      // metas fechadas: lucro_final = antigo + delta exato do resultado das remessas
      const metaIds = Object.keys(metaDelta)
      if (metaIds.length) {
        const { data: metas } = await s.from('metas').select('id,status_fechamento,lucro_final').in('id', metaIds)
        for (const m of (metas || [])) {
          if (m.status_fechamento === 'fechada') {
            const nv = Number((Number(m.lucro_final || 0) + metaDelta[m.id]).toFixed(2))
            await s.from('metas').update({ lucro_final: nv }).eq('id', m.id)
          }
        }
      }
    }

    await s.from('winback_log').insert({
      tenant_id: prof.tenant_id, user_id, segment: 'bau_corr_resolved', channel: 'push',
      status: action === 'apply' ? 'applied' : 'dismissed',
      payload: { action, delta, count: bad.length, applied },
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, action, applied, delta })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
