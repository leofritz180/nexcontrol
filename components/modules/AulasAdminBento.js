'use client'
// ─────────────────────────────────────────────────────────────────────────
// AULAS VIP · ADMIN — visual 2.0.
//
// Componente PURO: recebe cursos, módulos, aulas e TODOS os handlers da
// página (criar, salvar, excluir, publicar, reordenar). Não busca, não
// grava, não conhece Supabase nem a API.
//
// A hierarquia continua a mesma da tela antiga — curso ▸ módulo ▸ aula —
// porque é ela que o cliente já usa. O que mudou é a casca: acordeões em
// cartão claro, formulários no kit CAMPO e as setas de ordenação viraram
// botões de verdade (com type="button", que os antigos não tinham dentro
// de um cabeçalho clicável).
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModuleHeader, AcaoBtn, Tira, BCard, Vazio, Ico, MONO, RED, RED2, int, ON_RED, GLOW } from '../ui/bento'
import { Campo, Area, Alternar, Linha } from '../ui/campo'

// ── PEÇAS PEQUENAS ───────────────────────────────────────────────────────

// Selo de publicado/rascunho. Verde é publicado; rascunho é neutro.
function Selo({ status }) {
  const pub = status === 'published'
  return (
    <span style={{
      flexShrink: 0, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 999,
      background: pub ? 'var(--profit-dim)' : 'var(--fill-1)',
      border: `1px solid ${pub ? 'var(--profit-border)' : 'var(--b1)'}`,
      color: pub ? 'var(--profit)' : 'var(--t4)',
    }}>{pub ? 'Publicado' : 'Rascunho'}</span>
  )
}

// Botão secundário do painel: pequeno, claro, sempre type="button".
function BtnMini({ children, onClick, icone, perigo = false, desabilitado = false, titulo, style }) {
  return (
    <motion.button type="button" onClick={onClick} disabled={desabilitado} title={titulo}
      whileHover={desabilitado ? undefined : { y: -1 }} whileTap={desabilitado ? undefined : { scale: 0.96 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
        padding: children ? '7px 13px' : 0, width: children ? undefined : 30, height: 30,
        justifyContent: 'center', borderRadius: 10, fontFamily: 'inherit',
        fontSize: 11.5, fontWeight: 800, letterSpacing: '-0.01em',
        background: 'var(--surface)',
        border: `1px solid ${perigo ? 'var(--loss-border)' : 'var(--b1)'}`,
        color: perigo ? 'var(--loss)' : 'var(--t2)',
        cursor: desabilitado ? 'not-allowed' : 'pointer',
        opacity: desabilitado ? 0.4 : 1,
        transition: 'background-color .16s ease, border-color .16s ease, color .16s ease',
        ...style,
      }}>
      {icone && <Ico d={icone} s={13} />}{children}
    </motion.button>
  )
}

// Setas de ordenação. A ordem é salva na hora (sort_order trocado no banco).
function Ordem({ onSubir, onDescer, semSubir, semDescer }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
      <BtnMini onClick={onSubir} desabilitado={semSubir} titulo="Subir"
        icone={<path d="M18 15l-6-6-6 6" />} style={{ width: 24, height: 17, borderRadius: '8px 8px 4px 4px' }} />
      <BtnMini onClick={onDescer} desabilitado={semDescer} titulo="Descer"
        icone={<path d="M6 9l6 6 6-6" />} style={{ width: 24, height: 17, borderRadius: '4px 4px 8px 8px' }} />
    </span>
  )
}

