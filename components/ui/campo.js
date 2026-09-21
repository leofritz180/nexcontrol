'use client'
// ─────────────────────────────────────────────────────────────────────────
// KIT CAMPO — os campos de formulário do NexControl 2.0.
//
// POR QUE EXISTE: hoje o painel tem 6 combinações de padding/raio soltas
// ('14px 16px'/12, '10px 12px'/8, '10px 12px'/10, '12px 14px'/10, ...), então
// dois formulários lado a lado não parecem do mesmo produto. Aqui a caixa é
// UMA só: 44px de altura, raio 14, fundo var(--input), borda var(--b2).
// Fala a mesma língua do kit bento (SOMBRA, TIPO, Ico, RED, MONO).
//
// REGRAS DA CASA que todo bloco daqui respeita:
//  · dinheiro/número entra como TEXTO (type="text" inputMode="decimal").
//    type="number" é proibido: a roda do mouse alterava o valor (bug antigo).
//  · todo botão daqui é type="button" — nenhum deles submete o formulário.
//  · prefers-reduced-motion desliga shake, mola e transições.
//
// Nada aqui busca nem grava dados: é só a casca visual. A página continua
// dona do estado (valor CRU em string) e do parse na hora de salvar.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useId, useRef, useState } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { Ico, MONO, RED, SOMBRA, TIPO } from './bento'

// ── TOKENS DA CAIXA ──────────────────────────────────────────────────────
// Exportados porque, enquanto as páginas não migram, um campo avulso ainda
// pode ser montado à mão — e assim ele nasce igual aos daqui.
export const ALTURA = 44
export const RAIO = 14
export const ANEL = 'rgba(229,57,31,0.12)' // = RED do bento a 12%
export const TRANSICAO = 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease'
export const MOLA = { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }
export const PRETO_ATIVO = '#15151a' // já está na lista de exceções do tema claro

// Estilo único da caixa. Foco: borda vira var(--brand) + anel externo.
// Erro manda na borda (vence o foco) pra mancha vermelha não sumir ao clicar.
export function estiloCaixa({ foco, erro, desabilitado, semMovimento, extra }) {
  const borda = erro ? 'var(--loss)' : foco ? 'var(--brand)' : 'var(--b2)'
  return {
    display: 'flex', alignItems: 'center', gap: 9,
    width: '100%', minHeight: ALTURA, boxSizing: 'border-box',
    padding: '0 14px', borderRadius: RAIO,
    background: 'var(--input)', border: `1px solid ${borda}`,
    boxShadow: foco ? `0 0 0 3px ${erro ? 'rgba(239,68,68,0.12)' : ANEL}` : '0 0 0 0 rgba(0,0,0,0)',
    transition: semMovimento ? 'none' : TRANSICAO,
    opacity: desabilitado ? 0.55 : 1,
    cursor: desabilitado ? 'not-allowed' : 'text',
    ...extra,
  }
}

// Estilo do controle nu por dentro da caixa (input/select/textarea).
// Ele não tem borda nem fundo: quem desenha é a caixa.
const controleNu = (mono) => ({
  flex: 1, minWidth: 0, width: '100%',
  background: 'transparent', border: 'none', outline: 'none', padding: 0, margin: 0,
  color: 'var(--t1)', fontSize: 14, fontWeight: mono ? 700 : 600,
  fontFamily: mono ? MONO : 'inherit',
  letterSpacing: mono ? '-0.01em' : 'normal',
})

// ── LEITURA DE DINHEIRO ──────────────────────────────────────────────────
// `lerMoeda` é o espelho EXATO do parseVal do projeto
// (app/meta/[id]/page.js:815 e app/equipe/page.js:23), só que tolerando o
// "R$ " e os espaços que o usuário às vezes cola. Mesma entrada, mesmo
// número — migrar uma página pra cá não muda nenhuma conta.
export const lerMoeda = (v) => {
  const s = String(v ?? '').replace(/R\$|\s/g, '').trim() || '0'
  if (s.includes(',')) return Number(s.replace(/\./g, '').replace(',', '.')) || 0
  return Number(s) || 0
}

