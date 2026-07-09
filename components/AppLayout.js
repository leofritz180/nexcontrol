'use client'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { isRedesign } from '../lib/redesign'
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false })
const QuickNotifyPanel = dynamic(() => import('./QuickNotifyPanel'), { ssr: false })
const VoiceAnnounceCard = dynamic(() => import('./VoiceAnnounceCard'), { ssr: false })
const RedesignHeader = dynamic(() => import('./RedesignHeader'), { ssr: false })
const VoiceBanner = dynamic(() => import('./VoiceBanner'), { ssr: false })
const BettifyStoreBanner = dynamic(() => import('./BettifyStoreBanner'), { ssr: false })
const NetworkLaunchBanner = dynamic(() => import('./NetworkLaunchBanner'), { ssr: false })
const NetworkDock = dynamic(() => import('./NetworkDock'), { ssr: false })

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}

export default function AppLayout({ children, userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  const pathname = usePathname()

  return (
    <>
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        isAdmin={isAdmin}
        tenant={tenant}
        subscription={subscription}
        userId={userId}
        tenantId={tenantId}
      />
      <div style={{ marginLeft: isRedesign(userEmail) ? 76 : 248 }} className="app-content">
        {/* Loja Proxy e Network: sem cabeçalho vermelho — imersão total (chat/loja) */}
        {isRedesign(userEmail) && pathname !== '/proxy' && pathname !== '/network' && <RedesignHeader />}
        {/* /network: sem wrapper animado (o transform quebraria o position:fixed do chat mobile) */}
        {pathname === '/network' ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <QuickNotifyPanel userEmail={userEmail} />
      <VoiceAnnounceCard userEmail={userEmail} isAdmin={isAdmin} />
      <VoiceBanner userEmail={userEmail} />
      <BettifyStoreBanner userEmail={userEmail} />
      {pathname !== '/network' && <NetworkLaunchBanner userEmail={userEmail} isAdmin={isAdmin} subscription={subscription} tenant={tenant} />}
      {/* Reativado após upgrade Nano->Micro (08/07) com polling espaçado (90s) pra pegar leve no banco */}
      <NetworkDock userEmail={userEmail} isAdmin={isAdmin} subscription={subscription} tenant={tenant} />
      <style jsx global>{`
        @media (max-width: 768px) {
          .app-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  )
}
