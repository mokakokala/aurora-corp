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
              x:      [0, -10, 1, 12, -2, 7, -1, 0],
              skewX:  [0,  -1, 0,  1,  0, 0.5, 0, 0],
              filter: [
                'hue-rotate(0deg)   brightness(1)    contrast(1)',
                'hue-rotate(100deg) brightness(1.35) contrast(1.2)',
                'hue-rotate(0deg)   brightness(1)    contrast(1)',
                'hue-rotate(-70deg) brightness(1.25) contrast(1.15)',
                'hue-rotate(0deg)   brightness(1)    contrast(1)',
                'hue-rotate(50deg)  brightness(1.15) contrast(1.1)',
                'hue-rotate(0deg)   brightness(1)    contrast(1)',
                'hue-rotate(0deg)   brightness(1)    contrast(1)',
              ],
            }
          : { x: 0, skewX: 0, filter: 'hue-rotate(0deg) brightness(1) contrast(1)' }
      }
      transition={{
        duration: GLITCH_DURATION_MS / 1000,
        ease: 'linear',
        times: [0, 0.08, 0.2, 0.32, 0.48, 0.62, 0.8, 1],
      }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}
