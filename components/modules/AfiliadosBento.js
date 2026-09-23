'use client'
// ─────────────────────────────────────────────────────────────────────────
// AFILIADOS — visual 2.0 (bento claro). SÓ APRESENTAÇÃO.
//
// Este arquivo não busca nem grava nada: recebe os dados já prontos do
// /afiliados por props e devolve os eventos por callback. A única coisa que
// ele faz "sozinho" é copiar texto pra área de transferência — isso é API do
// navegador, não dado, e o feedback ("Copiado") é puramente visual.
//
// Nenhum cálculo de dinheiro foi reescrito: comissão, pendente e pago vêm
// prontos da /api/affiliate/stats, exatamente como na tela antiga. O único
// cálculo daqui é o SIMULADOR (ticket 59,90 × taxa), que é hipotético e está
// copiado do bloco CalculatorMega da tela antiga, sem mudar a fórmula.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ModuleHeader, AcaoBtn, BCard, Tira, Lista, Rosca, Vazio,
  Tilt, Ico, MONO, money, money0, int, RED, RED2,
} from '../ui/bento'
import { Campo, Selecao } from '../ui/campo'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const TICKET = 59.90 // mesmo ticket médio do CalculatorMega antigo

/* ── ícones (paths soltos, no formato que o <Ico> do bento espera) ── */
const I_COPIAR = <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
const I_CHECK = <polyline points="20 6 9 17 4 12" />
const I_SHARE = <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>
const I_LINK = <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>
const I_OLHO = <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
const I_OLHO_OFF = <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
const I_CADEADO = <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
const I_INSTAGRAM = <><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>
const I_WHATS = <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
const I_DM = <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
const I_EMAIL = <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>
const I_TROFEU = <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /></>
const I_PESSOAS = <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>
const I_AJUDA = <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>

/* ── botão secundário (branco, borda fina) — todo botão daqui é type="button" ── */
function BotaoSec({ children, onClick, icone, cor, largura, desabilitado }) {
  return (
    <motion.button
      type="button" onClick={onClick} disabled={desabilitado}
      whileHover={desabilitado ? undefined : { y: -2, boxShadow: '0 10px 24px rgba(0,0,0,0.08)' }}
      whileTap={desabilitado ? undefined : { scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '11px 18px', borderRadius: 30, width: largura || 'auto',
        border: '1px solid var(--b2)', background: 'var(--surface)',
        color: cor || 'var(--t1)', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
        cursor: desabilitado ? 'not-allowed' : 'pointer', opacity: desabilitado ? 0.5 : 1,
      }}>
      {icone && <Ico d={icone} s={15} />}{children}
    </motion.button>
  )
}

/* ── pílula de status do indicado ── */
function PilulaStatus({ status }) {
  const mapa = {
    active: { l: 'PRO', c: 'var(--profit)', bg: 'var(--profit-dim)', b: 'var(--profit-border)' },
    trial: { l: 'TRIAL', c: 'var(--t2)', bg: 'var(--fill-1)', b: 'var(--b1)' },
    expired: { l: 'VENCIDA', c: 'var(--loss)', bg: 'var(--loss-dim)', b: 'var(--loss-border)' },
  }
  const cfg = mapa[status] || { l: String(status || '—').toUpperCase(), c: 'var(--t3)', bg: 'var(--fill-1)', b: 'var(--b1)' }
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
      padding: '4px 8px', borderRadius: 7, background: cfg.bg, color: cfg.c, border: `1px solid ${cfg.b}`,
    }}>{cfg.l}</span>
  )
}

/* ── título de bloco, no tamanho do kit ── */
function TituloBloco({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{children}</p>
      {sub && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '4px 0 0', lineHeight: 1.5 }}>{sub}</p>}
    </div>
  )
}

/* ── cartão de contato (mesmos links da tela antiga) ── */
function Contato({ href, rotulo, valor, icone, cor }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, padding: '11px 15px', borderRadius: 14,
        background: 'var(--fill-1)', border: '1px solid var(--b1)', textDecoration: 'none', color: 'var(--t1)',
      }}>
      <span style={{ color: cor || 'var(--t2)', display: 'inline-flex' }}><Ico d={icone} s={16} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--t4)', letterSpacing: '0.12em' }}>{rotulo}</span>
        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{valor}</span>
      </span>
    </a>
  )
}

