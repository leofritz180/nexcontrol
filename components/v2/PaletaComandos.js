'use client'
// ─────────────────────────────────────────────────────────────────────────
// PALETA DE COMANDOS (Ctrl+K / ⌘K)
//
// Muda COMO o sistema é usado, não só como ele parece: de qualquer tela, o
// admin acha uma meta, um operador ou uma rede e chega lá sem navegar.
//
// Decisões que valem registro:
//  • A busca é local. Os dados já estão em memória na página que abriu o
//    painel — ir ao banco a cada tecla seria pior e mais caro.
//  • Pontuação simples: começo-da-palavra vale mais que meio-da-palavra, e
//    o que foi usado por último sobe. Sem biblioteca de fuzzy.
//  • Não entra no coordenador de overlays: a paleta é uma ferramenta que o
//    usuário ABRE de propósito, então ela tem que abrir mesmo com um tour ou
//    banner na tela — o oposto de um pop-up que disputa atenção.
// ─────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SOMBRA, Ico, MONO, RED, RED2, money0, ON_RED } from '../ui/bento'

const CHAVE_RECENTES = 'nx_paleta_recentes'

const I_BUSCA = <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>
const I_SETA = <path d="M5 12h14M13 6l6 6-6 6" />
const I_ALVO = <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>
const I_GENTE = <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>
const I_REDE = <><path d="M3 3v18h18" /><path d="M7 15l3-3 4 4 5-6" /></>
const I_MAIS = <path d="M12 5v14M5 12h14" />
const I_TELA = <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>

const NAV_ADMIN = [
  ['/admin', 'Painel'], ['/operadores', 'Operadores'], ['/redes', 'Redes'],
  ['/faturamento', 'Faturamento'], ['/custos', 'Custos'], ['/pix', 'Chaves PIX'],
  ['/slots', 'Slots Premium'], ['/premiacoes', 'Premiações'], ['/afiliados', 'Afiliados'],
  ['/proxy', 'Loja Proxy'], ['/minhas-proxies', 'Minhas Proxies'], ['/network', 'Network'],
  ['/tutorial', 'Tutorial'], ['/billing', 'Assinatura'],
]
const NAV_OPERADOR = [
  ['/operator', 'Painel'], ['/performance', 'Performance'], ['/pix', 'Chaves PIX'],
  ['/slots', 'Slots Premium'], ['/proxy', 'Loja Proxy'], ['/minhas-proxies', 'Minhas Proxies'],
]

// tira acento e caixa — "métricas" acha com "metricas"
const limpa = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function pontuar(texto, termo) {
  const a = limpa(texto), b = limpa(termo)
  if (!b) return 0
  const i = a.indexOf(b)
  if (i < 0) return -1
  // começo da string vale mais; começo de palavra vale quase o mesmo
  if (i === 0) return 100
  if (a[i - 1] === ' ' || a[i - 1] === '-' || a[i - 1] === '/') return 80
  return 50 - Math.min(40, i)
}

