'use client'
// CUSTOS — visual 2.0. Apresentação apenas; recebe dados/handlers do /custos.
import { ModuleHeader, AcaoBtn, Hero, Barras, Lista, money0 } from '../ui/bento'

// A data vem do banco como 'YYYY-MM-DD' e estava indo crua pra tela
// ("2026-06-10"). Formato de banco não é formato de gente.
function dataBR(iso) {
  const p = String(iso || '').slice(0, 10).split('-')
  return p.length === 3 && p[0].length === 4 ? p[2] + '/' + p[1] + '/' + p[0] : (iso || '')
}

export default function CustosBento({ kpis, chartData, custos = [], typeMap = {}, onNovo, onRemover }) {
  const k = kpis || {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Custos"
        // O heroi fala do MES CORRENTE; a lista e o grafico mostram TUDO. Sem
        // dizer isso, "Custo do mes R$ 0" ao lado de um detalhamento de
        // R$ 4.330 parecia erro de conta.
        sub={`${custos.length} lançamento${custos.length === 1 ? '' : 's'} no total · ${money0(k.mediaDia)} por dia neste mês`}
        acao={<AcaoBtn onClick={onNovo} icon={<path d="M12 5v14M5 12h14" />}>Novo custo</AcaoBtn>}
      />

      <Hero
        rotulo="Custo do mês"
        valor={money0(k.custoMes)}
        cor="var(--loss)"
        nota={k.pctLucro != null ? `${Math.round(k.pctLucro)}% do lucro de hoje foi para custos` : 'Sem lucro registrado hoje para comparar'}
        blob={['var(--loss-dim)', 'var(--loss-border)']}
        extras={[
          { l: 'Custo hoje', v: money0(k.custoHoje), c: 'var(--loss)' },
          { l: 'Lucro hoje', v: money0(k.lucroHoje), c: 'var(--profit)' },
          { l: 'Líquido hoje', v: money0(k.lucroLiquido), c: Number(k.lucroLiquido) >= 0 ? 'var(--profit)' : 'var(--loss)' },
        ]}
      />

      {/* A tira que existia aqui repetia CINCO valores: custo hoje e líquido
          hoje já estavam nos chips do herói, custo no mês É o numerão, e a
          média por dia foi pro subtítulo. Sobrava só o lucro de hoje — que
          agora é o terceiro chip. */}

      {/* alignItems start: sem isso o card das barras estica pra igualar a
          altura da lista de lançamentos e sobra meio metro de branco */}
      <div className="bk-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, alignItems: 'start' }}>
        <Barras
          titulo="Para onde vai o dinheiro"
          sub="somando todos os lançamentos, não só os deste mês"
          // sem `dot`: as barras usam a rampa da marca, igual ao /redes. As
          // cores por tipo vinham do tema escuro antigo — Proxy saía como uma
          // barra PRETA e SMS como uma bolinha verde de lucro, dentro de um
          // card que fala de despesa.
          dados={(chartData || []).map(d => ({ l: d.ct?.label || d.type, v: d.total, txt: money0(d.total) }))}
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
              s: `${dataBR(c.date)}${c.note ? ' · ' + c.note : ''}`,
              v: money0(c.amount), vc: 'var(--loss)',
              acao: onRemover ? (
                <button type="button" title="Excluir custo" onClick={(e) => { e.stopPropagation(); onRemover(c.id) }}
                  style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--b1)', background: 'var(--surface)', color: 'var(--t3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', transition: 'all .16s ease' }}
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
