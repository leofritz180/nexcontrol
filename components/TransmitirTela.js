'use client'
// O botão "Transmitir minha tela" e a pílula AO VIVO de quem transmite.
// Vive na meta e em Minha operação. A parte pesada está em lib/transmissao.
//
// Só aparece onde dá pra capturar tela (desktop). No celular mostra uma
// linha explicando que a transmissão sai do computador — melhor que um
// botão que não faz nada.
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { criarTransmissor, podeTransmitir } from '../lib/transmissao'
import { dispararPush } from '../lib/pushClient'
import { RED, RED2, MONO, Ico, ON_RED, GLOW } from './ui/bento'

const I_TELA = <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>
const I_PARAR = <rect x="6" y="6" width="12" height="12" rx="2" />

const fmtDur = ms => { const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

export default function TransmitirTela({ userId, tenantId, nome, metaId, papel = 'operator', compacto = false }) {
  const [suporta, setSuporta] = useState(true)
  const [estado, setEstado] = useState({ aoVivo: false, espectadores: 0, desde: null })
  const [erro, setErro] = useState('')
  const [agora, setAgora] = useState(Date.now())
  const tx = useRef(null)

  useEffect(() => { setSuporta(podeTransmitir()) }, [])
  useEffect(() => { if (!estado.aoVivo) return; const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t) }, [estado.aoVivo])
  // sair da página encerra a transmissão (o Chrome fecharia a captura de
  // qualquer jeito ao trocar de aba de origem? não — só ao fechar; então
  // encerramos nós, pra presença não ficar fantasma)
  useEffect(() => () => { tx.current?.parar() }, [])

  async function iniciar() {
    setErro('')
    const t = criarTransmissor({
      tenantId, userId, nome, metaId,
      onEstado: e => setEstado(s => ({ ...s, ...e })),
    })
    tx.current = t
    try {
      await t.iniciar()
      // avisa os admins (na voz de cada um) e deixa registrado na meta
      if (papel !== 'admin') dispararPush('transmissao', { nome, metaId, chave: String(userId) }, 'admins')
      if (metaId) fetch('/api/meta/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meta_id: metaId, user_id: userId, tenant_id: tenantId, action: 'transmissao_iniciada', description: `${nome || 'Operador'} iniciou transmissão de tela` }) }).catch(() => {})
    } catch (e) {
      tx.current = null
      const msg = String(e?.name || e?.message || '')
      setErro(/NotAllowed|Permission/i.test(msg) ? 'Você cancelou a permissão. Tenta de novo e escolha a janela.' : /Realtime/i.test(msg) ? 'Sem conexão com o servidor agora. Tenta de novo em instantes.' : 'Não deu pra iniciar a captura neste navegador.')
    }
  }
  function parar() { tx.current?.parar(); tx.current = null }

  if (!suporta) {
    if (compacto) return null
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t3)', minHeight: 40 }}>
        <Ico d={I_TELA} s={14} /> Transmissão de tela: pelo computador.
      </span>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <AnimatePresence mode="wait" initial={false}>
        {estado.aoVivo ? (
          <motion.div key="on" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 6px 0 14px', borderRadius: 30, background: 'var(--surface)', border: '1px solid rgba(229,57,31,0.4)', boxShadow: `0 8px 22px ${GLOW}` }}>
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: 999, background: RED, boxShadow: '0 0 0 4px rgba(229,57,31,0.18)', animation: 'nx-pulso 1.4s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', color: RED }}>AO VIVO</span>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>{fmtDur(agora - (estado.desde || agora))}</span>
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>· {estado.espectadores} assistindo</span>
            <button type="button" onClick={parar} aria-label="Parar transmissão"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 12px', borderRadius: 20, border: 'none', background: 'var(--fill-1)', color: 'var(--t1)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800 }}>
              <Ico d={I_PARAR} s={12} /> Parar
            </button>
          </motion.div>
        ) : (
          <motion.button key="off" type="button" onClick={iniciar}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            title="Mostra sua tela ao vivo pro admin (ele escolhe o que assistir na Sala ao vivo)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 16px', borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: ON_RED, background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: `0 10px 26px ${GLOW}` }}>
            <Ico d={I_TELA} s={15} c={ON_RED} /> {compacto ? 'Transmitir' : 'Transmitir minha tela'}
          </motion.button>
        )}
      </AnimatePresence>
      {erro && <span role="alert" style={{ fontSize: 12, color: 'var(--loss)', maxWidth: 320 }}>{erro}</span>}
      <style>{`@keyframes nx-pulso { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(0.72); opacity: .55 } }`}</style>
    </div>
  )
}
