'use client'
// ─────────────────────────────────────────────────────────────────────────
// BEM-VINDO À 2.0
//
// Sem isto, o usuário abre o painel e ele está diferente — sem contexto, o
// que parece defeito, não atualização. Quatro telas curtas explicando o que
// mudou, uma vez só por conta.
//
// Marca em localStorage por e-mail: trocar de conta na mesma máquina mostra
// de novo, que é o certo, e limpar o navegador não é problema (pior caso,
// vê outra vez).
//
// Entra no coordenador de overlays (useOverlaySlot) com prioridade alta:
// enquanto isto estiver aberto, tour, promo e checklist esperam. Se ele
// disputasse espaço, o usuário veria duas caixas brigando na primeira
// abertura — justamente o oposto da impressão que queremos.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useOverlaySlot } from '../../lib/overlayCoordinator'
import { SOMBRA, Ico, RED, RED2 } from '../ui/bento'

const CHAVE = 'nx_bemvindo_20_'
// Chave PROPRIA pro convite do modo escuro. Se ele fosse so mais um passo
// do bem-vindo, quem ja tinha visto as quatro telas nunca descobriria que o
// escuro existe — e sao justamente as contas mais antigas. Com chave
// separada, quem ja passou por aqui recebe SO esta tela, uma vez.
const CHAVE_NOIR = 'nx_convite_noir_'

const PASSOS = [
  {
    titulo: 'Bem-vindo à NexControl 2.0',
    texto: 'O painel inteiro foi redesenhado. Mesmos dados, mesmas contas, mesmas funções — tudo mais claro e mais rápido de ler.',
    arte: 'marca',
  },
  {
    titulo: 'O menu virou uma faixa',
    texto: 'O menu lateral encolheu para dar espaço ao conteúdo. Passe o mouse nele para ver os nomes; o módulo aberto fica marcado em branco.',
    arte: 'rail',
  },
  {
    titulo: 'As abas viram um dock',
    texto: 'Dentro de cada módulo, as abas ficam flutuando no rodapé, sempre à mão — não importa quanto você rolou a página.',
    arte: 'dock',
  },
  {
    titulo: 'Cada número conta uma história',
    texto: 'Os cards mostram tendência, comparação com o período anterior e onde o lucro se concentra. E a meta agora tem um ciclo visível: criada, em operação, finalizada, fechada.',
    arte: 'cards',
  },
  {
    titulo: 'Prefere no escuro?',
    texto: 'Toque numa das duas e o painel muda na hora — é o painel de verdade atrás desta janela, não um desenho. Depois você troca quando quiser, pelo menu, lá embaixo.',
    arte: 'noir',
  },
]

// O passo do escuro tambem se abre SOZINHO, pra quem ja tinha visto o
// bem-vindo antes dele existir.
const I_NOIR = PASSOS.length - 1

// ── ESCOLHA DO TEMA, ao vivo ─────────────────────────────────────────────
// Nao e uma figura do modo escuro: clicar aqui aplica a classe no <html> e
// o painel inteiro muda atras desta janela. Mostrar uma miniatura seria
// mais facil e convenceria menos — a graca e ver a propria operacao mudar.
//
// A gravacao e a aplicacao seguem o MESMO caminho do botao do menu
// (localStorage 'nx_noir' + a classe), pra nao existirem duas versoes da
// verdade sobre o tema.
function SeletorTema() {
  const [noir, setNoir] = useState(false)
  useEffect(() => { try { setNoir(localStorage.getItem('nx_noir') === '1') } catch {} }, [])

  function escolher(escuro) {
    setNoir(escuro)
    try { localStorage.setItem('nx_noir', escuro ? '1' : '0') } catch {}
    try { document.documentElement.classList.toggle('nx-noir', escuro) } catch {}
  }

  const Amostra = ({ escuro, ativo }) => {
    const fundo = escuro ? '#0e0e11' : '#f0f0f3'
    const carta = escuro ? '#17181c' : '#ffffff'
    const risco = escuro ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)'
    const trilho = escuro ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'
    return (
      <button type="button" onClick={() => escolher(escuro)} aria-pressed={ativo}
        style={{
          flex: 1, padding: 0, cursor: 'pointer', borderRadius: 16, overflow: 'hidden',
          background: fundo, textAlign: 'left',
          border: ativo ? '2px solid ' + RED : '1px solid var(--b2)',
          boxShadow: ativo ? '0 8px 24px rgba(229,57,31,0.18)' : 'none',
          transition: 'border-color .18s ease, box-shadow .18s ease',
        }}>
        <span style={{ display: 'flex', gap: 5, padding: 9, height: 96 }}>
          <span style={{ width: 15, borderRadius: 6, background: escuro ? '#1d1e23' : '#131317', display: 'flex', flexDirection: 'column', gap: 3, padding: 4 }}>
            {[0, 1, 2].map(k => <span key={k} style={{ height: 6, borderRadius: 3, background: k === 1 ? '#fff' : 'rgba(255,255,255,0.22)' }} />)}
          </span>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ height: 34, borderRadius: 7, background: carta, border: '1px solid ' + risco, display: 'block', padding: 6 }}>
              <span style={{ display: 'block', width: '58%', height: 8, borderRadius: 3, background: escuro ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.68)' }} />
              <span style={{ display: 'block', width: '34%', height: 5, borderRadius: 3, background: trilho, marginTop: 5 }} />
            </span>
            <span style={{ flex: 1, display: 'flex', gap: 5 }}>
              <span style={{ flex: 1, borderRadius: 7, background: carta, border: '1px solid ' + risco }} />
              <span style={{ flex: 1, borderRadius: 7, background: carta, border: '1px solid ' + risco }} />
            </span>
          </span>
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '8px 11px', borderTop: '1px solid ' + risco,
          fontSize: 11.5, fontWeight: 800, color: escuro ? '#f0f0f3' : '#15151a',
        }}>
          {escuro ? 'Escuro' : 'Claro'}
          <span aria-hidden style={{
            width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
            border: ativo ? '5px solid ' + RED : '1.5px solid ' + risco,
          }} />
        </span>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 16 }}>
      <Amostra escuro={false} ativo={!noir} />
      <Amostra escuro ativo={noir} />
    </div>
  )
}

