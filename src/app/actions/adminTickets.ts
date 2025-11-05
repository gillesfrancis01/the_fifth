'use server'

import { revalidatePath } from 'next/cache'
import { ID } from 'node-appwrite'

import { createAdminClient } from '../../../config/appwrite'

interface TicketPayload {
  name: string
  price: number
  advantages: string[]
  available: boolean
  event: string
}

interface ActionResult {
  success: boolean
  error?: string
}

function getTicketConfig() {
  const databaseId = process.env.NEXT_PUBLIC_DATABASE
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET

  if (!databaseId || !collectionId) {
    return { error: "Configuration d'Appwrite manquante." }
  }

  return { databaseId, collectionId }
}

function revalidateTicketPaths() {
  revalidatePath('/admin')
  revalidatePath('/event')
  revalidatePath('/event/[id]', 'page')
}

export async function createTicket(payload: TicketPayload): Promise<ActionResult> {
  const config = getTicketConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), payload)

    revalidateTicketPaths()

    return { success: true }
  } catch (error) {
    console.error('Failed to create ticket', error)
    return { success: false, error: "Impossible de créer le ticket." }
  }
}

export async function updateTicket(ticketId: string, payload: Partial<TicketPayload>): Promise<ActionResult> {
  const config = getTicketConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.updateDocument(config.databaseId, config.collectionId, ticketId, payload)

    revalidateTicketPaths()

    return { success: true }
  } catch (error) {
    console.error('Failed to update ticket', error)
    return { success: false, error: "Impossible de mettre à jour le ticket." }
  }
}

export async function deleteTicket(ticketId: string): Promise<ActionResult> {
  const config = getTicketConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.deleteDocument(config.databaseId, config.collectionId, ticketId)

    revalidateTicketPaths()

    return { success: true }
  } catch (error) {
    console.error('Failed to delete ticket', error)
    return { success: false, error: "Impossible de supprimer le ticket." }
  }
}
