# Gestion manuelle des réservations (admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un admin d'ajouter manuellement une réservation (avec envoi de l'email de confirmation) et de supprimer une réservation existante, depuis la page `/admin/reservations`.

**Architecture:** Deux nouvelles actions serveur admin-only (`createManualReservation`, `deleteReservation`) dans `src/app/actions/adminReservations.ts`, gardées par `requireAdminSession()`. `createManualReservation` réutilise `upsertAppwriteCustomer` (déjà utilisé par le tunnel d'achat réel) avec un marqueur `paymentIntent: 'Ajout manuel (admin)'`. Côté UI, un nouveau composant client `ReservationManager` remplace l'usage direct de `ReservationsTable` sur la page globale de réservations : il porte le bouton d'ajout, la modale de formulaire, la bannière de résultat, et branche un bouton de suppression par ligne sur `ReservationsTable` via une prop `onDelete` optionnelle (absente sur la page par événement, qui reste inchangée et en lecture seule).

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Appwrite (node-appwrite), Vitest.

## Global Constraints

- Toute nouvelle action dans `src/app/actions/` qui touche des données admin doit appeler `requireAdminSession()` (de `@/utils/adminAuth`) en première ligne et retourner un échec explicite si la session est absente — convention déjà appliquée à `adminEvents.ts`, `adminTickets.ts`, `adminGallery.ts`, `adminProviders.ts`, `promo.ts`.
- Aucune validation de capacité restante n'est ajoutée à la création manuelle (le tunnel d'achat normal n'en fait pas non plus aujourd'hui) — voir la spec, section « Hors périmètre ».
- La page `/admin/events/[id]/reservations` reste strictement inchangée (lecture seule).
- Style de code : pas de point-virgule, imports via l'alias `@/...` quand le fichier voisin le fait déjà (cas des fichiers `admin*.ts` touchés récemment).

---

### Task 1: Actions serveur `createManualReservation` et `deleteReservation`

**Files:**
- Create: `tests/adminReservations.test.ts`
- Create: `src/app/actions/adminReservations.ts`

**Interfaces:**
- Consumes : `requireAdminSession(): Promise<boolean>` de `@/utils/adminAuth` ; `getReservationConfig(): { databaseId: string; collectionId: string } | { error: string }` de `@/utils/config` ; `createAdminClient(): Promise<{ databases: { deleteDocument: (dbId: string, collectionId: string, docId: string) => Promise<unknown> } }>` de `../../../config/appwrite` ; `upsertAppwriteCustomer(info: { fullName: string; email: string; phone: string; eventId: string; ticketId: string; paymentIntent: string; quantity: number }): Promise<void>` de `./upsertAppwriteCustomer`.
- Produces : `createManualReservation(input: { eventId: string; ticketId: string; fullName: string; email: string; phone: string; quantity: number }): Promise<{ success: boolean; error?: string }>` et `deleteReservation(reservationId: string): Promise<{ success: boolean; error?: string }>`, utilisés par le Task 3 (`ReservationManager.tsx`).

- [ ] **Step 1: Écrire les tests (ils vont échouer — le fichier d'action n'existe pas encore)**

Créer `tests/adminReservations.test.ts` :

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createManualReservation, deleteReservation } from '../src/app/actions/adminReservations'

const mockUpsertAppwriteCustomer = vi.fn()
vi.mock('../src/app/actions/upsertAppwriteCustomer', () => ({
  upsertAppwriteCustomer: (...args: any[]) => mockUpsertAppwriteCustomer(...args),
}))

const mockDeleteDocument = vi.fn()
vi.mock('../config/appwrite', () => {
  return {
    createAdminClient: () =>
      Promise.resolve({
        databases: {
          deleteDocument: mockDeleteDocument,
        },
      }),
  }
})

const mockRevalidatePath = vi.fn()
vi.mock('next/cache', () => {
  return {
    revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  }
})

const mockRequireAdminSession = vi.fn()
vi.mock('@/utils/adminAuth', () => ({
  requireAdminSession: () => mockRequireAdminSession(),
}))

