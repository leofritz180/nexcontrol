'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GenerateVideoButton } from './showcase/GenerateVideoButton'
import Logo, { NexIcon } from './Logo'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const ease = [0.33,1,0.68,1]

function CountUp({ value, delay=0, duration=2000 }) {
  const [d,setD] = useState('0,00')
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      started.current = true
      const num = Math.abs(Number(value||0))
      const start = performance.now()
      const tick = now => {
        const p = Math.min((now-start)/duration,1)
        setD(fmt(num*(1-Math.pow(1-p,4))))
        if(p<1) ref.current = requestAnimationFrame(tick)
      }
      ref.current = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(timer); cancelAnimationFrame(ref.current) }
  }, [value, delay])
  return d
}

// Floating particles
function Particles({ color, count=20 }) {
  const dots = useMemo(() => Array.from({length:count}, (_,i) => ({
    x: `${10+Math.random()*80}%`, y: `${10+Math.random()*80}%`,
    size: 1+Math.random()*3, dur: 4+Math.random()*6, del: Math.random()*4,
    driftX: 10+Math.random()*20, driftY: 8+Math.random()*15,
    brightness: 0.1+Math.random()*0.3,
  })), [count])

  return dots.map((d,i) => (
    <motion.div key={i}
      initial={{ opacity:0 }}
      animate={{ opacity:[d.brightness*0.3, d.brightness, d.brightness*0.3], x:[0,d.driftX,-d.driftX,0], y:[0,-d.driftY,d.driftY,0] }}
      transition={{ duration:d.dur, delay:d.del, repeat:Infinity, ease:'easeInOut' }}
      style={{
        position:'absolute', left:d.x, top:d.y,
        width:d.size, height:d.size, borderRadius:'50%',
        background:color, boxShadow:`0 0 ${d.size*6}px ${color}40`,
        pointerEvents:'none',
      }}
    />
  ))
}

