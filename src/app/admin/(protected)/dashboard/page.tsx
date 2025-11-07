import { fetchAdminCoreData, fetchTicketsForEvents, buildReservationsWithDetails } from '../loaders'
import { formatEventDateTime } from '@/utils/eventDate'
import { formatReservationTimestamp } from '@/utils/reservations'
import type { ReservationWithDetails } from '@/types/admin-dashboard'
import type { events as Event, TicketWithAvailability } from '@/types'
import { FiArrowUpRight, FiClock, FiMapPin, FiTrendingUp } from 'react-icons/fi'
import type { IconType } from 'react-icons'

const revenueFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'CAD',
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
  const vipGuests = reservationsWithDetails.filter(({ ticket }) => ticket?.name?.toLowerCase().includes('vip')).length

  const upcomingEventReservations = upcomingEvent
    ? reservationsWithDetails.filter((item) => item.event?.$id === upcomingEvent.$id)
    : []

  const heatmapData = buildWeeklyHeatmap(reservationsWithDetails)
  const recentReservations = getRecentReservations(reservationsWithDetails)
  const eventPerformances = computeEventPerformances(reservationsWithDetails, ticketsByEvent, events)

  return (
    <div className="space-y-12">
      <section className="grid gap-8 xl:grid-cols-[1.65fr_1fr]">
        <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(170deg,rgba(18,18,18,0.95),rgba(8,8,8,0.8))] p-6 shadow-[0_45px_90px_-60px_rgba(0,0,0,0.85)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.12),transparent_68%)] opacity-70" />
          <div className="relative flex flex-col gap-6">
            <header className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Pulse opératoire</p>
              <h2 className="font-heading text-3xl text-white">Indicateurs maîtres</h2>
            </header>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Événements actifs"
                value={events.length.toString()}
                helper={`${upcomingEventsCount} à venir`}
                icon={FiClock}
              />
              <StatCard
                label="Réservations confirmées"
                value={reservationsWithDetails.length.toString()}
                helper={`${customers.length} clients · ${loyalCustomers} fidèles`}
                icon={FiTrendingUp}
              />
              <StatCard
                label="Revenus"
                value={revenueFormatter.format(revenue)}
                helper={`Panier moyen ${revenueFormatter.format(averageTicketPrice || 0)}`}
                icon={FiArrowUpRight}
              />
              <StatCard
                label="VIP confirmés"
                value={vipGuests.toString()}
                helper={`${occupancyRate}% de remplissage global`}
                icon={FiMapPin}
              />
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Température des réservations</p>
                  <h3 className="mt-1 font-heading text-xl text-white">Heatmap hebdomadaire</h3>
                </div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
                  <span className="inline-flex h-3 w-8 rounded-full bg-white/10" />
                  <span>Faible</span>
                  <span className="inline-flex h-3 w-8 rounded-full bg-[rgba(201,161,77,0.7)]" />
                  <span>Fort</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {heatmapData.map((item) => (
                  <div key={item.day} className="space-y-2 text-center text-xs">
                    <span className="block text-[10px] uppercase tracking-[0.4em] text-white/45">{item.day}</span>
                    <span
                      className="flex h-20 items-center justify-center rounded-2xl border border-white/5 text-sm font-medium text-white"
                      style={{
                        background:
                          item.intensity > 0
                            ? `linear-gradient(135deg, rgba(201,161,77,${0.15 + item.intensity * 0.2}), rgba(26,26,26,0.85))`
                            : 'rgba(15,15,15,0.4)',
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(185deg,rgba(14,14,14,0.95),rgba(6,6,6,0.8))] p-6 shadow-[0_35px_90px_-55px_rgba(0,0,0,0.85)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.18),transparent_72%)] opacity-60" />
          <div className="relative space-y-4">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Prochain rendez-vous</p>
            <h3 className="font-heading text-2xl text-main">{upcomingEvent ? upcomingEvent.name : 'Aucun événement planifié'}</h3>
            {upcomingEvent ? (
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 rounded-2xl border border-white/5 bg-black/40 p-4">
                  <div className="flex items-center justify-between text-white/70">
                    <span className="font-heading text-base text-white">{formatEventDateTime(upcomingEvent.date, 'fr-FR')}</span>
                    <Countdown targetDate={upcomingEvent.date} />
                  </div>
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
                    <span className="inline-flex h-1 w-10 rounded-full bg-[rgba(201,161,77,0.6)]" />
                    <span>{upcomingEventReservations.length} réservations confirmées</span>
                  </div>
                </div>
                <div className="grid gap-3">
                  <InfoChip label="Lieu" value={upcomingEvent.adresse || 'Adresse à confirmer'} />
                  <InfoChip label="Moodboard" value={upcomingEvent.teaser || 'Ajoutez un moodboard pour capturer l’esprit de la nuit.'} />
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm text-white/60">
                Ajoutez un événement pour initier la programmation de votre saison.
              </p>
            )}

            <div className="relative space-y-3">
              <h4 className="font-heading text-lg text-white">À l’agenda</h4>
              <div className="space-y-3">
                {sortedEvents.slice(0, 4).map((event) => (
                  <div
                    key={event.$id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/35 px-4 py-3 text-xs text-white/70"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{event.name}</span>
                      <span>{formatEventDateTime(event.date, 'fr-FR')}</span>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/50">
                      {event.adresse || 'À définir'}
                    </span>
                  </div>
                ))}
                {sortedEvents.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-4 text-xs text-white/60">
                    Aucune programmation pour le moment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section id="stats" className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <article className="space-y-5 rounded-3xl border border-white/10 bg-[linear-gradient(170deg,rgba(10,10,10,0.9),rgba(4,4,4,0.78))] p-6 shadow-[0_45px_90px_-60px_rgba(0,0,0,0.85)]">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Activité récente</p>
              <h3 className="mt-1 font-heading text-2xl text-white">Transactions en direct</h3>
            </div>
            <a href="/admin/reservations" className="text-[11px] uppercase tracking-[0.35em] text-white/55 hover:text-white">
              Tout voir
            </a>
          </header>
          <ul className="space-y-4">
            {recentReservations.map(({ reservation, customer, event, ticket }) => (
              <li
                key={reservation.$id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/35 p-4 transition hover:border-[rgba(201,161,77,0.45)]"
              >
                <div className="absolute inset-0 translate-y-full bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.15),transparent_70%)] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
                <div className="relative flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.35em] text-white/45">
                  <span>{formatReservationTimestamp(reservation.$createdAt)}</span>
                  <span className="font-mono text-[10px] text-white/35">{reservation.$id}</span>
                </div>
                <div className="relative mt-3 flex flex-col gap-1">
                  <p className="text-sm font-medium text-white">{customer?.fullName ?? 'Client inconnu'}</p>
                  <p className="text-xs text-white/60">
                    {event?.name ?? 'Événement inconnu'} · {ticket?.name ?? 'Ticket non précisé'}
                  </p>
                </div>
              </li>
            ))}
            {recentReservations.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm text-white/60">
                Les réservations apparaîtront ici dès qu’elles seront enregistrées.
              </li>
            )}
          </ul>
        </article>

        <article className="space-y-5 rounded-3xl border border-white/10 bg-[linear-gradient(185deg,rgba(8,8,8,0.92),rgba(3,3,3,0.8))] p-6 shadow-[0_40px_90px_-65px_rgba(0,0,0,0.85)]">
          <header className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Performance</p>
            <h3 className="font-heading text-2xl text-white">Capacité & tension</h3>
            <p className="text-xs text-white/60">
              Identifiez les shows en surchauffe et ajustez votre stratégie de diffusion pour maximiser les revenus.
            </p>
          </header>
          <div className="space-y-4">
            {eventPerformances.map((performance) => (
              <EventPerformanceRow key={performance.id} performance={performance} />
            ))}
            {eventPerformances.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm text-white/60">
                Aucun événement n’est enregistré pour le moment.
              </p>
            )}
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/5 bg-black/35 p-4 text-sm text-white/70">
            <CapacityInsight label="Tickets disponibles" value={availableTickets} />
            <CapacityInsight label="Tickets publiés" value={totalTickets} />
            <CapacityInsight
              label="Événements complets"
              value={eventPerformances.filter((item) => item.availableTickets === 0 && item.totalTickets > 0).length}
            />
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
  ticketsByEvent: Map<string, TicketWithAvailability[]>,
  events: Event[],
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
      const totalTickets = tickets.reduce((total, ticket) => total + ticket.quantity, 0)
      const availableTickets = tickets.reduce(
        (total, ticket) => total + (ticket.available ? ticket.remaining : 0),
        0
      )
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

function buildWeeklyHeatmap(reservations: ReservationWithDetails[]) {
  const weekDays = ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'] as const
  const counts = new Array(7).fill(0)

  reservations.forEach(({ reservation }) => {
    const createdAt = reservation.$createdAt
    if (!createdAt) return
    const date = new Date(createdAt)
    const dayIndex = date.getDay()
    counts[dayIndex === 0 ? 6 : dayIndex - 1] += 1
  })

  const maxValue = Math.max(...counts, 0)

  return counts.map((value, index) => ({
    day: weekDays[index],
    value,
    intensity: maxValue === 0 ? 0 : value / maxValue,
  }))
}

function Countdown({ targetDate }: { targetDate?: string }) {
  if (!targetDate) {
    return <span className="text-xs text-white/55">À définir</span>
  }

  const target = Date.parse(targetDate)
  if (Number.isNaN(target)) {
    return <span className="text-xs text-white/55">À définir</span>
  }

  const now = Date.now()
  const diff = Math.max(target - now, 0)

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-white/60">
      {days}j {hours}h {minutes}m
    </span>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
      <span className="text-[10px] uppercase tracking-[0.4em] text-white/45">{label}</span>
      <span className="max-w-[60%] text-right text-sm text-white/75">{value}</span>
    </div>
  )
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
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4">
      <div className="flex items-start justify-between gap-4 text-sm text-white/75">
        <div className="space-y-1">
          <span className="font-medium text-white">{performance.name}</span>
          {performance.date && (
            <span className="block text-xs text-white/55">{formatEventDateTime(performance.date, 'fr-FR')}</span>
          )}
        </div>
        <span className="text-xs text-white/50">{performance.reserved}/{performance.totalTickets || 1} réservations</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(201,161,77,0.85),rgba(201,161,77,0.45))]"
          style={{ width: `${Math.min(100, Math.max(0, performance.occupancy))}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-white/55">
        <span>Taux d’occupation</span>
        <span>{performance.occupancy}%</span>
      </div>
      <div className="flex items-center justify-between text-xs text-white/45">
        <span>Tickets restants</span>
        <span>{performance.availableTickets}</span>
      </div>
    </div>
  )
}

function CapacityInsight({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.35em] text-white/60">
      <span>{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  )
}

function StatCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper?: string; icon: IconType }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-5 transition hover:border-[rgba(201,161,77,0.45)]">
      <div className="absolute inset-0 translate-y-full bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.12),transparent_70%)] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
      <div className="relative flex items-center justify-between">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/45 text-[rgba(201,161,77,0.85)] transition group-hover:border-[rgba(201,161,77,0.55)] group-hover:text-[rgba(201,161,77,1)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="relative mt-4 text-[11px] uppercase tracking-[0.45em] text-white/50">{label}</p>
      <p className="relative mt-2 text-3xl font-semibold text-white">{value}</p>
      {helper ? <p className="relative mt-2 text-xs text-white/55">{helper}</p> : null}
    </div>
  )
}

function parseDate(value?: string) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}
