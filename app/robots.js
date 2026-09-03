// robots.txt gerado pelo Next. Indexa a landing e bloqueia áreas logadas.
const SITE_URL = 'https://nexcpa.com.br'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/operator', '/owner', '/equipe', '/api/', '/meta/', '/faturamento', '/custos', '/pix', '/operadores', '/redes', '/planejamento', '/premiacoes'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
