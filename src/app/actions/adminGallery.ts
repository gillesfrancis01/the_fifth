'use server'

import { revalidatePath } from 'next/cache'
import { ID } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { createAdminClient } from '../../../config/appwrite'
import { requireAdminSession } from '@/utils/adminAuth'

interface GalleryPayload {
  event: string
  images: string[]
  video?: string | null
}

interface ActionResult {
  success: boolean
  error?: string
}

function getGalleryConfig() {
  const databaseId = process.env.NEXT_PUBLIC_DATABASE
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GALLERY

  if (!databaseId || !collectionId) {
    return { error: "Configuration d'Appwrite manquante pour la galerie." }
  }

  return { databaseId, collectionId }
}

function revalidateGalleryPaths() {
  revalidatePath('/admin')
  revalidatePath('/gallery')
}

export async function createGallery(payload: GalleryPayload): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getGalleryConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), {
      event: payload.event,
      images: payload.images,
      video: payload.video || null,
    })

    revalidateGalleryPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to create gallery document', error)
    return { success: false, error: "Impossible de créer la galerie." }
  }
}

export async function updateGallery(galleryId: string, payload: Partial<GalleryPayload>): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getGalleryConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.updateDocument(config.databaseId, config.collectionId, galleryId, {
      event: payload.event,
      images: payload.images,
      video: payload.video || null,
    })

    revalidateGalleryPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to update gallery document', error)
    return { success: false, error: "Impossible de modifier la galerie." }
  }
}

export async function deleteGallery(galleryId: string): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getGalleryConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.deleteDocument(config.databaseId, config.collectionId, galleryId)

    revalidateGalleryPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to delete gallery document', error)
    return { success: false, error: "Impossible de supprimer la galerie." }
  }
}

export async function uploadGalleryImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { success: false, error: 'Aucun fichier fourni.' }
  }

  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKETS_EVENT
  const databaseId = process.env.NEXT_PUBLIC_DATABASE
  if (!bucketId || !databaseId) {
    return { success: false, error: "Configuration d'Appwrite manquante." }
  }

  try {
    const { storage } = await createAdminClient()

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const inputFile = InputFile.fromBuffer(buffer, file.name)

    const uploadResult = await storage.createFile(bucketId, ID.unique(), inputFile)

    // Return the file ID so it integrates nicely with the transformImageURL helper on the public page
    return { success: true, url: uploadResult.$id }
  } catch (error) {
    console.error('Failed to upload gallery image to Appwrite', error)
    return { success: false, error: "Impossible d'uploader l'image." }
  }
}
