'use server'

import { events } from '@/types'
import { createAdminClient } from '../../../config/appwrite'

async function getAllEvents(): Promise<events[] | undefined> {
  try {
    const { databases } = await createAdminClient()

    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS!
    )

    // Transformation explicite pour assurer la correspondance avec events[]
    const eventsList: events[] = response.documents.map((doc) => ({
      $id: doc.$id,
      name: (doc).name ?? '',
      description: (doc).description ?? '',
      date: (doc).date ?? '',
      adresse: (doc).adresse ?? '',
      image: (doc).image ?? '',
      // Ajoute ici d'autres propriétés si ton type events en a
    }))

    return eventsList
  } catch (error) {
    console.error('Failed to get events:', error)
    return undefined
  }
}

export default getAllEvents
