import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import type { Reservation, Ticket, events } from '@/types'
import { createAdminClient } from '../../../config/appwrite'
import { getReservationConfig, setReservationAvailability } from '../actions/updateReservationAvailability'

export const metadata: Metadata = {
  title: 'Validation du billet | The Fifth',
}

interface ParsedPayload {
  reservationId: string
  ticketId?: string
  eventId?: string
  customerId?: string
  email?: string
  paymentIntent?: string
}

interface ReservationDetails {
  reservation: Reservation | null
  ticket: Ticket | null
  event: events | null
  error?: string
}

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function parsePayload(rawPayload?: string): { payload?: ParsedPayload; error?: string } {
  if (!rawPayload) {
    return { error: 'Aucune donnée de billet fournie.' }
  }

  try {
    const parsed = JSON.parse(rawPayload) as Record<string, unknown>

    if (typeof parsed !== 'object' || parsed === null) {
      return { error: 'Format de données invalide.' }
    }

    const reservationId = parsed.reservationId
    if (typeof reservationId !== 'string' || reservationId.trim() === '') {
      return { error: 'Identifiant de réservation manquant dans le code QR.' }
    }

    const payload: ParsedPayload = {
      reservationId,
    }

    if (typeof parsed.ticketId === 'string') {
      payload.ticketId = parsed.ticketId
    }

    if (typeof parsed.eventId === 'string') {
      payload.eventId = parsed.eventId
    }

    if (typeof parsed.customerId === 'string') {
      payload.customerId = parsed.customerId
    }

    if (typeof parsed.email === 'string') {
      payload.email = parsed.email
    }

    if (typeof parsed.paymentIntent === 'string') {
      payload.paymentIntent = parsed.paymentIntent
    }

    return { payload }
  } catch {
    return { error: 'Données du code QR invalides.' }
  }
}

async function fetchReservationDetails(payload: ParsedPayload): Promise<ReservationDetails> {
  const config = getReservationConfig()

  if ('error' in config) {
    return { reservation: null, ticket: null, event: null, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    const eventCollection = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS
    const ticketCollection = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET

    const eventPromise: Promise<unknown> =
      payload.eventId && eventCollection
        ? databases.getDocument(config.databaseId, eventCollection, payload.eventId)
        : Promise.resolve(null)
    const ticketPromise: Promise<unknown> =
      payload.ticketId && ticketCollection
        ? databases.getDocument(config.databaseId, ticketCollection, payload.ticketId)
        : Promise.resolve(null)

    const [reservationDoc, eventDoc, ticketDoc] = await Promise.all([
      databases.getDocument(config.databaseId, config.collectionId, payload.reservationId),
      eventPromise,
      ticketPromise,
    ])

    const reservation = reservationDoc as unknown as Reservation
    const event = (eventDoc as events) ?? null
    const ticket = (ticketDoc as Ticket) ?? null

    return { reservation, ticket, event }
  } catch (error) {
    console.error('Failed to load reservation for check-in', error)

    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: number }).code
        : undefined

    if (code === 404) {
      return { reservation: null, ticket: null, event: null, error: 'Réservation introuvable.' }
    }

    return {
      reservation: null,
      ticket: null,
      event: null,
      error: 'Impossible de charger les informations de réservation.',
    }
  }
}

async function validateReservation(formData: FormData) {
  'use server'

  const reservationId = formData.get('reservationId')
  const rawPayload = formData.get('rawPayload')

  const params = new URLSearchParams()

  if (typeof rawPayload === 'string' && rawPayload) {
    params.set('data', rawPayload)
  }

  if (typeof reservationId !== 'string' || reservationId.trim() === '') {
    params.set('error', 'Identifiant de réservation manquant.')
    const url = params.toString() ? `/check-in?${params.toString()}` : '/check-in'
    redirect(url)
  }

  if (typeof rawPayload !== 'string' || rawPayload.trim() === '') {
    params.set('error', 'Données de billet manquantes.')
    const url = params.toString() ? `/check-in?${params.toString()}` : '/check-in'
    redirect(url)
  }

  const result = await setReservationAvailability(reservationId, false)

  if (!result.success) {
    if (result.error) {
      params.set('error', result.error)
    } else {
      params.set('error', 'Impossible de marquer la réservation comme utilisée.')
    }
  } else {
    params.set('status', 'validated')
  }

  const url = params.toString() ? `/check-in?${params.toString()}` : '/check-in'
  redirect(url)
}

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined> | undefined>
}) {
  const resolvedSearchParams = (await searchParams) ?? {}

  const rawData = getFirstValue(resolvedSearchParams.data)
  const queryError = getFirstValue(resolvedSearchParams.error)
  const statusParam = getFirstValue(resolvedSearchParams.status)

  const { payload, error: payloadError } = parsePayload(rawData ?? undefined)

  let details: ReservationDetails | null = null
  let effectiveError = payloadError ?? queryError ?? null

  if (!payloadError && payload) {
    details = await fetchReservationDetails(payload)
    if (details.error) {
      effectiveError = details.error
    }
  }

  const reservation = details?.reservation ?? null
  const ticket = details?.ticket ?? null
  const event = details?.event ?? null

  const isAvailable = reservation ? reservation.available !== false : null

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white px-6 py-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">Validation du billet</h1>
        <p className="mt-2 text-sm text-slate-600">
          Scannez ce billet et confirmez sa présence en le marquant comme utilisé.
        </p>

        {statusParam === 'validated' && !effectiveError && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Billet validé avec succès. L’entrée de cette réservation est maintenant fermée.
          </div>
        )}

        {effectiveError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {effectiveError}
          </div>
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
                    className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isAvailable ? 'Billet valide' : 'Billet déjà utilisé'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Référence de paiement</dt>
                  <dd className="font-mono text-xs text-slate-800">
                    {reservation.paymentIntent || payload?.paymentIntent || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Courriel</dt>
                  <dd className="text-slate-900">{payload?.email ?? '—'}</dd>
                </div>
              </dl>
            </section>

            {(event || ticket || payload?.ticketId || payload?.eventId) && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Informations complémentaires
                </h2>
                <dl className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-500">Événement</dt>
                    <dd className="text-slate-900">{event?.name ?? payload?.eventId ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Billet</dt>
                    <dd className="text-slate-900">{ticket?.name ?? payload?.ticketId ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Client</dt>
                    <dd className="text-slate-900">{payload?.customerId ?? '—'}</dd>
                  </div>
                </dl>
              </section>
            )}

            <section className="border-t border-slate-200 pt-6">
              {isAvailable ? (
                <form action={validateReservation} className="space-y-4">
                  <input type="hidden" name="reservationId" value={reservation.$id} />
                  <input type="hidden" name="rawPayload" value={rawData ?? ''} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Marquer le billet comme utilisé
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    Cette action désactive immédiatement le billet afin d’empêcher toute réutilisation.
                  </p>
                </form>
              ) : (
                <p className="text-sm font-medium text-red-600">
                  Ce billet a déjà été utilisé. Aucune autre action n’est nécessaire.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
