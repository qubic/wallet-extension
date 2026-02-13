import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type AnimatedRouteProps = {
  children: ReactNode
}

const spring = { type: 'spring', stiffness: 260, damping: 26, mass: 0.8 } as const

const AnimatedRoute = ({ children }: AnimatedRouteProps) => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className="h-full min-h-full">{children}</div>
  }

  return (
    <motion.div
      className="h-full min-h-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        opacity: { duration: 0.2, ease: 'easeOut' },
        y: spring,
      }}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedRoute
