'use server'

import { Query } from 'node-appwrite'

import { createAdminClient } from '../../../config/appwrite'
import { getReservationConfig } from '@/utils/config'
import { getCheckInActor } from '@/utils/scannerAuth'
import type { Customer, Reservation } from '@/types'

export interface ReservationSearchResult {
  reservationId: string
  customerName: string
  ticketId: string
  available: boolean
}

export async function findReservationsByEmailForEvent(
  email: string,
  eventId?: string
): Promise<ReservationSearchResult[]> {
  const actor = await getCheckInActor()
  if (!actor || !email) {
    return []
  }

  const scopedEventId = actor.type === 'scanner' ? actor.eventId : eventId

  const config = getReservationConfig()
  if ('error' in config) {
    return []
  }

  const customerCollection = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS
  if (!customerCollection) {
    return []
  }

  try {
    const { databases } = await createAdminClient()

    const { documents: customers } = await databases.listDocuments(config.databaseId, customerCollection, [
      Query.equal('email', email),
    ])

    const customer = customers[0] as unknown as Customer | undefined
    if (!customer) {
      return []
    }

    const reservationQueries = [Query.equal('customer_ID', customer.$id)]
    if (scopedEventId) {
      reservationQueries.push(Query.equal('event_ID', scopedEventId))
    }

    const { documents: reservations } = await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      reservationQueries
    )

    return (reservations as unknown as Reservation[]).map((reservation) => ({
      reservationId: reservation.$id,
      customerName: customer.fullName,
      ticketId: reservation.ticket_ID,
      available: reservation.available !== false,
    }))
  } catch (error) {
    console.error('Failed to search reservations by email', error)
    return []
  }
}
