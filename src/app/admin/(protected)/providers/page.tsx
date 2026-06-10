import React from 'react'
import ProviderManager from '@/components/admin/ProviderManager'
import { getProviderApplications } from '@/app/actions/adminProviders'
import { fetchEvents } from '../loaders'

export const dynamic = 'force-dynamic'

export default async function AdminProvidersPage() {
  const [providers, events] = await Promise.all([
    getProviderApplications(),
    fetchEvents(),
  ])

  const totalPending = providers.filter(p => p.status === 'pending').length
  const totalAccepted = providers.filter(p => p.status === 'accepted').length

  return (
    <div className="space-y-10">
      {/* Header section consistent with design guidelines */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.12),transparent_70%)] w-[70vw]" />
        <div className="relative grid gap-8 xl:grid-cols-[2fr_1.2fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-black/50 px-4 py-1 text-[11px] uppercase tracking-[0.4em] text-white/70">
              Talents & Partenaires
            </span>
            <h1 className="font-heading text-4xl text-main">Candidatures Prestataires</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Gérez les demandes des artistes, musiciens, photographes et partenaires souhaitant prester ou collaborer sur vos soirées de prestige.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <HighlightCard
                title="En Attente d'Examen"
                value={totalPending.toString()}
                helper="Nouveaux dossiers à examiner"
              />
              <HighlightCard
                title="Prestataires Acceptés"
                value={totalAccepted.toString()}
                helper="Prêts à intégrer la programmation"
              />
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/15 bg-black/55 p-6 text-sm text-white/70">
              <h2 className="font-heading text-2xl text-white">Processus VIP</h2>
              <ul className="mt-4 space-y-3 text-xs uppercase tracking-[0.25em] text-white/55 list-disc pl-4">
                <li>Examinez le portfolio ou les liens réseaux des candidats (directement cliquables).</li>
                <li>Validez le statut pour coordonner la programmation.</li>
                <li>Supprimez les dossiers obsolètes pour libérer de l'espace.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive provider manager */}
      <ProviderManager providers={providers} events={events} />
    </div>
  )
}

function HighlightCard({
  title,
  value,
  helper,
}: {
  title: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-[11px] uppercase tracking-[0.4em] text-white/55">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/60">{helper}</p>
    </div>
  )
}