export default function ProfitShowcase({ stats, goalData, operators, metas, onClose }) {
  const [mode, setMode] = useState('total')
  const [printMode, setPrintMode] = useState(false)
  const [exporting, setExporting] = useState(false)
  const captureRef = useRef(null)
  const [phase, setPhase] = useState(0) // 0=brand, 1=energy, 2=value, 3=settled

  const fechadas = (metas||[]).filter(m => m.status_fechamento==='fechada' && m.fechada_em)
  const now = new Date()
  const todayStr = now.toDateString()
  const d7 = new Date(now); d7.setDate(d7.getDate()-7)

  const values = useMemo(() => ({
    total: fechadas.reduce((a,m) => a+Number(m.lucro_final||0),0),
    today: fechadas.filter(m => new Date(m.fechada_em).toDateString()===todayStr).reduce((a,m) => a+Number(m.lucro_final||0),0),
    week: fechadas.filter(m => new Date(m.fechada_em)>=d7).reduce((a,m) => a+Number(m.lucro_final||0),0),
  }), [metas])

  const val = values[mode]
  const isPos = val >= 0
  const c = isPos ? '#22C55E' : '#EF4444'
  const cDim = isPos ? 'rgba(34,197,94,' : 'rgba(239,68,68,'
  const goalPct = (goalData?.target||0)>0 ? Math.min(1,(goalData?.lucroFinalTotal||0)/goalData.target) : 0

  // Cinematic timeline — advance phases automatically
  useEffect(() => {
    const t1 = setTimeout(()=>setPhase(1), 1500)  // energy starts
    const t2 = setTimeout(()=>setPhase(2), 3000)  // value reveals
    const t3 = setTimeout(()=>setPhase(3), 5000)  // settled
    return () => { clearTimeout(t1);clearTimeout(t2);clearTimeout(t3) }
  }, [])

  const exportImage = useCallback(async () => {
    if (exporting||!captureRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(captureRef.current, { backgroundColor:'#000', scale:2, useCORS:true, logging:false, width:1080, height:1920 })
      const link = document.createElement('a')
      const d = new Date()
      link.download = `nexcontrol-resultado-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch(e) { console.error(e) }
    setExporting(false)
  }, [exporting])

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.5 }}
      style={{ position:'fixed', inset:0, zIndex:10000, background:'#000', overflow:'hidden',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if(e.target===e.currentTarget && !printMode) onClose() }}
    >
      {/* ═══ AMBIENT ═══ */}
      <motion.div
        animate={{ opacity:[0.5,1,0.5] }}
        transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
        style={{ position:'absolute', top:'35%', left:'50%', transform:'translate(-50%,-50%)',
          width:700, height:700, borderRadius:'50%',
          background:`radial-gradient(circle, ${cDim}0.1), ${cDim}0.03) 35%, transparent 60%)`,
          filter:'blur(80px)', pointerEvents:'none',
        }}
      />
      <div style={{ position:'absolute', inset:0,
        background:'radial-gradient(ellipse 65% 60% at 50% 45%, transparent 30%, rgba(0,0,0,0.7) 100%)',
        pointerEvents:'none',
      }}/>

      {/* Particles */}
      <Particles color={c} count={25}/>

      {/* ═══ CONTROLS ═══ */}
      {!printMode && (
        <motion.div initial={{opacity:0,y:-15}} animate={{opacity:1,y:0}} transition={{delay:0.5,duration:0.4}}
          style={{ position:'absolute', top:20, left:24, right:24, display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:24, height:24, borderRadius:6, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <NexIcon size={10}/>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>NexControl</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setPrintMode(true)} style={{ fontSize:11, fontWeight:600, padding:'6px 14px', borderRadius:7, cursor:'pointer', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.4)' }}>
              Exportar
            </button>
            <button onClick={onClose} style={{ fontSize:11, fontWeight:600, padding:'6px 14px', borderRadius:7, cursor:'pointer', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.4)' }}>
              Fechar
            </button>
          </div>
        </motion.div>
      )}

      {/* Print controls */}
      {printMode && (
        <div style={{ position:'absolute', top:16, right:16, zIndex:10, display:'flex', gap:8 }}>
          <GenerateVideoButton amount={val} completedGoals={fechadas.length} goalPct={goalPct} mode={mode} stats={stats} onClose={onClose}/>
          <button onClick={exportImage} disabled={exporting}
            style={{ fontSize:11, fontWeight:600, padding:'6px 14px', borderRadius:7, cursor:exporting?'wait':'pointer', border:'none', background:'#e53935', color:'white', opacity:exporting?0.6:1 }}>
            {exporting?'Gerando...':'Baixar imagem'}
          </button>
          <button onClick={()=>setPrintMode(false)} style={{ fontSize:11, padding:'6px 12px', borderRadius:7, cursor:'pointer', border:'none', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.3)' }}>
            Voltar
          </button>
        </div>
      )}

      {/* ═══ ACT 1 — BRAND INTRO ═══ */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            key="brand-intro"
            initial={{ opacity:0, scale:0.85 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:1.05 }}
            transition={{ duration:0.8, ease }}
            style={{ position:'absolute', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}
          >
            <motion.div
              animate={{ boxShadow:['0 0 40px rgba(229,57,53,0.3)','0 0 60px rgba(229,57,53,0.5)','0 0 40px rgba(229,57,53,0.3)'] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{ width:80, height:80, borderRadius:20, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}
            >
              <NexIcon size={36}/>
            </motion.div>
            <div style={{ textAlign:'center' }}>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <span style={{ fontSize:36, fontWeight:800, color:'rgba(255,255,255,0.6)' }}>Nex</span>
                <span style={{ fontSize:36, fontWeight:800, color:'rgba(255,68,68,0.9)' }}>Control</span>
              </div>
              <motion.p initial={{opacity:0}} animate={{opacity:0.2}} transition={{delay:0.5}}
                style={{ fontSize:11, color:'white', letterSpacing:'0.2em', marginTop:10 }}>
                SISTEMA OPERACIONAL DE RESULTADOS
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ACT 2 — ENERGY + SCAN LINES ═══ */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div
            key="energy"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.6 }}
            style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}
          >
            {/* Scan lines */}
            {Array.from({length:6}).map((_,i) => (
              <motion.div key={i}
                initial={{ scaleX:0, opacity:0 }}
                animate={{ scaleX:1, opacity:0.08 }}
                transition={{ duration:0.6, delay:i*0.1, ease }}
                style={{
                  position:'absolute', top:`${38+i*4}%`, left:'20%', right:'20%', height:1,
                  background:c, transformOrigin:'center',
                }}
              />
            ))}

            {/* Vertical beam */}
            <motion.div
              initial={{ opacity:0, scaleY:0 }}
              animate={{ opacity:0.06, scaleY:1 }}
              transition={{ duration:0.8, delay:0.3 }}
              style={{
                position:'absolute', left:'48%', right:'48%', top:'25%', bottom:'25%',
                background:`linear-gradient(180deg, transparent, ${c}80, transparent)`,
                transformOrigin:'center',
              }}
            />

            {/* Corner brackets */}
            <motion.div initial={{opacity:0}} animate={{opacity:0.15}} transition={{delay:0.5,duration:0.5}}
              style={{ position:'absolute', inset:0 }}>
              {[['15%','30%','tl'],['15%','30%','tr'],['15%','30%','bl'],['15%','30%','br']].map(([w,h,pos],i) => {
                const isR = pos.includes('r'), isB = pos.includes('b')
                return (
                  <div key={i} style={{
                    position:'absolute',
                    [isB?'bottom':'top']:'28%', [isR?'right':'left']:'18%',
                    width:40, height:40,
                    borderTop: !isB?`2px solid ${c}`:'none',
                    borderBottom: isB?`2px solid ${c}`:'none',
                    borderLeft: !isR?`2px solid ${c}`:'none',
                    borderRight: isR?`2px solid ${c}`:'none',
                  }}/>
                )
              })}
            </motion.div>

            {/* Central glow intensifying */}
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ duration:1 }}
              style={{
                width:300, height:300, borderRadius:'50%',
                background:`radial-gradient(circle, ${cDim}0.12), transparent 60%)`,
                filter:'blur(40px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ACT 3+4 — VALUE + SETTLED ═══ */}
      {phase >= 2 && !printMode && (
        <motion.div
          initial={{ opacity:0, scale:0.8 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.8, ease, type:'spring', damping:15, stiffness:100 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', zIndex:2 }}
        >
          {/* Value */}
          <motion.div
            animate={{ scale:[1,1.015,1] }}
            transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
            style={{ textAlign:'center' }}
          >
            <p style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:52, fontWeight:900,
              color:c, lineHeight:1, margin:0,
              textShadow:`0 0 60px ${cDim}0.4), 0 0 120px ${cDim}0.2)`,
            }}>
              {isPos?'+':'-'}R$<br/>
              <span style={{ fontSize:58 }}><CountUp value={val} delay={0} duration={2000}/></span>
            </p>
            <motion.p initial={{opacity:0}} animate={{opacity:0.25}} transition={{delay:1.5}}
              style={{ fontSize:13, color:'white', marginTop:16 }}>
              {fechadas.length} metas fechadas
            </motion.p>
          </motion.div>

          {/* Period switcher */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:2}}
            style={{ display:'flex', gap:4, marginTop:40, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:4, border:'1px solid rgba(255,255,255,0.04)' }}>
            {[['total','Total'],['today','Hoje'],['week','7 dias']].map(([k,l]) => (
              <motion.button key={k} onClick={()=>setMode(k)} whileTap={{scale:0.95}}
                style={{ fontSize:12, fontWeight:600, padding:'8px 22px', borderRadius:8, cursor:'pointer', border:'none',
                  background:mode===k?'rgba(255,255,255,0.07)':'transparent',
                  color:mode===k?'#fff':'rgba(255,255,255,0.3)', transition:'all 0.2s',
                }}>{l}</motion.button>
            ))}
          </motion.div>

          {/* "LUCRO CONFIRMADO" */}
          <motion.p initial={{opacity:0,y:10}} animate={{opacity:0.2,y:0}} transition={{delay:2.5}}
            style={{ fontSize:13, fontWeight:700, color:'white', letterSpacing:'0.15em', marginTop:32 }}>
            LUCRO CONFIRMADO
          </motion.p>
        </motion.div>
      )}

      {/* ═══ PRINT MODE VALUE ═══ */}
      {printMode && (
        <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.5}}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', zIndex:2 }}>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em', marginBottom:32, fontWeight:700 }}>
            RESULTADO DA OPERACAO
          </p>
          <motion.p animate={{scale:[1,1.02,1]}} transition={{duration:4,repeat:Infinity}}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:58, fontWeight:900, color:c, lineHeight:1, margin:0, textAlign:'center',
              textShadow:`0 0 50px ${cDim}0.4), 0 0 100px ${cDim}0.2)`,
            }}>
            {isPos?'+':'-'}R$<br/><span style={{fontSize:62}}>{fmt(Math.abs(val))}</span>
          </motion.p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.25)', marginTop:16 }}>{fechadas.length} metas fechadas</p>
        </motion.div>
      )}

      {/* ═══ BRAND FOOTER (settled) ═══ */}
      {phase >= 3 && !printMode && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5,duration:0.8}}
          style={{ position:'absolute', bottom:40, display:'flex', flexDirection:'column', alignItems:'center', gap:12, zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <NexIcon size={12}/>
            </div>
            <span style={{ fontSize:14, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>Nex<span style={{color:'#ff4444'}}>Control</span></span>
          </div>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.12)', letterSpacing:'0.06em' }}>
            {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}
          </span>
        </motion.div>
      )}

      {/* Print footer */}
      {printMode && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}
          style={{ position:'absolute', bottom:40, display:'flex', flexDirection:'column', alignItems:'center', gap:14, zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:7, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <NexIcon size={13}/>
            </div>
            <div>
              <span style={{ fontSize:16, color:'rgba(255,255,255,0.45)', fontWeight:700 }}>Nex<span style={{color:'#ff4444'}}>Control</span></span>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.15)', margin:'2px 0 0', letterSpacing:'0.08em' }}>Sistema operacional</p>
            </div>
          </div>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.12)' }}>
            {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}
          </span>
        </motion.div>
      )}

      {/* Off-screen capture */}
      {printMode && (
        <div ref={captureRef} style={{ position:'fixed', left:'-9999px', top:0, width:1080, height:1920, background:'#000',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif", overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'35%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:800, borderRadius:'50%',
            background:`radial-gradient(circle, ${cDim}0.12), ${cDim}0.04) 35%, transparent 60%)`, filter:'blur(100px)' }}/>
          <p style={{ fontSize:18, color:'rgba(255,255,255,0.3)', letterSpacing:'0.25em', fontWeight:700, marginBottom:80 }}>RESULTADO DA OPERACAO</p>
          <div style={{ position:'relative', width:500, height:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:72, fontWeight:900, color:c, lineHeight:1, margin:0, textAlign:'center',
              textShadow:`0 0 50px ${cDim}0.4), 0 0 100px ${cDim}0.2)` }}>
              {isPos?'+':'-'}R$
            </p>
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:78, fontWeight:900, color:c, lineHeight:1, margin:'8px 0 0', textAlign:'center',
              textShadow:`0 0 50px ${cDim}0.4), 0 0 100px ${cDim}0.2)` }}>
              {fmt(Math.abs(val))}
            </p>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.25)', marginTop:16 }}>{fechadas.length} metas fechadas</p>
          </div>
          <div style={{ position:'absolute', bottom:80, display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <NexIcon size={14}/>
              </div>
              <span style={{ fontSize:20, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>Nex<span style={{color:'#ff4444'}}>Control</span></span>
            </div>
            <span style={{ fontSize:14, color:'rgba(255,255,255,0.15)', letterSpacing:'0.08em' }}>
              {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
