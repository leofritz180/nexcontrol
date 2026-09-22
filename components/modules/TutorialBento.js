'use client'
// ─────────────────────────────────────────────────────────────────────────
// TUTORIAL — visual 2.0 (bento claro). SÓ APRESENTAÇÃO.
//
// Recebe os passos e o que já foi marcado por props; quem grava no
// localStorage continua sendo a página /tutorial (onAlternar / onReiniciar).
// Nada aqui busca nem persiste dado nenhum.
//
// Cada passo agora abre e fecha (a descrição fica escondida até o clique) e,
// ao lado, tem uma caixinha de "concluído" separada — assim dá pra LER um
// passo sem marcar ele sem querer, coisa que na tela antiga acontecia,
// porque a linha inteira alternava o check.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModuleHeader, BCard, Tilt, Ico, MONO, int, RED, RED2 } from '../ui/bento'

/* ── ícones ── */
const I_CHECK = <polyline points="20 6 9 17 4 12" />
const I_PLAY = <polygon points="5 3 19 12 5 21 5 3" />
const I_SINO = <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>
const I_INFO = <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>
const I_SETA = <polyline points="9 18 15 12 9 6" />
const I_TROFEU = <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>

// Ícone por passo do checklist. Se chegar um id novo, cai no genérico —
// nunca quebra a tela por causa de um passo que a página adicionou.
const ICONE_PASSO = {
  criar_meta: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>,
  registrar_remessa: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  finalizar_meta: <><path d="M4 22V4a1 1 0 0 1 1-1h12l-2 4 2 4H5" /><path d="M4 22h4" /></>,
  dashboard: <><path d="M3 3v18h18" /><path d="M7 15l3-3 4 4 5-6" /></>,
  convidar_operador: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>,
  fechamento: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
}
const I_GENERICO = <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></>

