const ISO_STYLE_REGEX = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))?)?$/
const EUROPEAN_STYLE_REGEX = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2})(?::(\d{1,2}))?)?$/

function parseDateParts(match: RegExpMatchArray, order: 'ymd' | 'dmy') {
  const [, part1, part2, part3, hour = '0', minute = '0'] = match

  if (order === 'ymd') {
    return {
      year: Number(part1),
      month: Number(part2) - 1,
      day: Number(part3),
      hour: Number(hour),
      minute: Number(minute),
    }
  }

  return {
    year: Number(part3),
    month: Number(part2) - 1,
    day: Number(part1),
    hour: Number(hour),
    minute: Number(minute),
  }
}

export function parseEventDate(rawValue: string | null | undefined): Date | null {
  if (!rawValue) return null

  const value = String(rawValue).trim()
  if (!value) return null

  const hasTimezone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(value)

  if (hasTimezone) {
    const directDate = new Date(value)
    if (!Number.isNaN(directDate.getTime())) {
      return directDate
    }
  }

  const isoMatch = value.match(ISO_STYLE_REGEX)
  if (isoMatch) {
    const { year, month, day, hour, minute } = parseDateParts(isoMatch, 'ymd')
    const candidate = new Date(Date.UTC(year, month, day, hour, minute))
    if (!Number.isNaN(candidate.getTime())) {
      return candidate
    }
  }

  const euroMatch = value.match(EUROPEAN_STYLE_REGEX)
  if (euroMatch) {
    const { year, month, day, hour, minute } = parseDateParts(euroMatch, 'dmy')
    const candidate = new Date(Date.UTC(year, month, day, hour, minute))
    if (!Number.isNaN(candidate.getTime())) {
      return candidate
    }
  }

  const fallbackDate = new Date(value)
  if (!Number.isNaN(fallbackDate.getTime())) {
    if (!hasTimezone) {
      return new Date(Date.UTC(
        fallbackDate.getFullYear(),
        fallbackDate.getMonth(),
        fallbackDate.getDate(),
        fallbackDate.getHours(),
        fallbackDate.getMinutes(),
        fallbackDate.getSeconds(),
        fallbackDate.getMilliseconds()
      ))
    }
    return fallbackDate
  }

  return null
}

export function formatEventDate(rawValue: string): string {
  const date = parseEventDate(rawValue)
  if (!date) {
    return rawValue
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const weekday = weekdays[date.getUTCDay()]
  const day = date.getUTCDate()
  const month = months[date.getUTCMonth()]
  const year = date.getUTCFullYear()

  return `${weekday}, ${month} ${day}, ${year}`
}

export function formatEventHour(rawValue: string): string {
  const date = parseEventDate(rawValue)
  if (!date) {
    return rawValue
  }

  let hours = date.getUTCHours()
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'

  hours = hours % 12 || 12
  const formattedHours = String(hours).padStart(2, '0')

  return `${formattedHours}:${minutes} ${ampm}`
}

export function getComparableEventDate(rawValue: string): string | null {
  const date = parseEventDate(rawValue)
  if (!date) {
    return null
  }

  return date.toISOString().split('T')[0]
}

export function formatEventDateTime(rawValue: string, locale = 'fr-CA'): string {
  const date = parseEventDate(rawValue)
  if (!date) {
    return rawValue
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(date)
  } catch {
    return date.toISOString()
  }
}
