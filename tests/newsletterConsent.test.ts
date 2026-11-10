import { vi, describe, it, expect, beforeEach } from 'vitest'
import addCustomer from '../src/app/actions/addCustomer'
import { upsertAppwriteCustomer } from '../src/app/actions/upsertAppwriteCustomer'

const mockCreateDocument = vi.fn()
const mockListDocuments = vi.fn()
const mockGetDocument = vi.fn()
const mockUpdateDocument = vi.fn()
const mockSyncToBrevo = vi.fn()

vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        createDocument: mockCreateDocument,
        listDocuments: mockListDocuments,
        getDocument: mockGetDocument,
        updateDocument: mockUpdateDocument,
      },
    }),
}))

vi.mock('node-appwrite', () => ({
  ID: { unique: () => 'mock-id' },
  Query: { equal: (f: string, v: string) => `equal(${f},${v})`, limit: (n: number) => `limit(${n})` },
}))

vi.mock('appwrite', () => ({
  Query: { equal: (f: string, v: string) => `equal(${f},${v})`, limit: (n: number) => `limit(${n})` },
}))

vi.mock('@/utils/brevo', () => ({ syncContactToBrevo: (...args: unknown[]) => mockSyncToBrevo(...args) }))
vi.mock('@/utils/sendTicketEmail', () => ({ sendTicketConfirmationEmail: vi.fn().mockResolvedValue(undefined) }))

function form(values: Record<string, string>) {
  const data = new FormData()
  Object.entries(values).forEach(([k, v]) => data.append(k, v))
  return data
}

describe('newsletter signup consent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.NEXT_PUBLIC_DATABASE = 'db'
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS = 'customers'
    mockListDocuments.mockResolvedValue({ documents: [] })
    mockSyncToBrevo.mockResolvedValue(undefined)
  })

  it('stores the address and adds it to Brevo when consent is given', async () => {
    const result = await addCustomer({}, form({ email: 'Marie@Example.com ', consent: 'on' }))

    expect(result).toEqual({ success: true })
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
    expect(mockSyncToBrevo).toHaveBeenCalledWith({ email: 'marie@example.com' })
  })

  it('refuses without consent and stores nothing', async () => {
    const result = await addCustomer({}, form({ email: 'marie@example.com' }))

    expect(result.success).toBeUndefined()
    expect(result.error).toBeTruthy()
    expect(mockCreateDocument).not.toHaveBeenCalled()
    expect(mockSyncToBrevo).not.toHaveBeenCalled()
  })
})

describe('ticket purchase newsletter opt-in', () => {
  const base = {
    fullName: 'Marie Tremblay',
    email: 'marie@example.com',
    phone: '514 555 0199',
    eventId: 'evt1',
    ticketId: 'tkt1',
    paymentIntent: 'pi_1',
    quantity: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.NEXT_PUBLIC_DATABASE = 'db'
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS = 'customers'
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION = 'reservations'
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS = 'events'
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET = 'tickets'
    mockListDocuments.mockResolvedValue({ documents: [] })
    mockCreateDocument.mockResolvedValue({ $id: 'doc1' })
    mockGetDocument.mockResolvedValue({ $id: 'x', name: 'Event', quantity: 10, price: 10, date: '2026-12-01T00:00:00.000Z' })
    mockSyncToBrevo.mockResolvedValue(undefined)
  })

  it('adds the buyer to Brevo only when they ticked the box', async () => {
    await upsertAppwriteCustomer({ ...base, newsletterConsent: true })
    expect(mockSyncToBrevo).toHaveBeenCalledWith({ email: 'marie@example.com', fullName: 'Marie Tremblay' })
  })

  it('does not add the buyer to Brevo when the box is unticked', async () => {
    await upsertAppwriteCustomer({ ...base, newsletterConsent: false })
    expect(mockSyncToBrevo).not.toHaveBeenCalled()
  })

  it('does not add the buyer to Brevo when the flag is missing (e.g. manual admin booking)', async () => {
    await upsertAppwriteCustomer(base)
    expect(mockSyncToBrevo).not.toHaveBeenCalled()
  })
})
