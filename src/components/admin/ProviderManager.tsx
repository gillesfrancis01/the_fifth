'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Provider, events as Event } from '@/types'
import { updateProviderApplicationStatus, deleteProviderApplication } from '@/app/actions/adminProviders'
import { PiCheck, PiX, PiTrash, PiBriefcase, PiEnvelope, PiPhone, PiGlobe, PiCalendar } from 'react-icons/pi'

interface ProviderManagerProps {
  providers: Provider[]
  events: Event[]
}

export default function ProviderManager({ providers, events }: ProviderManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleUpdateStatus = (id: string, newStatus: 'accepted' | 'rejected') => {
    startTransition(async () => {
      const result = await updateProviderApplicationStatus(id, newStatus)
      if (result.success) {
        setBanner({ 
          type: 'success', 
          message: `Statut de la candidature mis à jour avec succès (${newStatus === 'accepted' ? 'Acceptée' : 'Refusée'}).` 
        })
        router.refresh()
      } else {
        setBanner({ type: 'error', message: result.error || 'Erreur lors de la mise à jour.' })
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette candidature ?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteProviderApplication(id)
      if (result.success) {
        setBanner({ type: 'success', message: 'Candidature supprimée avec succès.' })
        router.refresh()
      } else {
        setBanner({ type: 'error', message: result.error || 'Erreur lors de la suppression.' })
      }
    })
  }

  const filteredProviders = providers.filter(provider => {
    if (activeTab === 'all') return true
    return provider.status === activeTab
  })

  // Get event name helper
  const getEventName = (eventId?: string | null) => {
    if (!eventId) return 'Candidature spontanée'
    const event = events.find(e => e.$id === eventId)
    return event ? event.name : 'Événement inconnu'
  }

  return (
    <div className="space-y-6">
      {/* Tab Filters */}
      <div className="flex flex-wrap border-b border-white/10 pb-px">
        {(['all', 'pending', 'accepted', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-6 py-3 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'border-main text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {tab === 'all' && 'Toutes les candidatures'}
            {tab === 'pending' && 'En attente'}
            {tab === 'accepted' && 'Acceptées'}
            {tab === 'rejected' && 'Refusées'}
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
              {tab === 'all' 
                ? providers.length 
                : providers.filter(p => p.status === tab).length
              }
            </span>
          </button>
        ))}
      </div>

      {banner && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${banner.type === 'success'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
            : 'border-red-500/40 bg-red-500/10 text-red-200'
            }`}
        >
          {banner.message}
        </p>
      )}

      {/* Grid of applications */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredProviders.map((provider) => (
          <article
            key={provider.$id}
            className="flex flex-col justify-between space-y-4 rounded-3xl border border-white/10 bg-black/35 p-6 transition hover:border-white/20"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-xl font-medium text-white">{provider.name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-main font-semibold mt-1">
                    <PiBriefcase className="h-3.5 w-3.5" />
                    {provider.specialty}
                  </span>
                </div>
                
                {/* Status Badge */}
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-wider font-semibold ${
                    provider.status === 'accepted'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : provider.status === 'rejected'
                      ? 'border-red-500/40 bg-red-500/10 text-red-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  }`}
                >
                  {provider.status === 'accepted' && 'Accepté'}
                  {provider.status === 'rejected' && 'Refusé'}
                  {provider.status === 'pending' && 'En attente'}
                </span>
              </div>

              {/* Event target */}
              <p className="flex items-center gap-2 text-sm text-white/70">
                <PiCalendar className="h-4.5 w-4.5 text-main/80 flex-shrink-0" />
                <span className="font-medium">Événement :</span>
                <span className="text-white/90">{getEventName(provider.eventId)}</span>
              </p>

              {/* Contact info */}
              <div className="space-y-2 text-xs text-white/60 bg-black/40 rounded-xl p-3 border border-white/5">
                <p className="flex items-center gap-2">
                  <PiEnvelope className="h-4 w-4 text-main/70" />
                  <a href={`mailto:${provider.email}`} className="hover:underline hover:text-white">
                    {provider.email}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <PiPhone className="h-4 w-4 text-main/70" />
                  <a href={`tel:${provider.phone}`} className="hover:underline hover:text-white">
                    {provider.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <PiGlobe className="h-4 w-4 text-main/70" />
                  <a
                    href={provider.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white truncate max-w-[280px]"
                  >
                    {provider.portfolio}
                  </a>
                </p>
              </div>

              {/* Presentation message */}
              {provider.message && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">Présentation :</p>
                  <p className="text-sm text-white/75 italic bg-white/5 rounded-xl p-3 border border-white/5 whitespace-pre-wrap">
                    "{provider.message}"
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
              {provider.status !== 'accepted' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(provider.$id, 'accepted')}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600/80 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  <PiCheck className="h-4 w-4" />
                  Accepter
                </button>
              )}
              {provider.status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(provider.$id, 'rejected')}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 hover:border-red-500/50 hover:bg-red-950/20 px-4 py-2 text-xs font-semibold text-white/80 hover:text-red-200 transition disabled:opacity-50"
                >
                  <PiX className="h-4 w-4" />
                  Refuser
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(provider.$id)}
                disabled={isPending}
                className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-red-500/30 hover:border-red-500 hover:bg-red-950/40 text-red-400 hover:text-red-200 transition disabled:opacity-50"
                title="Supprimer la candidature"
              >
                <PiTrash className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}

        {filteredProviders.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 bg-black/35 p-12 text-center text-sm text-white/60">
            Aucune candidature trouvée pour cette catégorie.
          </div>
        )}
      </div>
    </div>
  )
}
