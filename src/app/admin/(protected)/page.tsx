import getAllEvents from '@/app/actions/getAllEvent'
import getAllReservations from '@/app/actions/getAllReservations'
import getAllCustomers from '@/app/actions/getAllCustomers'
import getAllTickets from '@/app/actions/getAllTickets'
import EventManager from '@/components/admin/EventManager'
import TicketManager from '@/components/admin/TicketManager'
import { formatEventDateTime } from '@/utils/eventDate'
import type { Ticket, events as Event, Customer, Reservation } from '@/types'
import type { IconType } from 'react-icons'
import { FiActivity, FiCalendar, FiPieChart, FiUsers } from 'react-icons/fi'

interface TicketWithEvent extends Ticket {
  eventId: string
  eventName: string
}

interface ReservationWithDetails {
  reservation: Reservation
  customer: Customer | undefined
  event: Event | undefined
  ticket: Ticket | undefined
}

const reservationDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function AdminDashboardPage() {
  const [eventsRaw, reservations, customers] = await Promise.all([
    getAllEvents(),
    getAllReservations(),
    getAllCustomers(),
  ])

  const events = eventsRaw ?? []

  const ticketEntries = await Promise.all(
    events.map(async (event) => {
      const tickets = (await getAllTickets(event.$id)) ?? []
      return [event.$id, tickets] as const
    })
  )

  const ticketsByEvent = new Map<string, Ticket[]>(ticketEntries)
  const ticketMapById = new Map<string, Ticket>(
    ticketEntries.flatMap(([, tickets]) => tickets.map((ticket) => [ticket.$id, ticket] as const))
  )

  const customerMap = new Map(customers.map((customer) => [customer.$id, customer]))
  const eventMap = new Map(events.map((event) => [event.$id, event]))

  const reservationsWithDetails: ReservationWithDetails[] = reservations.map((reservation) => ({
    reservation,
    customer: customerMap.get(reservation.customer_ID),
    event: eventMap.get(reservation.event_ID),
    ticket: ticketMapById.get(reservation.ticket_ID),
  }))

  const totalTickets = ticketEntries.reduce((total, [, tickets]) => total + tickets.length, 0)
  const availableTickets = ticketEntries.reduce(
    (total, [, tickets]) => total + tickets.filter((ticket) => ticket.available).length,
    0
  )

  const ticketsWithEvent: TicketWithEvent[] = ticketEntries.flatMap(([eventId, tickets]) => {
    const event = eventMap.get(eventId)

    return tickets.map((ticket) => ({
      ...ticket,
      eventId,
      eventName: event?.name ?? 'Événement inconnu',
    }))
  })

  const now = new Date()
  const upcomingEvent =
    [...events]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .find((event) => new Date(event.date).getTime() >= now.getTime()) ?? events[0]

  const upcomingEventsCount = events.filter((event) => new Date(event.date).getTime() >= now.getTime()).length

  const upcomingEventReservations = upcomingEvent
    ? reservationsWithDetails.filter((item) => item.event?.$id === upcomingEvent.$id)
    : []

  const occupancyRate = totalTickets > 0 ? Math.round((reservationsWithDetails.length / totalTickets) * 100) : 0

  const recentReservations = [...reservationsWithDetails]
    .sort((a, b) => parseDate(b.reservation.$createdAt) - parseDate(a.reservation.$createdAt))
    .slice(0, 6)

  return (
    <>
      <section
        id="overview"
        className="space-y-8 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-zinc-950/90 p-8 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.85)]"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Vue d’ensemble</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Pilotage quotidien</h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Suivez les indicateurs principaux de votre plateforme d’événementiel et agissez avant même que les
              tendances n’évoluent.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#events"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900/60"
            >
              Créer un événement
            </a>
            <a
              href="#tickets"
              className="inline-flex items-center justify-center rounded-lg bg-main px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Publier des tickets
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Événements actifs"
            value={events.length.toString()}
            icon={FiCalendar}
            helper={`${upcomingEventsCount} à venir`}
          />
          <StatCard
            label="Réservations confirmées"
            value={reservations.length.toString()}
            icon={FiUsers}
            helper={`${customers.length} clients recensés`}
          />
          <StatCard
            label="Occupation globale"
            value={`${occupancyRate}%`}
            icon={FiPieChart}
            helper={`${reservationsWithDetails.length}/${totalTickets} billets réservés`}
            progress={occupancyRate}
          />
          <StatCard
            label="Tickets en stock"
            value={availableTickets.toString()}
            icon={FiActivity}
            helper={`${totalTickets} billets publiés`}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <article className="xl:col-span-3 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Prochain focus</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {upcomingEvent ? upcomingEvent.name : 'Aucun événement planifié'}
                </h3>
              </div>
              {upcomingEvent && (
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                  {formatEventDateTime(upcomingEvent.date, 'fr-FR')}
                </span>
              )}
            </div>

            {upcomingEvent ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Lieu</p>
                  <p className="mt-2 text-sm text-zinc-200">{upcomingEvent.adresse || 'Adresse à confirmer'}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Réservations liées</p>
                  <p className="mt-2 text-sm text-zinc-200">{upcomingEventReservations.length} confirmées</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Résumé</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {upcomingEvent.teaser ||
                      'Ajoutez un teaser pour donner le ton à votre prochain événement et séduire vos participants.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
                Ajoutez un nouvel événement pour commencer à suivre vos indicateurs.
              </p>
            )}
          </article>

          <aside className="xl:col-span-2 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Activité récente</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Réservations en direct</h3>
              </div>
              <a href="#reservations" className="text-xs font-medium text-main transition hover:opacity-80">
                Tout voir
              </a>
            </div>
            <ul className="space-y-4">
              {recentReservations.map(({ reservation, customer, event, ticket }) => (
                <li key={reservation.$id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>{formatReservationTimestamp(reservation.$createdAt)}</span>
                    <span className="font-mono text-[11px] text-zinc-500">{reservation.$id}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">{customer?.fullName ?? 'Client inconnu'}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {event?.name ?? 'Événement inconnu'} · {ticket?.name ?? 'Ticket non précisé'}
                  </p>
                </li>
              ))}

              {recentReservations.length === 0 && (
                <li className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
                  Les réservations apparaîtront ici dès qu’elles seront enregistrées.
                </li>
              )}
            </ul>
          </aside>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => {
            const tickets = ticketsByEvent.get(event.$id) ?? []
            const reservationsCount = reservationsWithDetails.filter((item) => item.event?.$id === event.$id).length

            return (
              <article
                key={event.$id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-[0_20px_45px_-40px_rgba(0,0,0,0.9)]"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Événement</p>
                  <h3 className="text-xl font-semibold text-white">{event.name}</h3>
                  <p className="text-xs text-zinc-500">{formatEventDateTime(event.date, 'fr-FR')}</p>
                  <p className="text-xs text-zinc-500">{event.adresse}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <InfoBadge label="Tickets disponibles" value={tickets.filter((ticket) => ticket.available).length} />
                  <InfoBadge label="Tickets publiés" value={tickets.length} />
                  <InfoBadge label="Réservations" value={reservationsCount} />
                </div>
              </article>
            )
          })}

          {events.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
              Aucun événement n’est enregistré pour le moment.
            </p>
          )}
        </div>
      </section>

      <EventManager events={events} />

      <TicketManager events={events} tickets={ticketsWithEvent} />

      <ReservationsSection reservations={reservationsWithDetails} />
    </>
  )
}

