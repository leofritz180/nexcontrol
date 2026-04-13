import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToTenant } from '../../../../lib/push'

export async function POST(req) {
  try {
    const { meta_id, salario, custo_fixo, taxa_agente, close, lucro_final } = await req.json()
    if (!meta_id) return NextResponse.json({ error: 'Missing meta_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const update = {
      salario: Number(salario || 0),
      custo_fixo: Number(custo_fixo || 0),
      taxa_agente: Number(taxa_agente || 0),
    }

    if (close) {
      update.status = 'finalizada'
      update.status_fechamento = 'fechada'
      update.lucro_final = Number(lucro_final || 0)
      update.fechada_em = new Date().toISOString()
    }

    const { error } = await supabase.from('metas').update(update).eq('id', meta_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send push notification when meta is closed
    if (close) {
      const { data: meta } = await supabase.from('metas').select('tenant_id,titulo,rede,quantidade_contas').eq('id', meta_id).single()
      if (meta) {
        const val = Math.abs(Number(lucro_final || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        await sendPushToTenant(supabase, meta.tenant_id, {
          title: 'Meta finalizada!',
          body: `${meta.quantidade_contas || 0} DEP ${(meta.rede || '').toUpperCase()} encerrada - Resultado: R$ ${val}`,
          url: '/admin',
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
