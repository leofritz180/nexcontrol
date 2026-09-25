'use client'
// ─────────────────────────────────────────────────────────────────────────
// PASSO A PASSO DA META — mostra onde a operação está no ciclo de vida:
// Criada → Em operação → Finalizada → Fechada.
// Puramente visual: lê o estado que a página já calcula, não busca nada.
// ─────────────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'

const MONO = 'var(--mono, "JetBrains Mono", monospace)'

const CHECK = <path d="M20 6L9 17l-5-5" />
const PLAY = <path d="M6 4l14 8-14 8V4z" />
const BAND = <path d="M4 21V5a2 2 0 0 1 2-2h9l-1 3 1 3H6" />
const LOCK = <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>

export default function MetaStepper({ criada, remessas = 0, finalizada, fechada, contasFeitas = 0, contasAlvo = 0 }) {
  const passos = [
    { k: 'criada', t: 'Criada', d: criada ? new Date(criada).toLocaleDateString('pt-BR') : null, ico: CHECK, ok: true },
    { k: 'operando', t: 'Em operação', d: remessas > 0 ? `${remessas} remessa${remessas === 1 ? '' : 's'}` : 'aguardando a 1ª remessa', ico: PLAY, ok: remessas > 0 || finalizada || fechada },
    { k: 'finalizada', t: 'Finalizada', d: contasAlvo > 0 ? `${contasFeitas} de ${contasAlvo} contas` : null, ico: BAND, ok: finalizada || fechada },
    { k: 'fechada', t: 'Fechada', d: fechada ? 'lucro final apurado' : 'falta o salário e o baú', ico: LOCK, ok: fechada },
  ]
  // o passo atual é o primeiro que ainda não foi concluído
  const atual = passos.findIndex(p => !p.ok)
  const feitos = passos.filter(p => p.ok).length
  const pct = ((feitos - 1) / (passos.length - 1)) * 100

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
      className="mt-step" style={{
        position: 'relative', background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 24,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
        padding: '22px 26px', marginBottom: 18,
      }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 18px' }}>
        Ciclo da operação
      </p>

      <div style={{ position: 'relative' }}>
        {/* trilho */}
        <div aria-hidden className="mt-rail" style={{ position: 'absolute', left: '12.5%', right: '12.5%', top: 19, height: 3, borderRadius: 2, background: 'var(--fill-2)' }} />
        <motion.div aria-hidden className="mt-rail" initial={{ width: 0 }} animate={{ width: `${Math.max(0, pct) * 0.75}%` }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
          style={{ position: 'absolute', left: '12.5%', top: 19, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, var(--k-2), var(--k-1))' }} />

        <div className="mt-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {passos.map((p, i) => {
            const eAtual = i === atual
            const cor = p.ok ? 'var(--k-1)' : eAtual ? 'var(--t1)' : 'var(--t4)'
            return (
              <div key={p.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 9 }}>
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: [0.33, 1, 0.68, 1] }}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: p.ok ? 'linear-gradient(135deg, var(--k-2), var(--k-1))' : 'var(--surface)',
                    border: p.ok ? 'none' : `2px solid ${eAtual ? 'var(--b3)' : 'var(--b1)'}`,
                    boxShadow: p.ok ? '0 8px 20px var(--k-glow)' : 'none',
                    color: p.ok ? 'var(--k-on)' : eAtual ? 'var(--t2)' : 'var(--t4)',
                  }}>
                  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{p.ico}</svg>
                </motion.span>
                <span>
                  <p style={{ fontSize: 13, fontWeight: 800, color: cor, margin: 0, letterSpacing: '-0.01em' }}>{p.t}</p>
                  {p.d && <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '3px 0 0', fontFamily: MONO }}>{p.d}</p>}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .mt-step .mt-rail { display: none; }
          .mt-step .mt-grid { grid-template-columns: repeat(2, 1fr); gap: 18px 10px; }
        }
      `}</style>
    </motion.div>
  )
}
