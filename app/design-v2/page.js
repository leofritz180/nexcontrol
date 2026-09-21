'use client'
// ─────────────────────────────────────────────────────────────────────────
// PRÉVIA DO REDESIGN — dashboard do cliente na linguagem "centro de comando".
// ISOLADA: dados fictícios, nenhuma leitura/escrita no Supabase, fora do
// AppLayout. Serve só pra aprovar a direção antes de aplicar em /admin e
// /operator. Alternar Admin/Operador pelo seletor do topo.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion } from 'framer-motion'
import { NX, surface, fmt, fmt0, brl, Eyebrow, Sub, Valor, Num, Delta, Panel, Strip, Bar, Spark, Row, Pill, LiveDot, rise } from '../../components/ui/nex'

// ── dados de demonstração (fictícios) ──
const SPARK = [42, 51, 47, 63, 58, 72, 69, 84, 78, 91, 88, 104, 97, 118]
const OPERADORES = [
  { n: 'Carlos', v: 4820, contas: 132, on: true },
  { n: 'Pedro', v: 3910, contas: 98, on: true },
  { n: 'Ana', v: 2740, contas: 77, on: false },
  { n: 'Lucas', v: -320, contas: 24, on: true },
]
const METAS = [
  { rede: 'WE', alvo: 150, feito: 128, lucro: 3120, dias: 2 },
  { rede: 'W1', alvo: 200, feito: 96, lucro: 1840, dias: 5 },
  { rede: 'OKOK', alvo: 100, feito: 94, lucro: 2980, dias: 1 },
  { rede: 'VOY', alvo: 120, feito: 31, lucro: -340, dias: 12, alerta: true },
]
const FEED = [
  { q: 'Carlos', o: 'registrou remessa', v: 340, t: 'agora' },
  { q: 'Ana', o: 'concluiu a meta OKOK', v: 2980, t: '12 min' },
  { q: 'Pedro', o: 'registrou remessa', v: 95, t: '31 min' },
  { q: 'Lucas', o: 'abriu nova remessa', v: null, t: '1 h' },
]
const INSIGHTS = [
  { tone: 'loss', t: 'Sequência negativa na VOY', d: '3 remessas seguidas no vermelho. Vale revisar a alocação.' },
  { tone: 'red', t: 'Meta parada há 12 dias', d: 'VOY está em 26% e sem movimento desde o dia 9.' },
  { tone: 'mint', t: 'OKOK pronta pra fechar', d: 'Bateu 94 de 100 depósitos — fechando agora entra R$ 2.980.' },
]

