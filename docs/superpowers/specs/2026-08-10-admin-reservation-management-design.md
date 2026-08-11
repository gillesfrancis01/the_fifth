# Gestion manuelle des réservations (admin) — Design

Date : 2026-08-10
Statut : Validé

## Contexte

La page `/admin/reservations` affiche déjà l'historique complet des réservations
(`ReservationsTable`), alimenté par `getAllReservations` / `getReservationsByEvent`.
Il n'existe aujourd'hui aucun moyen, côté admin, de créer une réservation qui ne
provient pas d'un paiement Stripe réel, ni de supprimer une réservation existante
(ex. doublon, erreur de saisie, entrée test). L'objectif est d'ajouter ces deux
capacités, dans le style déjà établi par les autres gestionnaires admin
(`TicketManager`, `EventManager`, `GalleryManager`, `ProviderManager`).

## Décisions issues du brainstorming

1. **Emplacement** : uniquement la page globale `/admin/reservations`. La page
   par événement (`/admin/events/[id]/reservations`) reste en lecture seule.
2. **Identification client** : formulaire libre (nom, email, téléphone) avec
   fusion automatique par email — même logique que `upsertAppwriteCustomer`
   utilisé par le tunnel d'achat normal (si l'email existe déjà, la fiche
   client existante est mise à jour plutôt que dupliquée).
3. **Email de confirmation** : toujours envoyé, comme pour un achat réel — le
   client reçoit son billet/QR par email dès la création manuelle.

## Architecture

### Actions serveur — `src/app/actions/adminReservations.ts` (nouveau fichier)

Toutes les actions de ce fichier sont admin-only : elles appellent
`requireAdminSession()` (de `@/utils/adminAuth`) en première ligne et
retournent un résultat "non autorisé" si la session est absente — même
convention que `adminEvents.ts`, `adminTickets.ts`, etc.

```ts
export async function createManualReservation(input: {
  eventId: string
  ticketId: string
  fullName: string
  email: string
  phone: string
  quantity: number
}): Promise<{ success: boolean; error?: string }>

export async function deleteReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }>
```

- `createManualReservation` valide les champs requis (eventId, ticketId,
  fullName, email, quantity ≥ 1), puis délègue à `upsertAppwriteCustomer`
  (déjà utilisé par `processReservation`) en passant
  `paymentIntent: 'Ajout manuel (admin)'` — une chaîne lisible qui distingue
  visuellement ces réservations des vrais `payment_intent` Stripe dans le
  tableau et les exports CSV. `upsertAppwriteCustomer` gère déjà : fusion
  client par email, création d'un document de réservation par unité de
  quantité (`available: true`), et envoi de l'email de confirmation par
  réservation créée. L'appel est enveloppé dans un `try/catch` (la fonction
  actuelle ne retourne rien et lève en cas d'erreur) pour produire un
  `{ success, error }` cohérent avec le reste des actions admin.
- `deleteReservation` réutilise `getReservationConfig()` (déjà présent dans
  `src/utils/config.ts`, utilisé par `setReservationAvailability`) pour
  obtenir `databaseId`/`collectionId`, appelle
  `databases.deleteDocument(...)`, puis `revalidatePath('/admin/reservations')`
  et `revalidatePath('/admin/dashboard')` — même pattern que
  `setReservationAvailability`.

Aucune vérification de capacité restante n'est ajoutée : le tunnel d'achat
normal n'en fait pas non plus aujourd'hui (le `remaining` est calculé a
posteriori par comptage des réservations). Rester cohérent avec le
comportement existant plutôt que d'introduire une règle nouvelle et non
demandée.

### Composants UI

**`src/components/admin/ReservationManager.tsx`** (nouveau, `'use client'`)

Calqué sur `TicketManager.tsx` : bouton d'en-tête « Ajouter une réservation »
ouvrant une `Modal` (composant existant `@/components/ui/Modal`) avec un
formulaire :

