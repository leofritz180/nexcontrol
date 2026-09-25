'use client'
// ─────────────────────────────────────────────────────────────────────────
// NEX NETWORK — o convite, depois do plano aprovado.
//
// A REFERÊNCIA É A PRÓPRIA LANDING /v2: preto #0D0E0F, lime ácido #C8F21D
// usado em 3–5% da área, serifada grande no título, mono nos detalhes,
// filete fino separando os blocos. A primeira versão disto era um card
// branco com botão verde de WhatsApp — parecia banner de plugin, não
// convite pra sala fechada.
//
// POR QUE ESCURO DENTRO DE UM PAINEL CLARO: é ruptura de propósito. Todo o
// resto da tela é ferramenta; isto é um momento. Um bloco preto no meio do
// branco diz "isto aqui é outra coisa" antes de qualquer palavra — e é o
// único lugar do painel onde o lime da marca pode brilhar, porque sobre
// branco ele não tem contraste pra nada.
//
// O QUE NÃO TEM AQUI, e é decisão e não esquecimento: nenhum número de
// membros, nenhum nome de player, nenhum depoimento. Nada disso existe
// ainda. Prova social inventada é a coisa mais rápida de desmascarar num
// nicho pequeno onde todo mundo se conhece — e o dono pediu explicitamente
// pra nunca inventar isso.
//
// O fluxo: convite → nome e WhatsApp → PIX → dentro, com a apresentação
// pronta. O contato fica salvo no perfil; é o que permite montar a lista
// de quem está no grupo.
// ─────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { GRUPO_PRECO, GRUPO_PRECO_ANTERIOR, modeloApresentacao, formatarWhatsapp } from '../lib/network-grupo'
import { eventoGrupo } from './GrupoConvite'

const ease = [0.33, 1, 0.68, 1]
const LIME = '#C8F21D'
const PRETO = '#0D0E0F'
const GRAFITE = '#17191A'
const TINTA = '#F4F4F1'
const CINZA = '#9A9E9F'
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const SERIF = "var(--font-display, 'Instrument Serif', Georgia, serif)"

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const palco = {
  position: 'relative', overflow: 'hidden', borderRadius: 22, marginTop: 18,
  background: PRETO, border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 26px 70px rgba(0,0,0,0.30)',
}

/* ── peças ─────────────────────────────────────────────────────────── */

const Olho = ({ children, pulsa }) => (
  <span className="nxg-cinza" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
    <motion.span aria-hidden
      animate={pulsa ? { opacity: [1, 0.25, 1] } : {}}
      transition={pulsa ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{ width: 5, height: 5, borderRadius: '50%', background: LIME, flexShrink: 0 }} />
    {children}
  </span>
)

const Filete = ({ m = '22px 0' }) => (
  <div aria-hidden style={{ height: 1, margin: m, background: 'linear-gradient(90deg, rgba(255,255,255,0.13), rgba(255,255,255,0.02))' }} />
)

/* O N gigante ao fundo, cortado pela borda. Nasce do canto e some antes de
   virar um retângulo colado — ambientação, não logotipo aplicado. */
const MarcaFundo = () => (
  <svg aria-hidden viewBox="0 0 100 103" style={{
    position: 'absolute', right: -38, top: -30, width: 214, height: 214,
    opacity: 0.055, pointerEvents: 'none',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 58% 34%, #000 18%, transparent 76%)',
    maskImage: 'radial-gradient(ellipse 70% 70% at 58% 34%, #000 18%, transparent 76%)',
  }}>
    <path d="M0 9.3 31.2 41.6 31.2 100 0 67.4Z" fill={TINTA} />
    <path d="M68.8 2.5 100 35.1 100 93.2 68.8 60.9Z" fill={TINTA} />
    <path d="M0 9.3 0 2.5 33.6 2.5 100 73.2 100 100 85.3 100Z" fill={LIME} />
  </svg>
)

/* So a previa usa isto: o PIX de verdade vem com o QR do Mercado Pago em
   base64. Um quadrado vazio faria a tela parecer quebrada na demonstracao,
   e um QR que alguem possa ler por engano seria pior — este nao codifica
   nada, e desenho. */
