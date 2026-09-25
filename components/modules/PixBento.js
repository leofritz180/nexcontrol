'use client'
// ─────────────────────────────────────────────────────────────────────────
// CHAVES PIX — visual 2.0 (bento claro).
//
// Apresentação PURA: não busca nem grava nada. Todo estado (texto do import,
// banco, busca, filtro, "copiado") continua morando no /pix — aqui só chegam
// valores e callbacks. Assim o caminho antigo e o novo compartilham exatamente
// os mesmos handlers, e nenhuma ação do módulo deixa de existir.
//
// O único hook local é o ref do <input type="file">: ele é UI (o botão ".txt"
// precisa de um alvo pra clicar), não dado. Fica aqui pra não precisar duplicar
// um input escondido dentro do bloco antigo da página.
// ─────────────────────────────────────────────────────────────────────────
import { useRef } from 'react'
import { ModuleHeader, AcaoBtn, Hero, Tira, Lista, BCard, Rosca, Vazio, Ico, FATIAS, int, MONO } from '../ui/bento'
import { Campo, Area, Pilulas } from '../ui/campo'

// ── ícones (fragmentos que o <Ico> do kit desenha) ───────────────────────
const I_SYNC = <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>
const I_COPIAR = <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
const I_OK = <polyline points="20 6 9 17 4 12" />
const I_LIXO = <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>
const I_BAIXAR = <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>
const I_SUBIR = <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>
const I_LUPA = <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>
const I_CARTAO = <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /></>
const I_BANCO = <><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /></>

// Rótulo curto que vai no quadradinho do avatar de cada chave.
const SIGLA = { telefone: 'tel', cpf: 'cpf', email: '@', evp: 'evp' }

// ── botão secundário (fantasma) ──────────────────────────────────────────
// O kit só tem o AcaoBtn (vermelho, primário). Aqui as ações de apoio
// (Exportar, .txt, Copiar todas) precisam de um botão neutro na mesma caixa.
function BtnFantasma({ children, onClick, icone, largura, tom = 'neutro', desabilitado = false, titulo, submit = false }) {
  const cores = {
    neutro: { fg: 'var(--t2)', bd: 'var(--b2)', bg: 'var(--fill-1)' },
    perigo: { fg: 'var(--loss)', bd: 'var(--loss-border)', bg: 'var(--loss-dim)' },
    ok: { fg: 'var(--profit)', bd: 'var(--profit-border)', bg: 'var(--profit-dim)' },
  }[tom]
  return (
    <button
      type={submit ? 'submit' : 'button'} onClick={onClick} disabled={desabilitado} title={titulo}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: largura || 'auto', minHeight: 44, padding: '0 16px', borderRadius: 14,
        border: `1px solid ${cores.bd}`, background: cores.bg, color: cores.fg,
        fontFamily: 'inherit', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
        cursor: desabilitado ? 'not-allowed' : 'pointer', opacity: desabilitado ? 0.55 : 1,
        transition: 'border-color 160ms ease, background-color 160ms ease',
      }}>
      {icone && <Ico d={icone} s={15} />}{children}
    </button>
  )
}

// Botãozinho quadrado das linhas da lista (copiar / excluir).
function BtnLinha({ onClick, icone, titulo, tom = 'neutro' }) {
  const fg = tom === 'perigo' ? 'var(--loss)' : tom === 'ok' ? 'var(--profit)' : 'var(--t3)'
  return (
    <button type="button" title={titulo} onClick={(e) => { e.stopPropagation(); onClick && onClick() }}
      style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--b1)', background: 'var(--surface)', color: fg, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', transition: 'all .16s ease', flexShrink: 0 }}>
      <Ico d={icone} s={14} />
    </button>
  )
}

// Aviso de erro/sucesso do import, na linguagem do bento.
function Aviso({ tom, children }) {
  const erro = tom === 'erro'
  return (
    <div role={erro ? 'alert' : 'status'} style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 14,
      background: erro ? 'var(--loss-dim)' : 'var(--profit-dim)',
      border: `1px solid ${erro ? 'var(--loss-border)' : 'var(--profit-border)'}`,
      color: erro ? 'var(--loss)' : 'var(--profit)', fontSize: 12.5, fontWeight: 700, lineHeight: 1.45,
    }}>
      <span style={{ flexShrink: 0, display: 'inline-flex' }}>
        <Ico d={erro ? <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></> : I_OK} s={15} />
      </span>
      {children}
    </div>
  )
}

