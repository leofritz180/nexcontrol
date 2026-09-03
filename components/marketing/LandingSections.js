'use client'
// ─────────────────────────────────────────────────────────────────────────
// LandingSections — blocos comerciais da landing publica (capitulos, antes/
// depois, app, ecossistema, footer). Puramente visual. Textos honestos: sem
// promessa de resultado, sem CNPJ/endereco/link legal inventado (o footer
// marca o que ainda nao existe como pendente em vez de fabricar).
// ─────────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import DashboardMock from './DashboardMock'

const check = (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
)

// ── 3 capitulos distintos, layout alternado ──────────────────────────────
const CHAPTERS = [
  {
    variant: 'dashboard', flip: false, accent: '#e11d1d',
    kicker: 'Gestão completa da operação',
    title: 'Cada remessa entra e o lucro se recalcula sozinho.',
    body: 'Nada de somar planilha no fim do dia. O operador registra, e o painel executivo atualiza depósito, saque, custo e lucro final na hora — do jeito que a operação realmente está.',
    points: ['Lucro final por meta, sem cálculo manual', 'Ranking de operadores em tempo real', 'Depositado, sacado e custos separados'],
  },
  {
    variant: 'ia', flip: true, accent: '#ff6b6b',
    kicker: 'Insights de IA',
    title: 'A inteligência que olha a operação quando você não pode.',
    body: 'A IA acompanha o padrão da sua operação e te chama quando algo sai da linha: sequência negativa, prejuízo acima da média ou uma meta que travou. Alerta operacional — não promessa de lucro.',
    points: ['Sequência negativa detectada cedo', 'Prejuízo acima da média sinalizado', 'Meta parada não passa batido'],
  },
  {
    variant: 'team', flip: false, accent: 'var(--profit)',
    kicker: 'Equipes e permissões',
    title: 'Toda a equipe na mesma tela, ao vivo.',
    body: 'Veja quem está online, o que cada operador registrou e o movimento da operação em tempo real. Líderes acompanham o time inteiro — e o operador nunca enxerga o financeiro do outro.',
    points: ['Operadores online agora', 'Feed de atividade em tempo real', 'Permissões que protegem o financeiro'],
  },
]

function Chapter({ c, i }) {
  const glow = c.accent === 'var(--profit)' ? 'rgba(209,250,229,0.18)' : 'rgba(229,57,53,0.28)'
  return (
    <div className="lp-chapter" style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center',
      maxWidth: 1040, margin: '0 auto', padding: '54px 24px',
    }}>
      <motion.div
        initial={{ opacity: 0, x: c.flip ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        className="lp-chapter-text" style={{ order: c.flip ? 2 : 1 }}
      >
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.accent === 'var(--profit)' ? 'var(--profit)' : '#ff6b6b', margin: '0 0 14px' }}>{c.kicker}</p>
        <h3 style={{ fontSize: 'clamp(22px, 3.4vw, 30px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 16px', lineHeight: 1.15 }}>{c.title}</h3>
        <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 22px', lineHeight: 1.6 }}>{c.body}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {c.points.map((p, k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: 'rgba(209,250,229,0.1)', border: '1px solid rgba(209,250,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{check}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{p}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.65, ease: [0.33, 1, 0.68, 1] }}
        className="lp-chapter-visual" style={{ order: c.flip ? 1 : 2, position: 'relative' }}
      >
        <div aria-hidden style={{ position: 'absolute', inset: '-6% -2%', borderRadius: 40, background: `radial-gradient(ellipse at ${c.flip ? '70%' : '30%'} 45%, ${glow}, transparent 65%)`, filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}><DashboardMock variant={c.variant} /></div>
      </motion.div>
    </div>
  )
}

export function Chapters() {
  return (
    <section id="produto" style={{ padding: '30px 0', scrollMarginTop: 100 }}>
      {CHAPTERS.map((c, i) => <Chapter key={i} c={c} i={i} />)}
    </section>
  )
}

