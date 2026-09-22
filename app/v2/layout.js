// Metadados da página de apresentação da versão 2.0. Precisa ser um layout
// porque a página é 'use client' e componente cliente não exporta metadata.
export const metadata = {
  title: 'NexControl 2.0 — o mesmo controle, outra clareza',
  description:
    'O painel do NexControl foi redesenhado: fundo claro, cartões que contam o que aconteceu, busca por comando e tema escuro por escolha. Nenhuma função saiu do lugar.',
  alternates: { canonical: 'https://nexcpa.com.br/v2' },
  openGraph: {
    title: 'NexControl 2.0 — o mesmo controle, outra clareza',
    description: 'O painel inteiro redesenhado. Nenhuma função saiu do lugar.',
    url: 'https://nexcpa.com.br/v2',
    siteName: 'NexControl',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function V2Layout({ children }) {
  return children
}
