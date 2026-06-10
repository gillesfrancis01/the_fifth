'use client'

import { useRouter } from 'next/navigation'
import React, { FormEvent, ChangeEvent, useEffect, useState, useTransition } from 'react'
import type { Gallery, events as Event } from '@/types'
import { createGallery, updateGallery, deleteGallery, uploadGalleryImage } from '@/app/actions/adminGallery'
import Modal from '@/components/ui/Modal'
import { PiTrash, PiPlus, PiArrowLeft, PiArrowRight, PiYoutubeLogo, PiImage, PiSpinner } from 'react-icons/pi'

interface GalleryManagerProps {
  galleries: Gallery[]
  events: Event[]
}

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

const transformImageURL = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) {
    return url
  }
  const endpoint = process.env.NEXT_PUBLIC_ENDPOINT
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKETS_EVENT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT

  if (endpoint && bucketId && projectId) {
    return `${endpoint}/storage/buckets/${bucketId}/files/${url}/view?project=${projectId}&mode=admin`
  }

  return url
}

export default function GalleryManager({ galleries, events }: GalleryManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)
  
  // Form state
  const [eventName, setEventName] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [isCustomEvent, setIsCustomEvent] = useState(false)
  const [videoLink, setVideoLink] = useState('')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  
  // UI upload states
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([])
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [banner, setBanner] = useState<FeedbackState | null>(null)

  useEffect(() => {
    if (!banner) return
    const timeout = window.setTimeout(() => setBanner(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const openCreateModal = () => {
    setEditingGallery(null)
    setEventName('')
    setSelectedEventId(events[0]?.$id || '')
    setIsCustomEvent(events.length === 0)
    setVideoLink('')
    setGalleryImages([])
    setUploadingFiles([])
    setFeedback(null)
    setIsModalOpen(true)
  }

  const openEditModal = (gallery: Gallery) => {
    setEditingGallery(gallery)
    setVideoLink(gallery.video || '')
    setGalleryImages([...gallery.images])
    setUploadingFiles([])
    setFeedback(null)

    // Check if the event name matches one of the existing events
    const matchedEvent = events.find(e => e.name === gallery.event)
    if (matchedEvent) {
      setSelectedEventId(matchedEvent.$id)
      setEventName(matchedEvent.name)
      setIsCustomEvent(false)
    } else {
      setSelectedEventId('custom')
      setEventName(gallery.event)
      setIsCustomEvent(true)
    }
    
    setIsModalOpen(true)
  }

  const handleEventSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedEventId(val)
    if (val === 'custom') {
      setIsCustomEvent(true)
      setEventName('')
    } else {
      setIsCustomEvent(false)
      const matched = events.find(evt => evt.$id === val)
      if (matched) {
        setEventName(matched.name)
      }
    }
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Add files to uploading state
    const newUploads = files.map(f => ({ name: f.name, progress: 0 }))
    setUploadingFiles(prev => [...prev, ...newUploads])

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const result = await uploadGalleryImage(formData)
        if (result.success && result.url) {
          setGalleryImages(prev => [...prev, result.url!])
        } else {
          setFeedback({ type: 'error', message: result.error || `Erreur d'upload pour ${file.name}` })
        }
      } catch (err) {
        console.error(err)
        setFeedback({ type: 'error', message: `Erreur d'upload pour ${file.name}` })
      } finally {
        setUploadingFiles(prev => prev.filter(u => u.name !== file.name))
      }
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setGalleryImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return
    if (direction === 'right' && index === galleryImages.length - 1) return

    const targetIndex = direction === 'left' ? index - 1 : index + 1
    const updated = [...galleryImages]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setGalleryImages(updated)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const finalEventName = isCustomEvent ? eventName.trim() : (events.find(evt => evt.$id === selectedEventId)?.name || eventName.trim())
    
    if (!finalEventName) {
      setFeedback({ type: 'error', message: "Le nom de l'événement est obligatoire." })
      return
    }

    if (galleryImages.length === 0) {
      setFeedback({ type: 'error', message: "Veuillez téléverser au moins une image pour la galerie." })
      return
    }

    startTransition(async () => {
      const payload = {
        event: finalEventName,
        video: videoLink.trim() || null,
        images: galleryImages,
      }

      let result
      if (editingGallery) {
        result = await updateGallery(editingGallery.$id, payload)
      } else {
        result = await createGallery(payload)
      }

      if (result.success) {
        setBanner({ 
          type: 'success', 
          message: editingGallery ? 'Galerie mise à jour avec succès.' : 'Galerie créée avec succès.' 
        })
        setIsModalOpen(false)
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: result.error || 'Une erreur est survenue lors de l\'enregistrement.' })
      }
    })
  }

  const handleDelete = (galleryId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette galerie ?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteGallery(galleryId)
      if (result.success) {
        setBanner({ type: 'success', message: 'Galerie supprimée avec succès.' })
        router.refresh()
      } else {
        setBanner({ type: 'error', message: result.error || 'Impossible de supprimer la galerie.' })
      }
    })
  }

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.9),rgba(5,5,5,0.78))] p-6 shadow-[0_40px_90px_-60px_rgba(0,0,0,0.85)]">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Back-office galerie</p>
          <h2 className="font-heading text-2xl text-white">Gestion de la Galerie</h2>
          <p className="text-sm text-white/60">Ajoutez des photos et vidéos pour immortaliser vos plus beaux événements.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
        >
          <PiPlus className="h-4 w-4 text-main" />
          Nouvelle Galerie
        </button>
      </header>

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

      {/* List of galleries */}
      <div className="space-y-4">
        {galleries.map((gallery) => (
          <article key={gallery.$id} className="space-y-4 rounded-3xl border border-white/10 bg-black/35 p-5 transition hover:border-white/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h3 className="font-heading text-xl text-white">{gallery.event}</h3>
                <div className="flex flex-wrap gap-4 text-xs text-white/45 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <PiImage className="h-4 w-4 text-main" />
                    {gallery.images?.length || 0} photo{(gallery.images?.length || 0) > 1 ? 's' : ''}
                  </span>
                  {gallery.video && (
                    <span className="flex items-center gap-1 text-red-400">
                      <PiYoutubeLogo className="h-4 w-4" />
                      Vidéo incluse
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openEditModal(gallery)}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(gallery.$id)}
                  disabled={isPending}
                  className="inline-flex items-center justify-center rounded-full border border-red-500/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Supprimer
                </button>
              </div>
            </div>

            {/* Thumbnail Preview */}
            {gallery.images && gallery.images.length > 0 && (
              <div className="flex flex-wrap gap-2 overflow-x-auto py-2">
                {gallery.images.slice(0, 8).map((img, idx) => (
                  <div key={idx} className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-neutral-900">
                    <img
                      src={transformImageURL(img)}
                      alt={`Preview ${idx}`}
                      className="h-full w-full object-cover"
                    />
                    {idx === 7 && gallery.images.length > 8 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-bold text-white">
                        +{gallery.images.length - 8}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}

        {galleries.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-8 text-center text-sm text-white/60">
            Aucune galerie n’est enregistrée pour le moment. Commencez par en créer une ci-dessus.
          </p>
        )}
      </div>

      {/* Edit / Create Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGallery ? "Modifier la Galerie" : "Nouvelle Galerie"}
        description="Associez un événement, téléversez des images dans le bucket et ajoutez éventuellement un lien de vidéo YouTube."
      >
        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Event Choice */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Événement Associé</span>
              <select
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
                value={selectedEventId}
                onChange={handleEventSelectChange}
              >
                {events.map((evt) => (
                  <option key={evt.$id} value={evt.$id} className="bg-neutral-950">
                    {evt.name}
                  </option>
                ))}
                <option value="custom" className="bg-neutral-950">-- Autre événement --</option>
              </select>
            </label>

            {isCustomEvent && (
              <label className="flex flex-col gap-2 text-sm text-white/80">
                <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Nom de l'événement personnalisé</span>
                <input
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
                  type="text"
                  placeholder="Ex: Soirée de gala privée"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />
              </label>
            )}
          </div>

          {/* Video Link */}
          <label className="flex flex-col gap-2 text-sm text-white/80">
            <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Lien Vidéo Highlight (YouTube Optionnel)</span>
            <input
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              type="url"
              placeholder="Ex: https://www.youtube.com/watch?v=..."
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
            />
          </label>

          {/* Upload Zone */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Téléverser des images</span>
            <label className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/40 p-6 transition hover:border-[rgba(201,161,77,0.55)] cursor-pointer">
              <PiImage className="h-8 w-8 text-main/80 mb-2" />
              <span className="text-xs text-white/60">Cliquez pour sélectionner des photos</span>
              <span className="text-[10px] text-white/40 mt-1">Les images sont téléversées directement vers le bucket Appwrite</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploading Statuses */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-2 border border-white/10 rounded-xl p-3 bg-white/5">
              <p className="text-[10px] uppercase tracking-wider text-main flex items-center gap-2">
                <PiSpinner className="animate-spin h-3 w-3" />
                Téléversement en cours...
              </p>
              <div className="text-xs space-y-1">
                {uploadingFiles.map((uf, idx) => (
                  <div key={idx} className="text-white/60 flex justify-between">
                    <span className="truncate max-w-[250px]">{uf.name}</span>
                    <span>Envoi...</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Images List & Reordering */}
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                Photos dans la galerie ({galleryImages.length})
              </span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="group relative aspect-[3/2] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow">
                    <img
                      src={transformImageURL(img)}
                      alt={`Gallery thumbnail ${idx}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    
                    {/* Controls overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="rounded-lg bg-red-600/80 p-1.5 text-white hover:bg-red-500 transition"
                          title="Supprimer"
                        >
                          <PiTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center bg-black/60 rounded px-1 py-0.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'left')}
                          disabled={idx === 0}
                          className="text-white disabled:text-white/20 hover:text-main"
                        >
                          <PiArrowLeft className="h-4.5 w-4.5" />
                        </button>
                        <span className="text-white/70 font-semibold">{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'right')}
                          disabled={idx === galleryImages.length - 1}
                          className="text-white disabled:text-white/20 hover:text-main"
                        >
                          <PiArrowRight className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback && (
            <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>
              {feedback.message}
            </p>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 transition hover:border-white/25 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || uploadingFiles.length > 0}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Enregistrement...' : (editingGallery ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
