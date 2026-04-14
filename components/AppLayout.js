'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false })

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}

export default function AppLayout({ children, userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  const pathname = usePathname()

  // Presence ping (silent — counts user as online)
  const pingRef = useRef(null)
  useEffect(() => {
    if (!userId) return
    const ping = () => {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      }).catch(() => {})
    }
    ping()
    pingRef.current = setInterval(ping, 30000)
    return () => clearInterval(pingRef.current)
  }, [userId])

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
      <div style={{ marginLeft: 248 }} className="app-content">
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
      </div>
      <style jsx global>{`
        @media (max-width: 768px) {
          .app-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  )
}
