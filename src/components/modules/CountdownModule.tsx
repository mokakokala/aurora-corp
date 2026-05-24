import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Download, Radio, KeyRound } from 'lucide-react'
import { useCountdown } from '../../hooks/useCountdown'
import { TARGET_DATE, OVERRIDE_LOG_TABLE, FAILED_OVERRIDE_TABLE } from '../../config/constants'
import { supabase } from '../../lib/supabase'
import { discoverEasterEgg } from '../../lib/discoverEasterEgg'
import { PunishmentModal } from './PunishmentModal'
import { useAdminCode } from '../../hooks/useAdminCode'

const WEAK_CODES = new Set(['0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','2929','2933','2026','2626','2525'])

function DigitBox({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={display}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex h-12 w-12 sm:h-20 sm:w-20 items-center justify-center border-2 border-orange-500/80 bg-black/80 text-xl sm:text-3xl font-terminal text-orange-400 tabular-nums"
        >
          {display}
        </motion.div>
      </AnimatePresence>
      <span className="text-xs tracking-[0.2em] text-orange-500 uppercase">{label}</span>
    </div>
  )
}

interface Props {
  animDone?: boolean
  postReveal?: boolean
}

export function CountdownModule({
  animDone  = sessionStorage.getItem('aurora_endanim') === '1',
  postReveal = false,
}: Props) {
  const adminCode = useAdminCode()
  const { days, hours, minutes, seconds, expired } = useCountdown(TARGET_DATE)
  const [blockedClicks, setBlockedClicks] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [overrideCode, setOverrideCode] = useState('')
  const [overrideStatus, setOverrideStatus] = useState<'idle' | 'accepted' | 'rejected' | 'mocked'>('idle')
  const [manualUnlock, setManualUnlock] = useState(() => sessionStorage.getItem('aurora_override') === '1')

  const [wrongAttempts, setWrongAttempts] = useState(
    () => parseInt(sessionStorage.getItem('aurora_wrong') ?? '0', 10)
  )
  const [showPunishment, setShowPunishment] = useState(false)
  const [punishmentNumber, setPunishmentNumber] = useState(1)

  const isUnlocked = (expired && animDone) || manualUnlock

  if (manualUnlock || animDone) document.documentElement.classList.add('override-active')

  const handleBlockedClick = () => {
    if (isUnlocked) return
    const next = blockedClicks + 1
    setBlockedClicks(next)
    if (next >= 3) {
      clearTimeout(warningTimeoutRef.current)
      setShowWarning(true)
      warningTimeoutRef.current = setTimeout(() => setShowWarning(false), 5000)
    }
  }

  const handleOverride = () => {
    if (adminCode && overrideCode === adminCode) {
      setOverrideStatus('accepted')

      const raw = sessionStorage.getItem('aurora_identity')
      const identity = raw ? JSON.parse(raw) as { prenom_totem: string; age: number; ip?: string; city?: string } : null
      supabase.from(OVERRIDE_LOG_TABLE).insert([{
        prenom_totem: identity?.prenom_totem ?? 'inconnu',
        age: identity?.age ?? null,
        override_at: new Date().toISOString(),
        ip: identity?.ip ?? null,
        city: identity?.city ?? null,
      }]).then(({ error }) => { if (error) console.error('Override log error:', error) })
      discoverEasterEgg('override_reussi')

      setTimeout(() => {
        sessionStorage.setItem('aurora_override', '1')
        setManualUnlock(true)
        document.documentElement.classList.add('override-active')
      }, 600)
    } else {
      const isMocked = WEAK_CODES.has(overrideCode)
      setOverrideStatus(isMocked ? 'mocked' : 'rejected')
      setTimeout(() => setOverrideStatus('idle'), isMocked ? 4000 : 2000)

      const raw = sessionStorage.getItem('aurora_identity')
      const identity = raw ? JSON.parse(raw) as { prenom_totem: string; age: number; ip?: string; city?: string } : null
      supabase.from(FAILED_OVERRIDE_TABLE).insert([{
        prenom_totem: identity?.prenom_totem ?? 'inconnu',
        age: identity?.age ?? null,
        ip: identity?.ip ?? null,
        city: identity?.city ?? null,
        code_tried: overrideCode,
        failed_at: new Date().toISOString(),
      }]).then(({ error }) => { if (error) console.error('Failed override log error:', error) })

      setOverrideCode('')

      const newWrong = wrongAttempts + 1
      setWrongAttempts(newWrong)
      sessionStorage.setItem('aurora_wrong', String(newWrong))
      if (newWrong % 3 === 0) {
        setPunishmentNumber(newWrong / 3)
        setShowPunishment(true)
      }
    }
  }

  return (
    <>
    {showPunishment && (
      <PunishmentModal
        punishmentNumber={punishmentNumber}
        onClose={() => setShowPunishment(false)}
      />
    )}

    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
        >
          <div className="w-full max-w-sm border-2 border-red-500 bg-black px-6 py-5 font-terminal shadow-[0_0_40px_rgba(239,68,68,0.5)]">
            <p className="text-xs text-red-500 tracking-[0.3em] uppercase mb-3">⚠ ALERTE SYSTÈME</p>
            <p className="text-sm text-red-300 leading-relaxed tracking-wide">
              Arrêtez de forcer l'accès.
              <br /><br />
              L'impatience a déjà causé des dommages bien trop importants.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-orange-500/30 pb-4">
        <Radio className="h-4 w-4 text-orange-500" />
        <div>
          <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Module Alpha</p>
          <h2 className="mt-0.5 text-sm tracking-widest text-orange-200 uppercase font-bold">
            Restauration Système
          </h2>
        </div>
      </div>

      <p className="text-xs text-orange-500 tracking-widest leading-relaxed">
        OPÉRATION : Déclassification du document
        <br />
        STATUT : {isUnlocked ? 'DÉVERROUILLÉ' : 'EN ATTENTE DE RESTAURATION...'}
      </p>

      {/* Timer */}
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="timer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-3 sm:gap-4"
          >
            <DigitBox value={days} label="Jours" />
            <div className="flex items-center pb-6 text-orange-500 text-2xl font-terminal">:</div>
            <DigitBox value={hours} label="Heures" />
            <div className="flex items-center pb-6 text-orange-500 text-2xl font-terminal">:</div>
            <DigitBox value={minutes} label="Min" />
            <div className="flex items-center pb-6 text-orange-500 text-2xl font-terminal">:</div>
            <DigitBox value={seconds} label="Sec" />
          </motion.div>
        ) : (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <p className="text-sm tracking-[0.3em] text-orange-400 uppercase">
              Système restauré — Fichiers accessibles
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Override panel — visible uniquement quand le compte à rebours tourne */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="border border-orange-500/20 bg-black/40 px-4 py-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="h-3 w-3 text-orange-600" />
              <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">Protocole Override</p>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={overrideCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setOverrideCode(val)
                  if (overrideStatus !== 'idle') setOverrideStatus('idle')
                }}
                onKeyDown={(e) => e.key === 'Enter' && overrideCode.length === 4 && handleOverride()}
                placeholder="[_ _ _ _]"
                className="flex-1 border border-orange-500/40 bg-black px-3 py-2.5 text-sm font-terminal text-center tracking-[0.4em] text-orange-300 placeholder-orange-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all duration-200"
              />
              <button
                onClick={handleOverride}
                disabled={overrideCode.length !== 4}
                className="border border-orange-500/50 bg-orange-500/10 px-4 py-2.5 text-xs tracking-[0.2em] text-orange-400 uppercase transition-all duration-200 hover:bg-orange-500/20 hover:border-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Forcer l'accès
              </button>
            </div>

            {/* Feedback */}
            <AnimatePresence mode="wait">
              {overrideStatus === 'rejected' && (
                <motion.p
                  key="rejected"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs tracking-[0.3em] text-red-500 uppercase font-terminal"
                >
                  ✗ CODE REJETÉ
                </motion.p>
              )}
              {overrideStatus === 'mocked' && (
                <motion.p
                  key="mocked"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-red-400 font-terminal leading-relaxed"
                >
                  Bien essayé chef. Malheureusement on est assez smart pour pas mettre un code de zeub comme tu penses.
                </motion.p>
              )}
              {overrideStatus === 'accepted' && (
                <motion.p
                  key="accepted"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: [0, -2, 2, -1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-xs tracking-[0.3em] text-green-400 uppercase font-terminal"
                  style={{ textShadow: '0 0 10px rgba(74,222,128,0.8)' }}
                >
                  ✓ OVERRIDE ACCEPTÉ
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download button */}
      <motion.div
        animate={{ opacity: isUnlocked ? 1 : 0.45 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative"
      >
        {isUnlocked ? (
          <motion.a
            href={`${import.meta.env.BASE_URL}Carnet%20de%20camp_Troupe%20de%20l'Aurore_Croatie%202026.pdf`}
            download="Carnet de camp_Troupe de l'Aurore_Croatie 2026.pdf"
            className="flex w-full items-center justify-center gap-3 border border-orange-500/70 bg-orange-500/15 px-6 py-4 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400"
            animate={postReveal
              ? { boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 50px rgba(255,255,255,0.95)', '0 0 15px rgba(255,255,255,0.3)', '0 0 0px rgba(255,255,255,0)'] }
              : { boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 20px rgba(249,115,22,0.3)', '0 0 0px rgba(249,115,22,0)'] }
            }
            transition={{ repeat: Infinity, duration: postReveal ? 2.0 : 2, ease: 'easeInOut' }}
          >
            <Download className="h-4 w-4" />
            Télécharger le document
          </motion.a>
        ) : (
          <div className="relative">
            {/* div au lieu de button disabled — les boutons disabled bloquent tous les events souris */}
            <div
              role="button"
              aria-disabled="true"
              onClick={handleBlockedClick}
              className="flex w-full items-center justify-center gap-3 border border-orange-500/40 bg-black/40 px-6 py-4 text-xs tracking-[0.3em] text-orange-600 uppercase cursor-not-allowed select-none"
            >
              <Lock className="h-4 w-4" />
              Télécharger le document
            </div>
          </div>
        )}
      </motion.div>
    </div>
    </>
  )
}
