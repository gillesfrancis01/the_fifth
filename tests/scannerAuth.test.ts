import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  createScannerSessionToken,
  verifyScannerSessionToken,
  requireScannerSession,
  getCheckInActor,
} from '../src/utils/scannerAuth'

const mockGetDocument = vi.fn()
vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        getDocument: mockGetDocument,
      },
    }),
}))

const mockCookieGet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: mockCookieGet }),
}))

const mockIsValidAdminSession = vi.fn()
vi.mock('@/utils/adminAuth', () => ({
  isValidAdminSession: (token: string | undefined) => mockIsValidAdminSession(token),
}))

vi.mock('../src/utils/config', () => ({
  getScannerConfig: () => ({ databaseId: 'test-db-id', collectionId: 'test-coll-scanners-id' }),
}))

describe('scannerAuth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      SCANNER_SESSION_SECRET: 'test-secret',
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS: 'test-coll-scanners-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.useRealTimers()
  })

  describe('hashPassword / verifyPassword', () => {
    it('verifies a correct password against its own hash', async () => {
      const { hash, salt } = await hashPassword('correct-horse-battery-staple')
      expect(await verifyPassword('correct-horse-battery-staple', hash, salt)).toBe(true)
    })

    it('rejects an incorrect password', async () => {
      const { hash, salt } = await hashPassword('correct-horse-battery-staple')
      expect(await verifyPassword('wrong-password', hash, salt)).toBe(false)
    })

    it('produces different hashes for the same password with different salts', async () => {
      const first = await hashPassword('same-password')
      const second = await hashPassword('same-password')
      expect(first.salt).not.toBe(second.salt)
      expect(first.hash).not.toBe(second.hash)
    })
  })

  describe('createScannerSessionToken / verifyScannerSessionToken', () => {
    it('verifies a token it created', () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      expect(verifyScannerSessionToken(token)).toMatchObject({ scannerId: 'scanner-1', eventId: 'event-1' })
    })

    it('rejects a token with a tampered signature', () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      const [encodedPayload] = token.split('.')
      const tampered = `${encodedPayload}.0000000000000000000000000000000000000000000000000000000000000000`
      expect(verifyScannerSessionToken(tampered)).toBeNull()
    })

    it('rejects a malformed token', () => {
      expect(verifyScannerSessionToken('not-a-valid-token')).toBeNull()
    })

    it('rejects an expired token', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      const token = createScannerSessionToken('scanner-1', 'event-1')
      vi.setSystemTime(new Date('2026-01-02T00:00:00Z'))
      expect(verifyScannerSessionToken(token)).toBeNull()
    })
  })

  describe('requireScannerSession', () => {
    it('returns null when there is no cookie', async () => {
      mockCookieGet.mockReturnValue(undefined)
      expect(await requireScannerSession()).toBeNull()
    })

    it('returns null when the token is invalid', async () => {
      mockCookieGet.mockReturnValue({ value: 'garbage' })
      expect(await requireScannerSession()).toBeNull()
    })

    it('returns the scanner document for a valid, active token', async () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      mockCookieGet.mockReturnValue({ value: token })
      mockGetDocument.mockResolvedValueOnce({
        $id: 'scanner-1',
        name: 'Sécurité porte 1',
        eventId: 'event-1',
        active: true,
      })

      expect(await requireScannerSession()).toMatchObject({ $id: 'scanner-1', active: true })
    })

    it('returns null when the scanner account has been deactivated', async () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      mockCookieGet.mockReturnValue({ value: token })
      mockGetDocument.mockResolvedValueOnce({ $id: 'scanner-1', eventId: 'event-1', active: false })

      expect(await requireScannerSession()).toBeNull()
    })

    it('returns null when the stored eventId no longer matches the token', async () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      mockCookieGet.mockReturnValue({ value: token })
      mockGetDocument.mockResolvedValueOnce({ $id: 'scanner-1', eventId: 'event-2', active: true })

      expect(await requireScannerSession()).toBeNull()
    })
  })

  describe('getCheckInActor', () => {
    it('returns a scanner actor when a valid scanner session exists', async () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      mockCookieGet.mockImplementation((name: string) => (name === 'scanner-token' ? { value: token } : undefined))
      mockGetDocument.mockResolvedValueOnce({
        $id: 'scanner-1',
        name: 'Sécurité porte 1',
        eventId: 'event-1',
        active: true,
      })

      expect(await getCheckInActor()).toEqual({
        type: 'scanner',
        scannerId: 'scanner-1',
        eventId: 'event-1',
        name: 'Sécurité porte 1',
      })
    })

    it('falls back to an admin actor when there is no scanner session but a valid admin session', async () => {
      mockCookieGet.mockImplementation((name: string) => (name === 'admin-token' ? { value: 'admin-session-token' } : undefined))
      mockIsValidAdminSession.mockReturnValue(true)

      expect(await getCheckInActor()).toEqual({ type: 'admin' })
    })

    it('returns null when neither a scanner nor an admin session is valid', async () => {
      mockCookieGet.mockReturnValue(undefined)
      mockIsValidAdminSession.mockReturnValue(false)

      expect(await getCheckInActor()).toBeNull()
    })
  })
})
