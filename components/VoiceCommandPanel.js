'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const BETA_EMAILS = new Set(['leofritz180@gmail.com'])

// Comandos de navegacao — slug → rota (e variantes faladas)
const NAV_COMMANDS = [
  { keys: ['admin', 'painel', 'dashboard', 'inicio'],              label: 'admin',         route: '/admin' },
  { keys: ['operadores', 'operador'],                              label: 'operadores',    route: '/operadores' },
  { keys: ['redes', 'rede'],                                       label: 'redes',         route: '/redes' },
  { keys: ['faturamento', 'fatura'],                               label: 'faturamento',   route: '/faturamento' },
  { keys: ['custos', 'custo', 'despesas', 'despesa', 'gastos'],    label: 'custos',        route: '/custos' },
  { keys: ['pix'],                                                 label: 'pix',           route: '/pix' },
  { keys: ['slots', 'slot'],                                       label: 'slots',         route: '/slots' },
  { keys: ['proxy', 'proxis'],                                     label: 'proxy',         route: '/proxy' },
  { keys: ['afiliados', 'afiliado'],                               label: 'afiliados',     route: '/afiliados' },
  { keys: ['aulas', 'aula'],                                       label: 'aulas',         route: '/aulas' },
  { keys: ['planejamento', 'planejar'],                            label: 'planejamento',  route: '/planejamento' },
  { keys: ['tutorial', 'tutoriais'],                               label: 'tutorial',      route: '/tutorial' },
  { keys: ['cobrar', 'cobranca', 'billing', 'assinatura'],         label: 'cobranca',      route: '/billing-mp' },
  { keys: ['owner', 'dono', 'painel dono'],                        label: 'owner',         route: '/owner' },
]

const TAB_COMMANDS = [
  { keys: ['visao geral', 'visao', 'geral'],         tab: 'overview',   label: 'visao geral' },
  { keys: ['minha operacao', 'operacao'],            tab: 'myops',      label: 'minha operacao' },
  { keys: ['metas', 'fechamento'],                   tab: 'operations', label: 'metas & fechamento' },
  { keys: ['metodos', 'metodo'],                     tab: 'metodos',    label: 'metodos' },
  { keys: ['ranking'],                               tab: 'ranking',    label: 'ranking' },
  { keys: ['lixeira', 'lixo'],                       tab: 'trash',      label: 'lixeira' },
]

const ACTION_COMMANDS = [
  { regex: /(?:registrar |lancar |adicionar )?(?:lucro|ganho|ganhei)\s*(?:de\s*)?(?:r\$\s*)?([\d.,]+)/, action: 'metodo_lucro' },
  { regex: /(?:registrar |lancar |adicionar )?(?:prejuizo|perda|perdi|perdeu)\s*(?:de\s*)?(?:r\$\s*)?([\d.,]+)/, action: 'metodo_prejuizo' },
  { regex: /(?:novo|abrir|criar)\s*(?:metodo|registro|operacao)/, action: 'metodo_novo' },
]

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/̀-ͯ/g, '').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseValor(s) {
  if (!s) return 0
  let str = String(s).replace(/[^\d,.]/g, '')
  if (str.includes(',')) str = str.replace(/\./g, '').replace(',', '.')
  return Number(str) || 0
}

