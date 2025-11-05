'use server'

import { revalidatePath } from 'next/cache'
import { ID } from 'node-appwrite'

import { createAdminClient } from '../../../config/appwrite'

interface EventPayload {
  name: string
  description: string
  date: string
  adresse: string
  image: string
  teaser: string
  description_sections: string[]
}

interface ActionResult {
  success: boolean
  error?: string
}

function getEventConfig() {
  const databaseId = process.env.NEXT_PUBLIC_DATABASE
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS

  if (!databaseId || !collectionId) {
    return { error: "Configuration d'Appwrite manquante." }
  }

  return { databaseId, collectionId }
}

function revalidateEventPaths() {
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/event')
  revalidatePath('/gallery')
  revalidatePath('/event/[id]', 'page')
}

export async function createEvent(payload: EventPayload): Promise<ActionResult> {
  const config = getEventConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), {
      name: payload.name,
      description: payload.description,
      date: payload.date,
      adresse: payload.adresse,
      image: payload.image,
      teaser: payload.teaser,
      description_sections: payload.description_sections,
    })

    revalidateEventPaths()

    return { success: true }
  } catch (error) {
    console.error('Failed to create event', error)
    return { success: false, error: "Impossible de créer l'événement." }
  }
}

export async function updateEvent(eventId: string, payload: Partial<EventPayload>): Promise<ActionResult> {
  const config = getEventConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.updateDocument(config.databaseId, config.collectionId, eventId, payload)

    revalidateEventPaths()

    return { success: true }
  } catch (error) {
    console.error('Failed to update event', error)
    return { success: false, error: "Impossible de mettre à jour l'événement." }
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const config = getEventConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.deleteDocument(config.databaseId, config.collectionId, eventId)

    revalidateEventPaths()

    return { success: true }
  } catch (error) {
    console.error('Failed to delete event', error)
    return { success: false, error: "Impossible de supprimer l'événement." }
  }
}
