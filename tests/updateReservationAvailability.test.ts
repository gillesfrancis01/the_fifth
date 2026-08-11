import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setReservationAvailability } from '../src/app/actions/updateReservationAvailability'

const mockGetDocument = vi.fn()
const mockUpdateDocument = vi.fn()

vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        getDocument: mockGetDocument,
        updateDocument: mockUpdateDocument,
      },
    }),
}))

const mockRevalidatePath = vi.fn()
vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}))

const mockGetCheckInActor = vi.fn()
vi.mock('@/utils/scannerAuth', () => ({
  getCheckInActor: () => mockGetCheckInActor(),
}))

describe('setReservationAvailability', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION: 'test-coll-reservation-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns an error when there is no valid actor', async () => {
    mockGetCheckInActor.mockResolvedValueOnce(null)

    const result = await setReservationAvailability('reservation-1', false)

    expect(result).toEqual({ success: false, error: 'Non autorisé.' })
    expect(mockUpdateDocument).not.toHaveBeenCalled()
  })

  it('allows an admin actor to update any reservation without an event check', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockUpdateDocument.mockResolvedValueOnce({ $id: 'reservation-1' })

    const result = await setReservationAvailability('reservation-1', false)

    expect(result).toEqual({ success: true })
    expect(mockGetDocument).not.toHaveBeenCalled()
    expect(mockUpdateDocument).toHaveBeenCalledWith('test-db-id', 'test-coll-reservation-id', 'reservation-1', {
      available: false,
    })
  })

  it('allows a scanner actor to update a reservation within their assigned event', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({
      type: 'scanner',
      scannerId: 'scanner-1',
      eventId: 'event-1',
      name: 'Porte 1',
    })
    mockGetDocument.mockResolvedValueOnce({ $id: 'reservation-1', event_ID: 'event-1' })
    mockUpdateDocument.mockResolvedValueOnce({ $id: 'reservation-1' })

    const result = await setReservationAvailability('reservation-1', false)

    expect(result).toEqual({ success: true })
    expect(mockUpdateDocument).toHaveBeenCalled()
  })

  it('rejects a scanner actor trying to update a reservation from another event', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({
      type: 'scanner',
      scannerId: 'scanner-1',
      eventId: 'event-1',
      name: 'Porte 1',
    })
    mockGetDocument.mockResolvedValueOnce({ $id: 'reservation-1', event_ID: 'event-2' })

    const result = await setReservationAvailability('reservation-1', false)

    expect(result).toEqual({ success: false, error: 'Ce billet appartient à un autre événement.' })
    expect(mockUpdateDocument).not.toHaveBeenCalled()
  })

  it('returns an error when reservationId is missing', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })

    const result = await setReservationAvailability('', false)

    expect(result.success).toBe(false)
    expect(mockUpdateDocument).not.toHaveBeenCalled()
  })

  it('returns an error when the update fails', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockUpdateDocument.mockRejectedValueOnce(new Error('down'))

    const result = await setReservationAvailability('reservation-1', false)

    expect(result.success).toBe(false)
  })
})
