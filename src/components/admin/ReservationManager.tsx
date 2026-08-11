'use client'

import { FormEvent, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import Modal from '@/components/ui/Modal'
import ExportButton from '@/components/admin/ExportButton'
import ReservationsTable from '@/components/admin/ReservationsTable'
import type { events } from '@/types'
import type { ReservationWithDetails, TicketWithEvent } from '@/types/admin-dashboard'
import { createManualReservation, deleteReservation } from '@/app/actions/adminReservations'

interface ReservationManagerProps {
  events: events[]
  tickets: TicketWithEvent[]
  reservations: ReservationWithDetails[]
  exportData: Record<string, unknown>[]
  lastReservationLabel: string
}

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

const initialForm = {
  eventId: '',
  ticketId: '',
  fullName: '',
  email: '',
  phone: '',
  quantity: '1',
}

export default function ReservationManager({
  events,
  tickets,
  reservations,
  exportData,
  lastReservationLabel,
}: ReservationManagerProps) {
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

  const openCreateModal = () => {
    setFormValues({ ...initialForm })
    setFeedback(null)
    setIsModalOpen(true)
  }

  const closeCreateModal = () => {
    if (isPending) {
      return
    }
    setIsModalOpen(false)
  }

  const handleChange = (event: FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.currentTarget
    setFormValues((previous) => ({
      ...previous,
      [target.name]: target.value,
      ...(target.name === 'eventId' ? { ticketId: '' } : {}),
    }))
  }

  const ticketsForSelectedEvent = tickets.filter((ticket) => ticket.eventId === formValues.eventId)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.eventId || !formValues.ticketId || !formValues.fullName || !formValues.email) {
      setFeedback({ type: 'error', message: "L'événement, le ticket, le nom et l'email sont obligatoires." })
      return
    }

    const quantity = Number(formValues.quantity)

    if (!Number.isInteger(quantity) || quantity < 1) {
      setFeedback({ type: 'error', message: 'La quantité doit être un nombre entier supérieur ou égal à 1.' })
      return
    }

    startTransition(async () => {
      const result = await createManualReservation({
        eventId: formValues.eventId,
        ticketId: formValues.ticketId,
        fullName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone,
        quantity,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Impossible de créer la réservation.' })
        return
      }

      setFormValues({ ...initialForm })
      setFeedback(null)
      setIsModalOpen(false)
      setBanner({ type: 'success', message: 'Réservation créée et email de confirmation envoyé.' })
      router.refresh()
    })
  }

  const handleDelete = (reservationId: string) => {
    if (!window.confirm('Voulez-vous supprimer cette réservation ? Cette action est irréversible.')) {
      return
    }

    startTransition(async () => {
      const result = await deleteReservation(reservationId)

      if (!result.success) {
        setBanner({ type: 'error', message: result.error ?? 'Suppression impossible.' })
        return
      }

      setBanner({ type: 'success', message: 'Réservation supprimée.' })
      router.refresh()
    })
  }

  return (
    <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Historique détaillé</h3>
          <p className="text-sm text-zinc-400">Consultez l&apos;ensemble des réservations et leurs informations associées.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
          >
            Ajouter une réservation
          </button>
          <ExportButton data={exportData} filename="reservations_globales" />
          <div className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
            Dernière réservation : {lastReservationLabel}
          </div>
        </div>
      </div>

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
        title="Nouvelle réservation"
        description="Ajoutez manuellement une réservation. Le client recevra son billet par email."
      >
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Événement</span>
              <select
                name="eventId"
                value={formValues.eventId}
                onChange={handleChange}
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
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Ticket</span>
              <select
                name="ticketId"
                value={formValues.ticketId}
                onChange={handleChange}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
                required
                disabled={!formValues.eventId}
              >
                <option value="">
                  {formValues.eventId ? 'Sélectionnez un ticket' : "Choisissez d'abord un événement"}
                </option>
                {ticketsForSelectedEvent.map((ticket) => (
                  <option key={ticket.$id} value={ticket.$id}>
                    {ticket.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Nom complet</span>
              <input
                name="fullName"
                value={formValues.fullName}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Email</span>
              <input
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Téléphone (facultatif)</span>
              <input
                name="phone"
                value={formValues.phone}
                onChange={handleChange}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Quantité</span>
              <input
                name="quantity"
                type="number"
                min={1}
                value={formValues.quantity}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {feedback && (
              <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>{feedback.message}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 transition hover:border-white/25 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Création...' : 'Créer la réservation'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ReservationsTable reservations={reservations} onDelete={handleDelete} />
    </section>
  )
}
