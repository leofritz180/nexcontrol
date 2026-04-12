import './globals.css'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
const DynamicBackground = dynamic(() => import('../components/DynamicBackground'), { ssr: false })
const SubscriptionGate = dynamic(() => import('../components/SubscriptionGate'), { ssr: false })
const GlobalLoadingScreen = dynamic(() => import('../components/branding/GlobalLoadingScreen'), { ssr: false })

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
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
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
      <body>
        <Suspense fallback={null}><GlobalLoadingScreen/></Suspense>
        <div className="bg-flow"/>
        <div className="depth-bg"/>
        <Suspense fallback={null}><DynamicBackground/></Suspense>
        <Suspense fallback={null}><SubscriptionGate>{children}</SubscriptionGate></Suspense>
      </body>
    </html>
  )
}
