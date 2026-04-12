import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

/**
 * POST /api/render-profit-video/upload
 *
 * Receives a video blob from client-side render,
 * uploads to Vercel Blob Storage, returns public URL.
 */
export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('video')

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    const d = new Date()
    const filename = `nexcontrol-resultado-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${Date.now()}.webm`

    const blob = await put(`videos/${filename}`, file, {
      access: 'public',
    })

    return NextResponse.json({
      status: 'done',
      url: blob.url,
      filename,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
