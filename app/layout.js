import './globals.css'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import MotionGate from '../components/MotionGate'
// Avisos (toasts) do V2: provider + portal fixo. Import estático de propósito —
// com dynamic/ssr:false os children parariam de ser renderizados no servidor.
import { ProvedorDeAvisos } from '../components/v2/Avisos'
import { ProvedorDeConfirmacao } from '../components/v2/Confirmar'
const DynamicBackground = dynamic(() => import('../components/DynamicBackground'), { ssr: false })
const SubscriptionGate = dynamic(() => import('../components/SubscriptionGate'), { ssr: false })
const OperatorLimitGate = dynamic(() => import('../components/OperatorLimitGate'), { ssr: false })
// Tela de abertura: o switch escolhe entre a antiga (escura) e a do V2 (clara)
const TelaDeAbertura = dynamic(() => import('../components/branding/LoadingScreenSwitch'), { ssr: false })
const InstallPrompt = dynamic(() => import('../components/InstallPrompt'), { ssr: false })
const PresencePing = dynamic(() => import('../components/PresencePing'), { ssr: false })
const UpdatesBell = dynamic(() => import('../components/UpdatesBell'), { ssr: false })
const VoiceCommandPanel = dynamic(() => import('../components/VoiceCommandPanel'), { ssr: false })
const DesignMode = dynamic(() => import('../components/DesignMode'), { ssr: false })
const DataCorrectionModal = dynamic(() => import('../components/DataCorrectionModal'), { ssr: false })

const SITE_URL = 'https://nexcpa.com.br'
const OG_TITLE = 'Nex Control 2.0 — Controle sua operação CPA em um só lugar'
const OG_DESC = 'Centralize operadores, metas, remessas, faturamento e custos da sua operação CPA. O lucro final se calcula sozinho, e o painel diz o que os números estão dizendo.'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: OG_TITLE,
    template: '%s | NexControl',
  },
  description: OG_DESC,
  applicationName: 'NexControl',
  keywords: ['NexControl', 'gestão CPA', 'iGaming', 'metas', 'operadores', 'remessas', 'lucro em tempo real', 'CPA marketing'],
  authors: [{ name: 'NexControl' }],
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexControl',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16.png?v=8', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png?v=8', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png?v=8', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png?v=8', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=8', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    siteName: 'NexControl',
    url: SITE_URL,
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/landing/v2/og.png', width: 1200, height: 630, alt: 'Nex Control 2.0 — sua operação inteira em uma tela só' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESC,
    images: ['/landing/v2/og.png'],
  },
}

// Sem maximumScale: bloquear o zoom era o remendo pro iPhone ampliar ao focar
// input de 14px. A causa (fonte do input) está tratada no globals.css; o zoom
// de quem precisa ampliar pra ler volta a funcionar.
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#060607' }

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${SITE_URL}/#organization`,
              name: 'NexControl',
              url: SITE_URL,
              logo: `${SITE_URL}/nexcontrol-icon-256.png`,
            },
            {
              '@type': 'SoftwareApplication',
              name: 'NexControl',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, iOS, Android',
              url: SITE_URL,
              description: OG_DESC,
              publisher: { '@id': `${SITE_URL}/#organization` },
              offers: {
                '@type': 'Offer',
                price: '59.90',
                priceCurrency: 'BRL',
                description: 'Plano mensal a partir de R$ 59,90 (Solo). Pagamento via PIX, ativação imediata, sem fidelidade. Equipe em pacote fechado, com as vagas de operador já incluídas.',
              },
            },
          ],
        }) }} />
        {/* O TEMA ANTES DA PRIMEIRA PINTURA. O DesignMode aplica nx-bento/nx-light
            depois de ler a sessão (~1s). Nesse intervalo a página pintava no
            layout ANTIGO e depois trocava — no celular isso era um pulo de 92px
            (a barra do topo do menu aparecia e sumia). Como a 2.0 vale pra todo
            mundo, a classe pode entrar aqui, síncrona, antes de qualquer
            pintura. O DesignMode continua mandando depois (é idempotente) e
            cuida do noir/aqua. As rotas escuras de propósito ficam de fora,
            espelhando o SEM_BENTO do components/DesignMode.js. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){try{
            var p=location.pathname, fora=['/','/owner','/design-v2','/admin-preview'];
            var sem=fora.some(function(x){return x==='/'?p==='/':(p===x||p.indexOf(x+'/')===0)});
            if(sem) return;
            var h=document.documentElement; h.classList.add('nx-bento','nx-light');
            var claro=['/login','/signup','/reset-password','/invite','/convite'].some(function(x){return p===x||p.indexOf(x+'/')===0});
            if(!claro&&localStorage.getItem('nx_tema')!=='claro') h.classList.add('nx-noir');
          }catch(e){}})();
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          if('serviceWorker' in navigator){
            navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})
              .then(r=>r.update()).catch(()=>{})
          }
          document.addEventListener('wheel',function(e){if(e.target.type==='number')e.target.blur()},{passive:true})
        `}} />
      </head>
      <body>
        <MotionGate>
          <ProvedorDeConfirmacao>
          <ProvedorDeAvisos>
            <Suspense fallback={null}><TelaDeAbertura/></Suspense>
            <Suspense fallback={null}><SubscriptionGate><OperatorLimitGate>{children}</OperatorLimitGate></SubscriptionGate></Suspense>
            <Suspense fallback={null}><InstallPrompt/></Suspense>
            <Suspense fallback={null}><PresencePing/></Suspense>
            <Suspense fallback={null}><UpdatesBell/></Suspense>
            <Suspense fallback={null}><VoiceCommandPanel/></Suspense>
            <Suspense fallback={null}><DesignMode/></Suspense>
            <Suspense fallback={null}><DataCorrectionModal/></Suspense>
          </ProvedorDeAvisos>
          </ProvedorDeConfirmacao>
        </MotionGate>
      </body>
    </html>
  )
}
