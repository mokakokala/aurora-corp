import { motion } from 'framer-motion'
import { Shield, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Props {
  username: string
  onContinue: () => void
}

export function ReturningUserGate({ username, onContinue }: Props) {
  const handleOtherAccount = async () => {
    await supabase.auth.signOut()
    // onAuthStateChange in App.tsx handles the rest
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/97 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 scanlines opacity-20" />

      <motion.div
        className="w-full max-w-md border border-orange-500/60 bg-black/90 p-8 font-terminal space-y-7"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-3 border-b border-orange-500/40 pb-5">
          <Shield className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Terminal A.U.R.O.R.A</p>
            <h1 className="mt-1 text-sm tracking-widest text-orange-100 uppercase font-bold">
              Session active
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 blink" />
            <span className="text-xs text-orange-400 tracking-widest">EN LIGNE</span>
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-xs text-orange-600 tracking-widest uppercase">Identité détectée</p>
          <p className="text-xl text-orange-300 font-bold tracking-widest uppercase">
            {username}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full border border-orange-500/70 bg-orange-500/15 px-6 py-3.5 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 hover:text-orange-200"
          >
            Continuer en tant que {username}
          </button>

          <button
            onClick={handleOtherAccount}
            className="flex items-center justify-center gap-2 w-full py-2 text-xs tracking-widest text-orange-700 hover:text-orange-500 transition-colors duration-200 uppercase"
          >
            <LogOut className="h-3 w-3" />
            Utiliser un autre compte
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
