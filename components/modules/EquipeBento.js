'use client'
// ─────────────────────────────────────────────────────────────────────────
// EQUIPE — visual 2.0 do painel do OPERADOR LÍDER (hoje só a DS MENTORIA).
//
// É a tela em que o líder responde três perguntas, nesta ordem:
//   1. quanto a equipe deixou no bolso (lucro bruto − custos)
//   2. quem está trazendo depositante e quem está parado
//   3. o que está travado esperando ele fechar
// Por isso o herói é o LÍQUIDO, a tira repete os seis KPIs antigos e as
// metas finalizadas ganham um atalho que troca o filtro sozinho: antes o
// líder via "3 aguardando fechamento" e tinha que caçar a aba certa.
//
// Apresentação apenas: nenhum bloco daqui busca, grava ou recalcula nada —
// todos os números chegam prontos de app/equipe/page.js.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ModuleHeader, AcaoBtn, Hero, Tira, Barras, Lista, BCard, Rosca, Destaque, Vazio,
  FATIAS, Ico, MONO, RED, money, money0, int,
} from '../ui/bento'
import { Folha } from '../ui/folha'
import { Campo, CampoMoeda, Selecao, Linha } from '../ui/campo'
import RankBadge from '../rank/RankBadge'

const I_MAIS = <path d="M12 5v14M5 12h14" />
const I_SETA = <polyline points="9 18 15 12 9 6" />
const I_LIXO = <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>

const nomeDe = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const inicialDe = p => nomeDe(p).charAt(0).toUpperCase()

// Mesma classificação do bloco antigo, só que na paleta do V2: o "finalizada"
// usava amarelo, que não existe mais no tema claro.
function statusV2(m) {
  if (m.status_fechamento === 'fechada') return { l: 'Fechada', c: 'var(--profit)', bg: 'var(--profit-dim)', bd: 'var(--profit-border)' }
  if (m.status === 'finalizada') return { l: 'Finalizada — fechar', c: RED, bg: 'rgba(229,57,31,0.10)', bd: 'rgba(229,57,31,0.26)' }
  return { l: 'Ativa', c: 'var(--t2)', bg: 'var(--fill-1)', bd: 'var(--b1)' }
}

function Chip({ children, cor, fundo, borda }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', flexShrink: 0,
      padding: '3px 9px', borderRadius: 999, fontSize: 9.5, fontWeight: 800,
      letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      color: cor, background: fundo, border: `1px solid ${borda}`,
    }}>{children}</span>
  )
}

// Botão secundário (contorno) — o AcaoBtn vermelho é só da ação principal
// da tela, senão a página inteira vira um semáforo.
function BtnSec({ children, onClick, icone, titulo }) {
  return (
    <motion.button type="button" onClick={onClick} title={titulo}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999,
        border: '1px solid var(--b2)', background: 'var(--fill-1)', color: 'var(--t1)',
        fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
      }}>
      {icone && <Ico d={icone} s={14} />}{children}
    </motion.button>
  )
}

