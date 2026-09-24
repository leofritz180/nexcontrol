'use client'
// ─────────────────────────────────────────────────────────────────────────
// CASCA DAS TELAS DE ENTRADA (NexControl 2.0) — usada por /login e /signup.
//
// POR QUE EXISTE: o painel logado já é o bento claro, mas login e cadastro
// ainda eram as telas antigas — a porta velha da casa nova, e é a PRIMEIRA
// coisa que todo cliente vê. Como as duas telas têm exatamente o mesmo
// desenho (coluna clara com o formulário + coluna escura com a ilustração),
// a casca mora aqui: assim o mockup e os tokens existem em UM lugar só.
//
// ATENÇÃO — ela é PURAMENTE VISUAL. Não busca sessão, não grava nada, não
// conhece Supabase. Toda a lógica de autenticação continua nas páginas.
//
// TEMA: /login e /signup são públicas, então o `.nx-bento` (gated por conta
// em lib/theme-v2.js) NÃO está no <html> para o visitante deslogado — os
// tokens globais ali ainda são os do tema ESCURO. Por isso a casca redefine
// os tokens claros no escopo `.nxa`: é o que faz o kit de campos
// (components/ui/campo.js, que lê var(--input)/var(--b2)/var(--t1)) nascer
// claro aqui sem tocar em nenhuma outra tela.
// ─────────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { RED, RED2 } from '../ui/bento'

const TINTA = '#15151a'
const ESCURO = '#131317'

// ── ESTILO ESCOPADO ──────────────────────────────────────────────────────
// Só `.nxa` e filhos. O único seletor global é o fundo do <html>/<body>:
// globals.css crava `background:#000 !important`, e sem isto sobra uma faixa
// preta no rubber-band do celular. Some junto com a página (o <style> é
// desmontado na navegação).
export function EstiloAuth() {
  return (
    <style>{`
      html, html body { background: #f0f0f3 !important; }
      .nxa {
        --void:#f0f0f3; --base:#f0f0f3; --surface:#ffffff; --raised:#fafafa;
        --t1:#15151a; --t2:#6c6c78; --t3:#82828d; --t4:#9b9ba6;
        --b1:rgba(0,0,0,0.07); --b2:rgba(0,0,0,0.10); --b3:rgba(0,0,0,0.14);
        --fill-1:rgba(0,0,0,0.025); --fill-2:rgba(0,0,0,0.045); --fill-3:rgba(0,0,0,0.07);
        --input:#ffffff;
        --brand:#e5391f; --brand-dim:rgba(229,57,31,0.09); --brand-border:rgba(229,57,31,0.26);
        --profit:#3f9b1e; --profit-dim:#e3f7c6; --profit-border:#bfe895;
        --loss:#dc2626; --loss-dim:#fde8e4; --loss-border:rgba(220,38,38,0.22);
        color-scheme: light;
      }
      /* o kit de campos desenha a própria moldura: o controle por dentro é nu */
      .nxa .nx-campo-ctl {
        background: transparent !important; border: none !important;
        box-shadow: none !important; border-radius: 0 !important;
        outline: none !important; padding: 0 !important;
      }
      .nxa input::placeholder, .nxa textarea::placeholder { color: var(--t3); opacity: 1; }
      /* o rótulo do kit nasce em var(--t3): 3,3:1 sobre o cinza do fundo, abaixo
         do AA. Aqui ele sobe pra var(--t2) (4,6:1) sem mexer no kit, que é
         usado pelo painel inteiro. O asterisco vermelho tem cor própria e
         continua vermelho. */
      .nxa label { color: #6c6c78 !important; }
      /* autofill do Chrome pinta a caixa de azul-claro e o texto de escuro do
         tema errado — devolve o branco do campo */
      .nxa input:-webkit-autofill,
      .nxa input:-webkit-autofill:focus {
        -webkit-text-fill-color: #15151a;
        -webkit-box-shadow: 0 0 0 40px #ffffff inset;
        caret-color: #15151a;
      }
      /* Branco fixo por CLASSE, não inline: o remapeador de tema claro do
         globals.css troca "color: rgb(255,255,255)" quando ele está ligado,
         e isso apagaria o texto em cima do vermelho da marca. */
      .nxa-branco, .nxa-branco * { color: #ffffff; }
      .nxa-spin {
        border: 2px solid rgba(255,255,255,0.38);
        border-top-color: #ffffff;
      }
      /* Coluna escura: redefinir os tokens no escopo (mesmo truque do rail do
         bento) deixa os var(--t1)/var(--t2) inline resolverem pra claro. */
      .nxa-escuro {
        --t1:#ffffff; --t2:rgba(255,255,255,0.60); --t3:rgba(255,255,255,0.48);
        --t4:rgba(255,255,255,0.36); --b1:rgba(255,255,255,0.10);
      }
      @media (max-width: 900px) {
        .nxa-col-dir { display: none !important; }
        .nxa-col-esq { padding: 34px 20px !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .nxa *, .nxa *::before, .nxa *::after { animation: none !important; }
      }
    `}</style>
  )
}