function Arte({ tipo }) {
  if (tipo === 'noir') return <SeletorTema />
  const base = { background: 'var(--fill-1)', border: '1px solid var(--b1)', borderRadius: 16 }
  if (tipo === 'marca') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <img src="/brand/nex-mark.png" alt="" width={72} height={72} style={{ width: 72, height: 72, objectFit: 'contain' }} />
        <span style={{
          padding: '5px 14px', borderRadius: 30, fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', color: '#fff',
          background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 8px 22px rgba(229,57,31,0.32)',
        }}>VERSÃO 2.0</span>
      </div>
    )
  }
  if (tipo === 'rail') {
    return (
      <div style={{ display: 'flex', gap: 10, width: '100%', height: 132 }}>
        <div style={{ width: 46, borderRadius: 14, background: '#131317', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[0, 1, 2, 3].map(i => (
            <motion.span key={i}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: i === 1 ? 1 : 0.35 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
              style={{ height: 22, borderRadius: 8, background: i === 1 ? '#fff' : 'rgba(255,255,255,0.18)' }} />
          ))}
        </div>
        <div style={{ flex: 1, ...base, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12 }}>
          {[0, 1, 2, 3].map(i => <span key={i} style={{ borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--b1)' }} />)}
        </div>
      </div>
    )
  }
  if (tipo === 'dock') {
    return (
      <div style={{ position: 'relative', width: '100%', height: 132, ...base, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: 12 }}>
          {[0, 1, 2].map(i => <span key={i} style={{ height: 40, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--b1)' }} />)}
        </div>
        <motion.div
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.33, 1, 0.68, 1] }}
          style={{
            position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)',
            display: 'flex', gap: 4, padding: 5, borderRadius: 24, background: '#131317',
            boxShadow: '0 10px 26px rgba(0,0,0,0.28)',
          }}>
          {['Visão', 'Metas', 'Equipe'].map((t, i) => (
            <span key={t} style={{
              padding: '6px 13px', borderRadius: 20, fontSize: 10.5, fontWeight: 800,
              background: i === 0 ? '#fff' : 'transparent', color: i === 0 ? '#15151a' : 'rgba(255,255,255,0.6)',
            }}>{t}</span>
          ))}
        </motion.div>
      </div>
    )
  }
  // cards
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, width: '100%', height: 132 }}>
      <div style={{ ...base, background: 'var(--surface)', padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--profit-dim)' }} />
        <div>
          <motion.span
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
            style={{ display: 'block', fontFamily: 'var(--mono, monospace)', fontSize: 20, fontWeight: 900, color: 'var(--t1)' }}>R$ 90.433</motion.span>
          <span style={{ display: 'block', width: '62%', height: 7, borderRadius: 4, background: 'var(--fill-2)', marginTop: 7 }} />
        </div>
      </div>
      <div style={{ ...base, background: 'var(--surface)', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={78} height={78} viewBox="0 0 78 78" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="39" cy="39" r="30" fill="none" stroke="var(--fill-2)" strokeWidth="11" />
          <motion.circle cx="39" cy="39" r="30" fill="none" stroke={RED} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 30}
            initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 30 * 0.35 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.33, 1, 0.68, 1] }} />
        </svg>
      </div>
    </div>
  )
}

