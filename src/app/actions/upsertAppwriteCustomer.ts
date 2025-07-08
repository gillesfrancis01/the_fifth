'use server'

import { Query } from "appwrite"
import { createAdminClient } from "../../../config/appwrite"
import { ID } from 'node-appwrite'

interface CustomerInfo {
  fullName: string
  email: string
  phone: string
  eventId: string
  ticketId: string
  paymentIntent: string
}

export async function upsertAppwriteCustomer({
  fullName,
  email,
  phone,
  eventId,
  ticketId,
  paymentIntent,
}: CustomerInfo) {
  const { databases } = await createAdminClient()

  const dbId = process.env.NEXT_PUBLIC_DATABASE!
  const customerCol = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS!
  const reservationCol = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION!

  let customerId: string

  // Cherche un client existant
  const existingCustomers = await databases.listDocuments(dbId, customerCol, [
    Query.equal('email', email),
  ])

  if (existingCustomers.documents.length > 0) {
    const existing = existingCustomers.documents[0]
    customerId = existing.$id
    await databases.updateDocument(dbId, customerCol, customerId, {
      fullName,
      phone,
    })
  } else {
    const newCustomer = await databases.createDocument(dbId, customerCol, ID.unique(), {
      fullName,
      email,
      phone,
    })
    customerId = newCustomer.$id
  }

  const newReservation = await databases.createDocument(dbId, reservationCol, ID.unique(), {
    customer_ID: customerId,
    event_ID: eventId,
    ticket_ID: ticketId,
    paymentIntent,
  })

  console.log('Réservation créée avec succès :', newReservation.$id)
}
