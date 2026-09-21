'use client'
// ─────────────────────────────────────────────────────────────────────────
// NOVA OPERAÇÃO — criar meta em três passos (admin e operador).
//
//   1 · Onde     plataforma, rede e título
//   2 · Quanto   contas (com atalhos), modelo da meta (só admin) e notas
//   3 · Acesso   conta mãe (opcional) + leitura das metas anteriores
//
// Todo estado vive na página, exatamente como no modal antigo; este
// componente só recebe valores e setters. O `<form onSubmit={aoCriar}>` é o
// MESMO handler de antes (createMyMeta / handleCreate), e `podeCriar` é a
// mesma regra de habilitação. Enter nos passos 1 e 2 avança em vez de enviar,
// pra ninguém criar meta pela metade sem querer.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Folha, Passos } from '../ui/folha'
import { Ico, MONO, RED, RED2, int } from '../ui/bento'
import { Campo, Area, Pilulas, Linha } from '../ui/campo'

const I_BOLT = <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
const I_SETA = <path d="M5 12h14M13 6l6 6-6 6" />
const I_VOLTA = <polyline points="15 18 9 12 15 6" />
const I_CHECK = <path d="M20 6L9 17l-5-5" />
const I_OLHO = <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>
const I_OLHO_OFF = <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /></>
const I_COFRE = <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>

const MODELOS = [
  { k: 'salario_bau', l: 'Salário + Baú', d: 'Recebe salário fixo da rede mais o bônus das contas', ic: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></> },
  { k: 'apenas_bau', l: 'Apenas Baú', d: 'Só o bônus das contas, registrado por remessa', ic: <><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></> },
]

function Titulo({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.025em' }}>{children}</h3>
      {sub && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '3px 0 0' }}>{sub}</p>}
    </div>
  )
}

