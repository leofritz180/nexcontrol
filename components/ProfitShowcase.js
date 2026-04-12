'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const ease = [0.33,1,0.68,1]

function CountUpValue({ value, duration = 2200 }) {
  const [display, setDisplay] = useState('0,00')
  const ref = useRef(null)
  useEffect(() => {
    const num = Math.abs(Number(value || 0))
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setDisplay(fmt(num * (1 - Math.pow(1 - p, 4))))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return display
}

function Ring({ progress, size, strokeWidth, color, delay = 0, glow = true }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  return (
    <motion.circle
      cx={size/2} cy={size/2} r={r}
      fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={circ}
      initial={{ strokeDashoffset: circ }}
      animate={{ strokeDashoffset: circ * (1 - Math.max(0, Math.min(1, progress))) }}
      transition={{ duration: 2.2, delay, ease }}
      style={glow ? { filter: `drop-shadow(0 0 10px ${color})` } : {}}
    />
  )
}

function Particles({ color, count = 14, radius = 200 }) {
  const dots = useMemo(() => Array.from({length:count}, (_, i) => ({
    angle: (i / count) * 360,
    dist: radius + Math.random() * 50 - 25,
    size: 1 + Math.random() * 2,
    dur: 5 + Math.random() * 7,
    del: Math.random() * 5,
    opacity: 0.1 + Math.random() * 0.3,
  })), [count, radius])

  return dots.map((d, i) => {
    const rad = (d.angle * Math.PI) / 180
    return (
      <motion.div key={i}
        animate={{ opacity: [d.opacity * 0.2, d.opacity, d.opacity * 0.2], scale: [0.6, 1.3, 0.6] }}
        transition={{ duration: d.dur, delay: d.del, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          left: `calc(50% + ${Math.cos(rad) * d.dist}px)`,
          top: `calc(50% + ${Math.sin(rad) * d.dist}px)`,
          width: d.size, height: d.size, borderRadius: '50%',
          background: color, boxShadow: `0 0 ${d.size * 4}px ${color}`,
          pointerEvents: 'none',
        }}
      />
    )
  })
}

export default function ProfitShowcase({ stats, goalData, operators, metas, onClose }) {
  const [mode, setMode] = useState('total')
  const [printMode, setPrintMode] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const captureRef = useRef(null)

  const fechadas = (metas||[]).filter(m => m.status_fechamento === 'fechada' && m.fechada_em)
  const now = new Date()
  const todayStr = now.toDateString()
  const d7 = new Date(now); d7.setDate(d7.getDate() - 7)

  const values = useMemo(() => ({
    total: fechadas.reduce((a, m) => a + Number(m.lucro_final || 0), 0),
    today: fechadas.filter(m => new Date(m.fechada_em).toDateString() === todayStr).reduce((a, m) => a + Number(m.lucro_final || 0), 0),
    week: fechadas.filter(m => new Date(m.fechada_em) >= d7).reduce((a, m) => a + Number(m.lucro_final || 0), 0),
  }), [metas])

  const val = values[mode]
  const isPos = val >= 0
  const c = isPos ? '#22C55E' : '#EF4444'
  const cDim = isPos ? 'rgba(34,197,94,' : 'rgba(239,68,68,'
  const goalPct = (goalData?.target || 0) > 0 ? Math.min(1, (goalData?.lucroFinalTotal || 0) / goalData.target) : 0
  const profitPct = Math.min(1, Math.abs(val) / Math.max(1, (goalData?.target) || Math.abs(val) * 1.5))

  const S = printMode ? 420 : 360

  const exportImage = useCallback(async () => {
    if (exporting || !captureRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#010204',
        scale: 2,
        useCORS: true,
        logging: false,
        width: 1080,
        height: 1920,
      })
      const link = document.createElement('a')
      const d = new Date()
      link.download = `nexcontrol-resultado-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Export failed:', e)
    }
    setExporting(false)
  }, [exporting])

  const exportVideo = useCallback(async () => {
    if (generatingVideo) return
    setGeneratingVideo(true)
    setVideoProgress(0)
    try {
      const { renderVideo } = await import('../lib/video')
      const blob = await renderVideo({
        value: val,
        metasFechadas: fechadas.length,
        goalPct,
        onProgress: setVideoProgress,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const d = new Date()
      link.download = `nexcontrol-resultado-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.webm`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Video export failed:', e)
    }
    setGeneratingVideo(false)
  }, [generatingVideo, val, fechadas.length, goalPct])

  // Data computed above callbacks

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: '#010204',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !printMode) onClose() }}
    >
      {/* === AMBIENT === */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
          width: printMode ? 900 : 700, height: printMode ? 900 : 700, borderRadius: '50%',
          background: `radial-gradient(circle, ${cDim}${printMode?'0.12':'0.08'}), ${cDim}0.03) 35%, transparent 60%)`,
          filter: `blur(${printMode?100:80}px)`, pointerEvents: 'none',
        }}
      />

      {/* === TOP BAR (normal mode only) === */}
      {!printMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ position: 'absolute', top: 24, left: 32, right: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={12} height={12} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>NexControl</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPrintMode(true)} style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
              Modo print
            </button>
            <button onClick={onClose} style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
              Fechar
            </button>
          </div>
        </motion.div>
      )}

      {/* Print controls */}
      {printMode && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', gap: 8 }}>
          <button onClick={exportVideo} disabled={generatingVideo}
            style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, cursor: generatingVideo?'wait':'pointer', border: '1px solid rgba(229,57,53,0.3)', background: 'rgba(229,57,53,0.15)', color: '#ff6b6b', opacity: generatingVideo ? 0.7 : 1 }}>
            {generatingVideo ? `Gerando video ${videoProgress}%` : 'Gerar video'}
          </button>
          <button onClick={exportImage} disabled={exporting}
            style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, cursor: exporting?'wait':'pointer', border: 'none', background: '#e53935', color: 'white', opacity: exporting ? 0.6 : 1 }}>
            {exporting ? 'Gerando...' : 'Baixar imagem'}
          </button>
          <button onClick={() => setPrintMode(false)}
            style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
            Sair
          </button>
        </div>
      )}

      {/* ══════════════════════════════════
         PRINT MODE — full visual
      ══════════════════════════════════ */}
      {printMode && (<>
        {/* Vignette */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 70% at 50% 45%, transparent 40%, rgba(0,0,0,0.6) 100%)', pointerEvents:'none', zIndex:1 }}/>

        {/* TITLE */}
        <motion.p initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          style={{ fontSize:13, color:'rgba(255,255,255,0.35)', letterSpacing:'0.25em', textTransform:'uppercase', fontWeight:700, marginBottom:40, zIndex:2 }}>
          Resultado da operacao
        </motion.p>

        {/* BIG HUD */}
        <motion.div
          initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}}
          transition={{duration:1,delay:0.1,ease}}
          style={{ position:'relative', width:480, height:480, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>

          <Particles color={c} count={22} radius={260}/>

          <svg width={480} height={480} style={{position:'absolute',transform:'rotate(-90deg)'}}>
            <circle cx={240} cy={240} r={234} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={2}/>
            <Ring progress={goalPct} size={480} strokeWidth={2} color="rgba(255,255,255,0.1)" delay={0.5} glow={false}/>
          </svg>

          <motion.svg width={440} height={440} style={{position:'absolute'}}
            animate={{rotate:360}} transition={{duration:60,repeat:Infinity,ease:'linear'}}>
            <circle cx={220} cy={220} r={216} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={1} strokeDasharray="5 16"/>
          </motion.svg>

          <svg width={400} height={400} style={{position:'absolute',transform:'rotate(-90deg)'}}>
            <circle cx={200} cy={200} r={194} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={6}/>
            <Ring progress={profitPct} size={400} strokeWidth={6} color={c} delay={0.3}/>
          </svg>

          <motion.svg width={350} height={350} style={{position:'absolute'}}
            animate={{rotate:-360}} transition={{duration:90,repeat:Infinity,ease:'linear'}}>
            <circle cx={175} cy={175} r={171} fill="none" stroke={`${cDim}0.1)`} strokeWidth={1} strokeDasharray="3 12"/>
          </motion.svg>

          <svg width={310} height={310} style={{position:'absolute',transform:'rotate(-90deg)'}}>
            <circle cx={155} cy={155} r={151} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={1}/>
          </svg>

          {/* Center glow + value */}
          <motion.div
            animate={{boxShadow:[
              `0 0 80px ${cDim}0.08), 0 0 160px ${cDim}0.04)`,
              `0 0 120px ${cDim}0.16), 0 0 240px ${cDim}0.06)`,
              `0 0 80px ${cDim}0.08), 0 0 160px ${cDim}0.04)`,
            ]}}
            transition={{duration:3.5,repeat:Infinity,ease:'easeInOut'}}
            style={{
              width:280, height:280, borderRadius:'50%',
              background:`radial-gradient(circle, ${cDim}0.06), transparent 65%)`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            }}>
            <motion.p
              animate={{scale:[1,1.02,1]}}
              transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}
              style={{
                fontFamily:"'JetBrains Mono', monospace", fontSize:58, fontWeight:900,
                color:c, lineHeight:1, letterSpacing:'-0.03em', margin:0, textAlign:'center',
                textShadow:`0 0 50px ${cDim}0.45), 0 0 100px ${cDim}0.2), 0 0 150px ${cDim}0.1)`,
              }}>
              {isPos?'+':'-'}R$<br/>
              <span style={{fontSize:62}}><CountUpValue value={val} key={'print-'+mode}/></span>
            </motion.p>
            <p style={{fontSize:13, color:'rgba(255,255,255,0.25)', marginTop:14}}>
              {fechadas.length} metas fechadas
            </p>
          </motion.div>
        </motion.div>

        {/* FOOTER */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
          style={{marginTop:48, display:'flex', flexDirection:'column', alignItems:'center', gap:14, zIndex:2}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:30,height:30,borderRadius:7,background:'#e53935',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width={13} height={13} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
            </div>
            <div>
              <span style={{fontSize:16, color:'rgba(255,255,255,0.45)', fontWeight:700}}>
                Nex<span style={{color:'#ff4444'}}>Control</span>
              </span>
              <p style={{fontSize:10, color:'rgba(255,255,255,0.15)', margin:'2px 0 0', letterSpacing:'0.08em'}}>Sistema operacional</p>
            </div>
          </div>
          <span style={{fontSize:11, color:'rgba(255,255,255,0.12)', letterSpacing:'0.06em'}}>
            {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}
          </span>
        </motion.div>
      </>)}

      {/* ══════════════════════════════════
         NORMAL MODE — with switcher + stats
      ══════════════════════════════════ */}
      {!printMode && (<>
        {/* HUD */}
        <motion.div
          initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}}
          transition={{duration:1,delay:0.15,ease}}
          whileHover={{scale:1.03,transition:{duration:0.3}}}
          style={{position:'relative',width:360,height:360,display:'flex',alignItems:'center',justifyContent:'center'}}>

          <Particles color={c} count={14} radius={190}/>

          <svg width={360} height={360} style={{position:'absolute',transform:'rotate(-90deg)'}}>
            <circle cx={180} cy={180} r={174} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={2}/>
            <Ring progress={goalPct} size={360} strokeWidth={2} color="rgba(255,255,255,0.1)" delay={0.6} glow={false}/>
          </svg>
          <motion.svg width={330} height={330} style={{position:'absolute'}}
            animate={{rotate:360}} transition={{duration:60,repeat:Infinity,ease:'linear'}}>
            <circle cx={165} cy={165} r={161} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={1} strokeDasharray="4 14"/>
          </motion.svg>
          <svg width={300} height={300} style={{position:'absolute',transform:'rotate(-90deg)'}}>
            <circle cx={150} cy={150} r={144} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4}/>
            <Ring progress={profitPct} size={300} strokeWidth={4} color={c} delay={0.4}/>
          </svg>
          <motion.svg width={260} height={260} style={{position:'absolute'}}
            animate={{rotate:-360}} transition={{duration:90,repeat:Infinity,ease:'linear'}}>
            <circle cx={130} cy={130} r={126} fill="none" stroke={`${cDim}0.1)`} strokeWidth={1} strokeDasharray="2 10"/>
          </motion.svg>

          <motion.div
            animate={{boxShadow:[
              `0 0 60px ${cDim}0.06), 0 0 120px ${cDim}0.03)`,
              `0 0 100px ${cDim}0.12), 0 0 200px ${cDim}0.05)`,
              `0 0 60px ${cDim}0.06), 0 0 120px ${cDim}0.03)`,
            ]}}
            transition={{duration:3.5,repeat:Infinity,ease:'easeInOut'}}
            style={{
              width:220,height:220,borderRadius:'50%',
              background:`radial-gradient(circle, ${cDim}0.05), transparent 70%)`,
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            }}>
            <AnimatePresence mode="wait">
              <motion.p key={mode+'-lbl'} initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:5}} transition={{duration:0.2}}
                style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:8,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600}}>
                {mode==='total'?'Lucro total':mode==='today'?'Lucro de hoje':'Ultimos 7 dias'}
              </motion.p>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div key={mode+'-val'} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}} transition={{duration:0.3}}>
                <motion.p animate={{scale:[1,1.015,1]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}
                  style={{fontFamily:"'JetBrains Mono', monospace",fontSize:44,fontWeight:900,color:c,lineHeight:1,letterSpacing:'-0.03em',margin:0,textAlign:'center',
                    textShadow:`0 0 40px ${cDim}0.4), 0 0 80px ${cDim}0.2)`,}}>
                  {isPos?'+':'-'}R$<br/>
                  <span style={{fontSize:48}}><CountUpValue value={val} key={mode}/></span>
                </motion.p>
              </motion.div>
            </AnimatePresence>
            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.5}}
              style={{fontSize:11,color:'rgba(255,255,255,0.2)',marginTop:10}}>
              {fechadas.length} metas fechadas
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Switcher */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.7}}
          style={{display:'flex',gap:4,marginTop:40,background:'rgba(255,255,255,0.03)',borderRadius:10,padding:4,border:'1px solid rgba(255,255,255,0.04)'}}>
          {[['total','Total'],['today','Hoje'],['week','7 dias']].map(([k,l])=>(
            <motion.button key={k} onClick={()=>setMode(k)} whileTap={{scale:0.95}}
              style={{fontSize:12,fontWeight:600,padding:'8px 22px',borderRadius:8,cursor:'pointer',border:'none',transition:'all 0.2s',
                background:mode===k?'rgba(255,255,255,0.07)':'transparent',color:mode===k?'#fff':'rgba(255,255,255,0.3)',
              }}>{l}</motion.button>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.9}}
          style={{display:'flex',gap:48,marginTop:48}}>
          {[
            {l:'Depositado',v:`R$ ${fmt(stats.dep)}`},
            {l:'Sacado',v:`R$ ${fmt(stats.saq)}`},
            {l:'Operadores',v:String(operators.length)},
            {l:'Acerto',v:`${stats.taxa}%`},
          ].map(({l,v},i)=>(
            <motion.div key={l} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1+i*0.1}} style={{textAlign:'center'}}>
              <p style={{fontSize:9,color:'rgba(255,255,255,0.2)',marginBottom:6,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:600}}>{l}</p>
              <p style={{fontFamily:"'JetBrains Mono', monospace",fontSize:16,fontWeight:700,color:'rgba(255,255,255,0.55)',margin:0}}>{v}</p>
            </motion.div>
          ))}
        </motion.div>
      </>)}

      {/* === OFF-SCREEN CAPTURE CONTAINER (1080x1920 story) === */}
      {printMode && (
        <div ref={captureRef} style={{
          position: 'fixed', left: '-9999px', top: 0,
          width: 1080, height: 1920,
          background: '#010204',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Inter', -apple-system, sans-serif",
          overflow: 'hidden',
        }}>
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 800, height: 800, borderRadius: '50%',
            background: `radial-gradient(circle, ${cDim}0.12), ${cDim}0.04) 35%, transparent 60%)`,
            filter: 'blur(100px)', pointerEvents: 'none',
          }}/>

          {/* Title */}
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 80 }}>
            Resultado da operacao
          </p>

          {/* Ring visual (static SVG — no animation for capture) */}
          <div style={{ position: 'relative', width: 500, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer ring */}
            <svg width={500} height={500} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx={250} cy={250} r={244} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={3}/>
              <circle cx={250} cy={250} r={244} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={3}
                strokeLinecap="round" strokeDasharray={2*Math.PI*244}
                strokeDashoffset={2*Math.PI*244*(1-goalPct)}/>
            </svg>
            {/* Middle decorative */}
            <svg width={460} height={460} style={{ position: 'absolute' }}>
              <circle cx={230} cy={230} r={226} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="5 15"/>
            </svg>
            {/* Main ring */}
            <svg width={420} height={420} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx={210} cy={210} r={204} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6}/>
              <circle cx={210} cy={210} r={204} fill="none" stroke={c} strokeWidth={6}
                strokeLinecap="round" strokeDasharray={2*Math.PI*204}
                strokeDashoffset={2*Math.PI*204*(1-profitPct)}
                style={{ filter: `drop-shadow(0 0 12px ${c})` }}/>
            </svg>
            {/* Inner accent */}
            <svg width={370} height={370} style={{ position: 'absolute' }}>
              <circle cx={185} cy={185} r={181} fill="none" stroke={`${cDim}0.1)`} strokeWidth={1} strokeDasharray="3 12"/>
            </svg>
            {/* Center glow */}
            <div style={{
              width: 300, height: 300, borderRadius: '50%',
              background: `radial-gradient(circle, ${cDim}0.06), transparent 70%)`,
              boxShadow: `0 0 100px ${cDim}0.12), 0 0 200px ${cDim}0.06)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 72, fontWeight: 900,
                color: c, lineHeight: 1, letterSpacing: '-0.03em', margin: 0, textAlign: 'center',
                textShadow: `0 0 50px ${cDim}0.4), 0 0 100px ${cDim}0.2)`,
              }}>
                {isPos ? '+' : '-'}R$
              </p>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 78, fontWeight: 900,
                color: c, lineHeight: 1, letterSpacing: '-0.03em', margin: '8px 0 0', textAlign: 'center',
                textShadow: `0 0 50px ${cDim}0.4), 0 0 100px ${cDim}0.2)`,
              }}>
                {fmt(Math.abs(val))}
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>
                {fechadas.length} metas fechadas
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={14} height={14} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
              </div>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                Nex<span style={{ color: '#ff4444' }}>Control</span>
              </span>
            </div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.08em' }}>
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
