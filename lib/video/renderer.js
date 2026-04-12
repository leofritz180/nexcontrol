/**
 * NexControl — Cinematic Renderer v6
 * 4-act narrative, 8 seconds, 30fps, 240 frames
 * NO circles/HUD. Brand-first. Impact-driven.
 */
import { W, H, FPS, FRAMES } from './config'
import { inOut3, out4, ph } from './easing'
import { actBrand, actActivation, actImpact, actClose, drawParticles } from './layers'

export async function renderVideo({ value, metasFechadas, goalPct, stats, onProgress }) {
  const isPos = value >= 0
  const cr = isPos?34:239, cg = isPos?197:68, cb = isPos?94:68

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Ambient particles — floating, NOT orbiting
  const particles = Array.from({length:25}, () => ({
    x: Math.random()*W,
    y: Math.random()*H,
    size: 0.5+Math.random()*2,
    sx: 0.3+Math.random()*0.5,
    sy: 0.2+Math.random()*0.4,
    drift: 15+Math.random()*25,
    phase: Math.random()*Math.PI*2,
    brightness: 0.1+Math.random()*0.3,
  }))

  const stream = canvas.captureStream(0)
  let mime = 'video/webm;codecs=vp9'
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8'
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm'

  const recorder = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:8000000 })
  const chunks = []
  recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onerror = reject
    recorder.onstop = () => resolve(new Blob(chunks,{type:'video/webm'}))
    recorder.start(50)

    const track = stream.getVideoTracks()[0]
    let f = 0

    function render() {
      if (f >= FRAMES) {
        setTimeout(() => recorder.stop(), 400)
        return
      }

      const sec = f / FPS
      if (onProgress) onProgress(Math.round(f/FRAMES*100))

      const master = 1 - inOut3(ph(sec,7.2,0.8))

      // Gentle zoom
      const z = 1 + out4(ph(sec,0,2))*0.03 + (ph(sec,4,0.5)>0?out4(ph(sec,4,0.5))*0.02:0) - inOut3(ph(sec,5.5,2.5))*0.03
      ctx.save()
      ctx.translate(W/2,H/2)
      ctx.scale(z,z)
      ctx.translate(-W/2,-H/2)

      // 4 acts in sequence
      actBrand(ctx, sec, master)
      drawParticles(ctx, sec, particles, cr, cg, cb, master)
      actActivation(ctx, sec, cr, cg, cb, master)
      actImpact(ctx, sec, value, isPos, metasFechadas, cr, cg, cb, master)
      actClose(ctx, sec, master)

      ctx.restore()

      if (track.requestFrame) track.requestFrame()
      f++
      setTimeout(render, 33) // 30fps real-time
    }

    setTimeout(render, 150)
  })
}
