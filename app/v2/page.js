'use client'
// ─────────────────────────────────────────────────────────────────────────
// NEXCONTROL 2.0 — página de apresentação da nova versão.
//
// POR QUE É CLARA: o 2.0 É o bento claro. Uma página escura anunciando um
// redesenho claro seria uma promessa que ela mesma não cumpre. Aqui a página
// é a demonstração da coisa que ela anuncia.
//
// ROTA PÚBLICA: `.nx-bento` (gated por conta em lib/theme-v2.js) NÃO está no
// <html> para visitante deslogado, e os tokens globais ali são do tema
// ESCURO. Por isso a página redefine os tokens claros no escopo `.nv2` —
// mesmo padrão de components/v2/AuthSplitV2.js.
//
// REGRA DE CONTEÚDO: nada aqui é inventado. Toda função descrita existe e
// está no ar. Não há número de clientes, depoimento, prêmio nem comparação
// de desempenho — se não dá pra provar, não entra.
// ─────────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

const MOLA = [0.33, 1, 0.68, 1]
const RED = '#e5391f'
const RED2 = '#ff7a4d'

// ── tokens e responsivo, escopados em .nv2 ───────────────────────────────
function EstiloV2() {
  return (
    <style>{`
      html, html body { background: #f0f0f3 !important; }
      .nv2 {
        --base:#f0f0f3; --surface:#ffffff; --raised:#fafafa;
        --t1:#15151a; --t2:#6c6c78; --t3:#82828d; --t4:#9b9ba6;
        --b1:rgba(0,0,0,0.07); --b2:rgba(0,0,0,0.10);
        --fill-1:rgba(0,0,0,0.025); --fill-2:rgba(0,0,0,0.045);
        --brand:#e5391f; --brand-dim:rgba(229,57,31,0.09); --brand-border:rgba(229,57,31,0.26);
        --profit:#3f9b1e; --profit-dim:#e3f7c6;
        --mono:'JetBrains Mono', ui-monospace, monospace;
        color-scheme: light;
        background:#f0f0f3; color:var(--t1);
        min-height:100vh; position:relative; z-index:1;
      }
      .nv2 *, .nv2 *::before, .nv2 *::after { box-sizing:border-box; }
      .nv2 .nv2-branco, .nv2 .nv2-branco * { color:#ffffff; }

      .nv2-larg { max-width:1080px; margin:0 auto; padding:0 24px; }
      .nv2-cartao {
        background:var(--surface); border:1px solid var(--b1); border-radius:24px;
        box-shadow:0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05);
      }
      .nv2-grade3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
      .nv2-grade2 { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
      .nv2-heroi { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }

      @media (max-width: 960px) {
        .nv2-heroi { grid-template-columns:1fr; gap:36px; }
        .nv2-grade3 { grid-template-columns:repeat(2,1fr); }
      }
      @media (max-width: 640px) {
        .nv2-larg { padding:0 16px; }
        .nv2-grade3, .nv2-grade2 { grid-template-columns:1fr; }
        .nv2-h1 { font-size:38px !important; }
        .nv2-h2 { font-size:26px !important; }
        .nv2-esconde-mob { display:none !important; }
        .nv2-cta-col { flex-direction:column !important; align-items:stretch !important; }
        .nv2-cta-col > * { width:100% !important; justify-content:center !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .nv2 *, .nv2 *::before, .nv2 *::after { animation:none !important; transition:none !important; }
      }
    `}</style>
  )
}

