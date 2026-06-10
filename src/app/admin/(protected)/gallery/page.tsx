import React from 'react'
import GalleryManager from '@/components/admin/GalleryManager'
import getGallery from '@/app/actions/getGallery'
import { fetchEvents } from '../loaders'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  const [galleries, events] = await Promise.all([
    getGallery(),
    fetchEvents(),
  ])

  const totalImages = galleries.reduce((sum, gallery) => sum + (gallery.images?.length || 0), 0)
  const galleriesWithVideo = galleries.filter(g => g.video).length

  return (
    <div className="space-y-10">
      {/* Header section consistent with events page design */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.12),transparent_70%)] w-[70vw]" />
        <div className="relative grid gap-8 xl:grid-cols-[2fr_1.2fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-black/50 px-4 py-1 text-[11px] uppercase tracking-[0.4em] text-white/70">
              Vitrine & Souvenirs
            </span>
            <h1 className="font-heading text-4xl text-main">Galerie Signature</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Gérez les photos et vidéos des soirées passées. Les images publiées ici sont directement synchronisées avec la page galerie publique pour inspirer vos futurs VIP.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <HighlightCard
                title="Total Galeries"
                value={galleries.length.toString()}
                helper={`${galleriesWithVideo} avec vidéo highlight`}
              />
              <HighlightCard
                title="Total Photos En Ligne"
                value={totalImages.toString()}
                helper="Hébergées dans le bucket d'événements"
              />
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/15 bg-black/55 p-6 text-sm text-white/70">
              <h2 className="font-heading text-2xl text-white">Consignes d'édition</h2>
              <ul className="mt-4 space-y-3 text-xs uppercase tracking-[0.25em] text-white/55 list-disc pl-4">
                <li>Privilégiez les images de haute qualité (formats standards acceptés).</li>
                <li>Les vidéos YouTube doivent être au format d'URL standard ou partagé.</li>
                <li>Réordonnez les images en utilisant les flèches directionnelles sur les miniatures.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main interactive gallery manager */}
      <GalleryManager galleries={galleries} events={events} />
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
