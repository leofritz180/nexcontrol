'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

// SO admin/owner — operador NAO dispara (essas notificacoes expoem financeiro).
const OWNER_EMAIL = 'leofritz180@gmail.com'

// Categorias de notificacao manual. Cada tipo bate em /api/notify/self
// que calcula o valor em tempo real e dispara push pro user logado.
const ITEMS = [
  { group: 'Lucros',    items: [
    { type: 'lucro_hoje',       label: 'Lucro de hoje',        desc: 'Soma das metas fechadas hoje + Metodos' },
    { type: 'lucro_semana',     label: 'Lucro da semana',      desc: 'Ultimos 7 dias consolidado' },
    { type: 'lucro_mes_atual',  label: 'Lucro do mes atual',   desc: 'Desde o dia 1 do mes corrente' },
    { type: 'lucro_mes',        label: 'Lucro 30 dias',        desc: 'Janela movel dos ultimos 30 dias' },
  ]},
  { group: 'Top',       items: [
    { type: 'top_operador',  label: 'Top operador (7d)', desc: 'Operador com maior lucro_final na semana' },
    { type: 'top_rede',      label: 'Top rede (7d)',     desc: 'Rede com maior lucro_final na semana' },
  ]},
  { group: 'Operacao',  items: [
    { type: 'metas_ativas',  label: 'Metas ativas',      desc: 'Quantas abertas e contas + remessas hoje' },
    { type: 'ultima_remessa',label: 'Ultima remessa',    desc: 'Resultado da remessa mais recente' },
    { type: 'saldo_geral',   label: 'Saldo geral',       desc: 'Tudo: CPA + Metodos - Custos' },
  ]},
]

