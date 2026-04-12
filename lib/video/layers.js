/**
 * NexControl — Canvas layers matching Remotion composition exactly
 * Full resolution 1080x1920, brand-first cinematic
 */
import { out3, out4, outExpo, inOut3, outBack, ph } from './easing'
import { W, H } from './config'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const cx = W/2, cy = H/2 - 60

// ═══════════════════════════════════════
// ACT 1 — BRAND INTRO (0-1.5s)
// ═══════════════════════════════════════

export function actBrand(ctx, sec, m) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0,0,W,H)

  // Digital grid (fades in 0.2-0.8s, out 1.2-1.5s)
  const gridA = out4(ph(sec,0.2,0.6)) * (1-out3(ph(sec,1.2,0.3))) * 0.04 * m
  if (gridA > 0.001) {
    ctx.strokeStyle = `rgba(255,255,255,${gridA})`
    ctx.lineWidth = 0.5
    for (let x=0;x<W;x+=40) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke() }
    for (let y=0;y<H;y+=40) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke() }
  }

  // Central bloom
  const bloomA = out4(ph(sec,0,1)) * 0.1 * m
  const bg = ctx.createRadialGradient(cx,cy,0,cx,cy,600)
  bg.addColorStop(0,`rgba(0,255,136,${bloomA})`)
  bg.addColorStop(0.3,`rgba(0,255,136,${bloomA*0.25})`)
  bg.addColorStop(1,'transparent')
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H)

  // Vignette
  const vg = ctx.createRadialGradient(cx,cy,150,cx,cy,H*0.55)
  vg.addColorStop(0,'transparent')
  vg.addColorStop(1,`rgba(0,0,0,${0.7*m})`)
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H)

  // LOGO — big, center
  const logoFade = out4(ph(sec,0.3,0.7))
  const logoOut = 1-out3(ph(sec,1.3,0.3))
  const logoA = logoFade * logoOut * m
  const logoScale = 0.88 + out4(ph(sec,0.3,0.7))*0.12

  if (logoA > 0.01) {
    ctx.save()
    ctx.translate(cx, cy-60)
    ctx.scale(logoScale, logoScale)
    ctx.globalAlpha = logoA

    // Glow
    ctx.shadowColor = `rgba(229,57,53,${0.5*logoA})`
    ctx.shadowBlur = 60

    // Red square
    ctx.fillStyle = '#e53935'
    roundRect(ctx,-40,-40,80,80,20); ctx.fill()

    ctx.shadowBlur = 0

    // Icon bars
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-26,-18,11,24)
    ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.fillRect(-10,-30,11,42)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(6,-10,11,16)

    ctx.restore()

    // Brand text
    const textA = out4(ph(sec,0.5,0.6)) * logoOut * m
    ctx.save()
    ctx.globalAlpha = textA
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

    ctx.font = '800 50px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    const nexW = ctx.measureText('Nex').width
    const ctrlW = ctx.measureText('Control').width
    const totalW = nexW + ctrlW
    ctx.fillText('Nex', cx - totalW/2 + nexW/2, cy+30)
    ctx.fillStyle = 'rgba(255,68,68,0.9)'
    ctx.fillText('Control', cx - totalW/2 + nexW + ctrlW/2, cy+30)

    ctx.font = '400 14px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillText('SISTEMA OPERACIONAL DE RESULTADOS', cx, cy+65)

    ctx.restore()
  }
}

// ═══════════════════════════════════════
// ACT 2 — SYSTEM ACTIVATION (1.3-3s)
// ═══════════════════════════════════════