// Variante ESTRITA da regra escrita no CLAUDE.md: "1.055" é mil e cinquenta e
// cinco, não 1,055. O parseVal atual devolve 1.055 nesse caso (só trata o
// ponto como milhar quando existe vírgula na string). Só difere do lerMoeda
// quando a string é claramente um agrupamento de milhar (1.055 / 12.500.000).
// Deixada opt-in de propósito: trocar o parse de uma tela de produção muda
// valor gravado, e isso é decisão do dono, não do kit.
export const lerMoedaComMilhar = (v) => {
  const s = String(v ?? '').replace(/R\$|\s/g, '').trim()
  if (!s.includes(',') && /^-?\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, '')) || 0
  return lerMoeda(s)
}

// Só tira o que não pode existir num número BR. Não formata, não arredonda:
// o valor que a página guarda continua sendo o que o usuário digitou.
const limparMoeda = (s) => String(s ?? '').replace(/[^\d.,-]/g, '')

// ── SHAKE DO ERRO ────────────────────────────────────────────────────────
// Treme 2px só no instante em que o erro APARECE. Guardar o estado anterior
// num ref evita o campo tremer a cada re-render enquanto o erro continua lá.
function useTremor(erro) {
  const semMovimento = useReducedMotion()
  const controles = useAnimationControls()
  const tinhaErro = useRef(false)
  useEffect(() => {
    const tem = !!erro
    const apareceu = tem && !tinhaErro.current
    tinhaErro.current = tem
    if (!apareceu || semMovimento) return
    controles.start({ x: [0, -2, 2, -2, 2, 0], transition: { duration: 0.3, ease: 'easeInOut' } })
  }, [erro, semMovimento, controles])
  return controles
}

// ── ENVELOPE ─────────────────────────────────────────────────────────────
// Rótulo em cima, caixa no meio, erro/ajuda embaixo. Todo bloco usa este
// mesmo envelope — é ele que garante o alinhamento entre campos diferentes.
function Envelope({ rotulo, obrigatorio, erro, ajuda, para, children }) {
  const controles = useTremor(erro)
  // Sem `para` (caso das Pílulas, que não têm um controle único) o rótulo vira
  // <span>: um <label> sem destino confunde o leitor de tela.
  const Rot = para ? 'label' : 'span'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
      {rotulo && (
        <Rot htmlFor={para} style={{ ...TIPO.rotulo, letterSpacing: '0.12em', color: 'var(--t3)', display: 'inline-flex', gap: 4 }}>
          {rotulo}{obrigatorio && <span style={{ color: RED }}>*</span>}
        </Rot>
      )}
      <motion.div animate={controles} style={{ minWidth: 0 }}>{children}</motion.div>
      {erro
        ? <span role="alert" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--loss)' }}>{erro}</span>
        : ajuda ? <span style={{ fontSize: 11.5, color: 'var(--t4)', lineHeight: 1.45 }}>{ajuda}</span> : null}
    </div>
  )
}

// Clicar na moldura (o padding de 14px) também foca o controle.
const focarPeloPai = (ref) => (e) => {
  if (e.target !== ref.current && ref.current) { e.preventDefault(); ref.current.focus() }
}