export default function PixBento({
  stats, chaves = [], carregandoLista = false,
  // import
  texto, aoTexto, banco, aoBanco, aoImportar, aoArquivo, salvando = false, erro, sucesso,
  // ações gerais
  aoCopiarTodas, copiadoTodas = false, aoExportar, aoRemoverInvalidas,
  // lista
  busca, aoBuscar, filtro = 'todos', aoFiltrar, aoCopiar, copiado, aoExcluir,
  // topo
  aoSincronizar,
}) {
  const s = stats || {}
  const refArquivo = useRef(null)

  // Rosca da composição por tipo — só entra o tipo que existe, senão o anel
  // fica cheio de fatias de zero.
  const fatias = [
    { l: 'Telefone', v: Number(s.telefone || 0), c: FATIAS[0] },
    { l: 'CPF', v: Number(s.cpf || 0), c: FATIAS[1] },
    { l: 'E-mail', v: Number(s.email || 0), c: FATIAS[2] },
    { l: 'EVP', v: Number(s.evp || 0), c: FATIAS[3] },
  ].filter(d => d.v > 0)

  const temTexto = !!String(texto || '').trim()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Chaves PIX"
        sub={`${int(s.total)} chave${Number(s.total) === 1 ? '' : 's'} guardada${Number(s.total) === 1 ? '' : 's'} · o tipo é detectado sozinho`}
        acao={<AcaoBtn onClick={aoSincronizar} icon={I_SYNC}>Sincronizar</AcaoBtn>}
      />

      <Hero
        rotulo="Chaves cadastradas"
        valor={int(s.total)}
        nota={Number(s.invalidas) > 0
          ? `${int(s.invalidas)} chave(s) marcada(s) como inválida(s) — dá pra limpar em Ações gerais`
          : 'Nenhuma chave inválida na sua carteira'}
        blob={['var(--k-blob-marca-a)', 'var(--k-blob-marca-b)']}
        extras={[
          { l: 'Válidas', v: int(s.validas), c: 'var(--profit)' },
          { l: 'Inválidas', v: int(s.invalidas), c: Number(s.invalidas) > 0 ? 'var(--loss)' : 'var(--t3)' },
        ]}
      />

      {/* data-tour preservado: o tour do /pix aponta pra estes três blocos */}
      <div data-tour="pix-kpis">
        <Tira itens={[
          { l: 'Total', v: int(s.total) },
          { l: 'Válidas', v: int(s.validas), c: 'var(--profit)' },
          { l: 'Telefone', v: int(s.telefone) },
          { l: 'CPF', v: int(s.cpf) },
          { l: 'E-mail', v: int(s.email) },
          { l: 'EVP', v: int(s.evp) },
        ]} />
      </div>

      <div className="pix-2" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 14, alignItems: 'start' }}>
        {/* ── coluna esquerda: importar + ações gerais + composição ── */}
        <div data-tour="pix-import" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BCard pad={24} delay={0.12}>
            <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Importar chaves</p>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px' }}>1 chave por linha · duplicadas são ignoradas</p>

            <form onSubmit={aoImportar} style={{ display: 'grid', gap: 14 }}>
              <Area
                rotulo="Chaves PIX"
                valor={texto}
                aoMudar={aoTexto}
                alturaMin={150}
                placeholder={'11999887766\n123.456.789-00\noperador@email.com\nchave-evp-uuid...'}
                ajuda="Aceita quebra de linha, vírgula ou ponto e vírgula."
              />
              <Campo
                rotulo="Banco (opcional)"
                valor={banco}
                aoMudar={aoBanco}
                placeholder="Ex: Nubank, Inter, C6..."
                icone={I_BANCO}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <BtnFantasma submit tom="ok" largura="100%" desabilitado={salvando || !temTexto}>
                  {salvando ? 'Importando...' : 'Importar chaves'}
                </BtnFantasma>
                <BtnFantasma icone={I_SUBIR} titulo="Carregar de um arquivo .txt" onClick={() => refArquivo.current?.click()}>
                  .txt
                </BtnFantasma>
                {/* input escondido: o botão acima é só a fachada dele */}
                <input ref={refArquivo} type="file" accept=".txt" onChange={aoArquivo} style={{ display: 'none' }} />
              </div>
              {erro && <Aviso tom="erro">{erro}</Aviso>}
              {sucesso && <Aviso tom="ok">{sucesso}</Aviso>}
            </form>
          </BCard>

          <BCard pad={24} delay={0.16}>
            <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>Ações gerais</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <BtnFantasma largura="100%" icone={copiadoTodas ? I_OK : I_COPIAR} tom={copiadoTodas ? 'ok' : 'neutro'} onClick={aoCopiarTodas}>
                {copiadoTodas ? 'Copiadas!' : `Copiar todas válidas (${int(s.validas)})`}
              </BtnFantasma>
              <BtnFantasma largura="100%" icone={I_BAIXAR} onClick={aoExportar}>Exportar .txt</BtnFantasma>
              {Number(s.invalidas) > 0 && (
                <BtnFantasma largura="100%" tom="perigo" icone={I_LIXO} onClick={aoRemoverInvalidas}>
                  Remover inválidas ({int(s.invalidas)})
                </BtnFantasma>
              )}
            </div>
          </BCard>

          {fatias.length > 0 && (
            <BCard pad={24} delay={0.2}>
              <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Composição da carteira</p>
              <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 20px' }}>quantas chaves de cada tipo</p>
              <Rosca dados={fatias} centro={int(s.total)} rotulo="chaves" formata={int} delay={0.24} />
            </BCard>
          )}
        </div>

        {/* ── coluna direita: busca, filtro e lista ── */}
        <div data-tour="pix-lista" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BCard pad={20} delay={0.14}>
            <div style={{ display: 'grid', gap: 14 }}>
              <Campo rotulo="Buscar" valor={busca} aoMudar={aoBuscar} placeholder="Buscar chave, banco..." icone={I_LUPA} />
              <Pilulas
                rotulo="Filtrar por tipo"
                valor={filtro}
                aoMudar={aoFiltrar}
                opcoes={[
                  { v: 'todos', l: 'Todos' },
                  { v: 'telefone', l: 'Telefone' },
                  { v: 'cpf', l: 'CPF' },
                  { v: 'email', l: 'E-mail' },
                  { v: 'evp', l: 'EVP' },
                ]}
              />
            </div>
          </BCard>

          {carregandoLista ? (
            <BCard pad={24} delay={0.18}>
              <Vazio titulo="Carregando chaves..." texto="Buscando a sua carteira de chaves PIX." icone={I_SYNC} />
            </BCard>
          ) : chaves.length === 0 ? (
            // Um estado vazio só, com o motivo certo: carteira vazia é
            // diferente de filtro que não bateu com nada.
            <BCard pad={24} delay={0.18}>
              <Vazio
                icone={I_CARTAO}
                titulo={Number(s.total) === 0 ? 'Sua carteira está vazia' : 'Nenhuma chave com esse filtro'}
                texto={Number(s.total) === 0
                  ? 'Cole as chaves no painel ao lado (ou suba um .txt) e elas aparecem aqui já classificadas por tipo.'
                  : 'Mude o filtro de tipo ou limpe a busca para ver as outras chaves.'}
              />
            </BCard>
          ) : (
            <Lista
              titulo={`${int(chaves.length)} chave(s) encontrada(s)`}
              vazio="Nenhuma chave PIX por aqui"
              delay={0.18}
              acao={<span style={{ ...{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }, color: 'var(--t3)', padding: '5px 10px', borderRadius: 999, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
                {filtro === 'todos' ? 'Todas' : filtro}
              </span>}
              linhas={chaves.map(k => {
                const invalida = k.status === 'invalida'
                return {
                  k: k.id,
                  avatar: SIGLA[k.tipo] || 'evp',
                  avatarBg: invalida ? 'var(--loss-dim)' : 'var(--fill-2)',
                  avatarFg: invalida ? 'var(--loss)' : 'var(--t2)',
                  // a chave é identificador: vai em mono, igual era no layout antigo
                  t: <span style={{ fontFamily: MONO, letterSpacing: '-0.01em' }}>{k.chave}</span>,
                  s: [k.tipo, k.banco, invalida ? 'inválida' : null].filter(Boolean).join(' · '),
                  v: '',
                  acao: (
                    <>
                      <BtnLinha
                        titulo="Copiar chave"
                        tom={copiado === k.id ? 'ok' : 'neutro'}
                        icone={copiado === k.id ? I_OK : I_COPIAR}
                        onClick={() => aoCopiar && aoCopiar(k.chave, k.id)}
                      />
                      <BtnLinha titulo="Excluir chave" tom="perigo" icone={I_LIXO} onClick={() => aoExcluir && aoExcluir(k.id)} />
                    </>
                  ),
                }
              })}
            />
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .pix-2 { grid-template-columns: 1fr !important }
          .bk-tira { grid-template-columns: repeat(3, 1fr) !important }
        }
        @media (max-width: 600px) { .bk-tira { grid-template-columns: repeat(2, 1fr) !important } }
      `}</style>
    </div>
  )
}
