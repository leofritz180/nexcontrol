import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToTenant } from '../../../../lib/push'

export async function POST(req) {
  try {
    const { meta_id, action } = await req.json()
    if (!meta_id) return NextResponse.json({ error: 'Missing meta_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Fetch fresh meta
    const { data: meta, error: metaErr } = await supabase.from('metas').select('*').eq('id', meta_id).single()
    if (metaErr || !meta) return NextResponse.json({ error: 'Meta not found' }, { status: 404 })
    if (meta.status_fechamento === 'fechada') return NextResponse.json({ error: 'Already closed' }, { status: 400 })

    // Fetch remessas
    const { data: remessas } = await supabase.from('remessas').select('lucro,prejuizo').eq('meta_id', meta_id)
    const liq = (remessas || []).reduce((a, r) => a + Number(r.lucro || 0) - Number(r.prejuizo || 0), 0)

    const sal = Number(meta.salario || 0)
    const cst = Number(meta.custo_fixo || 0)
    const tax = Number(meta.taxa_agente || 0)
    const hasPre = sal > 0 || cst > 0 || tax > 0

    if (action === 'finalize') {
      if (hasPre) {
        // Auto-close with pre-configured values
        const lucroFinal = liq + sal - cst - tax
        await supabase.from('metas').update({
          status: 'finalizada',
          status_fechamento: 'fechada',
          lucro_final: lucroFinal,
          fechada_em: new Date().toISOString(),
        }).eq('id', meta_id)

        // Notify admin
        const fmt = v => Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        await sendPushToTenant(supabase, meta.tenant_id, {
          title: 'Meta fechada automaticamente',
          body: `${meta.quantidade_contas || 0} DEP ${(meta.rede || '').toUpperCase()} encerrada - Lucro final: R$ ${fmt(lucroFinal)}`,
          url: '/admin',
        })

        return NextResponse.json({ ok: true, autoClose: true, lucroFinal })
      } else {
        // Normal finalize
        await supabase.from('metas').update({ status: 'finalizada' }).eq('id', meta_id)

        // Get operator name
        const { data: op } = await supabase.from('profiles').select('nome,email').eq('id', meta.operator_id).maybeSingle()
        const opName = op?.nome || op?.email?.split('@')[0] || 'Operador'
        const fmt = v => Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

        await sendPushToTenant(supabase, meta.tenant_id, {
          title: 'Meta finalizada',
          body: `${meta.quantidade_contas || 0} DEP ${(meta.rede || '').toUpperCase()} finalizado - Resultado: ${liq >= 0 ? 'Lucro' : 'Prejuizo'}: R$ ${fmt(liq)}`,
          url: '/admin',
        })

        return NextResponse.json({ ok: true, autoClose: false })
      }
    }

    if (action === 'reactivate') {
      await supabase.from('metas').update({ status: 'ativa' }).eq('id', meta_id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