// ── Antes / Depois ────────────────────────────────────────────────────────
export function AntesDepois() {
  const antes = ['Somando remessa a remessa na mão', 'Descobre o prejuízo só no fim do mês', 'Print no grupo pra saber o que a equipe fez', 'Nenhum alerta quando algo dá errado']
  const depois = ['Lucro final recalculado a cada registro', 'Prejuízo sinalizado na hora pela IA', 'Equipe inteira ao vivo na mesma tela', 'Notificação push do que realmente importa']
  return (
    <section style={{ padding: '54px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ff6b6b', margin: '0 0 10px' }}>A diferença</p>
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Da planilha ao controle real.</h2>
      </div>
      <div className="lp-ad-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ borderRadius: 18, padding: '26px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 18px' }}>Na planilha</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {antes.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </span>
                <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.42)' }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderRadius: 18, padding: '26px 24px', background: 'linear-gradient(180deg, #140707, #080404)', border: '1px solid rgba(229,57,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 50px rgba(229,57,53,0.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, #e53935, transparent)' }} />
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#ff6b6b', margin: '0 0 18px' }}>Na NexControl</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {depois.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: 'rgba(209,250,229,0.12)', border: '1px solid rgba(209,250,229,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{check}</span>
                <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── App + notificacoes ────────────────────────────────────────────────────
export function AppSection() {
  return (
    <section style={{ padding: '54px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div className="lp-app-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div aria-hidden style={{ position: 'absolute', inset: '0% 20%', borderRadius: 60, background: 'radial-gradient(ellipse, rgba(229,57,53,0.22), transparent 65%)', filter: 'blur(55px)', pointerEvents: 'none' }} />
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ position: 'relative', width: 236 }}>
            {/* screenshot REAL do app num frame de celular */}
            <div style={{ borderRadius: 34, padding: 9, background: 'linear-gradient(160deg, #1a1a1d, #050506)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: '#060607', aspectRatio: '1320 / 2868' }}>
                <Image src="/landing/mobile.png" alt="App da NexControl — feed de remessas e ranking de operadores" fill unoptimized sizes="236px" style={{ objectFit: 'cover' }} />
              </div>
            </div>
          </motion.div>
        </div>
        <div className="lp-app-text">
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff6b6b', margin: '0 0 14px' }}>No seu bolso</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 16px', lineHeight: 1.15 }}>A operação inteira no celular.</h2>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 22px', lineHeight: 1.6 }}>
            Instale a NexControl como app no iPhone e no Android. Notificações push chegam na hora — meta batida, movimentação da equipe e alertas da IA — mesmo com o app fechado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {['App instalável (iPhone e Android)', 'Push em tempo real do que importa', 'Mesmo painel, na palma da mão'].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: 'rgba(209,250,229,0.1)', border: '1px solid rgba(209,250,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{check}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Ecossistema (bento assimétrico) ───────────────────────────────────────
// Composição real: card grande = Captura de Depósitos (a feature da extensão,
// NÃO o bot externo "Cash Hunter"). Médios = Equipe e Notificações. Menores =
// Proxies (nome oficial "Minhas Proxies"), Network, Aulas VIP, Relatórios.
const ECO = [
  { area: 'a', big: true, accent: true, t: 'Captura automática de depósitos', d: 'A extensão lê o valor de cada QR PIX nas abas do bot e soma na remessa sozinha — zero digitação, sem contar duas vezes.', icon: 'M12 2v13m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2', demo: 'capture' },
  { area: 'b', accent: false, t: 'Equipe em tempo real', d: 'Quem está online e o que cada operador registrou, ao vivo.', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 0M23 21v-2a4 4 0 0 0-3-3.87', demo: 'team' },
  { area: 'c', accent: false, t: 'Notificações na hora', d: 'Push do que importa, mesmo com o app fechado.', icon: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', demo: 'bell' },
  { area: 'd', accent: false, t: 'Minhas Proxies', d: 'Giga em tempo real e loja integrada.', icon: 'M4 6h16M4 12h16M4 18h16' },
  { area: 'e', accent: false, t: 'Network', d: 'Comunidade fechada de admins.', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20' },
  { area: 'f', accent: false, t: 'Aulas VIP', d: 'Conteúdo gravado por conta.', icon: 'M23 7l-7 5 7 5V7zM1 5h15v14H1z' },
  { area: 'g', accent: false, t: 'Relatórios e lucro', d: 'Faturamento e performance num olhar.', icon: 'M3 3v18h18M7 15l3-3 3 3 5-6' },
]

function EcoDemo({ kind }) {
  if (kind === 'capture') return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[['Depósito lido', '+R$ 95,00'], ['Depósito lido', '+R$ 340,00'], ['Somado na remessa', 'R$ 435,00']].map(([l, v], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--profit)', boxShadow: '0 0 7px rgba(209,250,229,0.6)' }} />{l}
          </span>
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12.5, fontWeight: 800, color: i === 2 ? '#fff' : 'var(--profit)' }}>{v}</span>
        </div>
      ))}
    </div>
  )
  if (kind === 'team') return (
    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex' }}>{['C', 'P', 'A', 'L'].map((l, i) => (
        <span key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#26262b,#131315)', border: '2px solid #0a0a0b', marginLeft: i ? -7 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{l}</span>
      ))}</div>
      <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 13, fontWeight: 900, color: 'var(--profit)' }}>12 online</span>
    </div>
  )
  if (kind === 'bell') return (
    <div style={{ marginTop: 14, padding: '9px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff6b6b', boxShadow: '0 0 7px #ff6b6b' }} />
      <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>Meta concluída · <strong style={{ color: 'var(--profit)' }}>+R$ 1.240</strong></span>
    </div>
  )
  return null
}

