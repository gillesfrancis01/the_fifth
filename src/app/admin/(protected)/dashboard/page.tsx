import { fetchAdminCoreData, fetchTicketsForEvents, buildReservationsWithDetails } from '../loaders'
import { formatEventDateTime } from '@/utils/eventDate'
import { formatReservationTimestamp } from '@/utils/reservations'
import type { ReservationWithDetails } from '@/types/admin-dashboard'
import type { events as Event, Ticket } from '@/types'
import { FiActivity, FiCalendar, FiPieChart, FiTrendingUp, FiUsers } from 'react-icons/fi'
import type { IconType } from 'react-icons'

const revenueFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export default async function AdminDashboardPage() {
  const { events, reservations, customers } = await fetchAdminCoreData()
  const { ticketsByEvent, ticketMapById, totalTickets, availableTickets } = await fetchTicketsForEvents(events)

  const reservationsWithDetails = buildReservationsWithDetails(reservations, events, customers, ticketMapById)

  const now = new Date()
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const upcomingEvent = sortedEvents.find((event) => new Date(event.date).getTime() >= now.getTime()) ?? sortedEvents[0]
  const upcomingEventsCount = sortedEvents.filter((event) => new Date(event.date).getTime() >= now.getTime()).length

  const occupancyRate = totalTickets > 0 ? Math.round((reservationsWithDetails.length / totalTickets) * 100) : 0
  const revenue = reservationsWithDetails.reduce((total, { ticket }) => total + (ticket?.price ?? 0), 0)
  const averageTicketPrice = reservationsWithDetails.length > 0 ? revenue / reservationsWithDetails.length : 0

  const reservationCountByCustomer = new Map<string, number>()
  reservationsWithDetails.forEach(({ customer }) => {
    if (!customer) return
    reservationCountByCustomer.set(customer.$id, (reservationCountByCustomer.get(customer.$id) ?? 0) + 1)
  })
  const loyalCustomers = [...reservationCountByCustomer.values()].filter((count) => count > 1).length

  const upcomingEventReservations = upcomingEvent
    ? reservationsWithDetails.filter((item) => item.event?.$id === upcomingEvent.$id)
    : []

  const recentReservations = getRecentReservations(reservationsWithDetails)
  const eventPerformances = computeEventPerformances(reservationsWithDetails, ticketsByEvent, events)
  const highOccupancyEvents = eventPerformances.filter((performance) => performance.occupancy >= 80)

  return (
    <div className="space-y-10">
      <section className="space-y-8 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-zinc-950/95 p-8 shadow-[0_35px_90px_-45px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Pilotage global</p>
            <h2 className="text-3xl font-semibold text-white">Vision panoramique des opérations</h2>
            <p className="text-sm text-zinc-400">
              Analysez les indicateurs clés, anticipez les besoins et priorisez vos actions sur les événements stratégiques.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/admin/events"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900/60"
            >
              Nouveau événement
            </a>
            <a
              href="/admin/tickets"
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
            value={reservationsWithDetails.length.toString()}
            icon={FiUsers}
            helper={`${customers.length} clients · ${loyalCustomers} fidèles`}
          />
          <StatCard
            label="Revenus estimés"
            value={revenueFormatter.format(revenue)}
            icon={FiTrendingUp}
            helper={`Panier moyen ${revenueFormatter.format(averageTicketPrice || 0)}`}
          />
          <StatCard
            label="Occupation globale"
            value={`${occupancyRate}%`}
            icon={FiPieChart}
            helper={`${reservationsWithDetails.length}/${totalTickets || 1} billets`}
            progress={occupancyRate}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1.1fr]">
        <article className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Cap sur le prochain événement</p>
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
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Lieu</p>
                <p className="mt-2 text-sm text-zinc-200">{upcomingEvent.adresse || 'Adresse à confirmer'}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Réservations</p>
                <p className="mt-2 text-sm text-zinc-200">{upcomingEventReservations.length} confirmées</p>
              </div>
              <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Résumé</p>
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

        <article className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Activité récente</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Réservations en direct</h3>
            </div>
            <a href="/admin/reservations" className="text-xs font-medium text-main transition hover:opacity-80">
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
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Performance par événement</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Suivi des capacités</h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
              <FiActivity className="h-4 w-4" />
              {highOccupancyEvents.length} alertes
            </span>
          </div>

          <div className="space-y-4">
            {eventPerformances.map((performance) => (
              <EventPerformanceRow key={performance.id} performance={performance} />
            ))}

            {eventPerformances.length === 0 && (
              <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
                Aucun événement n’est enregistré pour le moment.
              </p>
            )}
          </div>
        </article>

        <article className="space-y-5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-main/5 via-zinc-950/70 to-zinc-950/90 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Capacité restante</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Optimisez vos ventes</h3>
            <p className="mt-2 text-sm text-zinc-300">
              Identifiez où concentrer vos efforts marketing pour maximiser le remplissage des événements.
            </p>
          </div>
          <div className="grid gap-3">
            <CapacityInsight label="Tickets disponibles" value={availableTickets} />
            <CapacityInsight label="Tickets publiés" value={totalTickets} />
            <CapacityInsight label="Événements complets" value={eventPerformances.filter((item) => item.availableTickets === 0 && item.totalTickets > 0).length} />
          </div>
        </article>
      </section>
    </div>
  )
}

