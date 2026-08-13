import { describe, it, expect } from 'vitest'
import { formatReservationTimestamp } from '../src/utils/reservations'

describe('formatReservationTimestamp', () => {
  it('formats the timestamp pinned to UTC, independent of the host timezone (prevents SSR/CSR hydration mismatch)', () => {
    const value = '2024-06-15T14:30:00Z'

    const expected = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(value))

    expect(formatReservationTimestamp(value)).toBe(expected)
  })

  it('returns "Date inconnue" for a missing or invalid value', () => {
    expect(formatReservationTimestamp(undefined)).toBe('Date inconnue')
    expect(formatReservationTimestamp('not-a-date')).toBe('Date inconnue')
  })
})
