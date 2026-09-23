// Metadados da landing. Desde 24/09/2026 ela É a home: o /v2 redireciona
// pra raiz (next.config.js) e este layout sobrou envolvendo o redirecionamento.
// Quem manda no que o Google lê é o app/layout.js.
//
// Metadados da /v2. Precisa ser um layout porque a página é 'use client' e
// componente cliente não exporta `metadata`.
//
// A OG image é arte dedicada, feita na medida que as redes realmente usam
// (1200x630). Antes apontava pra captura do painel, que é 3200x2000: numa
// proporção de 1,91:1 o WhatsApp cortava e o link chegava decapitado.
// Pra refazer: node scripts/og.mjs
const TITULO = 'Nex Control 2.0 — Controle sua operação CPA em um só lugar'
const DESC = 'Centralize operadores, metas, faturamento, custos e resultados da sua operação CPA com a Nex Control.'
const URL = 'https://nexcpa.com.br/'
const OG = 'https://nexcpa.com.br/landing/v2/og.png'

export const metadata = {
  title: TITULO,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: {
    title: TITULO,
    description: DESC,
    url: URL,
    siteName: 'Nex Control',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: OG, width: 1200, height: 630, alt: 'Nex Control 2.0 — sua operação inteira em uma tela só' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESC,
    images: [OG],
  },
}

export default function V2Layout({ children }) {
  return children
}