/* ── atalhos do rodapé (mesmos destinos da tela antiga) ── */
const ATALHOS = [
  { rotulo: 'Painel admin', href: '/admin', icone: <><path d="M3 12l2-2 7-7 7 7 2 2" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /></> },
  { rotulo: 'Minha operação', href: '/operator', icone: <><rect x="3" y="11" width="5" height="10" rx="1" /><rect x="10" y="6" width="5" height="15" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></> },
  { rotulo: 'Assinatura', href: '/billing', icone: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M7 15h1M12 15h1" /></> },
]

/* ── passos de notificação (conteúdo fixo, igual ao da tela antiga) ── */
const PASSOS_PUSH = [
  'Abra o NexControl no navegador do celular',
  'Toque no menu do navegador e selecione "Adicionar a tela inicial"',
  'Abra o app instalado na sua tela inicial',
  'Permita as notificações quando o aviso aparecer',
  'Se não aparecer, ative manualmente nas configurações do navegador',
]

export default function TutorialBento({ passos = [], marcados = {}, onAlternar, onReiniciar }) {
  // Hook antes de qualquer return — a tela não tem return condicional, mas a
  // regra vale igual (React #300).
  const [aberto, setAberto] = useState(null)

  const total = passos.length || 1
  const feitos = passos.filter(p => marcados[p.id]).length
  const tudoFeito = feitos === passos.length && passos.length > 0
  const pct = (feitos / total) * 100
  const atual = passos.find(p => !marcados[p.id]) || null
  const indiceAtual = atual ? passos.indexOf(atual) : passos.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Guia rápido"
        sub="Aprenda a usar a plataforma em poucos minutos"
        acao={feitos > 0 ? (
          <motion.button
            type="button" onClick={onReiniciar}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 30,
              border: '1px solid var(--b2)', background: 'var(--surface)', color: 'var(--t2)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}>
            <Ico d={<><path d="M3 12a9 9 0 1 0 3-6.7" /><polyline points="3 4 3 9 8 9" /></>} s={15} />
            Reiniciar
          </motion.button>
        ) : null}
      />

      {/* ── VOCÊ ESTÁ AQUI: a régua do progresso no topo ── */}
      <Tilt>
        <BCard pad="24px 26px" delay={0.04} blob={tudoFeito ? ['var(--profit-dim)', 'var(--profit-border)'] : undefined}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>
                {tudoFeito ? 'Tutorial concluído' : 'Você está aqui'}
              </p>
              <p style={{ fontSize: 25, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>
                {tudoFeito ? 'Tudo pronto' : (atual ? atual.label : '—')}
              </p>
              {!tudoFeito && atual && (
                <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '6px 0 0', lineHeight: 1.5 }}>{atual.desc}</p>
              )}
            </div>
            <p style={{ fontFamily: MONO, fontSize: 27, fontWeight: 900, letterSpacing: '-0.035em', margin: 0, color: tudoFeito ? 'var(--profit)' : 'var(--t1)' }}>
              {int(feitos)}<span style={{ color: 'var(--t4)' }}>/{int(passos.length)}</span>
            </p>
          </div>

          {/* régua segmentada: um traço por passo, o atual pulsando */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${total}, 1fr)`, gap: 5 }}>
            {passos.map((p, i) => {
              const ok = !!marcados[p.id]
              const agora = !tudoFeito && i === indiceAtual
              return (
                <motion.span
                  key={p.id}
                  initial={{ scaleX: 0.4, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.33, 1, 0.68, 1] }}
                  title={p.label}
                  style={{
                    height: 8, borderRadius: 999, transformOrigin: 'left',
                    background: ok ? 'var(--profit)' : agora ? `linear-gradient(90deg, ${RED2}, ${RED})` : 'var(--fill-2)',
                  }} />
              )
            })}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '10px 0 0' }}>
            {tudoFeito ? 'Todas as etapas foram concluídas. Bom trabalho!' : `Faltam ${passos.length - feitos} etapa${passos.length - feitos === 1 ? '' : 's'} · ${Math.round(pct)}% do guia`}
          </p>
        </BCard>
      </Tilt>

      {/* ── VÍDEO AULA (mesmo embed de sempre) ── */}
      <BCard pad={0} delay={0.1}>
        <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--fill-2)' }}>
          <iframe
            src="https://www.youtube.com/embed/Zi5b-nuB_Yw?rel=0&modestbranding=1"
            title="Video aula NexControl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: '100%', height: '100%', display: 'block', border: 'none' }}
          />
        </div>
        <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <span style={{ width: 38, height: 38, borderRadius: 13, flexShrink: 0, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: RED }}>
              <Ico d={I_PLAY} s={16} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>Vídeo aula — NexControl</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Como usar o painel, criar metas, registrar remessas e fechar operações</span>
            </span>
          </div>
          <span style={{
            flexShrink: 0, fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
            padding: '6px 11px', borderRadius: 999, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)',
          }}>EXCLUSIVO ADMIN</span>
        </div>
      </BCard>

      {/* ── OS PASSOS: cada um abre e fecha ── */}
      <BCard pad={24} delay={0.16}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Checklist de onboarding</p>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '4px 0 0' }}>Toque num passo pra ler; marque a caixinha quando concluir.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {passos.map((p, i) => {
            const ok = !!marcados[p.id]
            const expandido = aberto === p.id
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 + i * 0.05, ease: [0.33, 1, 0.68, 1] }}
                style={{
                  borderRadius: 18, overflow: 'hidden',
                  border: `1px solid ${ok ? 'var(--profit-border)' : 'var(--b1)'}`,
                  background: ok ? 'var(--profit-dim)' : 'var(--fill-1)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px' }}>
                  {/* caixinha de concluído — separada do clique que expande */}
                  <button
                    type="button" onClick={() => onAlternar && onAlternar(p.id)}
                    aria-pressed={ok} aria-label={`Marcar "${p.label}" como concluído`}
                    style={{
                      width: 26, height: 26, borderRadius: 9, flexShrink: 0, padding: 0, cursor: 'pointer',
                      border: `2px solid ${ok ? 'var(--profit)' : 'var(--b2)'}`,
                      background: ok ? 'var(--profit)' : 'var(--surface)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: ok ? 'var(--surface)' : 'transparent',
                    }}>
                    <Ico d={I_CHECK} s={13} />
                  </button>

                  {/* moldura do ícone do passo */}
                  <span style={{
                    width: 34, height: 34, borderRadius: 12, flexShrink: 0,
                    background: 'var(--surface)', border: '1px solid var(--b1)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: ok ? 'var(--profit)' : RED,
                  }}>
                    <Ico d={ICONE_PASSO[p.id] || I_GENERICO} s={16} />
                  </span>

                  {/* clicar no corpo abre/fecha a descrição */}
                  <button
                    type="button" onClick={() => setAberto(expandido ? null : p.id)}
                    aria-expanded={expandido}
                    style={{
                      flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12,
                      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'inherit',
                    }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'block', fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.01em',
                        color: ok ? 'var(--profit)' : 'var(--t1)',
                        textDecoration: ok ? 'line-through' : 'none',
                      }}>{p.label}</span>
                    </span>
                    {/* tub-num: no celular o CSS esconde. Sao cinco elementos
                        em 358px (marca, icone, titulo, numero, seta) e o
                        titulo quebrava em duas linhas — e a ordem ja esta na
                        propria fila. */}
                    <span className="tub-num" style={{ fontFamily: MONO, fontSize: 11, fontWeight: 900, color: ok ? 'var(--profit)' : 'var(--t4)', flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <motion.span animate={{ rotate: expandido ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ color: 'var(--t4)', display: 'inline-flex', flexShrink: 0 }}>
                      <Ico d={I_SETA} s={14} />
                    </motion.span>
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {expandido && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: [0.33, 1, 0.68, 1] }}
                      style={{ overflow: 'hidden' }}>
                      <p style={{ margin: 0, padding: '0 15px 15px 87px', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.6 }}>{p.desc}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        <AnimatePresence>
          {tudoFeito && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: 10, height: 0 }}
              transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
              style={{ overflow: 'hidden' }}>
              <div style={{
                marginTop: 16, padding: '18px 20px', borderRadius: 18,
                background: 'var(--profit-dim)', border: '1px solid var(--profit-border)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{ width: 40, height: 40, borderRadius: 14, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--profit-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--profit)' }}>
                  <Ico d={I_TROFEU} s={19} />
                </span>
                <span>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: 'var(--profit)', letterSpacing: '-0.01em' }}>Você está pronto para usar o NexControl!</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--t3)', marginTop: 2 }}>Todas as etapas foram concluídas. Bom trabalho!</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BCard>

      {/* ── NOTIFICAÇÕES NO CELULAR ── */}
      <BCard pad={24} delay={0.24}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ width: 38, height: 38, borderRadius: 13, flexShrink: 0, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: RED }}>
            <Ico d={I_SINO} s={17} />
          </span>
          <div>
            <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Como ativar notificações no celular</p>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '3px 0 0' }}>Receba alertas em tempo real sobre sua operação</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65, margin: '0 0 16px' }}>
          Para receber notificações no celular, instale o NexControl como app na tela inicial do seu aparelho.
          Depois, ao abrir o app, permita as notificações quando o sistema solicitar.
        </p>

        <div className="tub-push" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
          {PASSOS_PUSH.map((txt, i) => (
            <div key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 15px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
              <span style={{
                width: 26, height: 26, borderRadius: 9, flexShrink: 0,
                background: 'var(--surface)', border: '1px solid var(--b1)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontSize: 10.5, fontWeight: 900, color: RED,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', lineHeight: 1.5 }}>{txt}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: '12px 15px', borderRadius: 14, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--t4)', display: 'inline-flex', flexShrink: 0 }}><Ico d={I_INFO} s={15} /></span>
          <span style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
            As notificações ajudam você a acompanhar atualizações importantes da operação em tempo real.
          </span>
        </div>
      </BCard>

      {/* ── ATALHOS ── */}
      <div className="tub-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {ATALHOS.map((a, i) => (
          <motion.a
            key={a.href} href={a.href}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.05, ease: [0.33, 1, 0.68, 1] }}
            whileHover={{ y: -4, boxShadow: '0 6px 14px rgba(0,0,0,0.06), 0 20px 46px rgba(0,0,0,0.11)' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px',
              borderRadius: 24, background: 'var(--surface)', border: '1px solid var(--b1)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
              textDecoration: 'none',
            }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, flexShrink: 0, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: RED }}>
              <Ico d={a.icone} s={15} />
            </span>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{a.rotulo}</span>
            <span style={{ color: 'var(--t4)', display: 'inline-flex', flexShrink: 0 }}><Ico d={I_SETA} s={14} /></span>
          </motion.a>
        ))}
      </div>

      <style>{`
        @media (max-width: 760px) {
          .tub-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
