'use client'
// ─────────────────────────────────────────────────────────────────────────
// LOJA PROXY — moldura 2.0 em volta do iframe da Bettify.
//
// O QUE ESTE ARQUIVO NÃO FAZ: mexer na loja. O conteúdo de dentro é de
// outro domínio, servido por SSO — daqui só se controla a moldura. Então
// "trazer pro V2" aqui é: cabeçalho de módulo, superfície de bento com
// canto arredondado, esqueleto de carregamento no lugar do spinner e um
// estado de erro que usa o vazio do kit em vez de um texto solto.
//
// TUDO que é comportamento continua na página: o token SSO, os atributos
// de sandbox, o referrerPolicy e o allow do iframe. Mexer em qualquer um
// deles quebra pagamento dentro da loja.
// ─────────────────────────────────────────────────────────────────────────
import { ModuleHeader, BCard, Vazio, Osso } from '../ui/bento'

const IcoAba = (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function BotaoAba({ href }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title="Abrir a loja em nova aba"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px',
        borderRadius: 11, background: 'var(--fill-1)', border: '1px solid var(--b2)',
        color: 'var(--t2)', fontSize: 12.5, fontWeight: 650, textDecoration: 'none',
      }}>
      {IcoAba} Nova aba
    </a>
  )
}

export default function ProxyLojaBento({ url, carregando, erro, manutencao, aoCarregar }) {
  if (manutencao) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ModuleHeader titulo="Loja Proxy" sub="compra de proxies sem sair do painel" />
        <BCard pad={0}>
          <Vazio
            icone={<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />}
            titulo="Disponível em breve"
            texto="Estamos finalizando os últimos ajustes da loja integrada. Em breve você compra seus proxies direto por aqui."
          />
        </BCard>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Loja Proxy"
        sub="compra de proxies sem sair do painel · você já entra logado"
        acao={<BotaoAba href={url} />}
      />

      <BCard pad={0} style={{ overflow: 'hidden' }}>
        {erro ? (
          <Vazio
            icone={<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>}
            titulo="Não consegui carregar a loja aqui dentro"
            texto="Isso costuma ser bloqueio do navegador a conteúdo de outro site. Abrir em uma aba nova resolve."
            acao={<BotaoAba href={url || 'https://bettifyproxy.com'} />}
          />
        ) : (
          <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 210px)', minHeight: 460 }}>
            {(carregando || !url) && (
              // esqueleto no lugar do spinner: a tela ja tem a forma final
              // enquanto carrega, em vez de um circulo girando no vazio
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'var(--surface)', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Osso w="42%" h={26} r={10} />
                <Osso w="66%" h={14} r={7} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginTop: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => <Osso key={i} h={132} r={16} />)}
                </div>
              </div>
            )}
            {url && (
              /* NADA aqui pode mudar: sandbox, referrerPolicy e allow são o
                 que deixa o checkout da loja funcionar dentro do iframe. */
              <iframe
                src={url} title="Loja Bettify Proxy"
                onLoad={aoCarregar}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: 'var(--surface)' }}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation"
                referrerPolicy="origin-when-cross-origin"
                allow="payment; clipboard-write; clipboard-read; fullscreen"
              />
            )}
          </div>
        )}
      </BCard>
    </div>
  )
}
