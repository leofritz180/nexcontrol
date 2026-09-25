'use client'
// ─────────────────────────────────────────────────────────────────────────
// META — camada de LEITURA no visual 2.0.
//
// Esta é a página onde o dinheiro entra, então a migração é cirúrgica: aqui
// só vivem os três blocos de apresentação (cabeçalho, indicadores e
// progresso). O formulário de remessa, o histórico, o fechamento e todos os
// modais continuam exatamente onde estavam, intocados — eles servem aos dois
// caminhos, novo e antigo.
//
// Nada aqui calcula: todos os números chegam prontos da página, que já os
// deriva de `totais` e `remessas`. Mexer na conta do lucro_final a partir de
// um componente visual seria o jeito mais fácil de quebrar a operação.
// ─────────────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'
import { BCard, Tira, Ico, NumeroTexto, SOMBRA, MONO, RED, RED2, money, int, ON_RED, GLOW } from '../ui/bento'

const I_VOLTAR = <polyline points="15 18 9 12 15 6" />
const I_EDITAR = <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></>
const I_BANDEIRA = <><path d="M4 21V5a2 2 0 0 1 2-2h9l-1 3 1 3H6" /></>
const I_VOLTA = <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></>

function Chip({ rotulo, valor, cor }) {
  return (
    <div style={{ padding: '11px 16px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)', minWidth: 104 }}>
      <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 5px' }}>{rotulo}</p>
      <p style={{ fontFamily: MONO, fontSize: 14.5, fontWeight: 800, color: cor || 'var(--t1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{valor || '—'}</p>
    </div>
  )
}

function Botao({ children, onClick, icone, tom = 'neutro' }) {
  const fundo = tom === 'marca' ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--surface)'
  const cor = tom === 'marca' ? ON_RED : 'var(--t2)'
  return (
    <motion.button type="button" onClick={onClick}
      whileHover={{ y: -2, boxShadow: tom === 'marca' ? `0 14px 32px ${GLOW}` : SOMBRA.hover }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 30,
        border: tom === 'marca' ? 'none' : '1px solid var(--b1)', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 13, fontWeight: 700, color: cor, background: fundo,
        boxShadow: tom === 'marca' ? `0 10px 26px ${GLOW}` : '0 1px 2px rgba(0,0,0,0.04)',
      }}>
      {icone && <Ico d={icone} s={15} c={cor} />}{children}
    </motion.button>
  )
}

// ── CABEÇALHO ────────────────────────────────────────────────────────────
export function MetaHero({
  titulo, rede, plataforma, contas, observacoes,
  remessas = 0, acerto = 0, liquido = 0, statusRotulo, statusCor,
  podeEditar, aoEditar, podeAlternar, rotuloAlternar, aoAlternar, aoVoltar,
  extra,   // nó opcional na fileira de ações (ex.: Transmitir minha tela)
}) {
  const positivo = Number(liquido) >= 0
  return (
    <div style={{ marginBottom: 14 }}>
      <button type="button" onClick={aoVoltar}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, padding: '7px 13px 7px 9px',
          borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--surface)', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: 'var(--t3)',
        }}>
        <Ico d={I_VOLTAR} s={14} c="var(--t3)" /> Voltar ao painel
      </button>

      <BCard pad="26px 30px" blob={positivo ? ['var(--k-blob-pos-a)', 'var(--k-blob-pos-b)'] : ['var(--k-blob-neg-a)', 'var(--k-blob-neg-b)']} delay={0.02}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>{titulo || 'Meta'}</h1>
              {statusRotulo && (
                <span style={{
                  padding: '4px 12px', borderRadius: 30, fontSize: 10, fontWeight: 900,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: statusCor, background: 'var(--fill-2)', border: '1px solid var(--b1)',
                }}>{statusRotulo}</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
              {int(remessas)} remessa{remessas === 1 ? '' : 's'} · {int(acerto)}% de acerto
            </p>
            {observacoes && (
              <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '10px 0 0', lineHeight: 1.55, maxWidth: 520 }}>{observacoes}</p>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>Resultado</p>
            <NumeroTexto delay={0.14} style={{
              fontFamily: MONO, fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
              color: positivo ? 'var(--profit)' : 'var(--loss)',
            }}>{(positivo ? '+' : '-') + money(Math.abs(Number(liquido) || 0))}</NumeroTexto>
            <p style={{ fontSize: 12, color: 'var(--t4)', margin: '8px 0 0' }}>
              {positivo ? 'operação em lucro' : 'operação em prejuízo'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
          <Chip rotulo="Rede" valor={rede} cor="var(--loss)" />
          <Chip rotulo="Plataforma" valor={plataforma} />
          <Chip rotulo="Contas" valor={int(contas)} />
        </div>

        {(podeEditar || podeAlternar || extra) && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
            {extra}
            {podeEditar && <Botao onClick={aoEditar} icone={I_EDITAR}>Editar meta</Botao>}
            {podeAlternar && (
              <Botao onClick={aoAlternar} tom="marca" icone={String(rotuloAlternar).toLowerCase().includes('reativar') ? I_VOLTA : I_BANDEIRA}>
                {rotuloAlternar}
              </Botao>
            )}
          </div>
        )}
      </BCard>
    </div>
  )
}

