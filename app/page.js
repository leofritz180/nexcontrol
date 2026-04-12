'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const ease = [0.33,1,0.68,1]
const fadeUp = (d=0) => ({initial:{opacity:0,y:20},whileInView:{opacity:1,y:0},viewport:{once:true},transition:{duration:0.5,delay:d,ease}})

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) router.push('/operator')
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

      {/* ═══════════════════════════════════
          HERO
      ═══════════════════════════════════ */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', position:'relative' }}>
        {/* Ambient */}
        <div style={{ position:'absolute', top:'-10%', left:'20%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.06), transparent 60%)', filter:'blur(80px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'0%', right:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.04), transparent 60%)', filter:'blur(60px)', pointerEvents:'none' }}/>

        <motion.div {...fadeUp(0)} style={{ maxWidth:700, position:'relative', zIndex:1 }}>
          {/* Logo */}
          <motion.div
            animate={{ boxShadow:['0 0 30px rgba(229,57,53,0.2)','0 0 50px rgba(229,57,53,0.4)','0 0 30px rgba(229,57,53,0.2)'] }}
            transition={{ duration:3, repeat:Infinity }}
            style={{ width:64, height:64, borderRadius:18, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 32px' }}>
            <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
              <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
              <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
              <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
            </svg>
          </motion.div>

          <h1 style={{ fontSize:48, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, color:'var(--t1)', margin:'0 0 16px' }}>
            Controle cada centavo<br/>da sua operacao
          </h1>
          <p style={{ fontSize:18, color:'var(--t2)', lineHeight:1.6, margin:'0 0 40px', maxWidth:520, marginLeft:'auto', marginRight:'auto' }}>
            Metas, remessas, operadores e lucro em um unico painel premium. Acompanhe tudo em tempo real. No computador e no celular.
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:220, justifyContent:'center', fontSize:16, fontWeight:700 }}>
              Comecar agora
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg" style={{ minWidth:180, justifyContent:'center', fontSize:14 }}>
              Ja tenho conta
            </Link>
          </div>

          <motion.div {...fadeUp(0.3)} style={{ display:'flex', gap:32, justifyContent:'center', marginTop:48 }}>
            {[
              {v:'14 dias',l:'teste gratis'},
              {v:'Tempo real',l:'atualizacao 30s'},
              {v:'App celular',l:'iPhone e Android'},
            ].map(({v,l}) => (
              <div key={v} style={{ textAlign:'center' }}>
                <p style={{ fontSize:16, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{v}</p>
                <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>{l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          DIFERENCIAIS
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:1100, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:32, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Tudo que voce precisa em um lugar</h2>
          <p style={{ fontSize:15, color:'var(--t3)', maxWidth:500, margin:'0 auto' }}>Pare de perder tempo com planilhas. Controle sua operacao como um profissional.</p>
        </motion.div>

        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[
            {icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', t:'Dashboard premium', d:'Lucro, prejuizo, metas e operadores em tempo real'},
            {icon:'M13 2L3 14h9l-1 8 10-12h-9l1-8z', t:'Controle ao vivo', d:'Atualizacao automatica a cada 30 segundos'},
            {icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', t:'Notificacoes push', d:'Receba alertas no celular quando operadores registram'},
            {icon:'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', t:'App no celular', d:'Instale como app no iPhone e Android'},
            {icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0', t:'Equipe completa', d:'Admin + operadores com permissoes separadas'},
            {icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', t:'Fechamento inteligente', d:'Salario, custos e taxa do agente no lucro final'},
            {icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', t:'PIX integrado', d:'Pagamento via PIX com QR code automatico'},
            {icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', t:'Multi-tenant seguro', d:'Cada admin isolado com dados protegidos'},
          ].map(({icon,t,d},i) => (
            <motion.div key={i} {...fadeUp(i*0.05)}
              whileHover={{ y:-3, transition:{duration:0.2} }}
              style={{ padding:'24px 22px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:14 }}>
                <path d={icon}/>
              </svg>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--t1)', margin:'0 0 6px' }}>{t}</h3>
              <p style={{ fontSize:12, color:'var(--t3)', margin:0, lineHeight:1.5 }}>{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          FUNCOES PRO
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:1100, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'4px 14px', borderRadius:6, background:'rgba(229,57,53,0.1)', color:'#ff4444', border:'1px solid rgba(229,57,53,0.2)', letterSpacing:'0.1em' }}>PRO</span>
          <h2 style={{ fontSize:32, fontWeight:800, color:'var(--t1)', margin:'16px 0 12px', letterSpacing:'-0.03em' }}>Leve sua operacao para outro nivel</h2>
          <p style={{ fontSize:15, color:'var(--t3)', maxWidth:500, margin:'0 auto' }}>Recursos exclusivos que transformam dados em decisoes.</p>
        </motion.div>

        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            {t:'Inteligencia da operacao', d:'Insights automaticos sobre lucro, tendencia e pontos de atencao', icon:'M13 10V3L4 14h7v7l9-11h-7z'},
            {t:'Ranking de redes', d:'Saiba quais redes geram mais lucro e quais estao caindo', icon:'M3 4h18M3 8h12M3 12h18M3 16h8M3 20h14'},
            {t:'Modo apresentacao', d:'Video cinematografico do resultado pra compartilhar', icon:'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'},
            {t:'Previsao de resultado', d:'Projecao inteligente baseada no ritmo da operacao', icon:'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'},
            {t:'Alertas estrategicos', d:'Notificacoes automaticas sobre queda de performance', icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5'},
            {t:'Exportacao premium', d:'Imagem e video do resultado pra Instagram e WhatsApp', icon:'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'},
          ].map(({t,d,icon},i) => (
            <motion.div key={i} {...fadeUp(i*0.06)}
              whileHover={{ y:-3, borderColor:'rgba(229,57,53,0.2)', transition:{duration:0.2} }}
              style={{ position:'relative', padding:'28px 24px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.3)', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:12, right:12, fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:5, background:'rgba(229,57,53,0.1)', color:'#ff4444', border:'1px solid rgba(229,57,53,0.15)' }}>PRO</div>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:14, opacity:0.7 }}>
                <path d={icon}/>
              </svg>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--t1)', margin:'0 0 6px' }}>{t}</h3>
              <p style={{ fontSize:12, color:'var(--t3)', margin:0, lineHeight:1.5 }}>{d}</p>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp(0.3)} style={{ textAlign:'center', marginTop:32 }}>
          <Link href="/billing" className="btn btn-brand btn-lg" style={{ minWidth:240, justifyContent:'center', fontSize:15, fontWeight:700 }}>
            Desbloquear plano PRO
          </Link>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          APP NO CELULAR
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:900, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', padding:'48px 40px', borderRadius:20, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 8px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize:48, marginBottom:20 }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth={1.2} strokeLinecap="round" style={{ margin:'0 auto' }}>
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <line x1="12" y1="18" x2="12" y2="18.01"/>
            </svg>
          </div>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Leve sua operacao no bolso</h2>
          <p style={{ fontSize:15, color:'var(--t3)', lineHeight:1.6, maxWidth:480, margin:'0 auto 28px' }}>
            Instale o NexControl como app no seu celular. Receba notificacoes, acompanhe resultados e controle tudo na palma da mao.
          </p>
          <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              {t:'Instale como app', d:'Adicione a tela inicial'},
              {t:'Notificacoes push', d:'Alertas em tempo real'},
              {t:'Funciona offline', d:'Dados acessiveis sempre'},
            ].map(({t,d}) => (
              <div key={t} style={{ padding:'16px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 4px' }}>{t}</p>
                <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>{d}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          PROVA SOCIAL
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:900, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Quem usa, nao volta pra planilha</h2>
        </motion.div>

        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {[
            {q:'Agora consigo controlar tudo em um lugar so. Nao volto pra planilha.', n:'R. Silva'},
            {q:'O app no celular mudou minha rotina. Recebo tudo em tempo real.', n:'M. Costa'},
            {q:'Visual premium e controle real. Minha equipe toda usa.', n:'L. Santos'},
          ].map(({q,n},i) => (
            <motion.div key={i} {...fadeUp(i*0.1)}
              style={{ padding:'24px 22px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.6, margin:'0 0 16px', fontStyle:'italic' }}>"{q}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:'var(--raised)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--t2)' }}>{n[0]}</span>
                </div>
                <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>{n}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          COMPARATIVO FREE vs PRO
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:800, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Escolha seu plano</h2>
        </motion.div>

        <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Free */}
          <motion.div {...fadeUp(0)} style={{ padding:'32px 28px', borderRadius:16, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize:12, fontWeight:700, color:'var(--t3)', marginBottom:16, letterSpacing:'0.08em' }}>PADRAO</p>
            <p style={{ fontFamily:'var(--mono)', fontSize:32, fontWeight:900, color:'var(--t1)', margin:'0 0 4px' }}>R$ 39,90<span style={{ fontSize:14, fontWeight:500, color:'var(--t3)' }}>/mes</span></p>
            <p style={{ fontSize:12, color:'var(--t3)', marginBottom:24 }}>Admin solo</p>
            {['Dashboard completa','Metas e fechamento','Remessas ilimitadas','Notificacoes push','App no celular','PIX integrado'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize:12, color:'var(--t2)' }}>{f}</span>
              </div>
            ))}
            <Link href="/signup" className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginTop:24 }}>
              Comecar gratis
            </Link>
          </motion.div>

          {/* PRO */}
          <motion.div {...fadeUp(0.1)} style={{ padding:'32px 28px', borderRadius:16, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(229,57,53,0.2)', position:'relative', boxShadow:'0 0 40px rgba(229,57,53,0.06)' }}>
            <div style={{ position:'absolute', top:-10, right:20, fontSize:10, fontWeight:700, padding:'4px 12px', borderRadius:6, background:'#e53935', color:'white' }}>RECOMENDADO</div>
            <p style={{ fontSize:12, fontWeight:700, color:'#ff4444', marginBottom:16, letterSpacing:'0.08em' }}>PRO</p>
            <p style={{ fontFamily:'var(--mono)', fontSize:32, fontWeight:900, color:'var(--t1)', margin:'0 0 4px' }}>R$ 39,90<span style={{ fontSize:14, fontWeight:500, color:'var(--t3)' }}>/mes + ops</span></p>
            <p style={{ fontSize:12, color:'var(--t3)', marginBottom:24 }}>Admin + operadores</p>
            {['Tudo do padrao','Operadores ilimitados','Inteligencia da operacao','Ranking de redes','Modo apresentacao','Exportacao premium','Previsoes e alertas','Prioridade em novidades'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize:12, color:'var(--t1)' }}>{f}</span>
              </div>
            ))}
            <Link href="/billing" className="btn btn-brand" style={{ width:'100%', justifyContent:'center', marginTop:24, fontWeight:700 }}>
              Ativar plano PRO
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px 100px', textAlign:'center' }}>
        <motion.div {...fadeUp()}>
          <h2 style={{ fontSize:32, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Pronto pra ter controle total?</h2>
          <p style={{ fontSize:15, color:'var(--t3)', marginBottom:32 }}>14 dias gratis. Sem cartao. Cancele quando quiser.</p>
          <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:260, justifyContent:'center', fontSize:16, fontWeight:700 }}>
            Comecar agora
          </Link>
        </motion.div>

        <div style={{ marginTop:48, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width={12} height={12} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>Nex<span style={{ color:'#ff4444' }}>Control</span></span>
        </div>
        <p style={{ fontSize:11, color:'var(--t4)', marginTop:8 }}>Sistema operacional de resultados</p>
      </section>
    </main>
  )
}
