'use client'
// ─────────────────────────────────────────────────────────────────────────
// NEX CONTROL 2.0 — página de lançamento (/v2).
//
// REGRA DE CONTEÚDO, e ela vale pra cada linha daqui:
// nada nesta página é invenção. Os números vêm dos que já estão publicados
// na home; o preço vem de lib/pricing.js; os alertas são os três que
// lib/insights-engine.js realmente dispara; os módulos do ecossistema são
// os que qualquer conta alcança hoje. Aulas VIP ficou de FORA porque é
// liberada por allowlist de tenant (lib/aulas-tenants.js) — anunciar como
// módulo aberto seria mentira.
//
// O PRODUTO APARECE COMO ELE É: capturas do painel claro de verdade, em
// public/landing/v2/. O contraste entre a página escura e a interface clara
// é proposital — é o que faz o software saltar da página.
//   → os nomes da equipe nas capturas foram trocados por fictícios.
//     Os valores são da conta do dono, não de cliente.
//
// A rota é pública, mas um admin logado também pode abri-la: aí o <html>
// carrega .nx-bento/.nx-light, cuja camada de tradução troca branco inline
// por texto escuro. Por isso TODA cor aqui vem de classe (app/v2/estilo.js),
// nunca de style inline.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BASE_PRICE, OP_BASE_PRICE } from '../../lib/pricing'
import EstiloV2 from './estilo'
import { Revelar, Olho, Cabeca, Contador, Botao, Ico, Pergunta, SETA } from './pecas'

const moeda = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ═══════════════════════════════════════════════════════════════════════
   ÍCONES — traço fino, sem preenchimento. Nada de emoji.
   ═══════════════════════════════════════════════════════════════════════ */
const I = {
  alvo: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
  equipe: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  troeu: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M6 4h12v7a6 6 0 0 1-12 0z" /><path d="M12 17v4M8 21h8" /></>,
  rede: <><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M12 7.5v4M10 13l-3.4 3.6M14 13l3.4 3.6" /></>,
  relato: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
  grafico: <><path d="M3 3v18h18" /><path d="M7 15l3.5-4.5 3.5 3.5L20 7" /></>,
  sino: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  raio: <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" />,
  escudo: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  celular: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18.5h2" /></>,
  globo: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></>,
  balao: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />,
  placa: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 20h8M12 18v2M8 9h8M8 13h5" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
}

/* ── NÚMEROS ─────────────────────────────────────────────────────────────
   Exatamente os três que já estão publicados na home (app/page.js). Não
   inventei nenhum e não mexi em nenhum. */
const NUMEROS = [
  { valor: 400, depois: '+', rotulo: 'operadores ativos' },
  { antes: 'R$ ', valor: 1, depois: 'M+', rotulo: 'monitorados em operações' },
  { valor: 3000, depois: '+', rotulo: 'metas analisadas' },
]

/* ── ALERTAS ─────────────────────────────────────────────────────────────
   Os TRÊS que lib/insights-engine.js emite de verdade. O motor tem
   cooldown por tipo/meta/usuário — não é chatbot, é regra. */
const ALERTAS = [
  {
    ico: I.grafico,
    t: 'Sequência negativa',
    d: 'Remessas seguidas no vermelho dentro da mesma meta. O aviso chega enquanto dá pra corrigir.',
  },
  {
    ico: I.raio,
    t: 'Prejuízo acima da média',
    d: 'Uma remessa fecha muito pior que o padrão daquela operação e o sistema aponta na hora.',
  },
  {
    ico: I.sino,
    t: 'Meta parada',
    d: 'Uma meta aberta que parou de receber remessa. Ninguém precisa lembrar de conferir.',
  },
]

/* ── ECOSSISTEMA ─────────────────────────────────────────────────────────
   Só o que qualquer conta alcança. Aulas VIP não entra: é liberada por
   allowlist de tenant. */
const MODULOS = [
  { ico: I.globo, t: 'Minhas Proxies', d: 'As proxies da operação organizadas em um lugar só.' },
  { ico: I.balao, t: 'Network', d: 'A comunidade dos administradores da plataforma, aberta a todos.' },
  { ico: I.placa, t: 'Premiações', d: 'Placas por marco de faturamento, calculadas pelo lucro real.' },
]

