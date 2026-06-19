import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

// Upload do comprovante (foto dos saques) → Vercel Blob.
// O carimbo de data/hora é desenhado NO CLIENTE (canvas) antes de subir,
// então aqui só armazenamos a imagem já carimbada.
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
    if (file.size && file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande (máx 12MB)' }, { status: 400 })
    }
    const type = file.type || 'image/jpeg'
    if (!type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo precisa ser uma imagem' }, { status: 400 })
    }
    const ext = (type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').split('+')[0]
    const metaId = formData.get('meta_id') || 'x'
    const rand = Math.random().toString(36).slice(2, 9)
    const filename = `comprovantes/${metaId}-${Date.now()}-${rand}.${ext}`

    const blob = await put(filename, file, { access: 'public', contentType: type })
    return NextResponse.json({ url: blob.url, ts: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
