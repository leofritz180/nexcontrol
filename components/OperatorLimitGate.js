'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { getOperatorLimitStatus } from '../lib/operator-limit'

// Rotas onde o admin PODE acessar mesmo com excesso de operadores
// (pra ele resolver o problema)
const ALLOWED_PATHS = ['/operadores', '/billing', '/billing-mp', '/login', '/logout', '/owner', '/reset-password']

const OWNER_EMAILS = new Set(['leofritz180@gmail.com'])
// Contas com OPERADORES ILIMITADOS (nunca bloqueia por excesso)
const UNLIMITED_OPERATOR_EMAILS = new Set(['darkzinmg7@gmail.com'])

/**
 * Gate que bloqueia rotas admin quando o tenant tem mais operadores
 * que o plano permite. Forca o admin a:
 *   - Ir em /operadores e remover excesso, OU
 *   - Fazer upgrade em /billing
 *
 * Operadores excluidos mantem metas/historia — soh perdem acesso.
 *
 * Operadores comuns nao sao afetados — soh admin.
 */
export default function OperatorLimitGate({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [blocked, setBlocked] = useState(false)
  const [status, setStatus] = useState(null)
  const cache = useRef({ checked: false, ts: 0 })

  useEffect(() => {
    if (ALLOWED_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'))) {
      setBlocked(false)
      return
    }
    check()
  }, [pathname])

  async function check() {
    try {
      const now = Date.now()
      if (cache.current.checked && (now - cache.current.ts) < 30000) {
        return
      }
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { setBlocked(false); return }
      if (OWNER_EMAILS.has((u.email || '').toLowerCase())) { setBlocked(false); return }
      if (UNLIMITED_OPERATOR_EMAILS.has((u.email || '').toLowerCase())) { setBlocked(false); return }
      const { data: prof } = await supabase.from('profiles').select('role,tenant_id').eq('id', u.id).maybeSingle()
      if (!prof || prof.role !== 'admin' || !prof.tenant_id) { setBlocked(false); return }
      const st = await getOperatorLimitStatus(supabase, prof.tenant_id)
      cache.current = { checked: true, ts: now }
      if (st && st.excess > 0) {
        setStatus(st)
        setBlocked(true)
      } else {
        setBlocked(false)
      }
    } catch {
      setBlocked(false)
    }
  }

  if (!blocked || !status) return children

  return (
    <>
      {children}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        {/* HUD grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(239,68,68,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}/>
        {/* Glow red */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 560, height: 560, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(239,68,68,0.10), transparent 65%)',
          filter: 'blur(40px)',
        }}/>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          style={{
            position: 'relative', maxWidth: 520, width: '100%', textAlign: 'center',
            background: 'linear-gradient(180deg, var(--raised), #050505)',
            border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: 20, padding: '44px 36px',
            boxShadow: '0 0 0 1px rgba(239,68,68,0.06), 0 40px 100px rgba(0,0,0,0.7), 0 0 80px rgba(239,68,68,0.08)',
          }}>
          {/* Top glow line */}
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.55), transparent)' }} />

          {/* Eyebrow */}
          <div style={{
            fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: 'var(--loss)',
            marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <span style={{ width: 24, height: 1, background: 'var(--loss)' }}/>
            Ação obrigatória
            <span style={{ width: 24, height: 1, background: 'var(--loss)' }}/>
          </div>

          {/* Icone alerta grande */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px rgba(239,68,68,0.25)',
            }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2.2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif, "Instrument Serif", serif)',
            fontSize: 30, fontWeight: 400, color: '#fafafa',
            letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.1,
          }}>
            Limite de operadores excedido.
          </h2>

          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.65)',
            margin: '0 0 8px', lineHeight: 1.55, fontWeight: 300,
          }}>
            Você tem <strong style={{ color: '#fff', fontWeight: 600 }}>{status.current} operador{status.current !== 1 ? 'es' : ''}</strong> cadastrado{status.current !== 1 ? 's' : ''} mas seu plano cobre <strong style={{ color: '#fff', fontWeight: 600 }}>{status.limit}</strong>.
          </p>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.65)',
            margin: '0 0 28px', lineHeight: 1.55, fontWeight: 300,
          }}>
            Pra continuar usando o painel, <strong style={{ color: 'var(--loss)', fontWeight: 700 }}>remova {status.excess} operador{status.excess !== 1 ? 'es' : ''}</strong> ou faça upgrade do plano.
          </p>

          {/* Stats visuais */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 1, marginBottom: 26, overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 8px', background: '#050505' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--mono, monospace)' }}>Plano</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fafafa', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>{status.limit}</div>
            </div>
            <div style={{ padding: '14px 8px', background: '#050505' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--mono, monospace)' }}>Atual</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--loss)', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>{status.current}</div>
            </div>
            <div style={{ padding: '14px 8px', background: '#050505' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--mono, monospace)' }}>Excesso</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--loss)', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>+{status.excess}</div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/operadores')} type="button"
              style={{
                flex: 1, minWidth: 200,
                padding: '14px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(180deg, var(--loss), #c62828)',
                color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 22px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              Gerenciar operadores
            </button>
            <button onClick={() => router.push('/billing')} type="button"
              style={{
                flex: 1, minWidth: 160,
                padding: '14px 22px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#fff', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
              Fazer upgrade
            </button>
          </div>

          <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', margin: '20px 0 0', lineHeight: 1.55 }}>
            <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Sem perda de dados:</strong> remover operador preserva metas, remessas e lucro do histórico. Operador só perde acesso ao painel.
          </p>
        </motion.div>
      </div>
    </>
  )
}
