'use client'
// ─────────────────────────────────────────────────────────────────────────
// O CONVITE PRO GRUPO NEX NETWORK, fora da tela de pagamento.
//
//   <GrupoConvite/>  o pop-up pós-pagamento: quem teve um plano aprovado
//                    nos últimos 14 dias e ainda não é membro vê UMA vez
//                    (por pagamento) o convite no painel — cobre quem pagou
//                    e fechou a aba antes do "aprovado" (a maioria: o push
//                    da renovação leva direto pro QR). Entra no coordenador
//                    de overlays com prioridade baixa.
//   <GrupoFaixa/>    a faixa no topo do Network pra quem não é membro.
//
// Os dois só levam pra /grupo, onde a compra acontece (UpsellNetwork). O
// texto repete o que a oferta promete lá — nada a mais.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useOverlaySlot } from '../lib/overlayCoordinator'
import { supabase } from '../lib/supabase/client'
import { GRUPO_PRECO, GRUPO_PRECO_ANTERIOR } from '../lib/network-grupo'
import { SOMBRA, Ico, MONO } from './ui/bento'

const LIME = '#C8F21D'
const fmt = v => Number(v || 0).toFixed(2).replace('.', ',')
const VISTO = 'nx_grupo_convite_'
// A camada de cores do tema claro reescreve `color` inline (texto branco
// virava preto no fundo preto). Cor de texto neste componente vem de
// classe, com o mesmo peso que o UpsellNetwork usa.
const ESTILO = `
  .nxgc-claro, .nxgc-claro * { color: #ffffff !important; }
  .nxgc-cinza, .nxgc-cinza * { color: rgba(255,255,255,0.55) !important; }
  .nxgc-lime,  .nxgc-lime  * { color: ${LIME} !important; }
  .nxgc-tinta, .nxgc-tinta * { color: #0b0b0c !important; }
`

async function comToken() { const { data } = await supabase.auth.getSession(); return data?.session?.access_token || null }
export async function statusGrupo() {
  try { const t = await comToken(); if (!t) return null; const r = await fetch('/api/grupo/status', { headers: { Authorization: 'Bearer ' + t } }); return r.ok ? await r.json() : null } catch { return null }
}
export async function eventoGrupo(evento, origem) {
  try { const t = await comToken(); if (!t) return; fetch('/api/grupo/evento', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ evento, origem }) }).catch(() => {}) } catch {}
}

const PROMESSAS = ['A rede que está pagando hoje — e a que parou', 'Aviso de bloqueio antes de você descobrir sozinho', 'Gente que fecha meta, não que fala sobre fechar']

