import getAllEvents from '@/app/actions/getAllEvent'
import getAllReservations from '@/app/actions/getAllReservations'
import getAllCustomers from '@/app/actions/getAllCustomers'
import getAllTickets from '@/app/actions/getAllTickets'
import type { events as Event, Reservation, Customer, Ticket } from '@/types'
import type { ReservationWithDetails, TicketWithEvent } from '@/types/admin-dashboard'

export async function fetchEvents(): Promise<Event[]> {
  const events = await getAllEvents()
  return events ?? []
}

export async function fetchReservations(): Promise<Reservation[]> {
  const reservations = await getAllReservations()
  return reservations ?? []
}

export async function fetchCustomers(): Promise<Customer[]> {
  const customers = await getAllCustomers()
  return customers ?? []
}

export async function fetchAdminCoreData() {
  const [events, reservations, customers] = await Promise.all([
    fetchEvents(),
    fetchReservations(),
    fetchCustomers(),
  ])

  return { events, reservations, customers }
}

export async function fetchTicketsForEvents(events: Event[]) {
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

  const totalTickets = ticketEntries.reduce((total, [, tickets]) => total + tickets.length, 0)
  const availableTickets = ticketEntries.reduce(
    (total, [, tickets]) => total + tickets.filter((ticket) => ticket.available).length,
    0
  )

  const ticketsWithEvent: TicketWithEvent[] = ticketEntries.flatMap(([eventId, tickets]) => {
    const event = events.find((currentEvent) => currentEvent.$id === eventId)

    return tickets.map((ticket) => ({
      ...ticket,
      eventId,
      eventName: event?.name ?? 'Événement inconnu',
    }))
  })

  return { ticketEntries, ticketsByEvent, ticketMapById, totalTickets, availableTickets, ticketsWithEvent }
}

export function buildReservationsWithDetails(
  reservations: Reservation[],
  events: Event[],
  customers: Customer[],
  ticketMapById: Map<string, Ticket>
): ReservationWithDetails[] {
  const customerMap = new Map(customers.map((customer) => [customer.$id, customer] as const))
  const eventMap = new Map(events.map((event) => [event.$id, event] as const))

  return reservations.map((reservation) => ({
    reservation,
    customer: customerMap.get(reservation.customer_ID),
    event: eventMap.get(reservation.event_ID),
    ticket: ticketMapById.get(reservation.ticket_ID),
  }))
}