function QrIlustrativo() {
  const celulas = []
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const canto = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
    if (canto) continue
    // ruido deterministico: mesma cara em todo carregamento
    if (((x * 7 + y * 13 + x * y * 3) % 5) < 2) celulas.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" />)
  }
  const Olhinho = ({ x, y }) => (
    <g>
      <rect x={x} y={y} width="7" height="7" fill="none" stroke="#0D0E0F" strokeWidth="1" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  )
  return (
    <svg viewBox="-1 -1 23 23" width={188} height={188} aria-hidden
      style={{ display: 'block', margin: '22px auto 18px', borderRadius: 14, background: '#fff', padding: 10 }}>
      <g fill="#0D0E0F" shapeRendering="crispEdges">
        {celulas}
        <Olhinho x={0} y={0} /><Olhinho x={14} y={0} /><Olhinho x={0} y={14} />
      </g>
    </svg>
  )
}

function BotaoLime({ children, onClick, tipo = 'button', desabilitado, href }) {
  const parado = useReducedMotion()
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    width: '100%', padding: '15px 20px', borderRadius: 13, border: 'none',
    cursor: desabilitado ? 'wait' : 'pointer', textDecoration: 'none',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em',
    background: LIME, opacity: desabilitado ? 0.65 : 1,
  }
  const mov = parado ? {} : {
    whileHover: { y: -2, boxShadow: '0 14px 34px rgba(200,242,29,0.28)' },
    whileTap: { y: 0, scale: 0.985 },
  }
  // a cor do texto vem de CLASSE: cor em estilo inline é reescrita pela
  // camada de tradução do tema claro, e o texto some no botão
  const dentro = <span className="nxg-tinta">{children}</span>
  return href
    ? <motion.a href={href} target="_blank" rel="noopener noreferrer" style={base} {...mov}>{dentro}</motion.a>
    : <motion.button type={tipo} onClick={onClick} disabled={desabilitado} style={base} {...mov}>{dentro}</motion.button>
}