// ── MARCA ────────────────────────────────────────────────────────────────
// Mesma assinatura da tela de abertura do V2 (components/v2/CarregandoV2.js):
// símbolo + NEXCONTROL peso 900 + selo "2.0". Continua linkando pra home.
export function MarcaAuth() {
  return (
    <Link href="/" aria-label="NexControl — página inicial" style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
      <img
        src="/brand/nex-mark.png"
        alt="NexControl"
        width={38}
        height={38}
        style={{ width: 38, height: 38, objectFit: 'contain', display: 'block' }}
      />
      <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1, color: TINTA }}>
        <span>NEX</span><span>CONTROL</span>
      </span>
      <span className="nxa-branco" style={{
        fontSize: 9, fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1,
        padding: '4px 7px', borderRadius: 30,
        background: `linear-gradient(135deg, ${RED2}, ${RED})`,
        boxShadow: '0 4px 12px rgba(229,57,31,0.28)',
      }}>2.0</span>
    </Link>
  )
}

// ── ILUSTRAÇÃO DO PAINEL ─────────────────────────────────────────────────
// Desenho em linha do bento: rail escuro, topo, dois cards, lista e a dock
// flutuante. É DESENHO, não screenshot: nenhum número, nome ou valor de
// cliente aparece aqui — só formas.
function PainelIlustrado({ semMovimento }) {
  const entra = (i) => (semMovimento ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay: 0.25 + i * 0.09, ease: [0.33, 1, 0.68, 1] },
  })
  const linha = 'rgba(255,255,255,0.16)'
  const linhaForte = 'rgba(255,255,255,0.30)'
  const cartao = '#1f1f26'
  const borda = 'rgba(255,255,255,0.07)'

  return (
    <svg viewBox="0 0 360 250" width="100%" role="img"
      aria-label="Ilustração do painel do NexControl: menu lateral, cards, lista e dock"
      style={{ display: 'block', maxWidth: 430, margin: '0 auto' }}>
      <defs>
        <linearGradient id="nxaMarca" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={RED2} /><stop offset="100%" stopColor={RED} />
        </linearGradient>
      </defs>

      {/* moldura do app */}
      <rect x="0.5" y="0.5" width="359" height="249" rx="22" fill="#17171d" stroke={borda} />

      {/* rail */}
      <motion.g {...entra(0)}>
        <rect x="10" y="10" width="42" height="230" rx="16" fill="#1d1d24" stroke={borda} />
        <rect x="23" y="24" width="16" height="16" rx="6" fill="url(#nxaMarca)" />
        {[58, 82, 106, 130].map((y, i) => (
          <rect key={y} x="25" y={y} width="12" height="12" rx="4" fill="none" stroke={i === 0 ? linhaForte : linha} strokeWidth="1.4" />
        ))}
        <circle cx="31" cy="222" r="9" fill="rgba(255,255,255,0.08)" />
      </motion.g>

      {/* barra de cima */}
      <motion.g {...entra(1)}>
        <rect x="64" y="12" width="284" height="28" rx="12" fill="rgba(255,255,255,0.035)" stroke={borda} />
        <rect x="76" y="22" width="62" height="8" rx="4" fill={linha} />
        <rect x="286" y="21" width="34" height="10" rx="5" fill="rgba(255,255,255,0.07)" />
        <circle cx="334" cy="26" r="9" fill="rgba(255,255,255,0.10)" />
        {semMovimento
          ? <circle cx="150" cy="26" r="3" fill={RED} />
          : <motion.circle cx="150" cy="26" r="3" fill={RED}
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />}
      </motion.g>

      {/* card grande com a curva */}
      <motion.g {...entra(2)}>
        <rect x="64" y="48" width="176" height="92" rx="16" fill={cartao} stroke={borda} />
        <rect x="78" y="62" width="44" height="6" rx="3" fill={linha} />
        <rect x="78" y="76" width="82" height="13" rx="5" fill="rgba(255,255,255,0.72)" />
        {semMovimento
          ? <path d="M78,126 C96,118 104,128 118,116 C132,104 146,112 162,100 C178,88 200,96 226,80"
              fill="none" stroke="url(#nxaMarca)" strokeWidth="2.4" strokeLinecap="round" />
          : <motion.path d="M78,126 C96,118 104,128 118,116 C132,104 146,112 162,100 C178,88 200,96 226,80"
              fill="none" stroke="url(#nxaMarca)" strokeWidth="2.4" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: 0.75, ease: [0.33, 1, 0.68, 1] }} />}
      </motion.g>

      {/* card pequeno com a rosca */}
      <motion.g {...entra(3)}>
        <rect x="248" y="48" width="100" height="92" rx="16" fill={cartao} stroke={borda} />
        <rect x="262" y="62" width="34" height="6" rx="3" fill={linha} />
        <circle cx="298" cy="104" r="22" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
        {semMovimento
          ? <circle cx="298" cy="104" r="22" fill="none" stroke="url(#nxaMarca)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray="96 138" transform="rotate(-90 298 104)" />
          : <motion.circle cx="298" cy="104" r="22" fill="none" stroke="url(#nxaMarca)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray="96 138" transform="rotate(-90 298 104)"
              initial={{ strokeDashoffset: 138 }} animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.1, delay: 0.8, ease: [0.33, 1, 0.68, 1] }} />}
      </motion.g>

      {/* lista */}
      <motion.g {...entra(4)}>
        <rect x="64" y="148" width="284" height="62" rx="16" fill={cartao} stroke={borda} />
        {[[164, 92, 36], [182, 74, 28], [200, 108, 32]].map(([y, w, wv]) => (
          <g key={y}>
            <circle cx="80" cy={y} r="6" fill="rgba(255,255,255,0.10)" />
            <rect x="94" y={y - 4} width={w} height="8" rx="4" fill={linha} />
            <rect x={332 - wv} y={y - 4} width={wv} height="8" rx="4" fill={linhaForte} />
          </g>
        ))}
      </motion.g>

      {/* dock flutuante */}
      <motion.g {...(semMovimento ? {} : {
        initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay: 0.85, ease: [0.33, 1, 0.68, 1] },
      })}>
        <rect x="120" y="218" width="160" height="22" rx="11" fill="#26262e" stroke="rgba(255,255,255,0.09)" />
        {[148, 174, 200, 226, 252].map((x, i) => (
          <circle key={x} cx={x} cy="229" r="3.5" fill={i === 2 ? RED : 'rgba(255,255,255,0.26)'} />
        ))}
      </motion.g>
    </svg>
  )
}

