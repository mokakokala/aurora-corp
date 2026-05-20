import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ORANGE_FILTER = 'brightness(0) saturate(100%) invert(62%) sepia(90%) saturate(800%) hue-rotate(345deg) brightness(95%)'

export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const hintTimer = setTimeout(() => setShowHint(true), 1200)
    const advanceTimer = setTimeout(onComplete, 5000)
    return () => { clearTimeout(hintTimer); clearTimeout(advanceTimer) }
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black font-terminal p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="pointer-events-none absolute inset-0 scanlines opacity-15" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 cursor-pointer select-none"
        onClick={onComplete}
      >
        <img
          src={`${import.meta.env.BASE_URL}Logo troupe.png`}
          alt="A.U.R.O.R.A Corp"
          className="w-56 sm:w-72 md:w-96"
          style={{ filter: ORANGE_FILTER }}
          draggable={false}
        />
        <AnimatePresence>
          {showHint && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.25, 0.6] }}
              transition={{ duration: 1 }}
              className="text-xs tracking-[0.4em] text-orange-800 uppercase"
            >
              Appuyez pour continuer
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
