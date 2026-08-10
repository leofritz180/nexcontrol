'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* Icones lucide-style inline (stroke currentColor, 1.6) */
const I = {
  grid: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  target: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 3.75a.75.75 0 100 1.5.75.75 0 000-1.5z',
  users: 'M16 19v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 17.5V19M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM20 19v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 4.2a3.5 3.5 0 010 6.6',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.3 5.3 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.3-3.3-9S9.8 5.4 12 3z',
  slots: 'M5 5h14a1 1 0 011 1v3a2 2 0 000 4v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a2 2 0 000-4V6a1 1 0 011-1zM12 8v8',
  wallet: 'M4 7.5A2.5 2.5 0 016.5 5H18a2 2 0 012 2v1M4 7.5V17a2 2 0 002 2h12a2 2 0 002-2v-2M4 7.5A2.5 2.5 0 006.5 10H20v5M16.5 12.5h.01',
  receipt: 'M6 3h12a1 1 0 011 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 011-1zM9 8h6M9 12h6M9 16h3',
  pix: 'M12 3l4.5 4.5L12 12 7.5 7.5 12 3zM12 12l4.5 4.5L12 21l-4.5-4.5L12 12zM3 12l4.5-4.5v9L3 12zM21 12l-4.5 4.5v-9L21 12z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  award: 'M12 14a5 5 0 100-10 5 5 0 000 10zM8.5 13L7 21l5-2.5L17 21l-1.5-8',
  play: 'M10 8.5l5.5 3.5L10 15.5v-7zM12 21a9 9 0 100-18 9 9 0 000 18z',
  chat: 'M20 12a7.5 7.5 0 01-10.9 6.7L4 20l1.3-4.4A7.5 7.5 0 1120 12z',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.2a2 2 0 11-4 0v-.1A1.6 1.6 0 006.9 19l-.1.1A2 2 0 114 16.3l.1-.1a1.6 1.6 0 00-1.1-2.7H2.8a2 2 0 110-4h.1A1.6 1.6 0 004.6 6.9l-.1-.1A2 2 0 117.3 4l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5V2.8a2 2 0 114 0v.1a1.6 1.6 0 001 1.5h.1a1.6 1.6 0 001.8-.3l.1-.1A2 2 0 1120 6.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1h.2a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z',
  book: 'M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15zM4 20.5A2.5 2.5 0 016.5 18H20v3H6.5A2.5 2.5 0 014 20.5z',
  life: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-5.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9',
  bell: 'M18 8a6 6 0 10-12 0c0 6-2 7-2 7h16s-2-1-2-7M13.7 20a2 2 0 01-3.4 0',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.2-4.2',
  plus: 'M12 5v14M5 12h14',
  chevron: 'M8 10l4 4 4-4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  ext: 'M14 4h6v6M20 4l-8.5 8.5M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4',
}

export function Icon({ d, size = 15, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  )
}
export { I }

const NAV = [
  {
    group: 'Operação',
    items: [
      { label: 'Visão geral', icon: I.grid, active: true },
      { label: 'Metas', icon: I.target, badge: '3' },
      { label: 'Operadores', icon: I.users },
      { label: 'Redes', icon: I.globe },
      { label: 'Slots', icon: I.slots },
    ],
  },
  {
    group: 'Financeiro',
    items: [
      { label: 'Faturamento', icon: I.wallet },
      { label: 'Custos', icon: I.receipt },
      { label: 'PIX', icon: I.pix },
      { label: 'Planejamento', icon: I.chart },
    ],
  },
  {
    group: 'Crescimento',
    items: [
      { label: 'Premiações', icon: I.award },
      { label: 'Aulas', icon: I.play },
      { label: 'Network', icon: I.chat, badge: '12' },
    ],
  },
]

