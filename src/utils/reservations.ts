// timeZone fixé : sans lui, le formatage dépend du fuseau de la machine qui
// l'exécute (serveur au rendu SSR, navigateur de l'admin à l'hydratation),
// ce qui produit deux textes différents et déclenche une erreur
// d'hydratation React (#418). Même choix (UTC) que formatEventDateTime.
const reservationDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
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
