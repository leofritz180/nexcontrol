'use client'
// FATURAMENTO — visual 2.0. Só apresentação; dados vêm do /faturamento.
import { ModuleHeader, Hero, Tira, Barras, Lista, BCard, money0, int, RED, RED2 } from '../ui/bento'

export default function FaturamentoBento({ stats, chartData = [], operadores = 0, redes = 0, periodo, onPeriodo }) {
  const s = stats || {}
  const pos = Number(s.lucroFinal) >= 0
  const serie = (chartData || []).slice(-12)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Faturamento"
        sub={`${int(s.fechadas)} metas fechadas · ${int(s.total)} remessas no período`}
      />

      <Hero
        rotulo="Lucro final do período"
        valor={money0(s.lucroFinal)}
        cor={pos ? 'var(--profit)' : 'var(--loss)'}
        nota={`Bruto ${money0(s.lucroFinalBruto)} · custos ${money0(s.custosTotal)}`}
        blob={pos ? ['var(--profit-dim)', 'var(--profit-border)'] : ['var(--loss-dim)', 'var(--loss-border)']}
        extras={[
          { l: 'ROI', v: `${Math.round(Number(s.roi) || 0)}%`, c: Number(s.roi) >= 0 ? 'var(--profit)' : 'var(--loss)' },
          { l: 'Taxa de acerto', v: `${int(s.taxa)}%` },
        ]}
      />

      <Tira itens={[
        { l: 'Depositado', v: money0(s.dep) },
        { l: 'Sacado', v: money0(s.saq) },
        { l: 'Resultado', v: money0(s.liq), c: Number(s.liq) >= 0 ? 'var(--profit)' : 'var(--loss)' },
        { l: 'Custos', v: money0(s.custosTotal), c: 'var(--loss)' },
        { l: 'Operadores', v: int(operadores) },
        { l: 'Redes', v: int(redes) },
      ]} />

      <div className="bk-2" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 14 }}>
        <Barras
          titulo="Evolução do faturamento"
          dados={serie.map(d => ({
            l: d.label || d.key || '—',
            v: Math.abs(Number(d.value ?? d.liq ?? d.total ?? 0)),
            txt: money0(d.value ?? d.liq ?? d.total ?? 0),
            dot: Number(d.value ?? d.liq ?? d.total ?? 0) >= 0 ? undefined : 'var(--loss)',
          }))}
        />
        <BCard pad={24} delay={0.22}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Resumo do período</p>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px' }}>como o resultado se formou</p>
          {[
            { l: 'Lucro bruto', v: s.lucro, c: 'var(--profit)' },
            { l: 'Prejuízo', v: -Math.abs(Number(s.prej) || 0), c: 'var(--loss)' },
            { l: 'Custos', v: -Math.abs(Number(s.custosTotal) || 0), c: 'var(--loss)' },
          ].map((r, i) => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < 2 ? '1px solid var(--b1)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>{r.l}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13.5, fontWeight: 800, color: r.c }}>{money0(r.v)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '2px solid var(--b1)' }}>
            <span style={{ fontSize: 13.5, color: 'var(--t1)', fontWeight: 800 }}>Lucro final</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 900, color: pos ? 'var(--profit)' : 'var(--loss)' }}>{money0(s.lucroFinal)}</span>
          </div>
        </BCard>
      </div>

      <style>{`@media (max-width:1000px){ .bk-2{grid-template-columns:1fr !important} .bk-tira{grid-template-columns:repeat(3,1fr) !important} }
               @media (max-width:640px){ .bk-tira{grid-template-columns:repeat(2,1fr) !important} }`}</style>
    </div>
  )
}