/* ══════════════ Sidebar ══════════════ */
function Sidebar({ open, onClose, onOpenPalette }) {
  const [active, setActive] = useState('Visão geral')

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div className="v2-scrim" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
      </AnimatePresence>

      <aside className={`v2-side ${open ? 'is-open' : ''}`}>
        {/* Workspace switcher */}
        <button type="button" className="v2-ws">
          <img src="/icons/nexcontrol-icon-clean.png" alt="" width={22} height={22} style={{ borderRadius: 6, objectFit: 'contain' }} />
          <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
            <span className="v2-ws-name">Operação DS</span>
            <span className="v2-ws-plan">PRO · 4 operadores</span>
          </span>
          <Icon d={I.chevron} size={14} style={{ color: 'var(--t4)' }} />
        </button>

        {/* Busca */}
        <button type="button" className="v2-search" onClick={onOpenPalette}>
          <Icon d={I.search} size={14} />
          <span>Buscar…</span>
          <kbd>⌘K</kbd>
        </button>

        <nav className="v2-nav">
          {NAV.map(sec => (
            <div key={sec.group} className="v2-nav-group">
              <p className="v2-nav-label">{sec.group}</p>
              {sec.items.map(it => (
                <button key={it.label} type="button"
                  onClick={() => { setActive(it.label); onClose && onClose() }}
                  className={`v2-nav-item ${active === it.label ? 'is-active' : ''}`}>
                  <Icon d={it.icon} size={15} />
                  <span>{it.label}</span>
                  {it.badge && <em className="v2-nav-badge">{it.badge}</em>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="v2-side-foot">
          <button type="button" className="v2-nav-item"><Icon d={I.book} size={15} /><span>Documentação</span><Icon d={I.ext} size={12} style={{ marginLeft: 'auto', color: 'var(--t4)' }} /></button>
          <button type="button" className="v2-nav-item"><Icon d={I.life} size={15} /><span>Suporte</span></button>
          <button type="button" className="v2-nav-item"><Icon d={I.gear} size={15} /><span>Configurações</span></button>

          <div className="v2-user">
            <span className="v2-avatar">BO</span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span className="v2-ws-name">Bruno Oliveira</span>
              <span className="v2-ws-plan">admin@nexcpa.com.br</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}

/* ══════════════ Topbar ══════════════ */
function Topbar({ onMenu, onOpenPalette }) {
  return (
    <header className="v2-top">
      <div className="v2-top-l">
        <button type="button" className="v2-icon-btn v2-only-mobile" onClick={onMenu} aria-label="Menu">
          <Icon d="M4 7h16M4 12h16M4 17h16" size={16} />
        </button>
        <nav className="v2-crumb">
          <span>Operação DS</span>
          <span className="v2-crumb-sep">/</span>
          <strong>Visão geral</strong>
        </nav>
      </div>

      <div className="v2-top-r">
        <span className="v2-live">
          <motion.i animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          Ao vivo
        </span>
        <button type="button" className="v2-icon-btn v2-only-desk" onClick={onOpenPalette} aria-label="Buscar"><Icon d={I.search} size={15} /></button>
        <button type="button" className="v2-icon-btn" aria-label="Notificações"><Icon d={I.bell} size={15} /></button>
        <button type="button" className="v2-btn-ghost v2-only-desk">Feedback</button>
        <button type="button" className="v2-btn-primary"><Icon d={I.plus} size={14} /> Nova meta</button>
      </div>
    </header>
  )
}

/* ══════════════ Command palette ══════════════ */
const ALL_CMDS = NAV.flatMap(s => s.items.map(i => ({ ...i, group: s.group })))
  .concat([
    { label: 'Criar nova meta', icon: I.plus, group: 'Ações' },
    { label: 'Registrar remessa', icon: I.receipt, group: 'Ações' },
    { label: 'Lançar custo', icon: I.wallet, group: 'Ações' },
    { label: 'Convidar operador', icon: I.users, group: 'Ações' },
  ])

function Palette({ open, onClose }) {
  const [q, setQ] = useState('')
  const list = ALL_CMDS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => { if (!open) setQ('') }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="v2-scrim v2-scrim-top" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="v2-palette" onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: -8, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }} transition={{ duration: 0.16 }}>
            <div className="v2-palette-input">
              <Icon d={I.search} size={15} style={{ color: 'var(--t3)' }} />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar páginas, metas, operadores…" />
              <kbd>ESC</kbd>
            </div>
            <div className="v2-palette-list">
              {list.length === 0 && <p className="v2-palette-empty">Nenhum resultado para “{q}”.</p>}
              {list.map((c, i) => (
                <button key={c.label + i} type="button" className="v2-palette-item" onClick={onClose}>
                  <Icon d={c.icon} size={15} />
                  <span>{c.label}</span>
                  <em>{c.group}</em>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════ Shell ══════════════ */
export default function Shell({ children }) {
  const [menu, setMenu] = useState(false)
  const [palette, setPalette] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(v => !v) }
      if (e.key === 'Escape') setPalette(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="v2-root">
      <Sidebar open={menu} onClose={() => setMenu(false)} onOpenPalette={() => setPalette(true)} />
      <div className="v2-main">
        <Topbar onMenu={() => setMenu(true)} onOpenPalette={() => setPalette(true)} />
        <main className="v2-content">{children}</main>
      </div>
      <Palette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