// ── ilustração do painel ─────────────────────────────────────────────────
// DESENHO, não captura: nenhum número, nome ou valor de cliente aparece aqui.
function PainelIlustrado({ parado }) {
  const entra = (i) => (parado ? {} : {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.2 + i * 0.1, ease: MOLA },
  })
  const linha = 'rgba(0,0,0,0.10)'
  const forte = 'rgba(0,0,0,0.20)'

  return (
    <svg viewBox="0 0 380 260" width="100%" role="img"
      aria-label="Desenho do painel do NexControl 2.0: menu lateral recolhido, cartões, gráfico e barra de abas flutuante"
      style={{ display: 'block' }}>
      <defs>
        <linearGradient id="nv2Marca" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={RED2} /><stop offset="100%" stopColor={RED} />
        </linearGradient>
      </defs>

      {/* fundo da página */}
      <rect x="0.5" y="0.5" width="379" height="259" rx="20" fill="#f0f0f3" stroke="rgba(0,0,0,0.08)" />

      {/* rail escuro flutuante */}
      <motion.g {...entra(0)}>
        <rect x="10" y="10" width="40" height="240" rx="16" fill="#131317" />
        <rect x="22" y="24" width="16" height="16" rx="6" fill="url(#nv2Marca)" />
        <rect x="16" y="56" width="28" height="24" rx="9" fill="#ffffff" />
        {[90, 118, 146].map(y => (
          <rect key={y} x="23" y={y + 6} width="14" height="12" rx="4" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.4" />
        ))}
        <circle cx="30" cy="232" r="9" fill="rgba(255,255,255,0.10)" />
      </motion.g>

      {/* saudação */}
      <motion.g {...entra(1)}>
        <rect x="62" y="16" width="86" height="9" rx="4.5" fill={forte} />
        <rect x="62" y="31" width="132" height="6" rx="3" fill={linha} />
        <rect x="286" y="14" width="80" height="24" rx="12" fill="url(#nv2Marca)" />
      </motion.g>

      {/* cartão do lucro (largo) + dois menores */}
      <motion.g {...entra(2)}>
        <rect x="62" y="52" width="150" height="70" rx="14" fill="#ffffff" stroke="rgba(0,0,0,0.06)" />
        <rect x="74" y="64" width="44" height="6" rx="3" fill={RED} opacity="0.7" />
        <rect x="74" y="78" width="86" height="15" rx="4" fill="#3f9b1e" opacity="0.85" />
        <path d="M62 112 C86 106, 100 116, 122 100 C146 84, 168 96, 190 88 L212 84 L212 122 L62 122 Z" fill="#3f9b1e" opacity="0.10" />
        <path d="M62 112 C86 106, 100 116, 122 100 C146 84, 168 96, 190 88 L212 84" fill="none" stroke="#3f9b1e" strokeWidth="1.8" opacity="0.5" strokeLinecap="round" />
      </motion.g>
      <motion.g {...entra(3)}>
        <rect x="220" y="52" width="70" height="70" rx="14" fill="#ffffff" stroke="rgba(0,0,0,0.06)" />
        <rect x="231" y="63" width="20" height="20" rx="7" fill="rgba(0,0,0,0.05)" />
        <rect x="231" y="92" width="36" height="11" rx="3" fill={forte} />
        <rect x="298" y="52" width="70" height="70" rx="14" fill="#ffffff" stroke="rgba(0,0,0,0.06)" />
        <circle cx="333" cy="87" r="20" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="8" />
        <circle cx="333" cy="87" r="20" fill="none" stroke="url(#nv2Marca)" strokeWidth="8"
          strokeDasharray="126" strokeDashoffset="42" strokeLinecap="round" transform="rotate(-90 333 87)" />
      </motion.g>

      {/* lista */}
      <motion.g {...entra(4)}>
        <rect x="62" y="130" width="306" height="80" rx="14" fill="#ffffff" stroke="rgba(0,0,0,0.06)" />
        {[146, 168, 190].map((y, i) => (
          <g key={y}>
            <rect x="74" y={y - 5} width="14" height="14" rx="5" fill="rgba(0,0,0,0.05)" />
            <rect x="96" y={y - 3} width={120 - i * 18} height="6" rx="3" fill={linha} />
            <rect x={312 + i * 6} y={y - 3} width={44 - i * 6} height="6" rx="3" fill={i === 2 ? RED : '#3f9b1e'} opacity="0.55" />
          </g>
        ))}
      </motion.g>

      {/* dock flutuante */}
      <motion.g {...entra(5)}>
        <rect x="118" y="222" width="194" height="26" rx="13" fill="#15151a" />
        <rect x="124" y="227" width="56" height="16" rx="8" fill="#ffffff" />
        {[192, 232, 268].map(x => <rect key={x} x={x} y="233" width="28" height="4" rx="2" fill="rgba(255,255,255,0.34)" />)}
      </motion.g>
    </svg>
  )
}

