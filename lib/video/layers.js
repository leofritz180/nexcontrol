/**
 * NexControl — Cinematic Video v6
 * 4-act narrative: Brand → Activation → Impact → Close
 * NO circles. NO HUD. NO dashboard feel.
 */
import { out3, out4, outExpo, inOut3, outBack, ph } from './easing'
import { W, H } from './config'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const cx = W/2, cy = H/2

// ═══════════════════════════════════════════
// ACT 1 — BRAND INTRO (0s - 1.5s)
// Logo as protagonist. No numbers yet.
// ═══════════════════════════════════════════

export function actBrand(ctx, sec, m) {
  // Background
  ctx.fillStyle = '#000'
  ctx.fillRect(0,0,W,H)

  // Subtle digital grid (fades in and out)
  const gridA = out4(ph(sec,0.2,0.8)) * (1-out3(ph(sec,1.2,0.3))) * 0.03 * m
  ctx.strokeStyle = `rgba(255,255,255,${gridA})`
  ctx.lineWidth = 0.5
  for (let x=0;x<W;x+=40) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke() }
  for (let y=0;y<H;y+=40) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke() }

  // Central light bloom
  const bloomA = out4(ph(sec,0,1)) * 0.08 * m
  const bg = ctx.createRadialGradient(cx,cy-60,0,cx,cy-60,300)
  bg.addColorStop(0,`rgba(0,255,136,${bloomA})`)
  bg.addColorStop(0.4,`rgba(0,255,136,${bloomA*0.2})`)
  bg.addColorStop(1,'transparent')
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H)

  // Vignette
  const vg = ctx.createRadialGradient(cx,cy,80,cx,cy,H*0.55)
  vg.addColorStop(0,'transparent')
  vg.addColorStop(1,`rgba(0,0,0,${0.7*m})`)
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H)

  // LOGO — big, center, protagonist
  const logoFade = out4(ph(sec,0.3,0.8))
  const logoScale = 0.88 + out4(ph(sec,0.3,0.8))*0.12
  const logoGlow = out4(ph(sec,0.5,0.6))

  ctx.save()
  ctx.translate(cx, cy-60)
  ctx.scale(logoScale, logoScale)
  ctx.globalAlpha = logoFade * m

  // Logo glow
  ctx.shadowColor = `rgba(229,57,53,${0.4*logoGlow})`
  ctx.shadowBlur = 40

  // Red square
  ctx.fillStyle = '#e53935'
  roundRect(ctx,-24,-24,48,48,12); ctx.fill()

  ctx.shadowBlur = 0

  // Icon bars
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-16,-12,7,16)
  ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.fillRect(-6,-20,7,28)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(4,-6,7,10)

  ctx.restore()

  // Brand text below logo
  const textFade = out4(ph(sec,0.6,0.7))
  ctx.save()
  ctx.globalAlpha = textFade * m
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

  ctx.font = '800 18px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText('Nex', cx-18, cy+14)
  ctx.fillStyle = 'rgba(255,68,68,0.9)'
  ctx.fillText('Control', cx+18, cy+14)

  ctx.font = '400 7px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillText('SISTEMA OPERACIONAL DE RESULTADOS', cx, cy+34)
  ctx.restore()
}

// ═══════════════════════════════════════════
// ACT 2 — SYSTEM ACTIVATION (1.5s - 3s)
// Energy lines, tech construction
// ═══════════════════════════════════════════

