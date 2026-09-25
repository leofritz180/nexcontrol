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
import { motion, AnimatePresence } from 'framer-motion'
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
            <span className="nxgc-lime" style={{ display: 'inline-block', fontFamily: MONO, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em' }}>NEX NETWORK · GRUPO VIP</span>
            <h2 className="nxgc-claro" style={{ fontSize: 26, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '14px 0 0', fontFamily: 'var(--serif, "Instrument Serif", Georgia, serif)' }}>Um grupo fechado.<br />Só quem opera.</h2>
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

/** A faixa (Network no desktop, painel principal): só pra quem ainda não é membro. */
export function GrupoFaixa({ origem = 'faixa-network', style }) {
  const router = useRouter()
  const [mostrar, setMostrar] = useState(false)
  useEffect(() => { let vivo = true; statusGrupo().then(st => { if (vivo && st && !st.membro) { setMostrar(true); eventoGrupo('view', origem) } }); return () => { vivo = false } }, [])
  if (!mostrar) return null
  return (
    <button type="button" onClick={() => { eventoGrupo('click', origem); router.push('/grupo') }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginBottom: 14, padding: '12px 16px', borderRadius: 18, border: '1px solid rgba(200,242,29,0.35)', background: '#0b0b0c', cursor: 'pointer', fontFamily: 'inherit', ...style }}>
      <style>{ESTILO}</style>
      <span className="nxgc-lime" style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', flexShrink: 0 }}>GRUPO VIP</span>
      <span className="nxgc-claro" style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>Um grupo fechado, só quem opera · lançamento R$ {fmt(GRUPO_PRECO)}, vitalício</span>
      <span className="nxgc-lime" style={{ fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>Entrar →</span>
    </button>
  )
}