// ── BOTÃO PRINCIPAL ──────────────────────────────────────────────────────
// É `type="submit"` de propósito (o AcaoBtn do bento é type="button" e não
// serviria aqui): quem envia o formulário é este botão, como antes.
// tipo/onClick existem pro /invite: no estado "conta criada" o botao leva
// pro login e nao esta dentro de nenhum form — submit ali nao faria nada.
export function BotaoAuth({ carregando, textoCarregando, children, onClick, tipo = 'submit' }) {
  const semMovimento = useReducedMotion()
  const parado = carregando || semMovimento
  return (
    <motion.button
      type={tipo} onClick={onClick} disabled={carregando} className="nxa-branco"
      whileHover={parado ? undefined : { y: -2, boxShadow: '0 14px 32px rgba(229,57,31,0.36)' }}
      whileTap={parado ? undefined : { scale: 0.985 }}
      style={{
        width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        padding: '14px 22px', borderRadius: 30, border: 'none',
        cursor: carregando ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em',
        background: `linear-gradient(135deg, ${RED2}, ${RED})`,
        boxShadow: '0 10px 26px rgba(229,57,31,0.30)',
        opacity: carregando ? 0.72 : 1,
      }}>
      {carregando ? (<><Girando />{textoCarregando}</>) : children}
    </motion.button>
  )
}

// Rodinha de espera. Em movimento reduzido ela para de girar (fica só o anel).
export function Girando({ tamanho = 14 }) {
  const semMovimento = useReducedMotion()
  const estilo = { width: tamanho, height: tamanho, borderRadius: '50%', flexShrink: 0 }
  if (semMovimento) return <span className="nxa-spin" style={estilo} />
  return (
    <motion.span className="nxa-spin" style={estilo}
      animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
  )
}

