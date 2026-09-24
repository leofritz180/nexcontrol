'use client'
// OPERADORES — visual 2.0. Apresentação; dados/handlers vêm do /operadores.
import { ModuleHeader, AcaoBtn, Hero, Tira, Lista, BCard, money0, int, RED } from '../ui/bento'

export default function OperadoresBento({ ranking = [], ativos = 0, convidar, onAbrir, aoVivo = [] }) {
  const vivos = new Set(aoVivo.map(t => t.userId))
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

      {/* Quem está transmitindo a tela agora → Sala ao vivo */}
      {aoVivo.length > 0 && (
        <a href="/sala" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 20, background: 'var(--surface)', border: '1px solid rgba(229,57,31,0.35)', boxShadow: '0 8px 26px rgba(229,57,31,0.12)', textDecoration: 'none' }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: RED, boxShadow: '0 0 0 4px rgba(229,57,31,0.18)', flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, color: 'var(--t1)' }}>
            {aoVivo.length === 1 ? `${aoVivo[0].nome} está transmitindo a tela` : `${aoVivo.length} operadores transmitindo a tela`}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: RED, flexShrink: 0 }}>Abrir sala →</span>
        </a>
      )}

      {/* "Metas fechadas" e "Acerto médio" saíram: os dois já estão nos chips
          do herói, logo acima. Com cinco itens ainda sobrava uma célula vazia
          na grade de duas colunas do celular. */}
      <Tira itens={[
        { l: 'Na equipe', v: int(ativos) },
        { l: 'Produtivos', v: int(ranking.length), hint: 'com meta fechada' },
        { l: 'Depositantes', v: int(deps) },
      ]} />

      <Lista
        titulo="Ranking da equipe"
        vazio="Nenhum operador com meta fechada ainda."
        linhas={ranking.slice(0, 15).map((o, i) => ({
          k: o.id || i,
          avatar: String(o.nome || o.email || '?')[0].toUpperCase(),
          avatarBg: i === 0 ? RED : 'var(--fill-2)',
          avatarFg: i === 0 ? '#fff' : 'var(--t2)',
          t: `${i + 1}º  ${o.nome || o.email}${vivos.has(o.id) ? '  ● AO VIVO' : ''}`,
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
