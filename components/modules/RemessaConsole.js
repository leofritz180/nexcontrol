'use client'
// ─────────────────────────────────────────────────────────────────────────
// CONSOLE DE REMESSA — o formulário que o operador usa o dia inteiro.
//
// É só apresentação: todo estado e todo handler (handleAdd, upload de
// comprovante, captura de depósito, parseVal, o cálculo de `prev`) continuam
// na página. Este componente recebe os valores e os setters e devolve os
// mesmos eventos. A regra de "pode salvar" é a MESMA expressão do formulário
// antigo, passada pronta como `podeSalvar`.
//
// Desenho: três colunas (dados · valores · resumo ao vivo) e o resumo vira um
// mini-herói que muda de cor conforme o resultado aparece enquanto digita.
// ─────────────────────────────────────────────────────────────────────────
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { BCard, Ico, NumeroTexto, money, int, MONO, RED, RED2, SOMBRA, ON_RED, GLOW } from '../ui/bento'
import { Campo, CampoMoeda, Pilulas } from '../ui/campo'
import DepositCaptureButton from '../DepositCaptureButton'

const I_BOLT = <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
const I_CLIP = <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
const I_X = <path d="M18 6L6 18M6 6l12 12" />
const I_CHECK = <path d="M20 6L9 17l-5-5" />
const I_ESQ = <polyline points="15 18 9 12 15 6" />
const I_DIR = <polyline points="9 18 15 12 9 6" />

const TIPOS = [
  { v: 'remessa', l: 'Remessa' },
  { v: 'redeposito', l: 'Redepósito' },
  { v: 'bonus', l: 'Bônus' },
  { v: 'conta_mae', l: 'Conta mãe' },
  { v: 'ajuste', l: 'Ajuste' },
]

const STATUS = [
  { k: 'normal', l: 'Normal', c: 'var(--profit)' },
  { k: 'saque_pendente', l: 'Pendente', c: 'var(--t2)' },
  { k: 'conta_bloqueada', l: 'Bloqueada', c: 'var(--loss)' },
  { k: 'banco_analise', l: 'Análise', c: 'var(--t2)' },
]

function Rotulo({ children }) {
  return <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>{children}</p>
}

function Coluna({ n, titulo, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 22, height: 22, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, fontWeight: 900, color: ON_RED, background: `linear-gradient(135deg, ${RED2}, ${RED})` }}>{n}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{titulo}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