// ── AVISO (erro / sucesso) ───────────────────────────────────────────────
// Mesma faixa de antes, agora nos tokens do 2.0. Quem controla a entrada e a
// saída continua sendo o <AnimatePresence> da página.
export function AvisoAuth({ tipo = 'erro', children }) {
  const erro = tipo === 'erro'
  return (
    <div role="alert" style={{
      display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '11px 13px', borderRadius: 14,
      background: erro ? 'var(--loss-dim)' : 'var(--profit-dim)',
      border: `1px solid ${erro ? 'var(--loss-border)' : 'var(--profit-border)'}`,
      fontSize: 12.5, fontWeight: 600, lineHeight: 1.5,
      color: erro ? 'var(--loss)' : 'var(--profit)',
    }}>
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
        {erro
          ? <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>
          : <><circle cx="12" cy="12" r="10" /><polyline points="16 9.5 10.8 15 8 12.3" /></>}
      </svg>
      <span>{children}</span>
    </div>
  )
}

// ── OLHO DA SENHA ────────────────────────────────────────────────────────
// Vai no `sufixo` do <Campo>. type="button" — nunca envia o formulário.
export function OlhoSenha({ mostrando, aoAlternar }) {
  return (
    <button
      type="button" onClick={aoAlternar}
      aria-label={mostrando ? 'Esconder senha' : 'Mostrar senha'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', margin: -10, padding: 0,
        width: 40, height: 40, flexShrink: 0,
        cursor: 'pointer', color: 'var(--t3)', borderRadius: 8,
      }}>
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {mostrando
          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
      </svg>
    </button>
  )
}

// ── LINK SECUNDÁRIO ──────────────────────────────────────────────────────
export function LinkAuth({ href, children }) {
  return (
    <Link href={href} style={{ color: 'var(--t1)', fontWeight: 800, textDecoration: 'none', borderBottom: '1.5px solid rgba(229,57,31,0.45)', display: 'inline-block', padding: '10px 2px', margin: '-10px -2px' }}>
      {children}
    </Link>
  )
}

// ── A CASCA ──────────────────────────────────────────────────────────────
// `sobreposicao` é renderizada como filha direta do <main>, FORA da coluna
// animada: um elemento com transform vira bloco de contenção e quebraria o
// position:fixed do modal de "esqueci a senha".
export default function AuthSplitV2({ children, frase, apoio, rodape, sobreposicao }) {
  const semMovimento = useReducedMotion()

  return (
    <main className="nxa" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'stretch',
      background: '#f0f0f3', color: '#15151a', position: 'relative',
    }}>
      <EstiloAuth />

      {/* ── COLUNA CLARA: marca + formulário ── */}
      <section className="nxa-col-esq" style={{
        flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '48px 32px',
      }}>
        <motion.div
          initial={semMovimento ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          style={{ width: '100%', maxWidth: 396 }}>
          <div style={{ marginBottom: 34 }}><MarcaAuth /></div>
          {children}
          {rodape && (
            <p style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 26, letterSpacing: '0.04em' }}>
              {rodape}
            </p>
          )}
        </motion.div>
      </section>

      {/* ── COLUNA ESCURA: ilustração + frase (some abaixo de 900px) ── */}
      <section className="nxa-col-dir" style={{ flex: '1 1 0', minWidth: 0, padding: 16 }}>
        <div className="nxa-escuro" style={{
          height: '100%', minHeight: 'calc(100vh - 32px)', borderRadius: 28,
          background: ESCURO, overflow: 'hidden', position: 'relative',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '48px 44px', boxShadow: '0 30px 80px rgba(0,0,0,0.22)',
        }}>
          {/* brilho da marca no canto — sutil, só pra superfície não ficar chapada */}
          <div aria-hidden style={{
            position: 'absolute', top: '-18%', right: '-12%', width: '60%', height: '52%',
            background: `radial-gradient(circle, rgba(229,57,31,0.20) 0%, rgba(229,57,31,0) 68%)`,
            pointerEvents: 'none',
          }} />

          <PainelIlustrado semMovimento={semMovimento} />

          <motion.div
            initial={semMovimento ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.33, 1, 0.68, 1] }}
            style={{ marginTop: 40, maxWidth: 430, marginLeft: 'auto', marginRight: 'auto', position: 'relative' }}>
            <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, color: 'var(--t1)', margin: 0 }}>
              {frase}
            </p>
            {apoio && (
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--t2)', margin: '12px 0 0' }}>
                {apoio}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {sobreposicao}
    </main>
  )
}
