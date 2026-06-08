'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const OWNER_EMAIL = 'leofritz180@gmail.com'

// ── Lancamento em fases ──────────────────────────────────────────────
// 'owner' = SO leofritz180 | 'admin' = owner + todos admins | 'all' = todos
// Voz liberada pra admin (completa) + operador (limitada). Card vai pra todos.
const ANNOUNCE_AUDIENCE = 'all'

// Versao do aviso — bump invalida o "ja vi" e mostra de novo a todos
const SEEN_KEY = 'nexVoiceAnnounce_v1'

// Perguntas que a voz responde falando (dado financeiro → so admin/owner)
const PERGUNTAS = [
  { cmd: 'quanto lucrei hoje?', desc: 'ele fala o lucro de hoje' },
  { cmd: 'quanto lucrei essa semana?', desc: 'lucro dos ultimos 7 dias' },
  { cmd: 'qual meu lucro do mes?', desc: 'lucro do mes atual' },
]

// Navegacao por voz, por nivel de acesso
const NAV = {
  owner: ['admin', 'operadores', 'redes', 'faturamento', 'custos', 'pix', 'slots', 'proxy', 'afiliados', 'aulas', 'planejamento', 'tutorial', 'cobrar', 'owner'],
  admin: ['admin', 'operadores', 'redes', 'faturamento', 'custos', 'pix', 'slots', 'proxy', 'afiliados', 'aulas', 'tutorial'],
  operator: ['inicio', 'desempenho', 'slots', 'proxy', 'pix', 'aulas', 'tutorial'],
}

// Acoes rapidas de Metodos (beta) — so owner
const ACOES = [
  { cmd: 'lucro 150', desc: 'lanca lucro de R$ 150 em Metodos' },
  { cmd: 'prejuizo 80', desc: 'lanca prejuizo de R$ 80' },
  { cmd: 'novo metodo', desc: 'abre o formulario de Metodos' },
]

export default function VoiceAnnounceCard({ userEmail, isAdmin }) {
  const [show, setShow] = useState(false)
  const email = String(userEmail || '').toLowerCase()
  const isOwner = email === OWNER_EMAIL
  const level = isOwner ? 'owner' : (isAdmin ? 'admin' : 'operator')

  useEffect(() => {
    if (!email) return
    if (email === 'leofritz178@gmail.com') return // usa o banner de imagem (VoiceBanner)
    if (ANNOUNCE_AUDIENCE === 'owner' && !isOwner) return
    if (ANNOUNCE_AUDIENCE === 'admin' && !(isOwner || isAdmin)) return
    let seen = false
    try { seen = localStorage.getItem(SEEN_KEY) === '1' } catch {}
    if (seen) return
    const t = setTimeout(() => setShow(true), 700) // deixa a dashboard montar
    return () => clearTimeout(t)
  }, [email, isOwner, isAdmin])

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    setShow(false)
  }

  const navList = NAV[level] || NAV.operator
  const showPerguntas = level === 'owner' || level === 'admin' // operador nao ve financeiro
  const showAcoes = level === 'owner'

  const Chip = ({ children }) => (
    <span style={{
      display: 'inline-block', fontSize: 12, fontWeight: 600, color: 'var(--t1)',
      padding: '4px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--mono)',
      whiteSpace: 'nowrap',
    }}>"{children}"</span>
  )

  const SectionTitle = ({ children, accent }) => (
    <p style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
      color: accent || 'var(--t3, var(--t3))', margin: '0 0 10px',
    }}>{children}</p>
  )

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={dismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: 540, maxHeight: '88vh', overflowY: 'auto',
              background: 'var(--surface)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(255,255,255,0.05), 0 24px 70px rgba(0,0,0,0.7), 0 0 40px rgba(255,255,255,0.03)',
              padding: '30px 28px 26px',
            }}
          >
            {/* Fechar */}
            <button type="button" onClick={dismiss} aria-label="Fechar" style={{
              position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 7,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {/* Cabecalho */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#e53935', textTransform: 'uppercase' }}>Novidade</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--t2)', letterSpacing: '0.05em' }}>BETA</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display, Georgia), serif', fontWeight: 400, fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--t1)', margin: '2px 0 0' }}>
                  Comando de Voz
                </h2>
              </div>
            </div>

            {/* Intro */}
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--t2)', margin: '0 0 18px' }}>
              Agora voce comanda o NexControl <strong style={{ color: 'var(--t1)' }}>falando</strong>. Navegue entre telas{showPerguntas ? ' e pergunte seus numeros' : ''} sem tocar na tela.
            </p>

            {/* Como ativar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', marginBottom: 20,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
              </svg>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: '#D4D4D8', margin: 0 }}>
                Toque no <strong style={{ color: 'var(--t1)' }}>microfone</strong> no canto inferior direito da tela
                <span style={{ color: 'var(--t3)' }}> (ou tecla </span><kbd style={{ fontSize: 11, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'var(--mono)' }}>F3</kbd><span style={{ color: 'var(--t3)' }}> no computador)</span> e fale.
              </p>
            </div>

            {/* Perguntas */}
            {showPerguntas && (
              <div style={{ marginBottom: 20 }}>
                <SectionTitle accent="var(--profit)">Pergunte e ouca a resposta</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PERGUNTAS.map(p => (
                    <div key={p.cmd} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <Chip>{p.cmd}</Chip>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>{p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navegacao */}
            <div style={{ marginBottom: showAcoes ? 20 : 22 }}>
              <SectionTitle>Navegue falando</SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {navList.map(n => <Chip key={n}>{n}</Chip>)}
              </div>
            </div>

            {/* Acoes (owner) */}
            {showAcoes && (
              <div style={{ marginBottom: 22 }}>
                <SectionTitle>Acoes rapidas</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ACOES.map(a => (
                    <div key={a.cmd} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <Chip>{a.cmd}</Chip>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>{a.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <button type="button" onClick={dismiss} style={{
              width: '100%', background: '#e53935', color: 'white', border: 'none',
              padding: '14px 20px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#d32f2f' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#e53935' }}
            >
              Entendi, bora testar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
