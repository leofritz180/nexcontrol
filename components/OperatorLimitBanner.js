'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { getOperatorLimitStatus } from '../lib/operator-limit'

const ease = [0.33, 1, 0.68, 1]

/**
 * Banner persistente que avisa o admin quando ele tem mais operadores
 * cadastrados que o plano permite. Aparece em /admin e /operadores.
 *
 * Props:
 *   tenantId: string (obrigatorio)
 *   variant?: 'default' | 'compact' — compact e mais discreto
 */
export default function OperatorLimitBanner({ tenantId, variant = 'default' }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    let alive = true
    async function check() {
      const s = await getOperatorLimitStatus(supabase, tenantId)
      if (alive) setStatus(s)
    }
    check()
    // Re-check a cada 60s pra capturar mudancas (adicao/remocao de op)
    const interval = setInterval(() => { if (document.visibilityState === 'visible') check() }, 60000)
    return () => { alive = false; clearInterval(interval) }
  }, [tenantId])

  if (!status || status.excess === 0 || dismissed) return null

  const onManage = () => {
    if (pathname !== '/operadores') router.push('/operadores')
  }

  const onUpgrade = () => {
    router.push('/billing')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease }}
        style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: 14, marginBottom: 18,
          background: 'linear-gradient(180deg, rgba(239,68,68,0.10), rgba(239,68,68,0.03))',
          border: '1px solid rgba(239,68,68,0.32)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.4), 0 0 36px rgba(239,68,68,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.55), transparent)' }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: variant === 'compact' ? '14px 18px' : '18px 22px',
          flexWrap: 'wrap',
        }}>
          {/* Icone alerta */}
          <div style={{
            flexShrink: 0,
            width: variant === 'compact' ? 36 : 44,
            height: variant === 'compact' ? 36 : 44,
            borderRadius: 11,
            background: 'rgba(239,68,68,0.14)',
            border: '1px solid rgba(239,68,68,0.32)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(239,68,68,0.18)',
          }}>
            <svg width={variant === 'compact' ? 16 : 19} height={variant === 'compact' ? 16 : 19} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          {/* Mensagem */}
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <p style={{
              fontFamily: 'var(--mono, monospace)', fontSize: 9.5, fontWeight: 700,
              color: 'var(--loss)', letterSpacing: '0.18em', textTransform: 'uppercase',
              margin: '0 0 4px',
            }}>Limite excedido</p>
            <p style={{
              fontSize: 14, color: '#fff', fontWeight: 700,
              margin: '0 0 4px', letterSpacing: '-0.01em',
            }}>
              Você tem <strong style={{ color: '#fef2f2', fontWeight: 800 }}>{status.current} operador{status.current !== 1 ? 'es' : ''}</strong> cadastrado{status.current !== 1 ? 's' : ''} mas seu plano cobre <strong style={{ color: '#fef2f2', fontWeight: 800 }}>{status.limit}</strong>.
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
              Remova <strong style={{ color: '#fff' }}>{status.excess}</strong> operador{status.excess !== 1 ? 'es' : ''} ou faça upgrade do plano pra deixar a operação dentro do limite.
            </p>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {pathname !== '/operadores' && (
              <button onClick={onManage} type="button" style={{
                padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: '#fff',
                fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>
                Gerenciar
              </button>
            )}
            <button onClick={onUpgrade} type="button" style={{
              padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(180deg, var(--loss), #c62828)',
              color: '#fff', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
            }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
              Upgrade
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
