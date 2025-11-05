'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react'

import type { events } from '@/types'
import { createEvent, deleteEvent, updateEvent } from '@/app/actions/adminEvents'

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
  const [isPending, startTransition] = useTransition()

  const resetForm = () => {
    setFormValues({ ...emptyForm })
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

      setFeedback({ type: 'success', message: 'Événement créé avec succès.' })
      resetForm()
      router.refresh()
    })
  }

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events]
  )

  return (
    <section
      id="events"
      className="space-y-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.9),rgba(5,5,5,0.78))] p-6 shadow-[0_40px_90px_-60px_rgba(0,0,0,0.85)]"
    >
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Back-office contenu</p>
        <h2 className="font-heading text-2xl text-white">Gestion des événements</h2>
        <p className="text-sm text-white/60">Créez, mettez à jour ou supprimez les événements du site.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-white/10 bg-black/35 p-5 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.8)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" name="name" value={formValues.name} onChange={handleChange} required />
          <Field label="Date" name="date" type="datetime-local" value={formValues.date} onChange={handleChange} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse" name="adresse" value={formValues.adresse} onChange={handleChange} />
          <Field label="Image (URL)" name="image" value={formValues.image} onChange={handleChange} />
        </div>
        <Field label="Teaser" name="teaser" value={formValues.teaser} onChange={handleChange} />
        <Textarea label="Description" name="description" value={formValues.description} onChange={handleChange} rows={3} />
        <Textarea
          label="Sections de description"
          name="descriptionSections"
          value={formValues.descriptionSections}
          onChange={handleChange}
          rows={4}
          helperText="Une section par ligne"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {feedback && (
            <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>{feedback.message}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Création...' : 'Ajouter un événement'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {sortedEvents.map((event) => (
          <EditableEventCard key={event.$id} event={event} />
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

function EditableEventCard({ event }: { event: events }) {
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

      setFeedback({ type: 'success', message: 'Événement mis à jour.' })
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

      setFeedback({ type: 'success', message: 'Événement supprimé.' })
      router.refresh()
    })
  }

  return (
    <article className="space-y-4 rounded-3xl border border-white/10 bg-black/35 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-xl text-white">{event.name}</h3>
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">ID : {event.$id}</p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full border border-red-500/60 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>

      <form onSubmit={handleUpdate} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" name="name" value={values.name} onChange={handleChange} required />
          <Field label="Date" name="date" type="datetime-local" value={values.date} onChange={handleChange} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse" name="adresse" value={values.adresse} onChange={handleChange} />
          <Field label="Image (URL)" name="image" value={values.image} onChange={handleChange} />
        </div>
        <Field label="Teaser" name="teaser" value={values.teaser} onChange={handleChange} />
        <Textarea label="Description" name="description" value={values.description} onChange={handleChange} rows={3} />
        <Textarea
          label="Sections de description"
          name="descriptionSections"
          value={values.descriptionSections}
          onChange={handleChange}
          rows={4}
          helperText="Une section par ligne"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {feedback && (
            <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>{feedback.message}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </article>
  )
}

interface FieldProps {
  label: string
  name: string
  type?: string
  value: string
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
