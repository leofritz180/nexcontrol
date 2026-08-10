'use client'
import { useMemo, useState } from 'react'
import { Icon, I } from '../_components/icons'
import { Panel, PanelHead, PageHead, Pill, useToast } from '../_components/ui'
import { networkFeed, operadores } from '../_components/data'

export default function Network() {
  const toast = useToast()
  const [posts, setPosts] = useState(() => networkFeed())
  const [curtidos, setCurtidos] = useState({})
  const [texto, setTexto] = useState('')
  const online = useMemo(() => operadores(), [])

  function publicar() {
    const t = texto.trim()
    if (!t) return
    setPosts(p => [{
      id: `novo-${p.length}`, autor: 'Bruno Oliveira', handle: '@brunoop', iniciais: 'BO',
      texto: t, likes: 0, coments: 0, tempo: 'agora',
    }, ...p])
    setTexto('')
    toast('Publicado no feed', 'profit')
  }

  function curtir(id) {
    setCurtidos(c => ({ ...c, [id]: !c[id] }))
  }

  return (
    <>
      <PageHead
        title="Network"
        sub="A comunidade de gestores dentro do NexControl."
        actions={<Pill tom="profit">128 admins online</Pill>}
      />

      <div className="v2-grid-2">
        <div className="v2-stack">
          <Panel>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 11 }}>
                <span className="v2-avatar" style={{ width: 32, height: 32 }}>BO</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <textarea className="v2-input" rows={3} value={texto} onChange={e => setTexto(e.target.value)}
                    placeholder="Compartilhe um aprendizado da sua operação…" style={{ resize: 'vertical' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--t4)' }}>{texto.length}/280</span>
                    <button type="button" className="v2-btn-primary" onClick={publicar} disabled={!texto.trim()}>Publicar</button>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Feed" sub="Posts recentes da comunidade" />
            {posts.map(p => (
              <article key={p.id} className="v2-post">
                <span className="v2-avatar" style={{ width: 32, height: 32 }}>{p.iniciais}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13, color: 'var(--t1)' }}>{p.autor}</strong>
                    <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>{p.handle}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>· {p.tempo}</span>
                  </div>
                  <p style={{ margin: '7px 0 0', fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{p.texto}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 11 }}>
                    <button type="button" className="v2-post-act" onClick={() => curtir(p.id)}
                      style={{ color: curtidos[p.id] ? 'var(--brand)' : undefined }}>
                      <Icon d={I.heart} size={14} /> {p.likes + (curtidos[p.id] ? 1 : 0)}
                    </button>
                    <button type="button" className="v2-post-act"><Icon d={I.chat} size={14} /> {p.coments}</button>
                    <button type="button" className="v2-post-act" onClick={() => toast('Link copiado')}><Icon d={I.ext} size={13} /> Compartilhar</button>
                  </div>
                </div>
              </article>
            ))}
          </Panel>
        </div>

        <div className="v2-stack">
          <Panel>
            <PanelHead title="Sua equipe" sub="Presença em tempo real" />
            {online.map(o => (
              <div key={o.id} className="v2-row" style={{ cursor: 'default' }}>
                <span className="v2-avatar">{o.iniciais}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="v2-row-t">{o.nome}</p>
                  <p className="v2-row-s">{o.ativas} meta(s) ativa(s)</p>
                </div>
                <span className={`v2-pill ${o.online ? 'is-profit' : ''}`}><i />{o.online ? 'Online' : 'Offline'}</span>
              </div>
            ))}
          </Panel>

          <Panel>
            <PanelHead title="Em alta" sub="Assuntos mais comentados hoje" />
            <div style={{ padding: '4px 18px 18px' }}>
              {[
                { tag: 'queda-cpa-okok', posts: 24 },
                { tag: 'custo-por-operador', posts: 18 },
                { tag: 'slots-que-pagam', posts: 15 },
                { tag: 'proxy-residencial', posts: 9 },
              ].map((t, i) => (
                <div key={t.tag} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i === 3 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="v2-rank">{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--t1)' }}>#{t.tag}</span>
                  <span className="v2-mono" style={{ fontSize: 11, color: 'var(--t4)' }}>{t.posts} posts</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
