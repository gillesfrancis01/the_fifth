'use server'

import { revalidatePath } from 'next/cache'
import { ID, Query } from 'node-appwrite'

import { createAdminClient } from '../../../config/appwrite'
import { requireAdminSession } from '@/utils/adminAuth'
import { hashPassword } from '@/utils/scannerAuth'
import { getScannerConfig } from '@/utils/config'
import type { Scanner, ScannerSummary } from '@/types'

interface ActionResult {
  success: boolean
  error?: string
}

interface CreateScannerInput {
  name: string
  username: string
  password: string
  eventId: string
}

export async function createScanner(input: CreateScannerInput): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const { name, username, password, eventId } = input

  if (!name || !username || !password || !eventId) {
    return { success: false, error: 'Nom, identifiant, mot de passe et événement sont obligatoires.' }
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    const existing = await databases.listDocuments(config.databaseId, config.collectionId, [
      Query.equal('username', username),
    ])

    if (existing.total > 0) {
      return { success: false, error: "Ce nom d'utilisateur existe déjà." }
    }

    const { hash, salt } = await hashPassword(password)

    await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), {
      name,
      username,
      passwordHash: hash,
      passwordSalt: salt,
      eventId,
      active: true,
    })

    revalidatePath('/admin/scanners')
    return { success: true }
  } catch (error) {
    console.error('Failed to create scanner', error)
    return { success: false, error: 'Impossible de créer le compte scanner.' }
  }
}

export async function getScanners(): Promise<ScannerSummary[]> {
  if (!(await requireAdminSession())) {
    return []
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return []
  }

  try {
    const { databases } = await createAdminClient()
    const { documents } = await databases.listDocuments(config.databaseId, config.collectionId, [
      Query.orderDesc('$createdAt'),
    ])
    return (documents as unknown as Scanner[]).map(({ passwordHash, passwordSalt, ...rest }) => rest)
  } catch (error) {
    console.error('Failed to list scanners', error)
    return []
  }
}

export async function toggleScannerActive(scannerId: string, active: boolean): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()
    await databases.updateDocument(config.databaseId, config.collectionId, scannerId, { active })
    revalidatePath('/admin/scanners')
    return { success: true }
  } catch (error) {
    console.error('Failed to toggle scanner', error)
    return { success: false, error: 'Impossible de mettre à jour le compte scanner.' }
  }
}

export async function deleteScanner(scannerId: string): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()
    await databases.deleteDocument(config.databaseId, config.collectionId, scannerId)
    revalidatePath('/admin/scanners')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete scanner', error)
    return { success: false, error: 'Impossible de supprimer le compte scanner.' }
  }
}