function ReservationsSection({ reservations }: { reservations: ReservationWithDetails[] }) {
  return (
    <section
      id="reservations"
      className="space-y-4 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950/85 via-zinc-950/65 to-zinc-950/85 p-8 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.85)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Historique</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Réservations</h2>
          <p className="text-sm text-zinc-400">Historique des transactions et détails clients.</p>
        </div>
        <a href="#overview" className="text-xs font-medium text-main transition hover:opacity-80">
          Revenir au tableau
        </a>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-900/60 text-xs uppercase tracking-[0.3em] text-zinc-400">
            <tr>
              <th className="px-4 py-3">Réservation</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Événement</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Paiement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {reservations.map(({ reservation, customer, event, ticket }) => (
              <tr key={reservation.$id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3 font-mono text-xs text-zinc-300">{reservation.$id}</td>
                <td className="px-4 py-3 text-zinc-200">
                  <div className="flex flex-col">
                    <span className="font-medium">{customer?.fullName ?? 'Client inconnu'}</span>
                    <span className="text-xs text-zinc-400">{customer?.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-200">
                  <div className="flex flex-col">
                    <span>{event?.name ?? 'Événement inconnu'}</span>
                    {event && <span className="text-xs text-zinc-400">{formatEventDateTime(event.date, 'fr-FR')}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-200">
                  <div className="flex flex-col">
                    <span>{ticket?.name ?? 'Ticket inconnu'}</span>
                    {typeof ticket?.price === 'number' && (
                      <span className="text-xs text-zinc-400">
                        {ticket.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">{reservation.paymentIntent}</td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-zinc-400" colSpan={5}>
                  Aucune réservation enregistrée pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  helper,
  progress,
}: {
  label: string
  value: string
  icon: IconType
  helper?: string
  progress?: number
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900/60 text-main transition group-hover:bg-main/10">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-zinc-400">{helper}</p> : null}
      {typeof progress === 'number' ? (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-main"
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}

function InfoBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function parseDate(value?: string) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatReservationTimestamp(value?: string) {
  if (!value) {
    return 'Date inconnue'
  }

  const timestamp = parseDate(value)

  if (!timestamp) {
    return 'Date inconnue'
  }

  return reservationDateFormatter.format(new Date(timestamp))
}