export function EcosystemBento() {
  return (
    <section id="recursos" style={{ padding: '58px 24px', maxWidth: 1060, margin: '0 auto', scrollMarginTop: 100 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ff6b6b', margin: '0 0 12px' }}>Ecossistema Nex</p>
        <h2 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: 0, lineHeight: 1.1 }}>Mais que um painel. Um ecossistema de operação.</h2>
      </div>
      <div className="lp-bento">
        {ECO.map((e, i) => (
          <motion.div key={e.area}
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.05 }}
            className={`lp-bento-item area-${e.area}`}
            style={{
              padding: e.big ? '30px 28px' : '22px 20px', borderRadius: 18, position: 'relative', overflow: 'hidden',
              background: e.accent ? 'linear-gradient(160deg, rgba(225,29,29,0.12), rgba(225,29,29,0.02))' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${e.accent ? 'rgba(225,29,29,0.28)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ width: e.big ? 46 : 38, height: e.big ? 46 : 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 13, background: e.accent ? 'rgba(225,29,29,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${e.accent ? 'rgba(225,29,29,0.32)' : 'rgba(255,255,255,0.08)'}` }}>
              <svg width={e.big ? 22 : 18} height={e.big ? 22 : 18} viewBox="0 0 24 24" fill="none" stroke={e.accent ? '#ff6b6b' : 'rgba(255,255,255,0.75)'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={e.icon} /></svg>
            </div>
            <h3 style={{ fontSize: e.big ? 20 : 15.5, fontWeight: 800, color: '#fff', margin: '0 0 7px', letterSpacing: '-0.01em' }}>{e.t}</h3>
            <p style={{ fontSize: e.big ? 14 : 12.5, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>{e.d}</p>
            {e.demo && <EcoDemo kind={e.demo} />}
          </motion.div>
        ))}
      </div>
      <style>{`
        .lp-bento {
          display: grid; gap: 16px;
          grid-template-columns: repeat(4, 1fr);
          grid-template-areas:
            "a a b c"
            "a a d e"
            "f f g g";
        }
        .lp-bento-item.area-a { grid-area: a; }
        .lp-bento-item.area-b { grid-area: b; }
        .lp-bento-item.area-c { grid-area: c; }
        .lp-bento-item.area-d { grid-area: d; }
        .lp-bento-item.area-e { grid-area: e; }
        .lp-bento-item.area-f { grid-area: f; }
        .lp-bento-item.area-g { grid-area: g; }
        @media (max-width: 860px) {
          .lp-bento { grid-template-columns: 1fr 1fr; grid-template-areas: "a a" "b c" "d e" "f g"; }
        }
        @media (max-width: 520px) {
          .lp-bento { grid-template-columns: 1fr; grid-template-areas: "a" "b" "c" "d" "e" "f" "g"; }
        }
      `}</style>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────
export function LandingFooter() {
  const go = (href) => (e) => { e.preventDefault(); const el = document.querySelector(href); if (el) el.scrollIntoView({ behavior: 'smooth' }) }
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px 40px', marginTop: 20 }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 32 }} className="lp-footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <img src="/icons/nexcontrol-icon-clean.png" alt="" width={28} height={28} style={{ width: 28, height: 28, objectFit: 'contain', display: 'block' }} />
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.03em' }}><span style={{ color: '#F1F5F9' }}>Nex</span><span style={{ color: '#e11d1d' }}>Control</span></span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6, maxWidth: 300 }}>O sistema operacional do CPA: metas, operadores e lucro em tempo real, com IA e notificações na hora.</p>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 14px' }}>Plataforma</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['#produto', 'Produto'], ['#recursos', 'Recursos'], ['#premiacoes', 'Premiações'], ['#planos', 'Planos'], ['#faq', 'FAQ']].map(([h, l]) => (
              <a key={h} href={h} onClick={go(h)} style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 14px' }}>Conta</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/signup" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Criar conta</Link>
            <Link href="/login" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Entrar</Link>
            <Link href="/demo" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Ver demonstração</Link>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1040, margin: '32px auto 0', paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>© 2026 NexControl. Todos os direitos reservados.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--profit)', boxShadow: '0 0 6px rgba(209,250,229,0.5)' }} />
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sistema operacional ativo</span>
        </div>
      </div>
    </footer>
  )
}
