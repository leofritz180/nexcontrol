'use client'
// PERFORMANCE — visual 2.0 (operador vê o próprio desempenho, sem financeiro do admin).
import { ModuleHeader, Hero, Lista, int } from '../ui/bento'

export default function PerformanceBento({ nome, resumo = {}, metasRecentes = [], onAbrirMeta }) {
  const r = resumo
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader titulo="Performance" sub={nome ? `Desempenho de ${nome}` : 'Seu desempenho'} />

      <Hero
        rotulo="Depositantes processados"
        valor={int(r.depositantes)}
        cor="var(--t1)"
        nota={`${int(r.metasFechadas)} metas fechadas · ${int(r.remessas)} remessas`}
        blob={['var(--profit-dim)', 'var(--profit-border)']}
        extras={[{ l: 'Taxa de acerto', v: `${int(r.taxa)}%`, c: Number(r.taxa) >= 50 ? 'var(--profit)' : 'var(--t1)' }]}
      />

      {/* A tira que existia aqui repetia os QUATRO numeros do heroi logo acima
          — depositantes no numerao, metas e remessas na legenda, taxa no chip.
          Dado repetido nao e reforco, e ruido: o olho le duas vezes pra
          descobrir que e a mesma coisa. */}

      <Lista
        titulo="Últimas metas"
        vazio="Nenhuma meta fechada ainda."
        linhas={(metasRecentes || []).slice(0, 12).map(m => ({
          k: m.id,
          avatar: String(m.rede || '—').slice(0, 3).toUpperCase(),
          t: m.titulo || m.rede || 'Meta',
          s: `${m.date || ''} · ${int(m.remCount)} remessas`,
          v: int(m.quantidade_contas || 0) + ' contas',
          vc: 'var(--t2)',
          onClick: onAbrirMeta ? () => onAbrirMeta(m.id) : undefined,
        }))}
      />
      <style>{`@media (max-width:900px){ .bk-tira{grid-template-columns:repeat(2,1fr)!important} }`}</style>
    </div>
  )
}
