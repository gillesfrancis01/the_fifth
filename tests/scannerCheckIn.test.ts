import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { searchReservationsForEvent } from '../src/app/actions/scannerCheckIn'

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
    limit: (value: number) => `limit(${value})`,
  },
}))

const mockGetCheckInActor = vi.fn()
vi.mock('@/utils/scannerAuth', () => ({
  getCheckInActor: () => mockGetCheckInActor(),
}))

describe('searchReservationsForEvent', () => {
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

    expect(await searchReservationsForEvent('jeanne', 'event-1')).toEqual([])
    expect(mockListDocuments).not.toHaveBeenCalled()
  })

  it('returns an empty array for a blank query', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })

    expect(await searchReservationsForEvent('   ')).toEqual([])
    expect(mockListDocuments).not.toHaveBeenCalled()
  })

  it('returns an empty array when the event has no reservations', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockListDocuments.mockResolvedValueOnce({ documents: [] })

    expect(await searchReservationsForEvent('jeanne', 'event-1')).toEqual([])
  })

  it("scopes the search to the scanner's event regardless of the eventId argument", async () => {
    mockGetCheckInActor.mockResolvedValueOnce({
      type: 'scanner',
      scannerId: 's1',
      eventId: 'event-1',
      name: 'Porte 1',
    })
    mockListDocuments.mockResolvedValueOnce({
      documents: [{ $id: 'reservation-1', customer_ID: 'customer-1', ticket_ID: 'ticket-1', available: true }],
    })
    mockListDocuments.mockResolvedValueOnce({
      documents: [{ $id: 'customer-1', fullName: 'Jeanne Tremblay', email: 'jeanne@example.com' }],
    })

    const results = await searchReservationsForEvent('jeanne', 'event-attacker-supplied')

    expect(results).toEqual([
      { reservationId: 'reservation-1', customerName: 'Jeanne Tremblay', ticketId: 'ticket-1', available: true },
    ])
    expect(mockListDocuments).toHaveBeenNthCalledWith(1, 'test-db-id', 'test-coll-reservation-id', [
      'equal(event_ID,event-1)',
      'limit(1000)',
    ])
  })

  it('requests enough reservations per page to cover events with more than the Appwrite default of 25', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({
      type: 'scanner',
      scannerId: 's1',
      eventId: 'event-1',
      name: 'Porte 1',
    })
    mockListDocuments.mockResolvedValueOnce({ documents: [] })

    await searchReservationsForEvent('jeanne', 'event-1')

    const reservationQueryArgs = mockListDocuments.mock.calls[0][2] as string[]
    expect(reservationQueryArgs.some((q) => q.startsWith('limit('))).toBe(true)
  })

  it('matches a customer by partial first name, case-insensitive', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockListDocuments.mockResolvedValueOnce({
      documents: [
        { $id: 'reservation-1', customer_ID: 'customer-1', ticket_ID: 'ticket-1', available: true },
        { $id: 'reservation-2', customer_ID: 'customer-2', ticket_ID: 'ticket-2', available: true },
      ],
    })
    mockListDocuments.mockResolvedValueOnce({
      documents: [
        { $id: 'customer-1', fullName: 'Jeanne Tremblay', email: 'jeanne@example.com' },
        { $id: 'customer-2', fullName: 'Marc Gagnon', email: 'marc@example.com' },
      ],
    })

    const results = await searchReservationsForEvent('JEAN', 'event-1')

    expect(results).toEqual([
      { reservationId: 'reservation-1', customerName: 'Jeanne Tremblay', ticketId: 'ticket-1', available: true },
    ])
  })

  it('matches a customer by partial email', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockListDocuments.mockResolvedValueOnce({
      documents: [{ $id: 'reservation-1', customer_ID: 'customer-1', ticket_ID: 'ticket-1', available: true }],
    })
    mockListDocuments.mockResolvedValueOnce({
      documents: [{ $id: 'customer-1', fullName: 'Jeanne Tremblay', email: 'jeanne@example.com' }],
    })

    const results = await searchReservationsForEvent('example.com', 'event-1')

    expect(results).toHaveLength(1)
  })

  it('returns an empty array on failure', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockListDocuments.mockRejectedValueOnce(new Error('down'))

    expect(await searchReservationsForEvent('jeanne', 'event-1')).toEqual([])
  })
})