// ── peças pequenas ───────────────────────────────────────────────────────
function Selo({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 99,
      background: 'var(--brand-dim)', border: '1px solid var(--brand-border)',
      fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', color: 'var(--brand)',
      fontFamily: 'var(--mono)',
    }}>{children}</span>
  )
}

function Ico({ d, c = 'var(--brand)', s = 19 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
  )
}

function Card({ icone, titulo, texto, atraso = 0, parado }) {
  return (
    <motion.div
      className="nv2-cartao"
      initial={parado ? false : { opacity: 0, y: 14 }}
      whileInView={parado ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: atraso, ease: MOLA }}
      style={{ padding: 22 }}>
      <span style={{
        width: 40, height: 40, borderRadius: 13, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--brand-dim)', border: '1px solid var(--brand-border)',
      }}><Ico d={icone} /></span>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', margin: '16px 0 6px', letterSpacing: '-0.02em' }}>{titulo}</h3>
      <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: 0, lineHeight: 1.55 }}>{texto}</p>
    </motion.div>
  )
}

function Secao({ olho, titulo, apoio, children, id }) {
  return (
    <section id={id} style={{ padding: '72px 0 0' }}>
      <div className="nv2-larg">
        <Selo>{olho}</Selo>
        <h2 className="nv2-h2" style={{ fontSize: 33, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--t1)', margin: '16px 0 8px', lineHeight: 1.1 }}>{titulo}</h2>
        {apoio && <p style={{ fontSize: 15, color: 'var(--t2)', margin: '0 0 28px', maxWidth: 640, lineHeight: 1.6 }}>{apoio}</p>}
        {children}
      </div>
    </section>
  )
}

// ── ícones ───────────────────────────────────────────────────────────────
const I_JANELA = <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></>
const I_LUA = <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
const I_MENU = <><path d="M4 6h10M4 12h16M4 18h7" /></>
const I_TECLA = <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6" /></>
const I_GRAFICO = <><path d="M3 3v18h18" /><path d="M7 15l3-4 4 4 5-7" /></>
const I_PASSOS = <><circle cx="5" cy="12" r="2.4" /><circle cx="12" cy="12" r="2.4" /><circle cx="19" cy="12" r="2.4" /><path d="M7.4 12h2.2M14.4 12h2.2" /></>
const I_LUPA = <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>
const I_ESCUDO = <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>
const I_CELULAR = <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></>
const I_CHECK = <path d="M20 6 9 17l-5-5" />

export default function V2Page() {
  const parado = useReducedMotion()

  return (
    <main className="nv2">
      <EstiloV2 />

      {/* ── cabeçalho ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(240,240,243,0.82)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--b1)',
      }}>
        <div className="nv2-larg" style={{ display: 'flex', alignItems: 'center', gap: 14, height: 62 }}>
          <Link href="/" aria-label="NexControl — página inicial" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/brand/nex-mark.png" alt="" width={30} height={30} style={{ width: 30, height: 30, objectFit: 'contain', display: 'block' }} />
            <span style={{ fontSize: 16.5, fontWeight: 900, letterSpacing: '-0.045em', color: 'var(--t1)' }}>NEXCONTROL</span>
            <span className="nv2-branco" style={{
              fontSize: 9, fontWeight: 900, letterSpacing: '0.04em', padding: '4px 7px', borderRadius: 30,
              background: `linear-gradient(135deg, ${RED2}, ${RED})`,
            }}>2.0</span>
          </Link>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" className="nv2-esconde-mob" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t2)', textDecoration: 'none' }}>
              Site
            </Link>
            <Link href="/login" style={{
              fontSize: 13.5, fontWeight: 800, color: '#fff', textDecoration: 'none',
              padding: '9px 18px', borderRadius: 30,
              background: `linear-gradient(135deg, ${RED2}, ${RED})`,
              boxShadow: '0 8px 20px rgba(229,57,31,0.26)',
            }} className="nv2-branco">Entrar</Link>
          </span>
        </div>
      </header>

      {/* ── herói ── */}
      <section style={{ padding: '58px 0 0' }}>
        <div className="nv2-larg nv2-heroi">
          <div>
            <Selo>NOVA VERSÃO</Selo>
            <h1 className="nv2-h1" style={{
              fontSize: 52, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.03,
              color: 'var(--t1)', margin: '18px 0 16px',
            }}>
              O mesmo controle.<br />Outra clareza.
            </h1>
            <p style={{ fontSize: 16.5, color: 'var(--t2)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 480 }}>
              O NexControl 2.0 é o painel inteiro redesenhado: fundo claro, cartões que
              contam o que aconteceu e menos cliques entre você e o número que importa.
              Nenhuma função saiu do lugar.
            </p>
            <div className="nv2-cta-col" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/login" className="nv2-branco" style={{
                display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 26px', borderRadius: 30,
                fontSize: 14.5, fontWeight: 800, textDecoration: 'none',
                background: `linear-gradient(135deg, ${RED2}, ${RED})`,
                boxShadow: '0 12px 30px rgba(229,57,31,0.3)',
              }}>
                Entrar no painel
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <a href="#mudou" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 22px', borderRadius: 30,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                color: 'var(--t1)', background: 'var(--surface)', border: '1px solid var(--b2)',
              }}>Ver o que mudou</a>
            </div>
          </div>

          <motion.div
            initial={parado ? false : { opacity: 0, scale: 0.97 }}
            animate={parado ? {} : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: MOLA }}
            className="nv2-cartao"
            style={{ padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 30px 70px rgba(0,0,0,0.13)' }}>
            <PainelIlustrado parado={parado} />
          </motion.div>
        </div>
      </section>

      {/* ── o que mudou ── */}
      <Secao
        id="mudou"
        olho="O QUE MUDOU"
        titulo="Nove mudanças que você sente no primeiro minuto"
        apoio="Tudo listado aqui já está no ar. Nada é plano futuro."
      >
        <div className="nv2-grade3">
          <Card parado={parado} icone={I_JANELA} atraso={0}
            titulo="O painel ficou claro"
            texto="As 21 telas do painel foram redesenhadas em cartões: superfície branca, cantos largos e um respiro que deixa o número principal aparecer sozinho." />
          <Card parado={parado} icone={I_LUA} atraso={0.05}
            titulo="Nex Noir, se preferir escuro"
            texto="O escuro deixou de ser o único jeito e virou escolha sua. Não é o tema antigo de volta: é o mesmo desenho novo, com as superfícies invertidas." />
          <Card parado={parado} icone={I_MENU} atraso={0.1}
            titulo="O menu sai da frente"
            texto="A barra lateral fica recolhida em ícones e abre com os nomes quando o mouse chega perto. As abas viraram uma barra flutuante embaixo." />
          <Card parado={parado} icone={I_TECLA} atraso={0}
            titulo="Ctrl+K e atalhos"
            texto="Uma busca de comandos abre em qualquer tela. G mais uma letra pula entre módulos, N cria meta, ? mostra a lista inteira." />
          <Card parado={parado} icone={I_GRAFICO} atraso={0.05}
            titulo="Cartões que contam a história"
            texto="Rosca de concentração, pódio da equipe, calendário de calor dos últimos 30 dias, curva de tendência e um termômetro do que precisa de atenção." />
          <Card parado={parado} icone={I_PASSOS} atraso={0.1}
            titulo="Criar meta em três passos"
            texto="A criação virou um passo a passo, e o fechamento ganhou uma tela de conclusão — o momento em que o lucro final aparece." />
          <Card parado={parado} icone={I_LUPA} atraso={0}
            titulo="Busca em toda lista longa"
            texto="Qualquer lista com mais de oito linhas ganha um campo de busca. Ele ignora acento: procurar por “joao” acha “João”." />
          <Card parado={parado} icone={I_ESCUDO} atraso={0.05}
            titulo="Confirmações de verdade"
            texto="As caixas cinzas do navegador saíram. No lugar, uma confirmação que diz o que vai ser apagado, e avisos com botão de desfazer." />
          <Card parado={parado} icone={I_CELULAR} atraso={0.1}
            titulo="No celular, barra de baixo"
            texto="No telefone a barra de abas desce para o rodapé — o lugar onde o polegar alcança e onde todo aplicativo põe." />
        </div>
      </Secao>

      {/* ── o que NÃO mudou ── */}
      <Secao
        olho="O QUE NÃO MUDOU"
        titulo="Nada saiu do lugar"
        apoio="A parte mais importante de um redesenho é o que ele preserva."
      >
        <div className="nv2-cartao" style={{ padding: '28px 26px' }}>
          {[
            ['Seus dados', 'Metas, remessas, operadores, custos e histórico continuam exatamente os mesmos. Nada foi migrado, convertido ou recalculado.'],
            ['O cálculo do lucro', 'A fórmula do lucro final não foi tocada. Resultado das remessas mais salário e baú, menos custo fixo e taxa de agente.'],
            ['Cada função', 'Convite, folha de pagamento, configurações de equipe, lixeira, planilha do dia, premiações e Aulas VIP continuam onde estavam.'],
            ['O que o operador vê', 'Operador continua sem enxergar salário, baú e lucro final. A regra de quem vê o quê é a mesma.'],
          ].map(([t, d], i) => (
            <motion.div key={t}
              initial={parado ? false : { opacity: 0, x: -10 }}
              whileInView={parado ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: MOLA }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '16px 0', borderBottom: i < 3 ? '1px solid var(--b1)' : 'none',
              }}>
              <span style={{
                width: 26, height: 26, borderRadius: 9, flexShrink: 0, marginTop: 1,
                background: 'var(--profit-dim)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}><Ico d={I_CHECK} c="var(--profit)" s={15} /></span>
              <span>
                <strong style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{t}</strong>
                <span style={{ display: 'block', fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.55, marginTop: 3 }}>{d}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </Secao>

      {/* ── liberação ── */}
      <Secao
        olho="LIBERAÇÃO"
        titulo="Está saindo aos poucos"
        apoio="O 2.0 está sendo liberado por conta, não de uma vez. Enquanto a sua não entra, o painel continua funcionando normalmente do jeito que você conhece — nada quebra e nada some."
      >
        <div className="nv2-grade2">
          <div className="nv2-cartao" style={{ padding: 22 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--brand)', margin: '0 0 10px' }}>JÁ NO AR PRA TODO MUNDO</p>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
              As telas de entrada — login, cadastro, redefinir senha e aceitar convite —
              e a central de notificações já estão no visual novo para todas as contas.
            </p>
          </div>
          <div className="nv2-cartao" style={{ padding: 22 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--t3)', margin: '0 0 10px' }}>CHEGANDO POR CONTA</p>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
              O painel completo está em liberação gradual. Quando chegar na sua conta,
              você vê a mudança ao entrar — não precisa fazer nada, instalar nada
              nem atualizar nada.
            </p>
          </div>
        </div>
      </Secao>

      {/* ── fechamento ── */}
      <section style={{ padding: '72px 0 84px' }}>
        <div className="nv2-larg">
          <div style={{
            borderRadius: 26, padding: '46px 34px', textAlign: 'center',
            background: `linear-gradient(135deg, ${RED2}, ${RED})`,
            boxShadow: '0 20px 50px rgba(229,57,31,0.28)',
          }}>
            <h2 className="nv2-branco nv2-h2" style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', lineHeight: 1.1 }}>
              Entre e veja onde a sua conta está
            </h2>
            <p className="nv2-branco" style={{ fontSize: 15, margin: '0 0 26px', opacity: 0.9, lineHeight: 1.55 }}>
              Se o 2.0 já chegou, ele aparece na hora que você entrar.
            </p>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 30px', borderRadius: 30,
              fontSize: 14.5, fontWeight: 800, textDecoration: 'none',
              color: '#15151a', background: '#ffffff',
              boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
            }}>
              Entrar no painel
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#15151a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── rodapé ── */}
      <footer style={{ borderTop: '1px solid var(--b1)', padding: '26px 0 40px' }}>
        <div className="nv2-larg" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>NexControl · nexcpa.com.br</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 18 }}>
            <Link href="/" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none' }}>Site</Link>
            <Link href="/termos" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none' }}>Termos</Link>
            <Link href="/privacidade" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none' }}>Privacidade</Link>
          </span>
        </div>
      </footer>
    </main>
  )
}
