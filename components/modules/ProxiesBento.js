'use client'
// ─────────────────────────────────────────────────────────────────────────
// MINHAS PROXIES — visual 2.0 (bento claro).
//
// Apresentação PURA: não chama a API da Bettify nem o Supabase. A página
// continua dona do fetch, do "copiado" e da navegação; aqui só entram dados
// e callbacks, pra que o caminho novo e o antigo usem os mesmos handlers.
//
// O medidor de giga virou Rosca (o gauge do kit): dá pra ler de longe quanto
// sobrou sem precisar comparar dois números.
// ─────────────────────────────────────────────────────────────────────────
import { ModuleHeader, AcaoBtn, Hero, Tira, BCard, Rosca, Lista, Vazio, Ico, int, MONO, RED, RED2 } from '../ui/bento'

const I_ATUALIZAR = <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>
const I_CARRINHO = <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></>
const I_ESCUDO = <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
const I_COPIAR = <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
const I_OK = <polyline points="20 6 9 17 4 12" />
const I_ALERTA = <><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>

// Formata GB: >=1 -> "X,XX GB" | <1 -> "XXX MB". Mesma regra do fmtData
// da página antiga, pra nenhum número mudar de cara na migração.
export function giga(gb) {
  if (gb === null || gb === undefined) return '—'
  const n = Number(gb)
  if (!Number.isFinite(n)) return '—'
  if (n >= 1) return `${n.toFixed(2).replace('.', ',')} GB`
  return `${Math.round(n * 1024)} MB`
}

// Paleta enxuta: mint quando sobra bastante, neutro no meio, vermelho de
// perda quando está no fim. Sem amarelo.
function corPor(pct) {
  if (pct === null || pct === undefined) return 'var(--t3)'
  if (pct > 30) return 'var(--profit)'
  if (pct > 10) return 'var(--t2)'
  return 'var(--loss)'
}

// % restante de uma proxy. null quando a Bettify não informou o saldo.
function pctDe(px) {
  const total = Number(px?.gb_total)
  const rem = px?.gb_remaining
  if (total > 0 && rem !== null && rem !== undefined) return Math.max(0, Math.min(100, (Number(rem) / total) * 100))
  return (rem === null || rem === undefined) ? null : 0
}

const linhaDe = px => px?.line || `${px?.host}:${px?.port}`

function BtnFantasma({ children, onClick, icone, tom = 'neutro' }) {
  const cores = {
    neutro: { fg: 'var(--t2)', bd: 'var(--b2)', bg: 'var(--fill-1)' },
    ok: { fg: 'var(--profit)', bd: 'var(--profit-border)', bg: 'var(--profit-dim)' },
  }[tom]
  return (
    <button type="button" onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        minHeight: 44, padding: '0 18px', borderRadius: 30,
        border: `1px solid ${cores.bd}`, background: cores.bg, color: cores.fg,
        fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.01em', cursor: 'pointer',
        transition: 'border-color 160ms ease, background-color 160ms ease',
      }}>
      {icone && <Ico d={icone} s={15} />}{children}
    </button>
  )
}

// Cartão de UMA proxy: gauge de giga, linha copiável e rodapé de status.
function CartaoProxy({ px, indice, copiado, aoCopiar }) {
  const pct = pctDe(px)
  const rem = px.gb_remaining
  const total = px.gb_total
  const cor = corPor(pct)
  const linha = linhaDe(px)
  const id = px.id || indice
  const usado = (px.gb_used !== null && px.gb_used !== undefined) ? Number(px.gb_used) : Math.max(0, Number(total || 0) - Number(rem || 0))
  const foiCopiada = copiado === id

  return (
    <BCard pad={24} delay={0.14 + indice * 0.05}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: cor, flexShrink: 0 }} />
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Sua proxy{px.product_name ? ` · ${px.product_name}` : ''}
          </span>
        </span>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--t4)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.14em' }}>tempo real</span>
      </div>

      {/* gauge: o que sobrou contra o que já foi */}
      <Rosca
        dados={[
          { l: 'Restante', v: Math.max(0, Number(rem || 0)), c: pct === null ? 'var(--t4)' : (pct > 30 ? 'var(--profit)' : pct > 10 ? RED2 : RED) },
          { l: 'Usado', v: Math.max(0, usado), c: 'var(--fill-2)' },
        ].filter(d => d.v > 0)}
        centro={giga(rem)}
        rotulo={pct === null ? 'sem leitura' : `${pct.toFixed(1).replace('.', ',')}% restante`}
        formata={giga}
        delay={0.2 + indice * 0.05}
      />

      {/* linha da proxy + copiar */}
      <button type="button" onClick={() => aoCopiar && aoCopiar(linha, id)} title="Clique para copiar"
        style={{
          width: '100%', marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '12px 14px', borderRadius: 14, background: 'var(--fill-1)', border: '1px solid var(--b1)',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}>
        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linha}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: foiCopiada ? 'var(--profit)' : 'var(--brand)', flexShrink: 0 }}>
          <Ico d={foiCopiada ? I_OK : I_COPIAR} s={13} />{foiCopiada ? 'copiado!' : 'copiar'}
        </span>
      </button>

      <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '10px 0 0' }}>
        {px.gb_used !== null && px.gb_used !== undefined ? `${giga(px.gb_used)} usado` : ''}
        {total !== null && total !== undefined ? `${(px.gb_used !== null && px.gb_used !== undefined) ? ' · ' : ''}${giga(total)} no total` : ''}
        {px.status && px.status !== 'active' && px.status !== 'unknown' ? ` · ${px.status}` : ''}
      </p>
    </BCard>
  )
}

