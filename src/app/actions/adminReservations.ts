'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '../../../config/appwrite'
import { requireAdminSession } from '@/utils/adminAuth'
import { getReservationConfig } from '@/utils/config'
import { upsertAppwriteCustomer } from './upsertAppwriteCustomer'

interface ActionResult {
  success: boolean
  error?: string
}

interface ManualReservationInput {
  eventId: string
  ticketId: string
  fullName: string
  email: string
  phone: string
  quantity: number
}

export async function createManualReservation(
  input: ManualReservationInput
): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const { eventId, ticketId, fullName, email, phone, quantity } = input

  if (!eventId || !ticketId || !fullName || !email) {
    return {
      success: false,
      error: "L'événement, le ticket, le nom et l'email sont obligatoires.",
    }
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { success: false, error: 'La quantité doit être un nombre entier supérieur ou égal à 1.' }
  }

  try {
    await upsertAppwriteCustomer({
      fullName,
      email,
      phone,
      eventId,
      ticketId,
      paymentIntent: 'Ajout manuel (admin)',
      quantity,
    })

    revalidatePath('/admin/reservations')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to create manual reservation', error)
    return { success: false, error: 'Impossible de créer la réservation.' }
  }
}

export async function deleteReservation(reservationId: string): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  if (!reservationId) {
    return { success: false, error: 'Identifiant de réservation manquant.' }
  }

  const config = getReservationConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.deleteDocument(config.databaseId, config.collectionId, reservationId)

    revalidatePath('/admin/reservations')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete reservation', error)
    return { success: false, error: 'Impossible de supprimer la réservation.' }
  }
}