export default function BemVindo20({ email, ativo }) {
  const semMovimento = useReducedMotion()
  const [quer, setQuer] = useState(false)
  const [i, setI] = useState(0)

  // Quem NUNCA viu comeca do zero. Quem ja viu as telas antigas nao repete
  // tudo: abre direto no convite do escuro, uma vez, e pronto.
  const [soNoir, setSoNoir] = useState(false)

  useEffect(() => {
    if (!ativo || !email) return
    let t
    try {
      const chave = String(email).toLowerCase()
      // Quem acabou de se cadastrar nunca viu a 1.0, entao "o painel foi
      // redesenhado" nao diz nada pra ele — seria apresentar uma mudanca que
      // ele nao viveu. Pra esse, so o convite do escuro, que e escolha e nao
      // historico. A bandeira e a mesma que o convite de instalar o app usa.
      let recemCadastrado = false
      try { recemCadastrado = !!sessionStorage.getItem('nexcontrol_just_signed_up') } catch {}
      const viuBemVindo = recemCadastrado || !!localStorage.getItem(CHAVE + chave)
      const viuNoir = !!localStorage.getItem(CHAVE_NOIR + chave)
      if (viuBemVindo && viuNoir) return
      if (viuBemVindo) { setSoNoir(true); setI(I_NOIR) }
      // espera o painel assentar; abrir junto com o carregamento é atropelo
      // 900ms: o tour usa a mesma prioridade e quem pega o slot primeiro
      // segura, entao o bem-vindo precisa chegar antes dele.
      t = setTimeout(() => setQuer(true), 900)
    } catch {}
    return () => clearTimeout(t)
  }, [ativo, email])

  const liberado = useOverlaySlot('bemvindo-20', 1, quer)

  function encerrar() {
    try {
      const chave = String(email).toLowerCase()
      localStorage.setItem(CHAVE + chave, '1')
      // O convite do escuro so se da por visto se a pessoa CHEGOU nele.
      // Fechar no segundo passo nao e recusa do tema — e pressa. Assim ele
      // volta na proxima entrada, em vez de sumir sem nunca ter aparecido.
      if (soNoir || i >= I_NOIR) localStorage.setItem(CHAVE_NOIR + chave, '1')
    } catch {}
    setQuer(false)
  }

  const passo = PASSOS[i]
  const ultimo = i === PASSOS.length - 1
  const dur = semMovimento ? 0 : 0.4

  return (
    <AnimatePresence>
      {quer && liberado && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          onClick={encerrar}
          style={{
            position: 'fixed', inset: 0, zIndex: 10050,
            background: 'rgba(17,19,24,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 22, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: semMovimento ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative', width: '100%', maxWidth: 470, maxHeight: '92vh', overflowY: 'auto',
              background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 26,
              boxShadow: SOMBRA.flutuante, padding: '28px 28px 24px',
            }}>
            <button type="button" onClick={encerrar} aria-label="Fechar"
              style={{
                position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 11,
                background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Ico d={<path d="M18 6L6 18M6 6l12 12" />} s={14} />
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 148, marginBottom: 22, padding: '8px 4px',
            }}>
              <AnimatePresence mode="wait">
                <motion.div key={passo.arte} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                  initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: dur, ease: [0.33, 1, 0.68, 1] }}>
                  <Arte tipo={passo.arte} />
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={passo.titulo}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: dur }}>
                <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px', letterSpacing: '-0.025em' }}>{passo.titulo}</h2>
                <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>{passo.texto}</p>
              </motion.div>
            </AnimatePresence>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 26 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {(soNoir ? [] : PASSOS).map((_, k) => (
                  <button key={k} type="button" onClick={() => setI(k)} aria-label={`Passo ${k + 1}`}
                    style={{
                      width: k === i ? 22 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0,
                      background: k === i ? RED : 'var(--fill-3)',
                      transition: 'width .25s ease, background .25s ease',
                    }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!ultimo && (
                  <button type="button" onClick={encerrar}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: 'var(--t3)', padding: 6 }}>
                    Pular
                  </button>
                )}
                <motion.button type="button"
                  onClick={() => (ultimo ? encerrar() : setI(i + 1))}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 30,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff',
                    background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.3)',
                  }}>
                  {soNoir ? 'Pronto' : ultimo ? 'Começar' : 'Continuar'}
                  {!ultimo && <Ico d={<path d="M5 12h14M13 6l6 6-6 6" />} s={15} c="#fff" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
