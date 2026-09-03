'use client'
// ─────────────────────────────────────────────────────────────────────────
// DashboardMock — reproducao fiel da interface real da NexControl para a
// landing (nao e print, e a mesma linguagem visual: cards escuros, numeros
// mono, vermelho brand + mint de lucro). Variantes:
//   'dashboard' — painel executivo (KPIs + ranking + remessas)
//   'ia'        — cartoes de insight de IA
//   'team'      — operadores online / feed em tempo real
//   'mobile'    — tela do app com notificacao
// Puramente visual. Dados ilustrativos, sem promessa numerica.
// ─────────────────────────────────────────────────────────────────────────
import { NexIcon } from '../Logo'

const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }
const mono = 'var(--mono, "JetBrains Mono", monospace)'

function Chrome({ title, children, live = true }) {
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden', background: 'linear-gradient(160deg, #0d0d0f, #070708)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><NexIcon size={9} /></span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{title}</span>
        </div>
        {live && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--profit)', boxShadow: '0 0 8px rgba(209,250,229,0.6)' }} />
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.05em' }}>AO VIVO</span>
          </div>
        )}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  )
}

function Dashboard() {
  return (
    <Chrome title="Painel executivo">
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ ...card, padding: '14px 16px' }}>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: '0 0 7px' }}>Lucro final acumulado</p>
          <p style={{ fontFamily: mono, fontSize: 26, fontWeight: 900, color: 'var(--profit)', margin: 0, textShadow: '0 0 22px rgba(209,250,229,0.22)' }}>+R$ 128.940</p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.22)', marginTop: 5 }}>20 metas fechadas · mês atual</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[['Depositado', 'R$ 57.581'], ['Sacado', 'R$ 51.330'], ['Custos', 'R$ 2.114']].map(([l, v]) => (
            <div key={l} style={{ ...card, flex: 1, padding: '7px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.28)' }}>{l}</span>
              <span style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...card, padding: '11px 13px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', margin: '0 0 9px' }}>Ranking de operadores</p>
        {[['Carlos', 120, true], ['Pedro', 95, true], ['Ana', 68, true], ['Lucas', 18, false]].map(([n, v, g], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.25)', width: 12 }}>{i + 1}º</span>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{String(n)[0]}</span>
              <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)' }}>{n}</span>
            </div>
            <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: g ? 'var(--profit)' : 'var(--loss)' }}>{g ? '+' : '-'}R$ {v},00</span>
          </div>
        ))}
      </div>
    </Chrome>
  )
}

function IA() {
  const insights = [
    { c: 'var(--loss)', t: 'Sequência negativa detectada', d: 'W1 · 3 remessas seguidas no vermelho. Reveja a alocação.' },
    { c: '#e53935', t: 'Prejuízo acima da média', d: 'OKOK está 42% acima do custo médio das últimas metas.' },
    { c: 'var(--profit)', t: 'Meta pronta pra fechar', d: 'VOY bateu o alvo de depósitos. Feche e registre o lucro.' },
  ]
  return (
    <Chrome title="Insights de IA">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {insights.map((it, i) => (
          <div key={i} style={{ ...card, padding: '11px 13px', display: 'flex', gap: 10, alignItems: 'flex-start', borderLeft: `2px solid ${it.c}` }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={it.c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.3L18 9l-4.1 1.7L12 15l-1.9-4.3L6 9l4.1-1.7z" /></svg>
            </span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.82)', margin: '0 0 3px' }}>{it.t}</p>
              <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.45 }}>{it.d}</p>
            </div>
          </div>
        ))}
      </div>
    </Chrome>
  )
}

function Team() {
  return (
    <Chrome title="Equipe · tempo real">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex' }}>
          {['C', 'P', 'A', 'L', 'M'].map((l, i) => (
            <span key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, #2a2a2e, #131315)`, border: '2px solid #0a0a0b', marginLeft: i ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{l}</span>
          ))}
        </div>
        <div>
          <p style={{ fontFamily: mono, fontSize: 15, fontWeight: 900, color: '#fff', margin: 0 }}>12 online</p>
          <p style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', margin: 0 }}>operadores conectados agora</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[['Carlos', 'registrou +R$ 120', 'var(--profit)'], ['Ana', 'concluiu a meta W1', 'var(--profit)'], ['Pedro', 'abriu nova remessa', '#e53935']].map(([n, a, c], i) => (
          <div key={i} style={{ ...card, padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 7px ${c}`, flexShrink: 0 }} />
            <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.55)' }}><strong style={{ color: '#fff', fontWeight: 700 }}>{n}</strong> {a}</span>
          </div>
        ))}
      </div>
    </Chrome>
  )
}

function Mobile() {
  return (
    <div style={{ width: 232, borderRadius: 34, padding: 9, background: 'linear-gradient(160deg, #1a1a1d, #050506)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 56, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.12)', zIndex: 2 }} />
      <div style={{ borderRadius: 26, overflow: 'hidden', background: '#060607', minHeight: 452, padding: '38px 13px 18px' }}>
        {/* notificacao push */}
        <div style={{ ...card, padding: '9px 11px', display: 'flex', gap: 9, alignItems: 'center', marginBottom: 14, background: 'rgba(255,255,255,0.06)', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NexIcon size={10} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>NexControl</span>
              <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.25)' }}>agora</span>
            </div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>Meta concluída: <span style={{ color: 'var(--profit)', fontWeight: 700 }}>+R$ 1.240</span></p>
          </div>
        </div>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: '0 0 5px' }}>Lucro final · hoje</p>
        <p style={{ fontFamily: mono, fontSize: 25, fontWeight: 900, color: 'var(--profit)', margin: '0 0 14px', textShadow: '0 0 20px rgba(209,250,229,0.2)' }}>+R$ 8.420</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[['W1', '+R$ 3.120', true], ['OKOK', '+R$ 2.980', true], ['VOY', '-R$ 340', false], ['DY', '+R$ 2.660', true]].map(([n, v, g], i) => (
            <div key={i} style={{ ...card, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{n}</span>
              <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: g ? 'var(--profit)' : 'var(--loss)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardMock({ variant = 'dashboard' }) {
  if (variant === 'ia') return <IA />
  if (variant === 'team') return <Team />
  if (variant === 'mobile') return <Mobile />
  return <Dashboard />
}
