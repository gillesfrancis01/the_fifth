import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock Appwrite Config/Client
const mockListDocuments = vi.fn()
const mockCreateDocument = vi.fn()
const mockUpdateDocument = vi.fn()
const mockDeleteDocument = vi.fn()

vi.mock('../config/appwrite', () => {
  return {
    createAdminClient: () =>
      Promise.resolve({
        databases: {
          listDocuments: mockListDocuments,
          createDocument: mockCreateDocument,
          updateDocument: mockUpdateDocument,
          deleteDocument: mockDeleteDocument,
        },
      }),
  }
})

vi.mock('node-appwrite', () => {
  return {
    ID: {
      unique: () => 'mock-unique-id',
    },
    Query: {
      orderDesc: (field: string) => `orderDesc(${field})`,
      equal: (field: string, value: any) => `equal(${field},${value})`,
    },
  }
})

// getPromoCodes/createPromoCode/togglePromoCode/deletePromoCode are admin-only;
// simulate an authenticated admin session so the tests exercise the
// underlying business logic. verifyPromoCode stays public and unaffected.
vi.mock('@/utils/adminAuth', () => ({
  requireAdminSession: () => Promise.resolve(true),
}))

describe('promo actions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_PROMO_CODES: 'test-coll-promo-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getPromoCodes', () => {
    it('returns empty array if collection ID is missing', async () => {
      delete process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROMO_CODES
      const { getPromoCodes } = await import('../src/app/actions/promo')
      
      const result = await getPromoCodes()
      expect(result).toEqual([])
      expect(mockListDocuments).not.toHaveBeenCalled()
    })

    it('fetches promo codes sorted by createdAt desc', async () => {
      const { getPromoCodes } = await import('../src/app/actions/promo')
      const mockDocs = [{ $id: 'promo-1', code: 'PROMO10', value: 10 }]
      mockListDocuments.mockResolvedValueOnce({ documents: mockDocs })

      const result = await getPromoCodes()

      expect(result).toEqual(mockDocs)
      expect(mockListDocuments).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-promo-id',
        ['orderDesc($createdAt)']
      )
    })

    it('returns empty array if fetching throws an error', async () => {
      const { getPromoCodes } = await import('../src/app/actions/promo')
      mockListDocuments.mockRejectedValueOnce(new Error('Appwrite error'))
      const result = await getPromoCodes()
      expect(result).toEqual([])
    })
  })

  describe('createPromoCode', () => {
    const newPromo = {
      code: 'VIP50',
      value: 50,
    }

    it('returns error if code already exists', async () => {
      const { createPromoCode } = await import('../src/app/actions/promo')
      mockListDocuments.mockResolvedValueOnce({ total: 1, documents: [{ code: 'VIP50' }] })

      const result = await createPromoCode(newPromo as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Ce code existe déjà')
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })

    it('creates promo code successfully if unique', async () => {
      const { createPromoCode } = await import('../src/app/actions/promo')
      mockListDocuments.mockResolvedValueOnce({ total: 0, documents: [] })
      const createdDoc = { $id: 'mock-unique-id', code: 'VIP50', value: 50, active: true }
      mockCreateDocument.mockResolvedValueOnce(createdDoc)

      const result = await createPromoCode(newPromo as any)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(createdDoc)
      expect(mockCreateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-promo-id',
        'mock-unique-id',
        {
          code: 'VIP50',
          value: 50,
          active: true,
        }
      )
    })

    it('returns failure if creation fails', async () => {
      const { createPromoCode } = await import('../src/app/actions/promo')
      mockListDocuments.mockResolvedValueOnce({ total: 0, documents: [] })
      mockCreateDocument.mockRejectedValueOnce(new Error('Database write failure'))

      const result = await createPromoCode(newPromo as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Erreur lors de la création')
    })
  })

  describe('togglePromoCode', () => {
    it('updates active status of a promo code', async () => {
      const { togglePromoCode } = await import('../src/app/actions/promo')
      mockUpdateDocument.mockResolvedValueOnce({})

      const result = await togglePromoCode('promo-id-123', true)

      expect(result.success).toBe(true)
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-promo-id',
        'promo-id-123',
        { active: false }
      )
    })

    it('returns error if update fails', async () => {
      const { togglePromoCode } = await import('../src/app/actions/promo')
      mockUpdateDocument.mockRejectedValueOnce(new Error('Update denied'))
      const result = await togglePromoCode('promo-id-123', true)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Erreur de mise à jour')
    })
  })

  describe('deletePromoCode', () => {
    it('deletes a promo code', async () => {
      const { deletePromoCode } = await import('../src/app/actions/promo')
      mockDeleteDocument.mockResolvedValueOnce({})

      const result = await deletePromoCode('promo-id-123')

      expect(result.success).toBe(true)
      expect(mockDeleteDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-promo-id',
        'promo-id-123'
      )
    })

    it('returns error if delete fails', async () => {
      const { deletePromoCode } = await import('../src/app/actions/promo')
      mockDeleteDocument.mockRejectedValueOnce(new Error('Delete denied'))
      const result = await deletePromoCode('promo-id-123')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Impossible de supprimer')
    })
  })

  describe('verifyPromoCode', () => {
    it('returns active promo code if valid', async () => {
      const { verifyPromoCode } = await import('../src/app/actions/promo')
      const activePromo = { $id: 'promo-123', code: 'WELCOME20', value: 20, active: true }
      mockListDocuments.mockResolvedValueOnce({ documents: [activePromo] })

      const result = await verifyPromoCode('WELCOME20')

      expect(result.success).toBe(true)
      expect(result.promo).toEqual(activePromo)
      expect(mockListDocuments).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-promo-id',
        ['equal(code,WELCOME20)', 'equal(active,true)']
      )
    })

    it('returns error if no active promo code found', async () => {
      const { verifyPromoCode } = await import('../src/app/actions/promo')
      mockListDocuments.mockResolvedValueOnce({ documents: [] })

      const result = await verifyPromoCode('INVALID')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Code invalide ou expiré')
    })

    it('returns error if query throws an error', async () => {
      const { verifyPromoCode } = await import('../src/app/actions/promo')
      mockListDocuments.mockRejectedValueOnce(new Error('Connection failure'))

      const result = await verifyPromoCode('WELCOME20')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Erreur de vérification')
    })
  })
})