export default function EquipeBento({
  equipe = '',
  operadores = [],
  ranking = [],
  metasAbertas = [],
  metasAtivas = [],
  metasFinalizadas = [],
  metasFechadas = [],
  metasFiltradas = [],
  statusMeta = 'ativa',
  aoTrocarStatus,
  custos = [],
  custosTotal = 0,
  lucroBruto = 0,
  lucroLiquido = 0,
  depositantes = 0,
  negado = false,
  aoNovaMeta,
  aoNovoCusto,
  aoRemoverCusto,
  aoAbrirMeta,
}) {
  const top = ranking[0]
  const aFechar = metasFinalizadas.length

  // Concentração do lucro: só quem fechou no positivo vira fatia — operador
  // no prejuízo não tem como ocupar pedaço de anel.
  const positivos = ranking.filter(o => Number(o.lucroFinal || 0) > 0)
  const fatias = positivos.slice(0, 4).map((o, i) => ({ l: nomeDe(o), v: Number(o.lucroFinal), c: FATIAS[i] }))
  const resto = positivos.slice(4).reduce((a, o) => a + Number(o.lucroFinal || 0), 0)
  if (resto > 0) fatias.push({ l: 'Outros', v: resto, c: FATIAS[4] })
  const somaFatias = fatias.reduce((a, d) => a + d.v, 0)

  const situacao = [
    { l: 'Ativas', v: metasAtivas.length, c: FATIAS[1] },
    { l: 'A fechar', v: metasFinalizadas.length, c: FATIAS[0] },
    { l: 'Fechadas', v: metasFechadas.length, c: FATIAS[2] },
  ].filter(d => d.v > 0)
  const totalMetas = metasAtivas.length + metasFinalizadas.length + metasFechadas.length

  const trazidos = ranking.filter(o => Number(o.totalDeposit || 0) > 0).slice(0, 8)
  const parados = ranking.filter(o => !o.activeMetas).length

  const vazioFiltro = statusMeta === 'ativa' ? 'Nenhuma meta ativa.' : statusMeta === 'finalizada' ? 'Nenhuma meta finalizada.' : 'Nenhuma meta fechada.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Chip cor={RED} fundo="rgba(229,57,31,0.10)" borda="rgba(229,57,31,0.26)">Painel do líder</Chip>
      </motion.div>

      <ModuleHeader
        titulo={`Equipe ${equipe}`.trim()}
        sub={`Você gerencia ${int(operadores.length)} operador${operadores.length !== 1 ? 'es' : ''} — opere, acompanhe e feche as metas da equipe.`}
        acao={<AcaoBtn onClick={aoNovaMeta} icon={I_MAIS}>Nova meta</AcaoBtn>}
      />

      {negado && (
        <div style={{ padding: '14px 18px', borderRadius: 16, background: 'var(--loss-dim)', border: '1px solid var(--loss-border)', color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>
          Não foi possível carregar a equipe. Atualize a página.
        </div>
      )}

      <Hero
        rotulo="Lucro líquido da equipe"
        valor={money(lucroLiquido)}
        cor={lucroLiquido >= 0 ? 'var(--profit)' : 'var(--loss)'}
        nota={top ? `Destaque: ${nomeDe(top)} com ${money(top.lucroFinal)}` : 'Nenhuma meta fechada ainda'}
        blob={lucroLiquido >= 0 ? ['var(--profit-dim)', 'var(--profit-border)'] : ['var(--loss-dim)', 'var(--loss-border)']}
        extras={[
          { l: 'Lucro bruto', v: money(lucroBruto), c: lucroBruto >= 0 ? 'var(--profit)' : 'var(--loss)' },
          { l: 'Custos', v: money(custosTotal), c: custosTotal > 0 ? 'var(--loss)' : undefined },
        ]}
      />

      <Tira itens={[
        { l: 'Operadores', v: int(operadores.length), hint: parados ? `${int(parados)} sem meta ativa` : 'todos operando' },
        { l: 'Metas abertas', v: int(metasAbertas.length) },
        { l: 'A fechar', v: int(aFechar), c: aFechar > 0 ? RED : undefined },
        { l: 'Depositantes', v: int(depositantes) },
        { l: 'Custos', v: money(custosTotal), c: custosTotal > 0 ? 'var(--loss)' : undefined },
        { l: 'Lucro líquido', v: money(lucroLiquido), c: lucroLiquido >= 0 ? 'var(--profit)' : 'var(--loss)' },
      ]} />

      <div className="eq-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {top ? (
          <Destaque
            rotulo="Destaque da equipe"
            titulo={nomeDe(top)}
            valor={money(top.lucroFinal)}
            avatar={inicialDe(top)}
            nota={`${int(top.totalDeposit)} depositantes · ${int(top.closedCount)} meta${top.closedCount !== 1 ? 's' : ''} fechada${top.closedCount !== 1 ? 's' : ''} · ${Math.round(top.winRate || 0)}% de acerto`}
          />
        ) : (
          <BCard pad={24} delay={0.14}>
            <Vazio
              titulo="Nenhum operador nesta equipe ainda."
              texto="Assim que um operador entrar na equipe, o destaque aparece aqui."
              icone={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></>}
            />
          </BCard>
        )}

        <BCard pad={24} delay={0.18}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Situação das metas</p>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 20px' }}>o que está rodando e o que espera você</p>
          <Rosca dados={situacao} centro={int(totalMetas)} rotulo="metas" formata={int} delay={0.24} />
        </BCard>
      </div>

      <div className="eq-2b" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <Barras
          titulo="Depositantes por operador"
          dados={trazidos.map(o => ({ l: nomeDe(o), v: Number(o.totalDeposit || 0), txt: int(o.totalDeposit) }))}
        />
        <BCard pad={24} delay={0.2}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Concentração do lucro</p>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 20px' }}>quanto cada operador representa do que entrou</p>
          {/* aqui o valor é arredondado de propósito: "R$ 12.345,67" não cabe
              no miolo do anel. O número exato está na lista logo abaixo. */}
          <Rosca dados={fatias} centro={money0(somaFatias)} rotulo="de lucro" formata={money0} delay={0.26} />
        </BCard>
      </div>

      <Lista
        titulo="Operadores da equipe"
        vazio="Nenhum operador nesta equipe ainda."
        delay={0.24}
        linhas={ranking.map((op, i) => {
          const lucro = Number(op.lucroFinal || 0)
          const positivo = lucro >= 0
          return {
            k: op.id || i,
            avatar: inicialDe(op),
            avatarBg: i === 0 ? RED : positivo ? 'var(--profit-dim)' : 'var(--loss-dim)',
            avatarFg: i === 0 ? '#fff' : positivo ? 'var(--profit)' : 'var(--loss)',
            t: `${i + 1}º  ${nomeDe(op)}`,
            s: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {op.is_team_leader && <Chip cor={RED} fundo="rgba(229,57,31,0.10)" borda="rgba(229,57,31,0.26)">Líder</Chip>}
                <RankBadge contas={op.totalDeposit} size="xs" />
                <span>
                  {int(op.totalDeposit)} deps · {int(op.closedCount)} meta{op.closedCount !== 1 ? 's' : ''} fechada{op.closedCount !== 1 ? 's' : ''} · {int(op.activeMetas)} ativa{op.activeMetas !== 1 ? 's' : ''}
                </span>
              </span>
            ),
            v: money(lucro),
            vc: positivo ? 'var(--profit)' : 'var(--loss)',
            acao: (
              <span style={{ fontSize: 10.5, color: 'var(--t4)', fontFamily: MONO, fontWeight: 700, minWidth: 66, textAlign: 'right' }}>
                {Math.round(op.winRate || 0)}% acerto
              </span>
            ),
          }
        })}
      />

      <Lista
        titulo="Metas da equipe"
        vazio={vazioFiltro}
        delay={0.28}
        acao={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {aFechar > 0 && (
              // atalho: o aviso agora LEVA pro filtro de finalizadas
              <motion.button type="button" onClick={() => aoTrocarStatus && aoTrocarStatus('finalizada')}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999,
                  border: '1px solid rgba(229,57,31,0.26)', background: 'rgba(229,57,31,0.10)', color: RED,
                  fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                }}>
                {int(aFechar)} aguardando fechamento
              </motion.button>
            )}
            <div role="group" style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { k: 'ativa', l: 'Ativas', n: metasAtivas.length },
                { k: 'finalizada', l: 'Finalizadas', n: metasFinalizadas.length },
                { k: 'fechada', l: 'Fechadas', n: metasFechadas.length },
              ].map(f => {
                const ativo = statusMeta === f.k
                return (
                  <motion.button key={f.k} type="button" aria-pressed={ativo}
                    onClick={() => aoTrocarStatus && aoTrocarStatus(f.k)}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 999,
                      border: `1px solid ${ativo ? 'transparent' : 'var(--b2)'}`,
                      background: ativo ? '#15151a' : 'var(--fill-1)',
                      color: ativo ? '#fff' : 'var(--t2)',
                      fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', lineHeight: 1,
                    }}>
                    {f.l}
                    <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 900, padding: '2px 6px', borderRadius: 999, background: ativo ? 'rgba(255,255,255,0.16)' : 'var(--fill-2)', color: ativo ? '#fff' : 'var(--t4)' }}>{int(f.n)}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        }
        linhas={metasFiltradas.map(m => {
          const op = operadores.find(o => o.id === m.operator_id)
          const st = statusV2(m)
          const fechada = m.status_fechamento === 'fechada'
          return {
            k: m.id,
            avatar: String(m.rede || '?').slice(0, 3).toUpperCase(),
            t: m.titulo || `${m.quantidade_contas || 0} DEP ${(m.rede || '').toUpperCase()}`,
            s: `${nomeDe(op)} · ${(m.rede || '—').toUpperCase()} · ${int(m.quantidade_contas || 0)} contas`,
            v: fechada ? money(m.lucro_final) : '',
            vc: fechada ? (Number(m.lucro_final || 0) >= 0 ? 'var(--profit)' : 'var(--loss)') : 'var(--t1)',
            onClick: aoAbrirMeta ? () => aoAbrirMeta(m) : undefined,
            acao: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <Chip cor={st.c} fundo={st.bg} borda={st.bd}>{st.l}</Chip>
                <Ico d={I_SETA} s={15} c="var(--t4)" />
              </span>
            ),
          }
        })}
      />

      <Lista
        titulo="Custos da equipe"
        vazio="Nenhum custo lançado."
        delay={0.32}
        acao={<BtnSec onClick={aoNovoCusto} icone={I_MAIS}>Novo custo</BtnSec>}
        linhas={custos.map(c => ({
          k: c.id,
          avatar: String(c.rotulo || c.type || '?').slice(0, 2).toUpperCase(),
          avatarBg: 'var(--loss-dim)',
          avatarFg: 'var(--loss)',
          t: c.rotulo || c.type || 'Custo',
          s: `${c.dataBR || ''}${c.note ? ' · ' + c.note : ''}`,
          v: `− ${money(c.amount)}`,
          vc: 'var(--loss)',
          acao: aoRemoverCusto ? (
            <button type="button" title="Remover" onClick={(e) => { e.stopPropagation(); aoRemoverCusto(c.id) }}
              style={{ width: 30, height: 30, borderRadius: 10, border: '1px solid var(--b1)', background: 'var(--surface)', color: 'var(--t3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', transition: 'all .16s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--loss-dim)'; e.currentTarget.style.color = 'var(--loss)'; e.currentTarget.style.borderColor = 'var(--loss-border)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--b1)' }}>
              <Ico d={I_LIXO} s={14} />
            </button>
          ) : null,
        }))}
      />
      <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '-4px 2px 0' }}>
        Proxy, SMS, postagens — descontados do lucro líquido.
      </p>

      <style>{`
        @media (max-width: 1100px){ .bk-tira{ grid-template-columns:repeat(3,1fr) !important } }
        @media (max-width: 1000px){ .eq-2, .eq-2b{ grid-template-columns:1fr !important } }
        @media (max-width: 700px){ .bk-tira{ grid-template-columns:repeat(2,1fr) !important } }
      `}</style>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// MODAIS DO V2 — mesma Folha dos outros módulos.
