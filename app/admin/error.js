'use client'
import { useEffect } from 'react'

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('[Admin error]', error)
  }, [error])

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#000000',
    }}>
      <div style={{
        maxWidth: 520, width: '100%', padding: 32, borderRadius: 20,
        background: 'linear-gradient(145deg, rgba(14,22,38,0.85), rgba(8,14,26,0.85))',
        border: '1px solid rgba(239,68,68,0.25)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(239,68,68,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Ops, algo quebrou</h2>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>O painel nao pode carregar esta visualizacao.</p>
          </div>
        </div>
        <div style={{
          padding: 14, borderRadius: 10, marginBottom: 18,
          background: 'rgba(4,8,16,0.7)', border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, fontFamily: 'var(--mono, monospace)', color: '#EF4444',
          maxHeight: 140, overflowY: 'auto',
        }}>
          {error?.message || 'Erro desconhecido'}
          {error?.digest && <div style={{ marginTop: 6, color: '#64748B' }}>digest: {error.digest}</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => reset()} style={{
            flex: 1, padding: '12px 20px', borderRadius: 11, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: '#fff',
            background: 'linear-gradient(145deg, #e53935, #c62828)',
            boxShadow: '0 4px 14px rgba(229,57,53,0.35)',
          }}>Tentar novamente</button>
          <button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/login' }} style={{
            padding: '12px 20px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: '#94A3B8',
            background: 'rgba(255,255,255,0.03)',
          }}>Ir para login</button>
        </div>
      </div>
    </main>
  )
}
