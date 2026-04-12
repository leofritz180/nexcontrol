/**
 * NexControl — Canvas Renderer v8
 * 720x1280, 24fps, 9 seconds, 216 frames
 * Slower frame pacing (60ms) to guarantee MediaRecorder captures every frame
 */
import { W, H, FPS, FRAMES } from './config'
import { inOut3, out4, ph } from './easing'
import { actBrand, actActivation, actImpact, actAtmosphere, actClose, drawParticles } from './layers'

export async function renderVideo({ value, metasFechadas, goalPct, stats, onProgress }) {
  const isPos = value >= 0
  const cr = isPos?34:239, cg = isPos?197:68, cb = isPos?94:68

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  const particles = Array.from({length:30}, () => ({
    x: Math.random()*W,
    y: Math.random()*H,
    size: 1+Math.random()*3,
    sx: 0.2+Math.random()*0.5,
    sy: 0.15+Math.random()*0.4,
    drift: 20+Math.random()*35,
    phase: Math.random()*Math.PI*2,
    brightness: 0.08+Math.random()*0.3,
  }))

  const stream = canvas.captureStream(0) // manual frame push
  let mime = 'video/webm;codecs=vp9'
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8'
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm'

  const recorder = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:10000000 })
  const chunks = []
  recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onerror = reject
    recorder.onstop = () => resolve(new Blob(chunks,{type:'video/webm'}))
    recorder.start(100) // collect data every 100ms

    const track = stream.getVideoTracks()[0]
    let f = 0

    function render() {
      if (f >= FRAMES) {
        // Wait longer for recorder to flush all data
        setTimeout(() => recorder.stop(), 1000)
        return
      }

      const sec = f / FPS
      if (onProgress) onProgress(Math.round(f/FRAMES*100))

      const master = 1 - inOut3(ph(sec,8,1))

      const z = 1 + out4(ph(sec,0,2))*0.03 + (ph(sec,4,0.5)>0?out4(ph(sec,4,0.5))*0.025:0) - inOut3(ph(sec,6,3))*0.03

      // Scale from virtual 1080x1920 to actual canvas size
      const sx = W/1080, sy = H/1920
      ctx.save()
      ctx.scale(sx, sy)
      ctx.save()
      ctx.translate(1080/2,1920/2)
      ctx.scale(z,z)
      ctx.translate(-1080/2,-1920/2)

      actBrand(ctx, sec, master)
      drawParticles(ctx, sec, particles, cr, cg, cb, master)
      actActivation(ctx, sec, cr, cg, cb, master)
      actImpact(ctx, sec, value, isPos, metasFechadas, cr, cg, cb, master)
      actAtmosphere(ctx, sec, cr, cg, cb, master)
      actClose(ctx, sec, master)

      ctx.restore() // zoom
      ctx.restore() // scale

      // Push frame explicitly
      if (track.requestFrame) track.requestFrame()

      f++

      // 60ms per frame — gives MediaRecorder plenty of time
      // Total render time: 216 frames * 60ms = ~13 seconds
      setTimeout(render, 60)
    }

    setTimeout(render, 300) // wait for recorder to fully initialize
  })
}
