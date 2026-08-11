import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { findReservationsByEmailForEvent } from '../src/app/actions/scannerCheckIn'

const mockListDocuments = vi.fn()
vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        listDocuments: mockListDocuments,
      },
    }),
}))

vi.mock('node-appwrite', () => ({
  Query: {
    equal: (field: string, value: any) => `equal(${field},${value})`,
  },
}))

const mockGetCheckInActor = vi.fn()
vi.mock('@/utils/scannerAuth', () => ({
  getCheckInActor: () => mockGetCheckInActor(),
}))

describe('findReservationsByEmailForEvent', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION: 'test-coll-reservation-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS: 'test-coll-customers-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns an empty array without a valid actor', async () => {
    mockGetCheckInActor.mockResolvedValueOnce(null)

    expect(await findReservationsByEmailForEvent('a@b.com', 'event-1')).toEqual([])
    expect(mockListDocuments).not.toHaveBeenCalled()
  })

  it('returns an empty array when no customer matches the email', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockListDocuments.mockResolvedValueOnce({ documents: [] })

    expect(await findReservationsByEmailForEvent('a@b.com')).toEqual([])
  })

  it("scopes the search to the scanner's event regardless of the eventId argument", async () => {
    mockGetCheckInActor.mockResolvedValueOnce({
      type: 'scanner',
      scannerId: 's1',
      eventId: 'event-1',
      name: 'Porte 1',
    })
    mockListDocuments.mockResolvedValueOnce({ documents: [{ $id: 'customer-1', fullName: 'Jeanne Tremblay' }] })
    mockListDocuments.mockResolvedValueOnce({
      documents: [{ $id: 'reservation-1', ticket_ID: 'ticket-1', available: true }],
    })

    const results = await findReservationsByEmailForEvent('jeanne@example.com', 'event-attacker-supplied')

    expect(results).toEqual([
      { reservationId: 'reservation-1', customerName: 'Jeanne Tremblay', ticketId: 'ticket-1', available: true },
    ])
    expect(mockListDocuments).toHaveBeenNthCalledWith(2, 'test-db-id', 'test-coll-reservation-id', [
      'equal(customer_ID,customer-1)',
      'equal(event_ID,event-1)',
    ])
  })

  it('returns an empty array on failure', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockListDocuments.mockRejectedValueOnce(new Error('down'))

    expect(await findReservationsByEmailForEvent('a@b.com')).toEqual([])
  })
})
