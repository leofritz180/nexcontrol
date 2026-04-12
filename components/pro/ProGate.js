'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

/**
 * ProLockedCard — shows blurred preview with PRO badge
 * Click opens upgrade modal
 */
export function ProLockedCard({ title, description, preview, icon, children }) {
  const [showModal, setShowModal] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setShowModal(true)}
        whileHover={{ y:-2, transition:{duration:0.2} }}
        style={{
          position:'relative', overflow:'hidden', cursor:'pointer',
          padding:'24px 26px', borderRadius:14,
          background:'linear-gradient(145deg, #0c1424, #080e1a)',
          border:`1px solid ${hovered ? 'rgba(229,57,53,0.25)' : 'rgba(255,255,255,0.05)'}`,
          boxShadow: hovered ? '0 8px 30px rgba(229,57,53,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
          transition:'border-color 0.3s, box-shadow 0.3s',
        }}>

        {/* PRO badge */}
        <div style={{
          position:'absolute', top:12, right:12, fontSize:9, fontWeight:700,
          padding:'3px 10px', borderRadius:5,
          background:'rgba(229,57,53,0.12)', color:'#ff4444',
          border:'1px solid rgba(229,57,53,0.2)',
          letterSpacing:'0.06em',
        }}>
          PRO
        </div>

        {/* Visible content — title + description */}
        <div style={{ position:'relative', zIndex:2, pointerEvents:'none' }}>
          {icon && (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={hovered?'#ff4444':'var(--t3)'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12, opacity:0.6, transition:'stroke 0.3s' }}>
              <path d={icon}/>
            </svg>
          )}
          <h4 style={{ fontSize:14, fontWeight:700, color:'var(--t1)', margin:'0 0 6px' }}>{title}</h4>
          {description && <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 14px', lineHeight:1.5 }}>{description}</p>}

          {/* Blurred preview hint */}
          <div style={{ filter:'blur(5px)', opacity:0.4 }}>
            {children || (
              <div>
                <div style={{ height:16, width:'70%', background:'rgba(255,255,255,0.06)', borderRadius:4, marginBottom:6 }}/>
                <div style={{ height:22, width:'50%', background:'rgba(255,255,255,0.04)', borderRadius:4 }}/>
              </div>
            )}
          </div>
        </div>

        {/* Lock + CTA at bottom */}
        <div style={{
          display:'flex', alignItems:'center', gap:8, marginTop:14,
          padding:'10px 12px', borderRadius:8,
          background: hovered ? 'rgba(229,57,53,0.08)' : 'rgba(255,255,255,0.02)',
          border:`1px solid ${hovered ? 'rgba(229,57,53,0.15)' : 'rgba(255,255,255,0.04)'}`,
          transition:'all 0.3s',
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={hovered?'#ff4444':'rgba(255,255,255,0.3)'} strokeWidth={1.5} strokeLinecap="round" style={{ flexShrink:0, transition:'stroke 0.3s' }}>
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontSize:11, fontWeight:600, color:hovered?'#ff4444':'rgba(255,255,255,0.3)', transition:'color 0.3s' }}>
            {hovered ? 'Clique para desbloquear' : 'Disponivel no PRO'}
          </span>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && <ProUpgradeModal onClose={() => setShowModal(false)} feature={title}/>}
      </AnimatePresence>
    </>
  )
}

/**
 * ProUpgradeModal — conversion modal
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
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:24,
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

        {/* Icon */}
        <motion.div
          animate={{ boxShadow:['0 0 20px rgba(229,57,53,0.2)','0 0 35px rgba(229,57,53,0.4)','0 0 20px rgba(229,57,53,0.2)'] }}
          transition={{ duration:3, repeat:Infinity }}
          style={{
            width:56, height:56, borderRadius:16, background:'#e53935',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 24px',
          }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </motion.div>

        <h2 style={{ fontSize:22, fontWeight:800, color:'var(--t1)', margin:'0 0 8px', letterSpacing:'-0.02em' }}>
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
              background:'transparent', color:'var(--t3)', border:'1px solid var(--b2)',
              cursor:'pointer',
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

/**
 * ProBadge — small inline badge
 */
export function ProBadge() {
  return (
    <span style={{
      fontSize:8, fontWeight:700, padding:'2px 7px', borderRadius:4,
      background:'rgba(229,57,53,0.12)', color:'#ff4444',
      border:'1px solid rgba(229,57,53,0.2)',
      letterSpacing:'0.06em', marginLeft:6, verticalAlign:'middle',
    }}>
      PRO
    </span>
  )
}
