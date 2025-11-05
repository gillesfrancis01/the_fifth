const reservationDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatReservationTimestamp(value?: string) {
  if (!value) {
    return 'Date inconnue'
  }

  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return 'Date inconnue'
  }

  return reservationDateFormatter.format(new Date(timestamp))
}
