'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react'

import type { events, Ticket } from '@/types'
import { createTicket, deleteTicket, updateTicket } from '@/app/actions/adminTickets'

interface TicketWithEvent extends Ticket {
  eventId: string
  eventName: string
}

interface TicketManagerProps {
  events: events[]
  tickets: TicketWithEvent[]
}

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

const initialForm = {
  eventId: '',
  name: '',
  price: '',
  advantages: '',
  available: true,
}

export default function TicketManager({ events, tickets }: TicketManagerProps) {
  const router = useRouter()
  const [formValues, setFormValues] = useState(() => ({ ...initialForm }))
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleChange = (event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = event.currentTarget
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value

    setFormValues((previous) => ({
      ...previous,
      [target.name]: value,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.eventId || !formValues.name || !formValues.price) {
      setFeedback({ type: 'error', message: "L'événement, le nom et le prix sont obligatoires." })
      return
    }

    const price = Number(formValues.price)

    if (Number.isNaN(price)) {
      setFeedback({ type: 'error', message: 'Le prix doit être un nombre.' })
      return
    }

    const advantages = parseLines(formValues.advantages)

    startTransition(async () => {
      const result = await createTicket({
        event: formValues.eventId,
        name: formValues.name,
        price,
        available: Boolean(formValues.available),
        advantages,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Impossible de créer le ticket.' })
        return
      }

      setFeedback({ type: 'success', message: 'Ticket créé avec succès.' })
      setFormValues({ ...initialForm })
      router.refresh()
    })
  }

  const ticketsByEvent = useMemo(() => {
    return events.map((event) => ({
      event,
      tickets: tickets.filter((ticket) => ticket.eventId === event.$id),
    }))
  }, [events, tickets])

  return (
    <section id="tickets" className="space-y-6 rounded-2xl border border-zinc-800 bg-black/40 p-6">
      <header>
        <h2 className="text-xl font-semibold text-white">Gestion des tickets</h2>
        <p className="text-sm text-zinc-400">Définissez les offres associées à chaque événement.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            <span className="text-xs uppercase tracking-wide text-zinc-500">Événement associé</span>
            <select
              name="eventId"
              value={formValues.eventId}
              onChange={handleChange as (event: FormEvent<HTMLSelectElement>) => void}
              className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-[#E6C55D]"
              required
            >
              <option value="">Sélectionnez un événement</option>
              {events.map((event) => (
                <option key={event.$id} value={event.$id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Nom" name="name" value={formValues.name} onChange={handleChange} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prix" name="price" type="number" value={formValues.price} onChange={handleChange} required />
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="available"
              checked={Boolean(formValues.available)}
              onChange={handleChange as (event: FormEvent<HTMLInputElement>) => void}
              className="h-4 w-4 rounded border border-zinc-700 bg-black text-main focus:ring-main"
            />
            <span>Ticket disponible</span>
          </label>
        </div>
        <Textarea
          label="Avantages"
          name="advantages"
          value={formValues.advantages}
          onChange={handleChange}
          helperText="Un avantage par ligne"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {feedback && <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.message}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md bg-main px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Création...' : 'Ajouter un ticket'}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {ticketsByEvent.map(({ event, tickets }) => (
          <article key={event.$id} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div>
              <h3 className="text-lg font-semibold text-white">{event.name}</h3>
              <p className="text-xs text-zinc-500">{tickets.length} ticket(s)</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {tickets.map((ticket) => (
                <EditableTicketCard key={ticket.$id} ticket={ticket} events={events} />
              ))}

              {tickets.length === 0 && (
                <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
                  Aucun ticket défini pour cet événement.
                </p>
              )}
            </div>
          </article>
        ))}

        {events.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
            Créez un événement avant d&apos;ajouter des tickets.
          </p>
        )}
      </div>
    </section>
  )
}

function EditableTicketCard({ ticket, events }: { ticket: TicketWithEvent; events: events[] }) {
  const router = useRouter()
  const [values, setValues] = useState({
    eventId: ticket.eventId,
    name: ticket.name,
    price: ticket.price.toString(),
    advantages: ticket.advantages.join('\n'),
    available: ticket.available,
  })
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setValues({
      eventId: ticket.eventId,
      name: ticket.name,
      price: ticket.price.toString(),
      advantages: ticket.advantages.join('\n'),
      available: ticket.available,
    })
    setFeedback(null)
  }, [ticket])

  const handleChange = (event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = event.currentTarget
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value

    setValues((previous) => ({
      ...previous,
      [target.name]: value,
    }))
  }

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const price = Number(values.price)

    if (Number.isNaN(price)) {
      setFeedback({ type: 'error', message: 'Le prix doit être un nombre.' })
      return
    }

    const advantages = parseLines(values.advantages)

    startTransition(async () => {
      const result = await updateTicket(ticket.$id, {
        event: values.eventId,
        name: values.name,
        price,
        available: Boolean(values.available),
        advantages,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'La mise à jour a échoué.' })
        return
      }

      setFeedback({ type: 'success', message: 'Ticket mis à jour.' })
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!window.confirm('Voulez-vous supprimer ce ticket ?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteTicket(ticket.$id)

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Suppression impossible.' })
        return
      }

      setFeedback({ type: 'success', message: 'Ticket supprimé.' })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-black/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-white">{ticket.name}</h4>
          <p className="text-xs text-zinc-500">ID : {ticket.$id}</p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>

      <form onSubmit={handleUpdate} className="grid gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Événement associé</span>
          <select
            name="eventId"
            value={values.eventId}
            onChange={handleChange as (event: FormEvent<HTMLSelectElement>) => void}
            className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-[#E6C55D]"
          >
            {events.map((event) => (
              <option key={event.$id} value={event.$id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Nom" name="name" value={values.name} onChange={handleChange} required />
        <Field label="Prix" name="price" type="number" value={values.price} onChange={handleChange} required />
        <Textarea
          label="Avantages"
          name="advantages"
          value={values.advantages}
          onChange={handleChange}
        />
        <label className="flex items-center gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            name="available"
            checked={Boolean(values.available)}
            onChange={handleChange as (event: FormEvent<HTMLInputElement>) => void}
            className="h-4 w-4 rounded border border-zinc-700 bg-black text-main focus:ring-main"
          />
          <span>Ticket disponible</span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {feedback && <p className={`text-xs ${feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.message}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-[#E6C55D] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
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

function Field({ label, name, value, onChange, type = 'text', required }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-zinc-300">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        type={type}
        className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-[#E6C55D]"
      />
    </label>
  )
}

interface TextareaProps {
  label: string
  name: string
  value: string
  helperText?: string
  onChange: (event: FormEvent<HTMLTextAreaElement>) => void
}

function Textarea({ label, name, value, onChange, helperText }: TextareaProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-zinc-300">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-[#E6C55D]"
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
