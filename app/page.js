'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const ease = [0.33,1,0.68,1]

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) router.push('/admin')
      else setChecking(false)
    })
  }, [])

  if (checking) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spinner" style={{ width:24, height:24, borderTopColor:'var(--t1)' }}/>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1, overflow:'hidden' }}>

      {/* Ambient */}
      <div style={{ position:'fixed', top:'-10%', left:'20%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.04), transparent 55%)', filter:'blur(80px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'5%', right:'15%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.03), transparent 55%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      {/* ═══ HERO ═══ */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', position:'relative' }}>

        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.6, ease }}
          style={{ maxWidth:580, position:'relative', zIndex:1 }}
        >
          {/* Logo */}
          <motion.div
            animate={{ boxShadow:['0 0 25px rgba(229,57,53,0.2)','0 0 45px rgba(229,57,53,0.35)','0 0 25px rgba(229,57,53,0.2)'] }}
            transition={{ duration:3, repeat:Infinity }}
            style={{ width:60, height:60, borderRadius:16, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px' }}
          >
            <svg width={26} height={26} viewBox="0 0 28 28" fill="none">
              <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
              <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
              <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
            </svg>
          </motion.div>

          <motion.h1
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.15, ease }}
            style={{ fontSize:40, fontWeight:900, letterSpacing:'-0.04em', color:'var(--t1)', margin:'0 0 14px', lineHeight:1.12 }}
          >
            Controle total da sua<br/>operacao em tempo real
          </motion.h1>

          <motion.p
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.25, ease }}
            style={{ fontSize:16, color:'var(--t2)', marginBottom:36, lineHeight:1.6 }}
          >
            Veja exatamente onde voce ganha e perde dinheiro.<br/>Sem planilhas, sem achismo.
          </motion.p>

          <motion.div
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.35, ease }}
            style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}
          >
            <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:220, justifyContent:'center', fontSize:15, fontWeight:700 }}>
              Comecar agora
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg" style={{ minWidth:180, justifyContent:'center', fontSize:14 }}>
              Ja tenho conta
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ duration:0.4, delay:0.5 }}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginTop:40 }}
          >
            {[
              { v:'3 dias', l:'teste gratis' },
              { v:'Tempo real', l:'atualizacao 30s' },
              { v:'App celular', l:'iPhone e Android' },
            ].map(({ v, l }) => (
              <div key={v} style={{ textAlign:'center' }}>
                <p style={{ fontSize:14, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{v}</p>
                <p style={{ fontSize:10, color:'var(--t3)', margin:0 }}>{l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:0.3, y:[0,8,0] }}
          transition={{ opacity:{delay:2,duration:0.5}, y:{duration:2,repeat:Infinity,ease:'easeInOut'} }}
          style={{ position:'absolute', bottom:32, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}
        >
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em' }}>VEJA COMO FUNCIONA</span>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </motion.div>
      </section>

      {/* ═══ MOCK DO DASHBOARD ═══ */}
      <section style={{ padding:'0 24px 80px', maxWidth:700, margin:'0 auto' }}>
        <motion.div
          initial={{ opacity:0, y:30 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }}
          transition={{ duration:0.6, ease }}
          style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', background:'linear-gradient(145deg, #0c1424, #080e1a)', padding:'20px 24px 24px' }}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:20, height:20, borderRadius:5, background:'#e53935' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>Painel executivo</span>
            </div>
            <div style={{ display:'flex', gap:4 }}>{[1,2,3].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }}/>)}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ padding:'18px 20px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize:9, color:'rgba(255,255,255,0.3)', margin:'0 0 8px' }}>Lucro final acumulado</p>
              <p style={{ fontFamily:'var(--mono)', fontSize:28, fontWeight:900, color:'#22C55E', margin:0 }}>+R$ 3.058,47</p>
              <p style={{ fontSize:8, color:'rgba(255,255,255,0.2)', marginTop:6 }}>11 metas fechadas</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[{l:'Depositado',v:'R$ 57.581'},{l:'Sacado',v:'R$ 51.330'},{l:'Metas',v:'20'}].map(({l,v}) => (
                <div key={l} style={{ flex:1, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:8, color:'rgba(255,255,255,0.25)' }}>{l}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)' }}>
            <p style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.3)', margin:'0 0 10px' }}>Remessas recentes</p>
            {[{n:'Pedro',v:'+R$ 95,00',g:true},{n:'Lucas',v:'-R$ 18,00',g:false},{n:'Ana',v:'+R$ 145,00',g:true}].map(({n,v,g}) => (
              <div key={n} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:18, height:18, borderRadius:5, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.3)' }}>{n[0]}</span>
                  </div>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)' }}>{n}</span>
                </div>
                <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:g?'#22C55E':'#EF4444' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ position:'absolute', bottom:-30, left:'20%', right:'20%', height:60, background:'radial-gradient(ellipse, rgba(229,57,53,0.06), transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }}/>
        </motion.div>
      </section>

      {/* ═══ 3 PILARES ═══ */}
      <section style={{ padding:'40px 24px 80px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="g-4">
          {[
            { icon:'M13 2L3 14h9l-1 8 10-12h-9l1-8z', t:'Controle em tempo real', d:'Dashboard atualizado a cada 30 segundos. Lucro, prejuizo, metas e remessas ao vivo.' },
            { icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0', t:'Operadores organizados', d:'Cada operador com acesso proprio. Voce acompanha tudo sem depender de ninguem.' },
            { icon:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', t:'Lucro claro e real', d:'Fechamento com salario, custos e taxa do agente. O lucro final e o numero que importa.' },
          ].map(({icon,t,d},i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:16 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.4, delay:i*0.1, ease }}
              style={{ padding:'28px 24px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)' }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:16 }}>
                <path d={icon}/>
              </svg>
              <h3 style={{ fontSize:16, fontWeight:700, color:'var(--t1)', margin:'0 0 8px' }}>{t}</h3>
              <p style={{ fontSize:13, color:'var(--t3)', margin:0, lineHeight:1.5 }}>{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section style={{ padding:'40px 24px 80px', textAlign:'center' }}>
        <motion.div
          initial={{ opacity:0 }}
          whileInView={{ opacity:1 }}
          viewport={{ once:true }}
          transition={{ duration:0.5 }}
        >
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:'0 0 10px', letterSpacing:'-0.03em' }}>Pronto pra ter controle total?</h2>
          <p style={{ fontSize:14, color:'var(--t3)', marginBottom:28 }}>3 dias gratis. Sem cartao. Cancele quando quiser.</p>
          <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:240, justifyContent:'center', fontSize:15, fontWeight:700 }}>
            Comecar agora
          </Link>
        </motion.div>

        <div style={{ marginTop:48, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:6, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width={10} height={10} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.3)' }}>Nex<span style={{ color:'#ff4444' }}>Control</span></span>
        </div>
        <p style={{ fontSize:10, color:'var(--t4)', marginTop:6 }}>Sistema operacional de resultados</p>
      </section>
    </main>
  )
}
