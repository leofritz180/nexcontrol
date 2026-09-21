'use client'
// ─────────────────────────────────────────────────────────────────────────
// CONFIRMAR — substitui o window.confirm() do navegador.
//
// O confirm nativo é síncrono e trava a aba, tem a cara do sistema
// operacional e não dá pra dizer o que está sendo apagado. Aqui a pergunta
// vira uma Folha do V2, com o nome do item e o peso certo no botão.
//
// A API é uma promessa, então o código que chamava
//     if (!confirm('Apagar?')) return
// vira
//     if (!(await perguntar({ ... }))) return
// — mesma leitura, mesmo fluxo, sem reescrever a função em volta.
//
// Fora do provider a promessa cai no confirm nativo. Isso importa: uma tela
// que ainda não foi migrada continua perguntando, em vez de apagar direto.
// ─────────────────────────────────────────────────────────────────────────
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Folha } from '../ui/folha'
import { Ico, RED, RED2 } from '../ui/bento'

const Ctx = createContext(null)

const I_ALERTA = <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>
const I_LIXO = <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />

export function ProvedorDeConfirmacao({ children }) {
  const [pedido, setPedido] = useState(null)
  const resolver = useRef(null)

  const perguntar = useCallback((opts = {}) => new Promise(ok => {
    resolver.current = ok
    setPedido({
      titulo: opts.titulo || 'Tem certeza?',
      texto: opts.texto || '',
      alvo: opts.alvo || '',
      confirmar: opts.confirmar || 'Confirmar',
      cancelar: opts.cancelar || 'Cancelar',
      perigo: opts.perigo !== false,
    })
  }), [])

  function responder(v) {
    setPedido(null)
    const f = resolver.current
    resolver.current = null
    f?.(v)
  }

  return (
    <Ctx.Provider value={perguntar}>
      {children}
      <Folha aberto={!!pedido} aoFechar={() => responder(false)} largura={440} z={10090}>
        {pedido && (
          <div style={{ padding: '30px 28px 24px', textAlign: 'center' }}>
            <span style={{
              width: 54, height: 54, borderRadius: 18, marginBottom: 16,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: pedido.perigo ? 'var(--loss-dim)' : 'var(--fill-1)',
              border: `1px solid ${pedido.perigo ? 'var(--loss-border)' : 'var(--b1)'}`,
              color: pedido.perigo ? 'var(--loss)' : 'var(--t2)',
            }}>
              <Ico d={pedido.perigo ? I_LIXO : I_ALERTA} s={23} c={pedido.perigo ? 'var(--loss)' : 'var(--t2)'} />
            </span>

            <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px', letterSpacing: '-0.025em' }}>{pedido.titulo}</h3>
            {pedido.alvo && (
              <p style={{
                display: 'inline-block', maxWidth: '100%', margin: '0 0 10px', padding: '7px 14px', borderRadius: 30,
                background: 'var(--fill-1)', border: '1px solid var(--b1)',
                fontFamily: 'var(--mono, monospace)', fontSize: 12.5, fontWeight: 800, color: 'var(--t1)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{pedido.alvo}</p>
            )}
            {pedido.texto && (
              <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 22px', lineHeight: 1.55 }}>{pedido.texto}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 10, marginTop: pedido.texto ? 0 : 20 }}>
              <button type="button" onClick={() => responder(false)} autoFocus
                style={{ padding: '13px 16px', borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>
                {pedido.cancelar}
              </button>
              <motion.button type="button" onClick={() => responder(true)}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '13px 18px', borderRadius: 30, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: 900, color: '#fff',
                  background: pedido.perigo ? 'var(--loss)' : `linear-gradient(135deg, ${RED2}, ${RED})`,
                  boxShadow: '0 10px 26px rgba(0,0,0,0.16)',
                }}>
                {pedido.confirmar}
              </motion.button>
            </div>
          </div>
        )}
      </Folha>
    </Ctx.Provider>
  )
}

export function useConfirmar() {
  const ctx = useContext(Ctx)
  // Sem provider, cai no nativo: uma tela nao migrada continua perguntando
  // em vez de apagar direto.
  return ctx || (async (opts = {}) => window.confirm([opts.titulo, opts.alvo, opts.texto].filter(Boolean).join('\n\n')))
}
