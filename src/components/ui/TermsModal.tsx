import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const ASCII_HAND = `    | |  | |
    | |  | |
    | |  | |
    | |__| |-.
    |         \\
    |          |
    |          |
     \\_________/
          |
        __|__
       |     |
       |_____|`

export function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const raw = sessionStorage.getItem('aurora_identity')
    const identity = raw ? JSON.parse(raw) as { prenom_totem: string; ip?: string; city?: string } : null
    supabase.from('terms_views').insert([{
      prenom_totem: identity?.prenom_totem ?? 'inconnu',
      ip: identity?.ip ?? null,
      city: identity?.city ?? null,
    }]).then(({ error }) => { if (error) console.error('terms_views insert:', error) })
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/92 backdrop-blur-sm p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-2xl my-8 border border-orange-500/40 bg-black font-terminal"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-orange-500/30 px-6 py-4">
              <div>
                <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Document Légal — Réf. AUR-CGU-2026</p>
                <p className="text-sm tracking-wider text-orange-300 font-bold uppercase mt-0.5">
                  Termes et Conditions d'Utilisation
                </p>
              </div>
              <button onClick={onClose} className="text-orange-600 hover:text-orange-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 text-xs text-orange-700 leading-relaxed tracking-wide">
              <section className="space-y-2.5">
                <p className="text-orange-500 uppercase tracking-widest font-bold">Article 1 — Objet et champ d'application</p>
                <p>Les présentes conditions générales d'utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme A.U.R.O.R.A CORP (ci-après « le Système »), exploitée par la Corporation Aurora dans le cadre de ses opérations de surveillance, d'analyse biométrique et de gestion des ressources de l'île. L'accès au Système implique l'acceptation pleine et entière des présentes CGU. Toute utilisation contraire aux dispositions ci-après entraînera la suspension immédiate de l'accès et, le cas échéant, l'activation du protocole de confinement d'urgence prévu à l'Annexe C du Règlement Opérationnel.</p>
                <p>Le Système est réservé aux personnels habilités disposant d'un identifiant biométrique reconnu par les serveurs de la Corporation. Tout accès non autorisé sera signalé aux autorités compétentes de la zone classifiée et consigné dans les journaux d'audit permanents. La Corporation se réserve le droit de résilier tout accès sans préavis ni justification.</p>
              </section>

              <section className="space-y-2.5">
                <p className="text-orange-500 uppercase tracking-widest font-bold">Article 2 — Collecte et traitement des données</p>
                <p>En accédant au Système, l'utilisateur consent expressément à la collecte des données suivantes : identifiant biométrique (totem ou désignation corporative), données de géolocalisation approximative, adresse de protocole réseau, horodatage de connexion, et données comportementales générées lors de l'utilisation des modules d'analyse. Ces données sont traitées conformément aux directives internes de la Corporation Aurora, lesquelles prévalent sur toute réglementation civile ou territoriale au sein de la zone d'opérations.</p>
                <p>Les données collectées peuvent être partagées avec les unités de commandement, les équipes de terrain déployées sur l'île, ainsi que tout organisme mandaté par la Corporation aux fins de sécurisation du périmètre. La durée de conservation est indéfinie et peut être prolongée en cas de nécessité opérationnelle. L'utilisateur renonce expressément à tout droit d'accès, de rectification ou de suppression de ses données dans le cadre du présent Système.</p>
              </section>

              <section className="space-y-2.5">
                <p className="text-orange-500 uppercase tracking-widest font-bold">Article 3 — Utilisations autorisées et restrictions</p>
                <p>L'utilisateur s'engage à utiliser le Système exclusivement à des fins conformes à la mission de la Corporation Aurora. Il est strictement interdit de tenter de contourner les mesures de sécurité du Système, de soumettre des données biométriques falsifiées, de partager ses identifiants d'accès avec des tiers non habilités, ou de reproduire, distribuer ou modifier tout contenu classifié extrait du Système sans autorisation écrite préalable du Commandement Suprême.</p>
                <p>Toute tentative de forçage du protocole de décompte temporel, d'injection de séquences non autorisées dans le module d'analyse ADN, ou d'interception des transmissions audio sécurisées sera considérée comme une violation grave des présentes CGU. La Corporation Aurora se réserve le droit de modifier unilatéralement les présentes CGU à tout moment et sans préavis. Les modifications prennent effet dès leur publication sur le Système.</p>
              </section>

              <section className="space-y-2.5">
                <p className="text-orange-500 uppercase tracking-widest font-bold">Article 4 — Limitation de responsabilité</p>
                <p>La Corporation Aurora ne saurait être tenue responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le Système, notamment en cas de panne des serveurs, d'interruption de la liaison satellite, de corruption des données biométriques due à une violation de l'Article de Sécurité en vigueur, ou de tout événement constitutif de force majeure — naufrage, tempête magnétique, perturbation des fréquences d'ondes, ou défaillance de l'infrastructure insulaire. Le Système est fourni « en l'état », sans garantie d'aucune sorte, expresse ou implicite, quant à son exactitude, sa disponibilité ou son adéquation à un usage particulier.</p>
                <p>En aucun cas la Corporation Aurora ne garantit l'exactitude des résultats fournis par le Scanner ADN, lesquels peuvent être affectés par des anomalies biométriques, des corruptions de base de données, ou des interférences électromagnétiques propres à l'environnement insulaire. L'utilisateur reconnaît en avoir été informé et renonce à tout recours à ce titre.</p>
              </section>

              <section className="space-y-2.5">
                <p className="text-orange-500 uppercase tracking-widest font-bold">Article 5 — Propriété intellectuelle</p>
                <p>L'ensemble des contenus du Système — y compris mais sans s'y limiter les dossiers de factions, les transmissions audio interceptées, les données cartographiques de l'île, les séquences ADN archivées et les codes d'accès opérationnels — constituent des informations classifiées, propriété exclusive de la Corporation Aurora. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable. Les dénominations A.U.R.O.R.A et A.U.R.O.R.A CORP, ainsi que les identifiants de factions, sont des marques déposées. Leur utilisation non autorisée est passible de poursuites.</p>
              </section>

              <section className="space-y-2.5">
                <p className="text-orange-500 uppercase tracking-widest font-bold">Article 6 — Droit applicable et juridiction</p>
                <p>Les présentes CGU sont régies par le droit interne de la Corporation Aurora, lequel prévaut sur tout autre corpus juridique dans la zone d'opérations. Tout litige sera soumis à la compétence exclusive du Tribunal de la Zone Classifiée, dont le siège est fixé à la position GPS [DONNÉES CLASSIFIÉES]. Les parties renoncent expressément à tout autre mode de règlement des différends, y compris l'arbitrage international et les juridictions civiles de droit commun.</p>
                <p>En cas de contradiction entre les présentes CGU et toute disposition d'un traité international, accord bilatéral ou réglementation nationale, les présentes CGU prévaudront dans la stricte mesure permise par la loi applicable au siège de la Corporation. La nullité d'une clause n'emporte pas la nullité des autres dispositions.</p>
              </section>

              <div className="border-t border-orange-500/20 pt-6 flex flex-col items-center gap-5">
                <p className="text-orange-500/40 text-xs tracking-widest">— FIN DES CONDITIONS D'UTILISATION —</p>
                <pre className="text-orange-400/60 text-xs leading-tight select-none font-terminal text-center whitespace-pre">
                  {ASCII_HAND}
                </pre>
                <p className="text-orange-300/90 text-5xl font-bold tracking-widest select-none leading-none">V</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
