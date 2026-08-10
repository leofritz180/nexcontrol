'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon, I } from './icons'
import { notificacoes } from './data'

export { Icon, I }

export const NAV = [
  {
    group: 'Operação',
    items: [
      { id: 'overview', label: 'Visão geral', icon: I.grid },
      { id: 'metas', label: 'Metas', icon: I.target, badge: '3' },
      { id: 'operadores', label: 'Operadores', icon: I.users },
      { id: 'redes', label: 'Redes', icon: I.globe },
      { id: 'slots', label: 'Slots', icon: I.slots },
    ],
  },
  {
    group: 'Financeiro',
    items: [
      { id: 'faturamento', label: 'Faturamento', icon: I.wallet },
      { id: 'custos', label: 'Custos', icon: I.receipt },
      { id: 'pix', label: 'PIX', icon: I.pix },
    ],
  },
  {
    group: 'Crescimento',
    items: [
      { id: 'premiacoes', label: 'Premiações', icon: I.award },
      { id: 'network', label: 'Network', icon: I.chat, badge: '12' },
    ],
  },
]

export const VIEW_META = NAV.flatMap(g => g.items).reduce((acc, it) => { acc[it.id] = it; return acc }, {})

/* ══════════════ Dropdown generico ══════════════ */
function Dropdown({ open, onClose, children, align = 'right', width = 280, top = 40 }) {
  const ref = useRef(null)
  useEffect(() => {
    function onDoc(e) { if (open && ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div ref={ref} className="v2-dropdown"
          style={{ width, top, [align]: 0 }}
          initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.14 }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════ Sidebar ══════════════ */
function Sidebar({ open, onClose, view, onNavigate, onOpenPalette }) {
  const [wsOpen, setWsOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div className="v2-scrim v2-scrim-side" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
      </AnimatePresence>

      <aside className={`v2-side ${open ? 'is-open' : ''}`}>
        <div style={{ position: 'relative' }}>
          <button type="button" className="v2-ws" onClick={() => setWsOpen(v => !v)}>
            <img src="/icons/nexcontrol-icon-clean.png" alt="" width={22} height={22} style={{ borderRadius: 6, objectFit: 'contain' }} />
            <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
              <span className="v2-ws-name">Operação DS</span>
              <span className="v2-ws-plan">PRO · 3 operadores</span>
            </span>
            <Icon d={I.chevron} size={14} style={{ color: 'var(--t4)' }} />
          </button>
          <Dropdown open={wsOpen} onClose={() => setWsOpen(false)} align="left" width={212} top={46}>
            <p className="v2-dd-label">Operações</p>
            <button type="button" className="v2-dd-item is-on" onClick={() => setWsOpen(false)}>
              <span className="v2-avatar" style={{ width: 22, height: 22, fontSize: 9 }}>DS</span>
              Operação DS
              <Icon d={I.check} size={13} style={{ marginLeft: 'auto', color: 'var(--profit)' }} />
            </button>
            <button type="button" className="v2-dd-item" onClick={() => setWsOpen(false)}>
              <span className="v2-avatar" style={{ width: 22, height: 22, fontSize: 9 }}>NX</span>
              Operação Beta
            </button>
            <div className="v2-dd-sep" />
            <button type="button" className="v2-dd-item" onClick={() => setWsOpen(false)}>
              <Icon d={I.plus} size={14} /> Nova operação
            </button>
          </Dropdown>
        </div>

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
                <button key={it.id} type="button"
                  onClick={() => { onNavigate(it.id); onClose && onClose() }}
                  className={`v2-nav-item ${view === it.id ? 'is-active' : ''}`}>
                  <Icon d={it.icon} size={15} />
                  <span>{it.label}</span>
                  {it.badge && <em className="v2-nav-badge">{it.badge}</em>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="v2-side-foot">
          <button type="button" className="v2-nav-item" onClick={() => onNavigate('docs')}>
            <Icon d={I.book} size={15} /><span>Documentação</span>
            <Icon d={I.ext} size={12} style={{ marginLeft: 'auto', color: 'var(--t4)' }} />
          </button>
          <button type="button" className="v2-nav-item" onClick={() => onNavigate('suporte')}>
            <Icon d={I.life} size={15} /><span>Suporte</span>
          </button>
          <button type="button" className={`v2-nav-item ${view === 'config' ? 'is-active' : ''}`} onClick={() => { onNavigate('config'); onClose && onClose() }}>
            <Icon d={I.gear} size={15} /><span>Configurações</span>
          </button>

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
function Topbar({ onMenu, onOpenPalette, view, onNavigate, onRefresh, refreshing }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifs, setNotifs] = useState(() => notificacoes())
  const naoLidas = notifs.filter(n => !n.lida).length
  const atual = VIEW_META[view]?.label || (view === 'config' ? 'Configurações' : 'Visão geral')

  return (
    <header className="v2-top">
      <div className="v2-top-l">
        <button type="button" className="v2-icon-btn v2-only-mobile" onClick={onMenu} aria-label="Menu">
          <Icon d="M4 7h16M4 12h16M4 17h16" size={16} />
        </button>
        <nav className="v2-crumb">
          <span>Operação DS</span>
          <span className="v2-crumb-sep">/</span>
          <strong>{atual}</strong>
        </nav>
      </div>

      <div className="v2-top-r">
        <span className="v2-live">
          <motion.i animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          Ao vivo
        </span>

        <button type="button" className="v2-icon-btn v2-only-desk" onClick={onOpenPalette} aria-label="Buscar">
          <Icon d={I.search} size={15} />
        </button>

        <button type="button" className="v2-icon-btn" onClick={onRefresh} aria-label="Atualizar">
          <motion.span style={{ display: 'flex' }} animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }}>
            <Icon d={I.refresh} size={15} />
          </motion.span>
        </button>

        <div style={{ position: 'relative' }}>
          <button type="button" className="v2-icon-btn" onClick={() => setNotifOpen(v => !v)} aria-label="Notificações">
            <Icon d={I.bell} size={15} />
            {naoLidas > 0 && <span className="v2-dot-badge" />}
          </button>
          <Dropdown open={notifOpen} onClose={() => setNotifOpen(false)} width={310} top={38}>
            <div className="v2-dd-head">
              <p className="v2-dd-label" style={{ margin: 0 }}>Notificações</p>
              <button type="button" className="v2-link" onClick={() => setNotifs(n => n.map(x => ({ ...x, lida: true })))}>
                Marcar como lidas
              </button>
            </div>
            {notifs.map(n => (
              <button key={n.id} type="button" className={`v2-notif ${n.lida ? '' : 'is-new'}`}
                onClick={() => { setNotifs(l => l.map(x => x.id === n.id ? { ...x, lida: true } : x)); setNotifOpen(false) }}>
                <i className={`v2-notif-dot is-${n.tom}`} />
                <span>
                  <strong>{n.titulo}</strong>
                  <em>{n.texto}</em>
                </span>
                <b>{n.tempo}</b>
              </button>
            ))}
          </Dropdown>
        </div>

        <button type="button" className="v2-btn-ghost v2-only-desk" onClick={() => onNavigate('suporte')}>Feedback</button>

        <div style={{ position: 'relative' }}>
          <button type="button" className="v2-avatar v2-avatar-btn" onClick={() => setUserOpen(v => !v)}>BO</button>
          <Dropdown open={userOpen} onClose={() => setUserOpen(false)} width={220} top={38}>
            <div className="v2-dd-user">
              <span className="v2-avatar">BO</span>
              <span style={{ minWidth: 0 }}>
                <span className="v2-ws-name">Bruno Oliveira</span>
                <span className="v2-ws-plan">admin@nexcpa.com.br</span>
              </span>
            </div>
            <div className="v2-dd-sep" />
            <button type="button" className="v2-dd-item" onClick={() => { onNavigate('config'); setUserOpen(false) }}><Icon d={I.user} size={14} /> Minha conta</button>
            <button type="button" className="v2-dd-item" onClick={() => { onNavigate('faturamento'); setUserOpen(false) }}><Icon d={I.wallet} size={14} /> Assinatura</button>
            <button type="button" className="v2-dd-item" onClick={() => { onNavigate('config'); setUserOpen(false) }}><Icon d={I.gear} size={14} /> Preferências</button>
            <div className="v2-dd-sep" />
            <button type="button" className="v2-dd-item" onClick={() => setUserOpen(false)}><Icon d={I.logout} size={14} /> Sair</button>
          </Dropdown>
        </div>
      </div>
    </header>
  )
}

/* ══════════════ Command palette ══════════════ */
function Palette({ open, onClose, onNavigate, onAction }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)

  const cmds = [
    ...NAV.flatMap(s => s.items.map(i => ({ ...i, group: s.group, kind: 'nav' }))),
    { id: 'nova-meta', label: 'Criar nova meta', icon: I.plus, group: 'Ações', kind: 'action' },
    { id: 'novo-custo', label: 'Lançar custo', icon: I.receipt, group: 'Ações', kind: 'action' },
    { id: 'convidar', label: 'Convidar operador', icon: I.users, group: 'Ações', kind: 'action' },
    { id: 'exportar', label: 'Exportar relatório CSV', icon: I.download, group: 'Ações', kind: 'action' },
  ]
  const list = cmds.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => { if (!open) { setQ(''); setSel(0) } }, [open])
  useEffect(() => { setSel(0) }, [q])

  function run(c) {
    onClose()
    if (c.kind === 'nav') onNavigate(c.id)
    else onAction(c.id)
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, list.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && list[sel]) { e.preventDefault(); run(list[sel]) }
  }

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
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
                placeholder="Buscar páginas e ações…" />
              <kbd>ESC</kbd>
            </div>
            <div className="v2-palette-list">
              {list.length === 0 && <p className="v2-palette-empty">Nenhum resultado para “{q}”.</p>}
              {list.map((c, i) => (
                <button key={c.id} type="button" onMouseEnter={() => setSel(i)}
                  className={`v2-palette-item ${i === sel ? 'is-sel' : ''}`} onClick={() => run(c)}>
                  <Icon d={c.icon} size={15} />
                  <span>{c.label}</span>
                  <em>{c.group}</em>
                </button>
              ))}
            </div>
            <div className="v2-palette-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
              <span><kbd>↵</kbd> abrir</span>
              <span><kbd>ESC</kbd> fechar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════ Shell ══════════════ */
export default function Shell({ view, onNavigate, onAction, onRefresh, refreshing, children }) {
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
      <Sidebar open={menu} onClose={() => setMenu(false)} view={view}
        onNavigate={onNavigate} onOpenPalette={() => setPalette(true)} />
      <div className="v2-main">
        <Topbar onMenu={() => setMenu(true)} onOpenPalette={() => setPalette(true)}
          view={view} onNavigate={onNavigate} onRefresh={onRefresh} refreshing={refreshing} />
        <AnimatePresence>
          {refreshing && (
            <motion.div className="v2-loadbar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.i animate={{ x: ['-40%', '140%'] }} transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }} />
            </motion.div>
          )}
        </AnimatePresence>
        <main className="v2-content">{children}</main>
      </div>
      <Palette open={palette} onClose={() => setPalette(false)} onNavigate={onNavigate} onAction={onAction} />
    </div>
  )
}