export function actActivation(ctx, sec, cr, cg, cb, m) {
  if (sec < 1.3) return
  const build = out4(ph(sec,1.3,1.5))

  // Scan lines
  for (let i=0;i<8;i++) {
    const lineY = cy - 220 + i*66
    const p = out4(ph(sec, 1.4+i*0.07, 0.5))
    const lineW = p * 380
    ctx.save()
    ctx.globalAlpha = p * 0.1 * build * m
    ctx.strokeStyle = `rgb(${cr},${cg},${cb})`
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(cx-lineW,lineY); ctx.lineTo(cx+lineW,lineY); ctx.stroke()

    if (p > 0.4) {
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${p*0.35*build*m})`
      ctx.beginPath(); ctx.arc(cx-lineW,lineY,3,0,Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx+lineW,lineY,3,0,Math.PI*2); ctx.fill()
    }
    ctx.restore()
  }

  // Vertical energy beam
  const beamA = out4(ph(sec,1.8,0.8)) * 0.08 * build * m
  const beam = ctx.createLinearGradient(cx,cy-400,cx,cy+400)
  beam.addColorStop(0,'transparent')
  beam.addColorStop(0.3,`rgba(${cr},${cg},${cb},${beamA})`)
  beam.addColorStop(0.5,`rgba(${cr},${cg},${cb},${beamA*2.5})`)
  beam.addColorStop(0.7,`rgba(${cr},${cg},${cb},${beamA})`)
  beam.addColorStop(1,'transparent')
  ctx.fillStyle = beam; ctx.fillRect(cx-80,cy-400,160,800)

  // Corner brackets
  const bracketA = out4(ph(sec,2,0.6)) * 0.2 * build * m
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},${bracketA})`
  ctx.lineWidth = 2
  const bS = 50, bM = 120
  ctx.beginPath(); ctx.moveTo(cx-bM,cy-180); ctx.lineTo(cx-bM,cy-180-bS); ctx.lineTo(cx-bM+bS,cy-180-bS); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx+bM,cy-180); ctx.lineTo(cx+bM,cy-180-bS); ctx.lineTo(cx+bM-bS,cy-180-bS); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx-bM,cy+140); ctx.lineTo(cx-bM,cy+140+bS); ctx.lineTo(cx-bM+bS,cy+140+bS); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx+bM,cy+140); ctx.lineTo(cx+bM,cy+140+bS); ctx.lineTo(cx+bM-bS,cy+140+bS); ctx.stroke()

  // Central intensifying glow
  const iglow = out4(ph(sec,2,0.8)) * 0.15 * build * m
  const ig = ctx.createRadialGradient(cx,cy,0,cx,cy,300)
  ig.addColorStop(0,`rgba(${cr},${cg},${cb},${iglow})`)
  ig.addColorStop(1,'transparent')
  ctx.fillStyle = ig; ctx.fillRect(0,0,W,H)
}

// ═══════════════════════════════════════
// ACT 3 — VALUE REVEAL (3-5.5s)
// ═══════════════════════════════════════

export function actImpact(ctx, sec, value, isPos, metas, cr, cg, cb, m) {
  if (sec < 2.8) return
  const abs = Math.abs(value)

  const reveal = out4(ph(sec,2.8,0.5))
  const countUp = outExpo(ph(sec,3,1.8))
  const current = abs * countUp
  const impact = ph(sec,4.3,0.4)
  const settled = ph(sec,4.8,0.5)

  const scale = 0.82 + out4(reveal)*0.18 + (impact>0?outBack(impact)*0.1:0)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)
  ctx.globalAlpha = out4(reveal) * m

  // Deep glow
  ctx.shadowColor = `rgba(${cr},${cg},${cb},${0.7*out4(reveal)})`
  ctx.shadowBlur = 120

  // Prefix
  ctx.font = '900 72px JetBrains Mono, monospace'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.8)`
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  ctx.fillText(`${isPos?'+':'-'}R$`, 0, -20)

  // Value
  ctx.font = '900 96px JetBrains Mono, monospace'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},1)`
  ctx.textBaseline = 'top'
  ctx.fillText(fmt(current), 0, 0)

  ctx.shadowBlur = 0

  // Shine sweep
  if (impact > 0 && impact < 1) {
    const shX = -280 + out4(impact)*560
    ctx.globalAlpha = 0.18*(1-impact)*m
    const sg = ctx.createLinearGradient(shX-80,0,shX+80,0)
    sg.addColorStop(0,'transparent')
    sg.addColorStop(0.5,'white')
    sg.addColorStop(1,'transparent')
    ctx.fillStyle = sg; ctx.fillRect(-280,-100,560,200)
  }

  // Meta count
  ctx.globalAlpha = out3(settled) * 0.3 * m
  ctx.font = '500 18px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.textBaseline = 'top'
  ctx.fillText(`${metas} metas fechadas`, 0, 100)

  ctx.restore()

  // Screen flash on impact
  if (impact > 0 && impact < 0.25) {
    ctx.save()
    ctx.globalAlpha = (0.25-impact)*0.2*m
    ctx.fillStyle = `rgba(${cr},${cg},${cb},1)`
    ctx.fillRect(0,0,W,H)
    ctx.restore()
  }

  // "LUCRO CONFIRMADO"
  const confirmA = out4(ph(sec,5,0.5)) * (1-out3(ph(sec,6.5,0.5))) * 0.3 * m
  if (confirmA > 0.01) {
    ctx.save()
    ctx.globalAlpha = confirmA
    ctx.font = '700 20px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,1)'
    ctx.textAlign = 'center'; ctx.letterSpacing = '6px'
    ctx.fillText('LUCRO CONFIRMADO', cx, cy + 500)
    ctx.restore()
  }
}

