/**
 * NexControl Video — Renderer
 * Orchestrates frame-by-frame Canvas rendering + MediaRecorder export
 */

import { VIDEO_CONFIG as V, TIMELINE as T, COLORS } from './config'
import { inOut3, out4, phase } from './easing'
import { drawBackground, drawParticles, drawTitle, drawRings, drawValue, drawConfirmText, drawBrand } from './layers'

export async function renderVideo({ value, metasFechadas, goalPct, onProgress }) {
  const isPos = value >= 0
  const color = isPos ? COLORS.profit : COLORS.loss
  const { r: cr, g: cg, b: cb } = color

  const canvas = document.createElement('canvas')
  canvas.width = V.width; canvas.height = V.height
  const ctx = canvas.getContext('2d')

  // Create particles
  const particles = Array.from({length: 24}, () => ({
    a: Math.random()*Math.PI*2,
    d: 200 + Math.random()*80,
    s: 1 + Math.random()*2.5,
    sp: 0.003 + Math.random()*0.005,
    ph: Math.random()*Math.PI*2,
  }))

  const profitPct = Math.min(1, Math.abs(value) / Math.max(1, Math.abs(value) * 1.5))

  // Setup recorder
  const stream = canvas.captureStream(V.fps)
  const recorder = new MediaRecorder(stream, {
    mimeType: V.format,
    videoBitsPerSecond: V.bitrate,
  })
  const chunks = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onerror = reject
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
    recorder.start()

    let frame = 0

    function renderFrame() {
      if (frame >= V.totalFrames) { recorder.stop(); return }

      const t = frame / V.totalFrames
      const sec = frame / V.fps

      if (onProgress) onProgress(Math.round(t * 100))

      // Master fade
      const master = 1 - inOut3(phase(sec, T.fade.start, T.fade.dur))

      // Zoom
      const pIntro = phase(sec, T.intro.start, T.intro.dur)
      const pImpact = phase(sec, T.impact.start, T.impact.dur)
      const zoom = 1 + out4(pIntro)*0.06 + (pImpact > 0 ? out4(pImpact)*0.04 : 0) - inOut3(phase(sec, 4.5, 2.5))*0.06
      const cx = V.width/2, cy = V.height/2 - 60

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(zoom, zoom)
      ctx.translate(-cx, -cy)

      // Draw all layers in order
      drawBackground(ctx, sec, cr, cg, cb, master)
      drawParticles(ctx, sec, particles, cr, cg, cb, master)
      drawTitle(ctx, sec, master)
      drawRings(ctx, sec, goalPct, profitPct, cr, cg, cb, master)
      drawValue(ctx, sec, value, isPos, metasFechadas, cr, cg, cb, master)
      drawConfirmText(ctx, sec, master)
      drawBrand(ctx, sec, master)

      ctx.restore()

      frame++
      requestAnimationFrame(renderFrame)
    }

    renderFrame()
  })
}