describe('adminReservations actions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockRequireAdminSession.mockResolvedValue(true)
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION: 'test-coll-reservation-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createManualReservation', () => {
    const validInput = {
      eventId: 'event-1',
      ticketId: 'ticket-1',
      fullName: 'Jeanne Tremblay',
      email: 'jeanne@example.com',
      phone: '5145550000',
      quantity: 1,
    }

    it('returns an error when a required field is missing', async () => {
      const result = await createManualReservation({ ...validInput, eventId: '' })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockUpsertAppwriteCustomer).not.toHaveBeenCalled()
    })

    it('returns an error when quantity is less than 1', async () => {
      const result = await createManualReservation({ ...validInput, quantity: 0 })

      expect(result.success).toBe(false)
      expect(mockUpsertAppwriteCustomer).not.toHaveBeenCalled()
    })

    it('creates the reservation via upsertAppwriteCustomer with a manual payment marker', async () => {
      mockUpsertAppwriteCustomer.mockResolvedValueOnce(undefined)

      const result = await createManualReservation(validInput)

      expect(result).toEqual({ success: true })
      expect(mockUpsertAppwriteCustomer).toHaveBeenCalledWith({
        fullName: 'Jeanne Tremblay',
        email: 'jeanne@example.com',
        phone: '5145550000',
        eventId: 'event-1',
        ticketId: 'ticket-1',
        paymentIntent: 'Ajout manuel (admin)',
        quantity: 1,
      })
    })

    it('returns an error if upsertAppwriteCustomer throws', async () => {
      mockUpsertAppwriteCustomer.mockRejectedValueOnce(new Error('appwrite down'))

      const result = await createManualReservation(validInput)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Impossible de créer la réservation.')
    })

    it('returns "Non autorisé." when there is no admin session', async () => {
      mockRequireAdminSession.mockResolvedValueOnce(false)

      const result = await createManualReservation(validInput)

      expect(result).toEqual({ success: false, error: 'Non autorisé.' })
      expect(mockUpsertAppwriteCustomer).not.toHaveBeenCalled()
    })
  })

  describe('deleteReservation', () => {
    it('deletes the reservation document', async () => {
      mockDeleteDocument.mockResolvedValueOnce({})

      const result = await deleteReservation('reservation-1')

      expect(result).toEqual({ success: true })
      expect(mockDeleteDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-reservation-id',
        'reservation-1'
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/reservations')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/dashboard')
    })

    it('returns an error when reservationId is missing', async () => {
      const result = await deleteReservation('')

      expect(result.success).toBe(false)
      expect(mockDeleteDocument).not.toHaveBeenCalled()
    })

    it('returns an error when deletion fails', async () => {
      mockDeleteDocument.mockRejectedValueOnce(new Error('boom'))

      const result = await deleteReservation('reservation-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Impossible de supprimer la réservation.')
    })

    it('returns "Non autorisé." when there is no admin session', async () => {
      mockRequireAdminSession.mockResolvedValueOnce(false)

      const result = await deleteReservation('reservation-1')

      expect(result).toEqual({ success: false, error: 'Non autorisé.' })
      expect(mockDeleteDocument).not.toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent (module introuvable)**

Run: `npx vitest run tests/adminReservations.test.ts`
Expected: FAIL — `Cannot find module '../src/app/actions/adminReservations'`

- [ ] **Step 3: Créer l'implémentation**

Créer `src/app/actions/adminReservations.ts` :

```ts
'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '../../../config/appwrite'
import { requireAdminSession } from '@/utils/adminAuth'
import { getReservationConfig } from '@/utils/config'
import { upsertAppwriteCustomer } from './upsertAppwriteCustomer'

interface ActionResult {
  success: boolean
  error?: string
}

interface ManualReservationInput {
  eventId: string
  ticketId: string
  fullName: string
  email: string
  phone: string
  quantity: number
}

export async function createManualReservation(
  input: ManualReservationInput
): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const { eventId, ticketId, fullName, email, phone, quantity } = input

  if (!eventId || !ticketId || !fullName || !email) {
    return {
      success: false,
      error: "L'événement, le ticket, le nom et l'email sont obligatoires.",
    }
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    return { success: false, error: 'La quantité doit être un nombre supérieur ou égal à 1.' }
  }

  try {
    await upsertAppwriteCustomer({
      fullName,
      email,
      phone,
      eventId,
      ticketId,
      paymentIntent: 'Ajout manuel (admin)',
      quantity,
    })

    revalidatePath('/admin/reservations')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to create manual reservation', error)
    return { success: false, error: 'Impossible de créer la réservation.' }
  }
}

export async function deleteReservation(reservationId: string): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  if (!reservationId) {
    return { success: false, error: 'Identifiant de réservation manquant.' }
  }

  const config = getReservationConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    await databases.deleteDocument(config.databaseId, config.collectionId, reservationId)

    revalidatePath('/admin/reservations')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete reservation', error)
    return { success: false, error: 'Impossible de supprimer la réservation.' }
  }
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run tests/adminReservations.test.ts`
Expected: PASS — 8 tests (4 `createManualReservation` + 4 `deleteReservation`)

- [ ] **Step 5: Commit**

```bash
git add tests/adminReservations.test.ts src/app/actions/adminReservations.ts
git commit -m "feat: add admin actions to create and delete reservations manually"
```

---

### Task 2: Colonne « Actions » optionnelle sur `ReservationsTable`

**Files:**
- Modify: `src/components/admin/ReservationsTable.tsx`

**Interfaces:**
- Consumes : rien de nouveau.
- Produces : `ReservationsTable` accepte désormais une prop optionnelle `onDelete?: (reservationId: string) => void`. Quand elle est fournie, une colonne « Actions » avec un bouton Supprimer par ligne apparaît ; le bouton appelle `onDelete(reservation.$id)` directement (aucune confirmation ni transition dans ce composant — c'est la responsabilité de l'appelant, voir Task 3). Quand `onDelete` est absent (page par événement), le rendu est strictement identique à aujourd'hui.

- [ ] **Step 1: Modifier le composant**

Remplacer le contenu de `src/components/admin/ReservationsTable.tsx` par :

```tsx
import type { ReservationWithDetails } from '@/types/admin-dashboard'
import { formatEventDateTime } from '@/utils/eventDate'
import { formatReservationTimestamp } from '@/utils/reservations'

interface ReservationsTableProps {
  reservations: ReservationWithDetails[]
  emptyMessage?: string
  onDelete?: (reservationId: string) => void
}

export default function ReservationsTable({ reservations, emptyMessage, onDelete }: ReservationsTableProps) {
  const columnCount = onDelete ? 6 : 5

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.95)]">
      <table className="min-w-full table-fixed divide-y divide-zinc-800 text-left text-sm">
        <thead className="bg-zinc-900/70 text-xs uppercase tracking-[0.3em] text-zinc-400">
          <tr>
            <th scope="col" className="w-40 px-4 py-3">Réservation</th>
            <th scope="col" className="w-64 px-4 py-3">Client</th>
            <th scope="col" className="w-64 px-4 py-3">Événement</th>
            <th scope="col" className="w-48 px-4 py-3">Ticket</th>
            <th scope="col" className="w-56 px-4 py-3">Paiement</th>
            {onDelete && <th scope="col" className="w-28 px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {reservations.map(({ reservation, customer, event, ticket }) => (
            <tr key={reservation.$id} className="hover:bg-zinc-900/40">
              <td className="px-4 py-3 align-top font-mono text-xs text-zinc-300">
                <div className="flex flex-col gap-1 break-all">
                  <span className="font-semibold text-zinc-100">{reservation.$id}</span>
                  <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                    {formatReservationTimestamp(reservation.$createdAt)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 align-top text-sm text-zinc-200">
                <div className="flex flex-col gap-1 break-words">
                  <span className="font-medium">{customer?.fullName ?? 'Client inconnu'}</span>
                  <span className="text-xs text-zinc-400">{customer?.email ?? 'Adresse non communiquée'}</span>
                </div>
              </td>
              <td className="px-4 py-3 align-top text-sm text-zinc-200">
                <div className="flex flex-col gap-1 break-words">
                  <span>{event?.name ?? 'Événement inconnu'}</span>
                  {event && (
                    <span className="text-xs text-zinc-400">{formatEventDateTime(event.date, 'fr-FR')}</span>
                  )}
                  {event?.adresse && <span className="text-xs text-zinc-500">{event.adresse}</span>}
                </div>
              </td>
              <td className="px-4 py-3 align-top text-sm text-zinc-200">
                <div className="flex flex-col gap-1 break-words">
                  <span>{ticket?.name ?? 'Ticket inconnu'}</span>
                  {typeof ticket?.price === 'number' && (
                    <span className="text-xs text-zinc-400">
                      {ticket.price === 0 ? 'Gratuit' : ticket.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 align-top text-xs text-zinc-400">
                <div className="flex flex-col gap-1 break-all">
                  <span className="font-medium text-zinc-200">{reservation.paymentIntent}</span>
                  <span className={`text-[11px] uppercase tracking-wide font-semibold ${reservation.available !== false ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    {reservation.available !== false ? 'Disponible' : 'Utilisé'}
                  </span>
                </div>
              </td>
              {onDelete && (
                <td className="px-4 py-3 align-top">
                  <button
                    type="button"
                    onClick={() => onDelete(reservation.$id)}
                    className="inline-flex items-center justify-center rounded-full border border-red-500/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-red-300 transition hover:border-red-400 hover:text-red-200"
                  >
                    Supprimer
                  </button>
                </td>
              )}
            </tr>
          ))}
          {reservations.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="px-4 py-10 text-center text-sm text-zinc-400">
                {emptyMessage ?? 'Aucune réservation enregistrée pour le moment.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ReservationsTable.tsx
git commit -m "feat: support an optional delete action column in ReservationsTable"
```

---

### Task 3: Composant `ReservationManager`

**Files:**
- Create: `src/components/admin/ReservationManager.tsx`

**Interfaces:**
- Consumes : `createManualReservation`, `deleteReservation` (Task 1) ; `ReservationsTable` avec sa prop `onDelete` (Task 2) ; `Modal` de `@/components/ui/Modal` ; `ExportButton` de `@/components/admin/ExportButton` ; types `events` (`@/types`), `ReservationWithDetails`, `TicketWithEvent` (`@/types/admin-dashboard`).
- Produces : `export default function ReservationManager(props: { events: events[]; tickets: TicketWithEvent[]; reservations: ReservationWithDetails[]; exportData: Record<string, unknown>[]; lastReservationLabel: string })`, consommé par le Task 4 (`page.tsx`).

- [ ] **Step 1: Créer le composant**

Créer `src/components/admin/ReservationManager.tsx` :

```tsx
'use client'

import { FormEvent, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import Modal from '@/components/ui/Modal'
import ExportButton from '@/components/admin/ExportButton'
import ReservationsTable from '@/components/admin/ReservationsTable'
import type { events } from '@/types'
import type { ReservationWithDetails, TicketWithEvent } from '@/types/admin-dashboard'
import { createManualReservation, deleteReservation } from '@/app/actions/adminReservations'

interface ReservationManagerProps {
  events: events[]
  tickets: TicketWithEvent[]
  reservations: ReservationWithDetails[]
  exportData: Record<string, unknown>[]
  lastReservationLabel: string
}

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

const initialForm = {
  eventId: '',
  ticketId: '',
  fullName: '',
  email: '',
  phone: '',
  quantity: '1',
}

export default function ReservationManager({
  events,
  tickets,
  reservations,
  exportData,
  lastReservationLabel,
}: ReservationManagerProps) {
  const router = useRouter()
  const [formValues, setFormValues] = useState(() => ({ ...initialForm }))
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [banner, setBanner] = useState<FeedbackState | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!banner) {
      return
    }

    const timeout = window.setTimeout(() => setBanner(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const openCreateModal = () => {
    setFormValues({ ...initialForm })
    setFeedback(null)
    setIsModalOpen(true)
  }

  const closeCreateModal = () => {
    if (isPending) {
      return
    }
    setIsModalOpen(false)
  }

  const handleChange = (event: FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.currentTarget
    setFormValues((previous) => ({
      ...previous,
      [target.name]: target.value,
      ...(target.name === 'eventId' ? { ticketId: '' } : {}),
    }))
  }

  const ticketsForSelectedEvent = tickets.filter((ticket) => ticket.eventId === formValues.eventId)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.eventId || !formValues.ticketId || !formValues.fullName || !formValues.email) {
      setFeedback({ type: 'error', message: "L'événement, le ticket, le nom et l'email sont obligatoires." })
      return
    }

    const quantity = Number(formValues.quantity)

    if (!Number.isFinite(quantity) || quantity < 1) {
      setFeedback({ type: 'error', message: 'La quantité doit être un nombre supérieur ou égal à 1.' })
      return
    }

    startTransition(async () => {
      const result = await createManualReservation({
        eventId: formValues.eventId,
        ticketId: formValues.ticketId,
        fullName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone,
        quantity,
      })

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Impossible de créer la réservation.' })
        return
      }

      setFormValues({ ...initialForm })
      setFeedback(null)
      setIsModalOpen(false)
      setBanner({ type: 'success', message: 'Réservation créée et email de confirmation envoyé.' })
      router.refresh()
    })
  }

  const handleDelete = (reservationId: string) => {
    if (!window.confirm('Voulez-vous supprimer cette réservation ? Cette action est irréversible.')) {
      return
    }

    startTransition(async () => {
      const result = await deleteReservation(reservationId)

      if (!result.success) {
        setBanner({ type: 'error', message: result.error ?? 'Suppression impossible.' })
        return
      }

      setBanner({ type: 'success', message: 'Réservation supprimée.' })
      router.refresh()
    })
  }

  return (
    <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Historique détaillé</h3>
          <p className="text-sm text-zinc-400">Consultez l&apos;ensemble des réservations et leurs informations associées.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
          >
            Ajouter une réservation
          </button>
          <ExportButton data={exportData} filename="reservations_globales" />
          <div className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
            Dernière réservation : {lastReservationLabel}
          </div>
        </div>
      </div>

      {banner && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            banner.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {banner.message}
        </p>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeCreateModal}
        title="Nouvelle réservation"
        description="Ajoutez manuellement une réservation. Le client recevra son billet par email."
      >
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Événement</span>
              <select
                name="eventId"
                value={formValues.eventId}
                onChange={handleChange}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
                required
              >
                <option value="">Sélectionnez un événement</option>
                {events.map((event) => (
                  <option key={event.$id} value={event.$id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Ticket</span>
              <select
                name="ticketId"
                value={formValues.ticketId}
                onChange={handleChange}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
                required
                disabled={!formValues.eventId}
              >
                <option value="">
                  {formValues.eventId ? 'Sélectionnez un ticket' : "Choisissez d'abord un événement"}
                </option>
                {ticketsForSelectedEvent.map((ticket) => (
                  <option key={ticket.$id} value={ticket.$id}>
                    {ticket.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Nom complet</span>
              <input
                name="fullName"
                value={formValues.fullName}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Email</span>
              <input
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Téléphone (facultatif)</span>
              <input
                name="phone"
                value={formValues.phone}
                onChange={handleChange}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Quantité</span>
              <input
                name="quantity"
                type="number"
                min={1}
                value={formValues.quantity}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {feedback && (
              <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>{feedback.message}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 transition hover:border-white/25 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Création...' : 'Créer la réservation'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ReservationsTable reservations={reservations} onDelete={handleDelete} />
    </section>
  )
}
```

Note : `handleChange` réinitialise `ticketId` quand l'événement change, pour éviter qu'un ticket d'un autre événement reste sélectionné par erreur.

- [ ] **Step 2: Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ReservationManager.tsx
git commit -m "feat: add ReservationManager component for manual reservation add/delete"
```

---

### Task 4: Brancher `ReservationManager` dans la page admin et vérification complète

**Files:**
- Modify: `src/app/admin/(protected)/reservations/page.tsx`

**Interfaces:**
- Consumes : `ReservationManager` (Task 3), `fetchTicketsForEvents` (existe déjà dans `../loaders`, retourne déjà `ticketsWithEvent` — non utilisé actuellement sur cette page).
- Produces : rien de consommé par d'autres tâches — c'est la tâche finale.

- [ ] **Step 1: Modifier la page**

Remplacer le contenu de `src/app/admin/(protected)/reservations/page.tsx` par :

```tsx

import AdminRealtimeSync from '@/components/admin/AdminRealtimeSync'
import ReservationManager from '@/components/admin/ReservationManager'
import { fetchAdminCoreData, fetchTicketsForEvents, buildReservationsWithDetails } from '../loaders'
import { formatReservationTimestamp } from '@/utils/reservations'

export default async function AdminReservationsPage() {
  const { events, reservations, customers } = await fetchAdminCoreData()
  const { ticketMapById, totalTickets, ticketsWithEvent } = await fetchTicketsForEvents(events)

  const reservationsWithDetails = buildReservationsWithDetails(reservations, events, customers, ticketMapById)

  const completedReservations = reservationsWithDetails
  const revenue = completedReservations.reduce((total, { ticket }) => total + (ticket?.price ?? 0), 0)
  const uniqueCustomers = new Set(completedReservations.map(({ customer }) => customer?.$id).filter(Boolean)).size
  const conversionRate = totalTickets > 0 ? Math.round((completedReservations.length / totalTickets) * 100) : 0
  const lastReservation = completedReservations
    .map((item) => item.reservation.$createdAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]

  // Prepare export data (flatten objects)
  const exportData = reservationsWithDetails.map(r => ({
    ID: r.reservation.$id,
    Date: new Date(r.reservation.$createdAt ?? '').toLocaleString('fr-FR'),
    Client: r.customer?.fullName ?? 'Inconnu',
    Email: r.customer?.email ?? '',
    Evenement: r.event?.name ?? 'Inconnu',
    Ticket: r.ticket?.name ?? 'Inconnu',
    Prix: r.ticket?.price ?? 0,
    Statut: r.reservation.available !== false ? 'Disponible' : 'Utilisé',
    Paiement: r.reservation.paymentIntent
  }))

  return (
    <div className="space-y-10">
      <AdminRealtimeSync />
      <section className="space-y-6 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-zinc-950/95 p-8 shadow-[0_35px_90px_-45px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Réservations</p>
          <h2 className="text-3xl font-semibold text-white">Analysez vos ventes et sécurisez le suivi</h2>
          <p className="text-sm text-zinc-400">
            Examinez les transactions enregistrées, identifiez vos clients fidèles et assurez-vous que les paiements sont conformes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReservationMetric label="Réservations" value={completedReservations.length} helper="Confirmées sur la plateforme" />
          <ReservationMetric label="Clients uniques" value={uniqueCustomers} helper="Contacts qualifiés" />
          <ReservationMetric label="Revenus estimés" value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(revenue)} helper="Basés sur le prix des tickets" />
          <ReservationMetric label="Conversion" value={`${conversionRate}%`} helper="Réservations / tickets publiés" />
        </div>
      </section>

      <ReservationManager
        events={events}
        tickets={ticketsWithEvent}
        reservations={reservationsWithDetails}
        exportData={exportData}
        lastReservationLabel={lastReservation ? formatReservationTimestamp(lastReservation) : '—'}
      />
    </div>
  )
}

function ReservationMetric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{helper}</p>
    </div>
  )
}
```

- [ ] **Step 2: Suite de tests complète**

Run: `npx vitest run`
Expected: PASS — tous les fichiers (`dateFormat`, `promo`, `adminEvents`, `adminTickets`, `adminReservations`), 43 tests au total (35 existants + 8 nouveaux).

- [ ] **Step 3: Vérification des types et build de production**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

Run: `npm run build`
Expected: `✓ Compiled successfully`, la route `/admin/reservations` apparaît dans la liste des routes générées, aucune erreur.

- [ ] **Step 4: Vérification manuelle dans le navigateur**

Run: `npm run dev`, puis dans le navigateur :

1. Se connecter sur `/admin/login`, aller sur `/admin/reservations`.
2. Cliquer sur « Ajouter une réservation », remplir Événement + Ticket + Nom + Email (téléphone et quantité par défaut), soumettre.
3. Vérifier la bannière de succès, que la nouvelle ligne apparaît dans le tableau avec `Paiement = Ajout manuel (admin)`, et que le serveur de dev a bien tenté l'envoi de l'email de confirmation (log console serveur, pas d'erreur bloquante).
4. Cliquer sur « Supprimer » sur cette ligne, confirmer la boîte de dialogue, vérifier que la ligne disparaît après rafraîchissement.
5. Aller sur `/admin/events/[id]/reservations` pour un événement existant et vérifier que le tableau est identique à avant (pas de colonne Actions, pas de bouton d'ajout) — la page par événement ne doit pas avoir changé.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(protected)/reservations/page.tsx"
git commit -m "feat: wire manual reservation add/delete into the admin reservations page"
```
