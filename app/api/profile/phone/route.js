import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizeBRPhone } from '../../../../lib/phone'

export const dynamic = 'force-dynamic'

// POST /api/profile/phone { phone }
// Salva o WhatsApp do PROPRIO usuario logado (token no Authorization).
// Validacao/normalizacao no servidor — grava so digitos com DDI (55...).
export async function POST(req) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false }, global: { headers: { Authorization: 'Bearer ' + token } } }
    )
    const { data } = await anon.auth.getUser()
    const user = data?.user
    if (!user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const phone = normalizeBRPhone(body.phone)
    if (!phone) return NextResponse.json({ error: 'Número inválido. Use DDD + número, ex: (32) 99834-8889' }, { status: 400 })

    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await svc.from('profiles').update({ phone }).eq('id', user.id)
    if (error) {
      console.error('[phone] update failed', error.message)
      return NextResponse.json({ error: 'Não deu pra salvar agora. Tenta de novo.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, phone })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'erro' }, { status: 500 })
  }
}
