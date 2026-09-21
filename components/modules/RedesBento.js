'use client'
// REDES — visual 2.0.
import { ModuleHeader, Hero, Tira, Barras, Lista, money0, int, RED } from '../ui/bento'

export default function RedesBento({ kpis, redesData = [], onAbrir }) {
  const k = kpis || {}
  const ord = [...redesData].sort((a, b) => Number(b.lucroFinal || 0) - Number(a.lucroFinal || 0))
  const melhor = ord[0]
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

      <div className="bk-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <Barras
          titulo="Lucro por rede"
          dados={ord.slice(0, 8).map(r => ({
            l: r.nome, v: Math.abs(Number(r.lucroFinal || 0)), txt: money0(r.lucroFinal),
            dot: Number(r.lucroFinal) >= 0 ? undefined : 'var(--loss)',
          }))}
        />
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
      <style>{`@media (max-width:1000px){ .bk-2{grid-template-columns:1fr!important} .bk-tira{grid-template-columns:repeat(2,1fr)!important} }`}</style>
    </div>
  )
}
