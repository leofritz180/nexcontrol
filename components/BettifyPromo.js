'use client'
// ─────────────────────────────────────────────────────────────────────────
// BETTIFY PROMO — pop-up premium anunciando a Bettify Proxy (parceira oficial,
// loja integrada no painel via /proxy). Peça central: o "medidor de giga" que
// compara outras lojas (paga 10GB, recebe 7) vs Bettify (recebe 10 certinho).
//
// Exibição: PERMANENTE (pedido do dono em 03/09) — uma vez POR SESSÃO, ou
// seja, todo login / toda vez que abrir a Nex. Sem data de fim por enquanto.
// Usa o useOverlaySlot (prio 5, modal) — nunca aparece em cima do tour/phone.
// Cores da Bettify (#FF6B00) só aqui, como já acontece no item da Sidebar.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useOverlaySlot } from '../lib/overlayCoordinator'

const KEY_SESSAO = 'nx_bettify_promo_v1_sessao'

const LARANJA = '#FF6B00'

function GigaMeter() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 18px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* outras lojas */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Outras lojas</span>
          <span style={{ fontSize: 11.5, fontWeight: 800, fontFamily: 'var(--mono, monospace)', color: 'var(--loss)' }}>paga 10GB → recebe 7GB</span>
        </div>
        <div style={{ position: 'relative', height: 12, borderRadius: 7, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ duration: 1, delay: 0.35, ease: [0.33, 1, 0.68, 1] }}
            style={{ height: '100%', borderRadius: 7, background: 'linear-gradient(90deg, rgba(239,68,68,0.55), rgba(239,68,68,0.85))' }} />
          {/* os 30% que somem */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '30%', height: '100%', backgroundImage: 'repeating-linear-gradient(-45deg, rgba(239,68,68,0.22) 0 5px, transparent 5px 10px)' }} />
        </div>
        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.32)', margin: '5px 0 0' }}>3GB somem no caminho — a famosa burla de giga</p>
      </div>
      {/* bettify */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: LARANJA }}>Bettify</span>
          <span style={{ fontSize: 11.5, fontWeight: 800, fontFamily: 'var(--mono, monospace)', color: 'var(--profit)' }}>paga 10GB → recebe 10GB</span>
        </div>
        <div style={{ position: 'relative', height: 12, borderRadius: 7, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.1, delay: 0.55, ease: [0.33, 1, 0.68, 1] }}
            style={{ height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${LARANJA}, #ff9142)`, boxShadow: `0 0 14px rgba(255,107,0,0.5)` }} />
        </div>
        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.32)', margin: '5px 0 0' }}>giga contada certinha, em tempo real, dentro do painel</p>
      </div>
    </div>
  )
}

export default function BettifyPromo({ userEmail }) {
  const router = useRouter()
  const [want, setWant] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY_SESSAO)) return // ja viu NESTA sessao
      // pequeno atraso pra nao competir com o carregamento do painel
      const t = setTimeout(() => setWant(true), 2500)
      return () => clearTimeout(t)
    } catch {}
  }, [userEmail])

  const granted = useOverlaySlot('bettify-promo', 5, want)

  function marcarVisto() {
    try { sessionStorage.setItem(KEY_SESSAO, '1') } catch {}
  }
  function fechar() { marcarVisto(); setWant(false) }
  function abrirLoja() { marcarVisto(); setWant(false); router.push('/proxy') }

  return (
    <AnimatePresence>
      {want && granted && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={fechar}
        >
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: 470, maxHeight: '92vh', overflowY: 'auto',
              borderRadius: 22, background: 'linear-gradient(180deg, #101013, #070708)',
              border: '1px solid rgba(255,107,0,0.35)',
              boxShadow: '0 40px 110px rgba(0,0,0,0.75), 0 0 80px rgba(255,107,0,0.12)',
              padding: '30px 28px 26px',
            }}
          >
            {/* hairline + glow laranja */}
            <div aria-hidden style={{ position: 'absolute', top: 0, left: '14%', right: '14%', height: 1.5, background: `linear-gradient(90deg, transparent, ${LARANJA}, transparent)` }} />
            <div aria-hidden style={{ position: 'absolute', top: -70, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,0,0.16), transparent 68%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

            {/* fechar */}
            <button type="button" onClick={fechar} aria-label="Fechar"
              style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            {/* header parceria */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <img src="/bettify-logo.png" alt="Bettify" width={44} height={44} style={{ width: 44, height: 44, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 0 12px rgba(255,107,0,0.45))' }} />
              <div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.35)', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: LARANJA, marginBottom: 4 }}>Parceira oficial</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Bettify Proxy · integrada ao seu painel</p>
              </div>
            </div>

            {/* headline */}
            <h2 style={{ fontSize: 27, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 8px', lineHeight: 1.12 }}>
              10GB comprados.<br /><span style={{ color: LARANJA }}>10GB entregues.</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.58)', margin: '0 0 18px', lineHeight: 1.6 }}>
              Proxies de qualidade feitas pra <strong style={{ color: '#fff' }}>operação de CPA</strong> — preço justo e a giga
              que você pagou chegando <strong style={{ color: '#fff' }}>inteira</strong>. Sem a “burla de giga” das lojas
              que anunciam barato e entregam menos.
            </p>

            {/* medidor de giga */}
            <GigaMeter />

            {/* bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, margin: '18px 0 22px' }}>
              {[
                'Compra sem sair do NexControl — loja integrada no painel',
                'Acompanhe a giga restante em tempo real em “Minhas Proxies”',
                'Entrega automática, na hora do pagamento',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 6, background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={LARANJA} strokeWidth={3.2} strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <button type="button" onClick={abrirLoja}
              style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', color: '#fff', background: `linear-gradient(135deg, ${LARANJA}, #e55e00)`, boxShadow: '0 10px 30px rgba(255,107,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
              Abrir a Loja Proxy no painel
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <a href="https://bettifyproxy.com" target="_blank" rel="noopener noreferrer" onClick={marcarVisto}
                style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                bettifyproxy.com
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
              </a>
              <button type="button" onClick={fechar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'rgba(255,255,255,0.38)', fontFamily: 'inherit', padding: 6 }}>
                Agora não
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
