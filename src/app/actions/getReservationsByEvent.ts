'use server'

import { Reservation } from '@/types'
import { createAdminClient } from '../../../config/appwrite'
import { Query } from 'node-appwrite'

export default async function getReservationsByEvent(eventId: string): Promise<Reservation[]> {
    try {
        const { databases } = await createAdminClient()

        const { documents } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION!,
            [
                Query.equal('event_ID', [eventId]),
                Query.orderDesc('$createdAt'),
                Query.limit(1000) // Support larger events
            ]
        )

        return documents as unknown as Reservation[]
    } catch (error) {
        console.error(`failed to get reservations for event ${eventId}`, error)
        return []
    }
}