export default function VoiceCommandPanel({ userEmail }) {
  const router = useRouter()
  // Email pode vir por prop (montagem antiga) ou ser resolvido sozinho (montagem global no layout raiz)
  const [resolvedEmail, setResolvedEmail] = useState(userEmail || '')
  useEffect(() => {
    if (userEmail) { setResolvedEmail(userEmail); return }
    let active = true
    // 1) tenta pegar a sessao atual
    supabase.auth.getSession()
      .then(({ data }) => { if (active) setResolvedEmail(data?.session?.user?.email || '') })
      .catch(() => {})
    // 2) acompanha login/logout/refresh — assim o botao nunca some por sessao atrasada
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setResolvedEmail(session?.user?.email || '')
    })
    return () => { active = false; authSub?.subscription?.unsubscribe?.() }
  }, [userEmail])
  const enabled = !!(resolvedEmail && BETA_EMAILS.has(String(resolvedEmail).toLowerCase()))
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [lastAction, setLastAction] = useState(null)
  const [status, setStatus] = useState('idle') // idle | starting | listening | error
  const [errorMsg, setErrorMsg] = useState('')
  const recogRef = useRef(null)
  const listeningRef = useRef(false)
  const handleCommandRef = useRef(() => {})

  // Atualiza ref do handler pra evitar stale closure
  useEffect(() => {
    handleCommandRef.current = (heard) => {
      if (!heard) return
      const norm = normalize(heard)
      console.log('[voice] command:', norm)

      // 1) Acoes com valor (registrar lucro 150)
      for (const a of ACTION_COMMANDS) {
        const m = norm.match(a.regex)
        if (m) {
          const onAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
          if (a.action === 'metodo_lucro' || a.action === 'metodo_prejuizo') {
            const valor = parseValor(m[1])
            if (valor > 0) {
              const tipo = a.action === 'metodo_lucro' ? 'lucro' : 'prejuizo'
              const detail = { tipo, valor }
              if (onAdmin) {
                window.dispatchEvent(new CustomEvent('voice:metodo', { detail }))
              } else {
                try { sessionStorage.setItem('voice:pendingMetodo', JSON.stringify(detail)) } catch {}
                router.push('/admin')
              }
              setLastAction({ ok: true, msg: 'Abrindo metodos: ' + tipo + ' R$ ' + valor.toFixed(2).replace('.', ',') })
              return
            }
          } else if (a.action === 'metodo_novo') {
            const detail = { open: true }
            if (onAdmin) {
              window.dispatchEvent(new CustomEvent('voice:metodo', { detail }))
            } else {
              try { sessionStorage.setItem('voice:pendingMetodo', JSON.stringify(detail)) } catch {}
              router.push('/admin')
            }
            setLastAction({ ok: true, msg: 'Abrindo Metodos' })
            return
          }
        }
      }

      // 2) Abas
      for (const t of TAB_COMMANDS) {
        for (const k of t.keys) {
          if (norm.includes(k)) {
            const onAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
            if (onAdmin) {
              window.dispatchEvent(new CustomEvent('voice:tab', { detail: { tab: t.tab } }))
            } else {
              try { sessionStorage.setItem('voice:pendingTab', t.tab) } catch {}
              router.push('/admin')
            }
            setLastAction({ ok: true, msg: 'Aba: ' + t.label })
            return
          }
        }
      }

      // 3) Navegacao
      for (const c of NAV_COMMANDS) {
        for (const k of c.keys) {
          if (norm.includes(k)) {
            router.push(c.route)
            setLastAction({ ok: true, msg: 'Indo pra ' + c.label })
            return
          }
        }
      }

      setLastAction({ ok: false, msg: 'Nao reconhecido: "' + heard.slice(0, 50) + '"' })
    }
  })

  // Manage SpeechRecognition based on listening state
  useEffect(() => {
    if (!enabled) return
    listeningRef.current = listening

    if (!listening) {
      try { recogRef.current?.stop() } catch {}
      recogRef.current = null
      if (status === 'listening' || status === 'starting') setStatus('idle')
      return
    }

    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) {
      setStatus('error')
      setErrorMsg('Navegador nao suporta reconhecimento de voz. Use Chrome ou Edge no desktop.')
      setListening(false)
      return
    }

    setStatus('starting')
    setErrorMsg('')

    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 3

    rec.onstart = () => {
      console.log('[voice] mic started')
      setStatus('listening')
    }

    rec.onaudiostart = () => {
      console.log('[voice] audio captured')
    }

    rec.onresult = (e) => {
      let finalText = ''
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += txt + ' '
        else interimText += txt
      }
      if (interimText) setInterim(interimText.trim())
      if (finalText) {
        const cleaned = finalText.trim()
        console.log('[voice] heard:', cleaned)
        setTranscript(cleaned)
        setInterim('')
        handleCommandRef.current(cleaned)
      }
    }

    rec.onerror = (e) => {
      console.warn('[voice] error:', e.error, e.message)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setStatus('error')
        setErrorMsg('Permissao de microfone negada. Clique no cadeado da URL → Permissoes → Microfone → Permitir, depois recarregue.')
        setListening(false)
      } else if (e.error === 'no-speech') {
        // Comum — usuario silencio. Mantem ouvindo.
      } else if (e.error === 'audio-capture') {
        setStatus('error')
        setErrorMsg('Nao encontrei microfone. Verifique se ha um conectado.')
        setListening(false)
      } else if (e.error === 'network') {
        setStatus('error')
        setErrorMsg('Erro de rede no servico de voz. Tente de novo.')
      } else if (e.error === 'aborted') {
        // ignorar
      } else {
        setStatus('error')
        setErrorMsg('Erro: ' + e.error)
      }
    }

    rec.onend = () => {
      console.log('[voice] mic ended, listening=', listeningRef.current)
      if (listeningRef.current) {
        // Re-iniciar pra contornar pausa automatica do navegador (acontece em ~60s)
        try { rec.start() } catch (e) {
          console.warn('[voice] restart fail', e)
          setStatus('idle')
        }
      } else {
        setStatus('idle')
      }
    }

    try {
      rec.start()
      recogRef.current = rec
    } catch (e) {
      console.error('[voice] start fail', e)
      setStatus('error')
      setErrorMsg('Nao foi possivel iniciar o microfone: ' + (e?.message || 'erro'))
      setListening(false)
    }

    return () => { try { rec.stop() } catch {} }
  }, [listening, enabled])

  // F3 toggle + auto-abrir painel
  useEffect(() => {
    if (!enabled) return
    function onKey(e) {
      if (e.key === 'F3') {
        e.preventDefault()
        setListening(prev => {
          const next = !prev
          if (next) setOpen(true) // sempre abre painel ao ligar pro user ver feedback
          return next
        })
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
        setListening(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, open])

  if (!enabled) return null

  const statusColor = status === 'listening' ? '#10B981' : status === 'starting' ? '#F59E0B' : status === 'error' ? '#EF4444' : '#64748B'
  const statusLabel = status === 'listening' ? 'Ouvindo' : status === 'starting' ? 'Iniciando...' : status === 'error' ? 'Erro' : 'Inativo'

  return (
    <>
      {/* Floating mic button */}
      <button
        type="button"
        onClick={() => {
          setListening(prev => {
            const next = !prev
            if (next) setOpen(true)
            return next
          })
        }}
        aria-label="Comandos de voz (F3)"
        title="Comandos de voz · F3"
        style={{
          position: 'fixed', bottom: 22, right: 130, zIndex: 201,
          width: 40, height: 40, borderRadius: '50%',
          cursor: 'pointer',
          background: listening ? '#e53935' : 'rgba(20,20,20,0.95)',
          border: '1px solid ' + (listening ? '#e53935' : 'rgba(255,255,255,0.1)'),
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: listening ? '0 0 0 0 rgba(229,57,53,0.4), 0 6px 18px rgba(0,0,0,0.4)' : '0 6px 18px rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
        }}
      >
        {listening && (
          <motion.span
            aria-hidden
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#e53935' }}
          />
        )}
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
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
              width: 360, maxHeight: '75vh',
              background: 'rgba(15,15,15,0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ position: 'relative', width: 8, height: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                  {status === 'listening' && (
                    <motion.div aria-hidden
                      initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: statusColor }} />
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>Comandos de Voz</span>
                <span style={{ fontSize: 10, color: statusColor, fontWeight: 600, marginLeft: 4 }}>· {statusLabel}</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: 'rgba(229,57,53,0.15)', color: '#e53935', letterSpacing: '0.04em', marginLeft: 'auto' }}>BETA</span>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setListening(false) }}
                  aria-label="Fechar"
                  title="Fechar"
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, cursor: 'pointer', color: '#94A3B8',
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F1F5F9'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                >
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--mono)' }}>F3</kbd> ativar · <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--mono)' }}>Esc</kbd> fechar
              </p>
            </div>

            {/* Erro destacado */}
            {errorMsg && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#EF4444', lineHeight: 1.5 }}>
                {errorMsg}
              </div>
            )}

            {/* Transcript em tempo real */}
            {(transcript || interim || lastAction) && (
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
                {interim && (
                  <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginBottom: 2 }}>
                    "{interim}"...
                  </div>
                )}
                {transcript && (
                  <div style={{ fontSize: 11, color: '#F1F5F9', fontWeight: 600, marginBottom: lastAction ? 4 : 0 }}>
                    Capturado: "{transcript}"
                  </div>
                )}
                {lastAction && (
                  <div style={{ fontSize: 11, color: lastAction.ok ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                    {lastAction.ok ? '✓' : '⚠'} {lastAction.msg}
                  </div>
                )}
              </div>
            )}

            {status === 'listening' && !transcript && !interim && (
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(16,185,129,0.04)', fontSize: 11, color: '#10B981', textAlign: 'center' }}>
                Microfone ativo · pode falar
              </div>
            )}

            {/* Commands list */}
            <div style={{ overflowY: 'auto', padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Navegacao</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                {NAV_COMMANDS.map(c => (
                  <div key={c.label} style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ color: '#F1F5F9', fontWeight: 600 }}>"{c.keys[0]}"</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>— {c.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Abas do painel</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                {TAB_COMMANDS.map(c => (
                  <div key={c.tab} style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ color: '#F1F5F9', fontWeight: 600 }}>"{c.keys[0]}"</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>— {c.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Acoes rapidas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>"lucro 150"</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}> — abre Metodos com R$ 150</span>
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>"prejuizo 80"</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}> — idem prejuizo</span>
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>"novo metodo"</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}> — abre form vazio</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
