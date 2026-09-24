import { createClient } from '@supabase/supabase-js'
import { montarNotificacao } from '../../../../lib/notificacoes'
import { NextResponse } from 'next/server'
import { sendPushToTenant, sendPushToUser } from '../../../../lib/push'

export async function POST(req) {
  try {
    const { meta_id, salario, bau, custo_fixo, taxa_agente, close, lucro_final, update_lucro_only } = await req.json()
    if (!meta_id) return NextResponse.json({ error: 'Missing meta_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const update = {
      salario: Number(salario || 0),
      bau: Number(bau || 0),
      custo_fixo: Number(custo_fixo || 0),
      taxa_agente: Number(taxa_agente || 0),
    }

    if (close) {
      // First-time close: set status + fechada_em
      update.status = 'finalizada'
      update.status_fechamento = 'fechada'
      update.lucro_final = Number(Number(lucro_final || 0).toFixed(2))
      update.fechada_em = new Date().toISOString()
    } else if (update_lucro_only && lucro_final !== undefined) {
      // Editing already-closed meta: only update lucro_final, DON'T re-close or change fechada_em
      update.lucro_final = Number(Number(lucro_final || 0).toFixed(2))
    }

    const { error } = await supabase.from('metas').update(update).eq('id', meta_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send push notification ONLY on first close (not edits)
    if (close) {
      const { data: meta } = await supabase.from('metas').select('tenant_id,titulo,rede,quantidade_contas,operator_id').eq('id', meta_id).single()
      if (meta) {
        const fmt = v => Math.abs(Number(v || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        const pos = Number(lucro_final || 0) >= 0
        const rotulo = `${meta.quantidade_contas || 0} DEP ${(meta.rede || '').toUpperCase()}`
        await sendPushToTenant(supabase, meta.tenant_id, montarNotificacao('meta-fechada', {
          titulo: pos ? 'Meta fechada no lucro' : 'Meta fechada no prejuízo',
          corpo: `${rotulo} · resultado final ${pos ? '+' : '−'}R$ ${fmt(lucro_final)}`,
          metaId: meta_id,
          chave: String(meta_id),
        }))
        // O operador só sabe que fechou e o resultado das remessas dele —
        // salário, baú e lucro final são campos do admin.
        if (meta.operator_id) {
          const { data: rems } = await supabase.from('remessas').select('lucro,prejuizo').eq('meta_id', meta_id)
          const liq = (rems || []).reduce((a, r) => a + Number(r.lucro || 0) - Number(r.prejuizo || 0), 0)
          await sendPushToUser(supabase, meta.operator_id, montarNotificacao('meta-fechada-operador', {
            titulo: 'Sua meta foi fechada',
            corpo: `${rotulo} · suas remessas: ${liq >= 0 ? '+' : '−'}R$ ${fmt(liq)}`,
            metaId: meta_id,
            chave: String(meta_id),
          }))
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
