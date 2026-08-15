import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import type { Reservation, Ticket, events, Customer } from '@/types'
import { createAdminClient } from '../../../config/appwrite'
import { getReservationConfig } from '@/utils/config'
import { setReservationAvailability } from '../actions/updateReservationAvailability'
import { getCheckInActor } from '@/utils/scannerAuth'
import { searchReservationsForEvent } from '../actions/scannerCheckIn'

export const metadata: Metadata = {
  title: 'Validation du billet | The Fifth',
}

interface ReservationDetails {
  reservation: Reservation | null
  ticket: Ticket | null
  event: events | null
  customer: Customer | null
  error?: string
}

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

function extractReservationId(idParam?: string, dataParam?: string): { reservationId?: string; error?: string } {
  if (idParam) {
    return { reservationId: idParam }
  }

  if (!dataParam) {
    return {}
  }

  try {
    const parsed = JSON.parse(dataParam) as Record<string, unknown>
    const reservationId = parsed.reservationId
    if (typeof reservationId !== 'string' || reservationId.trim() === '') {
      return { error: 'Identifiant de réservation manquant dans le code QR.' }
    }
    return { reservationId }
  } catch {
    return { error: 'Données du code QR invalides.' }
  }
}

async function fetchReservationDetails(reservationId: string): Promise<ReservationDetails> {
  const config = getReservationConfig()

  if ('error' in config) {
    return { reservation: null, ticket: null, event: null, customer: null, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()
    const reservationDoc = await databases.getDocument(config.databaseId, config.collectionId, reservationId)
    const reservation = reservationDoc as unknown as Reservation

    const eventCollection = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS
    const ticketCollection = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET
    const customerCollection = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS

    const [eventDoc, ticketDoc, customerDoc] = await Promise.all([
      eventCollection && reservation.event_ID
        ? databases.getDocument(config.databaseId, eventCollection, reservation.event_ID)
        : Promise.resolve(null),
      ticketCollection && reservation.ticket_ID
        ? databases.getDocument(config.databaseId, ticketCollection, reservation.ticket_ID)
        : Promise.resolve(null),
      customerCollection && reservation.customer_ID
        ? databases.getDocument(config.databaseId, customerCollection, reservation.customer_ID)
        : Promise.resolve(null),
    ])

    return {
      reservation,
      event: (eventDoc as events) ?? null,
      ticket: (ticketDoc as Ticket) ?? null,
      customer: (customerDoc as Customer) ?? null,
    }
  } catch (error) {
    console.error('Failed to load reservation for check-in', error)

    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: number }).code
        : undefined

    if (code === 404) {
      return { reservation: null, ticket: null, event: null, customer: null, error: 'Réservation introuvable.' }
    }

    return {
      reservation: null,
      ticket: null,
      event: null,
      customer: null,
      error: 'Impossible de charger les informations de réservation.',
    }
  }
}

async function validateReservation(formData: FormData) {
  'use server'

  const reservationId = formData.get('reservationId')
  const params = new URLSearchParams()

  if (typeof reservationId !== 'string' || reservationId.trim() === '') {
    params.set('error', 'Identifiant de réservation manquant.')
    redirect(`/check-in?${params.toString()}`)
  }

  params.set('id', reservationId as string)

  const result = await setReservationAvailability(reservationId as string, false)

  if (!result.success) {
    params.set('error', result.error ?? 'Impossible de marquer la réservation comme utilisée.')
  } else {
    params.set('status', 'validated')
  }

  redirect(`/check-in?${params.toString()}`)
}

