import type { TicketWithAvailability, events, Customer, Reservation } from '@/types'

export interface TicketWithEvent extends TicketWithAvailability {
  eventId: string
  eventName: string
}

export interface ReservationWithDetails {
  reservation: Reservation
  customer?: Customer
  event?: events
  ticket?: TicketWithAvailability
}
