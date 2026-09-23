/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ],

  // A landing 2.0 virou a home em 24/09/2026. O /v2 continuou existindo por
  // um tempo como endereço próprio e foi compartilhado nesse período, então
  // ele não pode simplesmente sumir — redireciona.
  //
  // PERMANENTE (308) de propósito: diz ao Google que o endereço definitivo é
  // a raiz e transfere pra ela a autoridade que o /v2 tenha acumulado. Com
  // um temporário, os dois endereços continuariam disputando a mesma página.
  redirects: async () => [
    { source: '/v2', destination: '/', permanent: true },
  ],
}

module.exports = nextConfig
