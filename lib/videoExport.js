/**
 * NexControl — Cinematic Video Export Engine
 * Generates 1080x1920 MP4 at 60fps using Canvas + MediaRecorder
 */

const W = 1080
const H = 1920
const FPS = 60
const DURATION = 7 // seconds
const TOTAL_FRAMES = FPS * DURATION

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4) }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2 }
function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }

export async function generateVideo({ value, metasFechadas, goalPct, onProgress }) {
  const isPos = value >= 0
  const absVal = Math.abs(value)
  const mainColor = isPos ? '#22C55E' : '#EF4444'
  const glowR = isPos ? 34 : 239
  const glowG = isPos ? 197 : 68
  const glowB = isPos ? 94 : 68

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Particles
  const particles = Array.from({length: 20}, () => ({
    angle: Math.random() * Math.PI * 2,
    dist: 220 + Math.random() * 60,
    size: 1 + Math.random() * 2.5,
    speed: 0.002 + Math.random() * 0.004,
    phase: Math.random() * Math.PI * 2,
  }))

  const stream = canvas.captureStream(FPS)
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8000000,
  })

  const chunks = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      resolve(blob)
    }

    recorder.start()
    let frame = 0

    function drawFrame() {
      if (frame >= TOTAL_FRAMES) {
        recorder.stop()
        return
      }

      const t = frame / TOTAL_FRAMES // 0→1 over full duration
      const sec = frame / FPS

      // Report progress
      if (onProgress) onProgress(Math.round(t * 100))

      // Clear
      ctx.fillStyle = '#010204'
      ctx.fillRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2 - 40

      // === PHASE TIMING ===
      const phaseGlow = Math.min(1, sec / 0.8) // 0-0.8s: glow appears
      const phaseRing = Math.max(0, Math.min(1, (sec - 0.6) / 0.9)) // 0.6-1.5s: ring enters
      const phaseNumber = Math.max(0, Math.min(1, (sec - 1.2) / 1.8)) // 1.2-3s: count-up
      const phaseStable = Math.max(0, Math.min(1, (sec - 3) / 0.5)) // 3-3.5s: stabilize
      const phaseText = Math.max(0, Math.min(1, (sec - 4.5) / 0.6)) // 4.5-5.1s: text enters
      const phaseFade = Math.max(0, Math.min(1, (sec - 6.2) / 0.8)) // 6.2-7s: fade out

      const masterAlpha = 1 - easeInOutCubic(phaseFade)

      // === ZOOM ===
      const zoom = 1 + easeOutQuart(phaseGlow) * 0.05 - easeInOutCubic(Math.max(0, (sec - 5) / 2)) * 0.03
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(zoom, zoom)
      ctx.translate(-cx, -cy)

      // === AMBIENT GLOW ===
      const glowAlpha = easeOutQuart(phaseGlow) * (0.08 + Math.sin(sec * 1.2) * 0.03) * masterAlpha
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 450)
      grad.addColorStop(0, `rgba(${glowR},${glowG},${glowB},${glowAlpha})`)
      grad.addColorStop(0.4, `rgba(${glowR},${glowG},${glowB},${glowAlpha * 0.3})`)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // === PARTICLES ===
      const particleAlpha = easeOutQuart(Math.max(0, Math.min(1, (sec - 0.8) / 1))) * masterAlpha
      particles.forEach(p => {
        const angle = p.angle + sec * p.speed * 10
        const pulse = 0.5 + Math.sin(sec * 2 + p.phase) * 0.5
        const x = cx + Math.cos(angle) * p.dist
        const y = cy + Math.sin(angle) * p.dist
        const a = particleAlpha * pulse * 0.6
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${glowR},${glowG},${glowB},${a})`
        ctx.fill()
        // Glow
        ctx.beginPath()
        ctx.arc(x, y, p.size * 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${glowR},${glowG},${glowB},${a * 0.2})`
        ctx.fill()
      })

      // === RINGS ===
      const ringAlpha = easeOutQuart(phaseRing) * masterAlpha

      // Ring 1 — outer (goal)
      drawRingProgress(ctx, cx, cy, 240, 2, goalPct * easeOutQuart(phaseRing), `rgba(255,255,255,${0.1 * ringAlpha})`, `rgba(255,255,255,${0.04 * ringAlpha})`)

      // Ring 2 — decorative dashed (rotating)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(sec * 0.1)
      ctx.translate(-cx, -cy)
      drawDashedRing(ctx, cx, cy, 220, 1, `rgba(255,255,255,${0.03 * ringAlpha})`, 5, 15)
      ctx.restore()

      // Ring 3 — main profit
      const mainProg = Math.min(1, absVal / Math.max(1, absVal * 1.5)) * easeOutQuart(phaseRing)
      drawRingProgress(ctx, cx, cy, 195, 5, mainProg, `rgba(${glowR},${glowG},${glowB},${0.9 * ringAlpha})`, `rgba(255,255,255,${0.04 * ringAlpha})`)

      // Ring glow sweep
      if (ringAlpha > 0.3) {
        const sweepAngle = -Math.PI/2 + mainProg * Math.PI * 2
        const sx = cx + Math.cos(sweepAngle) * 195
        const sy = cy + Math.sin(sweepAngle) * 195
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 30)
        sg.addColorStop(0, `rgba(${glowR},${glowG},${glowB},${0.4 * ringAlpha})`)
        sg.addColorStop(1, 'transparent')
        ctx.fillStyle = sg
        ctx.fillRect(sx - 30, sy - 30, 60, 60)
      }

      // Ring 4 — inner accent (reverse rotation)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(-sec * 0.07)
      ctx.translate(-cx, -cy)
      drawDashedRing(ctx, cx, cy, 165, 1, `rgba(${glowR},${glowG},${glowB},${0.08 * ringAlpha})`, 3, 12)
      ctx.restore()

      // === NUMBER (count-up) ===
      const numberAlpha = easeOutQuart(Math.min(1, phaseNumber / 0.8)) * masterAlpha
      const currentVal = absVal * easeOutExpo(phaseNumber)
      const numberScale = 0.85 + easeOutQuart(phaseNumber) * 0.15 + Math.sin(sec * 1.5) * 0.008 * phaseStable

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(numberScale, numberScale)

      // Number glow
      ctx.shadowColor = `rgba(${glowR},${glowG},${glowB},${0.4 * numberAlpha})`
      ctx.shadowBlur = 60

      // Prefix
      ctx.font = '900 62px "JetBrains Mono", monospace'
      ctx.fillStyle = `rgba(${glowR},${glowG},${glowB},${numberAlpha * 0.9})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`${isPos ? '+' : '-'}R$`, 0, -20)

      // Value
      ctx.font = '900 78px "JetBrains Mono", monospace'
      ctx.fillStyle = `rgba(${glowR},${glowG},${glowB},${numberAlpha})`
      ctx.textBaseline = 'top'
      ctx.fillText(fmt(currentVal), 0, -5)

      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      // Meta count
      ctx.font = '500 16px "Inter", sans-serif'
      ctx.fillStyle = `rgba(255,255,255,${0.25 * numberAlpha * phaseStable})`
      ctx.fillText(`${metasFechadas} metas fechadas`, 0, 80)

      ctx.restore()

      // === TEXT "RESULTADO DA OPERACAO" ===
      const textAlpha = easeOutQuart(phaseText) * masterAlpha
      ctx.font = '700 16px "Inter", sans-serif'
      ctx.fillStyle = `rgba(255,255,255,${0.3 * textAlpha})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.letterSpacing = '6px'
      ctx.fillText('RESULTADO DA OPERACAO', cx, cy - 310 + (1 - easeOutQuart(phaseText)) * 20)

      // === FOOTER ===
      const footerAlpha = easeOutQuart(Math.max(0, Math.min(1, (sec - 5) / 0.8))) * masterAlpha

      // Logo square
      ctx.fillStyle = `rgba(229,57,53,${footerAlpha})`
      roundRect(ctx, cx - 65, H - 140, 28, 28, 6)
      ctx.fill()

      // Logo icon (simplified)
      ctx.fillStyle = `rgba(255,255,255,${0.5 * footerAlpha})`
      ctx.fillRect(cx - 62, H - 128, 4, 7)
      ctx.fillStyle = `rgba(255,255,255,${footerAlpha})`
      ctx.fillRect(cx - 56, H - 133, 4, 12)
      ctx.fillStyle = `rgba(255,255,255,${0.7 * footerAlpha})`
      ctx.fillRect(cx - 50, H - 125, 4, 4)

      // Brand text
      ctx.font = '700 18px "Inter", sans-serif'
      ctx.fillStyle = `rgba(255,255,255,${0.4 * footerAlpha})`
      ctx.textAlign = 'left'
      ctx.fillText('Nex', cx - 30, H - 125)
      ctx.fillStyle = `rgba(255,68,68,${0.7 * footerAlpha})`
      ctx.fillText('Control', cx + 2, H - 125)

      // Date
      const dateStr = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })
      ctx.font = '400 13px "Inter", sans-serif'
      ctx.fillStyle = `rgba(255,255,255,${0.15 * footerAlpha})`
      ctx.textAlign = 'center'
      ctx.fillText(dateStr, cx, H - 90)

      ctx.restore() // zoom restore

      frame++
      requestAnimationFrame(drawFrame)
    }

    drawFrame()
  })
}

function drawRingProgress(ctx, cx, cy, r, lineWidth, progress, color, trackColor) {
  // Track
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = trackColor
  ctx.lineWidth = lineWidth
  ctx.stroke()

  // Progress
  if (progress > 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.stroke()
  }
}

function drawDashedRing(ctx, cx, cy, r, lineWidth, color, dashLen, gapLen) {
  const circ = 2 * Math.PI * r
  const segments = Math.floor(circ / (dashLen + gapLen))
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  for (let i = 0; i < segments; i++) {
    const startAngle = (i / segments) * Math.PI * 2
    const endAngle = startAngle + (dashLen / circ) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.stroke()
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
