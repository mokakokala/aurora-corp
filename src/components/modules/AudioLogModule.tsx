import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Radio, Volume2 } from 'lucide-react'
import { useWavesurfer } from '@wavesurfer/react'

function formatTime(s: number): string {
  if (!isFinite(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function AudioLogModule() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: '/aurora-corp/distress_signal.mp3',
    waveColor: 'rgba(249,115,22,0.85)',
    progressColor: '#f97316',
    cursorColor: 'rgba(255,255,255,0.8)',
    height: 80,
    barWidth: 2,
    barGap: 1,
    barRadius: 1,
    normalize: true,
  })

  const onReady = useCallback(() => setIsReady(true), [])

  if (wavesurfer) {
    wavesurfer.on('ready', onReady)
  }

  const togglePlay = () => wavesurfer?.playPause()

  const duration = wavesurfer?.getDuration() ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-orange-500/30 pb-4">
        <Radio className="h-4 w-4 text-orange-500" />
        <div>
          <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Module Delta</p>
          <h2 className="mt-0.5 text-sm tracking-widest text-orange-200 uppercase font-bold">
            Audio Log — Signal intercepté
          </h2>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs font-terminal text-orange-500 tracking-widest">
        <span>FRÉQUENCE: 148.5 MHz</span>
        <span>CRYPTAGE: PARTIEL</span>
        <span>SOURCE: INCONNUE</span>
        <span>HORODATAGE: CORROMPU</span>
      </div>

      {/* Waveform player */}
      <div className="border border-orange-500/60 bg-black/60 p-4 space-y-4">
        {/* Waveform + interference overlay */}
        <div className="relative">
          <div ref={containerRef} className="w-full" />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="text-xs text-orange-500 font-terminal tracking-widest"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                Chargement du signal...
              </motion.span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 interference-lines opacity-30" />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={togglePlay}
            disabled={!isReady}
            className="flex h-10 w-10 items-center justify-center border border-orange-500/60 bg-orange-500/15 text-orange-400 transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            whileTap={{ scale: 0.92 }}
            animate={
              isPlaying
                ? { boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 18px rgba(249,115,22,0.5)', '0 0 0px rgba(249,115,22,0)'] }
                : { boxShadow: '0 0 0px rgba(249,115,22,0)' }
            }
            transition={{ repeat: isPlaying ? Infinity : 0, duration: 1.5 }}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </motion.button>

          <div className="flex-1 space-y-1">
            {/* Time */}
            <div className="flex justify-between text-xs font-terminal text-orange-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            {/* VU meter */}
            <div className="flex gap-0.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-1.5 flex-1 rounded-sm ${i < 14 ? 'bg-orange-500' : i < 17 ? 'bg-orange-400' : 'bg-red-500'}`}
                  animate={isPlaying ? { opacity: [0.3, Math.random() * 0.7 + 0.3, 0.3] } : { opacity: 0.15 }}
                  transition={{ repeat: Infinity, duration: 0.15 + Math.random() * 0.25, delay: i * 0.02 }}
                />
              ))}
            </div>
          </div>

          <Volume2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
        </div>
      </div>

      <p className="text-center text-xs text-orange-500 font-terminal tracking-widest">
        Tentative de récupération n°9
      </p>

      <p className="text-center text-xs text-orange-600 font-terminal tracking-widest">
        AVERTISSEMENT — CONTENU POTENTIELLEMENT CLASSIFIÉ
      </p>
    </div>
  )
}
