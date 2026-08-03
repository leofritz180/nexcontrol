import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { EXT_FILES, buildConfig } from '../../../../lib/extension-files'

export const dynamic = 'force-dynamic'

// GET /api/deposit-capture/extension  (Bearer do operador logado)
// Gera e baixa a extensao JA com a CHAVE DE CAPTURA da conta embutida no
// config.js — cada operador baixa a sua, sem editar arquivo nem login.
function newCaptureKey() {
  const b = crypto.getRandomValues(new Uint8Array(24))
  return 'cap_' + Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
}

export async function GET(req) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false }, global: { headers: { Authorization: 'Bearer ' + token } } }
    )
    const { data: u } = await anon.auth.getUser()
    if (!u?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: prof } = await sb.from('profiles').select('id,capture_key').eq('id', u.user.id).maybeSingle()
    if (!prof) return NextResponse.json({ error: 'Perfil inválido' }, { status: 403 })
    let key = prof.capture_key
    if (!key) {
      key = newCaptureKey()
      await sb.from('profiles').update({ capture_key: key }).eq('id', u.user.id)
    }

    const zip = new JSZip()
    for (const [name, content] of Object.entries(EXT_FILES)) zip.file(name, content)
    zip.file('config.js', buildConfig(key)) // config personalizado (com a chave)
    const buf = await zip.generateAsync({ type: 'nodebuffer' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="nexcontrol-extensao.zip"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'erro' }, { status: 500 })
  }
}
