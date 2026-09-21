'use client'
// ─────────────────────────────────────────────────────────────────────────
// TOPBAR V2 — barra de pills do topo, no padrão da referência:
// navegação em pills, busca, notificações e relógio. Substitui a antiga
// barra vermelha nas contas do visual V2 (lib/theme-v2.js).
// Puramente navegacional — usa as rotas que já existem.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const Ico = ({ d, c = 'currentColor', s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)

export default function TopBarV2({ isAdmin }) {
  const pathname = usePathname()
  const router = useRouter()
  const [hora, setHora] = useState('')

  useEffect(() => {
    const t = () => setHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    t(); const iv = setInterval(t, 30000); return () => clearInterval(iv)
  }, [])

  const home = isAdmin ? '/admin' : '/operator'
  const navs = isAdmin
    ? [{ h: home, l: 'Painel' }, { h: '/operadores', l: 'Equipe' }, { h: '/faturamento', l: 'Faturamento' }]
    : [{ h: home, l: 'Painel' }, { h: '/performance', l: 'Performance' }]

  const pill = {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 30,
    fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'inherit',
  }
  const circ = { width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t2)' }

  return (
    <div className="nx-topbar-v2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9, flexWrap: 'wrap', padding: '18px 0 4px' }}>
      {/* navegação em pills */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 30, padding: 4, border: '1px solid var(--b1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        {navs.map(n => {
          const on = pathname === n.h
          return (
            <Link key={n.h} href={n.h} style={{ ...pill, background: on ? '#15151a' : 'transparent', color: on ? '#fff' : 'var(--t2)' }}>{n.l}</Link>
          )
        })}
      </div>

      {/* busca */}
      <button type="button" onClick={() => router.push(isAdmin ? '/operadores' : '/performance')}
        style={{ ...pill, background: 'var(--surface)', border: '1px solid var(--b1)', color: 'var(--t3)', cursor: 'pointer' }}>
        <Ico d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} s={15} /> Buscar
      </button>

      {/* notificações */}
      <span style={{ ...circ, position: 'relative' }} title="Notificações">
        <Ico d={<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>} s={17} />
        <span style={{ position: 'absolute', top: 8, right: 10, width: 7, height: 7, borderRadius: '50%', background: '#e5391f', border: '2px solid var(--surface)' }} />
      </span>

      {/* relógio */}
      <span style={{ ...pill, background: 'var(--surface)', border: '1px solid var(--b1)', color: 'var(--t1)', fontFamily: 'var(--mono, monospace)', fontWeight: 800 }}>{hora}</span>

      <style>{`
        @media (max-width: 720px) { .nx-topbar-v2 { justify-content: flex-start; } }
      `}</style>
    </div>
  )
}
