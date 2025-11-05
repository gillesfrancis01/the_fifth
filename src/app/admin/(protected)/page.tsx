import getAllEvents from '@/app/actions/getAllEvent'
import getAllReservations from '@/app/actions/getAllReservations'
import getAllCustomers from '@/app/actions/getAllCustomers'
import getAllTickets from '@/app/actions/getAllTickets'
import EventManager from '@/components/admin/EventManager'
import TicketManager from '@/components/admin/TicketManager'
import { formatEventDateTime } from '@/utils/eventDate'
import type { Ticket, events as Event, Customer, Reservation } from '@/types'

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

  const ticketsWithEvent: TicketWithEvent[] = ticketEntries.flatMap(([eventId, tickets]) => {
    const event = eventMap.get(eventId)

    return tickets.map((ticket) => ({
      ...ticket,
      eventId,
      eventName: event?.name ?? 'Événement inconnu',
    }))
  })

  return (
    <>
      <section id="overview" className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
        <h2 className="text-xl font-semibold text-white">Vue d’ensemble</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Surveillez en un coup d’œil l’activité de votre plateforme.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Événements" value={events.length} />
          <StatCard label="Réservations" value={reservations.length} />
          <StatCard label="Tickets" value={totalTickets} />
          <StatCard label="Clients" value={customers.length} />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {events.map((event) => {
            const tickets = ticketsByEvent.get(event.$id) ?? []

            return (
              <article key={event.$id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-white">{event.name}</h3>
                  <p className="text-xs text-zinc-500">{formatEventDateTime(event.date, 'fr-FR')}</p>
                  <p className="text-xs text-zinc-500">{event.adresse}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <InfoBadge
                    label="Tickets disponibles"
                    value={tickets.filter((ticket) => ticket.available).length}
                  />
                  <InfoBadge label="Tickets publiés" value={tickets.length} />
                  <InfoBadge
                    label="Réservations"
                    value={reservationsWithDetails.filter((item) => item.event?.$id === event.$id).length}
                  />
                </div>
              </article>
            )
          })}

          {events.length === 0 && (
            <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
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
    <section id="reservations" className="space-y-4 rounded-2xl border border-zinc-800 bg-black/40 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Réservations</h2>
          <p className="text-sm text-zinc-400">Historique des transactions et détails clients.</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-400">
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

function InfoBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}
