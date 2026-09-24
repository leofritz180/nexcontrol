'use client'
// ─────────────────────────────────────────────────────────────────────────
// A VOZ DAS NOTIFICAÇÕES
//
// Uma vez por conta (e depois quando quiser, pelo menu), a pessoa escolhe
// como o NexControl fala com ela no push — Sério, Engraçado ou Low profile
// — e o que quer receber (ciclo da meta, remessas, marcos, insights,
// Network). Cobrança e anúncio oficial não têm interruptor nem mudam de
// voz.
//
// A escolha vai pro user_metadata da conta (auth.updateUser), que é o que
// o servidor lê na hora de mandar (lib/pushNotificar). Não precisa de
// migration, e a mesma conta em outro aparelho vê a mesma escolha. Uma
// cópia fica no localStorage só pra abrir instantâneo e pro menu mostrar
// "Voz: Engraçado" sem esperar a rede.
//
// As amostras dos cartões são o TEXTO REAL do catálogo (textoDe), com dados
// de exemplo — o que a pessoa vê aqui é o que vai chegar no aparelho. E o
// "me manda um exemplo" manda de verdade, na voz marcada, mesmo antes de
// salvar (vozPrevia no /api/push/send).
//
// Entra no coordenador de overlays com prioridade baixa quando abre
// sozinho (depois do bem-vindo e do tour); aberto pelo menu, não espera
// ninguém.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useOverlaySlot } from '../../lib/overlayCoordinator'
import { supabase } from '../../lib/supabase/client'
import { dispararPush } from '../../lib/pushClient'
import { VOZES, CATEGORIAS, PREFS_PADRAO, normalizarPrefs, textoDe } from '../../lib/notificacoes'
import { SOMBRA, Ico, RED, RED2 } from '../ui/bento'

const VISTO = 'nx_voz_push_visto_'
const CACHE = 'nx_push_prefs_'

export function lerPrefsLocais(userId) {
  try { const v = localStorage.getItem(CACHE + userId); return v ? normalizarPrefs(JSON.parse(v)) : null } catch { return null }
}

// Dados de exemplo — os mesmos pra todas as vozes, pra comparar de igual
// pra igual. Admin vê o que recebe de admin; operador, o que recebe de operador.
const EXEMPLOS = {
  admin: [
    ['meta-finalizada', { nome: 'Fabio', contas: 10, rede: 'W1', nRem: 8, valor: 900 }],
    ['remessa-nova', { nome: 'Fabio', valor: 340, contas: 12, rede: 'W1', feitas: 6, alvo: 10 }],
  ],
  operator: [
    ['marco-meta', { feitas: 10, alvo: 10, rede: 'W1', marco: 100, paraOperador: true }],
    ['remessa-feedback', { valor: 340, perConta: 28.33, contas: 12 }],
  ],
}

const I_SINO = <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>
const I_CHECK = <polyline points="20 6 9 17 4 12" />
const I_ENVIAR = <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>

/* Uma notificação como o aparelho desenha: ícone, app · hora, título, corpo */
function Amostra({ titulo, corpo }) {
  return (
    <span style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--b1)', textAlign: 'left' }}>
      {/* o mesmo ícone que o aparelho mostra (public/sw.js) — uma letra
          branca aqui viraria preta na camada de cores do tema claro */}
      <img src="/icons/icon-192.png?v=8" alt="" aria-hidden width={26} height={26} style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'block' }} />
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 10, color: 'var(--t4)', letterSpacing: '0.04em', marginBottom: 2 }}>Nex Control · agora</span>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em', overflowWrap: 'anywhere', lineHeight: 1.3 }}>{titulo}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--t3)', lineHeight: 1.45, marginTop: 2, overflowWrap: 'anywhere' }}>{corpo}</span>
      </span>
    </span>
  )
}

function Interruptor({ ligado, onClick, rotulo, sub }) {
  return (
    <button type="button" onClick={onClick} role="switch" aria-checked={ligado}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '10px 12px', borderRadius: 16, border: '1px solid var(--b1)', background: ligado ? 'var(--fill-1)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{rotulo}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--t3)', marginTop: 2, lineHeight: 1.4 }}>{sub}</span>
      </span>
      <span aria-hidden style={{ width: 40, height: 24, borderRadius: 20, flexShrink: 0, position: 'relative', background: ligado ? RED : 'var(--fill-3)', transition: 'background .2s ease' }}>
        <span style={{ position: 'absolute', top: 3, left: ligado ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .2s ease' }} />
      </span>
    </button>
  )
}

