'use client'
// PAINEL DO OPERADOR — visual 2.0. Nunca mostra campo financeiro do admin.
import { ModuleHeader, AcaoBtn, Hero, Tira, Lista, BCard, money0, int, RED, RED2 } from '../ui/bento'
import { motion } from 'framer-motion'

export default function OperatorBento({ nome, stats, metas = [], onNovaMeta, onAbrirMeta }) {
  const s = stats || {}
  const ativas = (metas || []).filter(m => !m.deleted_at && m.status_fechamento !== 'fechada')
  const pct = Number(s.taxaConclusao || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo={`Olá, ${nome || 'operador'}`}
        sub={`${int(s.ativas)} meta(s) em andamento · ${int(s.nRem)} remessas registradas`}
        acao={onNovaMeta ? <AcaoBtn onClick={onNovaMeta} icon={<path d="M12 5v14M5 12h14" />}>Nova meta</AcaoBtn> : null}
      />

      <Hero
        rotulo="Contas processadas"
        valor={int(s.totalDepositantes)}
        cor="var(--t1)"
        nota={`${int(s.fechadas)} metas concluídas de ${int(s.total)}`}
        blob={['var(--profit-dim)', 'var(--profit-border)']}
        extras={[{ l: 'Conclusão', v: `${pct}%`, c: pct >= 60 ? 'var(--profit)' : 'var(--t1)' }]}
      />

      <Tira itens={[
        { l: 'Em andamento', v: int(s.ativas) },
        { l: 'Concluídas', v: int(s.fechadas), c: 'var(--profit)' },
        { l: 'Remessas', v: int(s.nRem) },
        { l: 'Contas', v: int(s.totalDepositantes) },
        { l: 'Conclusão', v: `${pct}%`, c: pct >= 60 ? 'var(--profit)' : 'var(--t1)' },
      ]} />

      <Lista
        titulo="Suas metas em andamento"
        vazio="Nenhuma meta aberta. Crie a primeira no botão acima."
        linhas={ativas.slice(0, 12).map(m => {
          const alvo = Number(m.quantidade_contas || 0)
          const dias = m.created_at ? Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000) : 0
          return {
            k: m.id,
            avatar: String(m.rede || '—').slice(0, 3).toUpperCase(),
            avatarBg: 'rgba(229,57,31,0.1)', avatarFg: RED,
            t: m.titulo || m.rede || 'Meta',
            s: `${m.rede || '—'} · ${alvo} contas · há ${dias}d`,
            v: `${alvo}`,
            vc: 'var(--t2)',
            onClick: onAbrirMeta ? () => onAbrirMeta(m.id) : undefined,
          }
        })}
      />
      <style>{`@media (max-width:900px){ .bk-tira{grid-template-columns:repeat(2,1fr)!important} }`}</style>
    </div>
  )
}
