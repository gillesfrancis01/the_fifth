'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Client } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)

export default function AdminRealtimeSync() {
  const router = useRouter()

  useEffect(() => {
    const databaseId = process.env.NEXT_PUBLIC_DATABASE
    const ticketCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET
    const reservationCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION

    if (!databaseId || !ticketCollectionId || !reservationCollectionId) {
      console.warn('Missing Appwrite configuration for realtime listener')
      return
    }

    const channelTickets = `databases.${databaseId}.collections.${ticketCollectionId}.documents`
    const channelReservations = `databases.${databaseId}.collections.${reservationCollectionId}.documents`

    console.log('Subscribing to realtime channels:', channelTickets, channelReservations)

    const unsubscribe = client.subscribe([channelTickets, channelReservations], (response) => {
      // Only refresh on relevant events: create, update, delete
      if (
        response.events.includes('databases.*.collections.*.documents.*.create') ||
        response.events.includes('databases.*.collections.*.documents.*.update') ||
        response.events.includes('databases.*.collections.*.documents.*.delete')
      ) {
        console.log('Realtime update received, refreshing...', response)
        router.refresh()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  return null
}
