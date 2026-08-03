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
import { supabase } from '../lib/supabase/client'
import DepositCaptureStage from './DepositCaptureStage'

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
  const [max, setMax] = useState(0)
  const [casas, setCasas] = useState(0)
  const [last, setLast] = useState([])
  const [busy, setBusy] = useState(false)
  const [cfgOpen, setCfgOpen] = useState(false)
  const [captureKey, setCaptureKey] = useState('')
  const [copied, setCopied] = useState(false)
  const pollRef = useRef(null)
  const sidRef = useRef(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function start() {
    setBusy(true)
    const j = await call('POST', { action: 'start', meta_id: metaId != null ? String(metaId) : null })
    setBusy(false)
    if (!j.session_id) { alert('Não consegui iniciar a captura.\n\n' + (j.error || 'Erro desconhecido')); return }
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
    if (j.ok) { setTotal(j.total || 0); setCount(j.count || 0); setMax(j.max || 0); setCasas(j.casas || 0); setLast(j.last || []) }
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

  async function configExtension() {
    setCfgOpen(v => !v)
    if (!captureKey) {
      const j = await call('POST', { action: 'get-key' })
      if (j.capture_key) setCaptureKey(j.capture_key)
    }
  }
  async function copyKey() {
    try { await navigator.clipboard.writeText(captureKey); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  async function downloadExtension() {
    setBusy(true)
    try {
      const t = await token()
      const r = await fetch('/api/deposit-capture/extension', { headers: { Authorization: 'Bearer ' + t } })
      if (!r.ok) { alert('Não consegui gerar a extensão agora. Tenta de novo.'); setBusy(false); return }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'nexcontrol-extensao.zip'; document.body.appendChild(a); a.click()
      a.remove(); URL.revokeObjectURL(url)
    } catch { alert('Erro ao baixar. Tenta de novo.') }
    setBusy(false)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={start} disabled={busy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, cursor: busy ? 'wait' : 'pointer',
            padding: compact ? '7px 11px' : '9px 14px', borderRadius: 9, border: '1px solid rgba(209,250,229,0.28)',
            background: 'rgba(209,250,229,0.08)', color: 'var(--profit, #d1fae5)', fontSize: compact ? 12 : 12.5, fontWeight: 700, fontFamily: 'inherit',
          }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h7v7h-7z"/></svg>
          Iniciar depósitos automáticos
        </button>
        <button type="button" onClick={configExtension}
          style={{ background: 'none', border: 'none', color: 'var(--t4)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
          Configurar extensão
        </button>
      </div>

      {cfgOpen && (
        <div style={{ marginTop: 8, padding: '14px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 470 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>Sua extensão, pronta pra usar</div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.55, marginBottom: 11 }}>
            Baixe o arquivo <b style={{ color: 'var(--t1)' }}>já com a sua chave embutida</b> (não precisa editar nada). Descompacte e adicione a pasta no bot em <b style={{ color: 'var(--t1)' }}>“Adicionar Extensão”</b>. É só uma vez — vale pra todas as abas e remessas.
          </div>
          <button type="button" onClick={downloadExtension} disabled={busy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 10, border: 'none', background: 'var(--profit, #d1fae5)', color: '#04140c', fontWeight: 800, fontSize: 13, cursor: busy ? 'wait' : 'pointer' }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {busy ? 'Gerando...' : 'Baixar minha extensão'}
          </button>

          {/* fallback avancado: chave manual */}
          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 11, color: 'var(--t4)', cursor: 'pointer' }}>Prefiro colar a chave manualmente</summary>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input readOnly value={captureKey || 'gerando...'} onFocus={e => e.target.select()}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#0a0a0a', color: '#d1fae5', fontFamily: 'var(--mono, monospace)', fontSize: 12 }} />
              <button type="button" onClick={copyKey} disabled={!captureKey}
                style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'var(--t1)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 6 }}>Cole no arquivo config.js, linha CAPTURE_KEY = "..."</div>
          </details>
        </div>
      )}

      <DepositCaptureStage
        open={open} total={total} count={count} max={max} casas={casas} last={last} busy={busy}
        onFinish={finish} onCancel={cancel}
      />
    </>
  )
}
