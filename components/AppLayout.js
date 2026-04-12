'use client'
import dynamic from 'next/dynamic'
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false })

export default function AppLayout({ children, userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
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
      <div style={{ marginLeft:240 }} className="app-content">
        {children}
      </div>
      <style jsx global>{`
        @media (max-width: 768px) {
          .app-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  )
}
