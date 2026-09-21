'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[NexControl error]', error)
  }, [error])

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--surface)',
    }}>
      <div style={{
        maxWidth: 520, width: '100%', padding: 32, borderRadius: 20,
        background: 'var(--surface)',
        border: '1px solid rgba(239,68,68,0.25)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(239,68,68,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Algo inesperado aconteceu</h2>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0' }}>Detalhes abaixo para diagnostico.</p>
          </div>
        </div>
        <div style={{
          padding: 14, borderRadius: 10, marginBottom: 18,
          background: 'var(--surface)', border: '1px solid var(--b1)',
          fontSize: 11, fontFamily: 'var(--mono, monospace)', color: 'var(--loss)',
          maxHeight: 200, overflowY: 'auto', whiteSpace:'pre-wrap', wordBreak:'break-word',
        }}>
          {error?.message || 'Erro desconhecido'}
          {error?.digest && <div style={{ marginTop: 6, color: '#82828d' }}>digest: {error.digest}</div>}
          {error?.stack && <div style={{ marginTop: 10, color: '#82828d', fontSize: 10 }}>{error.stack.split('\n').slice(0,6).join('\n')}</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => reset()} style={{
            flex: 1, padding: '12px 20px', borderRadius: 11, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: '#fff',
            background: 'linear-gradient(145deg, #e5391f, #b32c16)',
            boxShadow: '0 4px 14px rgba(229,57,31,0.35)',
          }}>Tentar novamente</button>
          <button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/' }} style={{
            padding: '12px 20px', borderRadius: 11, border: '1px solid var(--b1)', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: 'var(--t3)',
            background: 'var(--fill-1)',
          }}>Voltar ao inicio</button>
        </div>
      </div>
    </main>
  )
}