// ── FORMULÁRIO DE CURSO (vai dentro da Folha, na página) ─────────────────
export function FormularioCurso({ inicial, onSalvar, onCancelar, salvando = false }) {
  const [f, setF] = useState({
    title: inicial?.title || '',
    description: inicial?.description || '',
    category: inicial?.category || '',
    thumb_url: inicial?.thumb_url || '',
    tags: (inicial?.tags || []).join(', '),
    status: inicial?.status || 'draft',
  })
  const [erro, setErro] = useState('')
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  function salvar(e) {
    e.preventDefault()
    if (!f.title.trim()) { setErro('Dá um título pro curso.'); return }
    // Mesma normalização da tela antiga: tags viram array limpo.
    onSalvar({ ...f, tags: f.tags.split(',').map(t => t.trim()).filter(Boolean) })
  }

  return (
    <form onSubmit={salvar} style={{ padding: '28px 28px 26px' }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>Aulas VIP</p>
      <h2 style={{ fontSize: 25, fontWeight: 800, color: 'var(--t1)', margin: '0 0 22px', letterSpacing: '-0.03em' }}>
        {inicial ? 'Editar curso' : 'Novo curso'}
      </h2>

      <div style={{ display: 'grid', gap: 14 }}>
        <Campo rotulo="Título" valor={f.title} aoMudar={v => { set('title', v); if (erro) setErro('') }}
          erro={erro} obrigatorio placeholder="Ex: Operação do zero" autoFoco />
        <Area rotulo="Descrição" valor={f.description} aoMudar={v => set('description', v)}
          placeholder="O que o aluno vai aprender neste curso..." />
        <Linha>
          <Campo rotulo="Categoria" valor={f.category} aoMudar={v => set('category', v)} placeholder="Ex: Fundamentos"
            ajuda="Agrupa os cursos em fileiras na vitrine." />
          <Campo rotulo="Tags" valor={f.tags} aoMudar={v => set('tags', v)} placeholder="novo, popular, vip"
            ajuda="Separadas por vírgula." />
        </Linha>
        <Campo rotulo="Capa (URL)" valor={f.thumb_url} aoMudar={v => set('thumb_url', v)}
          placeholder="https://..." icone={<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>} />

        {/* Prévia da capa: capa é arte de vídeo, então fica escura mesmo. */}
        {f.thumb_url ? (
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--b1)', aspectRatio: '16/6', background: `url(${f.thumb_url}) center/cover, linear-gradient(135deg, #1a1a2e, #16213e)` }} />
        ) : null}

        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
          <Alternar
            ligado={f.status === 'published'}
            aoMudar={ligado => set('status', ligado ? 'published' : 'draft')}
            rotulo={f.status === 'published' ? 'Publicado' : 'Rascunho'}
            descricao="Só cursos publicados aparecem para os alunos."
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
        <motion.button type="submit" disabled={salvando}
          whileHover={salvando ? undefined : { y: -2, boxShadow: '0 14px 32px rgba(229,57,31,0.36)' }}
          whileTap={salvando ? undefined : { scale: 0.97 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 30,
            border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 800, color: ON_RED, opacity: salvando ? 0.6 : 1,
            background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: `0 10px 26px ${GLOW}`,
          }}>
          <Ico d={<path d="M20 6L9 17l-5-5" />} s={16} />{salvando ? 'Salvando...' : 'Salvar'}
        </motion.button>
        <BtnMini onClick={onCancelar} style={{ padding: '12px 20px', borderRadius: 30, fontSize: 13 }}>Cancelar</BtnMini>
      </div>
    </form>
  )
}

