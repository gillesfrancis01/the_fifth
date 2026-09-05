'use server'

import { createAdminClient } from '../../../config/appwrite'
import { getReservationConfig } from '../../utils/config'
import { getCheckInActor } from '@/utils/scannerAuth'
import type { Reservation } from '@/types'

interface ActionResult {
  success: boolean
  error?: string
}

export async function setReservationAvailability(
  reservationId: string,
  available: boolean
): Promise<ActionResult> {
  const actor = await getCheckInActor()

  if (!actor) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getReservationConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  if (!reservationId) {
    return { success: false, error: 'Identifiant de réservation manquant.' }
  }

  try {
    const { databases } = await createAdminClient()

    if (actor.type === 'scanner') {
      const reservation = (await databases.getDocument(
        config.databaseId,
        config.collectionId,
        reservationId
      )) as unknown as Reservation

      if (reservation.event_ID !== actor.eventId) {
        return { success: false, error: 'Ce billet appartient à un autre événement.' }
      }
    }

    await databases.updateDocument(config.databaseId, config.collectionId, reservationId, {
      available,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to update reservation availability', error)
    return {
      success: false,
      error: "Impossible de mettre à jour la disponibilité de la réservation.",
    }
  }
}


