'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

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
    <main style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center', position:'relative', zIndex:1 }}>
      {/* Ambient */}
      <div style={{ position:'fixed', top:'-15%', left:'15%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.05), transparent 60%)', filter:'blur(80px)', pointerEvents:'none' }}/>

      <motion.div
        initial={{ opacity:0, y:12 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5 }}
        style={{ maxWidth:420, position:'relative', zIndex:1 }}
      >
        {/* Logo */}
        <motion.div
          animate={{ boxShadow:['0 0 25px rgba(229,57,53,0.2)','0 0 40px rgba(229,57,53,0.35)','0 0 25px rgba(229,57,53,0.2)'] }}
          transition={{ duration:3, repeat:Infinity }}
          style={{ width:60, height:60, borderRadius:16, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px' }}
        >
          <svg width={26} height={26} viewBox="0 0 28 28" fill="none">
            <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
            <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
            <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
          </svg>
        </motion.div>

        <h1 style={{ fontSize:36, fontWeight:900, letterSpacing:'-0.04em', color:'var(--t1)', margin:'0 0 8px', lineHeight:1.1 }}>
          Nex<span style={{ color:'#ff4444' }}>Control</span>
        </h1>
        <p style={{ fontSize:15, color:'var(--t2)', marginBottom:36, lineHeight:1.5 }}>
          Sistema operacional de resultados.<br/>
          Controle total da sua operacao.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
          <Link href="/login" className="btn btn-brand btn-lg" style={{ minWidth:260, justifyContent:'center', fontSize:15, fontWeight:700 }}>
            Entrar no sistema
          </Link>
          <Link href="/signup" className="btn btn-ghost btn-lg" style={{ minWidth:260, justifyContent:'center', fontSize:14 }}>
            Criar conta
          </Link>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginTop:40 }}>
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
        </div>
      </motion.div>
    </main>
  )
}