// ── 1. CAMPO ─────────────────────────────────────────────────────────────
// Input de texto. `aoMudar` recebe a STRING já pronta (não o event), porque
// 99% das telas fazem setX(e.target.value) e isso só gera ruído.
// `icone` recebe os <path>/<circle> do Ico (mesmo padrão do AcaoBtn do bento).
// `autoComplete` e `minLength` são repasses diretos pro <input>: o /login e o
// /signup dependem deles (gerenciador de senha do navegador e o mínimo de 6
// caracteres da senha). Opcionais — quem não passa não muda em nada.
export function Campo({
  rotulo, valor, aoMudar, placeholder, icone, sufixo, erro, ajuda,
  tipo = 'text', desabilitado = false, obrigatorio = false, inputMode,
  autoFoco = false, id, nome, mono = false, aoTeclar, aoDesfocar, style,
  autoComplete, minLength,
}) {
  const semMovimento = useReducedMotion()
  const [foco, setFoco] = useState(false)
  const ref = useRef(null)
  const auto = useId()
  const idCampo = id || auto

  // Trava da casa: type="number" some com a roda do mouse. Se alguém tentar,
  // o kit converte pra texto decimal em vez de deixar o bug voltar.
  let tipoReal = tipo
  let modoReal = inputMode
  if (tipo === 'number') {
    tipoReal = 'text'; modoReal = inputMode || 'decimal'
    if (process.env.NODE_ENV !== 'production') console.warn('[campo] type="number" é proibido no NexControl — convertido para text/decimal.')
  }

  return (
    <Envelope rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda} para={idCampo}>
      <div onMouseDown={focarPeloPai(ref)} style={estiloCaixa({ foco, erro, desabilitado, semMovimento, extra: style })}>
        {icone && <span style={{ color: foco ? 'var(--brand)' : 'var(--t4)', display: 'inline-flex', flexShrink: 0, transition: semMovimento ? 'none' : 'color 160ms ease' }}><Ico d={icone} s={16} /></span>}
        <input className="nx-campo-ctl"
          ref={ref} id={idCampo} name={nome} type={tipoReal} inputMode={modoReal}
          value={valor ?? ''} placeholder={placeholder} disabled={desabilitado}
          autoFocus={autoFoco} required={obrigatorio}
          autoComplete={autoComplete} minLength={minLength}
          aria-invalid={!!erro || undefined}
          onChange={(e) => aoMudar && aoMudar(e.target.value, e)}
          onKeyDown={aoTeclar}
          onFocus={() => setFoco(true)}
          onBlur={(e) => { setFoco(false); if (aoDesfocar) aoDesfocar(e.target.value, e) }}
          style={controleNu(mono)}
        />
        {sufixo && <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--t4)' }}>{sufixo}</span>}
      </div>
    </Envelope>
  )
}

// ── 2. CAMPO MOEDA ───────────────────────────────────────────────────────
// Irmão do Campo pra reais: "R$" fixo à esquerda, valor em mono, sempre
// type="text" + inputMode="decimal". O valor que sobe pro estado é CRU
// (a string digitada) — a página converte com lerMoeda() só na hora de
// salvar, e aí sim aplica o toFixed(2) antes de persistir.
export function CampoMoeda({
  rotulo, valor, aoMudar, placeholder = '0,00', erro, ajuda, sufixo,
  desabilitado = false, obrigatorio = false, autoFoco = false,
  id, nome, filtrar = true, aoTeclar, aoDesfocar, style,
}) {
  const semMovimento = useReducedMotion()
  const [foco, setFoco] = useState(false)
  const ref = useRef(null)
  const auto = useId()
  const idCampo = id || auto

  return (
    <Envelope rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda} para={idCampo}>
      <div onMouseDown={focarPeloPai(ref)} style={estiloCaixa({ foco, erro, desabilitado, semMovimento, extra: style })}>
        <span aria-hidden style={{ flexShrink: 0, fontFamily: MONO, fontSize: 13, fontWeight: 800, color: foco ? 'var(--brand)' : 'var(--t4)', transition: semMovimento ? 'none' : 'color 160ms ease' }}>R$</span>
        <input className="nx-campo-ctl"
          ref={ref} id={idCampo} name={nome} type="text" inputMode="decimal"
          value={valor ?? ''} placeholder={placeholder} disabled={desabilitado}
          autoFocus={autoFoco} required={obrigatorio}
          aria-invalid={!!erro || undefined}
          onChange={(e) => aoMudar && aoMudar(filtrar ? limparMoeda(e.target.value) : e.target.value, e)}
          onKeyDown={aoTeclar}
          onFocus={() => setFoco(true)}
          onBlur={(e) => { setFoco(false); if (aoDesfocar) aoDesfocar(e.target.value, e) }}
          style={{ ...controleNu(true), fontSize: 14.5, fontWeight: 800 }}
        />
        {sufixo && <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--t4)' }}>{sufixo}</span>}
      </div>
    </Envelope>
  )
}