// Os dois coletam e validam texto; quem fala com a API continua sendo a
// página (mesma rota, mesmo corpo, mesmo parseVal de antes). `aoEnviar`
// devolve { ok, error, campo } pro erro cair no campo certo e ele tremer.
// ═════════════════════════════════════════════════════════════════════════

function Cabeca({ titulo, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.025em' }}>{titulo}</h3>
      {sub && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '3px 0 0' }}>{sub}</p>}
    </div>
  )
}

function Rodape({ aoFechar, salvando, rotulo, rotuloSalvando }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
      <button type="button" onClick={aoFechar} disabled={salvando}
        style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t2)', fontSize: 13, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
        Cancelar
      </button>
      <motion.button type="submit" disabled={salvando}
        whileHover={salvando ? undefined : { y: -2, boxShadow: '0 16px 36px rgba(229,57,31,0.38)' }}
        whileTap={salvando ? undefined : { scale: 0.97 }}
        style={{ flex: 1.6, padding: '13px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, #ff7a4d, ${RED})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: salvando ? 0.75 : 1, boxShadow: '0 10px 26px rgba(229,57,31,0.3)' }}>
        {salvando ? rotuloSalvando : rotulo}
      </motion.button>
    </div>
  )
}

function Aviso({ texto }) {
  if (!texto) return null
  return (
    <div role="alert" style={{ padding: '10px 13px', marginTop: 16, borderRadius: 12, background: 'var(--loss-dim)', border: '1px solid var(--loss-border)', color: 'var(--loss)', fontSize: 12.5, fontWeight: 600 }}>
      {texto}
    </div>
  )
}