export default function GrupoConvite({ userId, ativo = true }) {
  const router = useRouter()
  const [quer, setQuer] = useState(false)
  const [chave, setChave] = useState('')
  useEffect(() => {
    if (!ativo || !userId) return
    let vivo = true
    ;(async () => {
      const st = await statusGrupo()
      if (!vivo || !st || st.membro || !st.ultimoPlano) return
      const dias = (Date.now() - new Date(st.ultimoPlano.em).getTime()) / 86400000
      if (dias > 14) return
      const k = VISTO + userId + '_' + st.ultimoPlano.id
      try { if (localStorage.getItem(k)) return } catch {}
      setChave(k); setQuer(true)
    })()
    return () => { vivo = false }
  }, [userId, ativo])
  const liberado = useOverlaySlot('grupo-convite', 3, quer)
  useEffect(() => { if (quer && liberado) eventoGrupo('view', 'convite-painel') }, [quer, liberado])
  function fechar() { try { if (chave) localStorage.setItem(chave, '1') } catch {} ; setQuer(false) }
  function ver() { eventoGrupo('click', 'convite-painel'); fechar(); router.push('/grupo') }

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {quer && liberado && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={fechar}
          style={{ position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(17,19,24,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 22, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#0b0b0c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 26, boxShadow: SOMBRA.flutuante, padding: '28px 26px 24px' }}>
            <button type="button" onClick={fechar} aria-label="Fechar" style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={<path d="M18 6L6 18M6 6l12 12" />} s={14} c="#fff" />
            </button>
            <style>{ESTILO}</style>
            <span className="nxgc-lime" style={{ display: 'inline-block', fontFamily: MONO, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em' }}>GRUPO VIP NETWORK NEX · WHATSAPP</span>
            <h2 className="nxgc-claro" style={{ fontSize: 26, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '14px 0 0', fontFamily: 'var(--serif, "Instrument Serif", Georgia, serif)' }}>Os grandes players do CPA.<br />No mesmo grupo do WhatsApp.</h2>
            <ul className="nxgc-claro" style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
              {PROMESSAS.map(t => <li key={t} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.5, padding: '6px 0' }}><span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: LIME, flexShrink: 0, marginTop: 8 }} />{t}</li>)}
            </ul>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 18 }}>
              <span>
                <span className="nxgc-cinza" style={{ display: 'block', fontFamily: MONO, fontSize: 12, textDecoration: 'line-through' }}>R$ {fmt(GRUPO_PRECO_ANTERIOR)}</span>
                <span className="nxgc-claro" style={{ display: 'block', fontFamily: MONO, fontSize: 36, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1 }}>R$ {fmt(GRUPO_PRECO)}</span>
              </span>
              <span className="nxgc-cinza" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'right', lineHeight: 1.8 }}>preço de lançamento<br />pagamento único · vitalício</span>
            </div>
            <button type="button" onClick={ver} className="nxgc-tinta" style={{ width: '100%', marginTop: 18, minHeight: 48, borderRadius: 14, border: 'none', background: LIME, fontFamily: 'inherit', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Ver o grupo</button>
            <button type="button" onClick={fechar} className="nxgc-cinza" style={{ width: '100%', marginTop: 6, minHeight: 40, background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer' }}>agora não</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* Animações do card do grupo. Em CSS (e não em JS por frame) pra não custar
   nada no celular: o brilho que atravessa, o anel que pulsa e a seta que
   empurra rodam na GPU. Quem pediu menos movimento no sistema vê o card parado. */
const ESTILO_FAIXA = `
  .nxgf { position: relative; overflow: hidden; isolation: isolate; }
  .nxgf::before { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
    background: linear-gradient(120deg, rgba(200,242,29,0.55), rgba(200,242,29,0.12) 40%, rgba(255,255,255,0.10) 60%, rgba(200,242,29,0.45));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
    transition: opacity .25s ease; opacity: .75; }
  .nxgf:hover::before { opacity: 1; }
  .nxgf-brilho { position: absolute; top: 0; bottom: 0; left: -40%; width: 38%; pointer-events: none; z-index: 0;
    background: linear-gradient(100deg, transparent, rgba(200,242,29,0.10) 45%, rgba(255,255,255,0.14) 50%, rgba(200,242,29,0.10) 55%, transparent);
    animation: nxgf-varre 5.5s cubic-bezier(.45,0,.2,1) 1.2s infinite; }
  @keyframes nxgf-varre { 0% { transform: translateX(0) skewX(-18deg); } 38%, 100% { transform: translateX(420%) skewX(-18deg); } }
  .nxgf-anel { position: absolute; inset: -5px; border-radius: 16px; border: 1.5px solid ${LIME}; opacity: 0; animation: nxgf-pulsa 2.4s ease-out infinite; }
  .nxgf-anel.b { animation-delay: 1.2s; }
  @keyframes nxgf-pulsa { 0% { transform: scale(.86); opacity: .75; } 100% { transform: scale(1.28); opacity: 0; } }
  .nxgf-ponto { animation: nxgf-pisca 1.8s ease-in-out infinite; }
  @keyframes nxgf-pisca { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
  .nxgf-seta { display: inline-flex; animation: nxgf-empurra 1.9s ease-in-out infinite; }
  @keyframes nxgf-empurra { 0%, 60%, 100% { transform: translateX(0); } 30% { transform: translateX(4px); } }
  .nxgf-cta { transition: background .2s ease, box-shadow .2s ease; }
  .nxgf:hover .nxgf-cta { background: #d7ff3a !important; box-shadow: 0 8px 22px rgba(200,242,29,0.35); }
  /* no celular: ícone + texto em cima, botão "Entrar" na largura toda embaixo
     (três colunas em 330 px espremiam o texto em 7 linhas) */
  @media (max-width: 560px) {
    .nxgf { flex-wrap: wrap; row-gap: 12px !important; padding: 16px !important; }
    .nxgf-texto { flex: 1 1 0 !important; }
    .nxgf-cta { order: 3; flex-basis: 100%; justify-content: center; padding: 12px 14px !important; font-size: 14px !important; }
  }
  .nxgf-olho { white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { .nxgf-brilho, .nxgf-anel, .nxgf-ponto, .nxgf-seta { animation: none !important; } .nxgf-anel { opacity: 0; } }
`

/** A faixa (Network no desktop, painel principal): só pra quem ainda não é membro. */
export function GrupoFaixa({ origem = 'faixa-network', style }) {
  const router = useRouter()
  const reduzir = useReducedMotion()
  const [mostrar, setMostrar] = useState(false)
  useEffect(() => { let vivo = true; statusGrupo().then(st => { if (vivo && st && !st.membro) { setMostrar(true); eventoGrupo('view', origem) } }); return () => { vivo = false } }, [])
  if (!mostrar) return null
  return (
    <motion.button type="button" className="nxgf" aria-label={`Entrar no Grupo VIP Network Nex no WhatsApp, R$ ${fmt(GRUPO_PRECO)}`}
      onClick={() => { eventoGrupo('click', origem); router.push('/grupo') }}
      initial={reduzir ? false : { opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 20, mass: 0.8 }}
      whileHover={reduzir ? undefined : { y: -2 }}
      whileTap={{ scale: 0.985 }}
      style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', marginBottom: 14, padding: '14px 14px 14px 16px', borderRadius: 18, border: 'none', background: 'linear-gradient(135deg, #111314 0%, #0b0b0c 60%, #0f1206 100%)', boxShadow: '0 10px 30px rgba(0,0,0,0.28)', cursor: 'pointer', fontFamily: 'inherit', ...style }}>
      <style>{ESTILO + ESTILO_FAIXA}</style>
      <span aria-hidden className="nxgf-brilho" />

      {/* ícone: balão de conversa com o anel pulsando (o grupo está ativo) */}
      <span aria-hidden style={{ position: 'relative', zIndex: 1, width: 46, height: 46, flexShrink: 0 }}>
        <span className="nxgf-anel" />
        <span className="nxgf-anel b" />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'rgba(200,242,29,0.10)', border: '1px solid rgba(200,242,29,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></svg>
        </span>
      </span>

      <span className="nxgf-texto" style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
        <span className="nxgc-lime nxgf-olho" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em' }}>
          <span className="nxgf-ponto" style={{ width: 6, height: 6, borderRadius: 3, background: LIME, display: 'inline-block' }} />GRUPO VIP · WHATSAPP
        </span>
        <span className="nxgc-claro" style={{ display: 'block', fontSize: 14.5, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', marginTop: 4 }}>Grupo VIP Network Nex no WhatsApp</span>
        <span className="nxgc-cinza" style={{ display: 'block', fontSize: 12.5, lineHeight: 1.4, marginTop: 2 }}>
          Os grandes players do mercado de CPA<span className="nxgf-sub-sep"> · </span><span className="nxgf-sub-preco">lançamento R$ {fmt(GRUPO_PRECO)}, vitalício</span>
        </span>
      </span>

      <span className="nxgf-cta nxgc-tinta" style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '10px 14px', borderRadius: 12, background: LIME, fontSize: 13, fontWeight: 800 }}>
        Entrar<span className="nxgf-seta"><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0b0b0c" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
      </span>
    </motion.button>
  )
}