export default function NovaOperacaoV2({
  aberto, aoFechar, aoCriar, salvando = false, podeCriar = false, papel = 'admin',
  plataforma, setPlataforma, titulo, setTitulo, rede, setRede, contas, setContas,
  obs, setObs, modelo, setModelo,
  link, setLink, login, setLogin, senha, setSenha, mostrarSenha, setMostrarSenha,
  redes = [], multiRede = 'MÚLTIPLAS', dicas = [], alertas = [],
}) {
  const semMovimento = useReducedMotion()
  const [passo, setPasso] = useState(0)
  const [dir, setDir] = useState(1)
  const ultimo = passo === 2
  const ok1 = !!(String(plataforma || '').trim() && String(titulo || '').trim() && rede)
  const ok2 = Number(contas) > 0
  const podeAvancar = passo === 0 ? ok1 : ok2

  function ir(n) { setDir(n > passo ? 1 : -1); setPasso(n) }
  function teclou(e) {
    // Enter fora do último passo avança, não envia
    if (e.key === 'Enter' && !ultimo && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); if (podeAvancar) ir(passo + 1) }
  }

  const trans = { duration: semMovimento ? 0 : 0.32, ease: [0.33, 1, 0.68, 1] }
  const varia = { entra: (d) => ({ opacity: 0, x: d * 26 }), fica: { opacity: 1, x: 0 }, sai: (d) => ({ opacity: 0, x: d * -26 }) }

  return (
    <Folha aberto={aberto} aoFechar={aoFechar} largura={640}>
      <form onSubmit={aoCriar} onKeyDown={teclou} style={{ padding: '30px 30px 26px' }}>
        {/* cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 8px 20px rgba(229,57,31,0.28)' }}>
            <Ico d={I_BOLT} s={19} c="#fff" />
          </span>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.025em' }}>Nova operação</p>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '2px 0 0' }}>Configure a meta e comece em segundos</p>
          </div>
        </div>

        <div style={{ marginBottom: 26 }}>
          <Passos itens={['Onde', 'Quanto', 'Acesso']} atual={passo} aoIr={ir} />
        </div>

        <div style={{ position: 'relative', minHeight: 300 }}>
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {passo === 0 && (
              <motion.div key="p0" custom={dir} variants={varia} initial="entra" animate="fica" exit="sai" transition={trans}>
                <Titulo sub="Em qual plataforma e em qual rede a operação vai rodar.">Onde vai operar</Titulo>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Campo rotulo="Plataforma *" valor={plataforma} aoMudar={setPlataforma} placeholder="Nome da plataforma" autoFoco />
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>Rede *</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {[multiRede, ...redes].map(r => {
                        const on = rede === r, multi = r === multiRede
                        return (
                          <motion.button key={r} type="button" onClick={() => setRede(r)} whileTap={{ scale: 0.95 }}
                            style={{
                              padding: '8px 13px', borderRadius: 20, cursor: 'pointer', fontFamily: MONO, fontSize: 12, fontWeight: 800,
                              border: on ? 'none' : `1px solid ${multi ? 'var(--profit-border)' : 'var(--b1)'}`,
                              background: on ? '#15151a' : multi ? 'var(--profit-dim)' : 'var(--surface)',
                              color: on ? '#fff' : multi ? 'var(--profit)' : 'var(--t2)',
                              transition: 'background .15s ease, color .15s ease',
                            }}>
                            {multi ? 'Múltiplas redes' : r}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                  <Campo rotulo="Título *" valor={titulo} aoMudar={setTitulo} placeholder="Ex: Meta Abril" ajuda="Como ela vai aparecer no painel e no histórico." />
                </div>
              </motion.div>
            )}

            {passo === 1 && (
              <motion.div key="p1" custom={dir} variants={varia} initial="entra" animate="fica" exit="sai" transition={trans}>
                <Titulo sub="Quantas contas a meta vai processar e como o resultado é pago.">Quanto vai operar</Titulo>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 14, alignItems: 'end' }}>
                    <Campo rotulo="Contas *" valor={contas} aoMudar={setContas} inputMode="numeric" mono placeholder="10" autoFoco />
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>Seleção rápida</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                        {[20, 30, 50, 60].map(n => {
                          const on = Number(contas) === n
                          return (
                            <button key={n} type="button" onClick={() => setContas(String(n))}
                              style={{ padding: '11px 0', borderRadius: 14, border: on ? 'none' : '1px solid var(--b1)', background: on ? '#15151a' : 'var(--surface)', color: on ? '#fff' : 'var(--t2)', cursor: 'pointer', fontFamily: MONO, fontSize: 13, fontWeight: 800, transition: 'background .15s ease' }}>
                              {n}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {setModelo && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>Modelo da meta</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {MODELOS.map(m => {
                          const on = modelo === m.k
                          return (
                            <motion.button key={m.k} type="button" onClick={() => setModelo(m.k)} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                              style={{
                                position: 'relative', textAlign: 'left', padding: '16px 16px 14px', borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit',
                                background: on ? 'var(--loss-dim)' : 'var(--surface)', border: on ? '2px solid ' + RED : '1px solid var(--b1)',
                                transition: 'background .15s ease, border-color .15s ease',
                              }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 12, marginBottom: 10, background: on ? RED : 'var(--fill-2)', color: on ? '#fff' : 'var(--t2)' }}>
                                <Ico d={m.ic} s={16} c={on ? '#fff' : 'var(--t2)'} />
                              </span>
                              <p style={{ fontSize: 14, fontWeight: 800, color: on ? RED : 'var(--t1)', margin: 0 }}>{m.l}</p>
                              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '3px 0 0', lineHeight: 1.45 }}>{m.d}</p>
                              <AnimatePresence>
                                {on && (
                                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                    style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: RED, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ico d={I_CHECK} s={12} c="#fff" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {setObs && <Area rotulo="Observações" valor={obs} aoMudar={setObs} placeholder="Opcional — alguma instrução pra essa meta" alturaMin={76} />}
                </div>
              </motion.div>
            )}

            {passo === 2 && (
              <motion.div key="p2" custom={dir} variants={varia} initial="entra" animate="fica" exit="sai" transition={trans}>
                <Titulo sub="Credenciais ficam salvas pra acesso rápido nas remessas. Opcional.">Conta mãe</Titulo>
                <div style={{ padding: '18px 18px 16px', borderRadius: 20, background: 'var(--fill-1)', border: '1px solid var(--b1)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--b1)', color: 'var(--t2)' }}><Ico d={I_COFRE} s={14} /></span>
                    <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Acesso restrito ao seu tenant · senha mascarada por padrão</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Campo rotulo="Link de acesso" valor={link} aoMudar={setLink} placeholder="plataforma.com/login" mono />
                    <Linha>
                      <Campo rotulo="Login" valor={login} aoMudar={setLogin} placeholder="usuário ou e-mail" mono />
                      <div style={{ position: 'relative' }}>
                        <Campo rotulo="Senha" valor={senha} aoMudar={setSenha} tipo={mostrarSenha ? 'text' : 'password'} placeholder="••••••••" mono />
                        {setMostrarSenha && (
                          <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                            style={{ position: 'absolute', right: 10, bottom: 10, width: 26, height: 26, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ico d={mostrarSenha ? I_OLHO_OFF : I_OLHO} s={15} />
                          </button>
                        )}
                      </div>
                    </Linha>
                  </div>
                </div>

                {(dicas.length > 0 || alertas.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: alertas.length && dicas.length ? '1fr 1fr' : '1fr', gap: 10 }}>
                    {dicas.length > 0 && (
                      <div style={{ padding: '14px 16px', borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--b1)' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 10px' }}>Suas metas anteriores</p>
                        {dicas.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: i ? 7 : 0 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: d.tom === 'bom' ? 'var(--profit)' : d.tom === 'ruim' ? 'var(--loss)' : 'var(--t4)' }} />
                            <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.45 }}>{d.t}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {alertas.length > 0 && (
                      <div style={{ padding: '14px 16px', borderRadius: 18, background: 'var(--loss-dim)', border: '1px solid var(--loss-border)' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--loss)', margin: '0 0 10px' }}>Atenção</p>
                        {alertas.map((a, i) => <p key={i} style={{ fontSize: 12.5, color: 'var(--t1)', margin: i ? '7px 0 0' : 0, lineHeight: 1.45 }}>{a}</p>)}
                      </div>
                    )}
                  </div>
                )}

                {/* resumo do que vai ser criado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 16, padding: '12px 14px', borderRadius: 16, background: 'var(--profit-dim)', border: '1px solid var(--profit-border)' }}>
                  <Ico d={I_CHECK} s={14} c="var(--profit)" />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--profit)' }}>Pronto para iniciar</span>
                  <span style={{ fontSize: 12, color: 'var(--t2)', fontFamily: MONO }}>{[plataforma, rede === multiRede ? 'Múltiplas' : rede, `${int(contas)} contas`].filter(Boolean).join(' · ')}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* rodapé */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
          <button type="button" onClick={() => (passo === 0 ? aoFechar?.() : ir(passo - 1))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 16px', borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>
            <Ico d={I_VOLTA} s={14} /> {passo === 0 ? 'Cancelar' : 'Voltar'}
          </button>
          {!ultimo ? (
            <motion.button type="button" onClick={() => ir(passo + 1)} disabled={!podeAvancar} whileHover={podeAvancar ? { y: -2 } : {}} whileTap={podeAvancar ? { scale: 0.97 } : {}}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 30, border: 'none', cursor: podeAvancar ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff', background: podeAvancar ? '#15151a' : 'var(--fill-3)', transition: 'background .2s ease' }}>
              Continuar <Ico d={I_SETA} s={15} c="#fff" />
            </motion.button>
          ) : (
            <motion.button type="submit" disabled={!podeCriar || salvando} whileHover={podeCriar ? { y: -2, boxShadow: '0 16px 36px rgba(229,57,31,0.38)' } : {}} whileTap={podeCriar ? { scale: 0.97 } : {}}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 30, border: 'none', cursor: podeCriar ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 900, color: '#fff', background: podeCriar ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--fill-3)', boxShadow: podeCriar ? '0 12px 28px rgba(229,57,31,0.3)' : 'none', transition: 'background .2s ease' }}>
              {salvando ? 'Criando…' : (<><Ico d={I_BOLT} s={15} c="#fff" /> Iniciar operação</>)}
            </motion.button>
          )}
        </div>
      </form>
    </Folha>
  )
}
