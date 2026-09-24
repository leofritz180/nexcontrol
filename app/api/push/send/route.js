// POST /api/push/send — o navegador pede um push TIPADO pra alguém do
// próprio tenant.
//
//   { tipo, dados, alvo }
//     tipo   chave de lib/notificacoes (o texto/botões/vibração vêm de lá)
//     dados  titulo, corpo, metaId, chave, quando…
//     alvo   'admins' (os admins do tenant de quem pede)
//            'eu'     (só quem pede)
//            { user_id } (alguém do MESMO tenant — ex.: admin avisando o operador)
//
// COMO ERA, e por que mudou: aceitava { user_id, title, body } de qualquer
// um, sem login — dava pra mandar push com texto livre pra qualquer usuário
// da base só sabendo o id. Agora exige o token da sessão (Authorization:
// Bearer), o texto só sai do catálogo, e o alvo nunca sai do tenant de quem
// pede. Quem chama pelo cliente usa dispararPush() em lib/pushClient.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser, sendPushToTenant } from '../../../../lib/push'
import { montarNotificacao, TIPOS } from '../../../../lib/notificacoes'

export const dynamic = 'force-dynamic'

async function quemPede(req) {
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

export async function POST(req) {
  try {
    const user = await quemPede(req)
    if (!user) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 })

    const { tipo, dados = {}, alvo = 'admins' } = await req.json()
    if (!TIPOS[tipo]) return NextResponse.json({ error: 'Tipo desconhecido' }, { status: 400 })
    if (!dados.titulo) return NextResponse.json({ error: 'Falta o título' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: perfil } = await admin.from('profiles').select('id, tenant_id, role').eq('id', user.id).maybeSingle()
    if (!perfil?.tenant_id) return NextResponse.json({ error: 'Perfil sem tenant' }, { status: 403 })

    const pacote = montarNotificacao(tipo, dados)

    let r
    if (alvo === 'eu') {
      r = await sendPushToUser(admin, user.id, pacote)
    } else if (alvo && typeof alvo === 'object' && alvo.user_id) {
      // só gente do mesmo tenant
      const { data: destino } = await admin.from('profiles').select('id, tenant_id').eq('id', alvo.user_id).maybeSingle()
      if (!destino || destino.tenant_id !== perfil.tenant_id) return NextResponse.json({ error: 'Alvo fora do tenant' }, { status: 403 })
      r = await sendPushToUser(admin, destino.id, pacote)
    } else {
      r = await sendPushToTenant(admin, perfil.tenant_id, pacote)
    }
    return NextResponse.json({ ok: true, tipo, ...r })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