async function searchByQuery(formData: FormData) {
  'use server'

  const query = formData.get('q')
  const params = new URLSearchParams()

  if (typeof query === 'string' && query.trim()) {
    params.set('q', query.trim())
  }

  redirect(`/check-in?${params.toString()}`)
}

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined> | undefined>
}) {
  const resolvedSearchParams = (await searchParams) ?? {}

  const idParam = getFirstValue(resolvedSearchParams.id)
  const dataParam = getFirstValue(resolvedSearchParams.data)
  const queryError = getFirstValue(resolvedSearchParams.error)
  const statusParam = getFirstValue(resolvedSearchParams.status)
  const searchQueryParam = getFirstValue(resolvedSearchParams.q)

  const actor = await getCheckInActor()

  if (!actor) {
    const redirectParams = new URLSearchParams()
    if (idParam) redirectParams.set('id', idParam)
    if (dataParam) redirectParams.set('data', dataParam)
    const currentPath = redirectParams.toString() ? `/check-in?${redirectParams.toString()}` : '/check-in'
    redirect(`/scan/login?redirect=${encodeURIComponent(currentPath)}`)
  }

  const { reservationId, error: idError } = extractReservationId(idParam, dataParam)

  let details: ReservationDetails | null = null
  let effectiveError = idError ?? queryError ?? null

  if (!idError && reservationId) {
    details = await fetchReservationDetails(reservationId)
    if (details.error) {
      effectiveError = details.error
    } else if (actor.type === 'scanner' && details.reservation && details.reservation.event_ID !== actor.eventId) {
      details = null
      effectiveError = 'Ce billet appartient à un autre événement.'
    }
  }

  let searchResults: Awaited<ReturnType<typeof searchReservationsForEvent>> = []
  if (!reservationId && searchQueryParam) {
    searchResults = await searchReservationsForEvent(
      searchQueryParam,
      actor.type === 'scanner' ? actor.eventId : undefined
    )
  }

  const reservation = details?.reservation ?? null
  const ticket = details?.ticket ?? null
  const event = details?.event ?? null
  const customer = details?.customer ?? null

  const isAvailable = reservation ? reservation.available !== false : null

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white px-6 py-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Validation du billet</h1>
          {actor.type === 'scanner' && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {actor.name}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Scannez ce billet et confirmez sa présence en le marquant comme utilisé.
        </p>

        {statusParam === 'validated' && !effectiveError && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Billet validé avec succès. L&apos;entrée de cette réservation est maintenant fermée.
          </div>
        )}

        {effectiveError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {effectiveError}
          </div>
        )}

        {!reservationId && !effectiveError && (
          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Recherche manuelle</h2>
            <p className="text-xs text-slate-500">
              Si l&apos;appareil photo ne scanne pas le billet, recherchez le client par nom, prénom ou courriel.
            </p>
            <form action={searchByQuery} className="flex gap-3">
              <input
                type="text"
                name="q"
                defaultValue={searchQueryParam ?? ''}
                placeholder="Nom, prénom ou courriel"
                required
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Rechercher
              </button>
            </form>

            {searchQueryParam && searchResults.length === 0 && (
              <p className="text-sm text-slate-500">Aucune réservation trouvée pour cette recherche.</p>
            )}

            {searchResults.length > 0 && (
              <ul className="space-y-2">
                {searchResults.map((result) => (
                  <li key={result.reservationId}>
                    <a
                      href={`/check-in?id=${result.reservationId}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm hover:border-slate-400"
                    >
                      <span>{result.customerName}</span>
                      <span className={result.available ? 'text-emerald-600' : 'text-red-600'}>
                        {result.available ? 'Valide' : 'Déjà utilisé'}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!effectiveError && reservation && (
          <div className="mt-8 space-y-6">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Détails de la réservation
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-500">Identifiant</dt>
                  <dd className="break-all font-semibold text-slate-900">{reservation.$id}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Statut</dt>
                  <dd
                    className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {isAvailable ? 'Billet valide' : 'Billet déjà utilisé'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Référence de paiement</dt>
                  <dd className="font-mono text-xs text-slate-800">{reservation.paymentIntent || '—'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Courriel</dt>
                  <dd className="text-slate-900">{customer?.email ?? '—'}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Informations complémentaires
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-500">Événement</dt>
                  <dd className="text-slate-900">{event?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Billet</dt>
                  <dd className="text-slate-900">{ticket?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Client</dt>
                  <dd className="text-slate-900">{customer?.fullName ?? '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="border-t border-slate-200 pt-6">
              {isAvailable ? (
                <form action={validateReservation} className="space-y-4">
                  <input type="hidden" name="reservationId" value={reservation.$id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Marquer le billet comme utilisé
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    Cette action désactive immédiatement le billet afin d&apos;empêcher toute réutilisation.
                  </p>
                </form>
              ) : (
                <p className="text-sm font-medium text-red-600">
                  Ce billet a déjà été utilisé. Aucune autre action n&apos;est nécessaire.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
