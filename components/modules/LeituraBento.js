'use client'
// ─────────────────────────────────────────────────────────────────────────
// LEITURA DA OPERAÇÃO — a parte do Faturamento que diz o que os números
// estão dizendo. É um benefício do Solo Pro.
//
// POR QUE ESTE ARQUIVO EXISTE: a leitura vivia solta dentro da visão geral
// antiga do /faturamento, e essa visão inteira fica escondida para quem já
// está na 2.0. Enquanto só três contas estavam liberadas ninguém sentiu;
// no dia em que o interruptor virasse para todos, quem paga Solo Pro
// perderia justamente o que acabou de comprar. Aqui ela existe uma vez só
// e as duas telas chamam a mesma coisa.
//
// O QUE ENTRA: já vem tudo calculado do /faturamento — insights, alertas,
// saúde e projeção. Este arquivo é apresentação, como o resto do kit bento.
//
// ONDE O LIME APARECE: no estado saudável. É o único verde da marca que faz
// sentido num painel claro — ele marca "está indo bem", não decora. Quando
// a operação está em atenção ou abaixo, a cor é a de aviso/prejuízo de
// sempre, porque aí o lime estaria mentindo.
// ─────────────────────────────────────────────────────────────────────────
import { BCard, Ico } from '../ui/bento'

const BOM = new Set(['good', 'growing'])
const ATENCAO = new Set(['attention', 'unstable'])

// A saúde vem do lib/insights com as cores do tema escuro. No bento o verde
// bom vira o lime da marca; o resto segue os tokens de sempre.
function tintaSaude(nivel) {
  if (BOM.has(nivel)) return { txt: 'var(--acento-forte)', fundo: 'var(--acento-dim)', borda: 'var(--acento-border)' }
  if (ATENCAO.has(nivel)) return { txt: 'var(--warn)', fundo: 'var(--warn-dim)', borda: 'var(--warn-border)' }
  return { txt: 'var(--loss)', fundo: 'var(--loss-dim)', borda: 'var(--loss-border)' }
}

const CHAVE = <polyline points="20 6 9 17 4 12" />
const ALERTA = <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
const CADEADO = <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>

/* ── o que quem não é Pro vê ────────────────────────────────────────────
   Mostra O QUE ENTREGA em vez de sumir: quem não assina precisa saber o
   que está deixando na mesa, e quem assina precisa reconhecer o que
   comprou quando vir a versão destravada. */
function Trancado({ precoExtra = 40 }) {
  return (
    <BCard pad={24} delay={0.24}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 24, height: 24, borderRadius: 8, background: 'var(--acento-dim)', border: '1px solid var(--acento-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico d={CADEADO} c="var(--acento-forte)" s={12} />
        </span>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t3)' }}>Solo Pro</span>
      </div>
      <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Leitura da operação</p>
      <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px', lineHeight: 1.6 }}>
        Projeção de fechamento, comparação com o período anterior e tendência
        de alta ou queda. Os números você já tem — isto diz o que eles estão
        dizendo.
      </p>
      <a href="/billing-mp" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', borderRadius: 12, background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
        Ativar por + R$ {precoExtra}/mês
      </a>
    </BCard>
  )
}

/* As duas vitrines concretas ao lado do cartão principal.
   O /faturamento antigo tinha TRÊS: projeção de lucro, comparativo de
   operadores e "heatmap de performance — melhores dias e horários". As duas
   primeiras existem no produto; a terceira NÃO existe e nunca existiu — o
   heatmap do /redes é um tratamento de cor no ranking de redes, não um mapa
   de dias e horários. Um cartão trancado promete que pagar destrava o que
   está ali dentro, então ele não voltou. */
const VITRINES = [
  {
    t: 'Projeção de fechamento',
    d: 'Quanto a operação fecha no ritmo atual, a partir das metas já fechadas.',
    amostra: (
      <>
        <span style={{ display: 'block', width: '58%', height: 12, borderRadius: 4, background: 'var(--fill-2)' }} />
        <span style={{ display: 'block', width: '38%', height: 16, borderRadius: 4, background: 'var(--fill-1)', marginTop: 6 }} />
      </>
    ),
  },
  {
    t: 'Comparativo de operadores',
    d: 'A performance de cada um lado a lado: acerto, volume e lucro.',
    amostra: (
      <>
        {[74, 58, 42].map(w => (
          <span key={w} style={{ display: 'block', width: w + '%', height: 9, borderRadius: 4, background: 'var(--fill-2)', marginBottom: 5 }} />
        ))}
      </>
    ),
  },
]

