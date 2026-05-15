import { motion } from 'framer-motion'
import { useGlitch } from '../../hooks/useGlitch'
import { GLITCH_DURATION_MS } from '../../config/constants'

interface Props {
  children: React.ReactNode
}

export function GlitchWrapper({ children }: Props) {
  const isGlitching = useGlitch()

  return (
    <motion.div
      animate={
        isGlitching
          ? {
              x: [-3, 3, -2, 4, -1, 0],
              filter: [
                'hue-rotate(0deg) brightness(1)',
                'hue-rotate(60deg) brightness(1.15)',
                'hue-rotate(-30deg) brightness(0.9)',
                'hue-rotate(0deg) brightness(1)',
              ],
            }
          : { x: 0, filter: 'hue-rotate(0deg) brightness(1)' }
      }
      transition={{ duration: GLITCH_DURATION_MS / 1000, ease: 'easeInOut' }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}
