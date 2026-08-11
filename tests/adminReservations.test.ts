import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createManualReservation, deleteReservation } from '../src/app/actions/adminReservations'

const mockUpsertAppwriteCustomer = vi.fn()
vi.mock('../src/app/actions/upsertAppwriteCustomer', () => ({
  upsertAppwriteCustomer: (...args: any[]) => mockUpsertAppwriteCustomer(...args),
}))

const mockDeleteDocument = vi.fn()
vi.mock('../config/appwrite', () => {
  return {
    createAdminClient: () =>
      Promise.resolve({
        databases: {
          deleteDocument: mockDeleteDocument,
        },
      }),
  }
})

const mockRevalidatePath = vi.fn()
vi.mock('next/cache', () => {
  return {
    revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  }
})

const mockRequireAdminSession = vi.fn()
vi.mock('@/utils/adminAuth', () => ({
  requireAdminSession: () => mockRequireAdminSession(),
}))

describe('adminReservations actions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockRequireAdminSession.mockResolvedValue(true)
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION: 'test-coll-reservation-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createManualReservation', () => {
    const validInput = {
      eventId: 'event-1',
      ticketId: 'ticket-1',
      fullName: 'Jeanne Tremblay',
      email: 'jeanne@example.com',
      phone: '5145550000',
      quantity: 1,
    }

    it('returns an error when a required field is missing', async () => {
      const result = await createManualReservation({ ...validInput, eventId: '' })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockUpsertAppwriteCustomer).not.toHaveBeenCalled()
    })

    it('returns an error when quantity is less than 1', async () => {
      const result = await createManualReservation({ ...validInput, quantity: 0 })

      expect(result.success).toBe(false)
      expect(mockUpsertAppwriteCustomer).not.toHaveBeenCalled()
    })

    it('returns an error when quantity is not an integer', async () => {
      const result = await createManualReservation({ ...validInput, quantity: 1.5 })

      expect(result.success).toBe(false)
      expect(mockUpsertAppwriteCustomer).not.toHaveBeenCalled()
    })

    it('creates the reservation via upsertAppwriteCustomer with a manual payment marker', async () => {
      mockUpsertAppwriteCustomer.mockResolvedValueOnce(undefined)

      const result = await createManualReservation(validInput)

      expect(result).toEqual({ success: true })
      expect(mockUpsertAppwriteCustomer).toHaveBeenCalledWith({
        fullName: 'Jeanne Tremblay',
        email: 'jeanne@example.com',
        phone: '5145550000',
        eventId: 'event-1',
        ticketId: 'ticket-1',
        paymentIntent: 'Ajout manuel (admin)',
        quantity: 1,
      })
    })

    it('returns an error if upsertAppwriteCustomer throws', async () => {
      mockUpsertAppwriteCustomer.mockRejectedValueOnce(new Error('appwrite down'))

      const result = await createManualReservation(validInput)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Impossible de créer la réservation.')
    })

    it('returns "Non autorisé." when there is no admin session', async () => {
      mockRequireAdminSession.mockResolvedValueOnce(false)

      const result = await createManualReservation(validInput)

      expect(result).toEqual({ success: false, error: 'Non autorisé.' })
      expect(mockUpsertAppwriteCustomer).not.toHaveBeenCalled()
    })
  })

  describe('deleteReservation', () => {
    it('deletes the reservation document', async () => {
      mockDeleteDocument.mockResolvedValueOnce({})

      const result = await deleteReservation('reservation-1')

      expect(result).toEqual({ success: true })
      expect(mockDeleteDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-reservation-id',
        'reservation-1'
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/reservations')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/dashboard')
    })

    it('returns an error when reservationId is missing', async () => {
      const result = await deleteReservation('')

      expect(result.success).toBe(false)
      expect(mockDeleteDocument).not.toHaveBeenCalled()
    })

    it('returns an error when deletion fails', async () => {
      mockDeleteDocument.mockRejectedValueOnce(new Error('boom'))

      const result = await deleteReservation('reservation-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Impossible de supprimer la réservation.')
    })

    it('returns "Non autorisé." when there is no admin session', async () => {
      mockRequireAdminSession.mockResolvedValueOnce(false)

      const result = await deleteReservation('reservation-1')

      expect(result).toEqual({ success: false, error: 'Non autorisé.' })
      expect(mockDeleteDocument).not.toHaveBeenCalled()
    })
  })
})