export default function AfiliadosBento({
  habilitado = false,
  link = '',
  codigo = '',
  taxa = 0.30,
  totais = {},
  indicados = [],
  nome,
  pixChave = '',
  pixTipo = 'email',
  pixSalvando = false,
  pixSalvo = false,
  onSalvarPix,
}) {
  // ── TODO hook fica aqui em cima, antes de qualquer return condicional.
  //    (React #300 já derrubou a produção uma vez por causa disso.)
  const [copiado, setCopiado] = useState('')      // qual botão mostrou "Copiado"
  const [revelado, setRevelado] = useState(false) // código de saque à mostra
  const [aba, setAba] = useState('whatsapp')      // canal do kit de divulgação
  const [faq, setFaq] = useState(0)               // pergunta aberta (-1 = nenhuma)
  const [sim, setSim] = useState(15)              // simulador: nº de indicados
  const [chave, setChave] = useState(pixChave || '')
  const [tipo, setTipo] = useState(pixTipo || 'email')
  const [erroPix, setErroPix] = useState('')

  // Quando o /afiliados recarrega os dados (polling de 20s ou após salvar),
  // o formulário volta a espelhar o que está gravado no banco.
  useEffect(() => { setChave(pixChave || '') }, [pixChave])
  useEffect(() => { setTipo(pixTipo || 'email') }, [pixTipo])

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(''), 1800)
    return () => clearTimeout(t)
  }, [copiado])

  async function copiar(qual, texto) {
    if (!texto) return
    try { await navigator.clipboard.writeText(texto); setCopiado(qual) } catch {}
  }

  async function compartilhar() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'NexControl', text: 'Sistema profissional pra gerenciar sua operação de CPA', url: link })
      } catch {}
    } else copiar('link', link)
  }

  function salvarPix() {
    if (!chave.trim()) { setErroPix('Digite a chave antes de salvar.'); return }
    setErroPix('')
    if (onSalvarPix) onSalvarPix(chave.trim(), tipo)
  }

  const pct = Math.round(Number(taxa || 0) * 100)
  const t = totais || {}
  const lista = indicados || []
  const convertidos = lista.filter(r => r.subscription_status === 'active').length
  const mascarado = codigo ? codigo.slice(0, 2) + '••••' + codigo.slice(-2) : '••••••••'
  const temPix = !!pixChave

  // ATENÇÃO AO EDITAR: isto não é copy nossa — é o texto que o cliente copia
  // e manda pro contato dele, com o nome dele junto. Uma promessa errada
  // aqui queima a palavra DELE, não a nossa.
  //
  // Até 24/09/2026 as quatro diziam "3 dias grátis" e o e-mail dizia
  // "operadores ilimitados". O teste grátis acabou em 20/08 e o limite
  // virou pacote em 23/09 — os afiliados prometiam as duas coisas sem
  // saber. Nada aqui pode prometer o que o produto não entrega.
  const MODELOS = {
    whatsapp: {
      label: 'WhatsApp', icone: I_WHATS,
      texto: `Mano, descobri um sistema que organiza toda operação de CPA. Metas, operadores, BAU, lucro líquido — tudo num lugar só. Dá uma olhada 👇\n\n${link}`,
    },
    instagram: {
      label: 'Instagram', icone: I_INSTAGRAM,
      texto: `🎯 Operação de CPA organizada de verdade.\n\nSistema com metas, operadores, BAU, ranking e fechamento automático.\n\nAtivação na hora via PIX 👇\n${link}`,
    },
    dm: {
      label: 'DM longo', icone: I_DM,
      texto: `Cara, se tu opera com CPA isso vai te ajudar muito.\n\nÉ o NexControl — sistema feito pra essa nossa operação:\n\n✅ Metas + remessas organizadas\n✅ BAU automático\n✅ Lucro líquido na hora\n✅ Push em tempo real\n✅ Operadores com acesso próprio\n\nTestei e virei cliente. O link:\n\n${link}\n\nQualquer dúvida me chama.`,
    },
    email: {
      label: 'E-mail', icone: I_EMAIL,
      texto: `Olá!\n\nQueria te apresentar o NexControl — sistema completo pra gerenciar operação de CPA / iGaming.\n\nO sistema cobre:\n- Gestão de metas e remessas\n- Operadores com acesso próprio\n- BAU e lucro automático\n- Push em tempo real\n- Painel de fechamento\n\nPagamento via PIX, ativação na hora: ${link}\n\nAbraço${nome ? ',\n' + nome : ''}`,
    },
  }

  const PERGUNTAS = [
    { q: 'Como recebo minha comissão?', a: `Quando algum indicado seu paga, automaticamente gera ${pct}% de comissão pra você. Pra solicitar o pagamento, chama o @nexcontrol_ofc no Instagram ou WhatsApp (32) 99834-8889 com seu código de afiliado.` },
    { q: 'Pra que serve o código de afiliado?', a: 'É a sua chave de identificação. Sem ele, ninguém consegue resgatar suas comissões — nem alguém se passando por você. É a forma da gente confirmar que é VOCÊ quem está pedindo.' },
    { q: 'E se eu perder meu código?', a: 'Você consegue ver ele aqui mesmo no painel, é só clicar em "Revelar". Recomenda salvar num gerenciador de senhas.' },
    { q: 'Quanto custa pra começar?', a: 'Nada. Programa é grátis pra todo cliente PRO. Seu link e código já estão prontos pra usar.' },
    { q: 'Tenho limite de indicações?', a: 'Não. Indique quantas pessoas quiser. Cada indicado pagante gera comissão pra você.' },
    { q: 'Tem valor mínimo pra solicitar?', a: 'Sem mínimo oficial. Mas recomenda acumular pelo menos R$ 50 antes de pedir pra valer o esforço de fazer o pagamento.' },
    { q: 'E se o cliente cancelar depois?', a: 'A comissão que você já recebeu fica com você. Não tem clawback (devolução).' },
    { q: 'Posso indicar meus próprios operadores?', a: 'Não. Cada tenant pode ter só um afiliado, e auto-indicação é bloqueada automaticamente.' },
    { q: 'Quanto tempo demora pra cair?', a: 'Após o contato e confirmação dos dados, o pagamento sai em até 24 horas. Geralmente em poucas horas.' },
    { q: 'Como vou receber? PIX, banco?', a: 'Você decide na hora do contato. PIX é o mais rápido (mesmo dia), mas a gente também faz transferência bancária ou outras formas.' },
  ]

  const PASSOS = [
    { n: '01', t: 'Compartilhe seu link', d: 'Cola no grupo, posta no Stories, manda no DM. Sem limite, sem aprovação prévia.' },
    { n: '02', t: 'Indicado assina o plano', d: 'Quando entra pelo seu link e vira PRO, o sistema te credita automaticamente a comissão.' },
    { n: '03', t: 'Solicite seu pagamento', d: 'Quando atingir o valor que quiser sacar, chama o suporte com seu código único de afiliado.', contato: true },
  ]

  // Feed de atividade: indicados reais primeiro, depois os exemplos fixos —
  // mesma montagem do ActivityMarquee antigo, só que em cartão claro.
  const reais = lista.slice(0, 6).map(r => ({ n: r.tenant_name, a: `gerou R$ ${fmt(r.commission || 0)} de comissão`, w: 'recente' }))
  const exemplos = [
    { n: '@davir', a: 'recebeu R$ 28,02 em comissão', w: 'há 2h' },
    { n: '@rodrigo', a: 'indicou novo cliente', w: 'há 5h' },
    { n: '@sergio_g', a: 'solicitou pagamento via @nexcontrol_ofc', w: 'há 1d' },
    { n: '@cpalflux', a: 'tornou-se afiliado', w: 'há 1d' },
    { n: '@thiago', a: 'compartilhou link no WhatsApp', w: 'há 2d' },
  ]
  const feed = [...(reais.length > 0 ? reais : []), ...exemplos]

  const top5 = lista.filter(r => r.commission > 0).sort((a, b) => b.commission - a.commission).slice(0, 5)

  const ganho = sim * TICKET * Number(taxa || 0)

  // ── PROGRAMA AINDA NÃO LIBERADO ─────────────────────────────────────────
  if (!habilitado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ModuleHeader titulo="Afiliados" sub="Indique clientes e ganhe comissão em cada assinatura" />
        <BCard pad={24}>
          <Vazio
            icone={I_CADEADO}
            titulo="Programa em ativação"
            texto="A liberação acontece automaticamente nas próximas horas. Volte em breve."
          />
        </BCard>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Afiliados"
        sub={`${pct}% de comissão em cada assinatura · ${int(t.totalIndicados)} indicado${Number(t.totalIndicados) === 1 ? '' : 's'}`}
        acao={<AcaoBtn onClick={compartilhar} icon={I_SHARE}>Compartilhar meu link</AcaoBtn>}
      />

      {/* ── HERÓI: o link é o produto desta tela, então ele fica no topo ── */}
      {/* data-tour="afil-link": o passo "Seu link único" aponta pra ca. */}
      <div data-tour="afil-link">
      <Tilt>
        <BCard pad="28px 30px" blob={['var(--profit-dim)', 'var(--profit-border)']} delay={0.04}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 12px' }}>
            Seu link de indicação
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0, maxWidth: '100%',
              padding: '11px 15px', borderRadius: 14, background: 'var(--fill-1)', border: '1px solid var(--b1)',
            }}>
              <span style={{ color: 'var(--t4)', display: 'inline-flex', flexShrink: 0 }}><Ico d={I_LINK} s={14} /></span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {link || '—'}
              </span>
            </span>

            {/* Confirmação visual: o próprio botão vira "Copiado" em verde */}
            <motion.button
              type="button" onClick={() => copiar('link', link)}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 30,
                border: `1px solid ${copiado === 'link' ? 'var(--profit-border)' : 'var(--b2)'}`,
                background: copiado === 'link' ? 'var(--profit-dim)' : 'var(--surface)',
                color: copiado === 'link' ? 'var(--profit)' : 'var(--t1)',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              }}>
              <Ico d={copiado === 'link' ? I_CHECK : I_COPIAR} s={15} />
              {copiado === 'link' ? 'Copiado' : 'Copiar link'}
            </motion.button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 22, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>
                Comissão acumulada
              </p>
              <p style={{ fontFamily: MONO, fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--profit)', margin: 0 }}>
                {money(t.totalComissao)}
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '12px 0 0' }}>
                {int(t.totalIndicados)} indicado{Number(t.totalIndicados) === 1 ? '' : 's'} · {convertidos} já pagante{convertidos === 1 ? '' : 's'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { l: 'A receber', v: money(t.pendente), c: RED },
                { l: 'Já pago', v: money(t.pago), c: 'var(--profit)' },
              ].map(e => (
                <div key={e.l} style={{ padding: '12px 16px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)', minWidth: 130 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>{e.l}</p>
                  <p style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: e.c, margin: 0 }}>{e.v}</p>
                </div>
              ))}
            </div>
          </div>
        </BCard>
      </Tilt>
      </div>

      {/* ── TIRA DE CONVERSÃO ── */}
      {/* data-tour="afil-kpis": o passo "Comissão acumulada" aponta pra ca. */}
      <div data-tour="afil-kpis">
      <Tira itens={[
        { l: 'Indicados', v: int(t.totalIndicados) },
        { l: 'Convertidos', v: int(convertidos), c: 'var(--profit)', hint: `${Number(t.totalIndicados) > 0 ? Math.round((convertidos / Number(t.totalIndicados)) * 100) : 0}% viraram PRO` },
        { l: 'Faturamento gerado', v: money0(t.totalFaturado) },
        { l: 'Comissão acumulada', v: money0(t.totalComissao), c: 'var(--profit)' },
        { l: 'A receber', v: money0(t.pendente), c: RED },
        { l: 'Já pago', v: money0(t.pago), c: 'var(--profit)' },
      ]} />
      </div>

      {/* ── SIMULADOR + ROSCA DA COMISSÃO ── */}
      <div className="afb-2" style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 14 }}>
        <BCard pad={24} delay={0.14}>
          <TituloBloco sub={`Ticket médio de R$ ${fmt(TICKET)}/mês × ${pct}% de comissão. Tickets reais vão de R$ 39 (Solo) a R$ 219+ (Admin + operadores).`}>
            Quanto você pode ganhar
          </TituloBloco>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.04em', lineHeight: 1 }}>{sim}</span>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>indicados pagantes</span>
          </div>

          <input
            type="range" min="1" max="100" value={sim}
            aria-label="Quantidade de indicados pagantes"
            onChange={e => setSim(Number(e.target.value))}
            style={{ width: '100%', accentColor: RED, cursor: 'pointer', marginTop: 10 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t4)', marginTop: 6, fontFamily: MONO }}>
            <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>

          <div style={{ marginTop: 20, padding: '18px 20px', borderRadius: 18, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>Sua comissão por mês</p>
            <p style={{ fontFamily: MONO, fontSize: 32, fontWeight: 900, color: 'var(--profit)', margin: 0, letterSpacing: '-0.035em', lineHeight: 1 }}>
              {money(ganho)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--t4)', margin: '0 0 3px', letterSpacing: '0.06em' }}>POR INDICADO</p>
                <p style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{money(TICKET * Number(taxa || 0))}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'var(--t4)', margin: '0 0 3px', letterSpacing: '0.06em' }}>SE INDICAR 100</p>
                <p style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: 'var(--profit)', margin: 0 }}>{money(100 * TICKET * Number(taxa || 0))}</p>
              </div>
            </div>
          </div>
        </BCard>

        <BCard pad={24} delay={0.18}>
          <TituloBloco sub="Quanto já caiu e quanto ainda está na fila">Sua comissão</TituloBloco>
          <Rosca
            dados={[
              { l: 'Já pago', v: Number(t.pago || 0), c: 'var(--profit)' },
              { l: 'A receber', v: Number(t.pendente || 0), c: RED },
            ]}
            centro={money0(t.totalComissao)}
            rotulo="acumulado"
            formata={money0}
          />
        </BCard>
      </div>

      {/* ── LISTA DE INDICADOS ── */}
      <div className="afb-2" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <Lista
          titulo={`Quem entrou pelo seu link (${lista.length})`}
          vazio="Esperando o primeiro indicado."
          delay={0.22}
          linhas={lista.map(r => ({
            k: r.tenant_id,
            avatar: String(r.tenant_name || '?')[0].toUpperCase(),
            avatarBg: 'var(--fill-2)', avatarFg: 'var(--t2)',
            t: r.tenant_name,
            s: [r.email, r.payments_count > 0 ? `${r.payments_count} pagto(s)` : null, `gerou R$ ${fmt(r.generated)}`].filter(Boolean).join(' · '),
            v: `+R$ ${fmt(r.commission)}`, vc: 'var(--profit)',
            acao: <PilulaStatus status={r.subscription_status} />,
          }))}
        />

        <BCard pad={24} delay={0.26}>
          <TituloBloco sub="Os indicados que mais geraram comissão">Seu top 5</TituloBloco>
          {top5.length === 0
            ? <Vazio icone={I_TROFEU} titulo="Ninguém no pódio ainda" texto="Assim que um indicado pagar, ele aparece aqui." />
            : top5.map((r, i) => (
              <div key={r.tenant_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < top5.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 900, color: i === 0 ? RED : i === 1 ? RED2 : 'var(--t4)', minWidth: 26 }}>#{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.tenant_name}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: 'var(--profit)' }}>R$ {fmt(r.commission)}</span>
              </div>
            ))}
        </BCard>
      </div>

      {/* ── CÓDIGO DE RECEBIMENTO (anti-fraude) ── */}
      <div className="afb-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <BCard pad={24} delay={0.3}>
          <TituloBloco sub="Único, pessoal e intransferível: é com ele que a gente confirma que o pedido de saque é seu.">
            Código de recebimento
          </TituloBloco>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {revelado ? codigo : mascarado}
            </span>
            <BotaoSec onClick={() => setRevelado(v => !v)} icone={revelado ? I_OLHO_OFF : I_OLHO} cor={revelado ? RED : 'var(--t1)'}>
              {revelado ? 'Ocultar' : 'Revelar'}
            </BotaoSec>
            <BotaoSec
              onClick={() => copiar('codigo', codigo)} desabilitado={!revelado}
              icone={copiado === 'codigo' ? I_CHECK : I_COPIAR}
              cor={copiado === 'codigo' ? 'var(--profit)' : 'var(--t1)'}>
              {copiado === 'codigo' ? 'Copiado' : 'Copiar'}
            </BotaoSec>
          </div>

          <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--t1)' }}>Mantenha sigilo.</strong> Qualquer pessoa com esse código pode tentar resgatar suas comissões em seu nome.
          </p>
        </BCard>

        <BCard pad={24} delay={0.34}>
          <TituloBloco>Como solicitar</TituloBloco>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
            {[
              'Chama no @nexcontrol_ofc (Instagram) ou WhatsApp',
              'Envie seu código de recebimento',
              'Confirme dados pra receber via PIX, banco ou outro meio',
              'Pagamento sai em até 24 horas',
            ].map((txt, i) => (
              <li key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 8, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 10, fontWeight: 900, color: RED }}>{i + 1}</span>
                <span>{txt}</span>
              </li>
            ))}
          </ol>
        </BCard>
      </div>

      {/* CHAVE PIX — desligado de proposito.

          Este bloco existia no arquivo antigo mas NUNCA esteve na arvore
          renderizada: era codigo morto. Religar daria ao afiliado uma
          capacidade nova (cadastrar a chave de recebimento pelo painel),
          e isso e decisao de produto, nao efeito colateral de um
          redesenho visual. O formulario esta pronto logo abaixo: basta
          apagar este comentario e o `false &&` pra ativar.

          O mesmo vale pro handler salvarPix em app/afiliados/page.js, que
          faz o POST em /api/affiliate/pix (rota ja existente e que valida
          role === admin no servidor). */}
      {false && (
      <div className="afb-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <BCard pad={24} delay={0.38}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Sua chave PIX</p>
              <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '4px 0 0', lineHeight: 1.5 }}>
                {temPix ? 'Tudo pronto. As comissões vão para a chave abaixo.' : 'Cadastre uma chave pra que suas comissões possam ser enviadas.'}
              </p>
            </div>
            <span style={{
              flexShrink: 0, fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
              padding: '5px 9px', borderRadius: 7,
              background: temPix ? 'var(--profit-dim)' : 'var(--loss-dim)',
              color: temPix ? 'var(--profit)' : 'var(--loss)',
              border: `1px solid ${temPix ? 'var(--profit-border)' : 'var(--loss-border)'}`,
            }}>{temPix ? 'CADASTRADA' : 'PENDENTE'}</span>
          </div>

          {/* form de verdade: o Enter no campo salva, como qualquer formulário */}
          <form onSubmit={e => { e.preventDefault(); salvarPix() }} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12 }} className="afb-pix">
              <Selecao
                rotulo="Tipo" valor={tipo} aoMudar={setTipo}
                opcoes={[
                  { v: 'cpf', l: 'CPF' },
                  { v: 'email', l: 'E-mail' },
                  { v: 'phone', l: 'Telefone' },
                  { v: 'random', l: 'Aleatória' },
                ]}
              />
              <Campo
                rotulo="Chave" valor={chave} aoMudar={v => { setChave(v); if (erroPix) setErroPix('') }}
                erro={erroPix} mono
                placeholder={tipo === 'cpf' ? '000.000.000-00' : tipo === 'email' ? 'voce@email.com' : tipo === 'phone' ? '+55 31 99999-9999' : 'chave aleatória'}
              />
            </div>
            <motion.button
              type="submit" disabled={pixSalvando || !chave.trim()}
              whileHover={pixSalvando || !chave.trim() ? undefined : { y: -2, boxShadow: '0 14px 32px rgba(229,57,31,0.36)' }}
              whileTap={pixSalvando || !chave.trim() ? undefined : { scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 22px', borderRadius: 30, fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 800,
                // confirmação visual: o botão fica verde-claro com texto mint
                // em vez de sólido, porque o mint é claro demais pra texto branco
                border: pixSalvo ? '1px solid var(--profit-border)' : 'none',
                color: pixSalvo ? 'var(--profit)' : '#fff',
                background: pixSalvo ? 'var(--profit-dim)' : `linear-gradient(135deg, ${RED2}, ${RED})`,
                opacity: pixSalvando || !chave.trim() ? 0.5 : 1,
                cursor: pixSalvando || !chave.trim() ? 'not-allowed' : 'pointer',
              }}>
              {pixSalvo ? <><Ico d={I_CHECK} s={15} />Chave salva</> : pixSalvando ? 'Salvando...' : 'Salvar chave PIX'}
            </motion.button>
          </form>
        </BCard>

        <BCard pad={24} delay={0.42}>
          <TituloBloco>Como funciona o pagamento</TituloBloco>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
            {[
              'Comissão aparece em "A receber"',
              'Pagamento manual via PIX em até 24 horas',
              'Você recebe push aqui quando for pago',
              'Chave pode ser alterada a qualquer momento',
            ].map(txt => (
              <li key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--profit)', display: 'inline-flex', flexShrink: 0, marginTop: 2 }}><Ico d={I_CHECK} s={13} /></span>
                <span>{txt}</span>
              </li>
            ))}
          </ul>
        </BCard>
      </div>
      )}

      {/* ── KIT DE DIVULGAÇÃO ── */}
      <BCard pad={24} delay={0.46}>
        <TituloBloco sub="Mensagens prontas pra cada canal. Copie, cole e envie.">Kit de divulgação</TituloBloco>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          {Object.entries(MODELOS).map(([k, v]) => {
            const ativo = k === aba
            return (
              <button
                key={k} type="button" onClick={() => setAba(k)} aria-pressed={ativo}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '9px 15px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 12.5, fontWeight: 800, letterSpacing: '-0.01em',
                  border: `1px solid ${ativo ? 'transparent' : 'var(--b2)'}`,
                  background: ativo ? '#15151a' : 'var(--fill-1)',
                  color: ativo ? '#fff' : 'var(--t2)',
                }}>
                <Ico d={v.icone} s={14} />{v.label}
              </button>
            )
          })}
        </div>

        <div className="afb-kit" style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: 16, alignItems: 'start' }}>
          <div>
            <div style={{ padding: 18, borderRadius: 18, background: 'var(--fill-1)', border: '1px solid var(--b1)', minHeight: 200 }}>
              <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{MODELOS[aba].texto}</p>
            </div>
            <div style={{ marginTop: 12 }}>
              <BotaoSec
                onClick={() => copiar('modelo', MODELOS[aba].texto)} largura="100%"
                icone={copiado === 'modelo' ? I_CHECK : I_COPIAR}
                cor={copiado === 'modelo' ? 'var(--profit)' : 'var(--t1)'}>
                {copiado === 'modelo' ? 'Copiado pra área de transferência' : 'Copiar esta mensagem'}
              </BotaoSec>
            </div>
          </div>

          {/* Prévia no celular — mesma ideia do mockup antigo, em tom claro */}
          <div style={{ borderRadius: 26, border: '1px solid var(--b2)', background: 'var(--fill-1)', padding: 8, margin: '0 auto', width: '100%', maxWidth: 250 }}>
            <div style={{ borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--b1)', overflow: 'hidden', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${RED2}, ${RED})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>
                  {(nome || 'V')[0].toUpperCase()}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--t1)' }}>Você</span>
                  <span style={{ display: 'block', fontSize: 9, color: 'var(--t4)' }}>{MODELOS[aba].label} · agora</span>
                </span>
              </div>
              <div style={{ flex: 1, padding: '14px 12px', display: 'flex' }}>
                <p style={{
                  alignSelf: 'flex-end', marginLeft: 'auto', maxWidth: '92%', margin: 0,
                  padding: '9px 12px', borderRadius: '14px 14px 4px 14px',
                  background: 'var(--fill-2)', border: '1px solid var(--b1)',
                  fontSize: 10, color: 'var(--t2)', whiteSpace: 'pre-wrap', lineHeight: 1.45,
                }}>{MODELOS[aba].texto}</p>
              </div>
            </div>
          </div>
        </div>
      </BCard>

      {/* ── COMO FUNCIONA (3 passos) + CONTATOS ── */}
      <BCard pad={24} delay={0.5}>
        <TituloBloco sub="Sem código complicado, sem cadastro burocrático. Tudo funciona em segundo plano.">Em 3 passos</TituloBloco>
        <div className="afb-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {PASSOS.map(p => (
            <div key={p.n} style={{ padding: 18, borderRadius: 18, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 12, marginBottom: 12,
                background: 'var(--surface)', border: '1px solid var(--b1)',
                fontFamily: MONO, fontSize: 12, fontWeight: 900, color: RED,
              }}>{p.n}</span>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{p.t}</p>
              <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0, lineHeight: 1.55 }}>{p.d}</p>
              {p.contato && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <Contato href="https://instagram.com/nexcontrol_ofc" rotulo="INSTAGRAM" valor="@nexcontrol_ofc" icone={I_INSTAGRAM} />
                  <Contato href="https://wa.me/5532998348889" rotulo="WHATSAPP" valor="(32) 99834-8889" icone={I_WHATS} cor="var(--profit)" />
                </div>
              )}
            </div>
          ))}
        </div>
      </BCard>

      {/* ── ATIVIDADE RECENTE ── */}
      <BCard pad={20} delay={0.54}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <span style={{ color: 'var(--t3)', display: 'inline-flex' }}><Ico d={I_PESSOAS} s={15} /></span>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: 0 }}>Atividade recente</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {feed.slice(0, 6).map((f, i) => (
            <div key={`${f.n}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: 'var(--t2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--profit)', flexShrink: 0 }} />
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong style={{ color: 'var(--t1)', fontWeight: 800 }}>{f.n}</strong> {f.a}
              </span>
              <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11, color: 'var(--t4)' }}>{f.w}</span>
            </div>
          ))}
        </div>
      </BCard>

      {/* ── FAQ ── */}
      <BCard pad={24} delay={0.58}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <span style={{ color: 'var(--t3)', display: 'inline-flex' }}><Ico d={I_AJUDA} s={16} /></span>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Perguntas frequentes</p>
        </div>
        {PERGUNTAS.map((item, i) => {
          const aberta = faq === i
          return (
            <div key={item.q} style={{ borderBottom: i < PERGUNTAS.length - 1 ? '1px solid var(--b1)' : 'none' }}>
              <button
                type="button" onClick={() => setFaq(aberta ? -1 : i)} aria-expanded={aberta}
                style={{ width: '100%', padding: '15px 0', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>{item.q}</span>
                <motion.span animate={{ rotate: aberta ? 45 : 0 }} transition={{ duration: 0.22 }} style={{ flexShrink: 0, color: 'var(--t3)', display: 'inline-flex' }}>
                  <Ico d={<path d="M12 5v14M5 12h14" />} s={15} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {aberta && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.26, ease: [0.33, 1, 0.68, 1] }}
                    style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0, padding: '0 0 16px', lineHeight: 1.65, maxWidth: 720 }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </BCard>

      {/* ── CHAMADA FINAL ── */}
      <BCard pad="30px 28px" delay={0.62} blob={['var(--fill-2)', 'var(--fill-1)']}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>
              {pct}% de comissão. Sua, sem trabalho.
            </p>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: '6px 0 0' }}>
              Pega seu link, manda no grupo, espera o pagamento entrar.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <BotaoSec
              onClick={() => copiar('final', link)}
              icone={copiado === 'final' ? I_CHECK : I_COPIAR}
              cor={copiado === 'final' ? 'var(--profit)' : 'var(--t1)'}>
              {copiado === 'final' ? 'Link copiado' : 'Copiar meu link'}
            </BotaoSec>
            <AcaoBtn onClick={compartilhar} icon={I_SHARE}>Compartilhar</AcaoBtn>
          </div>
        </div>
      </BCard>

      <style>{`
        @media (max-width: 1000px) {
          .afb-2 { grid-template-columns: 1fr !important; }
          .afb-kit { grid-template-columns: 1fr !important; }
          .bk-tira { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 720px) {
          .afb-3 { grid-template-columns: 1fr !important; }
          .afb-pix { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
