'use client'
// ─────────────────────────────────────────────────────────────────────────
// PRIMEIROS PASSOS — guia de ativação mostrado só pra quem ainda não criou
// nenhuma meta (aparece dentro do modo demo do /admin). Ataca o vazamento de
// ativação: conta paga que entra, olha o demo e não sabe por onde começar.
// Puramente visual/navegacional — não escreve nada no banco.
// ─────────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { motion } from 'framer-motion'

const Ico = ({ d, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
)
const AlvoIco = <Ico d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /></>} />
const TimeIco = <Ico d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></>} />
const CelIco = <Ico d={<><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></>} />

export default function PrimeirosPassos({ onCreateMeta, userName }) {
  const passos = [
    {
      icon: AlvoIco,
      titulo: 'Crie sua primeira meta',
      desc: 'Escolha a rede e a quantidade de depósitos. É a partir dela que o lucro começa a ser calculado sozinho.',
      acao: <button type="button" onClick={onCreateMeta}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, border: 'none', background: '#e11d1d', color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 6px 20px rgba(225,29,29,0.35)' }}>
        Criar minha primeira meta
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>,
      destaque: true,
    },
    {
      icon: TimeIco,
      titulo: 'Cadastre sua equipe',
      desc: 'Cada operador registra as remessas dele e você acompanha tudo ao vivo — sem cobrar print no grupo.',
      acao: <Link href="/operadores" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>
        Ir para Operadores
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>,
    },
    {
      icon: CelIco,
      titulo: 'Instale no celular',
      desc: 'Receba no push quando a meta bater, quando algo sair do padrão e o que a equipe registrar.',
      acao: <Link href="/tutorial" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>
        Ver como instalar
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16, marginBottom: 24,
        background: '#000', border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.04), inset -1px 0 0 rgba(255,255,255,0.04), 0 18px 44px rgba(0,0,0,0.5)',
        padding: '26px 26px 22px',
      }}
    >
      <div aria-hidden style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(225,29,29,0.7), transparent)' }} />

      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ff6b6b', margin: '0 0 8px' }}>Primeiros passos</p>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          {userName ? `${userName}, sua operação começa aqui.` : 'Sua operação começa aqui.'}
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
          Os números abaixo são <strong style={{ color: 'var(--t2)' }}>uma simulação</strong> pra você ver como fica.
          Crie sua primeira meta e o painel passa a mostrar a sua operação de verdade.
        </p>
      </div>

      <div className="pp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {passos.map((p, i) => (
          <div key={i} style={{
            padding: '18px 18px 20px', borderRadius: 12,
            background: p.destaque ? 'rgba(225,29,29,0.07)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${p.destaque ? 'rgba(225,29,29,0.28)' : 'rgba(255,255,255,0.07)'}`,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: p.destaque ? 'rgba(225,29,29,0.16)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${p.destaque ? 'rgba(225,29,29,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: p.destaque ? '#ff6b6b' : 'rgba(255,255,255,0.7)',
              }}>{p.icon}</span>
              <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, fontWeight: 800, color: p.destaque ? '#ff6b6b' : 'var(--t4)' }}>0{i + 1}</span>
            </div>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{p.titulo}</h3>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 16px', lineHeight: 1.55, flex: 1 }}>{p.desc}</p>
            {p.acao}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) { .pp-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </motion.div>
  )
}
