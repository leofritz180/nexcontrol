'use client'
// ─────────────────────────────────────────────────────────────────────────
// DepositCaptureButton — "Iniciar depósitos automáticos".
//
// Abre uma SESSAO de captura no backend (/api/deposit-capture) e um pop-up que
// soma AO VIVO os depositos que a extensao envia (le o QR/valor nas abas do bot).
// Ao finalizar, joga o total no campo DEPOSITO da remessa (onTotal).
//
// Funciona mesmo com o NexControl aberto num navegador diferente do bot: tudo
// passa pelo backend (a sessao e' do operador logado). Pop-up faz polling 3s.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const fmt = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function token() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}
async function call(method, body) {
  const t = await token()
  const opts = { method, headers: { Authorization: 'Bearer ' + t } }
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body) }
  const r = await fetch('/api/deposit-capture', opts)
  return r.json().catch(() => ({}))
}

export default function DepositCaptureButton({ metaId, onTotal, compact }) {
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [total, setTotal] = useState(0)
  const [count, setCount] = useState(0)
  const [last, setLast] = useState([])
  const [busy, setBusy] = useState(false)
  const pollRef = useRef(null)
  const sidRef = useRef(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function start() {
    setBusy(true)
    const j = await call('POST', { action: 'start', meta_id: metaId })
    setBusy(false)
    if (!j.session_id) { alert(j.error || 'Não consegui iniciar a captura.'); return }
    sidRef.current = j.session_id
    setSessionId(j.session_id); setTotal(j.total || 0); setCount(j.count || 0); setOpen(true)
    // o polling (pollStatus) e' ligado pelo useEffect [open]
  }

  // GET status da sessao (pop-up faz polling) — pausa em aba de fundo
  async function pollStatus() {
    if (!sidRef.current) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    const t = await token()
    const r = await fetch(`/api/deposit-capture?session_id=${sidRef.current}`, { headers: { Authorization: 'Bearer ' + t } })
    const j = await r.json().catch(() => ({}))
    if (j.ok) { setTotal(j.total || 0); setCount(j.count || 0); setLast(j.last || []) }
  }

  // reconfigura o intervalo pra usar pollStatus (com query)
  useEffect(() => {
    if (!open) return
    if (pollRef.current) clearInterval(pollRef.current)
    pollStatus()
    pollRef.current = setInterval(pollStatus, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open])

  async function finish() {
    setBusy(true)
    const j = await call('POST', { action: 'finish', session_id: sidRef.current })
    setBusy(false)
    if (pollRef.current) clearInterval(pollRef.current)
    const final = j.total || total
    onTotal && onTotal(final)
    setOpen(false); setSessionId(null); sidRef.current = null
  }

  function cancel() {
    if (pollRef.current) clearInterval(pollRef.current)
    setOpen(false); setSessionId(null); sidRef.current = null
  }

  return (
    <>
      <button type="button" onClick={start} disabled={busy}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, cursor: busy ? 'wait' : 'pointer',
          padding: compact ? '7px 11px' : '9px 14px', borderRadius: 9, border: '1px solid rgba(209,250,229,0.28)',
          background: 'rgba(209,250,229,0.08)', color: 'var(--profit, #d1fae5)', fontSize: compact ? 12 : 12.5, fontWeight: 700, fontFamily: 'inherit',
        }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h7v7h-7z"/></svg>
        Iniciar depósitos automáticos
      </button>

      <AnimatePresence>
        {open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative', width: '100%', maxWidth: 420, background: 'linear-gradient(180deg, #0b0b0b, #060606)', border: '1px solid rgba(209,250,229,0.2)', borderRadius: 20, padding: '24px 22px', boxShadow: '0 30px 90px rgba(0,0,0,0.7), 0 0 60px rgba(209,250,229,0.06)' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--profit, #d1fae5)', boxShadow: '0 0 10px rgba(209,250,229,0.7)', animation: 'nxpulse 1.4s ease-in-out infinite' }} />
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--profit, #d1fae5)', fontFamily: 'var(--mono, monospace)' }}>Capturando ao vivo</span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 16 }}>Deixe o bot rodando — cada QR que aparecer entra aqui sozinho.</div>

              <div style={{ textAlign: 'center', padding: '18px 0 8px' }}>
                <div style={{ fontSize: 11, color: 'var(--t4)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Total capturado</div>
                <motion.div key={total} initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 0.25 }}
                  style={{ fontSize: 40, fontWeight: 900, color: '#fafafa', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmt(total)}
                </motion.div>
                <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 8 }}>{count} depósito{count !== 1 ? 's' : ''} detectado{count !== 1 ? 's' : ''}</div>
              </div>

              {last.length > 0 && (
                <div style={{ maxHeight: 148, overflowY: 'auto', margin: '12px 0 4px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {last.map((c, i) => (
                    <div key={c.order_id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--mono, monospace)' }}>{c.casa || 'PIX'} · #{String(c.order_id).slice(-6)}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--profit, #d1fae5)', fontFamily: 'var(--mono, monospace)' }}>{fmt(c.valor)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
                <button type="button" onClick={finish} disabled={busy}
                  style={{ flex: 1, padding: '13px', borderRadius: 11, border: 'none', background: 'var(--profit, #d1fae5)', color: '#04140c', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Finalizar e usar total
                </button>
                <button type="button" onClick={cancel}
                  style={{ padding: '13px 16px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--t3)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
              <style>{`@keyframes nxpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}`}</style>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
