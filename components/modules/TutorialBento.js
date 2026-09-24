'use client'
// ─────────────────────────────────────────────────────────────────────────
// CENTRAL DE AULAS — a área de membros do NexControl (visual 2.0).
//
// Palco + trilha, como uma plataforma de curso: à esquerda a aula aberta
// (o vídeo oficial ou uma aula prática), à direita a trilha com módulos,
// progresso e a próxima aula. No celular a trilha desce pra baixo do palco.
//
// Só o que existe de verdade entra na trilha: o vídeo do canal NEX CONTROL,
// as seis etapas práticas do onboarding (cada uma com o botão que leva pra
// tela certa) e o guia de notificações. Nada de aula "em breve" inventada.
//
// O vídeo roda pela IFrame API do YouTube só pra dois recursos de área de
// membros de verdade: RETOMAR DE ONDE PAROU e marcar a aula como assistida
// sozinha quando chega ao fim (ou passa de 90%). Se a API não carregar
// (bloqueador, rede), cai no embed comum — o vídeo nunca some.
//
// Quem persiste continua sendo a página /tutorial (marcados, posição do
// vídeo): este módulo recebe tudo por props e só devolve eventos.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ModuleHeader, BCard, Ico, MONO, int, RED, RED2 } from '../ui/bento'

export const VIDEO_ID = 'LQ0P1QSUABM'
const AULA_VIDEO = 'video_intro'
const AULA_PUSH = 'push_celular'

/* ── ícones ── */
const I_CHECK = <polyline points="20 6 9 17 4 12" />
const I_PLAY = <polygon points="5 3 19 12 5 21 5 3" />
const I_SINO = <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>
const I_SETA = <polyline points="9 18 15 12 9 6" />
const I_SETA_ESQ = <polyline points="15 18 9 12 15 6" />
const I_TROFEU = <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
const I_RELOGIO = <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></>
const I_EXTERNO = <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>

const ICONE_PASSO = {
  criar_meta: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>,
  registrar_remessa: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  finalizar_meta: <><path d="M4 22V4a1 1 0 0 1 1-1h12l-2 4 2 4H5" /><path d="M4 22h4" /></>,
  dashboard: <><path d="M3 3v18h18" /><path d="M7 15l3-3 4 4 5-6" /></>,
  convidar_operador: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>,
  fechamento: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
}
const I_GENERICO = <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></>

/* ── atalhos (mesmos destinos de sempre) ── */
const ATALHOS = [
  { rotulo: 'Painel admin', href: '/admin', icone: <><path d="M3 12l2-2 7-7 7 7 2 2" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /></> },
  { rotulo: 'Minha operação', href: '/operator', icone: <><rect x="3" y="11" width="5" height="10" rx="1" /><rect x="10" y="6" width="5" height="15" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></> },
  { rotulo: 'Assinatura', href: '/billing', icone: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M7 15h1M12 15h1" /></> },
]

/* ── guia de notificações (conteúdo fixo) ── */
const PASSOS_PUSH = [
  'Abra o NexControl no navegador do celular',
  'Toque no menu do navegador e selecione "Adicionar à tela inicial"',
  'Abra o app instalado na sua tela inicial',
  'Permita as notificações quando o aviso aparecer',
  'Se não aparecer, ative manualmente nas configurações do navegador',
]

const fmtMin = seg => {
  if (!seg) return null
  const m = Math.round(seg / 60)
  return m < 1 ? 'menos de 1 min' : `${m} min`
}
const fmtTempo = seg => `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}`

/* ── botão padrão da área ── */
function Botao({ children, onClick, href, primario, icone, ...resto }) {
  const estilo = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, padding: '0 18px', borderRadius: 30,
    border: primario ? 'none' : '1px solid var(--b2)',
    background: primario ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--surface)',
    color: primario ? '#fff' : 'var(--t1)',
    boxShadow: primario ? '0 10px 26px rgba(229,57,31,0.28)' : 'none',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
  }
  const corpo = <>{icone && <Ico d={icone} s={15} c={primario ? '#fff' : undefined} />}{children}</>
  if (href) return <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-flex' }}><Link href={href} style={estilo} {...resto}>{corpo}</Link></motion.span>
  return <motion.button type="button" onClick={onClick} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} style={estilo} {...resto}>{corpo}</motion.button>
}