export default function QuickNotifyPanel({ userEmail }) {
  const isOwner = String(userEmail || '').toLowerCase() === OWNER_EMAIL
  // Descobre o papel sozinho (nao confia em prop de pagina — /tutorial passa
  // isAdmin fixo). So admin/owner ve o painel. Padrao seguro anti-deadlock:
  // nunca chamar getSession/query dentro do callback do onAuthStateChange.
  const [role, setRole] = useState('')
  useEffect(() => {
    let active = true
    async function fetchRole(uid) {
      if (!uid) { if (active) setRole(''); return }
      try {
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle()
        if (active) setRole(prof?.role || '')
      } catch {}
    }
    supabase.auth.getSession().then(({ data }) => { if (active) fetchRole(data?.session?.user?.id) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id
      setTimeout(() => { if (active) fetchRole(uid) }, 0)
    })
    return () => { active = false; sub?.subscription?.unsubscribe?.() }
  }, [])
  const enabled = !!userEmail && (isOwner || role === 'admin')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null) // type que esta enviando
  const [toast, setToast] = useState(null)

  async function trigger(type) {
    setBusy(type)
    setToast(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) { setToast({ ok: false, msg: 'Sessao expirada' }); setBusy(null); return }
      const r = await fetch('/api/notify/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ type }),
      })
      const j = await r.json()
      if (!r.ok) { setToast({ ok: false, msg: j.error || 'Erro ao enviar' }); setBusy(null); return }
      if ((j.sent || 0) === 0) {
        setToast({ ok: false, msg: 'Voce nao tem dispositivo com push ativado' })
      } else {
        setToast({ ok: true, msg: 'Push enviado: ' + (j.payload?.title || type) })
      }
    } catch (e) {
      setToast({ ok: false, msg: 'Erro: ' + (e?.message || 'desconhecido') })
    }
    setBusy(null)
  }

  // Disparo em massa pra TODOS admins (so owner)
  async function triggerMass(type, label) {
    if (!confirm('Disparar "' + label + '" para TODOS os admins com atividade na semana?')) return
    setBusy('mass_' + type)
    setToast(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) { setToast({ ok: false, msg: 'Sessao expirada' }); setBusy(null); return }
      const r = await fetch('/api/notify/mass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ type }),
      })
      const j = await r.json()
      if (!r.ok) { setToast({ ok: false, msg: j.error || 'Erro' }); setBusy(null); return }
      setToast({ ok: true, msg: 'Disparado: ' + j.sent + '/' + j.eligible + ' admins (' + j.noDevice + ' sem device)' })
    } catch (e) {
      setToast({ ok: false, msg: 'Erro: ' + (e?.message || 'desconhecido') })
    }
    setBusy(null)
  }

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  if (!enabled) return null

  return (
    <>
      {/* Floating button (esquerda do mic, right:184) */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Notificacoes rapidas"
        title="Disparar notificacao"
        style={{
          position: 'fixed', bottom: 22, right: 184, zIndex: 201,
          width: 40, height: 40, borderRadius: '50%',
          cursor: 'pointer',
          background: open ? '#10B981' : 'rgba(20,20,20,0.95)',
          border: '1px solid ' + (open ? '#10B981' : 'rgba(255,255,255,0.1)'),
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.33, 1, 0.68, 1] }}
            style={{
              position: 'fixed', bottom: 72, right: 22, zIndex: 202,
              width: 360, maxHeight: '70vh',
              background: 'rgba(15,15,15,0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>Notificacao rapida</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: 'rgba(229,57,53,0.15)', color: '#e53935', letterSpacing: '0.04em', marginLeft: 'auto' }}>BETA</span>
              </div>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                Dispara push pro seu celular com dado em tempo real.
              </p>
            </div>

            {toast && (
              <div style={{
                padding: '10px 16px', fontSize: 11, fontWeight: 600,
                background: toast.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                color: toast.ok ? '#10B981' : '#EF4444',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                {toast.ok ? '✓' : '⚠'} {toast.msg}
              </div>
            )}

            <div style={{ overflowY: 'auto', padding: '8px 0' }}>
              {/* Owner-only: disparo pra TODOS admins */}
              {isOwner && (
                <div style={{ marginBottom: 4, paddingBottom: 8, borderBottom: '1px solid rgba(229,57,53,0.15)' }}>
                  <div style={{ padding: '8px 16px 4px', fontSize: 9, fontWeight: 700, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.08em' }}>OWNER · Disparo em massa</div>
                  {[
                    { type: 'lucro_hoje',      label: 'Lucro de hoje · TODOS' },
                    { type: 'lucro_semana',    label: 'Lucro da semana · TODOS' },
                    { type: 'lucro_mes_atual', label: 'Lucro do mes atual · TODOS' },
                    { type: 'lucro_mes',       label: 'Lucro 30 dias · TODOS' },
                  ].map(it => (
                    <button key={it.type} type="button" onClick={() => triggerMass(it.type, it.label)}
                      disabled={busy === 'mass_' + it.type}
                      style={{ width:'100%', textAlign:'left', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, background:'transparent', border:'none', cursor:busy?'not-allowed':'pointer', fontFamily:'inherit', transition:'background 0.15s' }}
                      onMouseEnter={e => { if (!busy) e.currentTarget.style.background = 'rgba(229,57,53,0.06)' }}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{it.label}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>so admins com atividade na semana</div>
                      </div>
                      {busy === 'mass_' + it.type ? (
                        <motion.div style={{ width: 14, height: 14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#e53935' }}
                          animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                      ) : (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {ITEMS.map(grp => (
                <div key={grp.group} style={{ marginBottom: 4 }}>
                  <div style={{ padding: '8px 16px 4px', fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{grp.group}</div>
                  {grp.items.map(it => (
                    <button
                      key={it.type}
                      type="button"
                      onClick={() => trigger(it.type)}
                      disabled={busy === it.type}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
                        background: 'transparent', border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!busy) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', marginBottom: 2 }}>{it.label}</div>
                        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{it.desc}</div>
                      </div>
                      {busy === it.type ? (
                        <motion.div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#10B981', flexShrink: 0 }}
                          animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                      ) : (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