function Header({ modo, setModo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(225,29,29,0.1)', border: '1px solid rgba(225,29,29,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(225,29,29,0.18)' }}>
          <img src="/icons/nexcontrol-icon-clean.png" alt="" width={22} height={22} style={{ width: 22, height: 22, objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: NX.t1, margin: 0, letterSpacing: '-0.03em' }}>Minha Operação</h1>
            <Pill tone="red">PRÉVIA</Pill>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
            <LiveDot />
            <span style={{ fontSize: 11.5, color: NX.t3 }}>12 operadores online · atualizado agora</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${NX.line}` }}>
        {['admin', 'operador'].map(m => (
          <button key={m} type="button" onClick={() => setModo(m)} style={{
            padding: '8px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', border: 'none',
            background: modo === m ? NX.red : 'transparent', color: modo === m ? '#fff' : NX.t3, textTransform: 'capitalize', transition: 'all 0.18s',
          }}>{m}</button>
        ))}
      </div>
    </div>
  )
}

export default function DesignV2() {
  const [modo, setModo] = useState('admin')
  const isAdmin = modo === 'admin'
  const metaDia = { alvo: 5000, feito: 3420 }
  const pctDia = Math.round((metaDia.feito / metaDia.alvo) * 100)

  return (
    <main style={{ minHeight: '100vh', background: '#050505', position: 'relative' }}>
      <div aria-hidden style={{ position: 'fixed', top: '-15%', left: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,29,0.07), transparent 65%)', filter: 'blur(90px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 24px 80px', position: 'relative' }}>
        <Header modo={modo} setModo={setModo} />

        {/* ══ NÍVEL 1 — o número que importa ══ */}
        <motion.div {...rise(0)} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }} className="dv-hero">
          <Panel accent pad="26px 28px">
            <Eyebrow>{isAdmin ? 'Lucro final acumulado' : 'Seu resultado no mês'}</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <Valor v={isAdmin ? 128940 : 4820} size={42} color={NX.mint} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                  <Delta pct={12} />
                  <span style={{ fontSize: 11.5, color: NX.t3 }}>vs. mês anterior</span>
                </div>
              </div>
              <div style={{ paddingBottom: 4 }}><Spark data={SPARK} w={190} h={52} /></div>
            </div>
            <Sub>{isAdmin ? '20 metas fechadas · lucro médio de R$ 6.447 por meta' : '132 contas processadas · 3 metas concluídas'}</Sub>
          </Panel>

          <Panel pad="26px 28px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Eyebrow>Meta do dia</Eyebrow>
              <span style={{ fontFamily: NX.mono, fontSize: 12, fontWeight: 800, color: pctDia >= 100 ? NX.mint : NX.redSoft }}>{pctDia}%</span>
            </div>
            <Valor v={metaDia.feito} size={30} />
            <p style={{ fontSize: 12, color: NX.t3, margin: '6px 0 14px' }}>de {brl(metaDia.alvo)}</p>
            <Bar pct={pctDia} color={pctDia >= 100 ? NX.mint : NX.red} height={10} />
            <Sub>Faltam <strong style={{ color: NX.t2 }}>{brl(metaDia.alvo - metaDia.feito)}</strong> pra bater hoje · sequência de 4 dias</Sub>
          </Panel>
        </motion.div>

        {/* ══ NÍVEL 2 — ritmo ══ */}
        <motion.div {...rise(1)} style={{ marginBottom: 16 }}>
          <Strip items={isAdmin ? [
            { l: 'Hoje', v: <Valor v={3420} size={18} />, hint: 'ontem R$ 2.980' },
            { l: 'Depositado', v: <Valor v={57581} size={18} />, hint: 'no mês' },
            { l: 'Sacado', v: <Valor v={51330} size={18} />, hint: 'no mês' },
            { l: 'Custos', v: <Valor v={2114} size={18} color={NX.loss} />, hint: 'proxy + SMS' },
            { l: 'Metas ativas', v: <Num v={4} size={18} />, hint: '1 pronta pra fechar' },
            { l: 'Equipe', v: <Num v={12} size={18} />, hint: '12 de 14 online' },
          ] : [
            { l: 'Hoje', v: <Valor v={840} size={18} />, hint: 'ontem R$ 610' },
            { l: 'Contas processadas', v: <Num v={132} size={18} />, hint: 'no mês' },
            { l: 'Metas ativas', v: <Num v={2} size={18} />, hint: 'WE e W1' },
            { l: 'Sua posição', v: <Num v={1} size={18} suffix="º" color={NX.redSoft} />, hint: 'entre 4 operadores' },
          ]} />
        </motion.div>

        {/* ══ NÍVEL 3 — metas + ranking ══ */}
        <div className="dv-grid" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.4fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
          <motion.div {...rise(2)}>
            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Eyebrow>Metas em andamento</Eyebrow>
                <Pill tone="mint">1 pronta pra fechar</Pill>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {METAS.map((m, i) => {
                  const pct = Math.round((m.feito / m.alvo) * 100)
                  const pronta = pct >= 90
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                          <span style={{ fontFamily: NX.mono, fontSize: 12.5, fontWeight: 800, color: NX.t1 }}>{m.rede}</span>
                          {m.alerta && <Pill tone="loss">parada há {m.dias}d</Pill>}
                          {pronta && <Pill tone="mint">fechar</Pill>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
                          <span style={{ fontFamily: NX.mono, fontSize: 11, color: NX.t3 }}>{m.feito}/{m.alvo}</span>
                          <span style={{ fontFamily: NX.mono, fontSize: 13, fontWeight: 800, color: m.lucro >= 0 ? NX.mint : NX.loss }}>{m.lucro >= 0 ? '+' : ''}{brl(m.lucro)}</span>
                        </div>
                      </div>
                      <Bar pct={pct} color={pronta ? NX.mint : m.alerta ? NX.loss : NX.red} height={7} />
                    </div>
                  )
                })}
              </div>
            </Panel>
          </motion.div>

          {isAdmin && (
            <motion.div {...rise(3)}>
              <Panel>
                <Eyebrow>Ranking de operadores</Eyebrow>
                <div>
                  {OPERADORES.map((o, i) => (
                    <Row key={o.n} pos={i + 1} avatar={o.n[0]} left={o.n}
                      sub={`${o.contas} contas${o.on ? ' · online' : ''}`}
                      last={i === OPERADORES.length - 1}
                      right={<span style={{ fontFamily: NX.mono, fontSize: 13, fontWeight: 800, color: o.v >= 0 ? NX.mint : NX.loss }}>{o.v >= 0 ? '+' : ''}{brl(o.v)}</span>} />
                  ))}
                </div>
              </Panel>
            </motion.div>
          )}
        </div>

        {/* ══ NÍVEL 4 — IA + atividade ══ */}
        <div className="dv-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <motion.div {...rise(4)}>
            <Panel>
              <Eyebrow color={NX.redSoft}>Insights da operação</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {INSIGHTS.map((it, i) => {
                  const c = it.tone === 'mint' ? NX.mint : it.tone === 'loss' ? NX.loss : NX.red
                  return (
                    <div key={i} style={{ display: 'flex', gap: 11, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: `1px solid ${NX.line}`, borderLeft: `2px solid ${c}` }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 800, color: NX.t1, margin: '0 0 3px' }}>{it.t}</p>
                        <p style={{ fontSize: 11.5, color: NX.t3, margin: 0, lineHeight: 1.5 }}>{it.d}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          </motion.div>

          <motion.div {...rise(5)}>
            <Panel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Eyebrow>Atividade ao vivo</Eyebrow>
                <div style={{ marginTop: -10 }}><LiveDot /></div>
              </div>
              <div>
                {FEED.map((f, i) => (
                  <Row key={i} avatar={f.q[0]} left={<><strong style={{ fontWeight: 800 }}>{f.q}</strong> <span style={{ color: NX.t2, fontWeight: 500 }}>{f.o}</span></>}
                    sub={f.t} last={i === FEED.length - 1}
                    right={f.v != null ? <span style={{ fontFamily: NX.mono, fontSize: 12.5, fontWeight: 800, color: NX.mint }}>+{brl(f.v)}</span> : <span style={{ fontSize: 11, color: NX.t4 }}>—</span>} />
                ))}
              </div>
            </Panel>
          </motion.div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: NX.t4, marginTop: 36 }}>
          Prévia isolada · dados fictícios · nada aqui lê ou grava no banco
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dv-hero, .dv-grid { grid-template-columns: 1fr !important; }
          .nx-strip { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  )
}