| Champ | Type | Requis |
|---|---|---|
| Événement | `<select>` (liste `events`) | oui |
| Ticket | `<select>` (tickets de l'événement choisi, via `ticketsWithEvent`) | oui |
| Nom complet | texte | oui |
| Email | email | oui |
| Téléphone | texte | non |
| Quantité | nombre, min 1, défaut 1 | oui |

Soumission → `createManualReservation` via `useTransition` → en cas de
succès : fermeture de la modale, bannière de succès (« Réservation créée et
email de confirmation envoyé. »), `router.refresh()`. En cas d'échec :
message d'erreur affiché dans la modale, comme `TicketForm`.

**`src/components/admin/ReservationsTable.tsx`** (modifié)

Ajout d'une prop optionnelle :

```ts
interface ReservationsTableProps {
  reservations: ReservationWithDetails[]
  emptyMessage?: string
  onDelete?: (reservationId: string) => void  // nouveau
}
```

Quand `onDelete` est fourni, une colonne « Actions » supplémentaire s'affiche
avec un bouton Supprimer par ligne (confirmation `window.confirm`, style
identique au bouton rouge de `EditableTicketCard`). Quand `onDelete` est
`undefined` (cas de la page par événement, inchangée), la colonne n'apparaît
pas — comportement actuel préservé à l'identique.

Le composant reste un composant serveur (aucun hook) : la logique
d'interaction (transition, confirmation, appel de l'action serveur) vit dans
`ReservationManager`, qui passe une fonction `handleDelete` en tant que prop
`onDelete`. `ReservationsTable` se contente d'appeler cette fonction au clic.

### Page modifiée — `src/app/admin/(protected)/reservations/page.tsx`

- Destructure `ticketsWithEvent` en plus de `ticketMapById`/`totalTickets`
  depuis `fetchTicketsForEvents(events)` (déjà retourné par le loader
  existant, non utilisé actuellement sur cette page).
- Enveloppe la section « Historique détaillé » dans `ReservationManager`
  (qui reçoit `events`, `ticketsWithEvent`, `reservationsWithDetails`) au lieu
  d'appeler `ReservationsTable` directement — `ReservationManager` rend
  lui-même le bouton d'ajout, la modale, la bannière, et
  `ReservationsTable` avec `onDelete` branché.

## Flux de données

```
Ajout    : bouton → modale → createManualReservation()
             → upsertAppwriteCustomer() (fusion client + création réservation(s) + email)
             → router.refresh() → bannière succès
Suppression : bouton ligne → confirm() → deleteReservation()
             → databases.deleteDocument() → revalidatePath + router.refresh()
```

## Gestion d'erreurs

Pattern `{ success: boolean; error?: string }` identique aux autres actions
admin. Erreurs affichées :
- Création : dans la modale (comme `TicketForm`).
- Suppression : bannière rouge temporaire (comme le `banner` de
  `TicketManager`), le bouton reste actionnable après échec.

Session admin absente → les deux actions retournent
`{ success: false, error: 'Non autorisé.' }` sans toucher la base, cohérent
avec les autres actions admin corrigées précédemment.

## Tests

Nouveau fichier `tests/adminReservations.test.ts`, même structure que
`tests/adminTickets.test.ts` (mock de `../config/appwrite`, mock de
`@/utils/adminAuth` pour simuler une session admin valide, mock de
`node-appwrite`) :

- `createManualReservation`
  - retourne une erreur si un champ requis manque (eventId, ticketId,
    fullName, email, quantity < 1)
  - crée le nombre de réservations correspondant à `quantity`
  - retourne `{ success: false, error: 'Non autorisé.' }` si
    `requireAdminSession` résout `false` (test dédié, sans le mock global à
    `true`)
  - propage une erreur lisible si `upsertAppwriteCustomer` lève
- `deleteReservation`
  - supprime le document et retourne `{ success: true }`
  - retourne une erreur si `reservationId` est vide
  - retourne une erreur si `databases.deleteDocument` échoue
  - retourne `{ success: false, error: 'Non autorisé.' }` sans session admin

## Hors périmètre (explicitement exclu)

- Pas de vérification de capacité restante à la création manuelle (aligné sur
  le comportement actuel du tunnel d'achat).
- Pas de modification de la page par événement
  (`/admin/events/[id]/reservations`) : elle reste en lecture seule.
- Pas de "soft delete" / annulation : la suppression est définitive
  (`deleteDocument`), comme pour les autres entités admin (tickets,
  événements, galerie).
- Pas de sélection parmi des clients existants dans un menu déroulant — le
  formulaire est toujours saisie libre avec fusion par email (décision du
  brainstorming).
