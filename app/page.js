'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
      <div className="spinner" style={{ width:24, height:24, borderTopColor:'var(--brand-bright)' }}/>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center', position:'relative', zIndex:1 }}>
      {/* Orbs */}
      <div style={{ position:'fixed', top:'-20%', left:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,110,247,0.1), transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-20%', right:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(5,217,140,0.07), transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      <div className="a1" style={{ maxWidth:560, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', boxShadow:'0 0 60px rgba(79,110,247,0.4)', animation:'float 4s ease-in-out infinite' }}>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
            <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
            <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
            <circle cx="21" cy="8" r="3" fill="#05d98c"/>
          </svg>
        </div>

        <h1 style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:44, letterSpacing:'-0.04em', color:'var(--t1)', margin:'0 0 12px', lineHeight:1.1 }}>
          Nex<span style={{ background:'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Control</span>
        </h1>
        <p style={{ fontSize:16, color:'var(--t2)', marginBottom:40, lineHeight:1.6 }}>
          Gestao inteligente de metas, operadores e faturamento.<br/>
          Controle total da sua operacao em um painel premium.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
          <Link href="/login" className="btn btn-brand btn-lg" style={{ minWidth:260, justifyContent:'center', fontSize:16, fontWeight:700 }}>
            Entrar no sistema
          </Link>
          <Link href="/signup" className="btn btn-ghost" style={{ minWidth:260, justifyContent:'center', fontSize:14 }}>
            Criar conta gratuita
          </Link>
        </div>

        <div className="a2" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginTop:48, flexWrap:'wrap' }}>
          {[
            { v:'7 dias', l:'teste gratis' },
            { v:'Multi-tenant', l:'isolamento total' },
            { v:'Premium', l:'design profissional' },
          ].map(({ v, l }) => (
            <div key={v} style={{ textAlign:'center' }}>
              <p style={{ fontSize:14, fontWeight:800, color:'var(--t1)', marginBottom:2 }}>{v}</p>
              <p style={{ fontSize:11, color:'var(--t3)' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
