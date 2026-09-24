import { createClient } from '@supabase/supabase-js'
import { notificarAdmins, notificarUsuarios } from '../../../../lib/pushNotificar'
import { NextResponse } from 'next/server'

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
    // Allow reactivate on closed metas, block only finalize on closed
    if (meta.status_fechamento === 'fechada' && action !== 'reactivate') return NextResponse.json({ error: 'Already closed' }, { status: 400 })

    // Fetch remessas
    const { data: remessas } = await supabase.from('remessas').select('lucro,prejuizo').eq('meta_id', meta_id)
    const liq = (remessas || []).reduce((a, r) => a + Number(r.lucro || 0) - Number(r.prejuizo || 0), 0)

    const sal = Number(meta.salario || 0)
    const bauVal = Number(meta.bau || 0)
    const cst = Number(meta.custo_fixo || 0)
    const tax = Number(meta.taxa_agente || 0)
    const hasPre = sal > 0 || bauVal > 0 || cst > 0 || tax > 0

    if (action === 'finalize') {
      if (hasPre) {
        // Auto-close with pre-configured values
        const lucroFinal = liq + sal + bauVal - cst - tax
        await supabase.from('metas').update({
          status: 'finalizada',
          status_fechamento: 'fechada',
          lucro_final: lucroFinal,
          fechada_em: new Date().toISOString(),
        }).eq('id', meta_id)

        // Admins recebem o resultado final; o operador só sabe que fechou e o
        // resultado das remessas dele (nunca salário/baú/lucro final). O
        // texto sai na voz de cada um (lib/notificacoes).
        const base = { contas: meta.quantidade_contas || 0, rede: meta.rede, metaId: meta_id, chave: String(meta_id) }
        await notificarAdmins(supabase, meta.tenant_id, 'meta-fechada', { ...base, lucroFinal })
        if (meta.operator_id) await notificarUsuarios(supabase, [meta.operator_id], 'meta-fechada-operador', { ...base, valor: liq })

        return NextResponse.json({ ok: true, autoClose: true, lucroFinal })
      } else {
        // Normal finalize
        await supabase.from('metas').update({ status: 'finalizada' }).eq('id', meta_id)

        // Get operator name
        const { data: op } = await supabase.from('profiles').select('nome,email').eq('id', meta.operator_id).maybeSingle()
        const opName = op?.nome || op?.email?.split('@')[0] || 'Operador'
        const { count: nRem } = await supabase.from('remessas').select('id', { count: 'exact', head: true }).eq('meta_id', meta_id)

        // A meta NÃO está fechada: está esperando o admin. O aviso diz isso e
        // o botão "Fechar agora" abre a meta já com o fechamento na tela.
        await notificarAdmins(supabase, meta.tenant_id, 'meta-finalizada', {
          nome: opName.split(/\s+/)[0], contas: meta.quantidade_contas || 0, rede: meta.rede, nRem: nRem || 0, valor: liq,
          metaId: meta_id, chave: String(meta_id),
        })

        return NextResponse.json({ ok: true, autoClose: false })
      }
    }

    if (action === 'reactivate') {
      await supabase.from('metas').update({ status: 'ativa', status_fechamento: null, lucro_final: null, fechada_em: null }).eq('id', meta_id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