export function actActivation(ctx, sec, cr, cg, cb, m) {
  if (sec < 1.3) return
  const p = ph(sec,1.3,1.7)
  const a = out4(p) * m

  // Horizontal scan lines (tech feel)
  for (let i=0;i<6;i++) {
    const lineY = cy - 120 + i*48
    const lineP = out4(ph(sec, 1.4+i*0.08, 0.6))
    const lineW = lineP * 200
    ctx.save()
    ctx.globalAlpha = lineP * 0.08 * a
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},1)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx-lineW, lineY)
    ctx.lineTo(cx+lineW, lineY)
    ctx.stroke()

    // Dots at endpoints
    if (lineP > 0.5) {
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${lineP*0.3*a})`
      ctx.beginPath(); ctx.arc(cx-lineW,lineY,2,0,Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx+lineW,lineY,2,0,Math.PI*2); ctx.fill()
    }
    ctx.restore()
  }

  // Vertical energy beam — center
  const beamA = out4(ph(sec,1.8,0.8)) * 0.06 * a
  const beam = ctx.createLinearGradient(cx,cy-200,cx,cy+200)
  beam.addColorStop(0,'transparent')
  beam.addColorStop(0.3,`rgba(${cr},${cg},${cb},${beamA})`)
  beam.addColorStop(0.5,`rgba(${cr},${cg},${cb},${beamA*2})`)
  beam.addColorStop(0.7,`rgba(${cr},${cg},${cb},${beamA})`)
  beam.addColorStop(1,'transparent')
  ctx.fillStyle = beam; ctx.fillRect(cx-40,cy-200,80,400)

  // Corner brackets (tech frame)
  const bracketA = out4(ph(sec,2,0.6)) * 0.15 * a
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},${bracketA})`
  ctx.lineWidth = 1.5
  const bS = 30, bM = 60
  // Top-left
  ctx.beginPath(); ctx.moveTo(cx-bM,cy-100); ctx.lineTo(cx-bM,cy-100-bS); ctx.lineTo(cx-bM+bS,cy-100-bS); ctx.stroke()
  // Top-right
  ctx.beginPath(); ctx.moveTo(cx+bM,cy-100); ctx.lineTo(cx+bM,cy-100-bS); ctx.lineTo(cx+bM-bS,cy-100-bS); ctx.stroke()
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(cx-bM,cy+80); ctx.lineTo(cx-bM,cy+80+bS); ctx.lineTo(cx-bM+bS,cy+80+bS); ctx.stroke()
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(cx+bM,cy+80); ctx.lineTo(cx+bM,cy+80+bS); ctx.lineTo(cx+bM-bS,cy+80+bS); ctx.stroke()

  // Central glow intensifying
  const iglow = out4(ph(sec,2,0.8)) * 0.12 * a
  const ig = ctx.createRadialGradient(cx,cy-20,0,cx,cy-20,160)
  ig.addColorStop(0,`rgba(${cr},${cg},${cb},${iglow})`)
  ig.addColorStop(1,'transparent')
  ctx.fillStyle = ig; ctx.fillRect(0,0,W,H)
}

// ═══════════════════════════════════════════
// ACT 3 — VALUE IMPACT (3s - 5.5s)
// The money moment
// ═══════════════════════════════════════════

export function actImpact(ctx, sec, value, isPos, metas, cr, cg, cb, m) {
  if (sec < 2.8) return
  const abs = Math.abs(value)

  const reveal = out4(ph(sec,2.8,0.5))
  const countUp = outExpo(ph(sec,3,1.8))
  const current = abs * countUp
  const impact = ph(sec,4.3,0.4)
  const settled = ph(sec,4.8,0.5)

  const scale = 0.82 + out4(reveal)*0.18 + (impact>0?outBack(impact)*0.08:0)
  const blurSim = (1-reveal) // simulated blur via opacity

  ctx.save()
  ctx.translate(cx, cy-20)
  ctx.scale(scale,scale)
  ctx.globalAlpha = out4(reveal) * m

  // Deep glow behind
  ctx.shadowColor = `rgba(${cr},${cg},${cb},${0.7*out4(reveal)})`
  ctx.shadowBlur = 80

  // Prefix
  ctx.font = '900 24px JetBrains Mono, monospace'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.7+blurSim*0.3})`
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  ctx.fillText(`${isPos?'+':'-'}R$`, 0, -14)

  // Main value
  ctx.font = '900 36px JetBrains Mono, monospace'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},1)`
  ctx.textBaseline = 'top'
  ctx.fillText(fmt(current), 0, 0)

  ctx.shadowBlur = 0

  // Shine sweep
  if (impact > 0 && impact < 1) {
    const shX = -130 + out4(impact)*260
    ctx.globalAlpha = 0.15*(1-impact)*m
    const sg = ctx.createLinearGradient(shX-50,0,shX+50,0)
    sg.addColorStop(0,'transparent')
    sg.addColorStop(0.5,'white')
    sg.addColorStop(1,'transparent')
    ctx.fillStyle = sg; ctx.fillRect(-130,-40,260,90)
  }

  // Meta count
  ctx.globalAlpha = out3(settled) * 0.3 * m
  ctx.font = '500 7px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.textBaseline = 'top'
  ctx.fillText(`${metas} metas fechadas`, 0, 42)

  ctx.restore()

  // Flash on impact
  if (impact > 0 && impact < 0.3) {
    ctx.save()
    ctx.globalAlpha = (0.3-impact)*0.15*m
    ctx.fillStyle = `rgba(${cr},${cg},${cb},1)`
    ctx.fillRect(0,0,W,H)
    ctx.restore()
  }
}

