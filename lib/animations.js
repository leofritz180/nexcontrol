// NexControl — Animation presets for framer-motion

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
}

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] },
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] } },
}

export const cardHover = {
  whileHover: { y: -3, scale: 1.01, transition: { duration: 0.25 } },
  whileTap: { scale: 0.98 },
}

export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.96 },
  transition: { duration: 0.15 },
}
