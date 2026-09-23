'use client'
// REDES — visual 2.0.
import { ModuleHeader, Hero, Tira, Barras, Lista, BCard, Rosca, FATIAS, money0, int, RED } from '../ui/bento'

export default function RedesBento({ kpis, redesData = [], onAbrir }) {
  const k = kpis || {}
  const ord = [...redesData].sort((a, b) => Number(b.lucroFinal || 0) - Number(a.lucroFinal || 0))
  const melhor = ord[0]
  // Rosca: onde o lucro se concentra. So fatias positivas — uma rede no
  // prejuizo nao tem como virar pedaco de anel.
  const positivas = ord.filter(r => Number(r.lucroFinal || 0) > 0)
  const fatias = positivas.slice(0, 4).map((r, i) => ({ l: r.nome, v: Number(r.lucroFinal), c: FATIAS[i] }))
  const resto = positivas.slice(4).reduce((a, r) => a + Number(r.lucroFinal || 0), 0)
  if (resto > 0) fatias.push({ l: 'Outras', v: resto, c: FATIAS[4] })
  const somaFatias = fatias.reduce((a, d) => a + d.v, 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader titulo="Redes" sub={`${int(k.totalRedes)} redes operadas · ${int(k.redesLucrativas)} no lucro`} />

      <Hero
        rotulo="Lucro por rede (total)"
        valor={money0(k.lucroTotal)}
        cor={Number(k.lucroTotal) >= 0 ? 'var(--profit)' : 'var(--loss)'}
        nota={melhor ? `Melhor rede: ${melhor.nome} com ${money0(melhor.lucroFinal)}` : 'Sem dados'}
        blob={[ 'rgba(229,57,31,0.16)', 'rgba(229,57,31,0.35)' ]}
        extras={[{ l: 'Custos', v: money0(k.custosTotal), c: 'var(--loss)' }]}
      />

      <Tira itens={[
        { l: 'Redes', v: int(k.totalRedes) },
        { l: 'No lucro', v: int(k.redesLucrativas), c: 'var(--profit)' },
        { l: 'Lucro total', v: money0(k.lucroTotal), c: Number(k.lucroTotal) >= 0 ? 'var(--profit)' : 'var(--loss)' },
        { l: 'Custos', v: money0(k.custosTotal), c: 'var(--loss)' },
      ]} />

      <div className="bk-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, alignItems: 'start' }}>
        <BCard pad={24} delay={0.14}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Concentração do lucro</p>
          {/* A rosca soma SO as redes positivas, o hero soma todas. A diferenca
              e o prejuizo das negativas — dois totais na mesma tela sem nada
              explicando parecia erro de conta. */}
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 20px' }}>quanto cada rede que deu lucro representa</p>
          <Rosca dados={fatias} centro={money0(somaFatias)} rotulo="só das positivas" formata={money0} delay={0.2} />
        </BCard>
        <BCard pad={24} delay={0.18}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Redes no lucro</p>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 20px' }}>quantas fecharam no positivo</p>
          <Rosca
            dados={[
              { l: 'No lucro', v: Number(k.redesLucrativas || 0), c: FATIAS[2] },
              { l: 'No prejuízo', v: Math.max(0, Number(k.totalRedes || 0) - Number(k.redesLucrativas || 0)), c: FATIAS[0] },
            ].filter(d => d.v > 0)}
            centro={int(k.totalRedes)} rotulo="redes" formata={int} delay={0.24}
          />
        </BCard>
      </div>

      <div className="bk-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, alignItems: 'start' }}>
        <Barras
          titulo="Lucro por rede"
          dados={ord.slice(0, 8).map(r => ({
            l: r.nome, v: Math.abs(Number(r.lucroFinal || 0)), txt: money0(r.lucroFinal),
            dot: Number(r.lucroFinal) >= 0 ? undefined : 'var(--loss)',
          }))}
        />
        {/* data-tour: o passo "Ranking por rede" aponta pra esta lista. */}
        <div data-tour="redes-ranking">
        <Lista
          titulo="Volume por rede"
          vazio="Nenhuma rede com meta fechada."
          linhas={ord.slice(0, 10).map(r => ({
            k: r.nome,
            avatar: String(r.nome || '?').slice(0, 3).toUpperCase(),
            t: r.nome,
            s: `${int(r.metas?.length || 0)} metas · ${int(r.depositantes)} depositantes`,
            v: money0(r.lucroFinal),
            vc: Number(r.lucroFinal) >= 0 ? 'var(--profit)' : 'var(--loss)',
            onClick: onAbrir ? () => onAbrir(r) : undefined,
          }))}
        />
        </div>
      </div>
      <style>{`@media (max-width:1000px){ .bk-2{grid-template-columns:1fr!important} .bk-tira{grid-template-columns:repeat(2,1fr)!important} }`}</style>
    </div>
  )
}
