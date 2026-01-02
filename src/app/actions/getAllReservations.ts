'use server'

import { Reservation } from '@/types'
import { createAdminClient } from '../../../config/appwrite'

import { Query } from 'node-appwrite'

export default async function getAllReservations(): Promise<Reservation[]> {
  try {
    const { databases } = await createAdminClient()

    const { documents } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION!,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    )

    return documents as unknown as Reservation[]
  } catch (error) {
    console.error('failed to get reservations', error)
    return []
  }
}
