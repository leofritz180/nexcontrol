/**
 * NexControl — Cinematic Video Layers
 * Pure visual impact. No data overlay. No dashboard feel.
 */
import { out3, out4, outExpo, inOut3, outBack, ph } from './easing'
import { W, H, GREEN, RED, BRAND } from './config'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const cx = W/2, cy = H/2 - 40

// ═══════════════════════════════════════
// SCENE 1 — DARKNESS + ENERGY (0-1.5s)
// ═══════════════════════════════════════

export function sceneEnergy(ctx, sec, cr, cg, cb, m) {
  // Black void
  ctx.fillStyle = '#000'
  ctx.fillRect(0,0,W,H)

  // Central glow — breathing
  const rise = out4(ph(sec,0,1.5))
  const breathe = 0.7 + Math.sin(sec*1.8)*0.3
  const ga = rise * 0.15 * breathe * m
  const g = ctx.createRadialGradient(cx,cy,0,cx,cy,280)
  g.addColorStop(0,`rgba(${cr},${cg},${cb},${ga})`)
  g.addColorStop(0.3,`rgba(${cr},${cg},${cb},${ga*0.3})`)
  g.addColorStop(1,'transparent')
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H)

  // Vignette — always on
  const vg = ctx.createRadialGradient(cx,cy,100,cx,cy,H*0.6)
  vg.addColorStop(0,'transparent')
  vg.addColorStop(1,`rgba(0,0,0,${0.65*m})`)
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H)
}

// ═══════════════════════════════════════
// PARTICLES — orbiting energy
// ═══════════════════════════════════════

export function sceneParticles(ctx, sec, particles, cr, cg, cb, m) {
  const fadeIn = out4(ph(sec,0.3,1.5))

  for (const p of particles) {
    const angle = p.a + sec * p.speed
    const pulse = 0.3 + Math.sin(sec*2.5 + p.phase)*0.7
    const x = cx + Math.cos(angle) * p.dist
    const y = cy + Math.sin(angle) * p.dist * 0.85 // slight ellipse for 3D feel
    const a = fadeIn * pulse * p.brightness * m

    // Outer glow
    const r = p.size * 8
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a*0.08})`; ctx.fill()

    // Core
    ctx.beginPath(); ctx.arc(x,y,p.size,0,Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`; ctx.fill()
  }
}

// ═══════════════════════════════════════
// SCENE 2 — ORBITAL RINGS (1.5-3s)
// ═══════════════════════════════════════

export function sceneRings(ctx, sec, cr, cg, cb, m) {
  const build = out4(ph(sec,1.2,1.5))

  // Ring 1 — outermost, slow rotation, blurred feel
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(sec*0.04); ctx.translate(-cx,-cy)
  ctx.globalAlpha = build * 0.4 * m
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.15)`; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(cx,cy,160,0,Math.PI*2); ctx.stroke()
  ctx.globalAlpha = build * 0.2 * m
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.08)`; ctx.lineWidth = 4
  ctx.beginPath(); ctx.arc(cx,cy,162,0,Math.PI*2); ctx.stroke()
  ctx.restore()

  // Ring 2 — dashed, medium speed
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(-sec*0.07); ctx.translate(-cx,-cy)
  ctx.globalAlpha = build * 0.3 * m
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.12)`; ctx.lineWidth = 1
  ctx.setLineDash([3,12])
  ctx.beginPath(); ctx.arc(cx,cy,135,0,Math.PI*2); ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // Ring 3 — main, thick, glowing, progress arc
  const progress = build * 0.78
  ctx.save()
  ctx.globalAlpha = build * 0.15 * m
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.06)`; ctx.lineWidth = 5
  ctx.beginPath(); ctx.arc(cx,cy,110,0,Math.PI*2); ctx.stroke()

  ctx.globalAlpha = build * m
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.7)`; ctx.lineWidth = 5; ctx.lineCap = 'round'
  ctx.shadowColor = `rgba(${cr},${cg},${cb},0.5)`; ctx.shadowBlur = 15
  ctx.beginPath(); ctx.arc(cx,cy,110,-Math.PI/2,-Math.PI/2+Math.PI*2*progress); ctx.stroke()
  ctx.shadowBlur = 0

  // Glow on tip
  if (progress > 0.1) {
    const tipA = -Math.PI/2+Math.PI*2*progress
    const tx = cx+Math.cos(tipA)*110, ty = cy+Math.sin(tipA)*110
    const tg = ctx.createRadialGradient(tx,ty,0,tx,ty,20)
    tg.addColorStop(0,`rgba(${cr},${cg},${cb},${0.6*build*m})`); tg.addColorStop(1,'transparent')
    ctx.globalAlpha = 1
    ctx.fillStyle = tg; ctx.fillRect(tx-20,ty-20,40,40)
  }
  ctx.restore()

  // Ring 4 — inner, dashed, reverse
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(sec*0.1); ctx.translate(-cx,-cy)
  ctx.globalAlpha = build * 0.25 * m
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.1)`; ctx.lineWidth = 1
  ctx.setLineDash([2,10])
  ctx.beginPath(); ctx.arc(cx,cy,88,0,Math.PI*2); ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // Ring 5 — innermost, thin, glow
  ctx.globalAlpha = build * 0.12 * m
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.08)`; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(cx,cy,70,0,Math.PI*2); ctx.stroke()
  ctx.globalAlpha = 1
}

// ═══════════════════════════════════════
// SCENE 3 — VALUE REVEAL (3-5s)
// ═══════════════════════════════════════

export function sceneValue(ctx, sec, value, isPos, metas, cr, cg, cb, m) {
  const abs = Math.abs(value)
  const reveal = ph(sec,2.8,0.5) // blur to focus
  const countUp = outExpo(ph(sec,3,1.8)) // number counts up
  const impact = ph(sec,4.2,0.4) // pulse at end
  const current = abs * countUp

  if (reveal <= 0) return

  const scale = 0.85 + out4(reveal)*0.15 + (impact>0?outBack(impact)*0.08:0)
  const blur = (1-reveal)*8

  ctx.save()
  ctx.translate(cx,cy); ctx.scale(scale,scale)
  ctx.globalAlpha = out4(reveal) * m

  // Glow behind number
  ctx.shadowColor = `rgba(${cr},${cg},${cb},${0.6*out4(reveal)})`
  ctx.shadowBlur = 60 + blur*3

  // Prefix
  ctx.font = `900 ${28}px JetBrains Mono, monospace`
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.75)`
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  ctx.fillText(`${isPos?'+':'-'}R$`,0,-12)

  // Value
  ctx.font = `900 ${38}px JetBrains Mono, monospace`
  ctx.fillStyle = `rgba(${cr},${cg},${cb},1)`
  ctx.textBaseline = 'top'
  ctx.fillText(fmt(current),0,2)

  ctx.shadowBlur = 0

  // Meta count (small, elegant)
  const metaFade = out3(ph(sec,4.5,0.5))
  ctx.globalAlpha = metaFade * 0.3 * m
  ctx.font = '500 8px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText(`${metas} metas fechadas`,0,40)

  ctx.restore()

  // Shine sweep at impact
  if (impact > 0 && impact < 1) {
    const shX = cx - 120 + out4(impact)*240
    ctx.save(); ctx.globalAlpha = 0.12*(1-impact)*m
    const sg = ctx.createLinearGradient(shX-40,cy-50,shX+40,cy+50)
    sg.addColorStop(0,'transparent')
    sg.addColorStop(0.5,'rgba(255,255,255,1)')
    sg.addColorStop(1,'transparent')
    ctx.fillStyle = sg; ctx.fillRect(cx-120,cy-50,240,100)
    ctx.restore()
  }
}

