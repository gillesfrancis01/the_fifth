'use server'

import { revalidatePath } from 'next/cache'
import { ID, Query } from 'node-appwrite'
import { createAdminClient } from '../../../config/appwrite'
import type { Provider } from '@/types'

interface ProviderPayload {
  name: string
  email: string
  phone: string
  specialty: string
  portfolio: string
  eventId?: string | null
  message?: string | null
}

interface ActionResult {
  success: boolean
  error?: string
}

function getProvidersConfig() {
  const databaseId = process.env.NEXT_PUBLIC_DATABASE
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROVIDERS || 'providers'

  if (!databaseId || !collectionId) {
    return { error: "Configuration d'Appwrite manquante pour les prestataires." }
  }

  return { databaseId, collectionId }
}

function revalidateProviderPaths() {
  revalidatePath('/admin')
  revalidatePath('/admin/providers')
}

export async function createProviderApplication(payload: ProviderPayload): Promise<ActionResult> {
  const config = getProvidersConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      specialty: payload.specialty,
      portfolio: payload.portfolio,
      eventId: payload.eventId || null,
      message: payload.message || null,
      status: 'pending',
    })

    revalidateProviderPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to create provider application', error)
    return { success: false, error: "Impossible d'envoyer votre candidature. Veuillez réessayer." }
  }
}

export async function getProviderApplications(): Promise<Provider[]> {
  const config = getProvidersConfig()
  if ('error' in config) {
    console.error(config.error)
    return []
  }

  try {
    const { databases } = await createAdminClient()

    const { documents: applications } = await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      [Query.orderDesc('$createdAt')]
    )

    return applications as unknown as Provider[]
  } catch (error) {
    console.error('Failed to fetch provider applications', error)
    return []
  }
}

export async function updateProviderApplicationStatus(
  providerId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<ActionResult> {
  const config = getProvidersConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.updateDocument(config.databaseId, config.collectionId, providerId, {
      status,
    })

    revalidateProviderPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to update provider status', error)
    return { success: false, error: "Impossible de modifier le statut de la candidature." }
  }
}

export async function deleteProviderApplication(providerId: string): Promise<ActionResult> {
  const config = getProvidersConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.deleteDocument(config.databaseId, config.collectionId, providerId)

    revalidateProviderPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to delete provider application', error)
    return { success: false, error: "Impossible de supprimer la candidature." }
  }
}
