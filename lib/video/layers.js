/**
 * NexControl Video — Render layers
 * Each function draws one visual layer onto the canvas
 */

import { out4, out3, inOut3, outExpo, outBack, phase } from './easing'
import { VIDEO_CONFIG as V, TIMELINE as T } from './config'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

// ── Background + Ambient ──
export function drawBackground(ctx, sec, cr, cg, cb, master) {
  const cx = V.width/2, cy = V.height/2 - 60

  ctx.fillStyle = '#010204'
  ctx.fillRect(0, 0, V.width, V.height)

  // Ambient glow
  const ga = out3(phase(sec, T.intro.start, T.intro.dur)) * (0.1 + Math.sin(sec*1.2)*0.04) * master
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 500)
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${ga})`)
  g.addColorStop(0.4, `rgba(${cr},${cg},${cb},${ga*0.25})`)
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g; ctx.fillRect(0, 0, V.width, V.height)

  // Vignette
  const vg = ctx.createRadialGradient(cx, cy, 200, cx, cy, V.height*0.7)
  vg.addColorStop(0, 'transparent')
  vg.addColorStop(1, `rgba(0,0,0,${0.5*master})`)
  ctx.fillStyle = vg; ctx.fillRect(0, 0, V.width, V.height)
}

// ── Particles ──
export function drawParticles(ctx, sec, particles, cr, cg, cb, master) {
  const cx = V.width/2, cy = V.height/2 - 60
  const pa = out4(phase(sec, 0.5, 1.5)) * master

  for (const p of particles) {
    const ang = p.a + sec * p.sp * 12
    const pulse = 0.4 + Math.sin(sec*2 + p.ph) * 0.6
    const x = cx + Math.cos(ang) * p.d
    const y = cy + Math.sin(ang) * p.d
    const a = pa * pulse * 0.5

    ctx.beginPath(); ctx.arc(x, y, p.s*5, 0, Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a*0.15})`; ctx.fill()

    ctx.beginPath(); ctx.arc(x, y, p.s, 0, Math.PI*2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`; ctx.fill()
  }
}

// ── Title text ──
export function drawTitle(ctx, sec, master) {
  const cx = V.width/2, cy = V.height/2 - 60
  const ta = out4(phase(sec, T.title.start, T.title.dur)) * (1 - out3(phase(sec, 2.5, 0.5))) * master

  ctx.save()
  ctx.globalAlpha = ta
  ctx.font = '700 18px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('RESULTADO DA OPERACAO', cx, cy - 300 + (1-out4(phase(sec, T.title.start, T.title.dur)))*30)
  ctx.restore()
}

// ── HUD Rings ──
export function drawRings(ctx, sec, goalPct, profitPct, cr, cg, cb, master) {
  const cx = V.width/2, cy = V.height/2 - 60
  const ra = out4(phase(sec, T.build.start, T.build.dur)) * master

  // Ring 1 — outer goal
  ringProg(ctx, cx, cy, 250, 2, goalPct*out4(phase(sec, T.build.start, T.build.dur)), `rgba(255,255,255,${0.1*ra})`, `rgba(255,255,255,${0.03*ra})`)

  // Ring 2 — dashed spin
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(sec*0.08); ctx.translate(-cx,-cy)
  dashedRing(ctx, cx, cy, 230, 1, `rgba(255,255,255,${0.025*ra})`, 5, 16)
  ctx.restore()

  // Ring 3 — main
  const mp = profitPct * out4(phase(sec, T.build.start, T.build.dur))
  ringProg(ctx, cx, cy, 200, 6, mp, `rgba(${cr},${cg},${cb},${0.9*ra})`, `rgba(255,255,255,${0.04*ra})`)

  // Glow sweep on tip
  if (ra > 0.3 && mp > 0) {
    const sa = -Math.PI/2 + mp*Math.PI*2
    const sx = cx+Math.cos(sa)*200, sy = cy+Math.sin(sa)*200
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 40)
    sg.addColorStop(0, `rgba(${cr},${cg},${cb},${0.5*ra})`); sg.addColorStop(1, 'transparent')
    ctx.fillStyle = sg; ctx.fillRect(sx-40, sy-40, 80, 80)
  }

  // Ring 4 — dashed reverse
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(-sec*0.06); ctx.translate(-cx,-cy)
  dashedRing(ctx, cx, cy, 170, 1, `rgba(${cr},${cg},${cb},${0.08*ra})`, 3, 13)
  ctx.restore()

  // Ring 5 — inner thin
  ringProg(ctx, cx, cy, 148, 1, 0, 'transparent', `rgba(255,255,255,${0.02*ra})`)
}

// ── Value (count-up + impact) ──
export function drawValue(ctx, sec, value, isPos, metasFechadas, cr, cg, cb, master) {
  const cx = V.width/2, cy = V.height/2 - 60
  const na = out4(Math.min(1, phase(sec, T.countup.start, 0.6))) * master
  const cv = Math.abs(value) * outExpo(phase(sec, T.countup.start, T.countup.dur))

  const pImpact = phase(sec, T.impact.start, T.impact.dur)
  const pStable = phase(sec, T.stable.start, T.stable.dur)
  const ns = 0.8 + outBack(pImpact)*0.25 + Math.sin(sec*1.5)*0.01*out3(pStable)

  ctx.save(); ctx.translate(cx, cy); ctx.scale(ns, ns)

  ctx.shadowColor = `rgba(${cr},${cg},${cb},${0.5*na})`
  ctx.shadowBlur = 80

  ctx.font = '900 64px JetBrains Mono, monospace'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},${na*0.85})`
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  ctx.fillText(`${isPos?'+':'-'}R$`, 0, -15)

  ctx.font = '900 80px JetBrains Mono, monospace'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},${na})`
  ctx.textBaseline = 'top'
  ctx.fillText(fmt(cv), 0, 0)

  ctx.shadowBlur = 0

  // Shine sweep at impact
  if (pImpact > 0 && pImpact < 1) {
    const shineX = -200 + out4(pImpact) * 400
    const sg = ctx.createLinearGradient(shineX-60, 0, shineX+60, 0)
    sg.addColorStop(0, 'transparent')
    sg.addColorStop(0.5, `rgba(255,255,255,${0.15*(1-pImpact)})`)
    sg.addColorStop(1, 'transparent')
    ctx.fillStyle = sg; ctx.fillRect(-200, -80, 400, 160)
  }

  // Meta count
  ctx.font = '500 16px Inter, sans-serif'
  ctx.fillStyle = `rgba(255,255,255,${0.25*na*out3(pStable)})`
  ctx.textBaseline = 'top'
  ctx.fillText(`${metasFechadas} metas fechadas`, 0, 70)
  ctx.restore()
}

// ── Confirm text ──
export function drawConfirmText(ctx, sec, master) {
  const cx = V.width/2, cy = V.height/2 - 60
  const a = out4(phase(sec, T.confirm.start, T.confirm.dur)) * master
  ctx.font = '700 15px Inter, sans-serif'
  ctx.fillStyle = `rgba(255,255,255,${0.3*a})`
  ctx.textAlign = 'center'
  ctx.fillText('LUCRO CONFIRMADO', cx, cy + 330 - (1-out4(phase(sec, T.confirm.start, T.confirm.dur)))*20)
}

// ── Brand outro ──
export function drawBrand(ctx, sec, master) {
  const cx = V.width/2
  const ba = out4(phase(sec, T.brand.start, T.brand.dur)) * master

  ctx.fillStyle = `rgba(229,57,53,${ba})`
  roundRect(ctx, cx-60, V.height-160, 30, 30, 7); ctx.fill()

  ctx.fillStyle = `rgba(255,255,255,${0.5*ba})`; ctx.fillRect(cx-57, V.height-148, 5, 8)
  ctx.fillStyle = `rgba(255,255,255,${ba})`; ctx.fillRect(cx-50, V.height-153, 5, 13)
  ctx.fillStyle = `rgba(255,255,255,${0.7*ba})`; ctx.fillRect(cx-43, V.height-145, 5, 5)

  ctx.font = '700 20px Inter, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillStyle = `rgba(255,255,255,${0.45*ba})`; ctx.fillText('Nex', cx-22, V.height-143)
  ctx.fillStyle = `rgba(255,68,68,${0.7*ba})`; ctx.fillText('Control', cx+8, V.height-143)

  ctx.font = '400 12px Inter, sans-serif'; ctx.textAlign = 'center'
  ctx.fillStyle = `rgba(255,255,255,${0.2*ba})`
  ctx.fillText('Sistema operacional', cx, V.height-115)

  const ds = new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'})
  ctx.fillStyle = `rgba(255,255,255,${0.12*ba})`
  ctx.fillText(ds, cx, V.height-95)
}

// ── Helpers ──
function ringProg(ctx, cx, cy, r, lw, prog, color, track) {
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2)
  ctx.strokeStyle = track; ctx.lineWidth = lw; ctx.stroke()
  if (prog > 0) {
    ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*prog)
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke()
  }
}

function dashedRing(ctx, cx, cy, r, lw, color, dl, gl) {
  const c = 2*Math.PI*r, n = Math.floor(c/(dl+gl))
  ctx.strokeStyle = color; ctx.lineWidth = lw
  for (let i=0; i<n; i++) {
    const s = (i/n)*Math.PI*2, e = s+(dl/c)*Math.PI*2
    ctx.beginPath(); ctx.arc(cx,cy,r,s,e); ctx.stroke()
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y)
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r)
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h)
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r)
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}
