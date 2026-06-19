import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// TEMPORÁRIO: re-grava o carimbo de data/hora DENTRO de fotos já existentes
// de uma remessa (que foram enviadas antes do carimbo). Gated ao tenant
// DS MENTORIA. Remover depois de usar.
const DS_MENTORIA_TENANT = '78da0085-9308-41b1-98b1-1e4c44063c51'
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function carimbar(buffer, label) {
  const base = sharp(buffer).rotate()
  const meta = await base.metadata()
  const W = meta.width || 800, H = meta.height || 800
  const fs = Math.max(16, Math.round(W * 0.034)), pad = Math.round(fs * 0.45)
  const margin = Math.max(10, Math.round(W * 0.018)), charW = fs * 0.62
  const boxW = Math.round(label.length * charW + pad * 2), boxH = Math.round(fs + pad * 2)
  const x = margin, y = H - boxH - margin, textY = y + boxH - pad - Math.round(fs * 0.18)
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="${Math.round(fs*0.3)}" fill="rgb(229,57,53)" fill-opacity="0.93"/><text x="${x + pad}" y="${textY}" font-family="monospace, 'DejaVu Sans Mono', Courier" font-size="${fs}" font-weight="bold" fill="#ffffff">${esc(label)}</text></svg>`
  return base.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 90 }).toBuffer()
}
const fmtBR = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' })

export async function POST(req) {
  try {
    const { remessa_id } = await req.json()
    if (!remessa_id) return NextResponse.json({ error: 'Missing remessa_id' }, { status: 400 })
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: r } = await sb.from('remessas').select('id,tenant_id,created_at,comprovante_url,comprovantes').eq('id', remessa_id).maybeSingle()
    if (!r) return NextResponse.json({ error: 'Remessa nao encontrada' }, { status: 404 })
    if (r.tenant_id !== DS_MENTORIA_TENANT) return NextResponse.json({ error: 'Fora do escopo' }, { status: 403 })

    const fotos = (Array.isArray(r.comprovantes) && r.comprovantes.length) ? r.comprovantes : (r.comprovante_url ? [r.comprovante_url] : [])
    const novos = []
    for (const it of fotos) {
      const f = typeof it === 'string' ? { url: it, ts: null } : (it || {})
      if (f.burned) { novos.push(f); continue }
      const ts = f.ts || r.created_at
      const resp = await fetch(f.url)
      const buf = Buffer.from(await resp.arrayBuffer())
      const out = await carimbar(buf, fmtBR(ts))
      const filename = `comprovantes/reburn-${remessa_id}-${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`
      const blob = await put(filename, out, { access: 'public', contentType: 'image/jpeg' })
      novos.push({ url: blob.url, ts, burned: true })
    }
    await sb.from('remessas').update({ comprovantes: novos, comprovante_url: novos[0]?.url || null }).eq('id', remessa_id)
    return NextResponse.json({ ok: true, fotos: novos.length, carimbos: novos.map(n => fmtBR(n.ts)) })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
