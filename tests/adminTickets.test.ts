import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTicket, updateTicket, deleteTicket } from '../src/app/actions/adminTickets'

// Mock Appwrite Config/Client
const mockCreateDocument = vi.fn()
const mockUpdateDocument = vi.fn()
const mockDeleteDocument = vi.fn()

vi.mock('../config/appwrite', () => {
  return {
    createAdminClient: () =>
      Promise.resolve({
        databases: {
          createDocument: mockCreateDocument,
          updateDocument: mockUpdateDocument,
          deleteDocument: mockDeleteDocument,
        },
      }),
  }
})

// Mock NextJS cache revalidatePath
const mockRevalidatePath = vi.fn()
vi.mock('next/cache', () => {
  return {
    revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  }
})

describe('adminTickets actions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET: 'test-coll-ticket-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createTicket', () => {
    const payload = {
      name: 'Billet VIP',
      price: 150,
      advantages: ['Accès backstage', 'Champagne offert'],
      available: true,
      event: 'event-id-123',
      quantity: 50,
    }

    it('returns error if appwrite config is missing', async () => {
      delete process.env.NEXT_PUBLIC_DATABASE
      const result = await createTicket(payload)
      expect(result.success).toBe(false)
      expect(result.error).toBe("Configuration d'Appwrite manquante.")
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })

    it('creates a ticket successfully and revalidates paths', async () => {
      mockCreateDocument.mockResolvedValueOnce({ $id: 'new-ticket-id' })

      const result = await createTicket(payload)

      expect(result.success).toBe(true)
      expect(mockCreateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-ticket-id',
        expect.any(String),
        payload
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/event')
    })

    it('returns error if database creation fails', async () => {
      mockCreateDocument.mockRejectedValueOnce(new Error('Appwrite timeout'))

      const result = await createTicket(payload)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Impossible de créer le ticket.")
    })
  })

  describe('updateTicket', () => {
    const ticketId = 'existing-ticket-id'
    const updatePayload = {
      price: 160,
    }

    it('updates a ticket successfully and revalidates paths', async () => {
      mockUpdateDocument.mockResolvedValueOnce({ $id: ticketId })

      const result = await updateTicket(ticketId, updatePayload)

      expect(result.success).toBe(true)
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-ticket-id',
        ticketId,
        updatePayload
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/event')
    })

    it('returns error if database update fails', async () => {
      mockUpdateDocument.mockRejectedValueOnce(new Error('Update denied'))

      const result = await updateTicket(ticketId, updatePayload)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Impossible de mettre à jour le ticket.")
    })
  })

  describe('deleteTicket', () => {
    const ticketId = 'ticket-to-delete-id'

    it('deletes a ticket successfully and revalidates paths', async () => {
      mockDeleteDocument.mockResolvedValueOnce({})

      const result = await deleteTicket(ticketId)

      expect(result.success).toBe(true)
      expect(mockDeleteDocument).toHaveBeenCalledWith('test-db-id', 'test-coll-ticket-id', ticketId)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/event')
    })

    it('returns error if database deletion fails', async () => {
      mockDeleteDocument.mockRejectedValueOnce(new Error('Delete denied'))

      const result = await deleteTicket(ticketId)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Impossible de supprimer le ticket.")
    })
  })
})
