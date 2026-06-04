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

// Perguntas que a voz RESPONDE falando (texto ja normalizado: sem acento, minusculo).
// Detecta intencao de lucro + periodo. Retorna { type, periodo } ou null.
const QUERY_PERGUNTAS = [
  { test: n => /hoje/.test(n),            type: 'lucro_hoje',      periodo: 'de hoje' },
  { test: n => /semana/.test(n),          type: 'lucro_semana',    periodo: 'da semana' },
  { test: n => /(mes|mês)\s*atual/.test(n), type: 'lucro_mes_atual', periodo: 'deste mês' },
  { test: n => /(mes|mês)/.test(n),       type: 'lucro_mes_atual', periodo: 'do mês' },
]
function matchPergunta(norm) {
  // Precisa ter intencao de "quanto lucrei / qual meu lucro / quanto faturei"
  const querLucro = /quanto/.test(norm) || /lucr/.test(norm) || /faturei|fatur/.test(norm) || /ganhei/.test(norm)
  if (!querLucro) return null
  for (const q of QUERY_PERGUNTAS) if (q.test(norm)) return q
  return null
}

// Nome amigavel da voz (tira prefixos tecnicos) + se e "natural"/premium
function prettyVoz(name) {
  if (!name) return 'Automática (recomendada)'
  let s = String(name)
    .replace(/Microsoft\s+/i, '')
    .replace(/\s*Online\s*\(Natural\)\s*/i, ' ')
    .replace(/\s*-\s*Portugu[eê]s.*$/i, '')
    .replace(/Google\s+portugu[eê]s\s+do\s+brasil/i, 'Google Brasil')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return s || name
}
function isVozNatural(name) { return /natural|google|premium|neural/i.test(name || '') }

