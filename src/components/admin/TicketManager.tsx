'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react'

import Modal from '@/components/ui/Modal'
import type { events } from '@/types'
import type { TicketWithEvent } from '@/types/admin-dashboard'
import { createTicket, deleteTicket, updateTicket } from '@/app/actions/adminTickets'

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
  quantity: '',
  advantages: '',
  available: true,
}

export default function TicketManager({ events, tickets }: TicketManagerProps) {
  const router = useRouter()
  const [formValues, setFormValues] = useState(() => ({ ...initialForm }))
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

  const openCreateModal = (eventId = '') => {
    setFormValues({ ...initialForm, eventId })
    setFeedback(null)
    setIsModalOpen(true)
  }

  const closeCreateModal = () => {
    if (isPending) {
      return
    }
    setIsModalOpen(false)
  }

  const handleChange = (
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value

    setFormValues((previous) => ({
      ...previous,
      [target.name]: value,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.eventId || !formValues.name || !formValues.price || !formValues.quantity) {
      setFeedback({ type: 'error', message: "L'événement, le nom, le prix et la quantité sont obligatoires." })
      return
    }

    const price = Number(formValues.price)
    const quantity = Number(formValues.quantity)

    if (Number.isNaN(price) || Number.isNaN(quantity)) {
      setFeedback({ type: 'error', message: 'Le prix et la quantité doivent être des nombres.' })
      return
    }

    if (quantity < 0) {
      setFeedback({ type: 'error', message: 'La quantité doit être positive.' })
      return
    }

    const advantages = parseLines(formValues.advantages)

    startTransition(async () => {
      const result = await createTicket({
        event: formValues.eventId,
        name: formValues.name,
        price,
        quantity,
        available: Boolean(formValues.available),
        advantages,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Impossible de créer le ticket.' })
        return
      }

      setFormValues({ ...initialForm })
      setFeedback(null)
      setIsModalOpen(false)
      setBanner({ type: 'success', message: 'Ticket créé avec succès.' })
      router.refresh()
    })
  }

  const ticketsByEvent = useMemo(() => {
    return events.map((event) => ({
      event,
      tickets: tickets.filter((ticket) => ticket.eventId === event.$id),
    }))
  }, [events, tickets])

  const handleActionFeedback = (value: FeedbackState) => {
    setBanner(value)
  }

  return (
    <section id="tickets" className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Inventaire luxe</p>
          <h2 className="font-heading text-2xl text-white">Gestion des tickets</h2>
          <p className="text-sm text-white/60">Définissez les offres associées à chaque événement.</p>
        </div>
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
        >
          Ajouter un ticket
        </button>
      </header>

      {banner && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            banner.type === 'success'
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
        title="Nouveau ticket premium"
        description="Paramétrez la gamme, le tarif et les avantages pour enrichir l’expérience client."
      >
        <TicketForm
          events={events}
          values={formValues}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeCreateModal}
          isPending={isPending}
          feedback={feedback}
          submitLabel="Créer le ticket"
          pendingLabel="Création..."
        />
      </Modal>

      <div className="space-y-6">
        {ticketsByEvent.map(({ event, tickets }) => (
          <article
            key={event.$id}
            className="space-y-5 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,15,15,0.92),rgba(6,6,6,0.82))] p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <h3 className="font-heading text-xl text-white">{event.name}</h3>
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">{formatEventDisplayDate(event.date)}</p>
                {event.adresse && <p className="text-sm text-white/55">{event.adresse}</p>}
              </div>
              <button
                type="button"
                onClick={() => openCreateModal(event.$id)}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] text-white/75 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
              >
                Ajouter pour cet événement
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {tickets.map((ticket) => (
                <EditableTicketCard
                  key={ticket.$id}
                  ticket={ticket}
                  events={events}
                  onActionFeedback={handleActionFeedback}
                />
              ))}

              {tickets.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/55">
                  Aucun ticket défini pour cet événement.
                </p>
              )}
            </div>
          </article>
        ))}

        {events.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
            Créez un événement avant d&apos;ajouter des tickets.
          </p>
        )}
      </div>
    </section>
  )
}

