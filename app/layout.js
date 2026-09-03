import './globals.css'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import MotionGate from '../components/MotionGate'
const DynamicBackground = dynamic(() => import('../components/DynamicBackground'), { ssr: false })
const SubscriptionGate = dynamic(() => import('../components/SubscriptionGate'), { ssr: false })
const OperatorLimitGate = dynamic(() => import('../components/OperatorLimitGate'), { ssr: false })
const GlobalLoadingScreen = dynamic(() => import('../components/branding/GlobalLoadingScreen'), { ssr: false })
const InstallPrompt = dynamic(() => import('../components/InstallPrompt'), { ssr: false })
const PresencePing = dynamic(() => import('../components/PresencePing'), { ssr: false })
const UpdatesBell = dynamic(() => import('../components/UpdatesBell'), { ssr: false })
const VoiceCommandPanel = dynamic(() => import('../components/VoiceCommandPanel'), { ssr: false })
const DesignMode = dynamic(() => import('../components/DesignMode'), { ssr: false })
const DataCorrectionModal = dynamic(() => import('../components/DataCorrectionModal'), { ssr: false })

const SITE_URL = 'https://nexcpa.com.br'
const OG_TITLE = 'NexControl | Gestão de Operações CPA, Metas e Operadores'
const OG_DESC = 'O sistema operacional do CPA: metas, operadores e lucro em tempo real, com insights de IA, notificações na hora, Network privilegiado e slots premium. 3 dias grátis.'

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
      { url: '/icons/favicon-16.png?v=7', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png?v=7', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png?v=7', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png?v=7', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=7', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    siteName: 'NexControl',
    url: SITE_URL,
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/nexcontrol-icon-256.png', width: 256, height: 256, alt: 'NexControl' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESC,
    images: ['/nexcontrol-icon-256.png'],
  },
}

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover', themeColor: '#060607' }

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
                description: 'Plano mensal com 3 dias grátis. Operador adicional R$ 29,90/mês.',
              },
            },
          ],
        }) }} />
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
          <Suspense fallback={null}><GlobalLoadingScreen/></Suspense>
          <Suspense fallback={null}><SubscriptionGate><OperatorLimitGate>{children}</OperatorLimitGate></SubscriptionGate></Suspense>
          <Suspense fallback={null}><InstallPrompt/></Suspense>
          <Suspense fallback={null}><PresencePing/></Suspense>
          <Suspense fallback={null}><UpdatesBell/></Suspense>
          <Suspense fallback={null}><VoiceCommandPanel/></Suspense>
          <Suspense fallback={null}><DesignMode/></Suspense>
          <Suspense fallback={null}><DataCorrectionModal/></Suspense>
        </MotionGate>
      </body>
    </html>
  )
}
