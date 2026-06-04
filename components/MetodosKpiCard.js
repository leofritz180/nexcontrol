'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'

const fmtBRL = v => (Number(v) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// Card compacto que mostra: Lucro CPA · Lucro Metodos · Consolidado
// Usado em Visao Geral. Faz fetch proprio dos metodos.
export default function MetodosKpiCard({ lucroCpa = 0, onGoToTab }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const { data } = await supabase.auth.getSession()
        const token = data?.session?.access_token
        if (!token) return
        const r = await fetch('/api/metodos', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
        const j = await r.json()
        if (alive) setItems(j.items || [])
      } catch {}
      if (alive) setLoading(false)
    }
    load()
    const interval = setInterval(load, 15000)
    // Refresh imediato quando algum registro for criado/deletado em qualquer lugar
    const handler = () => load()
    window.addEventListener('metodos:updated', handler)
    // Quando user volta pra aba do navegador, refresh imediato
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false; clearInterval(interval)
      window.removeEventListener('metodos:updated', handler)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const liquidoMetodos = items.reduce((acc, it) => {
    const v = Number(it.valor || 0)
    return acc + (it.tipo === 'lucro' ? v : -v)
  }, 0)

  const consolidado = Number(lucroCpa || 0) + liquidoMetodos

  const cardBase = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: '16px 20px',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12, marginBottom: 24 }}
         className="g-3">
      {/* Lucro CPA */}
      <div style={cardBase}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Lucro CPA (metas fechadas)</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: lucroCpa >= 0 ? '#D1FAE5' : '#EF4444', letterSpacing: '-0.02em' }}>
          {lucroCpa >= 0 ? '+' : '-'}R$ {fmtBRL(Math.abs(lucroCpa))}
        </div>
      </div>

      {/* Lucro Metodos */}
      <button type="button" onClick={() => onGoToTab?.('metodos')}
        style={{ ...cardBase, textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          Lucro Metodos
          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: 'rgba(229,57,53,0.15)', color: '#e53935', letterSpacing: '0.04em' }}>BETA</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: liquidoMetodos >= 0 ? '#D1FAE5' : '#EF4444', letterSpacing: '-0.02em' }}>
          {loading ? '...' : (liquidoMetodos >= 0 ? '+' : '-') + 'R$ ' + fmtBRL(Math.abs(liquidoMetodos))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4 }}>{items.length} registro{items.length !== 1 ? 's' : ''} · clique pra abrir</div>
      </button>

      {/* Consolidado */}
      <div style={{ ...cardBase, background: consolidado >= 0 ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)', border: '1px solid ' + (consolidado >= 0 ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)') }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Consolidado (CPA + Metodos)</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 900, color: consolidado >= 0 ? '#10B981' : '#EF4444', letterSpacing: '-0.02em' }}>
          {consolidado >= 0 ? '+' : '-'}R$ {fmtBRL(Math.abs(consolidado))}
        </div>
      </div>
    </div>
  )
}
