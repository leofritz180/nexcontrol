/**
 * NexControl — Cinematic Renderer v5
 * 540x960 @ 30fps, 9 seconds, 270 frames
 * setTimeout pacing for guaranteed frame capture
 */
import { W, H, FPS, FRAMES, GREEN, RED } from './config'
import { inOut3, out4, ph } from './easing'
import { sceneEnergy, sceneParticles, sceneRings, sceneValue, sceneAtmosphere, sceneBrand } from './layers'

export async function renderVideo({ value, metasFechadas, goalPct, stats, onProgress }) {
  const isPos = value >= 0
  const c = isPos ? GREEN : RED

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Create particle field — 3 layers for depth
  const particles = []
  // Back layer (far, slow, dim)
  for (let i=0;i<12;i++) particles.push({
    a:Math.random()*Math.PI*2, dist:170+Math.random()*60,
    size:0.8+Math.random()*1, speed:0.015+Math.random()*0.02,
    phase:Math.random()*Math.PI*2, brightness:0.15+Math.random()*0.15,
  })
  // Mid layer
  for (let i=0;i<10;i++) particles.push({
    a:Math.random()*Math.PI*2, dist:100+Math.random()*70,
    size:1+Math.random()*1.5, speed:0.03+Math.random()*0.03,
    phase:Math.random()*Math.PI*2, brightness:0.25+Math.random()*0.2,
  })
  // Front layer (close, fast, bright)
  for (let i=0;i<8;i++) particles.push({
    a:Math.random()*Math.PI*2, dist:60+Math.random()*50,
    size:1.5+Math.random()*2, speed:0.05+Math.random()*0.04,
    phase:Math.random()*Math.PI*2, brightness:0.35+Math.random()*0.3,
  })

  // Recorder setup
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
        setTimeout(() => recorder.stop(), 300)
        return
      }

      const sec = f / FPS
      if (onProgress) onProgress(Math.round(f/FRAMES*100))

      // Master fade at end
      const master = 1 - inOut3(ph(sec,8,1))

      // Camera zoom
      const zoomIn = out4(ph(sec,0,2))*0.04
      const zoomImpact = ph(sec,4,0.5)>0 ? out4(ph(sec,4,0.5))*0.03 : 0
      const zoomOut = inOut3(ph(sec,6,3))*-0.04
      const zoom = 1 + zoomIn + zoomImpact + zoomOut

      ctx.save()
      ctx.translate(W/2,H/2-40)
      ctx.scale(zoom,zoom)
      ctx.translate(-W/2,-(H/2-40))

      // Render scenes in order
      sceneEnergy(ctx, sec, c.r, c.g, c.b, master)
      sceneParticles(ctx, sec, particles, c.r, c.g, c.b, master)
      sceneRings(ctx, sec, c.r, c.g, c.b, master)
      sceneValue(ctx, sec, value, isPos, metasFechadas, c.r, c.g, c.b, master)
      sceneAtmosphere(ctx, sec, c.r, c.g, c.b, master)
      sceneBrand(ctx, sec, master)

      ctx.restore()

      // Push frame to recorder
      if (track.requestFrame) track.requestFrame()

      f++
      setTimeout(render, 33) // 30fps real-time pacing
    }

    setTimeout(render, 150)
  })
}