export default function ProxiesBento({
  proxies = [], erro = false, copiado, aoCopiar, aoAtualizar, aoComprar, dicas,
}) {
  const lista = Array.isArray(proxies) ? proxies : []
  const somaRestante = lista.reduce((a, p) => a + (Number(p.gb_remaining) || 0), 0)
  const somaTotal = lista.reduce((a, p) => a + (Number(p.gb_total) || 0), 0)
  const somaUsada = Math.max(0, somaTotal - somaRestante)
  const pctGeral = somaTotal > 0 ? (somaRestante / somaTotal) * 100 : null
  // Alerta: proxy com 10% ou menos de giga. É o "vai acabar" que o operador
  // precisa ver antes de perder conta no meio da operação.
  const acabando = lista.filter(p => { const v = pctDe(p); return v !== null && v <= 10 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Minhas Proxies"
        sub={`${int(lista.length)} proxy${lista.length === 1 ? '' : 'ies'} · tráfego restante em tempo real`}
        acao={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <BtnFantasma icone={I_ATUALIZAR} onClick={aoAtualizar}>Atualizar</BtnFantasma>
            <AcaoBtn onClick={aoComprar} icon={I_CARRINHO}>Comprar proxy</AcaoBtn>
          </div>
        }
      />

      <Hero
        rotulo="Tráfego restante"
        valor={giga(somaRestante)}
        cor={corPor(pctGeral)}
        nota={somaTotal > 0
          ? `de ${giga(somaTotal)} contratados · ${giga(somaUsada)} já consumidos`
          : 'Sem saldo informado pela loja no momento'}
        blob={['rgba(229,57,31,0.16)', 'rgba(229,57,31,0.35)']}
        extras={[
          { l: 'Proxies', v: int(lista.length) },
          { l: 'Usado', v: giga(somaUsada), c: 'var(--loss)' },
        ]}
      />

      <Tira itens={[
        { l: 'Proxies', v: int(lista.length) },
        { l: 'Restante', v: giga(somaRestante), c: corPor(pctGeral) },
        { l: 'Total', v: giga(somaTotal) },
        { l: 'Usado', v: giga(somaUsada), c: 'var(--loss)' },
        { l: 'Em alerta', v: int(acabando.length), c: acabando.length > 0 ? 'var(--loss)' : 'var(--t3)' },
      ]} />

      {acabando.length > 0 && (
        <BCard pad={20} delay={0.1} style={{ borderColor: 'var(--loss-border)', background: 'var(--loss-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ color: 'var(--loss)', display: 'inline-flex', flexShrink: 0, marginTop: 1 }}><Ico d={I_ALERTA} s={19} /></span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--loss)', margin: 0, letterSpacing: '-0.01em' }}>
                {int(acabando.length)} proxy{acabando.length === 1 ? '' : 'ies'} com o tráfego acabando
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: '4px 0 0', lineHeight: 1.5 }}>
                {acabando.map(p => `${p.product_name || linhaDe(p)} (${giga(p.gb_remaining)})`).join(' · ')} — renove antes de travar a operação.
              </p>
            </div>
          </div>
        </BCard>
      )}

      {dicas && <div>{dicas}</div>}

      {lista.length === 0 ? (
        <BCard pad={24} delay={0.16}>
          <Vazio
            icone={I_ESCUDO}
            titulo="Você ainda não tem proxies"
            texto={erro
              ? 'Não foi possível carregar agora. Toque em Atualizar para tentar de novo.'
              : 'Compre uma proxy na loja e ela aparece aqui com a giga em tempo real.'}
            acao={<AcaoBtn onClick={aoComprar} icon={I_CARRINHO}>Ir para a Loja Proxy</AcaoBtn>}
          />
        </BCard>
      ) : (
        <>
          <div className="px-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'start' }}>
            {lista.map((px, i) => (
              <CartaoProxy key={px.id || i} px={px} indice={i} copiado={copiado} aoCopiar={aoCopiar} />
            ))}
          </div>

          {/* Resumo em lista: linha copiável de cada proxy, útil quando são
              muitas e o operador só quer pegar o endereço rápido. */}
          <Lista
            titulo="Resumo das proxies"
            delay={0.24}
            vazio="Nenhuma proxy ativa."
            linhas={lista.map((px, i) => {
              const pct = pctDe(px)
              const id = px.id || i
              return {
                k: id,
                avatar: String(i + 1),
                t: px.product_name || 'Proxy',
                s: <span style={{ fontFamily: MONO }}>{linhaDe(px)}</span>,
                v: giga(px.gb_remaining),
                vc: corPor(pct),
                acao: (
                  <button type="button" title="Copiar linha da proxy"
                    onClick={(e) => { e.stopPropagation(); aoCopiar && aoCopiar(linhaDe(px), id) }}
                    style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--b1)', background: 'var(--surface)', color: copiado === id ? 'var(--profit)' : 'var(--t3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ico d={copiado === id ? I_OK : I_COPIAR} s={14} />
                  </button>
                ),
              }
            })}
          />
        </>
      )}

      <style>{`
        @media (max-width: 1000px) {
          .px-grid { grid-template-columns: 1fr !important }
          .bk-tira { grid-template-columns: repeat(3, 1fr) !important }
        }
        @media (max-width: 600px) { .bk-tira { grid-template-columns: repeat(2, 1fr) !important } }
      `}</style>
    </div>
  )
}
