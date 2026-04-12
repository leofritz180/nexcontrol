/**
 * NexControl Video — Renderer v3
 * 5-scene cinematic pipeline, 1080x1920 @ 60fps, 8 seconds
 */
import { V, T, C } from './config'
import { inOut3, out4, pt } from './easing'
import { drawScene1, drawParticles, drawRings, drawValue, drawData, drawBrand } from './layers'

export async function renderVideo({ value, metasFechadas, goalPct, stats, onProgress }) {
  const isPos = value >= 0
  const color = isPos ? C.profit : C.loss
  const { r:cr, g:cg, b:cb } = color
  const profitPct = Math.min(1, Math.abs(value) / Math.max(1, Math.abs(value)*1.5))

  const canvas = document.createElement('canvas')
  canvas.width = V.w; canvas.height = V.h
  const ctx = canvas.getContext('2d')

  // Particles
  const particles = Array.from({length:28}, () => ({
    a: Math.random()*Math.PI*2,
    d: 200+Math.random()*90,
    s: 1+Math.random()*2.5,
    sp: 0.002+Math.random()*0.005,
    ph: Math.random()*Math.PI*2,
  }))

  // Stats fallback
  const st = stats || { dep:0, saq:0, ops:0, taxa:0 }

  // Recorder
  const stream = canvas.captureStream(V.fps)
  const recorder = new MediaRecorder(stream, { mimeType:V.format, videoBitsPerSecond:V.bitrate })
  const chunks = []
  recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onerror = reject
    recorder.onstop = () => resolve(new Blob(chunks, {type:'video/webm'}))
    recorder.start()
    let f = 0

    function frame() {
      if (f >= V.frames) { recorder.stop(); return }

      const t = f/V.frames, sec = f/V.fps
      if (onProgress) onProgress(Math.round(t*100))

      const master = 1 - inOut3(pt(sec, T.fadeOut))

      // Zoom: gentle in → bump at impact → settle out
      const zIn = out4(Math.min(1, sec/1.2)) * 0.05
      const zImpact = pt(sec, T.impact) > 0 ? out4(pt(sec, T.impact)) * 0.03 : 0
      const zOut = inOut3(Math.max(0, (sec-5)/3)) * -0.05
      const zoom = 1 + zIn + zImpact + zOut

      ctx.save()
      ctx.translate(V.w/2, V.h/2-80)
      ctx.scale(zoom, zoom)
      ctx.translate(-V.w/2, -(V.h/2-80))

      // Render all 5 scenes
      drawScene1(ctx, sec, cr, cg, cb, master)
      drawParticles(ctx, sec, particles, cr, cg, cb, master)
      drawRings(ctx, sec, goalPct, profitPct, cr, cg, cb, master)
      drawValue(ctx, sec, value, isPos, metasFechadas, cr, cg, cb, master)
      drawData(ctx, sec, st, master)
      drawBrand(ctx, sec, master)

      ctx.restore()
      f++
      requestAnimationFrame(frame)
    }
    frame()
  })
}
