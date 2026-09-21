'use client'
// CUSTOS — visual 2.0. Apresentação apenas; recebe dados/handlers do /custos.
import { ModuleHeader, AcaoBtn, Hero, Tira, Barras, Lista, BCard, money0, money, RED, RED2 } from '../ui/bento'

export default function CustosBento({ kpis, chartData, custos = [], typeMap = {}, onNovo, onRemover }) {
  const k = kpis || {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Custos"
        sub={`${custos.length} lançamento${custos.length === 1 ? '' : 's'} · média de ${money0(k.mediaDia)} por dia`}
        acao={<AcaoBtn onClick={onNovo} icon={<path d="M12 5v14M5 12h14" />}>Novo custo</AcaoBtn>}
      />

      <Hero
        rotulo="Custo do mês"
        valor={money0(k.custoMes)}
        cor="var(--loss)"
        nota={k.pctLucro != null ? `${Math.round(k.pctLucro)}% do lucro de hoje foi para custos` : 'Sem lucro registrado hoje para comparar'}
        blob={['var(--loss-dim)', 'var(--loss-border)']}
        extras={[
          { l: 'Hoje', v: money0(k.custoHoje), c: 'var(--loss)' },
          { l: 'Líquido hoje', v: money0(k.lucroLiquido), c: Number(k.lucroLiquido) >= 0 ? 'var(--profit)' : 'var(--loss)' },
        ]}
      />

      <Tira itens={[
        { l: 'Custo hoje', v: money0(k.custoHoje), c: 'var(--loss)' },
        { l: 'Custo no mês', v: money0(k.custoMes), c: 'var(--loss)' },
        { l: 'Média por dia', v: money0(k.mediaDia) },
        { l: 'Lucro hoje', v: money0(k.lucroHoje), c: 'var(--profit)' },
        { l: 'Lucro líquido', v: money0(k.lucroLiquido), c: Number(k.lucroLiquido) >= 0 ? 'var(--profit)' : 'var(--loss)' },
      ]} />

      <div className="bk-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <Barras
          titulo="Para onde vai o dinheiro"
          dados={(chartData || []).map(d => ({ l: d.ct?.label || d.type, v: d.total, txt: money0(d.total), dot: d.ct?.color || RED }))}
        />
        <Lista
          titulo={`Lançamentos (${(custos || []).length})`}
          vazio="Nenhum custo lançado ainda."
          linhas={(custos || []).map(c => {
            const t = typeMap[c.type] || {}
            return {
              k: c.id,
              avatar: String(t.label || c.type || '?').slice(0, 2).toUpperCase(),
              avatarBg: 'var(--loss-dim)', avatarFg: 'var(--loss)',
              t: t.label || c.type || 'Custo',
              s: `${c.date || ''}${c.note ? ' · ' + c.note : ''}`,
              v: money0(c.amount), vc: 'var(--loss)',
              acao: onRemover ? (
                <button type="button" title="Excluir custo" onClick={(e) => { e.stopPropagation(); onRemover(c.id) }}
                  style={{ width: 30, height: 30, borderRadius: 10, border: '1px solid var(--b1)', background: 'var(--surface)', color: 'var(--t3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', transition: 'all .16s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--loss-dim)'; e.currentTarget.style.color = 'var(--loss)'; e.currentTarget.style.borderColor = 'var(--loss-border)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--b1)' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                </button>
              ) : null,
            }
          })}
        />
      </div>

      <style>{`@media (max-width: 1000px){ .bk-2{ grid-template-columns:1fr !important } .bk-tira{ grid-template-columns:repeat(2,1fr) !important } }`}</style>
    </div>
  )
}
