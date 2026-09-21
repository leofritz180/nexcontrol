'use client'
// OPERADORES — visual 2.0. Apresentação; dados/handlers vêm do /operadores.
import { ModuleHeader, AcaoBtn, Hero, Tira, Lista, BCard, money0, int, RED } from '../ui/bento'

export default function OperadoresBento({ ranking = [], ativos = 0, convidar, onAbrir }) {
  const lucroTime = ranking.reduce((a, o) => a + Number(o.lucroFinal || 0), 0)
  const deps = ranking.reduce((a, o) => a + Number(o.totalDepositantes || o.totalDeposit || 0), 0)
  const metasF = ranking.reduce((a, o) => a + Number(o.closedCount || 0), 0)
  const winAvg = ranking.length ? Math.round(ranking.reduce((a, o) => a + Number(o.winRate || 0), 0) / ranking.length) : 0
  const top = ranking[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Operadores"
        sub={`${int(ativos)} na equipe · ${int(ranking.length)} com metas fechadas`}
        acao={convidar ? <AcaoBtn onClick={convidar} icon={<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M19 8v6M22 11h-6" />}>Convidar</AcaoBtn> : null}
      />

      <Hero
        rotulo="Lucro gerado pela equipe"
        valor={money0(lucroTime)}
        cor={lucroTime >= 0 ? 'var(--profit)' : 'var(--loss)'}
        nota={top ? `Destaque: ${top.nome || top.email} com ${money0(top.lucroFinal)}` : 'Sem metas fechadas ainda'}
        blob={['var(--profit-dim)', 'var(--profit-border)']}
        extras={[
          { l: 'Metas fechadas', v: int(metasF) },
          { l: 'Acerto médio', v: `${winAvg}%`, c: winAvg >= 50 ? 'var(--profit)' : 'var(--t1)' },
        ]}
      />

      <Tira itens={[
        { l: 'Na equipe', v: int(ativos) },
        { l: 'Produtivos', v: int(ranking.length), hint: 'com meta fechada' },
        { l: 'Metas fechadas', v: int(metasF) },
        { l: 'Depositantes', v: int(deps) },
        { l: 'Acerto médio', v: `${winAvg}%`, c: winAvg >= 50 ? 'var(--profit)' : 'var(--t1)' },
      ]} />

      <Lista
        titulo="Ranking da equipe"
        vazio="Nenhum operador com meta fechada ainda."
        linhas={ranking.slice(0, 15).map((o, i) => ({
          k: o.id || i,
          avatar: String(o.nome || o.email || '?')[0].toUpperCase(),
          avatarBg: i === 0 ? RED : 'var(--fill-2)',
          avatarFg: i === 0 ? '#fff' : 'var(--t2)',
          t: `${i + 1}º  ${o.nome || o.email}`,
          s: `${int(o.closedCount)} metas · ${int(o.winRate)}% acerto${o.activeMetas ? ` · ${o.activeMetas} ativa(s)` : ''}`,
          v: money0(o.lucroFinal),
          vc: Number(o.lucroFinal) >= 0 ? 'var(--profit)' : 'var(--loss)',
          onClick: onAbrir ? () => onAbrir(o) : undefined,
        }))}
      />
      <style>{`@media (max-width:900px){ .bk-tira{grid-template-columns:repeat(2,1fr)!important} }`}</style>
    </div>
  )
}