export default function VozPush({ userId, isAdmin = true, ativo = true }) {
  const semMovimento = useReducedMotion()
  const [quer, setQuer] = useState(false)
  const [modo, setModo] = useState('primeira')  // primeira | editar
  const [passo, setPasso] = useState(0)          // 0 voz · 1 o que receber
  const [prefs, setPrefs] = useState(PREFS_PADRAO)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [exemplo, setExemplo] = useState('')     // '' | 'enviando' | 'ok' | 'sem-aparelho' | 'erro'

  const papel = isAdmin ? 'admin' : 'operator'
  const exemplos = EXEMPLOS[papel]

  // O que já está salvo: cache local na hora, depois a verdade (metadata)
  useEffect(() => {
    if (!ativo || !userId) return
    const local = lerPrefsLocais(userId)
    if (local) setPrefs(local)
    let vivo = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!vivo) return
        const salvas = data?.user?.user_metadata?.nx_push
        if (salvas) {
          const n = normalizarPrefs(salvas); setPrefs(n)
          try { localStorage.setItem(CACHE + userId, JSON.stringify(n)) } catch {}
          return
        }
        // nunca escolheu: abre uma vez
        try { if (localStorage.getItem(VISTO + userId)) return } catch {}
        setModo('primeira'); setPasso(0); setQuer(true)
      } catch {}
    })()
    return () => { vivo = false }
  }, [userId, ativo])

  // Pelo menu: "Notificações"
  useEffect(() => {
    const abrir = () => { setModo('editar'); setPasso(0); setSalvo(false); setExemplo(''); setQuer(true) }
    window.addEventListener('nx:voz-push', abrir)
    return () => window.removeEventListener('nx:voz-push', abrir)
  }, [])

  const liberado = useOverlaySlot('voz-push', modo === 'editar' ? 0 : 3, quer && ativo)

  function fechar() {
    try { localStorage.setItem(VISTO + userId, '1') } catch {}
    setQuer(false)
  }

  async function salvar() {
    if (salvando) return
    setSalvando(true)
    const n = normalizarPrefs(prefs)
    try {
      const { error } = await supabase.auth.updateUser({ data: { nx_push: { ...n, definidoEm: new Date().toISOString() } } })
      if (error) throw error
      try { localStorage.setItem(CACHE + userId, JSON.stringify(n)); localStorage.setItem(VISTO + userId, '1') } catch {}
      try { window.dispatchEvent(new CustomEvent('nx:voz-push-salva', { detail: n })) } catch {}
      setSalvo(true)
      setTimeout(() => setQuer(false), 900)
    } catch {
      setSalvando(false)
    }
  }

  async function mandarExemplo() {
    if (exemplo === 'enviando') return
    setExemplo('enviando')
    const [tipo, dados] = exemplos[0]
    const r = await dispararPush(tipo, { ...dados, chave: 'exemplo' }, 'eu', { vozPrevia: prefs.voz })
    setExemplo(r?.sent > 0 ? 'ok' : r?.total === 0 ? 'sem-aparelho' : 'erro')
    setTimeout(() => setExemplo(''), 4000)
  }

  const cartoes = useMemo(() => VOZES.map(v => ({ ...v, amostras: exemplos.map(([tipo, d]) => textoDe(tipo, d, v.id)) })), [exemplos])
  const dur = semMovimento ? 0 : 0.4

  // PORTAL, obrigatoriamente. Este componente vive dentro do <main>, que
  // tem z-index: 1 — um contexto de empilhamento próprio. Os botões do dock
  // (sino, microfone) são filhos diretos do <body> com z 240, e 240 no body
  // ganha de 10050 dentro do main: eles apareciam POR CIMA do modal,
  // tampando o X de fechar no celular. No body, 10050 manda.
  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {quer && liberado && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          onClick={fechar}
          style={{
            position: 'fixed', inset: 0, zIndex: 10050,
            background: 'rgba(17,19,24,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 22, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: semMovimento ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="nx-voz"
            style={{
              position: 'relative', width: '100%', maxWidth: 720, maxHeight: '92svh', overflowY: 'auto', overscrollBehavior: 'contain',
              background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 26,
              boxShadow: SOMBRA.flutuante, padding: '26px 24px 22px',
            }}>
            <button type="button" onClick={fechar} aria-label="Fechar"
              style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 13, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={<path d="M18 6L6 18M6 6l12 12" />} s={14} />
            </button>

            {/* cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingRight: 44 }}>
              <span style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, background: `linear-gradient(135deg, ${RED2}, ${RED})`, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(229,57,31,0.28)' }}>
                <Ico d={I_SINO} s={19} c="#fff" />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)' }}>
                  {passo === 0 ? 'Passo 1 de 2 · a voz' : 'Passo 2 de 2 · o que receber'}
                </span>
                <span style={{ display: 'block', fontSize: 21, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.025em', marginTop: 2 }}>
                  {passo === 0 ? 'Como o NexControl fala com você' : 'O que chega no seu celular'}
                </span>
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {passo === 0 ? (
                <motion.div key="voz" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: dur, ease: [0.33, 1, 0.68, 1] }}>
                  <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 16px', lineHeight: 1.55 }}>
                    Três jeitos de contar a mesma coisa. Os exemplos abaixo são o texto real que vai chegar — escolha o que combina com você.
                  </p>
                  <div className="nx-voz-grade" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                    {cartoes.map(v => {
                      const ativa = prefs.voz === v.id
                      return (
                        <button key={v.id} type="button" onClick={() => setPrefs(p => ({ ...p, voz: v.id }))} aria-pressed={ativa}
                          style={{
                            display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 20, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                            background: ativa ? 'rgba(229,57,31,0.05)' : 'var(--fill-1)',
                            border: ativa ? '2px solid ' + RED : '1px solid var(--b1)',
                            boxShadow: ativa ? '0 10px 28px rgba(229,57,31,0.16)' : 'none',
                            transition: 'border-color .18s ease, box-shadow .18s ease, background .18s ease',
                          }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.015em' }}>{v.nome}</span>
                            <span aria-hidden style={{ width: 22, height: 22, borderRadius: 8, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: ativa ? RED : 'var(--surface)', border: ativa ? 'none' : '1px solid var(--b2)', color: '#fff' }}>
                              {ativa && <Ico d={I_CHECK} s={12} c="#fff" />}
                            </span>
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.45, minHeight: 33 }}>{v.sub}</span>
                          {v.amostras.map((a, k) => <Amostra key={k} titulo={a.titulo} corpo={a.corpo} />)}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="cat" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: dur, ease: [0.33, 1, 0.68, 1] }}>
                  <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 14px', lineHeight: 1.55 }}>
                    Desligue o que não quer ver. Cobrança do plano e avisos oficiais chegam sempre.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {CATEGORIAS.map(c => (
                      <Interruptor key={c.id} ligado={prefs[c.id] !== false} rotulo={c.nome} sub={c.sub}
                        onClick={() => setPrefs(p => ({ ...p, [c.id]: p[c.id] === false }))} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* rodapé */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 12px', marginTop: 20 }}>
              <button type="button" onClick={mandarExemplo} disabled={exemplo === 'enviando'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 14px', borderRadius: 30, border: '1px solid var(--b2)', background: 'var(--surface)', color: 'var(--t2)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                <Ico d={I_ENVIAR} s={14} />
                {exemplo === 'enviando' ? 'Enviando…' : exemplo === 'ok' ? 'Chegou aí? ✓' : exemplo === 'sem-aparelho' ? 'Ative as notificações primeiro' : exemplo === 'erro' ? 'Não deu, tenta de novo' : `Me manda um exemplo (${VOZES.find(v => v.id === prefs.voz)?.nome})`}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                {passo === 1 && (
                  <button type="button" onClick={() => setPasso(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: 'var(--t3)', minHeight: 44, padding: '0 8px' }}>
                    Voltar
                  </button>
                )}
                <motion.button type="button" onClick={() => (passo === 0 ? setPasso(1) : salvar())} disabled={salvando}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 44, padding: '0 22px', borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff', background: salvo ? 'var(--profit)' : `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.3)' }}>
                  {salvo ? <><Ico d={I_CHECK} s={15} c="#fff" /> Salvo</> : passo === 0 ? <>Continuar <Ico d={<path d="M5 12h14M13 6l6 6-6 6" />} s={15} c="#fff" /></> : salvando ? 'Salvando…' : 'Salvar'}
                </motion.button>
              </div>
            </div>
          </motion.div>
          <style>{`
            @media (max-width: 640px) {
              .nx-voz { padding: 22px 16px 18px !important; border-radius: 22px !important; }
              .nx-voz-grade { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
