// /api/tenant/zerar — zerar a operação e restaurar (lib/zerar.js).
//   GET                                  contagem atual + cópias dos últimos 7 dias
//   POST { acao:'zerar', senha, frase }  frase tem que ser ZERAR; senha é a da conta
//   POST { acao:'restaurar', nome, senha }
//   POST { acao:'detalhe', nome }        o que tem dentro de uma cópia
// Só o ADMIN do tenant, com a senha conferida no Supabase na hora. A cópia
// é tirada ANTES de apagar; se a cópia falhar, nada é apagado.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { apagar, contagem, copiar, detalhe, listar, restaurar } from '../../../../lib/zerar'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
const semCache = (u, o) => fetch(u, { ...o, cache: 'no-store' })

async function quem(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return { erro: 'Sem sessão' }
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: 'Bearer ' + token } } })
  const { data: u } = await anon.auth.getUser()
  if (!u?.user) return { erro: 'Sem sessão' }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { global: { fetch: semCache } })
  const { data: p } = await sb.from('profiles').select('tenant_id, role').eq('id', u.user.id).maybeSingle()
  if (!p?.tenant_id || p.role !== 'admin') return { erro: 'Só o administrador da conta pode fazer isso' }
  return { sb, user: u.user, tenantId: p.tenant_id }
}

async function senhaConfere(email, senha) {
  if (!senha) return false
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await anon.auth.signInWithPassword({ email, password: senha })
  if (data?.session) { try { await anon.auth.signOut() } catch {} }
  return !error && !!data?.user
}

export async function GET(req) {
  const q = await quem(req)
  if (q.erro) return NextResponse.json({ error: q.erro }, { status: 401 })
  try {
    const [cont, copias] = await Promise.all([contagem(q.sb, q.tenantId), listar(q.sb, q.tenantId)])
    return NextResponse.json({ contagem: cont, copias })
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req) {
  const q = await quem(req)
  if (q.erro) return NextResponse.json({ error: q.erro }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const { sb, tenantId, user } = q
  try {
    if (b.acao === 'detalhe') return NextResponse.json(await detalhe(sb, tenantId, String(b.nome || '')))

    if (b.acao === 'zerar') {
      if (String(b.frase || '').trim().toUpperCase() !== 'ZERAR') return NextResponse.json({ error: 'Digite ZERAR para confirmar.' }, { status: 400 })
      if (!(await senhaConfere(user.email, b.senha))) return NextResponse.json({ error: 'Senha incorreta.' }, { status: 403 })
      const copia = await copiar(sb, tenantId, 'zerar')          // se falhar, nada é apagado
      const apagado = await apagar(sb, tenantId)
      console.log('[zerar] tenant', tenantId, 'por', user.email, apagado, '→', copia.nome)
      return NextResponse.json({ ok: true, apagado, copia: copia.nome })
    }

    if (b.acao === 'restaurar') {
      if (!(await senhaConfere(user.email, b.senha))) return NextResponse.json({ error: 'Senha incorreta.' }, { status: 403 })
      const r = await restaurar(sb, tenantId, String(b.nome || ''))
      console.log('[zerar] restaurado tenant', tenantId, 'por', user.email, r)
      return NextResponse.json({ ok: true, ...r })
    }

    return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 })
  } catch (e) {
    console.error('[zerar] falhou', tenantId, b.acao, e?.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
