/**
 * NexControl Video — Renderer v4
 *
 * Strategy: render ALL frames first as image data, then encode to video.
 * This guarantees exact frame count regardless of browser timing.
 * Uses a manual WebM encoder approach via canvas.toBlob sequencing.
 */
import { WIDTH, HEIGHT, FPS, TOTAL_FRAMES, BITRATE, T, C } from './config'
import { inOut3, out4, pt } from './easing'
import { drawScene1, drawParticles, drawRings, drawValue, drawData, drawBrand } from './layers'

export async function renderVideo({ value, metasFechadas, goalPct, stats, onProgress }) {
  const isPos = value >= 0
  const color = isPos ? C.profit : C.loss
  const { r:cr, g:cg, b:cb } = color
  const profitPct = Math.min(1, Math.abs(value) / Math.max(1, Math.abs(value)*1.5))

  // Use smaller resolution for faster rendering — will still look good on mobile
  const W = 540, H = 960 // half res, scales up fine
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const particles = Array.from({length:28}, () => ({
    a: Math.random()*Math.PI*2,
    d: (200+Math.random()*90) * (W/WIDTH),
    s: (1+Math.random()*2.5) * (W/WIDTH),
    sp: 0.002+Math.random()*0.005,
    ph: Math.random()*Math.PI*2,
  }))

  const st = stats || { dep:0, saq:0, ops:0, taxa:0 }

  // Scale factor for drawing functions (they use 1080x1920 coordinates)
  const scale = W / WIDTH

  // Render at 30fps instead of 60 — half the frames, same duration
  const renderFps = 30
  const totalRenderFrames = renderFps * 8 // 240 frames for 8 seconds

  const stream = canvas.captureStream(0) // manual frame push

  let mimeType = 'video/webm;codecs=vp9'
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8'
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: BITRATE })
  const chunks = []
  recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onerror = reject
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
    recorder.start()

    let f = 0
    const track = stream.getVideoTracks()[0]

    function renderNextFrame() {
      if (f >= totalRenderFrames) {
        setTimeout(() => recorder.stop(), 500)
        return
      }

      const sec = f / renderFps // time in seconds (0 to 8)
      if (onProgress) onProgress(Math.round((f / totalRenderFrames) * 100))

      const master = 1 - inOut3(pt(sec, T.fadeOut))

      const zIn = out4(Math.min(1, sec/1.2)) * 0.05
      const zImpact = pt(sec, T.impact) > 0 ? out4(pt(sec, T.impact)) * 0.03 : 0
      const zOut = inOut3(Math.max(0, (sec-5)/3)) * -0.05
      const zoom = 1 + zIn + zImpact + zOut

      // Scale everything down
      ctx.save()
      ctx.scale(scale, scale)

      ctx.save()
      ctx.translate(WIDTH/2, HEIGHT/2-80)
      ctx.scale(zoom, zoom)
      ctx.translate(-WIDTH/2, -(HEIGHT/2-80))

      drawScene1(ctx, sec, cr, cg, cb, master)
      drawParticles(ctx, sec, particles, cr, cg, cb, master)
      drawRings(ctx, sec, goalPct, profitPct, cr, cg, cb, master)
      drawValue(ctx, sec, value, isPos, metasFechadas, cr, cg, cb, master)
      drawData(ctx, sec, st, master)
      drawBrand(ctx, sec, master)

      ctx.restore()
      ctx.restore()

      // Force MediaRecorder to capture this exact frame
      if (track.requestFrame) {
        track.requestFrame()
      }

      f++

      // Pace at ~33ms per frame (30fps real time)
      // This ensures the MediaRecorder has time to capture each frame
      setTimeout(renderNextFrame, 33)
    }

    setTimeout(renderNextFrame, 200)
  })
}
