'use client'
// ─────────────────────────────────────────────────────────────────────────
// UPSELL DO GRUPO NEX NETWORK — aparece DEPOIS do plano ser aprovado.
//
// Três telas, nesta ordem:
//   1. a oferta
//   2. nome + WhatsApp (ficam salvos no perfil — é assim que o dono monta
//      a lista de quem entra) e o PIX de R$ 97
//   3. o link do grupo e o modelo de apresentação, pronto pra copiar
//
// POR QUE PEDIR O CONTATO ANTES DE SOLTAR O LINK: sem isso o dono não sabe
// quem é quem no grupo, e grupo de WhatsApp sem lista vira sala de
// desconhecidos. O link sai logo em seguida — ninguém fica esperando.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GRUPO_PRECO, GRUPO_LINK, modeloApresentacao, formatarWhatsapp } from '../lib/network-grupo'

const ease = [0.33, 1, 0.68, 1]
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const cartao = {
  borderRadius: 20, padding: 24, background: 'var(--surface)',
  border: '1px solid var(--b1)', boxShadow: '0 18px 50px rgba(0,0,0,0.10)',
}

export default function UpsellNetwork({ nomeInicial = '', email, tenantId, userId }) {
  const [etapa, setEtapa] = useState('oferta')   // oferta | dados | pix | dentro
  const [nome, setNome] = useState(nomeInicial)
  const [zap, setZap] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [pix, setPix] = useState(null)
  const [copiado, setCopiado] = useState('')

  const copiar = async (texto, marca) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(marca); setTimeout(() => setCopiado(''), 2200) } catch {}
  }

  async function gerar(e) {
    e?.preventDefault?.()
    setErro('')
    if (!nome.trim()) { setErro('Diga seu nome.'); return }
    if (String(zap).replace(/\D/g, '').length < 10) { setErro('WhatsApp com DDD, por favor.'); return }
    setCarregando(true)
    try {
      const r = await fetch('/api/mercadopago/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'avulso', email, name: nome.trim(), whatsapp: zap, tenant_id: tenantId, user_id: userId }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d?.error || 'Não consegui gerar o PIX.'); setCarregando(false); return }
      setPix(d); setEtapa('pix'); setCarregando(false)
      conferir(d.id || d.payment_id)
    } catch {
      setErro('Erro de conexão. Tente de novo.'); setCarregando(false)
    }
  }

  // o mesmo ritmo do checkout do plano: pergunta a cada 4s
  function conferir(id) {
    if (!id) return
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/mercadopago/check-payment?id=${id}`)
        const d = await r.json()
        if (d?.status === 'approved') { clearInterval(t); setEtapa('dentro') }
      } catch {}
    }, 4000)
    setTimeout(() => clearInterval(t), 15 * 60 * 1000)
  }

  const apresentacao = modeloApresentacao({ nome: nome.trim() })

  return (
    <AnimatePresence mode="wait">
      {etapa === 'oferta' && (
        <motion.div key="oferta" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }} style={{ ...cartao, marginTop: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t3)' }}>
            Nex Network
          </span>
          <h3 style={{ fontSize: 21, fontWeight: 800, color: 'var(--t1)', margin: '10px 0 8px', letterSpacing: '-0.02em' }}>
            Entre no grupo de quem opera de verdade.
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 18px', lineHeight: 1.6 }}>
            Grupo fechado no WhatsApp, só com gente que faz CPA. Rede, troca de
            rede boa, alerta de bloqueio, o que está pagando e o que parou de
            pagar. Pagamento único — entrou, é pra sempre.
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 18 }}>
            <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 34, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em' }}>
              R$ {fmt(GRUPO_PRECO)}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>uma vez só · acesso vitalício</span>
          </div>
          <button type="button" onClick={() => setEtapa('dados')}
            style={{ width: '100%', padding: '14px 18px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, color: '#fff', background: '#22C55E', boxShadow: '0 6px 20px rgba(34,197,94,0.26)' }}>
            Quero entrar no grupo
          </button>
          <button type="button" onClick={() => setEtapa('fora')}
            style={{ width: '100%', marginTop: 8, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, color: 'var(--t3)' }}>
            Agora não
          </button>
        </motion.div>
      )}

      {etapa === 'dados' && (
        <motion.form key="dados" onSubmit={gerar} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }} style={{ ...cartao, marginTop: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Como te chamamos no grupo?
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px', lineHeight: 1.55 }}>
            O link sai logo depois do pagamento. O WhatsApp fica salvo pra você
            não ficar de fora se trocar de aparelho.
          </p>
          {[['Seu nome', nome, setNome, 'text', 'Como te chamam'],
            ['WhatsApp', zap, setZap, 'tel', '(00) 00000-0000']].map(([rot, val, set, tipo, ph]) => (
            <label key={rot} style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>{rot}</span>
              <input value={val} onChange={e => set(e.target.value)} type={tipo} inputMode={tipo === 'tel' ? 'numeric' : 'text'} placeholder={ph}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--b2)', background: 'var(--fill-1)', color: 'var(--t1)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            </label>
          ))}
          {erro && <p style={{ fontSize: 12.5, color: 'var(--loss)', margin: '0 0 12px', fontWeight: 600 }}>{erro}</p>}
          <button type="submit" disabled={carregando}
            style={{ width: '100%', padding: '14px 18px', borderRadius: 13, border: 'none', cursor: carregando ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, color: '#fff', background: '#22C55E', opacity: carregando ? 0.7 : 1 }}>
            {carregando ? 'Gerando PIX…' : `Gerar PIX · R$ ${fmt(GRUPO_PRECO)}`}
          </button>
        </motion.form>
      )}

      {etapa === 'pix' && pix && (
        <motion.div key="pix" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }} style={{ ...cartao, marginTop: 16, textAlign: 'center' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)', margin: '0 0 4px' }}>Pague e entre</h3>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 16px' }}>o link do grupo aparece aqui assim que cair</p>
          {pix.qr_code_base64 && (
            <img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR do PIX" width={196} height={196}
              style={{ borderRadius: 14, display: 'block', margin: '0 auto 14px', background: '#fff', padding: 8 }} />
          )}
          <button type="button" onClick={() => copiar(pix.qr_code || pix.pix_payload, 'pix')}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--b2)', background: 'var(--fill-1)', color: 'var(--t1)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {copiado === 'pix' ? 'Copiado ✓' : 'Copiar código PIX'}
          </button>
        </motion.div>
      )}

      {etapa === 'dentro' && (
        <motion.div key="dentro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} style={{ ...cartao, marginTop: 16 }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Você está dentro, {nome.split(' ')[0]}.
          </h3>
          <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 18px', lineHeight: 1.6 }}>
            {GRUPO_LINK
              ? 'Entre pelo link abaixo e cole a apresentação. É a regra da casa: todo mundo se apresenta ao chegar.'
              : `Salvamos seu contato (${formatarWhatsapp(zap)}). Você é adicionado ao grupo em até algumas horas — já deixe a apresentação copiada.`}
          </p>

          {GRUPO_LINK && (
            <a href={GRUPO_LINK} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 18px', borderRadius: 13, textDecoration: 'none', fontSize: 14, fontWeight: 800, color: '#fff', background: '#22C55E', boxShadow: '0 6px 20px rgba(34,197,94,0.26)', marginBottom: 16 }}>
              Abrir o grupo no WhatsApp
            </a>
          )}

          <div style={{ padding: 16, borderRadius: 14, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--t1)' }}>Sua apresentação</span>
              <button type="button" onClick={() => copiar(apresentacao, 'texto')}
                style={{ padding: '6px 12px', borderRadius: 9, border: '1px solid var(--b2)', background: 'var(--surface)', color: 'var(--t2)', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                {copiado === 'texto' ? 'Copiado ✓' : 'Copiar'}
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{apresentacao}</pre>
            <p style={{ fontSize: 11, color: 'var(--t4)', margin: '12px 0 0', lineHeight: 1.5 }}>
              Complete a idade, o estado, sua experiência e o @ do Instagram antes de enviar.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
