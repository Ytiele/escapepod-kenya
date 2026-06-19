import type { Variants } from 'framer-motion'

export const ease = [0.22, 1, 0.36, 1] as const

// Stagger containers
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export const staggerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
}

// Individual element variants
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
}

export const fadeUpSoft: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 44 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
}

export const fromLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
}

export const fromRight: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease } },
}

export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease } },
}

// Reusable viewport config
export const viewport = { once: true, margin: '-80px' } as const
export const viewportNear = { once: true, margin: '-40px' } as const