// Saudacao pelo horario de Brasilia (bom dia / boa tarde / boa noite)
function saudacaoHora() {
  let h
  try {
    h = parseInt(new Intl.DateTimeFormat('en-US', { hour: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(new Date()), 10)
  } catch { h = new Date().getHours() }
  if (h >= 5 && h < 12) return 'bom dia'
  if (h >= 12 && h < 18) return 'boa tarde'
  return 'boa noite'
}

// Monta a frase falada a partir do valor numerico (TTS pt-BR le inteiros bem).
function fraseLucro(value, periodo) {
  const v = Number(value) || 0
  const noun = v >= 0 ? 'lucro' : 'prejuízo'
  const abs = Math.abs(v)
  const reais = Math.floor(abs)
  const cent = Math.round((abs - reais) * 100)
  let s = `Seu ${noun} ${periodo} foi de ${reais} ${reais === 1 ? 'real' : 'reais'}`
  if (cent > 0) s += ` e ${cent} ${cent === 1 ? 'centavo' : 'centavos'}`
  return s + '.'
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
  const voicesRef = useRef([])
  const mutedRef = useRef(false) // true enquanto o robo fala (ignora o proprio audio captado)
  const [speaking, setSpeaking] = useState(false)
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoiceName, setSelectedVoiceName] = useState('')
  const [showAllVoices, setShowAllVoices] = useState(false)
  const [pitch, setPitch] = useState(1.0)

  // Carrega vozes do navegador (chega async no Chrome) + escolha salva
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => {
      const list = window.speechSynthesis.getVoices() || []
      voicesRef.current = list
      setAvailableVoices(list)
    }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    try {
      const v = localStorage.getItem('voice:selectedVoice'); if (v) setSelectedVoiceName(v)
      const p = parseFloat(localStorage.getItem('voice:pitch') || ''); if (!isNaN(p)) setPitch(p)
    } catch {}
    return () => { try { window.speechSynthesis.removeEventListener?.('voiceschanged', load) } catch {} }
  }, [])

  // Resolve a voz a usar: escolha salva > melhor pt-BR automatica
  function resolveVoice(voices) {
    if (selectedVoiceName) {
      const v = voices.find(x => x.name === selectedVoiceName)
      if (v) return v
    }
    const ptBR = voices.filter(v => /pt[-_]?BR/i.test(v.lang))
    return ptBR.find(v => /google/i.test(v.name))
      || ptBR.find(v => /natural|maria|luciana|francisca|fernanda|thalita|brenda/i.test(v.name))
      || ptBR[0]
      || voices.find(v => /^pt/i.test(v.lang))
      || null
  }

  function selectVoice(name) {
    setSelectedVoiceName(name)
    try { localStorage.setItem('voice:selectedVoice', name || '') } catch {}
  }
  function changePitch(p) {
    setPitch(p)
    try { localStorage.setItem('voice:pitch', String(p)) } catch {}
  }

  // Toca um exemplo com uma voz especifica (pra audicionar)
  function previewVoice(v) {
    try {
      const synth = typeof window !== 'undefined' && window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance('Olá Leonardo, boa noite. Seu lucro de hoje foi de 1.250 reais.')
      u.lang = 'pt-BR'; u.pitch = pitch; u.rate = 1.0; u.volume = 1
      if (v) u.voice = v
      mutedRef.current = true
      setSpeaking(true)
      u.onend = () => { setSpeaking(false); setTimeout(() => { mutedRef.current = false }, 350) }
      u.onerror = () => { setSpeaking(false); mutedRef.current = false }
      synth.speak(u)
    } catch { mutedRef.current = false; setSpeaking(false) }
  }

  // Fala um texto com voz grave/robotica em pt-BR
  function speak(text) {
    try {
      const synth = typeof window !== 'undefined' && window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'pt-BR'
      u.pitch = pitch
      u.rate = 1.0
      u.volume = 1
      const voices = voicesRef.current.length ? voicesRef.current : (synth.getVoices() || [])
      const chosen = resolveVoice(voices)
      if (chosen) u.voice = chosen
      mutedRef.current = true
      setSpeaking(true)
      u.onend = () => { setSpeaking(false); setTimeout(() => { mutedRef.current = false }, 350) }
      u.onerror = () => { setSpeaking(false); mutedRef.current = false }
      synth.speak(u)
    } catch { mutedRef.current = false; setSpeaking(false) }
  }

  // Busca o valor (silent = sem push) e responde falando
  async function responderPergunta(q) {
    setLastAction({ ok: true, msg: 'Calculando ' + q.periodo + '...' })
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) { speak('Nao consegui autenticar.'); return }
      const r = await fetch('/api/notify/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ type: q.type, silent: true }),
      })
      const j = await r.json()
      const val = j?.payload?.value
      if (val == null) { speak('Desculpa, nao encontrei esse dado agora.'); setLastAction({ ok: false, msg: 'Sem dados pra ' + q.periodo }); return }
      // Saudacao personalizada: "Ola Leonardo, boa noite. Seu lucro de hoje foi de..."
      const primeiroNome = String(j?.userName || '').trim().split(/\s+/)[0] || ''
      const saud = saudacaoHora()
      const abertura = primeiroNome
        ? `Olá ${primeiroNome}, ${saud}. `
        : `${saud.charAt(0).toUpperCase() + saud.slice(1)}. `
      const frase = abertura + fraseLucro(val, q.periodo)
      const fmt = (Number(val) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      setLastAction({ ok: true, msg: (val >= 0 ? '+' : '-') + 'R$ ' + fmt.replace('-', '') + ' · ' + q.periodo })
      speak(frase)
    } catch {
      speak('Tive um erro ao buscar.')
      setLastAction({ ok: false, msg: 'Erro ao calcular ' + q.periodo })
    }
  }

  // Atualiza ref do handler pra evitar stale closure
  useEffect(() => {
    handleCommandRef.current = (heard) => {
      if (!heard) return
      const norm = normalize(heard)
      console.log('[voice] command:', norm)

      // 0) Perguntas que a voz RESPONDE falando (quanto lucrei hoje/semana/mes)
      const perg = matchPergunta(norm)
      if (perg) {
        responderPergunta(perg)
        return
      }

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
      try { window.speechSynthesis?.cancel() } catch {}
      mutedRef.current = false
      setSpeaking(false)
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
      // Enquanto o robo fala, ignora o que o microfone captar (evita auto-loop)
      if (mutedRef.current) return
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

  const statusColor = speaking ? '#D1FAE5' : status === 'listening' ? '#10B981' : status === 'starting' ? '#F59E0B' : status === 'error' ? '#EF4444' : '#64748B'
  const statusLabel = speaking ? 'Respondendo' : status === 'listening' ? 'Ouvindo' : status === 'starting' ? 'Iniciando...' : status === 'error' ? 'Erro' : 'Inativo'

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
              {/* ── Seletor de voz da resposta ── */}
              {(() => {
                const ptVoices = availableVoices.filter(v => /^pt/i.test(v.lang))
                const others = availableVoices.filter(v => !/^pt/i.test(v.lang))
                const shown = showAllVoices ? [...ptVoices, ...others] : ptVoices
                const rowBase = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, marginBottom: 4 }
                const VoiceRow = ({ name, lang, voiceObj, selected }) => (
                  <div style={{ ...rowBase, background: selected ? 'rgba(209,250,229,0.08)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (selected ? 'rgba(209,250,229,0.25)' : 'rgba(255,255,255,0.06)') }}>
                    <button type="button" onClick={() => selectVoice(name)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: selected ? '#D1FAE5' : '#F1F5F9', fontSize: 12, fontWeight: selected ? 700 : 500, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 11 }}>{selected ? '●' : '○'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prettyVoz(name)}</span>
                      {isVozNatural(name) && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(209,250,229,0.12)', color: '#D1FAE5' }}>natural</span>}
                      {lang && <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'var(--mono)' }}>{lang}</span>}
                    </button>
                    {voiceObj !== undefined && (
                      <button type="button" onClick={() => previewVoice(voiceObj)} title="Ouvir exemplo" style={{ flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', color: '#F1F5F9', width: 28, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </button>
                    )}
                  </div>
                )
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      Voz da resposta
                      <span style={{ fontSize: 9, color: '#64748B' }}>· {availableVoices.length} no aparelho</span>
                    </div>
                    {availableVoices.length === 0 && (
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>Carregando vozes do navegador...</div>
                    )}
                    {/* Automática */}
                    <VoiceRow name="" lang="" voiceObj={resolveVoice(availableVoices)} selected={!selectedVoiceName} />
                    {/* Vozes */}
                    {shown.map(v => (
                      <VoiceRow key={v.name + v.lang} name={v.name} lang={v.lang} voiceObj={v} selected={selectedVoiceName === v.name} />
                    ))}
                    {!showAllVoices && others.length > 0 && (
                      <button type="button" onClick={() => setShowAllVoices(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 11, padding: '4px 0', textDecoration: 'underline' }}>
                        mostrar todas as vozes (+{others.length} de outros idiomas)
                      </button>
                    )}
                    {ptVoices.length === 0 && availableVoices.length > 0 && !showAllVoices && (
                      <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 4 }}>Nenhuma voz em português detectada. Toque acima pra ver todas.</div>
                    )}
                    {/* Tom (pitch) */}
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#64748B', flexShrink: 0 }}>Grave</span>
                      <input type="range" min="0.5" max="1.5" step="0.1" value={pitch} onChange={e => changePitch(parseFloat(e.target.value))} style={{ flex: 1, accentColor: '#D1FAE5', cursor: 'pointer' }} />
                      <span style={{ fontSize: 10, color: '#64748B', flexShrink: 0 }}>Aguda</span>
                    </div>
                    {!ptVoices.some(v => isVozNatural(v.name)) && (
                      <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
                        As vozes do seu navegador soam robóticas? As vozes brasileiras <strong style={{ color: '#F1F5F9' }}>naturais</strong> aparecem de graça no <strong style={{ color: '#F1F5F9' }}>Microsoft Edge</strong>. Abra o sistema no Edge e volte aqui — elas vão surgir nesta lista.
                      </div>
                    )}
                  </div>
                )
              })()}

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

              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                Perguntas
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(209,250,229,0.12)', color: '#D1FAE5' }}>voz responde</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>"quanto lucrei hoje?"</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}> — fala o lucro de hoje</span>
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>"quanto lucrei essa semana?"</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}> — lucro dos 7 dias</span>
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>"qual meu lucro do mês?"</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}> — lucro do mês atual</span>
                </div>
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
