import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createEvent, updateEvent, deleteEvent, uploadEventImage } from '../src/app/actions/adminEvents'

// Mock Appwrite Config/Client
const mockCreateDocument = vi.fn()
const mockUpdateDocument = vi.fn()
const mockDeleteDocument = vi.fn()
const mockCreateFile = vi.fn()

vi.mock('../config/appwrite', () => {
  return {
    createAdminClient: () =>
      Promise.resolve({
        databases: {
          createDocument: mockCreateDocument,
          updateDocument: mockUpdateDocument,
          deleteDocument: mockDeleteDocument,
        },
        storage: {
          createFile: mockCreateFile,
        },
      }),
  }
})

vi.mock('node-appwrite', () => {
  return {
    ID: {
      unique: () => 'mock-unique-file-id',
    },
  }
})

vi.mock('node-appwrite/file', () => {
  return {
    InputFile: {
      fromBuffer: (buffer: any, filename: string) => ({ buffer, filename }),
    },
  }
})

// These actions are admin-only; simulate an authenticated admin session so
// the tests exercise the underlying business logic.
vi.mock('@/utils/adminAuth', () => ({
  requireAdminSession: () => Promise.resolve(true),
}))

// Mock NextJS cache revalidatePath
const mockRevalidatePath = vi.fn()
vi.mock('next/cache', () => {
  return {
    revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  }
})

describe('adminEvents actions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error during test runs to keep logs clean
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS: 'test-coll-id',
      NEXT_PUBLIC_APPWRITE_BUCKETS_EVENT: 'test-bucket-id',
      NEXT_PUBLIC_ENDPOINT: 'https://localhost/v1',
      NEXT_PUBLIC_APPWRITE_PROJECT: 'test-project-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createEvent', () => {
    const payload = {
      name: 'Gala Prestige',
      description: 'Soirée de luxe couture',
      date: '2026-10-15T20:00:00Z',
      adresse: 'Paris, France',
      image: 'https://example.com/gala.jpg',
      teaser: 'Le retour de l’élégance',
      description_sections: ['Section 1', 'Section 2'],
    }

    it('returns error if appwrite config is missing', async () => {
      delete process.env.NEXT_PUBLIC_DATABASE
      const result = await createEvent(payload)
      expect(result.success).toBe(false)
      expect(result.error).toBe("Configuration d'Appwrite manquante.")
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })

    it('creates an event successfully and revalidates paths', async () => {
      mockCreateDocument.mockResolvedValueOnce({ $id: 'new-event-id' })

      const result = await createEvent(payload)

      expect(result.success).toBe(true)
      expect(mockCreateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-id',
        expect.any(String),
        {
          name: payload.name,
          description: payload.description,
          date: payload.date,
          adresse: payload.adresse,
          image: payload.image,
          teaser: payload.teaser,
          description_sections: payload.description_sections,
        }
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/event')
    })

    it('returns error if database creation fails', async () => {
      mockCreateDocument.mockRejectedValueOnce(new Error('Appwrite connection timeout'))

      const result = await createEvent(payload)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Impossible de créer l'événement.")
    })

    it('automatically splits description into sections if description_sections is omitted', async () => {
      mockCreateDocument.mockResolvedValueOnce({ $id: 'new-event-id' })

      const multiParagraphPayload = {
        name: 'Gala Prestige',
        description: 'First paragraph.\n\nSecond paragraph.\n  \nThird paragraph.',
        date: '2026-10-15T20:00:00Z',
        adresse: 'Paris, France',
        image: 'https://example.com/gala.jpg',
        teaser: 'Le teaser',
      }

      const result = await createEvent(multiParagraphPayload)

      expect(result.success).toBe(true)
      expect(mockCreateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-id',
        expect.any(String),
        expect.objectContaining({
          description_sections: ['First paragraph.', 'Second paragraph.', 'Third paragraph.'],
        })
      )
    })
  })

  describe('updateEvent', () => {
    const eventId = 'existing-event-id'
    const updatePayload = {
      name: 'Gala Prestige Modifié',
      adresse: 'Monaco',
    }

    it('updates an event successfully and revalidates paths', async () => {
      mockUpdateDocument.mockResolvedValueOnce({ $id: eventId })

      const result = await updateEvent(eventId, updatePayload)

      expect(result.success).toBe(true)
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-id',
        eventId,
        updatePayload
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    })

    it('returns error if database update fails', async () => {
      mockUpdateDocument.mockRejectedValueOnce(new Error('Update denied'))

      const result = await updateEvent(eventId, updatePayload)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Impossible de mettre à jour l'événement.")
    })

    it('automatically splits description into sections if updated without description_sections', async () => {
      mockUpdateDocument.mockResolvedValueOnce({ $id: eventId })

      const updatePayloadWithDescription = {
        description: 'Paragraph 1.\n\nParagraph 2.',
      }

      const result = await updateEvent(eventId, updatePayloadWithDescription)

      expect(result.success).toBe(true)
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-id',
        eventId,
        expect.objectContaining({
          description_sections: ['Paragraph 1.', 'Paragraph 2.'],
        })
      )
    })
  })

  describe('deleteEvent', () => {
    const eventId = 'event-to-delete-id'

    it('deletes an event successfully and revalidates paths', async () => {
      mockDeleteDocument.mockResolvedValueOnce({})

      const result = await deleteEvent(eventId)

      expect(result.success).toBe(true)
      expect(mockDeleteDocument).toHaveBeenCalledWith('test-db-id', 'test-coll-id', eventId)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    })

    it('returns error if database deletion fails', async () => {
      mockDeleteDocument.mockRejectedValueOnce(new Error('Delete denied'))

      const result = await deleteEvent(eventId)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Impossible de supprimer l'événement.")
    })
  })

  describe('uploadEventImage', () => {
    it('returns error if no file is provided', async () => {
      const formData = new FormData()
      const result = await uploadEventImage(formData)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Aucun fichier fourni.')
    })

    it('returns error if appwrite config is missing', async () => {
      delete process.env.NEXT_PUBLIC_APPWRITE_BUCKETS_EVENT
      const formData = new FormData()
      formData.append('file', new File(['content'], 'image.jpg', { type: 'image/jpeg' }))

      const result = await uploadEventImage(formData)
      expect(result.success).toBe(false)
      expect(result.error).toBe("Configuration d'Appwrite manquante.")
    })

    it('uploads a file successfully and returns the access URL', async () => {
      mockCreateFile.mockResolvedValueOnce({ $id: 'uploaded-file-id' })

      const formData = new FormData()
      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const result = await uploadEventImage(formData)

      expect(result.success).toBe(true)
      expect(result.url).toBe(
        'https://localhost/v1/storage/buckets/test-bucket-id/files/uploaded-file-id/view?project=test-project-id&mode=admin'
      )
      expect(mockCreateFile).toHaveBeenCalledWith(
        'test-bucket-id',
        'mock-unique-file-id',
        expect.any(Object)
      )
    })

    it('returns error if file upload to storage fails', async () => {
      mockCreateFile.mockRejectedValueOnce(new Error('Storage quota exceeded'))

      const formData = new FormData()
      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const result = await uploadEventImage(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Impossible d'uploader l'image.")
    })
  })
})
