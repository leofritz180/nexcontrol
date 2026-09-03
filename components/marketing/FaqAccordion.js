'use client'
// ─────────────────────────────────────────────────────────────────────────
// FaqAccordion — FAQ acessivel (button + aria-expanded, navegavel por teclado,
// region com role). Respostas REAIS: preco, trial, PIX, operadores, cancelamento,
// dados. Nada inventado (sem promessa de resultado, sem numero nao conferido).
// ─────────────────────────────────────────────────────────────────────────
import { useState, useId } from 'react'

const FAQ = [
  { q: 'Como começo a usar?', a: 'Você cria a conta, paga via PIX e o acesso é liberado na hora que o pagamento é confirmado. Simples assim — sem espera e sem burocracia.' },
  { q: 'Quanto custa?', a: 'O plano custa R$ 59,90 por mês e já inclui a plataforma inteira: metas, operadores, IA, notificações, Network e tudo do PRO.' },
  { q: 'Como é feito o pagamento?', a: 'A ativação é via PIX, na hora. Assim que o pagamento é confirmado, o acesso é liberado automaticamente. Não trabalhamos com fidelidade — você renova quando quiser.' },
  { q: 'Preciso de cartão de crédito?', a: 'Não. O pagamento é 100% via PIX. Você paga, o acesso libera na hora, e renova mês a mês quando quiser — sem cartão e sem fidelidade.' },
  { q: 'O que os insights de IA fazem?', a: 'A IA acompanha sua operação e avisa quando algo foge do padrão: sequência de resultados negativos, prejuízo acima da média ou uma meta parada. É um alerta operacional, não uma promessa de lucro.' },
  { q: 'As notificações chegam no celular?', a: 'Sim. A NexControl é um app instalável no iPhone e no Android e envia notificações push na hora — meta batida, movimentação da equipe e alertas da IA, mesmo com o app fechado.' },
  { q: 'O que é o Network?', a: 'É uma comunidade fechada de admins dentro da plataforma, para trocar estratégia e acompanhar resultados. Todo mundo que cria conta entra no grupo; assinantes PRO têm perfil e privilégios extras.' },
  { q: 'Meus dados ficam seguros?', a: 'Cada conta é isolada por operação — um cliente nunca vê os dados de outro. As informações financeiras dos operadores também são protegidas dentro do próprio painel.' },
  { q: 'Consigo cancelar quando quiser?', a: 'Sim. Não há fidelidade nem multa. Como a renovação é mensal via PIX, basta não renovar quando não quiser mais usar.' },
  { q: 'Funciona pra quem já usa planilha?', a: 'Funciona melhor. A ideia é justamente tirar você da planilha: em vez de somar remessa a remessa na mão, o lucro final se atualiza sozinho a cada registro.' },
]

function Item({ q, a, open, onToggle, idx }) {
  const base = useId()
  const btnId = `${base}-btn`
  const panelId = `${base}-panel`
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <h3 style={{ margin: 0 }}>
        <button
          type="button" id={btnId} aria-expanded={open} aria-controls={panelId}
          onClick={onToggle}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            padding: '20px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            fontSize: 15.5, fontWeight: 700, color: open ? '#fff' : 'rgba(255,255,255,0.82)',
            transition: 'color 0.2s',
          }}
        >
          <span>{q}</span>
          <span aria-hidden style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: open ? 'rgba(229,57,53,0.15)' : 'rgba(255,255,255,0.05)',
            transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease, background 0.3s',
          }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={open ? '#ff6b6b' : 'rgba(255,255,255,0.5)'} strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={btnId} hidden={!open}
        style={{ padding: open ? '0 4px 22px' : '0 4px' }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.65, maxWidth: 640 }}>{a}</p>
      </div>
    </div>
  )
}

export default function FaqAccordion() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" style={{ padding: '60px 24px 70px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 34 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ff6b6b', margin: '0 0 10px' }}>Perguntas frequentes</p>
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Ainda com dúvida?</h2>
      </div>
      <div>
        {FAQ.map((f, i) => (
          <Item key={i} idx={i} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
        ))}
      </div>
    </section>
  )
}