export default function PaletaComandos({ ativo, isAdmin, metas = [], operadores = [], redes = [], aoNovaMeta }) {
  const router = useRouter()
  const semMovimento = useReducedMotion()
  const [aberta, setAberta] = useState(false)
  const [termo, setTermo] = useState('')
  const [sel, setSel] = useState(0)
  const [recentes, setRecentes] = useState([])
  const inputRef = useRef(null)
  const listaRef = useRef(null)

  // atalho global
  useEffect(() => {
    if (!ativo) return
    function tecla(e) {
      const k = String(e.key || '').toLowerCase()
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); setAberta(v => !v) }
      else if (k === 'escape') setAberta(false)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [ativo])

  useEffect(() => {
    if (!aberta) return
    setTermo(''); setSel(0)
    try { setRecentes(JSON.parse(localStorage.getItem(CHAVE_RECENTES) || '[]')) } catch {}
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { clearTimeout(t); document.body.style.overflow = antes }
  }, [aberta])

  const guardar = useCallback((id) => {
    try {
      const novos = [id, ...recentes.filter(r => r !== id)].slice(0, 6)
      localStorage.setItem(CHAVE_RECENTES, JSON.stringify(novos))
      setRecentes(novos)
    } catch {}
  }, [recentes])

  // ── catálogo de tudo que a paleta alcança ──
  const itens = useMemo(() => {
    const out = []
    if (aoNovaMeta) out.push({ id: 'acao:nova-meta', grupo: 'Ação', titulo: 'Criar nova meta', sub: 'abre o formulário de nova operação', ico: I_MAIS, destaque: true, faz: aoNovaMeta })
    for (const [href, label] of (isAdmin ? NAV_ADMIN : NAV_OPERADOR)) {
      out.push({ id: 'nav:' + href, grupo: 'Ir para', titulo: label, sub: href, ico: I_TELA, faz: () => router.push(href) })
    }
    for (const m of metas) {
      if (m?.deleted_at) continue
      const fechada = m?.status_fechamento === 'fechada'
      out.push({
        id: 'meta:' + m.id, grupo: 'Metas',
        titulo: m.titulo || 'Meta sem título',
        sub: [m.rede, m.plataforma, fechada ? 'fechada' : 'aberta'].filter(Boolean).join(' · '),
        valor: m.lucro_final != null ? money0(m.lucro_final) : null,
        positivo: Number(m.lucro_final || 0) >= 0,
        ico: I_ALVO, faz: () => router.push('/meta/' + m.id),
      })
    }
    for (const o of operadores) {
      const nome = o?.nome || o?.email?.split('@')[0] || 'Operador'
      out.push({
        id: 'op:' + (o.id || nome), grupo: 'Operadores', titulo: nome, sub: o?.email || '',
        valor: o?.lucroFinal != null ? money0(o.lucroFinal) : null, positivo: Number(o?.lucroFinal || 0) >= 0,
        ico: I_GENTE, faz: () => router.push('/operadores'),
      })
    }
    for (const r of redes) {
      const nome = typeof r === 'string' ? r : (r?.nome || '')
      if (!nome) continue
      out.push({
        id: 'rede:' + nome, grupo: 'Redes', titulo: nome,
        sub: typeof r === 'object' && r?.metas ? `${r.metas.length} metas` : 'rede operada',
        valor: typeof r === 'object' && r?.lucroFinal != null ? money0(r.lucroFinal) : null,
        positivo: Number(r?.lucroFinal || 0) >= 0,
        ico: I_REDE, faz: () => router.push('/redes'),
      })
    }
    return out
  }, [isAdmin, metas, operadores, redes, router, aoNovaMeta])

  const filtrados = useMemo(() => {
    if (!termo.trim()) {
      const recSet = new Set(recentes)
      const rec = itens.filter(i => recSet.has(i.id))
      const resto = itens.filter(i => !recSet.has(i.id) && (i.destaque || i.grupo === 'Ir para'))
      return [...rec, ...resto].slice(0, 12)
    }
    return itens
      .map(i => ({ i, p: Math.max(pontuar(i.titulo, termo), pontuar(i.sub || '', termo) - 20) }))
      .filter(x => x.p > 0)
      .sort((a, b) => b.p - a.p)
      .slice(0, 14)
      .map(x => x.i)
  }, [itens, termo, recentes])

  useEffect(() => { setSel(0) }, [termo])

  // mantém o selecionado visível
  useEffect(() => {
    const el = listaRef.current?.querySelector('[data-sel="true"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [sel, filtrados])

  function executar(it) {
    if (!it) return
    guardar(it.id)
    setAberta(false)
    // deixa a folha fechar antes de navegar, senão a saída é cortada
    setTimeout(() => it.faz?.(), semMovimento ? 0 : 130)
  }

  function navegarTeclado(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, filtrados.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); executar(filtrados[sel]) }
  }

  if (!ativo) return null

  let grupoAtual = null

  return (
    <AnimatePresence>
      {aberta && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: semMovimento ? 0 : 0.18 }}
          onClick={e => { if (e.target === e.currentTarget) setAberta(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10080,
            background: 'rgba(17,19,24,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 20px 20px',
          }}>
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: -14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: semMovimento ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%', maxWidth: 580, background: 'var(--surface)', border: '1px solid var(--b1)',
              borderRadius: 24, boxShadow: SOMBRA.flutuante, overflow: 'hidden',
            }}>
            {/* campo de busca */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--b1)' }}>
              <Ico d={I_BUSCA} s={18} c="var(--t3)" />
              <input
                ref={inputRef} value={termo} onChange={e => setTermo(e.target.value)} onKeyDown={navegarTeclado}
                placeholder="Buscar meta, operador, rede… ou ir para um módulo"
                className="nx-campo-ctl"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: 'var(--t1)', minWidth: 0 }}
              />
              <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 800, color: 'var(--t4)', padding: '4px 8px', borderRadius: 8, background: 'var(--fill-1)', border: '1px solid var(--b1)', whiteSpace: 'nowrap' }}>ESC</span>
            </div>

            {/* resultados */}
            <div ref={listaRef} style={{ maxHeight: '54vh', overflowY: 'auto', padding: 8 }}>
              {filtrados.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '30px 20px', margin: 0 }}>
                  Nada encontrado para “{termo}”.
                </p>
              )}
              {filtrados.map((it, i) => {
                const novoGrupo = it.grupo !== grupoAtual
                grupoAtual = it.grupo
                const on = i === sel
                return (
                  <div key={it.id}>
                    {novoGrupo && (
                      <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t4)', margin: i === 0 ? '4px 10px 6px' : '14px 10px 6px' }}>{it.grupo}</p>
                    )}
                    <button type="button" data-sel={on ? 'true' : 'false'}
                      onMouseEnter={() => setSel(i)} onClick={() => executar(it)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                        borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                        background: on ? 'var(--fill-2)' : 'transparent', transition: 'background .12s ease',
                      }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: 11, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: it.destaque ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--fill-1)',
                        border: it.destaque ? 'none' : '1px solid var(--b1)',
                        color: it.destaque ? ON_RED : 'var(--t2)',
                      }}>
                        <Ico d={it.ico} s={15} c={it.destaque ? ON_RED : 'var(--t2)'} />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.titulo}</span>
                        {it.sub && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--t4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</span>}
                      </span>
                      {it.valor && (
                        <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 12.5, fontWeight: 800, color: it.positivo ? 'var(--profit)' : 'var(--loss)' }}>{it.valor}</span>
                      )}
                      {on && <Ico d={I_SETA} s={14} c="var(--t4)" />}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* rodapé com as teclas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 18px', borderTop: '1px solid var(--b1)', background: 'var(--fill-1)' }}>
              {[['↑↓', 'navegar'], ['↵', 'abrir'], ['esc', 'fechar']].map(([k, l]) => (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t4)' }}>
                  <span style={{ fontFamily: MONO, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--b1)', color: 'var(--t3)' }}>{k}</span>
                  {l}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
