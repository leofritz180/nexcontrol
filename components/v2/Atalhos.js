'use client'
// ─────────────────────────────────────────────────────────────────────────
// ATALHOS DE TECLADO
//
// Complementa o Ctrl+K: quem usa o painel o dia inteiro não quer abrir uma
// busca pra trocar de módulo. `G` seguido de uma letra vai direto.
//
// Duas travas que evitam o problema clássico de atalho de tecla solta:
//  1. Nada dispara enquanto o foco está em input, textarea, select ou em
//     qualquer campo editável — senão digitar "gol" numa observação
//     navegaria o usuário pra outra tela.
//  2. Nada dispara com Ctrl/Cmd/Alt pressionado, pra não roubar atalho do
//     navegador.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SOMBRA, Ico, MONO, RED, RED2, ON_RED } from '../ui/bento'

const DESTINOS_ADMIN = {
  a: ['/admin', 'Painel'],
  o: ['/operadores', 'Operadores'],
  r: ['/redes', 'Redes'],
  f: ['/faturamento', 'Faturamento'],
  c: ['/custos', 'Custos'],
  p: ['/pix', 'Chaves PIX'],
  s: ['/slots', 'Slots Premium'],
  t: ['/tutorial', 'Tutorial'],
}
const DESTINOS_OPERADOR = {
  a: ['/operator', 'Painel'],
  p: ['/performance', 'Performance'],
  s: ['/slots', 'Slots Premium'],
  c: ['/pix', 'Chaves PIX'],
}

function digitando(el) {
  if (!el) return false
  const tag = String(el.tagName || '').toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
}

export default function Atalhos({ ativo, isAdmin, aoNovaMeta }) {
  const router = useRouter()
  const semMovimento = useReducedMotion()
  const [ajuda, setAjuda] = useState(false)
  const [aguardandoG, setAguardandoG] = useState(false)
  const timerG = useRef(null)

  useEffect(() => {
    if (!ativo) return
    const destinos = isAdmin ? DESTINOS_ADMIN : DESTINOS_OPERADOR

    function tecla(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (digitando(e.target)) return
      const k = String(e.key || '').toLowerCase()

      if (k === 'escape') { setAjuda(false); setAguardandoG(false); return }

      // segundo toque da sequência "G + letra"
      if (aguardandoG) {
        clearTimeout(timerG.current)
        setAguardandoG(false)
        const d = destinos[k]
        if (d) { e.preventDefault(); router.push(d[0]) }
        return
      }

      if (k === 'g') {
        e.preventDefault()
        setAguardandoG(true)
        // 1,2s é o suficiente pra encadear sem prender o teclado
        clearTimeout(timerG.current)
        timerG.current = setTimeout(() => setAguardandoG(false), 1200)
        return
      }
      if (k === 'n' && aoNovaMeta) { e.preventDefault(); aoNovaMeta(); return }
      if (k === '?') { e.preventDefault(); setAjuda(v => !v) }
    }

    window.addEventListener('keydown', tecla)
    return () => { window.removeEventListener('keydown', tecla); clearTimeout(timerG.current) }
  }, [ativo, isAdmin, aguardandoG, aoNovaMeta, router])

  if (!ativo) return null

  const destinos = isAdmin ? DESTINOS_ADMIN : DESTINOS_OPERADOR
  const Tecla = ({ children }) => (
    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 7, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t2)', whiteSpace: 'nowrap' }}>{children}</span>
  )

  return (
    <>
      {/* aviso de que o G foi capturado e está esperando a segunda tecla */}
      <AnimatePresence>
        {aguardandoG && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: semMovimento ? 0 : 0.18 }}
            style={{
              position: 'fixed', left: '50%', bottom: 110, transform: 'translateX(-50%)', zIndex: 10070,
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 30,
              background: 'var(--surface)', border: '1px solid var(--b1)', boxShadow: SOMBRA.flutuante, pointerEvents: 'none',
            }}>
            <Tecla>G</Tecla>
            <span style={{ fontSize: 12.5, color: 'var(--t2)', fontWeight: 600 }}>+ letra do módulo…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* folha de ajuda (?) */}
      <AnimatePresence>
        {ajuda && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: semMovimento ? 0 : 0.2 }}
            onClick={e => { if (e.target === e.currentTarget) setAjuda(false) }}
            style={{
              position: 'fixed', inset: 0, zIndex: 10075,
              background: 'rgba(17,19,24,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}>
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: semMovimento ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative', width: '100%', maxWidth: 480, maxHeight: '86vh', overflowY: 'auto',
                background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 26, boxShadow: SOMBRA.flutuante,
                padding: '28px 28px 24px',
              }}>
              <button type="button" onClick={() => setAjuda(false)} aria-label="Fechar"
                style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 11, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico d={<path d="M18 6L6 18M6 6l12 12" />} s={14} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
                <span style={{ width: 38, height: 38, borderRadius: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${RED2}, ${RED})` }}>
                  <Ico d={<><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" /></>} s={17} c={ON_RED} />
                </span>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Atalhos do teclado</p>
                  <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '2px 0 0' }}>nenhum dispara enquanto você digita</p>
                </div>
              </div>

              <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t4)', margin: '0 0 10px' }}>Geral</p>
              {[
                [<><Tecla key="c">Ctrl</Tecla> <Tecla key="k">K</Tecla></>, 'Buscar meta, operador ou rede'],
                ...(aoNovaMeta ? [[<Tecla key="n">N</Tecla>, 'Criar nova meta']] : []),
                [<Tecla key="i">?</Tecla>, 'Abrir esta lista'],
                [<Tecla key="e">Esc</Tecla>, 'Fechar o que estiver aberto'],
              ].map(([t, l], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '9px 0', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ fontSize: 13, color: 'var(--t2)' }}>{l}</span>
                  <span style={{ display: 'inline-flex', gap: 5, flexShrink: 0 }}>{t}</span>
                </div>
              ))}

              <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t4)', margin: '20px 0 10px' }}>Ir para</p>
              {Object.entries(destinos).map(([k, [, nome]]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '9px 0', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ fontSize: 13, color: 'var(--t2)' }}>{nome}</span>
                  <span style={{ display: 'inline-flex', gap: 5, flexShrink: 0 }}><Tecla>G</Tecla><Tecla>{k.toUpperCase()}</Tecla></span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
