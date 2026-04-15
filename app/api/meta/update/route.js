import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Edicao dos campos basicos de uma meta apos criada.
// NAO permite editar meta fechada (usar update-costs com update_lucro_only para ajustes de fechamento).
export async function POST(req) {
  try {
    const { meta_id, user_id, titulo, rede, plataforma, quantidade_contas, observacoes } = await req.json()
    if (!meta_id) return NextResponse.json({ error: 'Missing meta_id' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: meta, error: metaErr } = await sb.from('metas').select('*').eq('id', meta_id).single()
    if (metaErr || !meta) return NextResponse.json({ error: 'Meta not found' }, { status: 404 })
    if (meta.status_fechamento === 'fechada') {
      return NextResponse.json({ error: 'Meta fechada nao pode ser editada. Reative ou ajuste via fechamento.' }, { status: 400 })
    }

    // Permissao: operador dono da meta OU admin do mesmo tenant
    if (user_id) {
      const { data: prof } = await sb.from('profiles').select('id,role,tenant_id').eq('id', user_id).maybeSingle()
      if (!prof) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
      const isOwner = meta.operator_id === prof.id
      const isAdminSameTenant = prof.role === 'admin' && prof.tenant_id === meta.tenant_id
      if (!isOwner && !isAdminSameTenant) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    // Monta patch apenas com campos enviados e validados
    const update = {}
    const changes = []

    const pushChange = (label, from, to) => changes.push(`${label}: "${from ?? ''}" → "${to ?? ''}"`)

    if (typeof titulo === 'string' && titulo.trim() && titulo.trim() !== (meta.titulo || '')) {
      update.titulo = titulo.trim()
      pushChange('Titulo', meta.titulo, update.titulo)
    }
    if (typeof rede === 'string' && rede.trim() && rede.trim().toUpperCase() !== (meta.rede || '').toUpperCase()) {
      update.rede = rede.trim().toUpperCase()
      pushChange('Rede', meta.rede, update.rede)
    }
    if (typeof plataforma === 'string' && plataforma.trim() !== (meta.plataforma || '')) {
      update.plataforma = plataforma.trim()
      pushChange('Plataforma', meta.plataforma, update.plataforma)
    }
    if (quantidade_contas !== undefined && quantidade_contas !== null) {
      const n = Math.max(0, Math.floor(Number(quantidade_contas)))
      if (!Number.isNaN(n) && n !== Number(meta.quantidade_contas || 0)) {
        update.quantidade_contas = n
        pushChange('Contas', meta.quantidade_contas, n)
      }
    }
    if (observacoes !== undefined && (observacoes || '') !== (meta.observacoes || '')) {
      update.observacoes = observacoes?.trim() || null
      pushChange('Observacoes', meta.observacoes, update.observacoes)
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true, noop: true })
    }

    const { data: updated, error } = await sb.from('metas').update(update).eq('id', meta_id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Audit log
    try {
      let actorName = 'Usuario'
      if (user_id) {
        const { data: prof } = await sb.from('profiles').select('nome,email,role').eq('id', user_id).maybeSingle()
        actorName = prof?.nome || prof?.email?.split('@')[0] || (prof?.role === 'admin' ? 'Admin' : 'Operador')
      }
      await sb.from('activity_logs').insert({
        tenant_id: meta.tenant_id,
        operator_id: user_id || null,
        meta_id,
        action: 'meta_edited',
        description: `${actorName} editou a meta: ${changes.join(', ')}`,
      })
    } catch {}

    return NextResponse.json({ ok: true, meta: updated, changes })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
