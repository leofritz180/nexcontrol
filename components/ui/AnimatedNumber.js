'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform, useInView } from 'framer-motion'

export default function AnimatedNumber({ value, prefix = '', suffix = '', duration = 0.8, decimals = 2, style = {} }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0 : Number(value || 0)

  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, v => {
    const abs = Math.abs(v)
    const formatted = abs.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    return `${prefix}${formatted}${suffix}`
  })

  useEffect(() => {
    if (inView) spring.set(num)
  }, [inView, num])

  return <motion.span ref={ref} style={style}>{display}</motion.span>
}