// ── LINHA DE AULA (admin) ────────────────────────────────────────────────
function LinhaAula({ aula, indice, total, onSalvar, onExcluir, onMover }) {
  const [editando, setEditando] = useState(false)
  const [f, setF] = useState({
    title: aula.title || '', description: aula.description || '', video_url: aula.video_url || '',
    thumb_url: aula.thumb_url || '', materials: aula.materials || '',
    duration_min: aula.duration_min || 0, status: aula.status || 'draft',
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--b1)', padding: '10px 12px', marginBottom: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <Ordem onSubir={() => onMover('up')} onDescer={() => onMover('down')} semSubir={indice === 0} semDescer={indice === total - 1} />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {aula.title || 'Sem título'}
            </span>
            <span style={{ display: 'block', fontFamily: MONO, fontSize: 10.5, color: 'var(--t4)', marginTop: 2 }}>{aula.duration_min || 0} min</span>
          </span>
          <Selo status={aula.status} />
        </span>
        <span style={{ display: 'inline-flex', gap: 5, flexShrink: 0 }}>
          <BtnMini onClick={() => setEditando(v => !v)}>{editando ? 'Fechar' : 'Editar'}</BtnMini>
          <BtnMini onClick={onExcluir} perigo titulo="Excluir aula" icone={<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />} />
        </span>
      </div>

      <AnimatePresence initial={false}>
        {editando && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.33, 1, 0.68, 1] }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gap: 12, padding: '14px 2px 4px' }}>
              <Campo rotulo="Título" valor={f.title} aoMudar={v => set('title', v)} />
              <Area rotulo="Descrição" valor={f.description} aoMudar={v => set('description', v)} />
              <Linha>
                <Campo rotulo="Vídeo (URL)" valor={f.video_url} aoMudar={v => set('video_url', v)} placeholder="YouTube/Vimeo URL"
                  icone={<><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M10 9l5 3-5 3V9z" /></>} />
                <Campo rotulo="Capa (URL)" valor={f.thumb_url} aoMudar={v => set('thumb_url', v)} placeholder="https://..." />
              </Linha>
              <Area rotulo="Materiais" valor={f.materials} aoMudar={v => set('materials', v)} placeholder="Links, planilhas, anexos..." />
              {/* type="number" é proibido na casa (a roda do mouse alterava o
                  valor) — entra como texto e a página converte no salvar. */}
              <Campo rotulo="Duração" valor={String(f.duration_min)} aoMudar={v => set('duration_min', v.replace(/[^\d]/g, ''))}
                inputMode="numeric" sufixo="min" mono />
              <div style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
                <Alternar
                  ligado={f.status === 'published'}
                  aoMudar={ligado => set('status', ligado ? 'published' : 'draft')}
                  rotulo={f.status === 'published' ? 'Publicada' : 'Rascunho'}
                  descricao="Só aulas publicadas aparecem para o aluno."
                />
              </div>
              <div>
                <AcaoBtn onClick={() => { onSalvar({ ...aula, ...f, duration_min: Number(f.duration_min) || 0 }); setEditando(false) }}
                  icon={<path d="M20 6L9 17l-5-5" />}>Salvar aula</AcaoBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── SEÇÃO DE MÓDULO ──────────────────────────────────────────────────────
function SecaoModulo({ mod, indice, total, aulas, onSalvarMod, onExcluirMod, onMoverMod, onSalvarAula, onExcluirAula, onMoverAula, onNovaAula }) {
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(mod.title || '')
  const daModulo = aulas.filter(l => l.module_id === mod.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return (
    <div style={{ borderRadius: 18, background: 'var(--fill-1)', border: '1px solid var(--b1)', marginBottom: 9, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 13px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <Ordem onSubir={() => onMoverMod('up')} onDescer={() => onMoverMod('down')} semSubir={indice === 0} semDescer={indice === total - 1} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 900, color: RED, flexShrink: 0 }}>M{indice + 1}</span>
          <button type="button" onClick={() => setAberto(v => !v)}
            style={{ minWidth: 0, flex: 1, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {mod.title || 'Módulo sem título'}
            </span>
            <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t4)', marginTop: 2 }}>{daModulo.length} aula{daModulo.length === 1 ? '' : 's'}</span>
          </button>
        </span>
        <span style={{ display: 'inline-flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
          <BtnMini onClick={() => setEditando(v => !v)}>{editando ? 'Fechar' : 'Editar'}</BtnMini>
          <BtnMini onClick={onExcluirMod} perigo titulo="Excluir módulo" icone={<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />} />
          <BtnMini onClick={() => setAberto(v => !v)} titulo={aberto ? 'Recolher' : 'Abrir'}
            icone={aberto ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />} />
        </span>
      </div>

      <AnimatePresence initial={false}>
        {editando && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 13px 13px', display: 'grid', gap: 12 }}>
              <Campo rotulo="Título do módulo" valor={titulo} aoMudar={setTitulo} />
              <div>
                <AcaoBtn onClick={() => { onSalvarMod({ ...mod, title: titulo }); setEditando(false) }} icon={<path d="M20 6L9 17l-5-5" />}>Salvar módulo</AcaoBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 13px 13px' }}>
              {daModulo.length === 0 && (
                <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '0 0 10px' }}>Nenhuma aula neste módulo ainda.</p>
              )}
              {daModulo.map((l, li) => (
                <LinhaAula key={l.id} aula={l} indice={li} total={daModulo.length}
                  onSalvar={onSalvarAula} onExcluir={() => onExcluirAula(l.id)}
                  onMover={dir => onMoverAula(l.id, dir, daModulo)} />
              ))}
              <BtnMini onClick={() => onNovaAula(mod.id)} icone={<path d="M12 5v14M5 12h14" />}>Nova aula</BtnMini>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── CARTÃO DE CURSO ──────────────────────────────────────────────────────
function CartaoCurso({ curso, modulos, aulas, aberto, onAlternar, onEditar, onExcluir, onPublicar, onNovoModulo, delay, acoes }) {
  const doCurso = modulos.filter(m => m.course_id === curso.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const idsMod = new Set(doCurso.map(m => m.id))
  const qtdAulas = aulas.filter(l => idsMod.has(l.module_id)).length

  return (
    <BCard pad={0} delay={delay} style={{ borderColor: aberto ? 'var(--b2)' : 'var(--b1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '15px 18px', flexWrap: 'wrap' }}>
        <button type="button" onClick={onAlternar} aria-expanded={aberto}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 13, minWidth: 0, flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          {/* Miniatura da capa — arte escura, como no catálogo */}
          <span aria-hidden style={{
            width: 58, height: 38, borderRadius: 11, flexShrink: 0, border: '1px solid var(--b1)',
            background: curso.thumb_url
              ? `url(${curso.thumb_url}) center/cover`
              : 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
          }} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em' }}>{curso.title || 'Sem título'}</span>
              <Selo status={curso.status} />
              {curso.category && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)' }}>{curso.category}</span>
              )}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--t4)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 520 }}>
              {doCurso.length} módulo{doCurso.length === 1 ? '' : 's'} · {qtdAulas} aula{qtdAulas === 1 ? '' : 's'}{curso.description ? ` · ${curso.description}` : ''}
            </span>
          </span>
        </button>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Alternar ligado={curso.status === 'published'} aoMudar={onPublicar} rotulo="" />
          <BtnMini onClick={onEditar} icone={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></>}>Editar</BtnMini>
          <BtnMini onClick={onExcluir} perigo icone={<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />}>Excluir</BtnMini>
          <BtnMini onClick={onAlternar} titulo={aberto ? 'Recolher' : 'Abrir'} icone={aberto ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />} />
        </span>
      </div>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 18px', borderTop: '1px solid var(--b1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--t2)', letterSpacing: '-0.01em' }}>Módulos ({doCurso.length})</span>
                <BtnMini onClick={() => onNovoModulo(curso.id)} icone={<path d="M12 5v14M5 12h14" />}>Novo módulo</BtnMini>
              </div>
              {doCurso.length === 0
                ? <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0 }}>Nenhum módulo ainda.</p>
                : doCurso.map((m, mi) => (
                  <SecaoModulo
                    key={m.id} mod={m} indice={mi} total={doCurso.length} aulas={aulas}
                    onSalvarMod={acoes.onSalvarModulo}
                    onExcluirMod={() => acoes.onExcluirModulo(m.id)}
                    // moveModule(modId, dir, courseId) — a página precisa do
                    // curso pra reordenar só dentro dele.
                    onMoverMod={dir => acoes.onMoverModulo(m.id, dir, curso.id)}
                    onSalvarAula={acoes.onSalvarAula}
                    onExcluirAula={acoes.onExcluirAula}
                    onMoverAula={acoes.onMoverAula}
                    onNovaAula={acoes.onNovaAula}
                  />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BCard>
  )
}

// ── MÓDULO DA PÁGINA ─────────────────────────────────────────────────────
export default function AulasAdminBento({
  cursos = [], modulos = [], aulas = [],
  expandido = null, onExpandir,
  onNovoCurso, onEditarCurso, onExcluirCurso, onPublicarCurso,
  onNovoModulo, onSalvarModulo, onExcluirModulo, onMoverModulo,
  onNovaAula, onSalvarAula, onExcluirAula, onMoverAula,
}) {
  const publicados = cursos.filter(c => c.status === 'published').length
  const aulasPublicadas = aulas.filter(l => l.status === 'published').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Aulas VIP DARKZIN · gestão"
        sub={`${int(cursos.length)} curso${cursos.length === 1 ? '' : 's'} cadastrado${cursos.length === 1 ? '' : 's'} · ${int(publicados)} no ar`}
        acao={<AcaoBtn onClick={onNovoCurso} icon={<path d="M12 5v14M5 12h14" />}>Criar curso</AcaoBtn>}
      />

      <Tira itens={[
        { l: 'Cursos', v: int(cursos.length) },
        { l: 'Publicados', v: int(publicados), c: publicados ? 'var(--profit)' : undefined },
        { l: 'Rascunhos', v: int(cursos.length - publicados) },
        { l: 'Módulos', v: int(modulos.length) },
        { l: 'Aulas no ar', v: `${int(aulasPublicadas)}/${int(aulas.length)}` },
      ]} />

      {cursos.length === 0 ? (
        <BCard pad={12} delay={0.12}>
          <Vazio
            titulo="Nenhum curso criado ainda"
            texto="Crie o primeiro curso, depois adicione módulos e as aulas dentro deles."
            icone={<><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M10 9l5 3-5 3V9z" /></>}
            acao={<AcaoBtn onClick={onNovoCurso} icon={<path d="M12 5v14M5 12h14" />}>Criar curso</AcaoBtn>}
          />
        </BCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cursos.map((c, i) => (
            <CartaoCurso
              key={c.id}
              curso={c}
              modulos={modulos}
              aulas={aulas}
              aberto={expandido === c.id}
              delay={0.1 + Math.min(i * 0.04, 0.3)}
              onAlternar={() => onExpandir(expandido === c.id ? null : c.id)}
              onEditar={() => onEditarCurso(c)}
              onExcluir={() => onExcluirCurso(c.id)}
              onPublicar={() => onPublicarCurso(c)}
              onNovoModulo={onNovoModulo}
              acoes={{ onSalvarModulo, onExcluirModulo, onMoverModulo, onNovaAula, onSalvarAula, onExcluirAula, onMoverAula }}
            />
          ))}
        </div>
      )}

      <style>{`@media (max-width:900px){ .bk-tira{ grid-template-columns:repeat(2,1fr) !important } }`}</style>
    </div>
  )
}