const FAQ = [
  {
    q: 'Quanto custa?',
    r: `A Nex Control custa R$ ${moeda(BASE_PRICE)} por mês, mais R$ ${moeda(OP_BASE_PRICE)} por operador que você adicionar. A partir do segundo operador entra desconto progressivo, que cresce conforme a equipe cresce.`,
  },
  {
    q: 'Preciso instalar alguma coisa?',
    r: 'Não. A Nex Control roda no navegador. No celular ela pode ser instalada na tela inicial como aplicativo, mas isso é opcional — tudo funciona sem instalar nada.',
  },
  {
    q: 'Posso adicionar operadores?',
    r: 'Sim, quando quiser. Você gera um link de convite, o operador cria a conta por ele e já entra na sua operação. Quem paga é o administrador: o operador não paga nada.',
  },
  {
    q: 'Funciona no celular?',
    r: 'Funciona. O painel foi redesenhado para telefone na 2.0, com barra de navegação própria, e pode receber notificações de push no aparelho.',
  },
  {
    q: 'Como funciona a captura automática de depósito?',
    r: 'A Nex Control abre uma sessão de captura e lê o valor do depósito, lançando na remessa sem digitação. É um recurso de apoio ao lançamento manual, não um substituto: você continua no controle do que entra.',
  },
  {
    q: 'Meus dados ficam seguros?',
    r: 'Cada operação é isolada no banco por tenant, com as regras aplicadas no próprio servidor. Um administrador nunca alcança o dado de outro, e o operador não enxerga os campos financeiros do administrador.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    r: 'Pode. A cobrança é mensal por PIX e não renova sozinha — se você não renovar, o acesso simplesmente encerra no fim do período. Não existe fidelidade nem multa.',
  },
]

