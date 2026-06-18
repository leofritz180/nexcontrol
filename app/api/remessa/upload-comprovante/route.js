import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

// Upload do comprovante (foto dos saques) de uma remessa → Vercel Blob.
// Aceita imagem via multipart (campo 'foto'). Retorna a URL pública.
export async function POST(req) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Storage nao configurado' }, { status: 500 })
    }
    const formData = await req.formData()
    const file = formData.get('foto')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 })
    }
    // Limite ~8MB
    if (file.size && file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande (máx 8MB)' }, { status: 400 })
    }
    const type = file.type || 'image/png'
    if (!type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo precisa ser uma imagem' }, { status: 400 })
    }
    const ext = (type.split('/')[1] || 'png').replace('jpeg', 'jpg').split('+')[0]
    const metaId = formData.get('meta_id') || 'x'
    const rand = Math.random().toString(36).slice(2, 9)
    const filename = `comprovantes/${metaId}-${Date.now()}-${rand}.${ext}`

    const blob = await put(filename, file, { access: 'public', contentType: type })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
