'use client'

import { useRouter } from 'next/navigation'
import React, { FormEvent, useEffect, useMemo, useState, useTransition } from 'react'

import type { events } from '@/types'
import { deleteEvent, updateEvent, uploadEventImage } from '@/app/actions/adminEvents'
import Modal from '@/components/ui/Modal'
import EventForm, { type FeedbackState } from '@/components/admin/EventForm'
import CreateEventButton from '@/components/admin/CreateEventButton'
import { formatEventDateTime } from '@/utils/eventDate'

interface EventManagerProps {
  events: events[]
}

export default function EventManager({ events }: EventManagerProps) {
  const [banner, setBanner] = useState<FeedbackState | null>(null)

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events]
  )

  const handleActionFeedback = (value: FeedbackState) => {
    setBanner(value)
  }

  return (
    <section
      id="events"
      className="space-y-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.9),rgba(5,5,5,0.78))] p-6 shadow-[0_40px_90px_-60px_rgba(0,0,0,0.85)]"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Back-office contenu</p>
          <h2 className="font-heading text-2xl text-white">Gestion des événements</h2>
          <p className="text-sm text-white/60">Créez, mettez à jour ou supprimez les événements du site.</p>
        </div>
        <CreateEventButton />
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

      <div className="space-y-4">
        {sortedEvents.map((event) => (
          <EditableEventCard key={event.$id} event={event} onActionFeedback={handleActionFeedback} />
        ))}

        {sortedEvents.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
            Aucun événement n’est enregistré pour le moment.
          </p>
        )}
      </div>
    </section>
  )
}

function EditableEventCard({ event, onActionFeedback }: { event: events; onActionFeedback: (feedback: FeedbackState) => void }) {
  const router = useRouter()
  const [values, setValues] = useState({
    name: event.name,
    descriptionEn:
      event.description_sections_en?.join('\n\n') ||
      event.description_sections?.join('\n\n') ||
      event.description ||
      '',
    descriptionFr: event.description_sections_fr?.join('\n\n') || '',
    date: formatDateInput(event.date),
    adresse: event.adresse,
    image: event.image,
    teaser: event.teaser,
  })
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    setValues({
      name: event.name,
      descriptionEn:
        event.description_sections_en?.join('\n\n') ||
        event.description_sections?.join('\n\n') ||
        event.description ||
        '',
      descriptionFr: event.description_sections_fr?.join('\n\n') || '',
      date: formatDateInput(event.date),
      adresse: event.adresse,
      image: event.image,
      teaser: event.teaser,
    })
    setFeedback(null)
    setSelectedFile(null)
  }, [event])

  const openModal = () => {
    setFeedback(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isPending) {
      return
    }
    setIsModalOpen(false)
  }

  const handleChange = (formEvent: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = formEvent.currentTarget as HTMLInputElement | HTMLTextAreaElement
    setValues((previous) => ({ ...previous, [target.name]: target.value }))
  }

  const handleUpdate = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()

    startTransition(async () => {
      let imageUrl = values.image

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const uploadResult = await uploadEventImage(formData)
        if (!uploadResult.success || !uploadResult.url) {
          setFeedback({ type: 'error', message: uploadResult.error ?? "Échec du téléversement de l'image." })
          return
        }
        imageUrl = uploadResult.url
      }

      const sectionsEn = values.descriptionEn
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
      const sectionsFr = values.descriptionFr
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)

      const result = await updateEvent(event.$id, {
        name: values.name,
        description: values.descriptionEn,
        date: values.date,
        adresse: values.adresse,
        image: imageUrl,
        teaser: values.teaser,
        description_sections: sectionsEn,
        description_sections_en: sectionsEn,
        description_sections_fr: sectionsFr,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'La mise à jour a échoué.' })
        return
      }

      setFeedback(null)
      setSelectedFile(null)
      setIsModalOpen(false)
      onActionFeedback({ type: 'success', message: 'Événement mis à jour.' })
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteEvent(event.$id)

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Suppression impossible.' })
        return
      }

      setFeedback(null)
      onActionFeedback({ type: 'success', message: 'Événement supprimé.' })
      router.refresh()
    })
  }

  return (
    <article className="space-y-4 rounded-3xl border border-white/10 bg-black/35 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h3 className="font-heading text-xl text-white">{event.name}</h3>
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">{formatEventDateTime(event.date, 'fr-FR')}</p>
          {event.teaser && <p className="text-sm text-white/60">{event.teaser}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full border border-red-500/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid gap-3 text-sm text-white/60 sm:grid-cols-2">
        <InfoRow label="Date" value={formatEventDateTime(event.date, 'fr-FR')} />
        {event.adresse && <InfoRow label="Adresse" value={event.adresse} />}
        {event.image && <InfoRow label="Visuel" value={event.image} isLink />}
        {event.description && <InfoRow label="Description" value={event.description} full />}
      </div>

      {((event.description_sections_en && event.description_sections_en.length > 0) ||
        (event.description_sections_fr && event.description_sections_fr.length > 0) ||
        (event.description_sections && event.description_sections.length > 0)) && (
        <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
          {event.description_sections_en && event.description_sections_en.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Description (EN)</p>
              {event.description_sections_en.map((section, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70 whitespace-pre-wrap break-words"
                >
                  {section}
                </div>
              ))}
            </div>
          )}
          {event.description_sections_fr && event.description_sections_fr.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Description (FR)</p>
              {event.description_sections_fr.map((section, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70 whitespace-pre-wrap break-words"
                >
                  {section}
                </div>
              ))}
            </div>
          )}
          {!event.description_sections_en?.length && !event.description_sections_fr?.length &&
            event.description_sections && event.description_sections.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
                Sections de description (ancien format, à répartir EN/FR)
              </p>
              {event.description_sections.map((section, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70 whitespace-pre-wrap break-words"
                >
                  {section}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {feedback && !isModalOpen && feedback.type === 'error' && (
        <p className="text-xs text-red-400">{feedback.message}</p>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Modifier l’événement"
        description="Actualisez les informations de l’expérience pour synchroniser la vitrine et les ventes."
      >
        <EventForm
          values={values}
          onChange={handleChange}
          onSubmit={handleUpdate}
          onCancel={closeModal}
          isPending={isPending}
          feedback={feedback}
          submitLabel="Enregistrer les modifications"
          pendingLabel="Enregistrement..."
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      </Modal>
    </article>
  )
}

interface InfoRowProps {
  label: string
  value: string
  isLink?: boolean
  full?: boolean
}

function InfoRow({ label, value, isLink, full }: InfoRowProps) {
  return (
    <div className={`flex flex-col gap-1 text-white/60 min-w-0 w-full ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/45">{label}</span>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-main underline decoration-dotted underline-offset-4 break-all block w-full">
          {value}
        </a>
      ) : (
        <span className="text-sm text-white/70 whitespace-pre-wrap break-words block w-full">{value}</span>
      )}
    </div>
  )
}

function formatDateInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const offset = date.getTimezoneOffset()
  const corrected = new Date(date.getTime() - offset * 60 * 1000)
  return corrected.toISOString().slice(0, 16)
}