export default function RemessaConsole({
  numero = 1, metaId,
  // slots
  slots = [], slotAtivo = '', aoEscolherSlot,
  // dados
  titulo, setTitulo, tipo, setTipo, saldoIni, setSaldoIni, contas, setContas,
  // valores
  dep, setDep, saq, setSaq, bau, setBau, mostrarBau = false,
  comprovantes = [], normFoto, fmtFotoTs, aoRemoverComprovante, aoAnexar, aoColar, enviandoComprovante = false, erroComprovante = '',
  status, setStatus, notas, setNotas,
  // resumo
  temEntrada = false, resultado = 0, porConta = 0, roi = 0, contasN = 0, depN = 0,
  erro = '', salvando = false, podeSalvar = false, aoEnviar,
}) {
  const semMovimento = useReducedMotion()
  const positivo = resultado > 0, negativo = resultado < 0
  const cor = !temEntrada ? 'var(--t3)' : positivo ? 'var(--profit)' : negativo ? 'var(--loss)' : 'var(--t2)'
  const fundo = !temEntrada ? 'var(--fill-1)' : positivo ? 'var(--profit-dim)' : negativo ? 'var(--loss-dim)' : 'var(--fill-1)'
  const borda = !temEntrada ? 'var(--b1)' : positivo ? 'var(--profit-border)' : negativo ? 'var(--loss-border)' : 'var(--b1)'
  const semContas = tipo === 'bonus' || tipo === 'conta_mae'

  function rolar(dx) { const el = document.getElementById('slot-nf'); if (el) el.scrollBy({ left: dx, behavior: 'smooth' }) }

  return (
    <BCard pad={0} delay={0.08} style={{ marginBottom: 14, overflow: 'visible' }}>
      <form onSubmit={aoEnviar} onPaste={aoColar}>
        {/* cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '20px 24px 16px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: `0 8px 20px ${GLOW}` }}>
              <Ico d={I_BOLT} s={18} c={ON_RED} />
            </span>
            <div>
              <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Registrar remessa</p>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0', fontFamily: MONO }}>#{int(numero)} desta meta</p>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 30, background: 'var(--fill-1)', border: '1px solid var(--b1)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--t2)' }}>
            <motion.span animate={semMovimento ? {} : { opacity: [1, 0.25, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--profit)' }} />
            AO VIVO
          </span>
        </div>

        {/* slots */}
        <div style={{ padding: '16px 24px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div>
              <Rotulo>Slot utilizado</Rotulo>
              <p style={{ fontSize: 12.5, color: slotAtivo ? 'var(--t1)' : 'var(--t4)', fontWeight: slotAtivo ? 800 : 500, margin: '-4px 0 0' }}>{slotAtivo || 'opcional · toque para escolher'}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[[-280, I_ESQ], [280, I_DIR]].map(([dx, ic], i) => (
                <button key={i} type="button" onClick={() => rolar(dx)}
                  style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--b1)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--t3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico d={ic} s={14} />
                </button>
              ))}
            </div>
          </div>
          <div id="slot-nf" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', scrollSnapType: 'x proximity' }}>
            <style>{`#slot-nf::-webkit-scrollbar{display:none}`}</style>
            {slots.map(s => {
              const ativo = slotAtivo === s.name
              return (
                <motion.button key={s.name} type="button" onClick={() => aoEscolherSlot?.(ativo ? '' : s.name)}
                  whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                  style={{
                    position: 'relative', minWidth: 108, maxWidth: 108, flexShrink: 0, padding: 0, textAlign: 'left', cursor: 'pointer',
                    borderRadius: 14, overflow: 'hidden', scrollSnapAlign: 'start', fontFamily: 'inherit',
                    background: 'var(--surface)', border: ativo ? `2px solid ${RED}` : '1px solid var(--b1)',
                    boxShadow: ativo ? '0 10px 24px rgba(229,57,31,0.22)' : SOMBRA.repouso, transition: 'border-color .15s ease, box-shadow .15s ease',
                  }}>
                  <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--fill-2)' }}>
                    <img src={s.image} alt={s.name} loading="lazy" onError={e => { e.currentTarget.style.opacity = 0 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {s.provider && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 7.5, fontWeight: 800, padding: '2px 6px', borderRadius: 20, background: 'rgba(0,0,0,0.55)', color: '#fff', letterSpacing: '0.06em' }}>{s.provider}</span>}
                    <AnimatePresence>
                      {ativo && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                          style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: RED, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }}>
                          <Ico d={I_CHECK} s={12} c={ON_RED} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div style={{ padding: '8px 9px 9px' }}>
                    <p style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--t1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</p>
                    {s.performance && <p style={{ fontSize: 9.5, color: 'var(--t4)', margin: '2px 0 0' }}>{s.performance}</p>}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* três colunas */}
        <div className="rc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 22, padding: '10px 24px 24px' }}>
          <Coluna n="1" titulo="Dados">
            <Campo rotulo="Título" valor={titulo} aoMudar={setTitulo} placeholder="1ª remessa…" />
            <Pilulas rotulo="Tipo" opcoes={TIPOS} valor={tipo} aoMudar={setTipo} compacto />
            <Campo rotulo="Saldo inicial" valor={saldoIni} aoMudar={setSaldoIni} inputMode="decimal" mono />
            {semContas ? (
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, lineHeight: 1.5, padding: '10px 12px', borderRadius: 12, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
                {tipo === 'bonus' ? 'Bônus não altera o número de contas — registre só o valor do saque.' : 'Conta mãe registra só depósito e saque, sem contas.'}
              </p>
            ) : (
              <div>
                <Campo rotulo="Contas" valor={contas} aoMudar={setContas} placeholder="5" inputMode="numeric" mono obrigatorio={tipo !== 'redeposito'} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[3, 5, 10, 15, 20].map(n => {
                    const on = Number(contas) === n
                    return (
                      <button key={n} type="button" onClick={() => setContas(String(n))}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: on ? 'none' : '1px solid var(--b1)', background: on ? '#15151a' : 'var(--surface)', color: on ? '#fff' : 'var(--t3)', cursor: 'pointer', fontFamily: MONO, fontSize: 12, fontWeight: 800, transition: 'background .15s ease' }}>
                        {n}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </Coluna>

          <Coluna n="2" titulo="Valores">
            {tipo !== 'bonus' && (
              <div>
                <CampoMoeda rotulo="Depósito" valor={dep} aoMudar={setDep} placeholder="Ex: 1055" obrigatorio />
                <div style={{ marginTop: 8 }}><DepositCaptureButton metaId={metaId} onTotal={(t) => setDep(String(t))} compact /></div>
              </div>
            )}
            <CampoMoeda rotulo={tipo === 'bonus' ? 'Valor do bônus (saque)' : 'Saque'} obrigatorio valor={saq} aoMudar={setSaq} placeholder="Ex: 941" obrigatorio />
            {mostrarBau && <CampoMoeda rotulo="Baú" valor={bau} aoMudar={setBau} placeholder="Ex: 50" />}

            <div>
              <Rotulo>Comprovantes <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500, color: 'var(--t4)' }}>(fotos dos saques)</span></Rotulo>
              {comprovantes.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {comprovantes.map((item, ci) => {
                    const f = normFoto ? normFoto(item) : (typeof item === 'string' ? { url: item } : item || {})
                    return (
                      <div key={ci} style={{ position: 'relative', width: 58, height: 58, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--b1)', background: 'var(--fill-2)' }}>
                        <a href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={`comprovante ${ci + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></a>
                        {f.ts && !f.burned && fmtFotoTs && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 7.5, padding: '2px 4px', background: 'rgba(0,0,0,0.6)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden' }}>{fmtFotoTs(f.ts)}</span>}
                        <button type="button" title="Remover" onClick={() => aoRemoverComprovante?.(ci)}
                          style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <Ico d={I_X} s={10} c="#fff" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, border: '1px dashed var(--b3)', background: 'var(--fill-1)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--t2)' }}>
                {enviandoComprovante ? 'Enviando…' : (<><Ico d={I_CLIP} s={14} /> {comprovantes.length > 0 ? 'Adicionar outra foto' : 'Anexar ou colar foto'}</>)}
                <input type="file" accept="image/*" multiple onChange={aoAnexar} style={{ display: 'none' }} />
              </label>
              {erroComprovante && <p style={{ fontSize: 11.5, color: 'var(--loss)', margin: '6px 0 0' }}>{erroComprovante}</p>}
            </div>

            <div>
              <Rotulo>Status</Rotulo>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {STATUS.map(s => {
                  const on = status === s.k
                  return (
                    <button key={s.k} type="button" onClick={() => setStatus(s.k)}
                      style={{ padding: '8px 4px', borderRadius: 12, border: on ? 'none' : '1px solid var(--b1)', background: on ? '#15151a' : 'var(--surface)', color: on ? '#fff' : s.c, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10.5, fontWeight: 800, transition: 'background .15s ease' }}>
                      {s.l}
                    </button>
                  )
                })}
              </div>
            </div>
            <Campo rotulo="Notas" valor={notas} aoMudar={setNotas} placeholder="Opcional…" />
          </Coluna>

          <Coluna n="3" titulo="Resumo ao vivo">
            <motion.div animate={{ backgroundColor: fundo, borderColor: borda }} transition={{ duration: 0.3 }}
              style={{ padding: '20px 18px', borderRadius: 20, border: '1px solid', textAlign: 'center' }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>Resultado parcial</p>
              {temEntrada
                ? <NumeroTexto duracao={0.5} style={{ fontFamily: MONO, fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em', color: cor, display: 'block', lineHeight: 1 }}>{(resultado >= 0 ? '+' : '-') + money(Math.abs(resultado))}</NumeroTexto>
                : <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 900, color: 'var(--t4)', display: 'block', lineHeight: 1 }}>—</span>}
              <p style={{ fontSize: 11.5, color: cor, fontWeight: 700, margin: '10px 0 0' }}>
                {!temEntrada ? 'aguardando dados' : positivo ? 'operação positiva' : negativo ? 'operação negativa' : 'operação neutra'}
              </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { l: 'Por conta', v: temEntrada && contasN > 0 ? (porConta >= 0 ? '+' : '-') + money(Math.abs(porConta)) : '—', c: porConta >= 0 ? 'var(--profit)' : 'var(--loss)' },
                { l: 'ROI', v: temEntrada && depN > 0 ? (roi >= 0 ? '+' : '-') + Math.abs(roi).toFixed(0) + '%' : '—', c: roi >= 0 ? 'var(--profit)' : 'var(--loss)' },
                { l: 'Contas', v: contasN ? int(contasN) : '—', c: 'var(--t1)' },
              ].map(s => (
                <div key={s.l} style={{ padding: '10px 6px', borderRadius: 14, background: 'var(--fill-1)', border: '1px solid var(--b1)', textAlign: 'center' }}>
                  <p style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 900, color: temEntrada ? s.c : 'var(--t4)', margin: 0, whiteSpace: 'nowrap' }}>{s.v}</p>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', margin: '4px 0 0' }}>{s.l}</p>
                </div>
              ))}
            </div>

            {erro && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'var(--loss-dim)', border: '1px solid var(--loss-border)', fontSize: 12, color: 'var(--loss)', lineHeight: 1.45 }}>
                <span style={{ marginTop: 1 }}><Ico d={<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>} s={13} c="var(--loss)" /></span>{erro}
              </div>
            )}

            <motion.button type="submit" disabled={!podeSalvar}
              whileHover={podeSalvar ? { y: -2, boxShadow: '0 16px 36px rgba(229,57,31,0.38)' } : {}} whileTap={podeSalvar ? { scale: 0.97 } : {}}
              style={{
                width: '100%', padding: '15px 18px', borderRadius: 30, border: 'none', cursor: podeSalvar ? 'pointer' : 'not-allowed',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                fontFamily: 'inherit', fontSize: 14, fontWeight: 900, color: ON_RED, letterSpacing: '-0.01em',
                background: podeSalvar ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--fill-3)',
                boxShadow: podeSalvar ? `0 12px 28px ${GLOW}` : 'none',
                transition: 'background .2s ease, box-shadow .2s ease',
              }}>
              {salvando
                ? (<><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}><Ico d={<><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></>} s={15} c={ON_RED} /></motion.span> Registrando…</>)
                : (<><Ico d={I_BOLT} s={15} c="#fff" /> Registrar remessa</>)}
            </motion.button>
          </Coluna>
        </div>
      </form>
      <style>{`@media (max-width: 980px) { .rc-grid { grid-template-columns: 1fr !important; } }`}</style>
    </BCard>
  )
}
