/**
 * NexControl Video — Render Layers v3
 * 5 scenes, each function = 1 visual layer
 */
import { out3, out4, inOut3, outExpo, outBack, pt } from './easing'
import { V, T, C } from './config'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const cx = V.w/2, cy = V.h/2 - 80

// ════════════════════════════════════════
// SCENE 1 — ENTRANCE
// ════════════════════════════════════════

export function drawScene1(ctx, sec, cr, cg, cb, master) {
  // Background
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, V.w, V.h)

  // Central glow rising
  const ga = out4(pt(sec, T.glowRise)) * (0.12 + Math.sin(sec*1.2)*0.04) * master
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 500)
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${ga})`)
  g.addColorStop(0.35, `rgba(${cr},${cg},${cb},${ga*0.2})`)
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g; ctx.fillRect(0, 0, V.w, V.h)

  // Vignette
  const vg = ctx.createRadialGradient(cx, cy, 180, cx, cy, V.h*0.65)
  vg.addColorStop(0, 'transparent')
  vg.addColorStop(1, `rgba(0,0,0,${0.55*master})`)
  ctx.fillStyle = vg; ctx.fillRect(0, 0, V.w, V.h)

  // Title
  const ta = out4(pt(sec, T.titleIn)) * (1 - out3(pt(sec, T.titleOut))) * master
  const ty = (1 - out4(pt(sec, T.titleIn))) * 25
  ctx.save(); ctx.globalAlpha = ta
  ctx.font = '600 16px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.letterSpacing = '8px'
  ctx.fillText('R E S U L T A D O   D A   O P E R A C A O', cx, cy - 320 + ty)
  ctx.restore()
}

export function drawParticles(ctx, sec, particles, cr, cg, cb, master) {
  const pa = out4(pt(sec, T.particles)) * master
  for (const p of particles) {
    const ang = p.a + sec * p.sp * 10
    const pulse = 0.3 + Math.sin(sec*2.2 + p.ph) * 0.7
    const x = cx + Math.cos(ang) * p.d
    const y = cy + Math.sin(ang) * p.d
    const a = pa * pulse * 0.45
    // Outer glow
    ctx.beginPath(); ctx.arc(x, y, p.s*6, 0, Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a*0.12})`; ctx.fill()
    // Core
    ctx.beginPath(); ctx.arc(x, y, p.s, 0, Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`; ctx.fill()
  }
}

// ════════════════════════════════════════
// SCENE 2 — RING CONSTRUCTION
// ════════════════════════════════════════

export function drawRings(ctx, sec, goalPct, profitPct, cr, cg, cb, master) {
  // Ring 1 — outer goal (blurred feel via double stroke)
  const r1a = out4(pt(sec, T.ringOuter)) * master
  ringStroke(ctx, cx, cy, 260, 2, goalPct*out4(pt(sec,T.ringOuter)), `rgba(255,255,255,${0.08*r1a})`, `rgba(255,255,255,${0.025*r1a})`)
  ringStroke(ctx, cx, cy, 262, 1, goalPct*out4(pt(sec,T.ringOuter)), `rgba(255,255,255,${0.04*r1a})`, 'transparent')

  // Ring 2 — dashed decorative (rotating)
  const r2a = out4(pt(sec, T.ringDeco)) * master
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(sec*0.06); ctx.translate(-cx,-cy)
  dashedCircle(ctx, cx, cy, 238, 1, `rgba(255,255,255,${0.03*r2a})`, 4, 18)
  ctx.restore()

  // Ring 3 — main profit (thick, glowing)
  const r3a = out4(pt(sec, T.ringMain)) * master
  const mp = profitPct * out4(pt(sec, T.ringMain))
  ringStroke(ctx, cx, cy, 210, 6, mp, `rgba(${cr},${cg},${cb},${0.9*r3a})`, `rgba(255,255,255,${0.035*r3a})`)

  // Glow sweep on ring tip
  if (r3a > 0.3 && mp > 0) {
    const sa = -Math.PI/2 + mp*Math.PI*2
    const sx = cx+Math.cos(sa)*210, sy = cy+Math.sin(sa)*210
    const sg = ctx.createRadialGradient(sx,sy,0,sx,sy,35)
    sg.addColorStop(0,`rgba(${cr},${cg},${cb},${0.55*r3a})`); sg.addColorStop(1,'transparent')
    ctx.fillStyle = sg; ctx.fillRect(sx-35,sy-35,70,70)
  }

  // Ring 4 — inner dashed (reverse)
  const r4a = out4(pt(sec, T.ringInner)) * master
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(-sec*0.04); ctx.translate(-cx,-cy)
  dashedCircle(ctx, cx, cy, 180, 1, `rgba(${cr},${cg},${cb},${0.09*r4a})`, 3, 14)
  ctx.restore()

  // Ring 5 — innermost thin
  ringStroke(ctx, cx, cy, 155, 1, 0, 'transparent', `rgba(255,255,255,${0.02*r4a})`)
}

// ════════════════════════════════════════
// SCENE 3 — VALUE IMPACT
// ════════════════════════════════════════

export function drawValue(ctx, sec, value, isPos, metasFechadas, cr, cg, cb, master) {
  const absVal = Math.abs(value)
  const countProg = outExpo(pt(sec, T.countUp))
  const current = absVal * countProg
  const impactProg = pt(sec, T.impact)
  const scale = 0.8 + out4(Math.min(1, pt(sec, T.countUp)/0.5)) * 0.2
    + (impactProg > 0 ? outBack(impactProg) * 0.12 : 0)
    + Math.sin(sec*1.5) * 0.008 * out3(pt(sec,[4.3,1]))

  const na = out4(Math.min(1, pt(sec, T.countUp)/0.4)) * master

  ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale)

  // Shadow glow
  ctx.shadowColor = `rgba(${cr},${cg},${cb},${0.5*na})`
  ctx.shadowBlur = 90

  // Prefix
  ctx.font = '900 60px JetBrains Mono, monospace'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},${na*0.8})`
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  ctx.fillText(`${isPos?'+':'-'}R$`, 0, -18)

  // Value
  ctx.font = '900 76px JetBrains Mono, monospace'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},${na})`
  ctx.textBaseline = 'top'
  ctx.fillText(fmt(current), 0, -2)

  ctx.shadowBlur = 0

  // Shine sweep at impact
  if (impactProg > 0 && impactProg < 1) {
    const shX = -220 + out4(impactProg) * 440
    const sg = ctx.createLinearGradient(shX-70,0,shX+70,0)
    sg.addColorStop(0,'transparent')
    sg.addColorStop(0.5,`rgba(255,255,255,${0.18*(1-impactProg)})`)
    sg.addColorStop(1,'transparent')
    ctx.fillStyle = sg; ctx.fillRect(-220,-90,440,170)
  }

  // Meta count
  const metaA = out4(pt(sec, T.metaText)) * master
  ctx.font = '500 16px Inter, sans-serif'
  ctx.fillStyle = `rgba(255,255,255,${0.28*metaA})`
  ctx.textBaseline = 'top'
  ctx.fillText(`${metasFechadas} metas fechadas`, 0, 72)

  ctx.restore()
}

// ════════════════════════════════════════
// SCENE 4 — COMPLEMENTARY DATA
// ════════════════════════════════════════

export function drawData(ctx, sec, stats, master) {
  const items = [
    { l:'DEPOSITADO', v:`R$ ${fmt(stats.dep||0)}` },
    { l:'SACADO', v:`R$ ${fmt(stats.saq||0)}` },
    { l:'OPERADORES', v:String(stats.ops||0) },
    { l:'ACERTO', v:`${stats.taxa||0}%` },
  ]

  const baseY = cy + 380

  items.forEach((item, i) => {
    const delay = T.dataStagger * i
    const a = out4(Math.max(0, Math.min(1, (sec - T.dataIn[0] - delay) / T.dataIn[1]))) * master
    const slideY = (1 - a) * 15
    const y = baseY + i * 44 + slideY

    ctx.save(); ctx.globalAlpha = a

    // Label
    ctx.font = '600 11px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(item.l, cx - 160, y)

    // Value
    ctx.font = '700 15px JetBrains Mono, monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.textAlign = 'right'
    ctx.fillText(item.v, cx + 160, y)

    // Separator
    if (i < items.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx-160, y+22); ctx.lineTo(cx+160, y+22); ctx.stroke()
    }

    ctx.restore()
  })
}

// ════════════════════════════════════════
// SCENE 5 — BRAND OUTRO
// ════════════════════════════════════════

export function drawBrand(ctx, sec, master) {
  const ba = out4(pt(sec, T.brandIn)) * master
  const brandY = V.h - 150
  const brandScale = 0.9 + out4(pt(sec, T.brandIn)) * 0.1

  ctx.save(); ctx.translate(cx, brandY); ctx.scale(brandScale, brandScale)
  ctx.globalAlpha = ba

  // Logo square
  ctx.fillStyle = C.brand
  roundRect(ctx, -55, -16, 32, 32, 7); ctx.fill()

  // Logo icon
  ctx.fillStyle = `rgba(255,255,255,0.5)`; ctx.fillRect(-52,-4,5,8)
  ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.fillRect(-45,-9,5,13)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-38,-1,5,5)

  // Text
  ctx.font = '700 22px Inter, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillText('Nex', -15, 0)
  ctx.fillStyle = 'rgba(255,68,68,0.7)'; ctx.fillText('Control', 22, 0)

  // Subtitle
  ctx.font = '400 11px Inter, sans-serif'; ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillText('Sistema operacional', 0, 26)

  // Date
  const ds = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillText(ds, 0, 46)

  ctx.restore()
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════

function ringStroke(ctx, x, y, r, lw, prog, color, track) {
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2)
  ctx.strokeStyle = track; ctx.lineWidth = lw; ctx.stroke()
  if (prog > 0) {
    ctx.beginPath(); ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*prog)
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke()
  }
}

function dashedCircle(ctx, x, y, r, lw, color, dl, gl) {
  const c = 2*Math.PI*r, n = Math.floor(c/(dl+gl))
  ctx.strokeStyle = color; ctx.lineWidth = lw
  for (let i=0; i<n; i++) {
    const s=(i/n)*Math.PI*2, e=s+(dl/c)*Math.PI*2
    ctx.beginPath(); ctx.arc(x,y,r,s,e); ctx.stroke()
  }
}

function roundRect(ctx,x,y,w,h,r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y)
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r)
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h)
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r)
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}