// ═══════════════════════════════════════════
// ACT 4 — CLOSING + BRAND (5.5s - 8s)
// ═══════════════════════════════════════════

export function actClose(ctx, sec, m) {
  if (sec < 5.5) return

  // Darken background
  const darken = out3(ph(sec,5.5,1)) * 0.3 * m
  ctx.fillStyle = `rgba(0,0,0,${darken})`
  ctx.fillRect(0,0,W,H)

  // Brand reappears — BIGGER than intro
  const brandA = out4(ph(sec,6,0.8))
  const brandScale = 0.9 + out4(ph(sec,6,0.8))*0.1
  const brandFadeOut = 1-out3(ph(sec,7.5,0.5))
  const ba = brandA * brandFadeOut * m

  ctx.save()
  ctx.translate(cx, H-140)
  ctx.scale(brandScale, brandScale)
  ctx.globalAlpha = ba

  // Logo glow — stronger than intro
  ctx.shadowColor = 'rgba(229,57,53,0.5)'
  ctx.shadowBlur = 50

  // Red square — BIGGER
  ctx.fillStyle = '#e53935'
  roundRect(ctx,-28,-28,56,56,14); ctx.fill()

  ctx.shadowBlur = 0

  // Icon
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-18,-14,8,18)
  ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.fillRect(-7,-22,8,30)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(4,-8,8,12)

  ctx.restore()

  // Brand text
  ctx.save()
  ctx.globalAlpha = ba
  ctx.textAlign = 'center'

  ctx.font = '800 20px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('Nex', cx-20, H-72)
  ctx.fillStyle = 'rgba(255,68,68,0.85)'
  ctx.fillText('Control', cx+22, H-72)

  ctx.font = '400 7px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillText('SISTEMA OPERACIONAL DE RESULTADOS', cx, H-52)

  const ds = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillText(ds, cx, H-38)

  ctx.restore()
}

// ═══════════════════════════════════════════
// PARTICLES — ambient atmosphere
// ═══════════════════════════════════════════

export function drawParticles(ctx, sec, particles, cr, cg, cb, m) {
  const fadeIn = out4(ph(sec,0.5,1.5))
  for (const p of particles) {
    const x = p.x + Math.sin(sec*p.sx + p.phase)*p.drift
    const y = p.y + Math.cos(sec*p.sy + p.phase)*p.drift*0.7
    const pulse = 0.4 + Math.sin(sec*2 + p.phase)*0.6
    const a = fadeIn * pulse * p.brightness * m

    ctx.beginPath(); ctx.arc(x,y,p.size*4,0,Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a*0.06})`; ctx.fill()

    ctx.beginPath(); ctx.arc(x,y,p.size,0,Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`; ctx.fill()
  }
}

// ═══════════════════════════════════════════
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
