import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createProviderApplication, getProviderApplications } from '../src/app/actions/adminProviders'

const mockCreateDocument = vi.fn()
const mockListDocuments = vi.fn()

vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        createDocument: mockCreateDocument,
        listDocuments: mockListDocuments,
      },
    }),
}))

vi.mock('node-appwrite', () => ({
  ID: {
    unique: () => 'mock-unique-id',
  },
  Query: {
    orderDesc: (field: string) => `orderDesc(${field})`,
    limit: (value: number) => `limit(${value})`,
  },
}))

vi.mock('@/utils/sendProviderEmail', () => ({
  sendProviderSubmissionEmails: vi.fn().mockResolvedValue(undefined),
  sendProviderStatusEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/utils/adminAuth', () => ({
  requireAdminSession: () => Promise.resolve(true),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('adminProviders actions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_PROVIDERS: 'test-coll-providers-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createProviderApplication', () => {
    const legitPayload = {
      name: 'DJ Golden',
      email: 'dj@example.com',
      phone: '+1 514 555 0199',
      specialty: 'DJ',
      portfolio: 'https://example.com/dj',
      eventId: null,
      message: null,
      honeypot: '',
      formRenderedAt: Date.now() - 5000,
    }

    it('creates the application when the honeypot is empty and enough time has elapsed', async () => {
      mockCreateDocument.mockResolvedValueOnce({ $id: 'new-provider-id' })

      const result = await createProviderApplication(legitPayload)

      expect(result.success).toBe(true)
      expect(mockCreateDocument).toHaveBeenCalledTimes(1)
    })

    it('silently accepts without writing to the database when the honeypot field is filled', async () => {
      const result = await createProviderApplication({ ...legitPayload, honeypot: 'http://spam.example' })

      expect(result.success).toBe(true)
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })

    it('silently accepts without writing to the database when submitted too quickly', async () => {
      const result = await createProviderApplication({ ...legitPayload, formRenderedAt: Date.now() - 500 })

      expect(result.success).toBe(true)
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })
  })

  describe('getProviderApplications', () => {
    it('requests enough applications per page to cover more than the Appwrite default of 25', async () => {
      mockListDocuments.mockResolvedValueOnce({ documents: [] })

      await getProviderApplications()

      const queryArgs = mockListDocuments.mock.calls[0][2] as string[]
      expect(queryArgs.some((q) => q.startsWith('limit('))).toBe(true)
    })
  })
})
