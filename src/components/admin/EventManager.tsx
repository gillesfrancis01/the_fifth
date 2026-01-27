'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react'

import type { events } from '@/types'
import { createEvent, deleteEvent, updateEvent } from '@/app/actions/adminEvents'
import Modal from '@/components/ui/Modal'

interface EventManagerProps {
  events: events[]
}

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

const emptyForm = {
  name: '',
  description: '',
  date: '',
  adresse: '',
  image: '',
  teaser: '',
  descriptionSections: '',
}

export default function EventManager({ events }: EventManagerProps) {
  const router = useRouter()
  const [formValues, setFormValues] = useState(() => ({ ...emptyForm }))
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [banner, setBanner] = useState<FeedbackState | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!banner) {
      return
    }

    const timeout = window.setTimeout(() => setBanner(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const openCreateModal = () => {
    setFormValues({ ...emptyForm })
    setFeedback(null)
    setIsModalOpen(true)
  }

  const closeCreateModal = () => {
    if (isPending) {
      return
    }
    setIsModalOpen(false)
  }

  const handleChange = (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement
    setFormValues((previous) => ({ ...previous, [target.name]: target.value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const sections = parseLines(formValues.descriptionSections)

    if (!formValues.name || !formValues.date) {
      setFeedback({ type: 'error', message: 'Le nom et la date sont obligatoires.' })
      return
    }

    startTransition(async () => {
      const result = await createEvent({
        name: formValues.name,
        description: formValues.description,
        date: formValues.date,
        adresse: formValues.adresse,
        image: formValues.image,
        teaser: formValues.teaser,
        description_sections: sections,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? "Une erreur est survenue." })
        return
      }

      setFormValues({ ...emptyForm })
      setFeedback(null)
      setIsModalOpen(false)
      setBanner({ type: 'success', message: 'Événement créé avec succès.' })
      router.refresh()
    })
  }

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
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
        >
          Nouvel événement
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

      <Modal
        open={isModalOpen}
        onClose={closeCreateModal}
        title="Nouvel événement signature"
        description="Déployez un nouveau rendez-vous : renseignez les informations clés avant de l’ouvrir aux invités."
      >
        <EventForm
          values={formValues}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeCreateModal}
          isPending={isPending}
          feedback={feedback}
          submitLabel="Créer l’événement"
          pendingLabel="Création..."
        />
      </Modal>

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
    description: event.description,
    date: formatDateInput(event.date),
    adresse: event.adresse,
    image: event.image,
    teaser: event.teaser,
    descriptionSections: event.description_sections.join('\n'),
  })
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setValues({
      name: event.name,
      description: event.description,
      date: formatDateInput(event.date),
      adresse: event.adresse,
      image: event.image,
      teaser: event.teaser,
      descriptionSections: event.description_sections.join('\n'),
    })
    setFeedback(null)
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
      const sections = parseLines(values.descriptionSections)
      const result = await updateEvent(event.$id, {
        name: values.name,
        description: values.description,
        date: values.date,
        adresse: values.adresse,
        image: values.image,
        teaser: values.teaser,
        description_sections: sections,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'La mise à jour a échoué.' })
        return
      }

      setFeedback(null)
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
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">{formatEventDisplayDate(event.date)}</p>
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
        <InfoRow label="Date" value={formatEventDisplayDate(event.date)} />
        {event.adresse && <InfoRow label="Adresse" value={event.adresse} />}
        {event.image && <InfoRow label="Visuel" value={event.image} isLink />}
        {event.description && <InfoRow label="Description" value={event.description} full />}
      </div>

      {event.description_sections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {event.description_sections.map((section) => (
            <span key={section} className="rounded-2xl border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/55 whitespace-pre-wrap break-words max-w-full">
              {section}
            </span>
          ))}
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
    <p className={`flex flex-col gap-1 text-white/60 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/45">{label}</span>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-main underline decoration-dotted underline-offset-4 break-all">
          {value}
        </a>
      ) : (
        <span className="text-sm text-white/70 whitespace-pre-wrap break-words">{value}</span>
      )}
    </p>
  )
}

interface EventFormProps {
  values: typeof emptyForm
  onChange: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  isPending: boolean
  feedback: FeedbackState | null
  submitLabel: string
  pendingLabel: string
}

function EventForm({ values, onChange, onSubmit, onCancel, isPending, feedback, submitLabel, pendingLabel }: EventFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" name="name" value={values.name} onChange={onChange} required />
        <Field label="Date" name="date" type="datetime-local" value={values.date} onChange={onChange} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Adresse" name="adresse" value={values.adresse} onChange={onChange} />
        <Field label="Image (URL)" name="image" value={values.image} onChange={onChange} />
      </div>
      <Field label="Teaser" name="teaser" value={values.teaser} onChange={onChange} />
      <Textarea label="Description" name="description" value={values.description} onChange={onChange} rows={3} />
      <Textarea
        label="Sections de description"
        name="descriptionSections"
        value={values.descriptionSections}
        onChange={onChange}
        rows={4}
        helperText="Une section par ligne"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {feedback && (
          <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>{feedback.message}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

interface FieldProps {
  label: string
  name: string
  value: string
  type?: string
  required?: boolean
  onChange: (event: FormEvent<HTMLInputElement>) => void
}

function Field({ label, name, value, onChange, required, type = 'text' }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</span>
      <input
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        type={type}
      />
    </label>
  )
}

interface TextareaProps {
  label: string
  name: string
  value: string
  rows?: number
  helperText?: string
  onChange: (event: FormEvent<HTMLTextAreaElement>) => void
}

function Textarea({ label, name, value, onChange, rows = 4, helperText }: TextareaProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</span>
      <textarea
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
      />
      {helperText && <span className="text-xs text-white/45">{helperText}</span>}
    </label>
  )
}

function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
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

function formatEventDisplayDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Date non définie'
  }
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)
}

