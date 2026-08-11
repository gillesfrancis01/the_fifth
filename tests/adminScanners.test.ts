import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createScanner, getScanners, toggleScannerActive, deleteScanner } from '../src/app/actions/adminScanners'

const mockListDocuments = vi.fn()
const mockCreateDocument = vi.fn()
const mockUpdateDocument = vi.fn()
const mockDeleteDocument = vi.fn()

vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        listDocuments: mockListDocuments,
        createDocument: mockCreateDocument,
        updateDocument: mockUpdateDocument,
        deleteDocument: mockDeleteDocument,
      },
    }),
}))

vi.mock('node-appwrite', () => ({
  ID: { unique: () => 'mock-unique-id' },
  Query: {
    orderDesc: (field: string) => `orderDesc(${field})`,
    equal: (field: string, value: any) => `equal(${field},${value})`,
  },
}))

vi.mock('@/utils/adminAuth', () => ({
  requireAdminSession: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('@/utils/scannerAuth', () => ({
  hashPassword: (password: string) => Promise.resolve({ hash: `hashed-${password}`, salt: 'mock-salt' }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: () => Promise.resolve(),
}))

describe('adminScanners actions', () => {
  const originalEnv = process.env
  const input = { name: 'Sécurité porte 1', username: 'porte1', password: 'secret123', eventId: 'event-1' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS: 'test-coll-scanners-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createScanner', () => {

    it('returns an error if the username already exists', async () => {
      mockListDocuments.mockResolvedValueOnce({ documents: [{ $id: 'existing' }], total: 1 })

      const result = await createScanner(input)

      expect(result).toEqual({ success: false, error: 'Ce nom d\'utilisateur existe déjà.' })
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })

    it('hashes the password and creates the scanner document', async () => {
      mockListDocuments.mockResolvedValueOnce({ documents: [], total: 0 })
      mockCreateDocument.mockResolvedValueOnce({ $id: 'scanner-1' })

      const result = await createScanner(input)

      expect(result).toEqual({ success: true })
      expect(mockCreateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-scanners-id',
        'mock-unique-id',
        {
          name: 'Sécurité porte 1',
          username: 'porte1',
          passwordHash: 'hashed-secret123',
          passwordSalt: 'mock-salt',
          eventId: 'event-1',
          active: true,
        }
      )
    })

    it('returns an error if creation fails', async () => {
      mockListDocuments.mockResolvedValueOnce({ documents: [], total: 0 })
      mockCreateDocument.mockRejectedValueOnce(new Error('Appwrite down'))

      const result = await createScanner(input)

      expect(result.success).toBe(false)
    })
  })

  describe('getScanners', () => {
    it('returns the scanner list without password hash/salt', async () => {
      mockListDocuments.mockResolvedValueOnce({
        documents: [
          { $id: 'scanner-1', name: 'Porte 1', username: 'porte1', passwordHash: 'secret-hash', passwordSalt: 'secret-salt', eventId: 'event-1', active: true },
        ],
      })

      const result = await getScanners()

      expect(result).toEqual([{ $id: 'scanner-1', name: 'Porte 1', username: 'porte1', eventId: 'event-1', active: true }])
      expect(result[0]).not.toHaveProperty('passwordHash')
      expect(result[0]).not.toHaveProperty('passwordSalt')
    })

    it('returns an empty array on failure', async () => {
      mockListDocuments.mockRejectedValueOnce(new Error('down'))

      expect(await getScanners()).toEqual([])
    })
  })

  describe('toggleScannerActive', () => {
    it('updates the active flag', async () => {
      mockUpdateDocument.mockResolvedValueOnce({ $id: 'scanner-1' })

      const result = await toggleScannerActive('scanner-1', false)

      expect(result).toEqual({ success: true })
      expect(mockUpdateDocument).toHaveBeenCalledWith('test-db-id', 'test-coll-scanners-id', 'scanner-1', { active: false })
    })

    it('returns an error on failure', async () => {
      mockUpdateDocument.mockRejectedValueOnce(new Error('down'))

      expect((await toggleScannerActive('scanner-1', false)).success).toBe(false)
    })
  })

  describe('deleteScanner', () => {
    it('deletes the scanner document', async () => {
      mockDeleteDocument.mockResolvedValueOnce({})

      expect(await deleteScanner('scanner-1')).toEqual({ success: true })
      expect(mockDeleteDocument).toHaveBeenCalledWith('test-db-id', 'test-coll-scanners-id', 'scanner-1')
    })

    it('returns an error on failure', async () => {
      mockDeleteDocument.mockRejectedValueOnce(new Error('down'))

      expect((await deleteScanner('scanner-1')).success).toBe(false)
    })
  })

  describe('admin session guard', () => {
    it('createScanner refuses without an admin session', async () => {
      const adminAuth = await import('@/utils/adminAuth')
      vi.mocked(adminAuth.requireAdminSession).mockResolvedValueOnce(false)

      const result = await createScanner(input)

      expect(result).toEqual({ success: false, error: 'Non autorisé.' })
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })
  })
})
