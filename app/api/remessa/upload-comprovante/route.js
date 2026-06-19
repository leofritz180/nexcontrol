import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import sharp from 'sharp'

// Upload do comprovante (foto dos saques) → grava DATA/HORA (vermelho, canto
// inferior esquerdo) DENTRO da imagem e sobe pro Vercel Blob. Assim o carimbo
// aparece ao abrir/baixar a foto, não só na tela do app.

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Desenha o carimbo (SVG) por cima da imagem usando sharp
async function carimbar(buffer, label) {
  const base = sharp(buffer).rotate() // respeita orientação EXIF (foto de celular)
  const meta = await base.metadata()
  const W = meta.width || 800
  const H = meta.height || 800
  const fs = Math.max(16, Math.round(W * 0.034))        // tamanho da fonte ~ largura
  const pad = Math.round(fs * 0.45)
  const margin = Math.max(10, Math.round(W * 0.018))
  const charW = fs * 0.62                                // largura aprox por caractere (mono)
  const boxW = Math.round(label.length * charW + pad * 2)
  const boxH = Math.round(fs + pad * 2)
  const x = margin
  const y = H - boxH - margin
  const textY = y + boxH - pad - Math.round(fs * 0.18)
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="${Math.round(fs*0.3)}" fill="rgb(229,57,53)" fill-opacity="0.93"/>
    <text x="${x + pad}" y="${textY}" font-family="monospace, 'DejaVu Sans Mono', Courier" font-size="${fs}" font-weight="bold" fill="#ffffff" letter-spacing="0.5">${esc(label)}</text>
  </svg>`
  const out = await base
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer()
  return out
}

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
    const type = file.type || 'image/png'
    if (!type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo precisa ser uma imagem' }, { status: 400 })
    }

    const ts = new Date()
    const label = ts.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }) // ex.: 18/06/2026 19:45:12 (horário de Brasília, do servidor)

    const inputBuf = Buffer.from(await file.arrayBuffer())
    let finalBuf, contentType, ext
    try {
      finalBuf = await carimbar(inputBuf, label)
      contentType = 'image/jpeg'; ext = 'jpg'
    } catch (e) {
      // Se o carimbo falhar por algum motivo, sobe a imagem original (não perde o comprovante)
      console.error('[upload-comprovante] carimbo falhou, subindo original:', e?.message)
      finalBuf = inputBuf
      contentType = type; ext = (type.split('/')[1] || 'png').replace('jpeg', 'jpg').split('+')[0]
    }

    const metaId = formData.get('meta_id') || 'x'
    const rand = Math.random().toString(36).slice(2, 9)
    const filename = `comprovantes/${metaId}-${Date.now()}-${rand}.${ext}`
    const blob = await put(filename, finalBuf, { access: 'public', contentType })

    return NextResponse.json({ url: blob.url, ts: ts.toISOString(), burned: finalBuf !== inputBuf })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
