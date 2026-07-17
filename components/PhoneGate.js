'use client'
// ─────────────────────────────────────────────────────────────────────────
// PhoneGate — "Confirme seus dados": exige WhatsApp de quem ja tem conta.
//
// Novos cadastros ja informam o telefone no /signup; este modal cobre a base
// EXISTENTE (admins e operadores) que ainda nao tem profiles.phone. Objetivo
// do owner: lista completa de contatos pra comunicacao/disparo.
//
// - 1 query por sessao (cache em sessionStorage qdo o telefone ja existe)
// - Usa o coordenador de overlays (nao empilha com tutorial/wizard/checklist)
// - "Confirmar depois" adia SO nesta sessao — volta no proximo login
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { useOverlaySlot } from '../lib/overlayCoordinator'
import { normalizeBRPhone } from '../lib/phone'

const OK_KEY = 'nx_phone_ok'          // telefone ja cadastrado (evita re-query)
const SNOOZE_KEY = 'nx_phone_snooze'  // "depois" — some ate o proximo login

export default function PhoneGate() {
  const [need, setNeed] = useState(false)
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (sessionStorage.getItem(OK_KEY) === '1' || sessionStorage.getItem(SNOOZE_KEY) === '1') return
        const { data: s } = await supabase.auth.getSession()
        const u = s?.session?.user
        if (!u) return
        const { data: p } = await supabase.from('profiles').select('phone').eq('id', u.id).maybeSingle()
        if (!alive) return
        if (p && !p.phone) setNeed(true)
        else if (p?.phone) { try { sessionStorage.setItem(OK_KEY, '1') } catch {} }
      } catch {}
    })()
    return () => { alive = false }
  }, [])

  const granted = useOverlaySlot('phone-confirm', 0, need && !done)

  async function save() {
    setError('')
    const norm = normalizeBRPhone(phone)
    if (!norm) { setError('Número inválido. Use DDD + número, ex: (32) 99834-8889'); return }
    setSaving(true)
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s?.session?.access_token
      const r = await fetch('/api/profile/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ phone: norm }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setError(j.error || 'Não deu pra salvar. Tenta de novo.'); setSaving(false); return }
      try { sessionStorage.setItem(OK_KEY, '1') } catch {}
      setDone(true)
    } catch {
      setError('Erro de conexão. Tenta de novo.')
    }
    setSaving(false)
  }

  function snooze() {
    try { sessionStorage.setItem(SNOOZE_KEY, '1') } catch {}
    setNeed(false)
  }

  if (!need || done || !granted) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9300,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', width: '100%', maxWidth: 400, margin: 'auto', textAlign: 'center',
          background: 'linear-gradient(180deg, #0b0b0b, #050505)',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '30px 26px 24px',
          boxShadow: '0 30px 90px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
        <div style={{ position: 'absolute', top: 0, left: '18%', right: '18%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(209,250,229,0.5), transparent)' }} />

        <div style={{ width: 52, height: 52, margin: '0 auto 14px', borderRadius: 15, background: 'rgba(209,250,229,0.08)', border: '1px solid rgba(209,250,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--profit, #d1fae5)" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif, "Instrument Serif", serif)', fontSize: 24, fontWeight: 400, color: '#fafafa', letterSpacing: '-0.02em', margin: '0 0 8px' }}>Confirme seus dados.</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, margin: '0 0 18px' }}>
          Adicione seu <strong style={{ color: '#fff' }}>WhatsApp</strong> pra manter sua conta atualizada e receber avisos importantes da sua operação.
        </p>

        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          type="text" inputMode="tel" autoFocus
          placeholder="(32) 99834-8889"
          style={{
            width: '100%', padding: '13px 15px', borderRadius: 11, boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
            color: '#fafafa', fontSize: 15, textAlign: 'center', fontFamily: 'var(--mono, monospace)', fontWeight: 600, outline: 'none',
          }}
        />
        {error && <div style={{ fontSize: 12, color: 'var(--loss, #ef4444)', marginTop: 8 }}>{error}</div>}

        <button type="button" onClick={save} disabled={saving || !phone.trim()}
          style={{
            width: '100%', marginTop: 14, padding: '13px', borderRadius: 11, border: 'none', cursor: saving ? 'wait' : 'pointer',
            background: 'var(--profit, #d1fae5)', color: '#04140c', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            opacity: (saving || !phone.trim()) ? 0.6 : 1,
          }}>
          {saving ? 'Salvando...' : 'Confirmar número'}
        </button>
        <button type="button" onClick={snooze}
          style={{ marginTop: 8, width: '100%', padding: '8px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          Confirmar depois
        </button>
      </motion.div>
    </div>
  )
}
