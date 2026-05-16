import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createNoise2D } from 'simplex-noise'
import { MapPin, X } from 'lucide-react'
import { GPS_COORDINATES, GROUP_LABELS } from '../../config/constants'

interface Tooltip {
  index: number
  label: string
  markerX: number // position du marqueur dans le canvas (px)
  markerY: number
}

// 7 angles répartis sur 360° pour les marqueurs à l'intérieur de l'île
const MARKER_ANGLES = [0.3, 1.1, 1.9, 2.8, 3.6, 4.4, 5.2]
const TOOLTIP_W = 230

export function RadarMapModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const sweepAngleRef = useRef(0)
  const noise2D = useRef(createNoise2D())
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [canvasSize, setCanvasSize] = useState(360)
  const [markerPixels, setMarkerPixels] = useState<[number, number][]>([])
  const [wreckPixel, setWreckPixel] = useState<[number, number]>([0, 0])
  const [wreckTooltip, setWreckTooltip] = useState(false)
  const [secretVisible, setSecretVisible] = useState(false)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pressStartRef = useRef<number | null>(null)
  const wasLongPressRef = useRef(false)

  useEffect(() => {
    const updateSize = () => {
      const el = canvasRef.current?.parentElement
      if (el) {
        const isMobile = window.innerWidth < 640
        setCanvasSize(Math.min(el.clientWidth - 8, isMobile ? 360 : 680))
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = canvasSize / 2
    const cy = canvasSize / 2
    // Île plus grande — occupe ~75% du rayon radar
    const maxR = canvasSize * 0.44

    // ── Génération des points de l'île ─────────────────────────────────
    const numPoints = 90
    const islandPoints: [number, number][] = []
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2
      const nx = Math.cos(angle) * 1.8
      const ny = Math.sin(angle) * 1.8
      const n = noise2D.current(nx, ny)
      // Rayons de base plus grands pour une île plus imposante
      const baseRx = maxR * (0.72 + 0.20 * Math.cos(angle * 2.3 + 0.4))
      const baseRy = maxR * (0.58 + 0.18 * Math.sin(angle * 1.7 + 1.1))
      const r = Math.sqrt(baseRx ** 2 * Math.cos(angle) ** 2 + baseRy ** 2 * Math.sin(angle) ** 2)
      const finalR = r * (0.78 + 0.22 * n)
      // Squash y réduit (0.88) pour une île moins écrasée
      islandPoints.push([cx + Math.cos(angle) * finalR, cy + Math.sin(angle) * finalR * 0.88])
    }

    // ── Positions des marqueurs à l'intérieur de l'île ─────────────────
    // On utilise la même formule à 50% du rayon → toujours dans le polygone
    const pixels: [number, number][] = MARKER_ANGLES.map(angle => {
      const nx = Math.cos(angle) * 1.8
      const ny = Math.sin(angle) * 1.8
      const n = noise2D.current(nx, ny)
      const baseRx = maxR * (0.72 + 0.20 * Math.cos(angle * 2.3 + 0.4))
      const baseRy = maxR * (0.58 + 0.18 * Math.sin(angle * 1.7 + 1.1))
      const r = Math.sqrt(baseRx ** 2 * Math.cos(angle) ** 2 + baseRy ** 2 * Math.sin(angle) ** 2)
      const finalR = r * (0.78 + 0.22 * n) * 0.72
      return [cx + Math.cos(angle) * finalR, cy + Math.sin(angle) * finalR * 0.88]
    })
    setMarkerPixels(pixels)

    setWreckPixel([cx, cy])

    // ── Boucle de rendu ────────────────────────────────────────────────
    const drawFrame = () => {
      const ov = document.documentElement.classList.contains('override-active')
      const accent = ov ? '#22c55e' : '#f97316'
      const rgba = (a: number) => ov ? `rgba(34,197,94,${a})` : `rgba(249,115,22,${a})`

      ctx.clearRect(0, 0, canvasSize, canvasSize)

      // Fond uniforme — même couleur que l'océan pour éviter le cadre visible
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvasSize, canvasSize)


      // Anneaux radar
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, (maxR / 4) * i, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(0.18 + i * 0.08)
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      // Lignes croisées
      ctx.strokeStyle = rgba(0.25)
      ctx.lineWidth = 1
      ;[
        [cx - maxR - 10, cy, cx + maxR + 10, cy],
        [cx, cy - maxR - 10, cx, cy + maxR + 10],
        [cx - maxR * 0.72, cy - maxR * 0.72, cx + maxR * 0.72, cy + maxR * 0.72],
        [cx + maxR * 0.72, cy - maxR * 0.72, cx - maxR * 0.72, cy + maxR * 0.72],
      ].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
      })

      // Île — dégradé chaud pour contraster avec l'océan bleu
      ctx.beginPath()
      ctx.moveTo(islandPoints[0][0], islandPoints[0][1])
      for (const [x, y] of islandPoints.slice(1)) ctx.lineTo(x, y)
      ctx.closePath()
      const grad = ctx.createRadialGradient(cx, cy - maxR * 0.05, 0, cx, cy, maxR * 0.7)
      grad.addColorStop(0, 'rgba(50, 40, 18, 1)')
      grad.addColorStop(1, 'rgba(28, 22, 8, 1)')
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Sweep radar — accélère progressivement pendant le long press (0→5s)
      const elapsed = pressStartRef.current !== null ? (performance.now() - pressStartRef.current) / 1000 : 0
      const t = Math.min(elapsed / 4, 1)
      const speedMult = 1 + t * t * t * 49
      sweepAngleRef.current += 0.011 * speedMult
      const sweep = sweepAngleRef.current
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, maxR + 10, sweep - Math.PI * 0.35, sweep)
      ctx.closePath()
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
      sweepGrad.addColorStop(0, rgba(0))
      sweepGrad.addColorStop(0.7, rgba(0.20))
      sweepGrad.addColorStop(1, rgba(0))
      ctx.fillStyle = sweepGrad
      ctx.fill()
      ctx.restore()

      // Ligne de sweep
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweep) * (maxR + 10), cy + Math.sin(sweep) * (maxR + 10))
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.stroke()

      animFrameRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [canvasSize])

  const TOOLTIP_H = 46

  const getTooltipStyle = (markerX: number, markerY: number) => {
    const pad = 8
    const rawLeft = markerX - TOOLTIP_W / 2
    const left = Math.max(pad, Math.min(rawLeft, canvasSize - TOOLTIP_W - pad))
    // Position de la flèche relative au tooltip pour qu'elle pointe vers le marqueur
    const arrowLeft = Math.max(8, Math.min(markerX - left, TOOLTIP_W - 8))
    // Affiche en dessous si pas assez de place au-dessus, sinon au-dessus
    const showBelow = markerY - TOOLTIP_H - 18 < pad
    const top = showBelow ? markerY + 18 : markerY - 18 - TOOLTIP_H
    return { left, top, showBelow, arrowLeft }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-orange-500/30 pb-4">
        <MapPin className="h-4 w-4 text-orange-500" />
        <div>
          <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Module Bêta</p>
          <h2 className="mt-0.5 text-sm tracking-widest text-orange-200 uppercase font-bold">
            Carte Radar — Zone d'impact
          </h2>
        </div>
      </div>

      {/* Canvas + overlays */}
      <div className="relative mx-auto overflow-visible" style={{ width: canvasSize, height: canvasSize }}>
        <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="block" />

        {/* Épave au centre */}
        {wreckPixel[0] > 0 && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10"
            style={{ left: wreckPixel[0], top: wreckPixel[1] }}
          >
            <button
              onClick={() => { if (!wasLongPressRef.current) setWreckTooltip(v => !v); wasLongPressRef.current = false }}
              onPointerDown={() => {
                wasLongPressRef.current = false
                pressStartRef.current = performance.now()
                longPressRef.current = setTimeout(() => { wasLongPressRef.current = true; setSecretVisible(true) }, 5000)
              }}
              onPointerUp={() => { clearTimeout(longPressRef.current); pressStartRef.current = null }}
              onPointerLeave={() => { clearTimeout(longPressRef.current); pressStartRef.current = null }}
              className="h-3 w-3 rounded-full bg-red-500 blink shadow-lg shadow-red-500/80 cursor-pointer"
              aria-label="Signal A.U.R.O.R.A"
            />
          </div>
        )}

        {/* Tooltip épave */}
        <AnimatePresence>
          {wreckTooltip && wreckPixel[0] > 0 && (() => {
            const { left, top } = getTooltipStyle(wreckPixel[0], wreckPixel[1])
            return (
              <motion.div
                key="wreck-tooltip"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute z-20 border border-red-500/70 bg-black font-terminal"
                style={{ left, top, width: TOOLTIP_W }}
              >
                <div className="px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-red-400 tracking-widest uppercase font-bold leading-relaxed">
                      A.U.R.O.R.A localisée<br />dans le Secteur 7
                    </p>
                  </div>
                  <button onClick={() => setWreckTooltip(false)} className="text-red-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Message secret — long press 5s sur le point rouge */}
        <AnimatePresence>
          {secretVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute z-30 border border-red-500/80 bg-black font-terminal shadow-[0_0_24px_rgba(239,68,68,0.3)]"
              style={{ left: 8, right: 8, top: wreckPixel[1] + 14 }}
            >
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <p className="text-xs text-red-400 tracking-wide leading-relaxed">
                  T'as bien fouillé, le dernier chiffre du code est 2.
                </p>
                <button onClick={() => setSecretVisible(false)} className="text-red-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Marqueurs sur l'île */}
        {markerPixels.map(([px, py], i) => (
          <button
            key={i}
            onClick={() => setTooltip(tooltip?.index === i ? null : { index: i, label: GROUP_LABELS[i], markerX: px, markerY: py })}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: px, top: py }}
          >
            <motion.div
              className="relative h-4 w-4 rounded-full border-2 border-orange-500 bg-orange-500/50"
              whileHover={{ scale: 1.7 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 rounded-full bg-orange-500/60 animate-ping" style={{ animationDuration: '2.5s' }} />
            </motion.div>
          </button>
        ))}

        {/* Tooltip — positionné intelligemment près du marqueur */}
        <AnimatePresence>
          {tooltip && (() => {
            const { left, top, showBelow, arrowLeft } = getTooltipStyle(tooltip.markerX, tooltip.markerY)
            return (
              <motion.div
                key={tooltip.index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute z-20 border border-orange-500/60 bg-black font-terminal"
                style={{
                  left,
                  top,
                  width: TOOLTIP_W,
                }}
              >
                <div className="px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-orange-300 tracking-widest uppercase font-bold">{tooltip.label}</p>
                  </div>
                  <button onClick={() => setTooltip(null)} className="text-orange-600 hover:text-orange-400 transition-colors flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {/* Flèche pointant vers le marqueur */}
                {!showBelow && (
                  <div className="absolute -bottom-[7px] h-3 w-3 rotate-45 border-b-2 border-r-2 border-orange-500/60 bg-black" style={{ left: arrowLeft - 6 }} />
                )}
                {showBelow && (
                  <div className="absolute -top-[7px] h-3 w-3 rotate-45 border-t-2 border-l-2 border-orange-500/60 bg-black" style={{ left: arrowLeft - 6 }} />
                )}
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>

      {/* GPS — texte HTML sélectionnable */}
      <div className="flex justify-center">
        <span className="font-terminal text-sm font-bold text-orange-500 tracking-widest select-text">
          {GPS_COORDINATES.lat}° N &nbsp;&nbsp; {GPS_COORDINATES.lng}° E
        </span>
      </div>

      <p className="text-center text-xs text-orange-500 font-terminal tracking-widest">
        SIGNAL ACTIF — 7 SOURCES DÉTECTÉES — DONNÉES PARTIELLES
      </p>
    </div>
  )
}