// ── 3. SELEÇÃO ───────────────────────────────────────────────────────────
// Select na mesma caixa. A seta nativa é escondida (appearance: none) e
// desenhada com o Ico, senão cada sistema operacional mostra uma diferente.
export function Selecao({
  rotulo, valor, aoMudar, opcoes = [], placeholder, erro, ajuda, icone,
  desabilitado = false, obrigatorio = false, id, nome, style,
}) {
  const semMovimento = useReducedMotion()
  const [foco, setFoco] = useState(false)
  const auto = useId()
  const idCampo = id || auto

  return (
    <Envelope rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda} para={idCampo}>
      <div style={{ ...estiloCaixa({ foco, erro, desabilitado, semMovimento, extra: style }), position: 'relative', cursor: desabilitado ? 'not-allowed' : 'pointer' }}>
        {icone && <span style={{ color: foco ? 'var(--brand)' : 'var(--t4)', display: 'inline-flex', flexShrink: 0 }}><Ico d={icone} s={16} /></span>}
        <select className="nx-campo-ctl"
          id={idCampo} name={nome} value={valor ?? ''} disabled={desabilitado} required={obrigatorio}
          aria-invalid={!!erro || undefined}
          onChange={(e) => aoMudar && aoMudar(e.target.value, e)}
          onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
          style={{ ...controleNu(false), appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: 22, cursor: 'inherit' }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {opcoes.map(o => <option key={String(o.v)} value={o.v}>{o.l}</option>)}
        </select>
        <span aria-hidden style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t4)', display: 'inline-flex' }}>
          <Ico d={<path d="M6 9l6 6 6-6" />} s={15} />
        </span>
      </div>
    </Envelope>
  )
}

// ── 4. ÁREA ──────────────────────────────────────────────────────────────
// Textarea na mesma caixa, só que crescendo a partir de 96px.
export function Area({
  rotulo, valor, aoMudar, placeholder, erro, ajuda, alturaMin = 96,
  desabilitado = false, obrigatorio = false, id, nome, autoFoco = false, style,
}) {
  const semMovimento = useReducedMotion()
  const [foco, setFoco] = useState(false)
  const ref = useRef(null)
  const auto = useId()
  const idCampo = id || auto

  return (
    <Envelope rotulo={rotulo} obrigatorio={obrigatorio} erro={erro} ajuda={ajuda} para={idCampo}>
      <div onMouseDown={focarPeloPai(ref)} style={estiloCaixa({ foco, erro, desabilitado, semMovimento, extra: { alignItems: 'stretch', padding: '11px 14px', minHeight: alturaMin, ...style } })}>
        <textarea className="nx-campo-ctl"
          ref={ref} id={idCampo} name={nome} value={valor ?? ''} placeholder={placeholder}
          disabled={desabilitado} required={obrigatorio} autoFocus={autoFoco}
          aria-invalid={!!erro || undefined}
          onChange={(e) => aoMudar && aoMudar(e.target.value, e)}
          onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
          style={{ ...controleNu(false), resize: 'vertical', minHeight: alturaMin - 24, lineHeight: 1.5, fontWeight: 500 }}
        />
      </div>
    </Envelope>
  )
}

