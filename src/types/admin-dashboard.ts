import type { Ticket, events, Customer, Reservation } from '@/types'

export interface TicketWithEvent extends Ticket {
  eventId: string
  eventName: string
}

export interface ReservationWithDetails {
  reservation: Reservation
  customer?: Customer
  event?: events
  ticket?: Ticket
}
