'use client'
// ─────────────────────────────────────────────────────────────────────────
// FECHAMENTO DA META (admin) — a folha onde entram salário, baú e custos.
//
// Só apresentação. O AdminCloseModal da página continua dono do estado, do
// cálculo (lucroFinal = lucroAcum + salário + baú; prejFinal = prejAcum +
// custos) e do confirm() que grava. Aqui os campos só devolvem a string
// digitada — e como o cálculo antigo usa Number(...), os campos aceitam
// apenas dígitos e ponto, igual ao <input type="number"> de antes.
// ─────────────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'
import { Folha } from '../ui/folha'
import { Ico, NumeroTexto, money, MONO, RED, RED2, ON_RED, GLOW } from '../ui/bento'
import { Campo } from '../ui/campo'

const I_BANDEIRA = <path d="M4 21V5a2 2 0 0 1 2-2h9l-1 3 1 3H6" />
const I_CHECK = <path d="M20 6L9 17l-5-5" />

// só o que Number() entende: dígitos e um ponto
const soNumero = (s) => String(s || '').replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

function Linha({ rotulo, valor, cor, forte }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--b1)' }}>
      <span style={{ fontSize: 12.5, color: forte ? 'var(--t1)' : 'var(--t3)', fontWeight: forte ? 800 : 600 }}>{rotulo}</span>
      <span style={{ fontFamily: MONO, fontSize: forte ? 15 : 13, fontWeight: 800, color: cor || 'var(--t1)' }}>{valor}</span>
    </div>
  )
}

export default function FechamentoV2({
  titulo, rede, isApenasBau = false,
  lucroAcum = 0, prejAcum = 0, bauAcumRemessas = 0,
  salPlat, setSalPlat, bau, setBau, gastos, setGastos,
  lucroFinal = 0, prejFinal = 0, resultado = 0,
  saving = false, err = '', aoConfirmar, aoFechar,
}) {
  const positivo = Number(resultado) >= 0
  const cor = positivo ? 'var(--profit)' : 'var(--loss)'
  const liqRemessas = Number(lucroAcum) - Number(prejAcum)

  return (
    <Folha aberto={true} aoFechar={aoFechar} largura={620} z={9050}>
      <div style={{ padding: '30px 30px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: `0 8px 20px ${GLOW}` }}>
            <Ico d={I_BANDEIRA} s={18} c={ON_RED} />
          </span>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.025em' }}>Fechar a meta</p>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '2px 0 0' }}>{[titulo, rede].filter(Boolean).join(' · ')}</p>
          </div>
        </div>

        <div className="fc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* esquerda: o que vem das remessas */}
          <div style={{ padding: '16px 18px', borderRadius: 20, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>Resultado das remessas</p>
            <Linha rotulo="Lucro acumulado" valor={'+' + money(lucroAcum)} cor="var(--profit)" />
            <Linha rotulo="Prejuízo acumulado" valor={'-' + money(prejAcum)} cor="var(--loss)" />
            {isApenasBau && <Linha rotulo="Baú nas remessas" valor={'+' + money(bauAcumRemessas)} cor="var(--profit)" />}
            <Linha rotulo="Líquido das remessas" valor={(liqRemessas >= 0 ? '+' : '-') + money(Math.abs(liqRemessas))} cor={liqRemessas >= 0 ? 'var(--profit)' : 'var(--loss)'} forte />
          </div>

          {/* direita: o que o admin informa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Campo rotulo="Salário da rede (R$)" valor={salPlat} aoMudar={v => setSalPlat(soNumero(v))} inputMode="decimal" mono placeholder="0" autoFoco />
            {!isApenasBau
              ? <Campo rotulo="Baú (R$)" valor={bau} aoMudar={v => setBau(soNumero(v))} inputMode="decimal" mono placeholder="0" />
              : <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0, padding: '10px 12px', borderRadius: 12, background: 'var(--fill-1)', border: '1px solid var(--b1)', lineHeight: 1.45 }}>Nesta meta o baú já entrou remessa a remessa — não conta duas vezes.</p>}
            <Campo rotulo="Custos operacionais (R$)" valor={gastos} aoMudar={v => setGastos(soNumero(v))} inputMode="decimal" mono placeholder="0" ajuda="Proxy, chip, SMS — o que saiu do seu bolso nesta meta." />
          </div>
        </div>

        {/* resultado final ao vivo */}
        <motion.div animate={{ backgroundColor: positivo ? 'var(--profit-dim)' : 'var(--loss-dim)', borderColor: positivo ? 'var(--profit-border)' : 'var(--loss-border)' }} transition={{ duration: 0.3 }}
          style={{ margin: '16px 0 18px', padding: '18px 22px', borderRadius: 20, border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>Lucro final da meta</p>
            <NumeroTexto duracao={0.5} style={{ fontFamily: MONO, fontSize: 34, fontWeight: 900, letterSpacing: '-0.04em', color: cor, lineHeight: 1 }}>
              {(positivo ? '+' : '-') + money(Math.abs(Number(resultado) || 0))}
            </NumeroTexto>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', textAlign: 'right', lineHeight: 1.6 }}>
            <div>ganhos <b style={{ color: 'var(--profit)', fontFamily: MONO }}>+{money(lucroFinal)}</b></div>
            <div>saídas <b style={{ color: 'var(--loss)', fontFamily: MONO }}>-{money(prejFinal)}</b></div>
          </div>
        </motion.div>

        {err && <p style={{ fontSize: 12.5, color: 'var(--loss)', margin: '0 0 12px', padding: '10px 12px', borderRadius: 12, background: 'var(--loss-dim)', border: '1px solid var(--loss-border)' }}>{err}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 10 }}>
          <button type="button" onClick={aoFechar}
            style={{ padding: '13px 16px', borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>
            Cancelar
          </button>
          <motion.button type="button" onClick={aoConfirmar} disabled={saving} whileHover={saving ? {} : { y: -2, boxShadow: `0 16px 36px ${GLOW}` }} whileTap={saving ? {} : { scale: 0.97 }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 18px', borderRadius: 30, border: 'none', cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 900, color: ON_RED, background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: `0 12px 28px ${GLOW}`, opacity: saving ? 0.7 : 1 }}>
            <Ico d={I_CHECK} s={15} c={ON_RED} /> {saving ? 'Fechando…' : 'Confirmar fechamento'}
          </motion.button>
        </div>
      </div>
      <style>{`@media (max-width: 600px) { .fc-grid { grid-template-columns: 1fr !important; } }`}</style>
    </Folha>
  )
}