function getRecentReservations(reservations: ReservationWithDetails[]) {
  return [...reservations]
    .sort((a, b) => parseDate(b.reservation.$createdAt) - parseDate(a.reservation.$createdAt))
    .slice(0, 6)
}

function computeEventPerformances(
  reservations: ReservationWithDetails[],
  ticketsByEvent: Map<string, Ticket[]>,
  events: Event[]
) {
  const reservationsByEvent = new Map<string, number>()
  reservations.forEach(({ event }) => {
    if (!event) return
    reservationsByEvent.set(event.$id, (reservationsByEvent.get(event.$id) ?? 0) + 1)
  })

  const eventMap = new Map(events.map((event) => [event.$id, event] as const))

  return [...ticketsByEvent.entries()]
    .map(([eventId, tickets]) => {
      const reserved = reservationsByEvent.get(eventId) ?? 0
      const totalTickets = tickets.length
      const availableTickets = tickets.filter((ticket) => ticket.available).length
      const occupancy = totalTickets > 0 ? Math.round((reserved / totalTickets) * 100) : 0
      const event = eventMap.get(eventId)

      return {
        id: eventId,
        reserved,
        totalTickets,
        availableTickets,
        occupancy,
        name: event?.name ?? `Événement ${eventId}`,
        date: event?.date,
      }
    })
    .sort((a, b) => b.occupancy - a.occupancy)
}

function EventPerformanceRow({
  performance,
}: {
  performance: {
    id: string
    reserved: number
    totalTickets: number
    availableTickets: number
    occupancy: number
    name: string
    date?: string
  }
}) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-start justify-between gap-4 text-sm text-zinc-200">
        <div className="space-y-1">
          <span className="font-medium text-white">{performance.name}</span>
          {performance.date && (
            <span className="block text-xs text-zinc-500">{formatEventDateTime(performance.date, 'fr-FR')}</span>
          )}
        </div>
        <span className="text-xs text-zinc-400">{performance.reserved}/{performance.totalTickets || 1} réservations</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${performance.occupancy >= 80 ? 'bg-red-400' : 'bg-main'}`}
          style={{ width: `${Math.min(100, Math.max(0, performance.occupancy))}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Taux d’occupation</span>
        <span>{performance.occupancy}%</span>
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Tickets restants</span>
        <span>{performance.availableTickets}</span>
      </div>
    </div>
  )
}

function CapacityInsight({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-200">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  progress,
}: {
  label: string
  value: string
  helper?: string
  icon: IconType
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
          <div className="h-full rounded-full bg-main" style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} />
        </div>
      ) : null}
    </div>
  )
}

function parseDate(value?: string) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}
