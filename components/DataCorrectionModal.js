'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Pop-up de correcao do BAU (opt-in). So aparece pro admin de tenant afetado
// que ainda nao decidiu. Mostra a diferenca e deixa ele Aplicar ou Manter.
export default function DataCorrectionModal() {
  const [userId, setUserId] = useState(null)
  const [info, setInfo] = useState(null) // { delta, count }
  const [busy, setBusy] = useState('')   // '', 'apply', 'dismiss'
  const [doneMsg, setDoneMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data?.session?.user?.id
      if (uid) setUserId(uid)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!userId) return
    fetch('/api/data-correction/get?user_id=' + encodeURIComponent(userId))
      .then(r => r.json())
      .then(j => { if (j?.pending) setInfo({ delta: j.delta, count: j.count }) })
      .catch(() => {})
  }, [userId])

  async function resolve(action) {
    if (busy) return
    setBusy(action)
    try {
      await fetch('/api/data-correction/resolve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action }),
      })
    } catch {}
    if (action === 'apply') {
      setDoneMsg('Correção aplicada! Atualizando seus números...')
      setTimeout(() => { try { window.location.reload() } catch {} }, 1400)
    } else {
      setDoneMsg('Tudo bem, seus valores ficam como estão.')
      setTimeout(() => setInfo(null), 1100)
    }
  }

  if (!info) return null

  return (
    <AnimatePresence>
      <motion.div
        key="dc-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(2,4,8,0.82)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          style={{
            position: 'relative', width: '100%', maxWidth: 440, padding: 28, borderRadius: 20,
            background: 'linear-gradient(165deg, #0c1410, #070a08)',
            border: '1px solid rgba(34,197,94,0.18)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(34,197,94,0.08)',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: '18%', right: '18%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)' }} />

          {/* Icone */}
          <div style={{ width: 46, height: 46, borderRadius: 13, margin: '0 auto 16px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(34,197,94,0.18)' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>

          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Ajuste disponível nos seus dados
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', textAlign: 'center', lineHeight: 1.55, margin: '0 0 18px' }}>
            Corrigimos um detalhe: quando uma remessa era <b style={{ color: 'rgba(255,255,255,0.85)' }}>editada</b>, o valor do <b style={{ color: 'rgba(255,255,255,0.85)' }}>baú</b> não era somado de novo ao resultado. Por isso algumas remessas suas ficaram com resultado menor que o real.
          </p>

          {/* Diferenca */}
          <div style={{ borderRadius: 14, padding: '16px 18px', marginBottom: 18, textAlign: 'center', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.22)' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>Diferença encontrada</p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 900, color: '#22C55E', margin: 0, letterSpacing: '-0.02em' }}>+R$ {fmt(info.delta)}</p>
            <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>{info.count} remessa{info.count !== 1 ? 's' : ''} afetada{info.count !== 1 ? 's' : ''}</p>
          </div>

          {doneMsg ? (
            <p style={{ fontSize: 13, fontWeight: 600, color: '#22C55E', textAlign: 'center', padding: '12px 0' }}>{doneMsg}</p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 16px' }}>
                Você decide se quer aplicar essa correção no seu painel.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => resolve('dismiss')} disabled={!!busy}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', opacity: busy === 'apply' ? 0.4 : 1 }}>
                  {busy === 'dismiss' ? 'Salvando...' : 'Manter como está'}
                </button>
                <button onClick={() => resolve('apply')} disabled={!!busy}
                  style={{ flex: 1.3, padding: '13px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', color: '#04130b', border: 'none', background: 'linear-gradient(145deg, #22C55E, #16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)', opacity: busy === 'dismiss' ? 0.4 : 1 }}>
                  {busy === 'apply' ? 'Aplicando...' : 'Aplicar correção'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
