'use client'
import { useRouter } from 'next/navigation'

// Faixa de PATROCÍNIO/PARCERIA da Loja Bettify — discreta, estilo "parceiro oficial".
// Espalhar em pontos da dash (meta/remessas, rankings). Clica -> loja (/proxy).
// props: pitch (frase curta opcional), style (ajuste externo).
export default function BettifySponsor({ pitch = 'Proxies BR residenciais · menos bloqueio na sua operação', style = {} }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push('/proxy')}
      title="Bettify Proxy — parceiro oficial"
      style={{
        display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
        background: 'linear-gradient(135deg, rgba(255,107,0,0.09), rgba(255,255,255,0.012))',
        border: '1px solid rgba(255,107,0,0.22)', transition: 'border-color .2s, background .2s',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,107,0,0.16), rgba(255,255,255,0.02))' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.22)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,107,0,0.09), rgba(255,255,255,0.012))' }}
    >
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 1 }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: '#FF6B00', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(255,107,0,0.12)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(255,107,0,0.25)' }}>Parceiro oficial</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--t1)' }}>Bettify Proxy</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pitch}</p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6B00', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        Ver
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
      </span>
    </div>
  )
}