export function NovaMetaFolha({ aberto, aoFechar, aoEnviar, liderId, operadores = [], redes = [] }) {
  const [operatorId, setOperatorId] = useState(liderId)
  const [titulo, setTitulo] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [rede, setRede] = useState('')
  const [contas, setContas] = useState('10')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [campo, setCampo] = useState('')

  // Mesma ordem de cobrança do modal antigo: rede, plataforma, título.
  async function enviar(e) {
    e.preventDefault()
    if (!titulo.trim() || !plataforma.trim() || !rede) {
      if (!rede) { setCampo('rede'); setErro('Selecione a rede') }
      else if (!plataforma.trim()) { setCampo('plataforma'); setErro('Preencha a plataforma') }
      else { setCampo('titulo'); setErro('Preencha o título') }
      return
    }
    setSalvando(true); setErro(''); setCampo('')
    const r = await aoEnviar({
      operator_id: operatorId, titulo, plataforma, rede,
      quantidade_contas: contas, observacoes: obs,
    })
    if (!r || !r.ok) { setErro((r && r.error) || 'Erro ao criar'); setCampo((r && r.campo) || ''); setSalvando(false) }
  }

  const opcoesOperador = [
    { v: liderId, l: 'Eu (líder)' },
    ...operadores.filter(o => o.id !== liderId).map(o => ({ v: o.id, l: nomeDe(o) })),
  ]

  return (
    <Folha aberto={aberto} aoFechar={aoFechar} largura={520}>
      {/* noValidate: o asterisco do `obrigatorio` continua, mas quem barra o
          envio é a validação JS — a MESMA ordem de mensagens do modal antigo,
          e é ela que faz o campo errado tremer. */}
      <form onSubmit={enviar} noValidate style={{ padding: '30px 30px 26px' }}>
        <Cabeca titulo="Nova meta" sub="Crie e opere uma meta da equipe" />
        <div style={{ display: 'grid', gap: 14 }}>
          <Selecao rotulo="Operador" valor={operatorId} aoMudar={setOperatorId} opcoes={opcoesOperador}
            icone={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
          <Campo rotulo="Título" valor={titulo} aoMudar={setTitulo} placeholder="Ex.: Meta OKOK Junho"
            erro={campo === 'titulo' ? erro : ''} obrigatorio />
          <Linha>
            <Campo rotulo="Plataforma" valor={plataforma} aoMudar={setPlataforma} placeholder="Plataforma"
              erro={campo === 'plataforma' ? erro : ''} obrigatorio />
            <Selecao rotulo="Rede" valor={rede} aoMudar={setRede} placeholder="Selecione"
              opcoes={redes.map(r => ({ v: r, l: r }))} erro={campo === 'rede' ? erro : ''} obrigatorio />
          </Linha>
          <Campo rotulo="Quantidade de contas" valor={contas} inputMode="numeric" placeholder="10"
            aoMudar={v => setContas(String(v).replace(/\D/g, ''))} mono />
          <Campo rotulo="Observações (opcional)" valor={obs} aoMudar={setObs} placeholder="Notas" />
        </div>
        <Aviso texto={campo === '' ? erro : ''} />
        <Rodape aoFechar={aoFechar} salvando={salvando} rotulo="Criar e operar" rotuloSalvando="Criando…" />
      </form>
    </Folha>
  )
}

export function NovoCustoFolha({ aberto, aoFechar, aoEnviar, tipos = [] }) {
  const [tipo, setTipo] = useState('proxy')
  const [valor, setValor] = useState('')
  // Mesma data padrão de antes (ISO do dia corrente) — não mexer: é o que
  // a rota /api/team/cost espera.
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [nota, setNota] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [campo, setCampo] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setSalvando(true); setErro(''); setCampo('')
    const r = await aoEnviar({ type: tipo, amount: valor, date: data, note: nota })
    if (!r || !r.ok) { setErro((r && r.error) || 'Erro ao salvar'); setCampo((r && r.campo) || ''); setSalvando(false) }
  }

  return (
    <Folha aberto={aberto} aoFechar={aoFechar} largura={460}>
      <form onSubmit={enviar} noValidate style={{ padding: '30px 30px 26px' }}>
        <Cabeca titulo="Novo custo" sub="Custo da equipe (entra no cálculo do lucro)" />
        <div style={{ display: 'grid', gap: 14 }}>
          <Selecao rotulo="Tipo" valor={tipo} aoMudar={setTipo} opcoes={tipos.map(t => ({ v: t.id, l: t.label }))} />
          <Linha minimo={170}>
            <CampoMoeda rotulo="Valor" valor={valor} aoMudar={setValor} erro={campo === 'valor' ? erro : ''} obrigatorio autoFoco />
            <Campo rotulo="Data" valor={data} aoMudar={setData} tipo="date" />
          </Linha>
          <Campo rotulo="Observação (opcional)" valor={nota} aoMudar={setNota} placeholder="Notas" />
        </div>
        <Aviso texto={campo === '' ? erro : ''} />
        <Rodape aoFechar={aoFechar} salvando={salvando} rotulo="Adicionar custo" rotuloSalvando="Salvando…" />
      </form>
    </Folha>
  )
}
