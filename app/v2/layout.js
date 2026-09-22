// Metadados da /v2. Precisa ser um layout porque a página é 'use client' e
// componente cliente não exporta `metadata`.
//
// A OG image aponta pra captura real do painel (public/landing/v2/painel.png,
// 3200x2000 @2x) — a mesma que aparece no hero. Se depois existir uma arte
// de OG dedicada, é só trocar o caminho aqui.
const TITULO = 'Nex Control 2.0 — Controle sua operação CPA em um só lugar'
const DESC = 'Centralize operadores, metas, faturamento, custos e resultados da sua operação CPA com a Nex Control.'
const URL = 'https://nexcpa.com.br/v2'
const OG = 'https://nexcpa.com.br/landing/v2/painel.png'

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
    images: [{ url: OG, width: 3200, height: 2000, alt: 'Painel da Nex Control 2.0' }],
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
