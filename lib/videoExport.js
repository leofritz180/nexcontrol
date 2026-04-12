/**
 * NexControl — Cinematic Video Export Engine v2
 * 1080x1920 @ 60fps, 7s duration
 * Timeline: intro → build → impact → resolve
 */

const W = 1080, H = 1920, FPS = 60, DUR = 7
const FRAMES = FPS * DUR
const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

const ease = {
  out4: t => 1 - Math.pow(1-t,4),
  out3: t => 1 - Math.pow(1-t,3),
  inOut3: t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  outExpo: t => t===1 ? 1 : 1-Math.pow(2,-10*t),
  outBack: t => { const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2) },
}

function phase(sec, start, dur) { return Math.max(0, Math.min(1, (sec-start)/dur)) }

export async function generateVideo({ value, metasFechadas, goalPct, onProgress }) {
  const isPos = value >= 0
  const abs = Math.abs(value)
  const cr = isPos?34:239, cg = isPos?197:68, cb = isPos?94:68
  const hex = isPos ? '#22C55E' : '#EF4444'

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  const particles = Array.from({length:24}, () => ({
    a: Math.random()*Math.PI*2, d: 200+Math.random()*80,
    s: 1+Math.random()*2.5, sp: 0.003+Math.random()*0.005,
    ph: Math.random()*Math.PI*2,
  }))

  const stream = canvas.captureStream(FPS)
  const recorder = new MediaRecorder(stream, { mimeType:'video/webm;codecs=vp9', videoBitsPerSecond:8000000 })
  const chunks = []
  recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data) }

  return new Promise(resolve => {
    recorder.onstop = () => resolve(new Blob(chunks,{type:'video/webm'}))
    recorder.start()
    let f = 0

    function draw() {
      if (f >= FRAMES) { recorder.stop(); return }
      const t = f/FRAMES, sec = f/FPS
      if (onProgress) onProgress(Math.round(t*100))

      ctx.fillStyle = '#010204'
      ctx.fillRect(0,0,W,H)
      const cx = W/2, cy = H/2 - 60

      // Phases
      const pIntro = phase(sec, 0, 1.2)
      const pBuild = phase(sec, 0.8, 2)
      const pImpact = phase(sec, 3, 0.6)
      const pStable = phase(sec, 3.5, 1)
      const pText = phase(sec, 4.8, 0.6)
      const pBrand = phase(sec, 5.5, 0.6)
      const pFade = phase(sec, 6, 1)
      const master = 1 - ease.inOut3(pFade)

      // Zoom
      const z = 1 + ease.out4(pIntro)*0.06 + ease.outBack(pImpact)*0.04 - ease.inOut3(phase(sec,4.5,2.5))*0.06
      ctx.save()
      ctx.translate(cx,cy); ctx.scale(z,z); ctx.translate(-cx,-cy)

      // === AMBIENT ===
      const ga = ease.out3(pIntro) * (0.1 + Math.sin(sec*1.2)*0.04) * master
      const g1 = ctx.createRadialGradient(cx,cy,0,cx,cy,500)
      g1.addColorStop(0,`rgba(${cr},${cg},${cb},${ga})`)
      g1.addColorStop(0.4,`rgba(${cr},${cg},${cb},${ga*0.25})`)
      g1.addColorStop(1,'transparent')
      ctx.fillStyle = g1; ctx.fillRect(0,0,W,H)

      // === VIGNETTE ===
      const vg = ctx.createRadialGradient(cx,cy,200,cx,cy,H*0.7)
      vg.addColorStop(0,'transparent')
      vg.addColorStop(1,`rgba(0,0,0,${0.5*master})`)
      ctx.fillStyle = vg; ctx.fillRect(0,0,W,H)

      // === PARTICLES ===
      const pa = ease.out4(phase(sec,0.5,1.5)) * master
      particles.forEach(p => {
        const ang = p.a + sec*p.sp*12
        const pulse = 0.4 + Math.sin(sec*2+p.ph)*0.6
        const x = cx+Math.cos(ang)*p.d, y = cy+Math.sin(ang)*p.d
        const a = pa*pulse*0.5
        // Glow
        ctx.beginPath(); ctx.arc(x,y,p.s*5,0,Math.PI*2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a*0.15})`; ctx.fill()
        // Dot
        ctx.beginPath(); ctx.arc(x,y,p.s,0,Math.PI*2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`; ctx.fill()
      })

      // === TITLE (intro) ===
      const ta = ease.out4(phase(sec,0.3,0.8)) * (1 - ease.out3(phase(sec,2.5,0.5))) * master
      ctx.save()
      ctx.globalAlpha = ta
      ctx.font = '700 18px Inter, sans-serif'
      ctx.fillStyle = `rgba(255,255,255,0.4)`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('RESULTADO DA OPERACAO', cx, cy - 300 + (1-ease.out4(phase(sec,0.3,0.8)))*30)
      ctx.restore()

      // === RINGS ===
      const ra = ease.out4(pBuild) * master

      // Ring 1 — outer
      ringProgress(ctx,cx,cy,250,2,goalPct*ease.out4(pBuild),`rgba(255,255,255,${0.1*ra})`,`rgba(255,255,255,${0.03*ra})`)

      // Ring 2 — dashed spin
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(sec*0.08); ctx.translate(-cx,-cy)
      dashedRing(ctx,cx,cy,230,1,`rgba(255,255,255,${0.025*ra})`,5,16)
      ctx.restore()

      // Ring 3 — main
      const mp = Math.min(1,abs/(abs*1.5||1))*ease.out4(pBuild)
      ringProgress(ctx,cx,cy,200,6,mp,`rgba(${cr},${cg},${cb},${0.9*ra})`,`rgba(255,255,255,${0.04*ra})`)

      // Glow sweep on ring tip
      if (ra > 0.3 && mp > 0) {
        const sa = -Math.PI/2 + mp*Math.PI*2
        const sx=cx+Math.cos(sa)*200, sy=cy+Math.sin(sa)*200
        const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,40)
        sg.addColorStop(0,`rgba(${cr},${cg},${cb},${0.5*ra})`); sg.addColorStop(1,'transparent')
        ctx.fillStyle=sg; ctx.fillRect(sx-40,sy-40,80,80)
      }

      // Ring 4 — dashed reverse
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(-sec*0.06); ctx.translate(-cx,-cy)
      dashedRing(ctx,cx,cy,170,1,`rgba(${cr},${cg},${cb},${0.08*ra})`,3,13)
      ctx.restore()

      // Ring 5 — inner thin
      ringProgress(ctx,cx,cy,148,1,0,`rgba(255,255,255,${0.02*ra})`,`rgba(255,255,255,${0.02*ra})`)

      // === VALUE ===
      const na = ease.out4(Math.min(1,phase(sec,1.5,0.6))) * master
      const cv = abs * ease.outExpo(phase(sec,1.5,2))
      const ns = 0.8 + ease.outBack(pImpact)*0.25 + Math.sin(sec*1.5)*0.01*ease.out3(pStable)

      ctx.save(); ctx.translate(cx,cy); ctx.scale(ns,ns)

      // Value glow
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

      // Shine sweep across number (at impact)
      if (pImpact > 0 && pImpact < 1) {
        const shineX = -200 + ease.out4(pImpact) * 400
        const sg = ctx.createLinearGradient(shineX-60,0,shineX+60,0)
        sg.addColorStop(0,'transparent')
        sg.addColorStop(0.5,`rgba(255,255,255,${0.15*(1-pImpact)})`)
        sg.addColorStop(1,'transparent')
        ctx.fillStyle = sg; ctx.fillRect(-200,-80,400,160)
      }

      // Metas count
      ctx.font = '500 16px Inter, sans-serif'
      ctx.fillStyle = `rgba(255,255,255,${0.25*na*ease.out3(pStable)})`
      ctx.textBaseline = 'top'
      ctx.fillText(`${metasFechadas} metas fechadas`, 0, 70)
      ctx.restore()

      // === TEXT (post-impact) ===
      const tta = ease.out4(pText) * master
      ctx.font = '700 15px Inter, sans-serif'
      ctx.fillStyle = `rgba(255,255,255,${0.3*tta})`
      ctx.textAlign = 'center'
      ctx.fillText('LUCRO CONFIRMADO', cx, cy + 330 - (1-ease.out4(pText))*20)

      // === BRAND ===
      const ba = ease.out4(pBrand) * master

      // Logo
      ctx.fillStyle = `rgba(229,57,53,${ba})`
      roundRect(ctx,cx-60,H-160,30,30,7); ctx.fill()

      ctx.fillStyle=`rgba(255,255,255,${0.5*ba})`; ctx.fillRect(cx-57,H-148,5,8)
      ctx.fillStyle=`rgba(255,255,255,${ba})`; ctx.fillRect(cx-50,H-153,5,13)
      ctx.fillStyle=`rgba(255,255,255,${0.7*ba})`; ctx.fillRect(cx-43,H-145,5,5)

      ctx.font='700 20px Inter, sans-serif'
      ctx.textAlign='left'; ctx.textBaseline='middle'
      ctx.fillStyle=`rgba(255,255,255,${0.45*ba})`; ctx.fillText('Nex',cx-22,H-143)
      ctx.fillStyle=`rgba(255,68,68,${0.7*ba})`; ctx.fillText('Control',cx+8,H-143)

      ctx.font='400 12px Inter, sans-serif'; ctx.textAlign='center'
      ctx.fillStyle=`rgba(255,255,255,${0.2*ba})`
      ctx.fillText('Sistema operacional',cx,H-115)

      const ds = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
      ctx.fillStyle=`rgba(255,255,255,${0.12*ba})`
      ctx.fillText(ds,cx,H-95)

      ctx.restore()
      f++
      requestAnimationFrame(draw)
    }
    draw()
  })
}

function ringProgress(ctx,cx,cy,r,lw,prog,color,track) {
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2)
  ctx.strokeStyle=track; ctx.lineWidth=lw; ctx.stroke()
  if(prog>0) {
    ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*prog)
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.stroke()
  }
}
function dashedRing(ctx,cx,cy,r,lw,color,dl,gl) {
  const c=2*Math.PI*r, n=Math.floor(c/(dl+gl))
  ctx.strokeStyle=color; ctx.lineWidth=lw
  for(let i=0;i<n;i++){
    const s=(i/n)*Math.PI*2, e=s+(dl/c)*Math.PI*2
    ctx.beginPath(); ctx.arc(cx,cy,r,s,e); ctx.stroke()
  }
}
function roundRect(ctx,x,y,w,h,r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y)
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r)
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h)
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r)
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}
