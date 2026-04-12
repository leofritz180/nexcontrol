'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

/**
 * ProLockedCard — visible title/description, blurred preview, SEJA PRO button
 */
export function ProLockedCard({ title, description, icon, children }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        style={{
          cursor:'pointer', borderRadius:16, overflow:'hidden',
          background:'linear-gradient(145deg, #0c1424, #080e1a)',
          border:'1px solid rgba(255,255,255,0.06)',
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
          transition:'border-color 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(229,57,53,0.2)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(229,57,53,0.06)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.3)' }}
      >
        {/* Top — visible info */}
        <div style={{ padding:'22px 22px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            {icon && (
              <div style={{
                width:32, height:32, borderRadius:9,
                background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d={icon}/>
                </svg>
              </div>
            )}
            <h4 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:0, flex:1 }}>{title}</h4>
            {/* Lock icon */}
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round" style={{ flexShrink:0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          {description && (
            <p style={{ fontSize:12, color:'var(--t3)', margin:0, lineHeight:1.5 }}>{description}</p>
          )}
        </div>

        {/* Bottom — blurred preview + SEJA PRO button */}
        <div style={{ position:'relative', padding:'0 22px 22px' }}>
          {/* Blurred content */}
          <div style={{ filter:'blur(6px)', opacity:0.4, pointerEvents:'none', minHeight:60 }}>
            {children || (
              <div>
                <div style={{ height:12, width:'70%', background:'rgba(255,255,255,0.06)', borderRadius:3, marginBottom:6 }}/>
                <div style={{ height:16, width:'50%', background:'rgba(255,255,255,0.04)', borderRadius:3, marginBottom:6 }}/>
                <div style={{ height:10, width:'60%', background:'rgba(255,255,255,0.03)', borderRadius:3 }}/>
              </div>
            )}
          </div>

          {/* SEJA PRO button overlay */}
          <div style={{
            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'9px 22px', borderRadius:99,
              background:'rgba(229,57,53,0.15)', border:'1px solid rgba(229,57,53,0.25)',
              color:'#ff4444', fontSize:12, fontWeight:700,
              boxShadow:'0 0 20px rgba(229,57,53,0.1)',
              animation:'cta-pulse 2.5s ease-in-out infinite',
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(229,57,53,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(229,57,53,0.15)' }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={2.5} strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              SEJA PRO
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={2.5} strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <ProUpgradeModal onClose={() => setShowModal(false)} feature={title}/>}
      </AnimatePresence>
    </>
  )
}

/**
 * ProUpgradeModal
 */
export function ProUpgradeModal({ onClose, feature }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.2 }}
      onClick={e => { if(e.target===e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0, zIndex:10000,
        background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:24,
      }}>
      <motion.div
        initial={{ opacity:0, scale:0.95, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95, y:20 }}
        transition={{ duration:0.3, ease:[0.33,1,0.68,1] }}
        style={{
          width:'100%', maxWidth:420, padding:'40px 36px', borderRadius:20,
          background:'linear-gradient(145deg, #0c1424, #080e1a)',
          border:'1px solid rgba(229,57,53,0.15)',
          boxShadow:'0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(229,57,53,0.06)',
          textAlign:'center',
        }}>
        <motion.div
          animate={{ boxShadow:['0 0 20px rgba(229,57,53,0.2)','0 0 35px rgba(229,57,53,0.4)','0 0 20px rgba(229,57,53,0.2)'] }}
          transition={{ duration:3, repeat:Infinity }}
          style={{
            width:56, height:56, borderRadius:16, background:'#e53935',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px',
          }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </motion.div>

        <h2 style={{ fontSize:22, fontWeight:800, color:'var(--t1)', margin:'0 0 8px' }}>
          Desbloqueie o modo PRO
        </h2>
        <p style={{ fontSize:14, color:'var(--t3)', margin:'0 0 28px', lineHeight:1.5 }}>
          {feature
            ? `"${feature}" e dezenas de outros recursos exclusivos para sua operacao.`
            : 'Previsoes, rankings, insights e muito mais em tempo real.'}
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Link href="/billing" onClick={onClose}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'14px 24px', borderRadius:12, fontSize:15, fontWeight:700,
              background:'#e53935', color:'white', textDecoration:'none',
              boxShadow:'0 4px 20px rgba(229,57,53,0.3)',
            }}>
            Ativar PRO agora
          </Link>
          <button onClick={onClose}
            style={{
              padding:'12px 24px', borderRadius:12, fontSize:13, fontWeight:600,
              background:'transparent', color:'var(--t3)', border:'1px solid var(--b2)', cursor:'pointer',
            }}>
            Agora nao
          </button>
        </div>

        <p style={{ fontSize:11, color:'var(--t4)', marginTop:20 }}>
          3 dias gratis. Cancele quando quiser.
        </p>
      </motion.div>
    </motion.div>
  )
}

export function ProBadge() {
  return (
    <span style={{
      fontSize:8, fontWeight:700, padding:'2px 7px', borderRadius:4,
      background:'rgba(229,57,53,0.12)', color:'#ff4444',
      border:'1px solid rgba(229,57,53,0.2)', letterSpacing:'0.06em',
      marginLeft:6, verticalAlign:'middle',
    }}>
      PRO
    </span>
  )
}
