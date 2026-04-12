/**
 * NexControl Video — Renderer v3.1
 * Fixed: uses setTimeout loop instead of requestAnimationFrame
 * to ensure MediaRecorder captures all 480 frames (8 seconds)
 */
import { WIDTH, HEIGHT, FPS, TOTAL_FRAMES, BITRATE, T, C } from './config'
import { inOut3, out4, pt } from './easing'
import { drawScene1, drawParticles, drawRings, drawValue, drawData, drawBrand } from './layers'

export async function renderVideo({ value, metasFechadas, goalPct, stats, onProgress }) {
  const isPos = value >= 0
  const color = isPos ? C.profit : C.loss
  const { r:cr, g:cg, b:cb } = color
  const profitPct = Math.min(1, Math.abs(value) / Math.max(1, Math.abs(value)*1.5))

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  const particles = Array.from({length:28}, () => ({
    a: Math.random()*Math.PI*2,
    d: 200+Math.random()*90,
    s: 1+Math.random()*2.5,
    sp: 0.002+Math.random()*0.005,
    ph: Math.random()*Math.PI*2,
  }))

  const st = stats || { dep:0, saq:0, ops:0, taxa:0 }

  // Use captureStream with explicit fps
  const stream = canvas.captureStream(FPS)

  // Try VP9 first, fallback to VP8
  let mimeType = 'video/webm;codecs=vp9'
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8'
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm'
  }

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: BITRATE })
  const chunks = []
  recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onerror = reject
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      resolve(blob)
    }

    recorder.start(100) // request data every 100ms for smoother recording

    let f = 0
    const frameInterval = 1000 / FPS // ~16.67ms per frame
    const cx = WIDTH/2, cy = HEIGHT/2 - 80

    function renderFrame() {
      if (f >= TOTAL_FRAMES) {
        // Give recorder time to flush last data
        setTimeout(() => recorder.stop(), 200)
        return
      }

      const sec = f / FPS
      if (onProgress) onProgress(Math.round((f / TOTAL_FRAMES) * 100))

      const master = 1 - inOut3(pt(sec, T.fadeOut))

      // Zoom
      const zIn = out4(Math.min(1, sec/1.2)) * 0.05
      const zImpact = pt(sec, T.impact) > 0 ? out4(pt(sec, T.impact)) * 0.03 : 0
      const zOut = inOut3(Math.max(0, (sec-5)/3)) * -0.05
      const zoom = 1 + zIn + zImpact + zOut

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(zoom, zoom)
      ctx.translate(-cx, -cy)

      drawScene1(ctx, sec, cr, cg, cb, master)
      drawParticles(ctx, sec, particles, cr, cg, cb, master)
      drawRings(ctx, sec, goalPct, profitPct, cr, cg, cb, master)
      drawValue(ctx, sec, value, isPos, metasFechadas, cr, cg, cb, master)
      drawData(ctx, sec, st, master)
      drawBrand(ctx, sec, master)

      ctx.restore()

      f++

      // Use setTimeout to pace frames — ensures MediaRecorder captures each one
      // requestAnimationFrame runs too fast and recorder drops frames
      setTimeout(renderFrame, frameInterval)
    }

    // Start rendering after a brief delay for recorder to initialize
    setTimeout(renderFrame, 100)
  })
}