// ═══════════════════════════════════════
// SCENE 4 — ATMOSPHERE INTENSIFY (5-7s)
// ═══════════════════════════════════════

export function sceneAtmosphere(ctx, sec, cr, cg, cb, m) {
  if (sec < 5) return
  const intensity = out3(ph(sec,5,1.5))

  // Intensified central glow
  const pulse = 0.8 + Math.sin(sec*3)*0.2
  const ga = intensity * 0.1 * pulse * m
  const g = ctx.createRadialGradient(cx,cy,0,cx,cy,200)
  g.addColorStop(0,`rgba(${cr},${cg},${cb},${ga*1.5})`)
  g.addColorStop(0.5,`rgba(${cr},${cg},${cb},${ga*0.3})`)
  g.addColorStop(1,'transparent')
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H)

  // Heatwave distortion — simulated via shifting glow
  const wave = Math.sin(sec*4)*3*intensity
  const wg = ctx.createRadialGradient(cx+wave,cy,0,cx+wave,cy,120)
  wg.addColorStop(0,`rgba(${cr},${cg},${cb},${0.04*intensity*m})`)
  wg.addColorStop(1,'transparent')
  ctx.fillStyle = wg; ctx.fillRect(cx-150,cy-150,300,300)
}

// ═══════════════════════════════════════
// SCENE 5 — BRAND (7-9s)
// ═══════════════════════════════════════

export function sceneBrand(ctx, sec, m) {
  const fadeIn = out4(ph(sec,7,0.8))
  const fadeOut = 1 - out3(ph(sec,8.5,0.5))
  const a = fadeIn * fadeOut * m
  if (a <= 0.01) return

  const scale = 0.92 + out4(ph(sec,7,0.8))*0.08

  ctx.save()
  ctx.translate(cx, H-130)
  ctx.scale(scale, scale)
  ctx.globalAlpha = a

  // Logo glow
  ctx.shadowColor = 'rgba(229,57,53,0.3)'
  ctx.shadowBlur = 30

  // Logo square
  ctx.fillStyle = BRAND
  roundRect(ctx,-32,-18,36,36,8); ctx.fill()

  ctx.shadowBlur = 0

  // Icon inside logo
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-28,-6,5,10)
  ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.fillRect(-21,-12,5,16)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-14,-3,5,6)

  // Brand text
  ctx.font = '700 13px Inter, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('Nex',12,0)
  ctx.fillStyle = 'rgba(255,68,68,0.8)'; ctx.fillText('Control',36,0)

  // Subtitle
  ctx.font = '400 7px Inter, sans-serif'; ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillText('Sistema operacional de resultados',0,28)

  // Date
  const ds = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillText(ds,0,44)

  ctx.restore()
}

function roundRect(ctx,x,y,w,h,r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y)
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r)
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h)
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r)
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}