function CampoEscuro({ rotulo, valor, aoMudar, tipo = 'text', dica }) {
  return (
    <label style={{ display: 'block', marginBottom: 15 }}>
      <span className="nxg-cinza" style={{ display: 'block', fontFamily: MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>{rotulo}</span>
      <input value={valor} onChange={e => aoMudar(e.target.value)} type={tipo}
        inputMode={tipo === 'tel' ? 'numeric' : 'text'} placeholder={dica} className="nxg-campo"
        style={{ width: '100%', fontSize: 14.5, fontFamily: 'inherit', outline: 'none' }} />
    </label>
  )
}

const ESTILO = `
  .nxg-tinta, .nxg-tinta * { color: ${PRETO} !important; }
  .nxg-claro, .nxg-claro * { color: ${TINTA} !important; }
  .nxg-cinza, .nxg-cinza * { color: ${CINZA} !important; }
  .nxg-lime,  .nxg-lime  * { color: ${LIME} !important; }
  .nxg-campo:not(#_):not(#_) {
    background: ${GRAFITE} !important;
    border: 1px solid rgba(255,255,255,0.14) !important;
    color: ${TINTA} !important;
    border-radius: 12px !important;
    padding: 13px 15px !important;
    box-shadow: none !important;
  }
  .nxg-campo:not(#_):not(#_)::placeholder { color: rgba(244,244,241,0.28) !important; }
  .nxg-campo:not(#_):not(#_):hover { border-color: rgba(255,255,255,0.22) !important; }
  .nxg-campo:not(#_):not(#_):focus {
    border-color: rgba(200,242,29,0.55) !important;
    box-shadow: 0 0 0 3px rgba(200,242,29,0.12) !important;
  }
`

/* ── o convite ─────────────────────────────────────────────────────── */

export default function UpsellNetwork({ nomeInicial = '', email, tenantId, userId, demo = false, origem = 'pos-pagamento', semSair = false, checarMembro = false }) {
  const [etapa, setEtapa] = useState('convite')   // convite | dados | pix | dentro | fora
  const [nome, setNome] = useState(nomeInicial)
  const [zap, setZap] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [pix, setPix] = useState(null)
  const [copiado, setCopiado] = useState('')
  // o link vem do servidor, só depois do pagamento — nunca do bundle
  const [link, setLink] = useState('')

  // funil: viu a oferta (uma vez por montagem), clicou, gerou o PIX
  useEffect(() => { if (!demo) eventoGrupo('view', origem) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Quem JÁ COMPROU e voltou (fechou a aba antes do "aprovado", ou o link
  // não estava configurado na hora) precisa de um lugar pra pegar o link:
  // aqui. Com checarMembro, o componente pergunta ao servidor e, se a
  // compra existe, abre direto no "Você está dentro" — sem oferecer de novo.
  useEffect(() => {
    if (!checarMembro || demo) return
    let vivo = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const token = data?.session?.access_token
        if (!token) return
        const r = await fetch('/api/network-grupo', { headers: { Authorization: 'Bearer ' + token } })
        if (!vivo || !r.ok) return
        const d = await r.json()
        setLink(d?.link || '')
        setEtapa('dentro')
      } catch {}
    })()
    return () => { vivo = false }
  }, [checarMembro, demo])

  const copiar = async (texto, marca) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(marca); setTimeout(() => setCopiado(''), 2200) } catch {}
  }

  async function buscarLink() {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) return
      const r = await fetch('/api/network-grupo', { headers: { Authorization: 'Bearer ' + token } })
      if (!r.ok) return
      const d = await r.json()
      if (d?.link) setLink(d.link)
    } catch {}
  }

  function conferir(id) {
    if (!id) return
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/mercadopago/check-payment?id=${id}`)
        const d = await r.json()
        if (d?.status === 'approved') { clearInterval(t); buscarLink(); setEtapa('dentro') }
      } catch {}
    }, 4000)
    setTimeout(() => clearInterval(t), 15 * 60 * 1000)
  }

  async function gerar(e) {
    e?.preventDefault?.()
    setErro('')
    if (!nome.trim()) { setErro('Diga seu nome.'); return }
    if (String(zap).replace(/\D/g, '').length < 10) { setErro('WhatsApp com DDD, por favor.'); return }
    setCarregando(true)
    if (!demo) eventoGrupo('qr', origem)
    if (demo) {
      setPix({ id: 'demo', qr_code: '00020126360014br.gov.bcb.pix…5204000053039865802BR' })
      setEtapa('pix'); setCarregando(false)
      setTimeout(() => { setLink('https://chat.whatsapp.com/EXEMPLO'); setEtapa('dentro') }, 3500)
      return
    }
    try {
      const r = await fetch('/api/mercadopago/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'avulso', email, name: nome.trim(), whatsapp: zap, tenant_id: tenantId, user_id: userId }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d?.error || 'Não consegui gerar o PIX.'); setCarregando(false); return }
      setPix(d); setEtapa('pix'); setCarregando(false)
      conferir(d.id || d.payment_id)
    } catch { setErro('Erro de conexão. Tente de novo.'); setCarregando(false) }
  }

  if (etapa === 'fora') return null
  const apresentacao = modeloApresentacao({ nome: nome.trim() })

  return (
    <>
      <style>{ESTILO}</style>
      <AnimatePresence mode="wait">

        {etapa === 'convite' && (
          <motion.section key="convite" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} style={palco}>
            <MarcaFundo />
            <div style={{ position: 'relative', padding: '28px 26px 26px' }}>
              <Olho>Nex Network</Olho>

              <h3 className="nxg-claro" style={{ fontFamily: SERIF, fontSize: 31, fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.02em', margin: '18px 0 0' }}>
                Um grupo fechado.<br />Só quem opera.
              </h3>

              <Filete />

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[
                  'A rede que está pagando hoje — e a que parou',
                  'Aviso de bloqueio antes de você descobrir sozinho',
                  'Gente que fecha meta, não que fala sobre fechar',
                ].map(t => (
                  <li key={t} className="nxg-claro" style={{ display: 'flex', gap: 11, fontSize: 13.5, lineHeight: 1.5, padding: '9px 0' }}>
                    <span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: LIME, flexShrink: 0, marginTop: 8 }} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <Filete />

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
                <span>
                  <span className="nxg-cinza" style={{ display: 'block', fontFamily: MONO, fontSize: 12, textDecoration: 'line-through', marginBottom: 4 }}>R$ {fmt(GRUPO_PRECO_ANTERIOR)}</span>
                  <span className="nxg-claro" style={{ display: 'block', fontFamily: MONO, fontSize: 38, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1 }}>
                    R$ {fmt(GRUPO_PRECO)}
                  </span>
                </span>
                <span className="nxg-cinza" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'right', lineHeight: 1.8 }}>
                  preço de lançamento<br />pagamento único · vitalício
                </span>
              </div>

              <BotaoLime onClick={() => { if (!demo) eventoGrupo('click', origem); setEtapa('dados') }}>Entrar no grupo</BotaoLime>
              {!semSair && (
                <button type="button" onClick={() => setEtapa('fora')} className="nxg-cinza"
                  style={{ width: '100%', marginTop: 10, padding: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5 }}>
                  agora não
                </button>
              )}
            </div>
          </motion.section>
        )}

        {etapa === 'dados' && (
          <motion.form key="dados" onSubmit={gerar} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} style={palco}>
            <div style={{ position: 'relative', padding: '28px 26px 26px' }}>
              <Olho>Quase lá</Olho>
              <h3 className="nxg-claro" style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '16px 0 9px' }}>
                Como te chamam lá dentro?
              </h3>
              <p className="nxg-cinza" style={{ fontSize: 12.5, lineHeight: 1.6, margin: '0 0 22px' }}>
                O link sai assim que o pagamento cair. O WhatsApp fica guardado
                pra você não ficar de fora se trocar de aparelho.
              </p>

              <CampoEscuro rotulo="Seu nome" valor={nome} aoMudar={setNome} dica="Como te chamam" />
              <CampoEscuro rotulo="WhatsApp" valor={zap} aoMudar={setZap} tipo="tel" dica="(00) 00000-0000" />

              {erro && <p className="nxg-lime" style={{ fontSize: 12.5, fontWeight: 600, margin: '0 0 14px' }}>{erro}</p>}

              <BotaoLime tipo="submit" desabilitado={carregando}>
                {carregando ? 'Gerando PIX…' : `Gerar PIX · R$ ${fmt(GRUPO_PRECO)}`}
              </BotaoLime>
            </div>
          </motion.form>
        )}

        {etapa === 'pix' && pix && (
          <motion.section key="pix" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} style={palco}>
            <div style={{ position: 'relative', padding: '28px 26px 26px', textAlign: 'center' }}>
              <Olho pulsa>Aguardando o PIX</Olho>
              <p className="nxg-claro" style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', margin: '14px 0 0' }}>
                R$ {fmt(GRUPO_PRECO)}
              </p>
              {pix.qr_code_base64 ? (
                <img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR do PIX" width={188} height={188}
                  style={{ display: 'block', margin: '22px auto 18px', borderRadius: 14, background: '#fff', padding: 10 }} />
              ) : <QrIlustrativo />}
              <button type="button" onClick={() => copiar(pix.qr_code, 'pix')} className="nxg-claro"
                style={{ width: '100%', padding: '13px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: GRAFITE, border: '1px solid rgba(255,255,255,0.14)' }}>
                {copiado === 'pix' ? 'Copiado ✓' : 'Copiar código PIX'}
              </button>
              <p className="nxg-cinza" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '16px 0 0' }}>
                o link aparece aqui sozinho
              </p>
            </div>
          </motion.section>
        )}

        {etapa === 'dentro' && (
          <motion.section key="dentro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} style={palco}>
            <MarcaFundo />
            <div style={{ position: 'relative', padding: '28px 26px 26px' }}>
              <Olho>Você está dentro</Olho>
              <h3 className="nxg-claro" style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, lineHeight: 1.08, letterSpacing: '-0.02em', margin: '18px 0 10px' }}>
                Bem-vindo, {(nome || '').split(' ')[0]}.
              </h3>
              <p className="nxg-cinza" style={{ fontSize: 12.5, lineHeight: 1.6, margin: '0 0 20px' }}>
                {link
                  ? 'Entre pelo link e cole a apresentação. É a regra da casa: todo mundo se apresenta ao chegar.'
                  : (zap ? `Guardamos seu contato: ${formatarWhatsapp(zap)}. ` : 'Seu pagamento está confirmado. ') + 'O link de convite chega no seu WhatsApp em algumas horas — já deixe a apresentação copiada.'}
              </p>

              {link && <BotaoLime href={link}>Abrir o grupo no WhatsApp</BotaoLime>}

              <div style={{ marginTop: link ? 18 : 0, padding: 18, borderRadius: 14, background: GRAFITE, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <Olho>Sua apresentação</Olho>
                  <button type="button" onClick={() => copiar(apresentacao, 'texto')} className="nxg-claro"
                    style={{ padding: '6px 13px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}>
                    {copiado === 'texto' ? 'Copiado ✓' : 'Copiar'}
                  </button>
                </div>
                <pre className="nxg-claro" style={{ margin: 0, fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{apresentacao}</pre>
                <p className="nxg-cinza" style={{ fontSize: 11, lineHeight: 1.55, margin: '14px 0 0' }}>
                  Complete a idade, o estado, sua experiência e o @ do Instagram antes de enviar.
                </p>
              </div>
            </div>
          </motion.section>
        )}

      </AnimatePresence>
    </>
  )
}