// ═══════════════════════════════════════
// ACT 4 — ATMOSPHERE (5-7s)
// ═══════════════════════════════════════

export function actAtmosphere(ctx, sec, cr, cg, cb, m) {
  if (sec < 5) return
  const intensity = out3(ph(sec,5,1.5))
  const pulse = 0.8 + Math.sin(sec*3)*0.2
  const ga = intensity * 0.12 * pulse * m
  const g = ctx.createRadialGradient(cx,cy,0,cx,cy,400)
  g.addColorStop(0,`rgba(${cr},${cg},${cb},${ga*1.5})`)
  g.addColorStop(0.5,`rgba(${cr},${cg},${cb},${ga*0.3})`)
  g.addColorStop(1,'transparent')
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H)
}

// ═══════════════════════════════════════
// ACT 5 — BRAND OUTRO (6.5-9s)
// ═══════════════════════════════════════

export function actClose(ctx, sec, m) {
  if (sec < 6) return

  // Darken
  const darken = out3(ph(sec,6,1)) * 0.4 * m
  ctx.fillStyle = `rgba(0,0,0,${darken})`
  ctx.fillRect(0,0,W,H)

  // Brand
  const brandA = out4(ph(sec,6.5,0.8))
  const brandScale = 0.88 + out4(ph(sec,6.5,0.8))*0.12
  const brandOut = 1-out3(ph(sec,8.2,0.8))
  const ba = brandA * brandOut * m

  if (ba < 0.01) return

  ctx.save()
  ctx.translate(cx, H-260)
  ctx.scale(brandScale, brandScale)
  ctx.globalAlpha = ba

  // Glow — STRONG
  ctx.shadowColor = 'rgba(229,57,53,0.6)'
  ctx.shadowBlur = 80

  // Red square — BIG
  ctx.fillStyle = '#e53935'
  roundRect(ctx,-44,-44,88,88,22); ctx.fill()

  ctx.shadowBlur = 0

  // Icon
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-28,-20,12,26)
  ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.fillRect(-12,-32,12,44)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(4,-12,12,16)

  ctx.restore()

  // Text
  ctx.save()
  ctx.globalAlpha = ba
  ctx.textAlign = 'center'

  ctx.font = '800 42px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  const nexW2 = ctx.measureText('Nex').width
  const ctrlW2 = ctx.measureText('Control').width
  ctx.fillText('Nex', cx - (nexW2+ctrlW2)/2 + nexW2/2, H-150)
  ctx.fillStyle = 'rgba(255,68,68,0.85)'
  ctx.fillText('Control', cx - (nexW2+ctrlW2)/2 + nexW2 + ctrlW2/2, H-150)

  ctx.font = '400 14px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillText('SISTEMA OPERACIONAL DE RESULTADOS', cx, H-105)

  const ds = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
  ctx.font = '400 13px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillText(ds, cx, H-80)

  ctx.restore()
}

// ═══════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════

export function drawParticles(ctx, sec, particles, cr, cg, cb, m) {
  const fadeIn = out4(ph(sec,0.5,1.5))
  for (const p of particles) {
    const x = p.x + Math.sin(sec*p.sx + p.phase)*p.drift
    const y = p.y + Math.cos(sec*p.sy + p.phase)*p.drift*0.7
    const pulse = 0.4 + Math.sin(sec*2 + p.phase)*0.6
    const a = fadeIn * pulse * p.brightness * m

    ctx.beginPath(); ctx.arc(x,y,p.size*6,0,Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a*0.06})`; ctx.fill()

    ctx.beginPath(); ctx.arc(x,y,p.size,0,Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`; ctx.fill()
  }
}

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