function EditableTicketCard({
  ticket,
  events,
  onActionFeedback,
}: {
  ticket: TicketWithEvent
  events: events[]
  onActionFeedback: (feedback: FeedbackState) => void
}) {
  const router = useRouter()
  const [values, setValues] = useState({
    eventId: ticket.eventId,
    name: ticket.name,
    price: ticket.price.toString(),
    quantity: ticket.quantity.toString(),
    advantages: ticket.advantages.join('\n'),
    available: ticket.available,
  })
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setValues({
      eventId: ticket.eventId,
      name: ticket.name,
      price: ticket.price.toString(),
      quantity: ticket.quantity.toString(),
      advantages: ticket.advantages.join('\n'),
      available: ticket.available,
    })
    setFeedback(null)
  }, [ticket])

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

  const handleChange = (
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value

    setValues((previous) => ({
      ...previous,
      [target.name]: value,
    }))
  }

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const price = Number(values.price)
    const quantity = Number(values.quantity)

    if (Number.isNaN(price) || Number.isNaN(quantity)) {
      setFeedback({ type: 'error', message: 'Le prix et la quantité doivent être des nombres.' })
      return
    }

    if (quantity < 0) {
      setFeedback({ type: 'error', message: 'La quantité doit être positive.' })
      return
    }

    const advantages = parseLines(values.advantages)

    startTransition(async () => {
      const result = await updateTicket(ticket.$id, {
        event: values.eventId,
        name: values.name,
        price,
        quantity,
        available: Boolean(values.available),
        advantages,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'La mise à jour a échoué.' })
        return
      }

      setFeedback(null)
      setIsModalOpen(false)
      onActionFeedback({ type: 'success', message: 'Ticket mis à jour.' })
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

      setFeedback(null)
      onActionFeedback({ type: 'success', message: 'Ticket supprimé.' })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/12 bg-black/35 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h4 className="text-lg font-semibold text-white">{ticket.name}</h4>
          <p className="text-sm text-main">{formatCurrency(ticket.price)}</p>
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">
            {ticket.available && ticket.remaining > 0 ? 'Disponible' : 'Complet'} · {ticket.eventName}
          </p>
          <p className="text-xs text-white/55">
            {ticket.sold} vendus · {ticket.remaining} restants / {ticket.quantity} au total
          </p>
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

      {ticket.advantages.length > 0 && (
        <ul className="space-y-2 text-sm text-white/70">
          {ticket.advantages.map((advantage) => (
            <li key={advantage} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-main" />
              <span>{advantage}</span>
            </li>
          ))}
        </ul>
      )}

      {feedback && !isModalOpen && feedback.type === 'error' && (
        <p className="text-xs text-red-400">{feedback.message}</p>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Modifier le ticket"
        description="Ajustez le positionnement tarifaire et les avantages proposés."
      >
        <TicketForm
          events={events}
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
    </div>
  )
}

interface TicketFormProps {
  events: events[]
  values: typeof initialForm
  onChange: (
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  isPending: boolean
  feedback: FeedbackState | null
  submitLabel: string
  pendingLabel: string
}

function TicketForm({
  events,
  values,
  onChange,
  onSubmit,
  onCancel,
  isPending,
  feedback,
  submitLabel,
  pendingLabel,
}: TicketFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-white/80">
          <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Événement associé</span>
          <select
            name="eventId"
            value={values.eventId}
            onChange={onChange as (event: FormEvent<HTMLSelectElement>) => void}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
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
        <Field label="Nom" name="name" value={values.name} onChange={onChange} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Prix" name="price" type="number" value={values.price} onChange={onChange} required min={0} />
        <Field
          label="Quantité totale"
          name="quantity"
          type="number"
          value={values.quantity}
          onChange={onChange}
          required
          min={0}
        />
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            name="available"
            checked={Boolean(values.available)}
            onChange={onChange as (event: FormEvent<HTMLInputElement>) => void}
            className="h-4 w-4 rounded border border-white/20 bg-black text-main focus:ring-main"
          />
          <span>Ticket disponible</span>
        </label>
      </div>
      <Textarea
        label="Avantages"
        name="advantages"
        value={values.advantages}
        onChange={onChange}
        helperText="Un avantage par ligne"
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
  min?: number
  onChange: (event: FormEvent<HTMLInputElement>) => void
}

function Field({ label, name, value, onChange, required, type = 'text', min }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        type={type}
        min={min}
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
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
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatEventDisplayDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Date à confirmer'
  }
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