/* ── o player: IFrame API com retomada e conclusão automática ── */
function Player({ videoId, inicio = 0, onTempo, onFim }) {
  const alvo = useRef(null)
  const player = useRef(null)
  const [semApi, setSemApi] = useState(false)
  const cb = useRef({ onTempo, onFim })
  cb.current = { onTempo, onFim }

  useEffect(() => {
    let vivo = true, timer = null
    const relatar = () => {
      const p = player.current
      if (!p || typeof p.getCurrentTime !== 'function') return
      const t = p.getCurrentTime(), d = p.getDuration()
      if (d > 0) cb.current.onTempo?.(t, d)
    }
    const montar = () => {
      if (!vivo || !alvo.current || player.current) return
      player.current = new window.YT.Player(alvo.current, {
        videoId, width: '100%', height: '100%',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.max(0, Math.floor(inicio)) },
        events: {
          onReady: relatar,
          onStateChange: e => {
            clearInterval(timer)
            if (e.data === 1) timer = setInterval(relatar, 5000)   // tocando: guarda a posição
            if (e.data === 2) relatar()                             // pausou: guarda na hora
            if (e.data === 0) { relatar(); cb.current.onFim?.() }  // acabou: aula assistida
          },
        },
      })
    }
    if (window.YT?.Player) montar()
    else {
      ;(window.__nxYtFila = window.__nxYtFila || []).push(montar)
      if (!document.getElementById('nx-yt-api')) {
        const s = document.createElement('script'); s.id = 'nx-yt-api'; s.src = 'https://www.youtube.com/iframe_api'; s.async = true
        document.head.appendChild(s)
        const antes = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => { try { antes?.() } catch {} ; (window.__nxYtFila || []).splice(0).forEach(f => f()) }
      }
    }
    // sem API em 7s (bloqueador, rede): embed comum, o vídeo nunca some
    const socorro = setTimeout(() => { if (vivo && !player.current) setSemApi(true) }, 7000)
    return () => {
      vivo = false; clearInterval(timer); clearTimeout(socorro)
      try { player.current?.destroy?.() } catch {}
      player.current = null
    }
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="nx-player" style={{ position: 'relative', aspectRatio: '16/9', background: '#0b0b0c' }}>
      {semApi ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&start=${Math.max(0, Math.floor(inicio))}`}
          title="Vídeo aula NexControl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      ) : <div ref={alvo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />}
    </div>
  )
}

export default function TutorialBento({ passos = [], marcados = {}, video = {}, onAlternar, onConcluir, onPosicao, onReiniciar }) {
  // A trilha: módulos reais, na ordem em que fazem sentido
  const modulos = useMemo(() => [
    {
      id: 'comece', titulo: 'Comece por aqui', sub: 'O painel inteiro em uma aula',
      aulas: [{ id: AULA_VIDEO, tipo: 'video', titulo: 'Nex Control 2.0 — o painel completo', desc: 'Vídeo oficial do canal NEX CONTROL: como o painel funciona, do primeiro acesso ao fechamento da meta.' }],
    },
    {
      id: 'pratica', titulo: 'Na prática', sub: 'Seis etapas, cada uma feita dentro do painel',
      aulas: passos.map(p => ({ id: p.id, tipo: 'pratica', titulo: p.label, desc: p.desc, href: p.href, cta: p.cta })),
    },
    {
      id: 'alertas', titulo: 'Alertas no celular', sub: 'Instale como app e receba tudo em tempo real',
      aulas: [{ id: AULA_PUSH, tipo: 'guia', titulo: 'Como ativar notificações no celular', desc: 'Instale o NexControl na tela inicial e permita as notificações: remessas, metas e alertas chegam na hora.' }],
    },
  ], [passos])

  const aulas = useMemo(() => modulos.flatMap(m => m.aulas.map(a => ({ ...a, modulo: m.titulo }))), [modulos])
  const feita = id => !!marcados[id]
  const total = aulas.length
  const feitas = aulas.filter(a => feita(a.id)).length
  const tudoFeito = total > 0 && feitas === total
  const pct = total ? Math.round((feitas / total) * 100) : 0
  const proxima = aulas.find(a => !feita(a.id)) || null

  // Aula aberta: começa na primeira não concluída (ou na primeira de todas)
  const [abertaId, setAbertaId] = useState(null)
  const aberta = aulas.find(a => a.id === abertaId) || proxima || aulas[0]
  const idx = aulas.findIndex(a => a.id === aberta?.id)
  const anterior = idx > 0 ? aulas[idx - 1] : null
  const seguinte = idx >= 0 && idx < aulas.length - 1 ? aulas[idx + 1] : null
  const palcoRef = useRef(null)

  const abrir = id => {
    setAbertaId(id)
    // no celular a trilha fica embaixo: ao escolher, volta pro palco
    try { if (window.innerWidth <= 900) palcoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
  }

  const posicaoSalva = Number(video.pos || 0)
  const duracao = Number(video.seg || 0)
  const retomar = posicaoSalva > 20 && duracao > 0 && posicaoSalva < duracao * 0.95

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Central de aulas"
        sub="Aprenda a operar o NexControl no seu ritmo"
        acao={feitas > 0 ? (
          <motion.button
            type="button" onClick={onReiniciar}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 18px', borderRadius: 30,
              border: '1px solid var(--b2)', background: 'var(--surface)', color: 'var(--t2)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}>
            <Ico d={<><path d="M3 12a9 9 0 1 0 3-6.7" /><polyline points="3 4 3 9 8 9" /></>} s={15} />
            Reiniciar progresso
          </motion.button>
        ) : null}
      />

      <div className="tub-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 14, alignItems: 'start' }}>
        {/* ══════════ PALCO ══════════ */}
        <div ref={palcoRef} style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, scrollMarginTop: 16 }}>
          <BCard pad={0} delay={0.04}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={aberta?.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                {aberta?.tipo === 'video' && (
                  <Player
                    videoId={VIDEO_ID}
                    inicio={retomar ? posicaoSalva : 0}
                    onTempo={(t, d) => { onPosicao?.(t, d); if (!feita(AULA_VIDEO) && d > 0 && t / d >= 0.9) onConcluir?.(AULA_VIDEO) }}
                    onFim={() => onConcluir?.(AULA_VIDEO)}
                  />
                )}

                {aberta?.tipo === 'pratica' && (
                  <div style={{ padding: '30px 28px 8px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ width: 64, height: 64, borderRadius: 22, flexShrink: 0, background: feita(aberta.id) ? 'var(--profit-dim)' : 'var(--fill-1)', border: `1px solid ${feita(aberta.id) ? 'var(--profit-border)' : 'var(--b1)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: feita(aberta.id) ? 'var(--profit)' : RED }}>
                      <Ico d={ICONE_PASSO[aberta.id] || I_GENERICO} s={28} />
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', color: 'var(--t4)' }}>
                      ETAPA {String(passos.findIndex(p => p.id === aberta.id) + 1).padStart(2, '0')} DE {String(passos.length).padStart(2, '0')}
                    </span>
                  </div>
                )}

                {aberta?.tipo === 'guia' && (
                  <div style={{ padding: '30px 28px 8px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ width: 64, height: 64, borderRadius: 22, flexShrink: 0, background: feita(aberta.id) ? 'var(--profit-dim)' : 'var(--fill-1)', border: `1px solid ${feita(aberta.id) ? 'var(--profit-border)' : 'var(--b1)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: feita(aberta.id) ? 'var(--profit)' : RED }}>
                      <Ico d={I_SINO} s={28} />
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', color: 'var(--t4)' }}>GUIA</span>
                  </div>
                )}

                {/* ficha da aula */}
                <div style={{ padding: aberta?.tipo === 'video' ? '20px 28px 24px' : '14px 28px 26px' }}>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>
                    {aberta?.modulo} · aula {idx + 1} de {total}
                  </p>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.025em', overflowWrap: 'anywhere' }}>{aberta?.titulo}</h2>
                  <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: '8px 0 0', lineHeight: 1.6 }}>{aberta?.desc}</p>

                  {aberta?.tipo === 'video' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', padding: '6px 11px', borderRadius: 999, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)' }}>CANAL NEX CONTROL</span>
                      <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', padding: '6px 11px', borderRadius: 999, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)' }}>EXCLUSIVO ADMIN</span>
                      {duracao > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', padding: '6px 11px', borderRadius: 999, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)' }}>
                          <Ico d={I_RELOGIO} s={12} />{fmtMin(duracao).toUpperCase()}
                        </span>
                      )}
                      {retomar && !feita(AULA_VIDEO) && (
                        <span style={{ fontSize: 12, color: 'var(--t3)' }}>Retomando de {fmtTempo(posicaoSalva)}</span>
                      )}
                    </div>
                  )}

                  {aberta?.tipo === 'guia' && (
                    <div className="tub-push" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 18 }}>
                      {PASSOS_PUSH.map((txt, i) => (
                        <div key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 15px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
                          <span style={{ width: 26, height: 26, borderRadius: 9, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 10.5, fontWeight: 900, color: RED }}>{String(i + 1).padStart(2, '0')}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', lineHeight: 1.5 }}>{txt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ações da aula */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
                    {aberta?.tipo === 'pratica' && aberta.href && (
                      <Botao href={aberta.href} primario icone={I_EXTERNO}>{aberta.cta || 'Fazer agora'}</Botao>
                    )}
                    {aberta && (
                      <Botao onClick={() => onAlternar?.(aberta.id)} aria-pressed={feita(aberta.id)} primario={aberta.tipo !== 'pratica' && !feita(aberta.id)}
                        icone={I_CHECK}>
                        {feita(aberta.id) ? 'Concluída — desmarcar' : aberta.tipo === 'video' ? 'Marcar como assistida' : 'Marcar como concluída'}
                      </Botao>
                    )}
                    {feita(aberta?.id) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--profit)' }}>
                        <Ico d={I_CHECK} s={14} c="var(--profit)" /> Concluída
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* anterior / próxima */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 18px', borderTop: '1px solid var(--b1)' }}>
              <button type="button" onClick={() => anterior && abrir(anterior.id)} disabled={!anterior}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 10px', background: 'none', border: 'none', cursor: anterior ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: anterior ? 'var(--t2)' : 'var(--t4)', minWidth: 0 }}>
                <Ico d={I_SETA_ESQ} s={14} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anterior ? anterior.titulo : 'Início'}</span>
              </button>
              <button type="button" onClick={() => seguinte && abrir(seguinte.id)} disabled={!seguinte}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 10px', background: 'none', border: 'none', cursor: seguinte ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: seguinte ? RED : 'var(--t4)', minWidth: 0, textAlign: 'right' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seguinte ? `Próxima: ${seguinte.titulo}` : 'Última aula'}</span><Ico d={I_SETA} s={14} c={seguinte ? RED : undefined} />
              </button>
            </div>
          </BCard>

          {/* conclusão */}
          <AnimatePresence>
            {tudoFeito && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}>
                <BCard pad="18px 20px" blob={['var(--profit-dim)', 'var(--profit-border)']}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 14, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--profit-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--profit)' }}>
                      <Ico d={I_TROFEU} s={19} />
                    </span>
                    <span>
                      <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: 'var(--profit)', letterSpacing: '-0.01em' }}>Trilha concluída</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: 'var(--t3)', marginTop: 2 }}>Você passou por todas as aulas. Bom trabalho!</span>
                    </span>
                  </div>
                </BCard>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ══════════ TRILHA ══════════ */}
        {/* div, não <aside>: o CSS global veste todo <aside> como a barra lateral (fundo preto) */}
        <div className="tub-trilha" style={{ position: 'sticky', top: 16, minWidth: 0 }}>
          <BCard pad={0} delay={0.1}>
            {/* progresso */}
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--b1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>Sua trilha</p>
                  <p style={{ fontSize: 19, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.025em' }}>
                    {tudoFeito ? 'Tudo concluído' : `${int(feitas)} de ${int(total)} aulas`}
                  </p>
                </div>
                {/* anel de progresso */}
                <span style={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}>
                  <svg width={58} height={58} viewBox="0 0 58 58" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="29" cy="29" r="24" fill="none" stroke="var(--fill-2)" strokeWidth="6" />
                    <motion.circle cx="29" cy="29" r="24" fill="none" stroke={tudoFeito ? 'var(--profit)' : RED} strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 24} initial={{ strokeDashoffset: 2 * Math.PI * 24 }} animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - pct / 100) }}
                      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }} />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 12, fontWeight: 900, color: tudoFeito ? 'var(--profit)' : 'var(--t1)' }}>{pct}%</span>
                </span>
              </div>
              {proxima && proxima.id !== aberta?.id && (
                <button type="button" onClick={() => abrir(proxima.id)}
                  style={{ marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '8px 12px', borderRadius: 14, border: '1px solid var(--b1)', background: 'var(--fill-1)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${RED2}, ${RED})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Ico d={I_PLAY} s={12} c="#fff" /></span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t4)' }}>Continuar</span>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proxima.titulo}</span>
                  </span>
                </button>
              )}
            </div>

            {/* módulos */}
            <div style={{ padding: '8px 10px 12px' }}>
              {modulos.map((m, mi) => {
                const fm = m.aulas.filter(a => feita(a.id)).length
                return (
                  <div key={m.id} style={{ padding: '10px 8px 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '0 6px 8px' }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t4)' }}>Módulo {mi + 1}</span>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.015em' }}>{m.titulo}</span>
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, color: fm === m.aulas.length ? 'var(--profit)' : 'var(--t4)', flexShrink: 0 }}>{fm}/{m.aulas.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {m.aulas.map(a => {
                        const ok = feita(a.id), ativa = a.id === aberta?.id
                        const n = aulas.findIndex(x => x.id === a.id) + 1
                        return (
                          <button key={a.id} type="button" onClick={() => abrir(a.id)} aria-current={ativa ? 'true' : undefined}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 48, padding: '8px 10px', borderRadius: 14, textAlign: 'left',
                              border: `1px solid ${ativa ? 'rgba(229,57,31,0.35)' : 'transparent'}`,
                              background: ativa ? 'rgba(229,57,31,0.06)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                            <span aria-hidden style={{
                              width: 26, height: 26, borderRadius: 9, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              background: ok ? 'var(--profit)' : 'var(--surface)', border: `1px solid ${ok ? 'var(--profit)' : 'var(--b1)'}`,
                              color: ok ? 'var(--surface)' : ativa ? RED : 'var(--t4)', fontFamily: MONO, fontSize: 10, fontWeight: 900,
                            }}>{ok ? <Ico d={I_CHECK} s={12} c="var(--surface)" /> : a.tipo === 'video' ? <Ico d={I_PLAY} s={10} c={ativa ? RED : undefined} /> : String(n).padStart(2, '0')}</span>
                            <span style={{ minWidth: 0, flex: 1 }}>
                              <span style={{ display: 'block', fontSize: 13, fontWeight: ativa ? 800 : 700, color: ok ? 'var(--t3)' : 'var(--t1)', overflowWrap: 'anywhere', lineHeight: 1.35 }}>{a.titulo}</span>
                              <span style={{ display: 'block', fontSize: 11, color: 'var(--t4)', marginTop: 1 }}>
                                {a.tipo === 'video' ? (duracao > 0 ? `Vídeo · ${fmtMin(duracao)}` : 'Vídeo') : a.tipo === 'guia' ? 'Guia' : 'Aula prática'}
                              </span>
                            </span>
                            {ativa && <span style={{ width: 6, height: 6, borderRadius: 999, background: RED, flexShrink: 0 }} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </BCard>
        </div>
      </div>

      {/* atalhos: fora da grade, pra que no celular a trilha venha logo depois do palco */}
        <div className="tub-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {ATALHOS.map((a, i) => (
            <motion.div key={a.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 + i * 0.05, ease: [0.33, 1, 0.68, 1] }}>
              <Link href={a.href} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', minHeight: 60,
                borderRadius: 22, background: 'var(--surface)', border: '1px solid var(--b1)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)', textDecoration: 'none',
              }}>
                <span style={{ width: 34, height: 34, borderRadius: 12, flexShrink: 0, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: RED }}>
                  <Ico d={a.icone} s={15} />
                </span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{a.rotulo}</span>
                <span style={{ color: 'var(--t4)', display: 'inline-flex', flexShrink: 0 }}><Ico d={I_SETA} s={14} /></span>
              </Link>
            </motion.div>
          ))}
        </div>

      <style>{`
        .nx-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        @media (max-width: 900px) {
          .tub-grid { grid-template-columns: 1fr !important; }
          .tub-trilha { position: static !important; }
        }
        @media (max-width: 760px) {
          .tub-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