// ── 5. PÍLULAS ───────────────────────────────────────────────────────────
// Grupo de opções curtas: seleção rápida de quantidade (10/20/50/100) e
// filtros de período. A pílula ativa é #15151a com texto branco — essa cor
// como FUNDO próprio já está na lista de exceções do tema claro.
// O fundo ativo é um único elemento que desliza com mola (layoutId), então a
// troca parece um controle físico e não um repinte.
export function Pilulas({
  opcoes = [], valor, aoMudar, rotulo, ajuda, erro, desabilitado = false, compacto = false, style,
}) {
  const semMovimento = useReducedMotion()
  const grupo = useId()

  return (
    <Envelope rotulo={rotulo} erro={erro} ajuda={ajuda}>
      <div role="group" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, ...style }}>
        {opcoes.map(o => {
          const ativo = String(o.v) === String(valor)
          return (
            <motion.button
              key={String(o.v)} type="button" disabled={desabilitado}
              aria-pressed={ativo}
              onClick={() => aoMudar && aoMudar(o.v)}
              whileTap={semMovimento || desabilitado ? undefined : { scale: 0.95 }}
              style={{
                position: 'relative', isolation: 'isolate',
                padding: compacto ? '7px 12px' : '9px 15px', borderRadius: 999,
                border: `1px solid ${ativo ? 'transparent' : 'var(--b2)'}`,
                background: ativo ? 'transparent' : 'var(--fill-1)',
                fontFamily: 'inherit', fontSize: compacto ? 11.5 : 12.5, fontWeight: 800,
                letterSpacing: '-0.01em', lineHeight: 1,
                cursor: desabilitado ? 'not-allowed' : 'pointer',
                opacity: desabilitado ? 0.55 : 1,
                transition: semMovimento ? 'none' : 'border-color 160ms ease, background-color 160ms ease',
              }}>
              {ativo && (
                semMovimento
                  ? <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: PRETO_ATIVO, zIndex: -1 }} />
                  : <motion.span layoutId={`pilula-${grupo}`} transition={MOLA} style={{ position: 'absolute', inset: 0, borderRadius: 999, background: PRETO_ATIVO, zIndex: -1 }} />
              )}
              {/* nx-fica-branco: o preto da pílula está num IRMÃO absoluto, então
                  a tradução do tema claro não enxerga e apagaria este branco. */}
              <span className={ativo ? 'nx-fica-branco' : undefined}
                style={{ color: ativo ? '#fff' : 'var(--t2)' }}>{o.l}</span>
            </motion.button>
          )
        })}
      </div>
    </Envelope>
  )
}

// ── 6. ALTERNAR ──────────────────────────────────────────────────────────
// Switch on/off. A bolinha vai com mola; a trilha acende no vermelho da marca
// (RED do bento). role="switch" pra leitor de tela entender que é binário.
export function Alternar({
  ligado = false, aoMudar, rotulo, descricao, desabilitado = false, id, style,
}) {
  const semMovimento = useReducedMotion()
  const auto = useId()
  const idCampo = id || auto
  const L = 46, A = 27, B = 21 // trilha, altura, bolinha

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, minWidth: 0, ...style }}>
      {(rotulo || descricao) && (
        <label htmlFor={idCampo} style={{ minWidth: 0, cursor: desabilitado ? 'not-allowed' : 'pointer' }}>
          {rotulo && <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>{rotulo}</span>}
          {descricao && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--t4)', marginTop: 2, lineHeight: 1.45 }}>{descricao}</span>}
        </label>
      )}
      <button
        id={idCampo} type="button" role="switch" aria-checked={!!ligado} aria-label={rotulo || 'Alternar'}
        disabled={desabilitado} onClick={() => aoMudar && aoMudar(!ligado)}
        style={{
          flexShrink: 0, width: L, height: A, borderRadius: 999, padding: 3, border: '1px solid',
          borderColor: ligado ? RED : 'var(--b2)',
          background: ligado ? RED : 'var(--fill-2)',
          display: 'inline-flex', alignItems: 'center',
          cursor: desabilitado ? 'not-allowed' : 'pointer',
          opacity: desabilitado ? 0.55 : 1,
          transition: semMovimento ? 'none' : 'background-color 160ms ease, border-color 160ms ease',
        }}>
        <motion.span
          animate={{ x: ligado ? L - B - 8 : 0 }}
          transition={semMovimento ? { duration: 0 } : MOLA}
          style={{ width: B, height: B, borderRadius: '50%', background: '#fff', boxShadow: SOMBRA.repouso, display: 'block' }} />
      </button>
    </div>
  )
}

// ── LINHA ────────────────────────────────────────────────────────────────
// Dois ou três campos lado a lado com o respiro do resto do kit. O colapso
// no celular é do próprio grid (auto-fit + minmax), sem media query.
export function Linha({ minimo = 190, children, style }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${minimo}px, 1fr))`, gap: 14, ...style }}>
      {children}
    </div>
  )
}
