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

// Appwrite ne permet pas de recherche partielle (contains) sans index
// plein-texte dédié, qu'on ne peut pas configurer depuis le code. On part
// donc des réservations (déjà bornées à l'événement pour un scanner),
// on récupère les clients associés, puis on filtre en mémoire sur le nom
// ou l'email — ça unifie recherche par nom et par courriel dans un seul
// champ, sans dépendance Appwrite supplémentaire.
export async function searchReservationsForEvent(
  query: string,
  eventId?: string
): Promise<ReservationSearchResult[]> {
  const actor = await getCheckInActor()
  const trimmedQuery = query.trim()
  if (!actor || !trimmedQuery) {
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

    // Sans Query.limit explicite, Appwrite plafonne listDocuments à 25
    // résultats : au-delà, la recherche ratait silencieusement les
    // réservations situées après la 25e (cf. getReservationsByEvent.ts).
    const reservationQueries = scopedEventId
      ? [Query.equal('event_ID', scopedEventId), Query.limit(1000)]
      : [Query.limit(1000)]

    const { documents: reservations } = await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      reservationQueries
    )

    const customerIds = Array.from(
      new Set(
        (reservations as unknown as Reservation[])
          .map((reservation) => reservation.customer_ID)
          .filter((id): id is string => Boolean(id))
      )
    )

    if (customerIds.length === 0) {
      return []
    }

    const { documents: customers } = await databases.listDocuments(config.databaseId, customerCollection, [
      Query.equal('$id', customerIds),
      Query.limit(customerIds.length),
    ])

    const normalizedQuery = trimmedQuery.toLowerCase()
    const customerById = new Map((customers as unknown as Customer[]).map((customer) => [customer.$id, customer]))
    const matchingCustomerIds = new Set(
      (customers as unknown as Customer[])
        .filter(
          (customer) =>
            customer.fullName?.toLowerCase().includes(normalizedQuery) ||
            customer.email?.toLowerCase().includes(normalizedQuery)
        )
        .map((customer) => customer.$id)
    )

    return (reservations as unknown as Reservation[])
      .filter((reservation) => matchingCustomerIds.has(reservation.customer_ID))
      .map((reservation) => ({
        reservationId: reservation.$id,
        customerName: customerById.get(reservation.customer_ID)?.fullName ?? 'Client inconnu',
        ticketId: reservation.ticket_ID,
        available: reservation.available !== false,
      }))
  } catch (error) {
    console.error('Failed to search reservations by query', error)
    return []
  }
}