/* ═══════════════════════════════════════════════════════════════════════ */
export default function V2Page() {
  const [preso, setPreso] = useState(false)
  const [faqAberta, setFaqAberta] = useState(0)

  useEffect(() => {
    const aoRolar = () => setPreso(window.scrollY > 16)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  return (
    <main className="nv2">
      <EstiloV2 />

      {/* ═══ 01 · CABEÇALHO ═══════════════════════════════════════════ */}
      <header className="nv2-topo" data-preso={preso ? '1' : '0'}>
        <div className="nv2-larg nv2-topo-in">
          <Link href="/v2" className="nv2-marca" aria-label="Nex Control 2.0">
            <Image src="/brand/nex-v2.png" alt="" width={28} height={28} priority
              style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span className="nv2-marca-nome">Nex Control</span>
            <span className="nv2-marca-v nv2-esconde-mob">2.0</span>
          </Link>

          <nav className="nv2-nav" aria-label="Seções">
            <a href="#produto">Produto</a>
            <a href="#recursos">Recursos</a>
            <a href="#equipes">Para equipes</a>
            <a href="#precos">Preços</a>
          </nav>

          <div className="nv2-topo-acoes">
            <Botao href="/login" tipo="fant">Entrar</Botao>
            <Botao href="/signup" tipo="lime">Começar agora</Botao>
          </div>
        </div>
      </header>

      {/* ═══ 02 · HERO ════════════════════════════════════════════════ */}
      <section className="nv2-hero">
        <div className="nv2-n nv2-esconde-mob" style={{ top: -60, right: -180, width: 620 }} aria-hidden>
          <Image src="/brand/nex-v2.png" alt="" width={620} height={620} priority />
        </div>

        <div className="nv2-larg nv2-hero-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 780 }}>
            <Revelar y={12}><Olho>Nex Control 2.0 — disponível agora</Olho></Revelar>

            <Revelar atraso={0.07}>
              <h1 className="nv2-h1" style={{ marginTop: 22 }}>
                Sua operação inteira.<br />Agora sob controle.
              </h1>
            </Revelar>

            <Revelar atraso={0.14}>
              <p className="nv2-lead" style={{ marginTop: 24 }}>
                Operadores, metas, depósitos, saques, custos e resultados em uma única
                plataforma criada para operações CPA.
              </p>
            </Revelar>

            <Revelar atraso={0.21}>
              <div className="nv2-cta-col" style={{ display: 'flex', gap: 10, marginTop: 34, flexWrap: 'wrap' }}>
                <Botao href="/signup" tipo="lime" grande seta>Começar agora</Botao>
                <Botao href="#produto" tipo="linha" grande>Explorar a plataforma</Botao>
              </div>
            </Revelar>

            <Revelar atraso={0.28}>
              <div className="nv2-provas" style={{ marginTop: 26 }}>
                <span className="nv2-prova"><i />Dados em tempo real</span>
                <span className="nv2-prova"><i />Ativação imediata</span>
                <span className="nv2-prova"><i />Sem fidelidade</span>
              </div>
            </Revelar>
          </div>

          {/* o produto sangra pela direita: o corte sugere que há mais
              sistema do que cabe na tela */}
          <Revelar atraso={0.2} y={26} className="nv2-palco nv2-palco-bleed">
            <Image
              src="/landing/v2/painel.png"
              alt="Painel da Nex Control: lucro consolidado do mês, metas fechadas, resultado da semana e movimento da operação"
              width={3200} height={2000} priority
              sizes="(max-width: 768px) 130vw, 1180px"
            />
          </Revelar>
        </div>
      </section>

      {/* ═══ 03 · NÚMEROS ═════════════════════════════════════════════ */}
      <section className="nv2-sec nv2-sec--curta">
        <div className="nv2-larg">
          <div className="nv2-nums nv2-regua">
            {NUMEROS.map((n, i) => (
              <Revelar key={n.rotulo} atraso={i * 0.08} className="nv2-num">
                <b><Contador valor={n.valor} antes={n.antes} depois={n.depois} /></b>
                <span>{n.rotulo}</span>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 04 · VISÃO GERAL (produto real, grande) ══════════════════ */}
      <section className="nv2-sec" id="produto">
        <div className="nv2-larg">
          <Cabeca
            olho="Visão geral"
            titulo={<>Veja tudo.<br />Sem perguntar para ninguém.</>}
            lead="Abra a Nex Control e saiba exatamente o que está acontecendo na sua operação."
          />

          <Revelar atraso={0.12} y={26} style={{ marginTop: 52 }}>
            <figure className="nv2-card" style={{ padding: 0 }}>
              <Image
                src="/landing/v2/faturamento.png"
                alt="Tela de faturamento da Nex Control: lucro final do período, retorno das remessas, evolução por dia e resumo de como o resultado se formou"
                width={3200} height={2000} loading="eager"
                sizes="(max-width: 768px) 100vw, 1180px"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </figure>
          </Revelar>

          <ul className="nv2-bento" style={{ marginTop: 14 }}>
            {[
              ['Lucro consolidado', 'O resultado do período já com salário, baú e custos descontados.'],
              ['Metas fechadas', 'Quantas operações foram encerradas e o que cada uma trouxe.'],
              ['Equipe ativa', 'Quem está operando e quanto cada um gerou.'],
              ['Movimento da operação', 'Depositado, sacado e custos lado a lado, no mesmo cartão.'],
            ].map(([t, d], i) => (
              <Revelar key={t} atraso={i * 0.06} as="li" className="nv2-card nv2-card-pad col3" style={{ gridColumn: 'span 3' }}>
                <h3 className="nv2-h3">{t}</h3>
                <p className="nv2-corpo" style={{ marginTop: 7 }}>{d}</p>
              </Revelar>
            ))}
          </ul>

          <Revelar atraso={0.1} style={{ marginTop: 40 }}>
            <Botao href="/signup" tipo="lime" grande seta>Começar agora</Botao>
          </Revelar>
        </div>
      </section>

      {/* ═══ 05 · PROBLEMA (editorial: só tipografia) ═════════════════ */}
      <section className="nv2-sec">
        <div className="nv2-larg">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 48, alignItems: 'start' }}
            className="nv2-prob-grid">
            <Revelar>
              <h2 className="nv2-h2">
                Planilha não é<br />sistema operacional.
              </h2>
            </Revelar>
            <Revelar atraso={0.1}>
              <p className="nv2-lead">
                Quando a operação cresce, WhatsApp, planilha e conta manual começam
                a esconder informação.
              </p>
            </Revelar>
          </div>

          <div className="nv2-frases nv2-regua" style={{ marginTop: 64 }}>
            {[
              'Você não deveria perguntar quanto a operação fez.',
              'Você não deveria somar depósito no fim do dia.',
              'Você não deveria descobrir um problema quando já aconteceu.',
            ].map((f, i) => (
              <Revelar key={f} atraso={i * 0.1} as="p">{f}</Revelar>
            ))}
          </div>

          <Revelar atraso={0.1}>
            <p className="nv2-lead" style={{ marginTop: 40 }}>
              Foi para isso que construímos a Nex Control.
            </p>
          </Revelar>
        </div>
      </section>

      {/* ═══ 06 · BENTO DE FUNCIONALIDADES ════════════════════════════ */}
      <section className="nv2-sec" id="recursos">
        <div className="nv2-larg">
          <Cabeca
            olho="Recursos"
            titulo="O que a operação precisa, junto."
            lead="Cada parte da operação tem o seu lugar — e todas falam a mesma língua."
          />

          <div className="nv2-bento" style={{ marginTop: 52 }}>
            {/* cartão principal: recorte real do "Movimento da operação" */}
            <Revelar className="nv2-card col4" style={{ gridColumn: 'span 4' }}>
              <div className="nv2-card-pad">
                <Olho ponto={false}>Financeiro em tempo real</Olho>
                <h3 className="nv2-h2" style={{ fontSize: 'clamp(24px,2.6vw,32px)', marginTop: 16 }}>
                  Depósitos. Saques. Custos. Lucro.<br />Tudo no mesmo lugar.
                </h3>
                <p className="nv2-corpo" style={{ marginTop: 14, maxWidth: '46ch' }}>
                  O dinheiro que entra, o que sai e o que sobra — calculado pela mesma
                  fórmula que fecha a meta, sem conferência paralela.
                </p>
              </div>
              {/* recorte da própria interface, não ilustração. O enquadramento
                  mora no CSS (.nv2-recorte): com width em % dentro de next/image
                  o navegador calculava o tamanho antes da imagem existir e o
                  bloco ficava vazio. */}
              <div className="nv2-recorte">
                <Image
                  src="/landing/v2/faturamento.png"
                  alt="Tira de indicadores da Nex Control: depositado, sacado, resultado e custos lado a lado"
                  width={3200} height={2000} loading="eager"
                  sizes="760px"
                />
              </div>
            </Revelar>

            <Revelar atraso={0.06} className="nv2-card nv2-card-pad col2" style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--lime)' }}><Ico d={I.alvo} s={20} /></span>
              <h3 className="nv2-h3" style={{ marginTop: 16 }}>Metas</h3>
              <p className="nv2-corpo" style={{ marginTop: 7 }}>
                Crie, acompanhe e finalize metas sem depender de controle manual.
              </p>
            </Revelar>

            {[
              [I.equipe, 'Operadores', 'Acompanhe a equipe e a operação individualmente.'],
              [I.troeu, 'Ranking', 'Performance transformada em dado.'],
              [I.rede, 'Redes', 'Organize as redes da operação em um único ambiente.'],
              [I.relato, 'Relatórios', 'Entenda o que aconteceu por período sem montar planilhas manualmente.'],
            ].map(([ico, t, d], i) => (
              <Revelar key={t} atraso={0.1 + i * 0.05} className="nv2-card nv2-card-pad col3"
                style={{ gridColumn: i < 2 ? 'span 3' : 'span 3' }}>
                <span style={{ color: 'var(--lime)' }}><Ico d={ico} s={20} /></span>
                <h3 className="nv2-h3" style={{ marginTop: 16 }}>{t}</h3>
                <p className="nv2-corpo" style={{ marginTop: 7 }}>{d}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 07 · EQUIPES ═════════════════════════════════════════════ */}
      <section className="nv2-sec" id="equipes">
        <div className="nv2-larg">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)', gap: 56, alignItems: 'center' }}
            className="nv2-eq-grid">
            <div>
              <Cabeca
                olho="Para equipes"
                titulo={<>De 1 a 20 operadores.<br />A mesma clareza.</>}
              />
              <ul className="nv2-marcas" style={{ marginTop: 34 }}>
                {[
                  ['Separação de acessos', 'Administrador e operador entram no mesmo sistema e veem coisas diferentes.'],
                  ['Sem financeiro para o operador', 'Salário, baú e lucro final não aparecem para quem opera.'],
                  ['Performance individual', 'Metas fechadas, taxa de acerto e depositantes por pessoa.'],
                  ['Convite por link', 'O operador cria a própria conta e já entra na sua operação.'],
                  ['Controle do administrador', 'Você decide quem entra, quem sai e o que cada um alcança.'],
                ].map(([t, d]) => (
                  <li key={t}><i /><span><b>{t}</b><span>{d}</span></span></li>
                ))}
              </ul>
            </div>

            <Revelar atraso={0.1} y={24} className="nv2-card" style={{ padding: 0 }}>
              <Image
                src="/landing/v2/operadores.png"
                alt="Tela de operadores da Nex Control: lucro gerado pela equipe e ranking por operador com metas e taxa de acerto"
                width={3200} height={2000} loading="eager"
                sizes="(max-width: 768px) 100vw, 640px"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </Revelar>
          </div>
        </div>
      </section>

      {/* ═══ 08 · NEX INTELLIGENCE ════════════════════════════════════ */}
      <section className="nv2-sec">
        <div className="nv2-larg">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 56, alignItems: 'center' }}
            className="nv2-eq-grid">
            <div>
              <Cabeca
                olho="Nex Intelligence"
                titulo={<>A operação fala<br />antes do problema crescer.</>}
                lead="Três regras rodam sobre o que está acontecendo agora e avisam sozinhas. Não é assistente para conversar: é o sistema apontando o que mudou."
              />
            </div>

            <Revelar atraso={0.1} className="nv2-card" style={{ padding: 0 }}>
              {ALERTAS.map((a, i) => (
                <Revelar key={a.t} atraso={0.16 + i * 0.08} className="nv2-alerta">
                  <span className="nv2-alerta-ico"><Ico d={a.ico} s={16} /></span>
                  <span>
                    <b style={{ display: 'block', fontSize: 14.5, fontWeight: 550, letterSpacing: '-0.01em' }}>{a.t}</b>
                    <span className="nv2-corpo" style={{ display: 'block', marginTop: 4 }}>{a.d}</span>
                  </span>
                </Revelar>
              ))}
            </Revelar>
          </div>
        </div>
      </section>

      {/* ═══ 09 · CAPTURA AUTOMÁTICA ══════════════════════════════════ */}
      <section className="nv2-sec">
        <div className="nv2-larg">
          <Cabeca
            olho="Automação"
            titulo={<>Até o depósito<br />entra sozinho.</>}
            lead="A Nex Control abre uma sessão de captura, lê o valor do depósito e lança na remessa. Você confere em vez de digitar."
          />

          <Revelar atraso={0.12} style={{ marginTop: 48 }}>
            <div className="nv2-fluxo">
              <div className="nv2-fluxo-no">
                <p className="nv2-mono">01 · Captura</p>
                <p className="nv2-h3" style={{ marginTop: 10 }}>PIX identificado</p>
                <p className="nv2-corpo" style={{ marginTop: 6 }}>O valor do depósito é lido na sessão aberta pelo sistema.</p>
              </div>
              <span className="nv2-fluxo-seta"><Ico d={SETA} s={18} /></span>
              <div className="nv2-fluxo-no">
                <p className="nv2-mono">02 · Lançamento</p>
                <p className="nv2-h3" style={{ marginTop: 10 }}>Remessa atualizada</p>
                <p className="nv2-corpo" style={{ marginTop: 6 }}>O valor entra na remessa da meta, sem digitação manual.</p>
              </div>
            </div>
            <p className="nv2-corpo" style={{ marginTop: 18, maxWidth: '62ch' }}>
              É apoio ao lançamento, não substituição: o administrador continua
              no controle do que entra na operação.
            </p>
          </Revelar>
        </div>
      </section>

      {/* ═══ 10 · CELULAR ═════════════════════════════════════════════ */}
      <section className="nv2-sec">
        <div className="nv2-larg">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 56, alignItems: 'center' }}
            className="nv2-eq-grid">
            <div>
              <Cabeca
                olho="No celular"
                titulo={<>Sua operação não fica<br />presa no escritório.</>}
                lead="O painel foi redesenhado para telefone na 2.0: navegação própria embaixo, ação principal no alcance do polegar e notificação no aparelho."
              />
              <ul className="nv2-marcas" style={{ marginTop: 32 }}>
                {[
                  ['Instala na tela inicial', 'Vira ícone no telefone, sem passar por loja de aplicativo.'],
                  ['Notificação no aparelho', 'Avisos de operação chegam mesmo com o navegador fechado.'],
                  ['A mesma operação', 'Não é uma versão reduzida: é o mesmo sistema, desenhado para a mão.'],
                ].map(([t, d]) => (
                  <li key={t}><i /><span><b>{t}</b><span>{d}</span></span></li>
                ))}
              </ul>
            </div>

            <Revelar atraso={0.1} y={24} style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="nv2-fone">
                <div className="nv2-fone-tela">
                  <Image
                    src="/landing/v2/celular.png"
                    alt="Nex Control no celular: painel com lucro do mês, metas fechadas e meta do dia, com barra de navegação inferior"
                    width={780} height={1688} loading="eager"
                    sizes="268px"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ═══ 11 · ECOSSISTEMA ═════════════════════════════════════════ */}
      <section className="nv2-sec nv2-sec--curta">
        <div className="nv2-larg">
          <Cabeca olho="Ecossistema" titulo="Mais que um dashboard." largura={560} />
          <div className="nv2-bento" style={{ marginTop: 40 }}>
            {MODULOS.map((m, i) => (
              <Revelar key={m.t} atraso={i * 0.06} className="nv2-card nv2-card-pad col2" style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--cinza)' }}><Ico d={m.ico} s={19} /></span>
                <h3 className="nv2-h3" style={{ marginTop: 14 }}>{m.t}</h3>
                <p className="nv2-corpo" style={{ marginTop: 6 }}>{m.d}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 12 · NEX CONTROL 2.0 (institucional) ═════════════════════ */}
      <section className="nv2-sec" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="nv2-n" style={{ top: '50%', left: '50%', width: 760, transform: 'translate(-50%,-50%)' }} aria-hidden>
          <Image src="/brand/nex-v2.png" alt="" width={760} height={760} />
        </div>
        <div className="nv2-larg" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Revelar><Olho ponto={false}>2025 → 2026</Olho></Revelar>
          <Revelar atraso={0.08}>
            <h2 className="nv2-h2" style={{ marginTop: 22 }}>
              Não mudamos apenas<br />a identidade.
            </h2>
          </Revelar>

          <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {['Interface.', 'Performance.', 'Automação.', 'Inteligência.', 'Experiência.'].map((p, i) => (
              <Revelar key={p} atraso={i * 0.09} y={14}>
                <p className="nv2-h2" style={{ fontSize: 'clamp(26px,3.6vw,44px)', color: 'var(--cinza)' }}>{p}</p>
              </Revelar>
            ))}
          </div>

          <Revelar atraso={0.2} style={{ marginTop: 52 }}>
            <p className="nv2-h2">Reconstruímos a Nex.</p>
            <p className="nv2-mono" style={{ marginTop: 20 }}>Nex Control / Version 2.0</p>
          </Revelar>
        </div>
      </section>

      {/* ═══ 13 · PREÇOS ══════════════════════════════════════════════ */}
      <section className="nv2-sec" id="precos">
        <div className="nv2-larg">
          <Cabeca
            olho="Preços"
            titulo="Um plano. Cresce com a equipe."
            lead="Você paga a plataforma e cada operador que adicionar. Quanto maior a equipe, menor o preço por operador."
            largura={620}
          />

          <Revelar atraso={0.12} style={{ marginTop: 46, maxWidth: 560 }}>
            <div className="nv2-card nv2-card-pad" style={{ padding: 34 }}>
              <p className="nv2-mono">Nex Control</p>

              <div className="nv2-preco" style={{ marginTop: 20 }}>
                <b>R$ {moeda(BASE_PRICE)}</b>
                <span>/mês</span>
              </div>
              <p className="nv2-corpo" style={{ marginTop: 10 }}>
                + R$ {moeda(OP_BASE_PRICE)} por operador, com desconto progressivo
                a partir do segundo.
              </p>

              <ul className="nv2-marcas" style={{ marginTop: 26 }}>
                {[
                  'Metas, remessas e fechamento com lucro final calculado',
                  'Operadores com acesso separado do administrador',
                  'Faturamento, custos, redes e relatórios por período',
                  'Ranking da equipe e acompanhamento individual',
                  'Alertas de operação e notificação no celular',
                  'Captura de depósito e painel instalável no telefone',
                ].map(t => (
                  <li key={t}><i /><span><b style={{ fontWeight: 450 }}>{t}</b></span></li>
                ))}
              </ul>

              <div style={{ marginTop: 28 }}>
                <Botao href="/signup" tipo="lime" grande seta className="nv2-btn-bloco">Começar agora</Botao>
              </div>

              <div className="nv2-provas" style={{ marginTop: 20 }}>
                <span className="nv2-prova"><i />Pagamento via PIX</span>
                <span className="nv2-prova"><i />Ativação imediata</span>
                <span className="nv2-prova"><i />Sem fidelidade</span>
              </div>
            </div>
          </Revelar>
        </div>
      </section>

      {/* ═══ 14 · FAQ ═════════════════════════════════════════════════ */}
      <section className="nv2-sec nv2-sec--curta">
        <div className="nv2-larg">
          <Cabeca olho="Dúvidas" titulo="Perguntas diretas." largura={560} />
          <div style={{ marginTop: 40, maxWidth: 800 }}>
            {FAQ.map((f, i) => (
              <Pergunta key={f.q} q={f.q} aberta={faqAberta === i}
                aoAbrir={() => setFaqAberta(faqAberta === i ? -1 : i)}>
                {f.r}
              </Pergunta>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 15 · FECHAMENTO ══════════════════════════════════════════ */}
      <section className="nv2-sec" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="nv2-n" style={{ bottom: -240, left: '50%', width: 900, transform: 'translateX(-50%)' }} aria-hidden>
          <Image src="/brand/nex-v2.png" alt="" width={900} height={900} />
        </div>
        <div className="nv2-larg" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Revelar><Olho>Nex Control 2.0</Olho></Revelar>
          <Revelar atraso={0.08}>
            <h2 className="nv2-h2" style={{ marginTop: 22, fontSize: 'clamp(30px,5vw,58px)' }}>
              Você já tem uma operação.<br />Agora tenha controle sobre ela.
            </h2>
          </Revelar>
          <Revelar atraso={0.16} style={{ marginTop: 36 }}>
            <Botao href="/signup" tipo="lime" grande seta>Começar agora</Botao>
          </Revelar>
          <Revelar atraso={0.22}>
            <div className="nv2-provas" style={{ marginTop: 22, justifyContent: 'center' }}>
              <span className="nv2-prova"><i />PIX</span>
              <span className="nv2-prova"><i />Ativação imediata</span>
              <span className="nv2-prova"><i />Sem fidelidade</span>
            </div>
          </Revelar>
        </div>
      </section>

      {/* ═══ 16 · RODAPÉ ══════════════════════════════════════════════ */}
      <footer className="nv2-rod">
        <div className="nv2-larg nv2-rod-in">
          <span className="nv2-marca">
            <Image src="/brand/nex-v2.png" alt="" width={22} height={22}
              style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span className="nv2-marca-nome" style={{ fontSize: 14 }}>Nex Control</span>
          </span>
          <nav className="nv2-rod-links" aria-label="Rodapé">
            <a href="#produto">Produto</a>
            <Link href="/termos">Termos</Link>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/login">Entrar</Link>
          </nav>
        </div>
        <div className="nv2-larg" style={{ marginTop: 26 }}>
          <p className="nv2-mono">© {new Date().getFullYear()} Nex Control · nexcpa.com.br</p>
        </div>
      </footer>
    </main>
  )
}
