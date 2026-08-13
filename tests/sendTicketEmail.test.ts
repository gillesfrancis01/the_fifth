import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWithTimeout } from '../src/utils/sendTicketEmail'

describe('fetchWithTimeout', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('resolves normally when the underlying fetch responds quickly', async () => {
    const mockResponse = new Response('ok', { status: 200 })
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await fetchWithTimeout('https://example.com/image.jpg', 5000)

    expect(result).toBe(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/image.jpg',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('aborts and rejects when the underlying fetch hangs past the timeout instead of waiting forever', async () => {
    global.fetch = vi.fn((_url: string, options?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'))
        })
      })
    })

    await expect(fetchWithTimeout('https://example.com/slow-image.jpg', 50)).rejects.toThrow()
  })
})