// ── INDICADORES ──────────────────────────────────────────────────────────
export function MetaKpis({ deposito, saque, lucro, prejuizo, bau, mostrarBau, liquido }) {
  const positivo = Number(liquido) >= 0
  const itens = [
    { l: 'Depósito total', v: money(deposito) },
    { l: 'Saque total', v: money(saque) },
    ...(mostrarBau ? [{ l: 'Baú acumulado', v: money(bau), c: 'var(--profit)' }] : []),
    { l: 'Lucro acumulado', v: money(lucro), c: 'var(--profit)' },
    { l: 'Prejuízo acum.', v: money(prejuizo), c: 'var(--loss)' },
    { l: 'Resultado', v: (positivo ? '+' : '-') + money(Math.abs(Number(liquido) || 0)), c: positivo ? 'var(--profit)' : 'var(--loss)' },
  ]
  return <div style={{ marginBottom: 14 }}><Tira itens={itens} /></div>
}

// ── PROGRESSO ────────────────────────────────────────────────────────────
// Meia-rosca com o quanto das contas já foi processado, mais o que falta.
export function MetaProgresso({ pct = 0, feitas = 0, alvo = 0, restantes = 0, nota, delay = 0.12 }) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0))
  const R = 88, meia = Math.PI * R
  const completo = p >= 100
  return (
    <div style={{ marginBottom: 14 }}>
      <BCard pad={24} delay={delay}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 204, height: 116, flexShrink: 0 }}>
            <svg width={204} height={116} viewBox="0 0 204 116">
              <defs>
                <linearGradient id="mp-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={RED2} /><stop offset="100%" stopColor={RED} />
                </linearGradient>
              </defs>
              <path d={`M14,102 A${R},${R} 0 0 1 190,102`} fill="none" stroke="var(--fill-2)" strokeWidth="15" strokeLinecap="round" />
              <motion.path d={`M14,102 A${R},${R} 0 0 1 190,102`}
                fill="none" stroke={completo ? 'var(--profit)' : 'url(#mp-grad)'} strokeWidth="15" strokeLinecap="round"
                strokeDasharray={meia}
                initial={{ strokeDashoffset: meia }}
                animate={{ strokeDashoffset: meia * (1 - p / 100) }}
                transition={{ duration: 1.2, delay: delay + 0.15, ease: [0.33, 1, 0.68, 1] }} />
            </svg>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 2, textAlign: 'center' }}>
              <NumeroTexto delay={delay + 0.3} style={{ fontFamily: MONO, fontSize: 32, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.04em' }}>{p.toFixed(0) + '%'}</NumeroTexto>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 210 }}>
            <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {completo ? 'Contas concluídas' : 'Contas processadas'}
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px' }}>
              {nota || (completo ? 'a meta bateu o alvo de contas' : 'quanto da meta já foi operado')}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Chip rotulo="Feitas" valor={int(feitas)} cor={completo ? 'var(--profit)' : 'var(--t1)'} />
              <Chip rotulo="Alvo" valor={int(alvo)} />
              <Chip rotulo="Faltam" valor={int(restantes)} cor={restantes > 0 ? 'var(--loss)' : 'var(--profit)'} />
            </div>
          </div>
        </div>
      </BCard>
    </div>
  )
}
