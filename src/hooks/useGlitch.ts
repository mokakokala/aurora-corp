import { useState, useEffect } from 'react'
import { GLITCH_INTERVAL_MS, GLITCH_DURATION_MS } from '../config/constants'

let sharedCtx: AudioContext | null = null

async function playGlitchSfx() {
  try {
    if (!window.AudioContext) return
    if (!sharedCtx || sharedCtx.state === 'closed') sharedCtx = new AudioContext()
    if (sharedCtx.state === 'suspended') await sharedCtx.resume()

    const ctx = sharedCtx
    const now = ctx.currentTime
    const duration = 0.4

    // Oscillateur en dents de scie — base du bourdonnement électrique
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 90

    // Distorsion forte — harmoniques du courant électrique
    const dist = ctx.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1
      curve[i] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x))
    }
    dist.curve = curve
    dist.oversample = '4x'

    // LFO carré à 28Hz — crée le découpage "dzz-dzz-dzz"
    const lfo = ctx.createOscillator()
    lfo.type = 'square'
    lfo.frequency.value = 28
    const lfoAmt = ctx.createGain()
    lfoAmt.gain.value = 0.35
    const lfoBase = ctx.createConstantSource()
    lfoBase.offset.value = 0.45

    // chopGain.gain = 0 (base) + lfoAmt + lfoBase → oscille entre 0.1 et 0.8
    const chopGain = ctx.createGain()
    chopGain.gain.value = 0
    lfo.connect(lfoAmt)
    lfoAmt.connect(chopGain.gain)
    lfoBase.connect(chopGain.gain)

    // Enveloppe globale
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, now)
    master.gain.linearRampToValueAtTime(0.10, now + 0.01)
    master.gain.setValueAtTime(0.10, now + duration * 0.65)
    master.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(dist)
    dist.connect(chopGain)
    chopGain.connect(master)
    master.connect(ctx.destination)

    osc.start(now)
    lfo.start(now)
    lfoBase.start(now)
    osc.stop(now + duration)
    lfo.stop(now + duration)
    lfoBase.stop(now + duration)
  } catch {
    // Audio non disponible, on ignore silencieusement
  }
}

export function useGlitch(): boolean {
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    // Pré-initialise l'AudioContext dès le premier clic pour garantir la sync
    const warmup = () => {
      if (!sharedCtx && window.AudioContext) sharedCtx = new AudioContext()
    }
    document.addEventListener('click', warmup, { once: true })

    // Empêche le navigateur de suspendre l'AudioContext entre les glitches
    const keepAlive = setInterval(() => {
      if (sharedCtx?.state === 'suspended') sharedCtx.resume()
    }, 4000)

    const trigger = () => {
      playGlitchSfx()
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MS)
    }
    const id = setInterval(trigger, GLITCH_INTERVAL_MS)

    return () => {
      clearInterval(id)
      clearInterval(keepAlive)
      document.removeEventListener('click', warmup)
    }
  }, [])

  return isGlitching
}