function Vitrine({ t, d, amostra, delay }) {
  return (
    <BCard pad={20} delay={delay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Ico d={CADEADO} c="var(--t4)" s={13} />
        <p style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.01em' }}>{t}</p>
      </div>
      <p style={{ fontSize: 12, color: 'var(--t3)', margin: '0 0 14px', lineHeight: 1.55 }}>{d}</p>
      <div aria-hidden style={{ opacity: 0.55 }}>{amostra}</div>
    </BCard>
  )
}

export default function LeituraBento({ pro = true, insights = [], alertas = [], saude, projecao }) {
  if (!pro) {
    return (
      <div className="bk-leitura" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <Trancado />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {VITRINES.map((v, k) => <Vitrine key={v.t} {...v} delay={0.28 + k * 0.04} />)}
        </div>
        <style>{`@media (max-width:1000px){ .bk-leitura{grid-template-columns:1fr !important} }`}</style>
      </div>
    )
  }

  const cor = tintaSaude(saude?.level)
  const ins = Array.isArray(insights) ? insights : []
  const als = Array.isArray(alertas) ? alertas : []
  const proj = projecao && projecao.target > 0 && projecao.pct < 100 ? projecao : null

  return (
    // data-tour: o passo "Leitura da operação" do tour aponta pra ca.
    <div data-tour="fat-insights" className="bk-leitura" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>

      <BCard pad={24} delay={0.24}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Leitura da operação</p>
          {saude?.label && (
            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '5px 12px', borderRadius: 999, background: cor.fundo, color: cor.txt, border: `1px solid ${cor.borda}`, whiteSpace: 'nowrap' }}>
              {saude.label}
            </span>
          )}
        </div>

        {ins.length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0, lineHeight: 1.6 }}>
            Ainda não há metas fechadas suficientes para uma leitura. Feche a
            primeira e ela aparece aqui.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ins.map((i, k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 12, background: 'var(--fill-1)' }}>
                <span aria-hidden style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: i.type === 'profit' ? 'var(--acento-forte)' : i.type === 'loss' ? 'var(--loss)' : 'var(--t3)',
                }} />
                <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.45 }}>{i.text}</span>
              </div>
            ))}
          </div>
        )}
      </BCard>

      <BCard pad={24} delay={0.28}>
        <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>Alertas e atenção</p>

        {als.length === 0 ? (
          <div style={{ padding: '18px 0', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', marginBottom: 8 }}><Ico d={CHAVE} c="var(--acento-forte)" s={20} /></span>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0 }}>Nenhum alerta no momento</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {als.map((a, k) => (
              <div key={k} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12,
                background: a.type === 'loss' ? 'var(--loss-dim)' : 'var(--warn-dim)',
                border: `1px solid ${a.type === 'loss' ? 'var(--loss-border)' : 'var(--warn-border)'}`,
              }}>
                <span style={{ flexShrink: 0, display: 'inline-flex' }}><Ico d={ALERTA} c={a.type === 'loss' ? 'var(--loss)' : 'var(--warn)'} s={14} /></span>
                <span style={{ fontSize: 12.5, color: a.type === 'loss' ? 'var(--loss)' : 'var(--warn)', lineHeight: 1.45 }}>{a.text}</span>
              </div>
            ))}
          </div>
        )}

        {proj && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--b1)' }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 10px' }}>Projeção</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>Meta global ({proj.pct}%)</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14.5, fontWeight: 800, color: 'var(--t1)' }}>
                {proj.diasRestantes < 999 ? `~${proj.diasRestantes} dias` : '—'}
              </span>
            </div>
            <div style={{ marginTop: 10, height: 6, background: 'var(--fill-1)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${proj.pct}%`, borderRadius: 99, background: 'var(--acento-forte)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}
      </BCard>

      <style>{`@media (max-width:1000px){ .bk-leitura{grid-template-columns:1fr !important} }`}</style>
    </div>
  )
}
