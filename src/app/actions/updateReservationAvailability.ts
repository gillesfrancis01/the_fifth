'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '../../../config/appwrite'

interface ActionResult {
  success: boolean
  error?: string
}

function getReservationConfig() {
  const databaseId = process.env.NEXT_PUBLIC_DATABASE
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION

  if (!databaseId || !collectionId) {
    return { error: "Configuration Appwrite manquante pour les réservations." }
  }

  return { databaseId, collectionId }
}

export async function setReservationAvailability(
  reservationId: string,
  available: boolean
): Promise<ActionResult> {
  const config = getReservationConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  if (!reservationId) {
    return { success: false, error: 'Identifiant de réservation manquant.' }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.updateDocument(config.databaseId, config.collectionId, reservationId, {
      available,
    })

    revalidatePath('/admin/reservations')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to update reservation availability', error)
    return {
      success: false,
      error: "Impossible de mettre à jour la disponibilité de la réservation.",
    }
  }
}

export { getReservationConfig }
