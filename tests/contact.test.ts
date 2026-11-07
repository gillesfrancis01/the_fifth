import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createContactMessage } from '../src/app/actions/contact'

const mockCreateDocument = vi.fn()
const mockFetch = vi.fn()

vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        createDocument: mockCreateDocument,
      },
    }),
}))

vi.mock('node-appwrite', () => ({
  ID: {
    unique: () => 'mock-unique-id',
  },
}))

describe('createContactMessage', () => {
  const originalEnv = process.env

  const legitPayload = {
    name: 'Marie Tremblay',
    email: 'marie@example.com',
    phone: '514 555 0199',
    subject: 'Mariage en juin',
    message: 'Bonjour, je souhaiterais un devis pour un mariage de 120 invités.',
    honeypot: '',
    formRenderedAt: Date.now() - 10000,
  }

  // Exact submission received from the bot (random mixed-case strings).
  const botPayload = {
    name: 'pTrOzHOyXSEUOWuLcOyJs',
    email: 'y.o.q.urel.e.d.a235@gmail.com',
    phone: '3526490074',
    subject: 'XPwJYoElctKufLBgPWA',
    message: 'kqmBMotXyYQFzNJjacTkRT',
    honeypot: '',
    formRenderedAt: Date.now() - 10000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockResolvedValue({ ok: true })
    mockCreateDocument.mockResolvedValue({ $id: 'new-contact-id' })
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_CONTACTS: 'test-coll-contacts-id',
      RESEND_API_KEY: 'test-resend-key',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('saves the message and notifies the admin for a legitimate submission', async () => {
    const result = await createContactMessage(legitPayload)

    expect(result.success).toBe(true)
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('accepts a short legitimate message', async () => {
    const result = await createContactMessage({ ...legitPayload, subject: null, message: 'Merci!' })

    expect(result.success).toBe(true)
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
  })

  it('silently drops the bot submission made of random strings', async () => {
    const result = await createContactMessage(botPayload)

    expect(result.success).toBe(true)
    expect(mockCreateDocument).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('silently drops the submission when the honeypot field is filled', async () => {
    const result = await createContactMessage({ ...legitPayload, honeypot: 'http://spam.example' })

    expect(result.success).toBe(true)
    expect(mockCreateDocument).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('silently drops the submission when submitted too quickly', async () => {
    const result = await createContactMessage({ ...legitPayload, formRenderedAt: Date.now() - 500 })

    expect(result.success).toBe(true)
    expect(mockCreateDocument).not.toHaveBeenCalled()
  })

  it('silently drops the submission when the action is called without the form timestamp', async () => {
    const { formRenderedAt: _omit, ...withoutTimestamp } = legitPayload
    const result = await createContactMessage(withoutTimestamp)

    expect(result.success).toBe(true)
    expect(mockCreateDocument).not.toHaveBeenCalled()
  })
})
