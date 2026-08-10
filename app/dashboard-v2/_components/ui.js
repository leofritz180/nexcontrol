'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon, I } from './icons'

/* ══════════════ Toasts ══════════════ */
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastHost({ children }) {
  const [list, setList] = useState([])
  const push = useMemo(() => (texto, tom = 'neutral') => {
    const id = `${texto}-${list.length}-${Math.round(performance.now())}`
    setList(l => [...l, { id, texto, tom }])
    setTimeout(() => setList(l => l.filter(t => t.id !== id)), 3600)
  }, [list.length])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="v2-toasts">
        <AnimatePresence>
          {list.map(t => (
            <motion.div key={t.id} className={`v2-toast is-${t.tom}`}
              initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }}>
              <i />{t.texto}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

/* ══════════════ Painel ══════════════ */
export function Panel({ children, style, className = '' }) {
  return <section className={`v2-panel ${className}`} style={style}>{children}</section>
}

export function PanelHead({ title, sub, action }) {
  return (
    <div className="v2-panel-h">
      <div style={{ minWidth: 0 }}>
        <h3 className="v2-panel-t">{title}</h3>
        {sub && <p className="v2-panel-s">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHead({ title, sub, actions }) {
  return (
    <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
      <div style={{ minWidth: 0 }}>
        <h1 className="v2-title">{title}</h1>
        {sub && <p className="v2-subtitle">{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </motion.header>
  )
}

/* ══════════════ Controles ══════════════ */
export function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div className={`v2-seg ${size === 'sm' ? 'is-sm' : ''}`}>
      {options.map(o => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)}
          className={value === o.id ? 'is-on' : ''}>{o.label}</button>
      ))}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="v2-field">
      <span className="v2-field-l">{label}</span>
      {children}
      {hint && <span className="v2-field-h">{hint}</span>}
    </label>
  )
}

export function Input(props) {
  return <input {...props} className={`v2-input ${props.className || ''}`} />
}

export function Select({ options, ...props }) {
  return (
    <select {...props} className={`v2-input v2-select ${props.className || ''}`}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  )
}

export function Pill({ tom = 'neutral', dot = true, children }) {
  return (
    <span className={`v2-pill ${tom === 'profit' ? 'is-profit' : tom === 'loss' ? 'is-loss' : ''}`}>
      {dot && <i />}{children}
    </span>
  )
}

export function Progress({ value, tom = 'neutral', delay = 0 }) {
  const bg = tom === 'profit' ? 'var(--profit)' : tom === 'loss' ? 'var(--loss)' : 'rgba(255,255,255,0.42)'
  return (
    <div className="v2-progress">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        transition={{ duration: 0.7, delay, ease: [0.33, 1, 0.68, 1] }}
        style={{ height: '100%', background: bg, borderRadius: 99 }} />
    </div>
  )
}

export function EmptyState({ titulo, texto, acao }) {
  return (
    <div className="v2-empty">
      <div className="v2-empty-ico"><Icon d={I.search} size={18} /></div>
      <p className="v2-empty-t">{titulo}</p>
      {texto && <p className="v2-empty-s">{texto}</p>}
      {acao}
    </div>
  )
}

export function Skeleton({ h = 14, w = '100%', style }) {
  return <div className="v2-skel" style={{ height: h, width: w, ...style }} />
}

/* ══════════════ Tabela com busca / ordenacao / paginacao ══════════════ */
export function DataTable({
  columns, rows, searchKeys = [], pageSize = 8, onRowClick,
  toolbar, empty = 'Nada por aqui ainda.', searchPlaceholder = 'Buscar…', dense = false,
}) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'desc' })
  const [page, setPage] = useState(0)

  useEffect(() => { setPage(0) }, [q, rows.length])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term || !searchKeys.length) return rows
    return rows.filter(r => searchKeys.some(k => String(r[k] ?? '').toLowerCase().includes(term)))
  }, [q, rows, searchKeys])

  const sorted = useMemo(() => {
    if (!sort.key) return filtered
    const col = columns.find(c => c.key === sort.key)
    const get = col?.sortValue || (r => r[sort.key])
    return [...filtered].sort((a, b) => {
      const va = get(a), vb = get(b)
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : (Number(va) - Number(vb))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const view = sorted.slice(page * pageSize, page * pageSize + pageSize)

  function toggleSort(key) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  return (
    <>
      {(searchKeys.length > 0 || toolbar) && (
        <div className="v2-toolbar">
          {searchKeys.length > 0 && (
            <div className="v2-inline-search">
              <Icon d={I.search} size={14} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={searchPlaceholder} />
              {q && <button type="button" onClick={() => setQ('')} aria-label="Limpar"><Icon d="M6 6l12 12M18 6L6 18" size={13} /></button>}
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="v2-table-wrap">
        <table className={`v2-table ${dense ? 'is-dense' : ''}`}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} className={c.align === 'right' ? 'num' : ''} style={{ width: c.width }}>
                  {c.sortable === false ? c.label : (
                    <button type="button" className="v2-th-btn" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      <span className={`v2-th-ico ${sort.key === c.key ? 'is-on' : ''}`}>
                        <Icon d={sort.key === c.key && sort.dir === 'asc' ? 'M6 14l6-6 6 6' : 'M6 10l6 6 6-6'} size={11} />
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r, i) => (
              <tr key={r.id || i} onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={onRowClick ? 'is-clickable' : ''}>
                {columns.map(c => (
                  <td key={c.key} className={c.align === 'right' ? 'num' : ''} style={c.tdStyle ? c.tdStyle(r) : undefined}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {view.length === 0 && <EmptyState titulo={empty} texto={q ? `Nenhum resultado para “${q}”.` : undefined} />}

      {pages > 1 && (
        <div className="v2-pager">
          <span>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} de {sorted.length}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="v2-icon-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <Icon d="M15 6l-6 6 6 6" size={14} />
            </button>
            <button type="button" className="v2-icon-btn" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>
              <Icon d="M9 6l6 6-6 6" size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ══════════════ Drawer lateral ══════════════ */
export function Drawer({ open, onClose, title, sub, children, footer }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="v2-scrim" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="v2-drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}>
            <div className="v2-drawer-h">
              <div style={{ minWidth: 0 }}>
                <h3 className="v2-panel-t">{title}</h3>
                {sub && <p className="v2-panel-s">{sub}</p>}
              </div>
              <button type="button" className="v2-icon-btn" onClick={onClose} aria-label="Fechar">
                <Icon d="M6 6l12 12M18 6L6 18" size={15} />
              </button>
            </div>
            <div className="v2-drawer-b">{children}</div>
            {footer && <div className="v2-drawer-f">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ══════════════ Modal ══════════════ */
export function Modal({ open, onClose, title, sub, children, footer, width = 520 }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="v2-scrim v2-scrim-center" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="v2-modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }}>
            <div className="v2-drawer-h">
              <div style={{ minWidth: 0 }}>
                <h3 className="v2-panel-t">{title}</h3>
                {sub && <p className="v2-panel-s">{sub}</p>}
              </div>
              <button type="button" className="v2-icon-btn" onClick={onClose} aria-label="Fechar">
                <Icon d="M6 6l12 12M18 6L6 18" size={15} />
              </button>
            </div>
            <div className="v2-modal-b">{children}</div>
            {footer && <div className="v2-drawer-f">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════ Linha de definicao (drawer) ══════════════ */
export function Def({ label, value, tom }) {
  return (
    <div className="v2-def">
      <span>{label}</span>
      <strong style={{ color: tom === 'profit' ? 'var(--profit)' : tom === 'loss' ? 'var(--loss)' : 'var(--t1)' }}>{value}</strong>
    </div>
  )
}
