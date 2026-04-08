import './globals.css'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
const DynamicBackground = dynamic(() => import('../components/DynamicBackground'), { ssr: false })
const SubscriptionGate = dynamic(() => import('../components/SubscriptionGate'), { ssr: false })
export const metadata = { title: 'NexControl', description: 'Sistema de gestão operacional' }
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 }
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="bg-flow"/>
        <Suspense fallback={null}><DynamicBackground/></Suspense>
        <Suspense fallback={null}><SubscriptionGate>{children}</SubscriptionGate></Suspense>
      </body>
    </html>
  )
}
