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
    <section id="events" className="space-y-6 rounded-2xl border border-zinc-800 bg-black/40 p-6">
      <header>
        <h2 className="text-xl font-semibold text-white">Gestion des événements</h2>
        <p className="text-sm text-zinc-400">Créez, mettez à jour ou supprimez les événements du site.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
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
          {feedback && <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.message}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md bg-main px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
          <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
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
    <article className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.name}</h3>
          <p className="text-xs text-zinc-500">ID : {event.$id}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Supprimer
          </button>
        </div>
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
          {feedback && <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.message}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-[#E6C55D] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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
    <label className="flex flex-col gap-1 text-sm text-zinc-300">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-[#E6C55D]"
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
    <label className="flex flex-col gap-1 text-sm text-zinc-300">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <textarea
        className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-[#E6C55D]"
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
      />
      {helperText && <span className="text-xs text-zinc-500">{helperText}</span>}
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
