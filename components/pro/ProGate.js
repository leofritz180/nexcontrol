'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function ProLockedCard({ title, description, icon, children }) {
  const [showModal, setShowModal] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <motion.div
        onClick={() => setShowModal(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ y:-3, transition:{duration:0.2} }}
        style={{
          cursor:'pointer', borderRadius:16, overflow:'hidden',
          background:'linear-gradient(145deg, #000000, #000000)',
          border:`1px solid ${hovered?'rgba(229,57,53,0.25)':'rgba(255,255,255,0.05)'}`,
          boxShadow: hovered?'0 12px 36px rgba(229,57,53,0.08), 0 0 0 1px rgba(229,57,53,0.05)':'0 4px 20px rgba(0,0,0,0.3)',
          transition:'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Top — visible */}
        <div style={{ padding:'22px 22px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            {icon && (
              <div style={{
                width:34, height:34, borderRadius:10,
                background: hovered?'rgba(229,57,53,0.1)':'rgba(209,250,229,0.08)',
                border:`1px solid ${hovered?'rgba(229,57,53,0.2)':'rgba(209,250,229,0.15)'}`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                transition:'all 0.3s',
              }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={hovered?'#ff4444':'#D1FAE5'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ transition:'stroke 0.3s' }}>
                  <path d={icon}/>
                </svg>
              </div>
            )}
            <h4 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:0, flex:1 }}>{title}</h4>
            {/* Lock — bigger, more visible */}
            <motion.div
              animate={hovered ? { rotate:[0,-8,8,-4,0] } : {}}
              transition={{ duration:0.5 }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={hovered?'#ff4444':'rgba(255,255,255,0.25)'} strokeWidth={1.8} strokeLinecap="round" style={{ flexShrink:0, transition:'stroke 0.3s' }}>
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </motion.div>
          </div>
          <p style={{ fontSize:12, color: hovered?'var(--t2)':'var(--t3)', margin:0, lineHeight:1.5, transition:'color 0.3s' }}>
            {description}
          </p>
        </div>

        {/* Bottom — blur reduces on hover */}
        <div style={{ position:'relative', padding:'0 22px 22px' }}>
          <div style={{
            filter: hovered?'blur(3px)':'blur(8px)',
            opacity: hovered?0.5:0.3,
            pointerEvents:'none', minHeight:65,
            transition:'filter 0.4s ease, opacity 0.4s ease',
          }}>
            {children || (
              <div>
                <div style={{ height:14, width:'75%', background:'rgba(209,250,229,0.08)', borderRadius:4, marginBottom:6 }}/>
                <div style={{ height:20, width:'55%', background:'rgba(209,250,229,0.06)', borderRadius:4, marginBottom:6 }}/>
                <div style={{ height:10, width:'45%', background:'rgba(255,255,255,0.04)', borderRadius:3 }}/>
              </div>
            )}
          </div>

          {/* Dark overlay */}
          <div style={{
            position:'absolute', inset:0,
            background: hovered?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.4)',
            transition:'background 0.3s',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <motion.div
              animate={{ boxShadow:['0 0 15px rgba(229,57,53,0.15)','0 0 25px rgba(229,57,53,0.3)','0 0 15px rgba(229,57,53,0.15)'] }}
              transition={{ duration:2.5, repeat:Infinity }}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'10px 24px', borderRadius:99,
                background: hovered?'rgba(229,57,53,0.2)':'rgba(229,57,53,0.12)',
                border:'1px solid rgba(229,57,53,0.3)',
                color:'#ff4444', fontSize:12, fontWeight:700,
                transition:'background 0.2s',
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={2.5} strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              SEJA PRO
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={2.5} strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && <ProUpgradeModal onClose={() => setShowModal(false)} feature={title}/>}
      </AnimatePresence>
    </>
  )
}

export function ProUpgradeModal({ onClose, feature }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.2 }}
      onClick={e => { if(e.target===e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0, zIndex:10000,
        background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:24,
      }}>
      <motion.div
        initial={{ opacity:0, scale:0.95, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95, y:20 }}
        transition={{ duration:0.3, ease:[0.33,1,0.68,1] }}
        style={{
          width:'100%', maxWidth:420, padding:'40px 36px', borderRadius:20,
          background:'linear-gradient(145deg, #000000, #000000)',
          border:'1px solid rgba(229,57,53,0.15)',
          boxShadow:'0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(229,57,53,0.06)',
          textAlign:'center',
        }}>
        <motion.div
          animate={{ boxShadow:['0 0 20px rgba(229,57,53,0.2)','0 0 40px rgba(229,57,53,0.4)','0 0 20px rgba(229,57,53,0.2)'] }}
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
          Pare de operar no escuro
        </h2>
        <p style={{ fontSize:14, color:'var(--t3)', margin:'0 0 28px', lineHeight:1.5 }}>
          {feature
            ? `"${feature}" — inteligencia que clientes PRO usam pra performar melhor. Decisoes baseadas em dados reais.`
            : 'Previsoes, rankings e alertas que aumentam seu lucro. Quem tem, performa mais.'}
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
