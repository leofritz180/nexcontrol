'use client'
// ─────────────────────────────────────────────────────────────────────────
// CONFIRMAR FINALIZAÇÃO (operador) — o passo que faltava antes de fechar.
//
// Antes, "Finalizar meta" disparava direto. Aqui o operador vê o que está
// encerrando — remessas, contas e o resultado — e confirma. A ação
// confirmada chama o MESMO toggleStatus de sempre.
// ─────────────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'
import { Folha } from '../ui/folha'
import { Ico, money, int, MONO, RED, RED2, ON_RED, GLOW } from '../ui/bento'

const I_BANDEIRA = <path d="M4 21V5a2 2 0 0 1 2-2h9l-1 3 1 3H6" />

export default function ConfirmarFinalizacao({ aberto, aoFechar, aoConfirmar, titulo, remessas = 0, contasFeitas = 0, contasAlvo = 0, resultado = 0, salvando = false }) {
  const positivo = Number(resultado) >= 0
  const faltam = Math.max(0, Number(contasAlvo) - Number(contasFeitas))
  return (
    <Folha aberto={aberto} aoFechar={aoFechar} largura={460} z={9050}>
      <div style={{ padding: '30px 28px 24px', textAlign: 'center' }}>
        <span style={{ width: 56, height: 56, borderRadius: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: `0 10px 24px ${GLOW}`, marginBottom: 16 }}>
          <Ico d={I_BANDEIRA} s={24} c={ON_RED} />
        </span>
        <h3 style={{ fontSize: 21, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: '-0.025em' }}>Finalizar esta meta?</h3>
        <p style={{ fontSize: 13, color: 'var(--t3)', margin: '0 0 20px', lineHeight: 1.55 }}>
          {titulo ? <b style={{ color: 'var(--t1)' }}>{titulo}</b> : 'A meta'} vai para o fechamento do admin. Você ainda consegue reativar depois.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { l: 'Remessas', v: int(remessas) },
            { l: 'Contas', v: `${int(contasFeitas)} / ${int(contasAlvo)}`, c: faltam > 0 ? 'var(--loss)' : 'var(--profit)' },
            { l: 'Resultado', v: (positivo ? '+' : '-') + money(Math.abs(Number(resultado) || 0)), c: positivo ? 'var(--profit)' : 'var(--loss)' },
          ].map(m => (
            <div key={m.l} style={{ padding: '12px 8px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
              <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 900, color: m.c || 'var(--t1)', margin: 0, whiteSpace: 'nowrap' }}>{m.v}</p>
              <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', margin: '5px 0 0' }}>{m.l}</p>
            </div>
          ))}
        </div>

        {faltam > 0 && (
          <p style={{ fontSize: 12, color: 'var(--loss)', margin: '0 0 16px', padding: '10px 12px', borderRadius: 12, background: 'var(--loss-dim)', border: '1px solid var(--loss-border)' }}>
            Ainda faltam {int(faltam)} conta{faltam === 1 ? '' : 's'} para bater o alvo.
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
          <button type="button" onClick={aoFechar}
            style={{ padding: '13px 16px', borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>
            Continuar operando
          </button>
          <motion.button type="button" onClick={aoConfirmar} disabled={salvando} whileHover={salvando ? {} : { y: -2, boxShadow: `0 16px 36px ${GLOW}` }} whileTap={salvando ? {} : { scale: 0.97 }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 18px', borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 900, color: ON_RED, background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: `0 12px 28px ${GLOW}`, opacity: salvando ? 0.7 : 1 }}>
            <Ico d={I_BANDEIRA} s={15} c={ON_RED} /> {salvando ? 'Finalizando…' : 'Finalizar meta'}
          </motion.button>
        </div>
      </div>
    </Folha>
  )
}
