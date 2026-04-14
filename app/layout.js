import './globals.css'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
const DynamicBackground = dynamic(() => import('../components/DynamicBackground'), { ssr: false })
const SubscriptionGate = dynamic(() => import('../components/SubscriptionGate'), { ssr: false })
const GlobalLoadingScreen = dynamic(() => import('../components/branding/GlobalLoadingScreen'), { ssr: false })
const InstallPrompt = dynamic(() => import('../components/InstallPrompt'), { ssr: false })
const PresencePing = dynamic(() => import('../components/PresencePing'), { ssr: false })

export const metadata = {
  title: 'NexControl',
  description: 'Gestão inteligente de metas, operadores e faturamento',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexControl',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16.png?v=5', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png?v=5', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png?v=5', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png?v=5', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=5', sizes: '180x180', type: 'image/png' },
    ],
  },
  themeColor: '#04070e',
  openGraph: {
    title: 'NexControl',
    description: 'Gestao inteligente de metas, operadores e faturamento',
    siteName: 'NexControl',
    type: 'website',
  },
}

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover' }

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if('serviceWorker' in navigator){
            navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})
              .then(r=>r.update()).catch(()=>{})
          }
        `}} />
      </head>
      <body>
        <Suspense fallback={null}><GlobalLoadingScreen/></Suspense>
        <div className="bg-flow"/>
        <div className="depth-bg"/>
        <Suspense fallback={null}><DynamicBackground/></Suspense>
        <Suspense fallback={null}><SubscriptionGate>{children}</SubscriptionGate></Suspense>
        <Suspense fallback={null}><InstallPrompt/></Suspense>
        <Suspense fallback={null}><PresencePing/></Suspense>
      </body>
    </html>
  )
}
