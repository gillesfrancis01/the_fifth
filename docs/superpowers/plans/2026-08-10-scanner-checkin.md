# Comptes scanner & sécurisation du check-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un rôle « scanner » (comptes individuels, limités à un événement) et sécuriser le flux de check-in existant (`/check-in`, `setReservationAvailability`), aujourd'hui accessible sans aucune authentification, en corrigeant aussi le QR code du billet pour qu'il pointe vers un vrai lien.

**Architecture:** Un système d'authentification scanner indépendant de l'admin (`src/utils/scannerAuth.ts` : mots de passe hachés individuellement via `scrypt`, sessions signées via HMAC dans un cookie `scanner-token`), une collection Appwrite `scanners` gérée par un CRUD admin classique, et une fonction `getCheckInActor()` qui autorise soit un scanner (limité à son événement) soit un admin (sans restriction) à valider un billet sur `/check-in`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Appwrite (node-appwrite), module `crypto` natif de Node, Vitest.

## Global Constraints

- Toute action serveur touchant les comptes scanner côté admin appelle `requireAdminSession()` en première ligne (même convention que `adminEvents.ts` etc.).
- `setReservationAvailability` et `/check-in` exigent un acteur valide via `getCheckInActor()` — plus jamais d'accès anonyme.
- Un acteur `scanner` est limité à `actor.eventId` ; un acteur `admin` n'a aucune restriction d'événement.
- Mots de passe scanner : `scrypt` avec un sel aléatoire par compte (jamais de sha256 partagé, jamais de sel réutilisé).
- Session scanner : cookie `scanner-token`, jeton signé HMAC-SHA256 avec `SCANNER_SESSION_SECRET`, durée de vie 12h, revérifié en base (`active`) à chaque lecture — pas seulement une vérification cryptographique.
- Style de code : pas de point-virgule, imports via l'alias `@/...` quand le fichier voisin le fait déjà.
- Nouvelles variables d'environnement requises (à documenter, pas à générer) : `NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS`, `SCANNER_SESSION_SECRET`.

---

### Task 1: `scannerAuth.ts` — hachage, sessions, acteur de check-in

**Files:**
- Create: `tests/scannerAuth.test.ts`
- Create: `src/utils/scannerAuth.ts`
- Modify: `src/types/index.ts` (ajoute l'interface `Scanner`)

**Interfaces:**
- Consumes : `getScannerConfig()` de `@/utils/config` (créée au Task 2 — pour ce Task 1, mocker `@/utils/config` dans les tests plutôt que d'attendre le Task 2) ; `isValidAdminSession` de `@/utils/adminAuth` (existe déjà) ; `createAdminClient` de `../../config/appwrite` (existe déjà) ; `cookies` de `next/headers`.
- Produces : `hashPassword(password: string): Promise<{hash: string; salt: string}>`, `verifyPassword(password: string, hash: string, salt: string): Promise<boolean>`, `createScannerSessionToken(scannerId: string, eventId: string): string`, `verifyScannerSessionToken(token: string): {scannerId: string; eventId: string; exp: number} | null`, `requireScannerSession(): Promise<Scanner | null>`, `getCheckInActor(): Promise<CheckInActor | null>` où `CheckInActor = {type: 'scanner'; scannerId: string; eventId: string; name: string} | {type: 'admin'}` — tous consommés par les tâches suivantes.

- [ ] **Step 1: Ajouter le type `Scanner`**

Dans `src/types/index.ts`, ajouter (à côté des autres interfaces, par exemple après `Reservation`) :

```ts
export interface Scanner {
    $id: string
    name: string
    username: string
    passwordHash: string
    passwordSalt: string
    eventId: string
    active: boolean
    $createdAt?: string
}
```

- [ ] **Step 2: Écrire les tests (ils vont échouer — le fichier n'existe pas)**

Créer `tests/scannerAuth.test.ts` :

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  createScannerSessionToken,
  verifyScannerSessionToken,
  requireScannerSession,
  getCheckInActor,
} from '../src/utils/scannerAuth'

const mockGetDocument = vi.fn()
vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        getDocument: mockGetDocument,
      },
    }),
}))

const mockCookieGet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: mockCookieGet }),
}))

const mockIsValidAdminSession = vi.fn()
vi.mock('@/utils/adminAuth', () => ({
  isValidAdminSession: (token: string | undefined) => mockIsValidAdminSession(token),
}))

describe('scannerAuth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      SCANNER_SESSION_SECRET: 'test-secret',
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS: 'test-coll-scanners-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.useRealTimers()
  })

  describe('hashPassword / verifyPassword', () => {
    it('verifies a correct password against its own hash', async () => {
      const { hash, salt } = await hashPassword('correct-horse-battery-staple')
      expect(await verifyPassword('correct-horse-battery-staple', hash, salt)).toBe(true)
    })

    it('rejects an incorrect password', async () => {
      const { hash, salt } = await hashPassword('correct-horse-battery-staple')
      expect(await verifyPassword('wrong-password', hash, salt)).toBe(false)
    })

    it('produces different hashes for the same password with different salts', async () => {
      const first = await hashPassword('same-password')
      const second = await hashPassword('same-password')
      expect(first.salt).not.toBe(second.salt)
      expect(first.hash).not.toBe(second.hash)
    })
  })

  describe('createScannerSessionToken / verifyScannerSessionToken', () => {
    it('verifies a token it created', () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      expect(verifyScannerSessionToken(token)).toMatchObject({ scannerId: 'scanner-1', eventId: 'event-1' })
    })

    it('rejects a token with a tampered signature', () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      const [encodedPayload] = token.split('.')
      const tampered = `${encodedPayload}.0000000000000000000000000000000000000000000000000000000000000000`
      expect(verifyScannerSessionToken(tampered)).toBeNull()
    })

    it('rejects a malformed token', () => {
      expect(verifyScannerSessionToken('not-a-valid-token')).toBeNull()
    })

    it('rejects an expired token', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      const token = createScannerSessionToken('scanner-1', 'event-1')
      vi.setSystemTime(new Date('2026-01-02T00:00:00Z'))
      expect(verifyScannerSessionToken(token)).toBeNull()
    })
  })

  describe('requireScannerSession', () => {
    it('returns null when there is no cookie', async () => {
      mockCookieGet.mockReturnValue(undefined)
      expect(await requireScannerSession()).toBeNull()
    })

    it('returns null when the token is invalid', async () => {
      mockCookieGet.mockReturnValue({ value: 'garbage' })
      expect(await requireScannerSession()).toBeNull()
    })

    it('returns the scanner document for a valid, active token', async () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      mockCookieGet.mockReturnValue({ value: token })
      mockGetDocument.mockResolvedValueOnce({
        $id: 'scanner-1',
        name: 'Sécurité porte 1',
        eventId: 'event-1',
        active: true,
      })

      expect(await requireScannerSession()).toMatchObject({ $id: 'scanner-1', active: true })
    })

    it('returns null when the scanner account has been deactivated', async () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      mockCookieGet.mockReturnValue({ value: token })
      mockGetDocument.mockResolvedValueOnce({ $id: 'scanner-1', eventId: 'event-1', active: false })

      expect(await requireScannerSession()).toBeNull()
    })

    it('returns null when the stored eventId no longer matches the token', async () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      mockCookieGet.mockReturnValue({ value: token })
      mockGetDocument.mockResolvedValueOnce({ $id: 'scanner-1', eventId: 'event-2', active: true })

      expect(await requireScannerSession()).toBeNull()
    })
  })

  describe('getCheckInActor', () => {
    it('returns a scanner actor when a valid scanner session exists', async () => {
      const token = createScannerSessionToken('scanner-1', 'event-1')
      mockCookieGet.mockImplementation((name: string) => (name === 'scanner-token' ? { value: token } : undefined))
      mockGetDocument.mockResolvedValueOnce({
        $id: 'scanner-1',
        name: 'Sécurité porte 1',
        eventId: 'event-1',
        active: true,
      })

      expect(await getCheckInActor()).toEqual({
        type: 'scanner',
        scannerId: 'scanner-1',
        eventId: 'event-1',
        name: 'Sécurité porte 1',
      })
    })

    it('falls back to an admin actor when there is no scanner session but a valid admin session', async () => {
      mockCookieGet.mockImplementation((name: string) => (name === 'admin-token' ? { value: 'admin-session-token' } : undefined))
      mockIsValidAdminSession.mockReturnValue(true)

      expect(await getCheckInActor()).toEqual({ type: 'admin' })
    })

    it('returns null when neither a scanner nor an admin session is valid', async () => {
      mockCookieGet.mockReturnValue(undefined)
      mockIsValidAdminSession.mockReturnValue(false)

      expect(await getCheckInActor()).toBeNull()
    })
  })
})
```

- [ ] **Step 3: Lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run tests/scannerAuth.test.ts`
Expected: FAIL — `Cannot find module '../src/utils/scannerAuth'`

- [ ] **Step 4: Créer l'implémentation**

Créer `src/utils/scannerAuth.ts` :

```ts
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { cookies } from 'next/headers'

import { createAdminClient } from '../../config/appwrite'
import { getScannerConfig } from './config'
import { isValidAdminSession } from './adminAuth'
import type { Scanner } from '@/types'

const scrypt = promisify(scryptCallback)
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return { hash: derived.toString('hex'), salt }
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const derived = (await scrypt(password, salt, 64)) as Buffer
  const stored = Buffer.from(hash, 'hex')
  if (derived.length !== stored.length) {
    return false
  }
  return timingSafeEqual(derived, stored)
}

interface TokenPayload {
  scannerId: string
  eventId: string
  exp: number
}

function getSessionSecret(): string {
  const secret = process.env.SCANNER_SESSION_SECRET
  if (!secret) {
    throw new Error('SCANNER_SESSION_SECRET is not configured')
  }
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
}

export function createScannerSessionToken(scannerId: string, eventId: string): string {
  const payload: TokenPayload = { scannerId, eventId, exp: Date.now() + SESSION_DURATION_MS }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function verifyScannerSessionToken(token: string): TokenPayload | null {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) {
    return null
  }

  let provided: Buffer
  let expected: Buffer
  try {
    provided = Buffer.from(signature, 'hex')
    expected = Buffer.from(sign(encodedPayload), 'hex')
  } catch {
    return null
  }

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload
    if (typeof payload.scannerId !== 'string' || typeof payload.eventId !== 'string' || typeof payload.exp !== 'number') {
      return null
    }
    if (payload.exp < Date.now()) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export async function requireScannerSession(): Promise<Scanner | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('scanner-token')?.value
  if (!token) {
    return null
  }

  const payload = verifyScannerSessionToken(token)
  if (!payload) {
    return null
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return null
  }

  try {
    const { databases } = await createAdminClient()
    const scanner = (await databases.getDocument(
      config.databaseId,
      config.collectionId,
      payload.scannerId
    )) as unknown as Scanner

    if (!scanner.active || scanner.eventId !== payload.eventId) {
      return null
    }

    return scanner
  } catch (error) {
    console.error('Failed to load scanner session', error)
    return null
  }
}

export type CheckInActor =
  | { type: 'scanner'; scannerId: string; eventId: string; name: string }
  | { type: 'admin' }

export async function getCheckInActor(): Promise<CheckInActor | null> {
  const scanner = await requireScannerSession()
  if (scanner) {
    return { type: 'scanner', scannerId: scanner.$id, eventId: scanner.eventId, name: scanner.name }
  }

  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin-token')?.value
  if (isValidAdminSession(adminToken)) {
    return { type: 'admin' }
  }

  return null
}
```

Note : `getScannerConfig` (importée de `./config`) n'existe pas encore — elle est créée au Task 2. Ce fichier ne compilera/testera pas tant que le Task 2 n'est pas fait ; c'est attendu, les deux tâches sont livrées dans l'ordre du plan avant toute vérification globale. Pour ce Task 1 isolément, `npx tsc --noEmit` échouera sur cet import manquant — c'est acceptable à ce stade (voir Step 5, qui adapte l'attente en conséquence) ; les tests unitaires, eux, mockent `../config/appwrite` directement et n'ont pas besoin que `getScannerConfig` existe réellement pour s'exécuter sous Vitest (Vitest ne type-check pas).

- [ ] **Step 5: Lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run tests/scannerAuth.test.ts`
Expected: PASS — 12 tests.

Run: `npx vitest run`
Expected: PASS — tous les fichiers existants toujours verts (45 tests précédents + 12 nouveaux = 57).

- [ ] **Step 6: Commit**

```bash
git add tests/scannerAuth.test.ts src/utils/scannerAuth.ts src/types/index.ts
git commit -m "feat: add scanner password hashing, session tokens, and check-in actor resolution"
```

---

### Task 2: Configuration et CRUD admin des comptes scanner

**Files:**
- Create: `tests/adminScanners.test.ts`
- Create: `src/app/actions/adminScanners.ts`
- Modify: `src/utils/config.ts` (ajoute `getScannerConfig`)

**Interfaces:**
- Consumes : `requireAdminSession` de `@/utils/adminAuth` ; `hashPassword` de `@/utils/scannerAuth` (Task 1) ; `createAdminClient` de `../../../config/appwrite`.
- Produces : `getScannerConfig(): {databaseId: string; collectionId: string} | {error: string}` (consommée par `scannerAuth.ts` du Task 1 — désormais résolue — et par le Task 7) ; `createScanner(input: {name: string; username: string; password: string; eventId: string}): Promise<{success: boolean; error?: string}>`, `getScanners(): Promise<Scanner[]>`, `toggleScannerActive(scannerId: string, active: boolean): Promise<{success: boolean; error?: string}>`, `deleteScanner(scannerId: string): Promise<{success: boolean; error?: string}>` (consommées par le Task 5, `ScannerManager.tsx`).

- [ ] **Step 1: Ajouter `getScannerConfig` à `src/utils/config.ts`**

Ajouter à la suite du contenu existant de `src/utils/config.ts` :

```ts
export function getScannerConfig() {
    const databaseId = process.env.NEXT_PUBLIC_DATABASE
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS

    if (!databaseId || !collectionId) {
        return { error: "Configuration Appwrite manquante pour les comptes scanner." }
    }

    return { databaseId, collectionId }
}
```

- [ ] **Step 2: Vérifier que le Task 1 compile désormais**

Run: `npx tsc --noEmit`
Expected: aucune erreur (l'import de `getScannerConfig` dans `scannerAuth.ts` est maintenant résolu).

- [ ] **Step 3: Écrire les tests des actions admin (ils vont échouer)**

Créer `tests/adminScanners.test.ts` :

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createScanner, getScanners, toggleScannerActive, deleteScanner } from '../src/app/actions/adminScanners'

const mockListDocuments = vi.fn()
const mockCreateDocument = vi.fn()
const mockUpdateDocument = vi.fn()
const mockDeleteDocument = vi.fn()

vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        listDocuments: mockListDocuments,
        createDocument: mockCreateDocument,
        updateDocument: mockUpdateDocument,
        deleteDocument: mockDeleteDocument,
      },
    }),
}))

vi.mock('node-appwrite', () => ({
  ID: { unique: () => 'mock-unique-id' },
  Query: {
    orderDesc: (field: string) => `orderDesc(${field})`,
    equal: (field: string, value: any) => `equal(${field},${value})`,
  },
}))

vi.mock('@/utils/adminAuth', () => ({
  requireAdminSession: () => Promise.resolve(true),
}))

vi.mock('@/utils/scannerAuth', () => ({
  hashPassword: (password: string) => Promise.resolve({ hash: `hashed-${password}`, salt: 'mock-salt' }),
}))

describe('adminScanners actions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS: 'test-coll-scanners-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createScanner', () => {
    const input = { name: 'Sécurité porte 1', username: 'porte1', password: 'secret123', eventId: 'event-1' }

    it('returns an error if the username already exists', async () => {
      mockListDocuments.mockResolvedValueOnce({ documents: [{ $id: 'existing' }], total: 1 })

      const result = await createScanner(input)

      expect(result).toEqual({ success: false, error: 'Ce nom d\'utilisateur existe déjà.' })
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })

    it('hashes the password and creates the scanner document', async () => {
      mockListDocuments.mockResolvedValueOnce({ documents: [], total: 0 })
      mockCreateDocument.mockResolvedValueOnce({ $id: 'scanner-1' })

      const result = await createScanner(input)

      expect(result).toEqual({ success: true })
      expect(mockCreateDocument).toHaveBeenCalledWith(
        'test-db-id',
        'test-coll-scanners-id',
        'mock-unique-id',
        {
          name: 'Sécurité porte 1',
          username: 'porte1',
          passwordHash: 'hashed-secret123',
          passwordSalt: 'mock-salt',
          eventId: 'event-1',
          active: true,
        }
      )
    })

    it('returns an error if creation fails', async () => {
      mockListDocuments.mockResolvedValueOnce({ documents: [], total: 0 })
      mockCreateDocument.mockRejectedValueOnce(new Error('Appwrite down'))

      const result = await createScanner(input)

      expect(result.success).toBe(false)
    })
  })

  describe('getScanners', () => {
    it('returns the scanner list', async () => {
      mockListDocuments.mockResolvedValueOnce({ documents: [{ $id: 'scanner-1' }] })

      expect(await getScanners()).toEqual([{ $id: 'scanner-1' }])
    })

    it('returns an empty array on failure', async () => {
      mockListDocuments.mockRejectedValueOnce(new Error('down'))

      expect(await getScanners()).toEqual([])
    })
  })

  describe('toggleScannerActive', () => {
    it('updates the active flag', async () => {
      mockUpdateDocument.mockResolvedValueOnce({ $id: 'scanner-1' })

      const result = await toggleScannerActive('scanner-1', false)

      expect(result).toEqual({ success: true })
      expect(mockUpdateDocument).toHaveBeenCalledWith('test-db-id', 'test-coll-scanners-id', 'scanner-1', { active: false })
    })

    it('returns an error on failure', async () => {
      mockUpdateDocument.mockRejectedValueOnce(new Error('down'))

      expect((await toggleScannerActive('scanner-1', false)).success).toBe(false)
    })
  })

  describe('deleteScanner', () => {
    it('deletes the scanner document', async () => {
      mockDeleteDocument.mockResolvedValueOnce({})

      expect(await deleteScanner('scanner-1')).toEqual({ success: true })
      expect(mockDeleteDocument).toHaveBeenCalledWith('test-db-id', 'test-coll-scanners-id', 'scanner-1')
    })

    it('returns an error on failure', async () => {
      mockDeleteDocument.mockRejectedValueOnce(new Error('down'))

      expect((await deleteScanner('scanner-1')).success).toBe(false)
    })
  })

  describe('admin session guard', () => {
    it('createScanner refuses without an admin session', async () => {
      const { requireAdminSession } = await import('@/utils/adminAuth')
      vi.mocked(requireAdminSession).mockResolvedValueOnce(false)

      const result = await createScanner(input)

      expect(result).toEqual({ success: false, error: 'Non autorisé.' })
      expect(mockCreateDocument).not.toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run tests/adminScanners.test.ts`
Expected: FAIL — `Cannot find module '../src/app/actions/adminScanners'`

- [ ] **Step 5: Créer l'implémentation**

Créer `src/app/actions/adminScanners.ts` :

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { ID, Query } from 'node-appwrite'

import { createAdminClient } from '../../../config/appwrite'
import { requireAdminSession } from '@/utils/adminAuth'
import { hashPassword } from '@/utils/scannerAuth'
import { getScannerConfig } from '@/utils/config'
import type { Scanner } from '@/types'

interface ActionResult {
  success: boolean
  error?: string
}

interface CreateScannerInput {
  name: string
  username: string
  password: string
  eventId: string
}

export async function createScanner(input: CreateScannerInput): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const { name, username, password, eventId } = input

  if (!name || !username || !password || !eventId) {
    return { success: false, error: 'Nom, identifiant, mot de passe et événement sont obligatoires.' }
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    const existing = await databases.listDocuments(config.databaseId, config.collectionId, [
      Query.equal('username', username),
    ])

    if (existing.total > 0) {
      return { success: false, error: "Ce nom d'utilisateur existe déjà." }
    }

    const { hash, salt } = await hashPassword(password)

    await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), {
      name,
      username,
      passwordHash: hash,
      passwordSalt: salt,
      eventId,
      active: true,
    })

    revalidatePath('/admin/scanners')
    return { success: true }
  } catch (error) {
    console.error('Failed to create scanner', error)
    return { success: false, error: 'Impossible de créer le compte scanner.' }
  }
}

export async function getScanners(): Promise<Scanner[]> {
  if (!(await requireAdminSession())) {
    return []
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return []
  }

  try {
    const { databases } = await createAdminClient()
    const { documents } = await databases.listDocuments(config.databaseId, config.collectionId, [
      Query.orderDesc('$createdAt'),
    ])
    return documents as unknown as Scanner[]
  } catch (error) {
    console.error('Failed to list scanners', error)
    return []
  }
}

export async function toggleScannerActive(scannerId: string, active: boolean): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()
    await databases.updateDocument(config.databaseId, config.collectionId, scannerId, { active })
    revalidatePath('/admin/scanners')
    return { success: true }
  } catch (error) {
    console.error('Failed to toggle scanner', error)
    return { success: false, error: 'Impossible de mettre à jour le compte scanner.' }
  }
}

export async function deleteScanner(scannerId: string): Promise<ActionResult> {
  if (!(await requireAdminSession())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()
    await databases.deleteDocument(config.databaseId, config.collectionId, scannerId)
    revalidatePath('/admin/scanners')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete scanner', error)
    return { success: false, error: 'Impossible de supprimer le compte scanner.' }
  }
}
```

- [ ] **Step 6: Lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run tests/adminScanners.test.ts`
Expected: PASS — 9 tests.

Run: `npx vitest run`
Expected: PASS — tous les tests précédents + les nouveaux (57 + 9 = 66).

- [ ] **Step 7: Commit**

```bash
git add src/utils/config.ts tests/adminScanners.test.ts src/app/actions/adminScanners.ts
git commit -m "feat: add scanner account CRUD actions for admins"
```

---

### Task 3: Connexion / déconnexion scanner (API + page)

**Files:**
- Create: `src/app/api/scanner/login/route.ts`
- Create: `src/app/api/scanner/logout/route.ts`
- Create: `src/components/scan/ScannerLoginForm.tsx`
- Create: `src/app/scan/login/page.tsx`

**Interfaces:**
- Consumes : `getScannerConfig` (Task 2), `verifyPassword`/`createScannerSessionToken`/`requireScannerSession` (Task 1), `createAdminClient`.
- Produces : pose/efface le cookie `scanner-token` ; la page consomme `requireScannerSession()` pour rediriger si déjà connecté ; consommé par le Task 4 (`/scan`) et le Task 7 (redirection depuis `/check-in`).

- [ ] **Step 1: Route de connexion**

Créer `src/app/api/scanner/login/route.ts` :

```ts
import { NextResponse } from 'next/server'
import { Query } from 'node-appwrite'

import { createAdminClient } from '../../../../../config/appwrite'
import { getScannerConfig } from '@/utils/config'
import { verifyPassword, createScannerSessionToken } from '@/utils/scannerAuth'
import type { Scanner } from '@/types'

export async function POST(request: Request) {
  let username: string | undefined
  let password: string | undefined

  try {
    const body = await request.json()
    username = body?.username
    password = body?.password
  } catch {
    return NextResponse.json({ message: 'Requête invalide.' }, { status: 400 })
  }

  if (!username || !password) {
    return NextResponse.json({ message: 'Identifiant et mot de passe requis.' }, { status: 400 })
  }

  const config = getScannerConfig()
  if ('error' in config) {
    return NextResponse.json({ message: config.error }, { status: 500 })
  }

  try {
    const { databases } = await createAdminClient()
    const { documents } = await databases.listDocuments(config.databaseId, config.collectionId, [
      Query.equal('username', username),
    ])

    const scanner = documents[0] as unknown as Scanner | undefined

    if (!scanner || !scanner.active) {
      return NextResponse.json({ message: 'Identifiants incorrects.' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, scanner.passwordHash, scanner.passwordSalt)
    if (!isValid) {
      return NextResponse.json({ message: 'Identifiants incorrects.' }, { status: 401 })
    }

    const token = createScannerSessionToken(scanner.$id, scanner.eventId)
    const response = NextResponse.json({ success: true })

    response.cookies.set('scanner-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 12,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Scanner login error', error)
    return NextResponse.json({ message: 'Impossible de se connecter.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Route de déconnexion**

Créer `src/app/api/scanner/logout/route.ts` :

```ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set('scanner-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })

  return response
}
```

- [ ] **Step 3: Formulaire de connexion**

Créer `src/components/scan/ScannerLoginForm.tsx` :

```tsx
'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ScannerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/scanner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Erreur inconnue.' }))
        setError(payload?.message ?? 'Identifiants incorrects.')
        setIsSubmitting(false)
        return
      }

      const redirectTo = searchParams.get('redirect')
      const destination = redirectTo && redirectTo.startsWith('/check-in') ? redirectTo : '/scan'

      router.push(destination)
      router.refresh()
    } catch (error) {
      console.error(error)
      setError('Impossible de se connecter. Veuillez réessayer.')
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl"
    >
      <div>
        <h1 className="text-3xl font-semibold text-main">Connexion scanner</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Entrez vos identifiants pour valider les billets à l&apos;entrée.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-zinc-200">
          Identifiant
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-black px-4 py-2 text-sm outline-none transition focus:border-[#E6C55D]"
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-200">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-black px-4 py-2 text-sm outline-none transition focus:border-[#E6C55D]"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-main px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Page de connexion**

Créer `src/app/scan/login/page.tsx` :

```tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import ScannerLoginForm from '@/components/scan/ScannerLoginForm'
import { requireScannerSession } from '@/utils/scannerAuth'

export default async function ScannerLoginPage() {
  const scanner = await requireScannerSession()

  if (scanner) {
    redirect('/scan')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-24">
      <Suspense fallback={null}>
        <ScannerLoginForm />
      </Suspense>
    </div>
  )
}
```

`ScannerLoginForm` utilise `useSearchParams()` (pour lire `?redirect=`), ce que `LoginForm.tsx` (admin) ne fait pas — Next.js exige un `<Suspense>` autour de tout composant client utilisant `useSearchParams` pour ne pas dégrader le rendu statique de la page ; c'est pourquoi cette page diffère légèrement de `src/app/admin/(auth)/login/page.tsx` sur ce point précis.

- [ ] **Step 5: Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/scanner/login/route.ts src/app/api/scanner/logout/route.ts src/components/scan/ScannerLoginForm.tsx src/app/scan/login/page.tsx
git commit -m "feat: add scanner login/logout endpoints and login page"
```

---

### Task 4: Page d'accueil scanner

**Files:**
- Create: `src/components/scan/ScannerLogoutButton.tsx`
- Create: `src/app/scan/page.tsx`

**Interfaces:**
- Consumes : `requireScannerSession` (Task 1).
- Produces : rien de consommé par d'autres tâches — page terminale du parcours scanner.

- [ ] **Step 1: Bouton de déconnexion**

Créer `src/components/scan/ScannerLogoutButton.tsx` :

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ScannerLogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    if (isLoading) {
      return
    }

    setIsLoading(true)

    try {
      await fetch('/api/scanner/logout', { method: 'POST' })
      router.push('/scan/login')
      router.refresh()
    } catch (error) {
      console.error('Impossible de se déconnecter', error)
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/70 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[rgba(201,161,77,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? 'Déconnexion…' : 'Déconnexion'}
    </button>
  )
}
```

- [ ] **Step 2: Page d'accueil**

Créer `src/app/scan/page.tsx` :

```tsx
import { redirect } from 'next/navigation'

import ScannerLogoutButton from '@/components/scan/ScannerLogoutButton'
import { requireScannerSession } from '@/utils/scannerAuth'

export default async function ScannerHomePage() {
  const scanner = await requireScannerSession()

  if (!scanner) {
    redirect('/scan/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-4 py-24 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Connecté</p>
        <h1 className="text-2xl font-semibold text-white">{scanner.name}</h1>
        <p className="text-sm text-white/60">Scannez un billet avec l&apos;appareil photo pour le valider.</p>
      </div>
      <ScannerLogoutButton />
    </div>
  )
}
```

- [ ] **Step 3: Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/components/scan/ScannerLogoutButton.tsx src/app/scan/page.tsx
git commit -m "feat: add scanner landing page"
```

---

### Task 5: Gestion admin des comptes scanner (UI + navigation)

**Files:**
- Create: `src/components/admin/ScannerManager.tsx`
- Create: `src/app/admin/(protected)/scanners/page.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminBottomNav.tsx`

**Interfaces:**
- Consumes : `createScanner`, `getScanners`, `toggleScannerActive`, `deleteScanner` (Task 2) ; `getAllEvents` (existe déjà, `src/app/actions/getAllEvent.ts`, export par défaut) ; `Modal` (`@/components/ui/Modal`) ; type `Scanner` (Task 1).
- Produces : rien de consommé par d'autres tâches de ce plan.

- [ ] **Step 1: Composant de gestion**

Créer `src/components/admin/ScannerManager.tsx` :

```tsx
'use client'

import { FormEvent, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import Modal from '@/components/ui/Modal'
import type { events, Scanner } from '@/types'
import { createScanner, deleteScanner, toggleScannerActive } from '@/app/actions/adminScanners'

interface ScannerManagerProps {
  events: events[]
  scanners: Scanner[]
}

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

const initialForm = { name: '', username: '', password: '', eventId: '' }

export default function ScannerManager({ events, scanners }: ScannerManagerProps) {
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
    setFormValues((previous) => ({ ...previous, [target.name]: target.value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.name || !formValues.username || !formValues.password || !formValues.eventId) {
      setFeedback({ type: 'error', message: 'Tous les champs sont obligatoires.' })
      return
    }

    startTransition(async () => {
      const result = await createScanner(formValues)

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Impossible de créer le compte scanner.' })
        return
      }

      setFormValues({ ...initialForm })
      setFeedback(null)
      setIsModalOpen(false)
      setBanner({ type: 'success', message: 'Compte scanner créé.' })
      router.refresh()
    })
  }

  const handleToggle = (scanner: Scanner) => {
    startTransition(async () => {
      const result = await toggleScannerActive(scanner.$id, !scanner.active)

      if (!result.success) {
        setBanner({ type: 'error', message: result.error ?? 'Impossible de mettre à jour le compte.' })
        return
      }

      setBanner({ type: 'success', message: scanner.active ? 'Compte désactivé.' : 'Compte réactivé.' })
      router.refresh()
    })
  }

  const handleDelete = (scannerId: string) => {
    if (!window.confirm('Voulez-vous supprimer ce compte scanner ?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteScanner(scannerId)

      if (!result.success) {
        setBanner({ type: 'error', message: result.error ?? 'Suppression impossible.' })
        return
      }

      setBanner({ type: 'success', message: 'Compte scanner supprimé.' })
      router.refresh()
    })
  }

  const eventNameById = new Map(events.map((event) => [event.$id, event.name]))

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Sécurité</p>
          <h2 className="font-heading text-2xl text-white">Comptes scanner</h2>
          <p className="text-sm text-white/60">Créez des accès dédiés à la validation des billets à l&apos;entrée.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
        >
          Ajouter un compte scanner
        </button>
      </header>

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
        title="Nouveau compte scanner"
        description="Ce compte ne pourra valider que les billets de l'événement sélectionné."
      >
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Nom</span>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Identifiant</span>
              <input
                name="username"
                value={formValues.username}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Mot de passe</span>
              <input
                name="password"
                type="password"
                value={formValues.password}
                onChange={handleChange}
                required
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Événement</span>
              <select
                name="eventId"
                value={formValues.eventId}
                onChange={handleChange as (event: FormEvent<HTMLSelectElement>) => void}
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
                {isPending ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/50">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Identifiant</th>
              <th className="px-4 py-3">Événement</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {scanners.map((scanner) => (
              <tr key={scanner.$id}>
                <td className="px-4 py-3 text-white">{scanner.name}</td>
                <td className="px-4 py-3 text-white/70">{scanner.username}</td>
                <td className="px-4 py-3 text-white/70">{eventNameById.get(scanner.eventId) ?? scanner.eventId}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold uppercase ${scanner.active ? 'text-emerald-400' : 'text-white/40'}`}>
                    {scanner.active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(scanner)}
                      disabled={isPending}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-white/75 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {scanner.active ? 'Désactiver' : 'Réactiver'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(scanner.$id)}
                      disabled={isPending}
                      className="rounded-full border border-red-500/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {scanners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-white/55">
                  Aucun compte scanner pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Page admin**

Créer `src/app/admin/(protected)/scanners/page.tsx` :

```tsx
import ScannerManager from '@/components/admin/ScannerManager'
import getAllEvents from '@/app/actions/getAllEvent'
import { getScanners } from '@/app/actions/adminScanners'

export default async function AdminScannersPage() {
  const [events, scanners] = await Promise.all([getAllEvents(), getScanners()])

  return (
    <div className="space-y-10">
      <ScannerManager events={events ?? []} scanners={scanners} />
    </div>
  )
}
```

- [ ] **Step 3: Ajouter le lien dans `AdminSidebar.tsx`**

Dans `src/components/admin/AdminSidebar.tsx`, ajouter `PiQrCode` à l'import `react-icons/pi` existant (dans la même liste que `PiCalendarBlank, PiChartLineUp, ...`), puis dans le tableau `links`, ajouter une entrée après celle de Réservations :

```ts
  { href: '/admin/reservations', label: 'Réservations', icon: PiCalendarBlank },
  { href: '/admin/scanners', label: 'Scanners', icon: PiQrCode },
```

(remplace la ligne `{ href: '/admin/reservations', ... },` existante par ces deux lignes.)

- [ ] **Step 4: Ajouter le lien dans `AdminBottomNav.tsx`**

Dans `src/components/admin/AdminBottomNav.tsx`, ajouter `PiQrCode` à l'import `react-icons/pi` existant, puis dans le tableau `moreLinks`, ajouter une entrée :

```ts
const moreLinks = [
  { href: '/admin/promo-codes', label: 'Codes Promo', icon: PiTag },
  { href: '/admin/customers', label: 'Clients & invités', icon: PiUsersThree },
  { href: '/admin/scanners', label: 'Scanners', icon: PiQrCode },
  { href: '/admin/gallery', label: 'Galerie', icon: PiImage },
  { href: '/admin/providers', label: 'Prestataires', icon: PiBriefcase },
  { href: '/admin/dashboard#stats', label: 'Statistiques', icon: PiChartLineUp },
] as const
```

(remplace le tableau `moreLinks` existant par cette version à 6 entrées.)

- [ ] **Step 5: Vérifier les types et la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

Run: `npm run build`
Expected: `✓ Compiled successfully`, la route `/admin/scanners` apparaît dans la liste des routes.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/ScannerManager.tsx "src/app/admin/(protected)/scanners/page.tsx" src/components/admin/AdminSidebar.tsx src/components/admin/AdminBottomNav.tsx
git commit -m "feat: add admin UI for managing scanner accounts"
```

---

### Task 6: Sécuriser `setReservationAvailability`

**Files:**
- Create: `tests/updateReservationAvailability.test.ts`
- Modify: `src/app/actions/updateReservationAvailability.ts`

**Interfaces:**
- Consumes : `getCheckInActor` (Task 1).
- Produces : `setReservationAvailability` retourne désormais `{success: false, error: 'Non autorisé.'}` sans acteur valide, et `{success: false, error: 'Ce billet appartient à un autre événement.'}` pour un scanner hors de sa portée — consommé par le Task 7 (`/check-in`).

- [ ] **Step 1: Écrire les tests (ils vont échouer sur le nouveau comportement)**

Créer `tests/updateReservationAvailability.test.ts` :

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setReservationAvailability } from '../src/app/actions/updateReservationAvailability'

const mockGetDocument = vi.fn()
const mockUpdateDocument = vi.fn()

vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        getDocument: mockGetDocument,
        updateDocument: mockUpdateDocument,
      },
    }),
}))

const mockRevalidatePath = vi.fn()
vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}))

const mockGetCheckInActor = vi.fn()
vi.mock('@/utils/scannerAuth', () => ({
  getCheckInActor: () => mockGetCheckInActor(),
}))

describe('setReservationAvailability', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION: 'test-coll-reservation-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns an error when there is no valid actor', async () => {
    mockGetCheckInActor.mockResolvedValueOnce(null)

    const result = await setReservationAvailability('reservation-1', false)

    expect(result).toEqual({ success: false, error: 'Non autorisé.' })
    expect(mockUpdateDocument).not.toHaveBeenCalled()
  })

  it('allows an admin actor to update any reservation without an event check', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockUpdateDocument.mockResolvedValueOnce({ $id: 'reservation-1' })

    const result = await setReservationAvailability('reservation-1', false)

    expect(result).toEqual({ success: true })
    expect(mockGetDocument).not.toHaveBeenCalled()
    expect(mockUpdateDocument).toHaveBeenCalledWith('test-db-id', 'test-coll-reservation-id', 'reservation-1', {
      available: false,
    })
  })

  it('allows a scanner actor to update a reservation within their assigned event', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({
      type: 'scanner',
      scannerId: 'scanner-1',
      eventId: 'event-1',
      name: 'Porte 1',
    })
    mockGetDocument.mockResolvedValueOnce({ $id: 'reservation-1', event_ID: 'event-1' })
    mockUpdateDocument.mockResolvedValueOnce({ $id: 'reservation-1' })

    const result = await setReservationAvailability('reservation-1', false)

    expect(result).toEqual({ success: true })
    expect(mockUpdateDocument).toHaveBeenCalled()
  })

  it('rejects a scanner actor trying to update a reservation from another event', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({
      type: 'scanner',
      scannerId: 'scanner-1',
      eventId: 'event-1',
      name: 'Porte 1',
    })
    mockGetDocument.mockResolvedValueOnce({ $id: 'reservation-1', event_ID: 'event-2' })

    const result = await setReservationAvailability('reservation-1', false)

    expect(result).toEqual({ success: false, error: 'Ce billet appartient à un autre événement.' })
    expect(mockUpdateDocument).not.toHaveBeenCalled()
  })

  it('returns an error when reservationId is missing', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })

    const result = await setReservationAvailability('', false)

    expect(result.success).toBe(false)
    expect(mockUpdateDocument).not.toHaveBeenCalled()
  })

  it('returns an error when the update fails', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockUpdateDocument.mockRejectedValueOnce(new Error('down'))

    const result = await setReservationAvailability('reservation-1', false)

    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run tests/updateReservationAvailability.test.ts`
Expected: FAIL — la fonction actuelle n'appelle pas `getCheckInActor`, donc le premier test (aucun acteur → refus) échoue : `updateDocument` est appelé alors qu'il ne devrait pas l'être.

- [ ] **Step 3: Modifier l'implémentation**

Remplacer le contenu de `src/app/actions/updateReservationAvailability.ts` par :

```ts
'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '../../../config/appwrite'
import { getReservationConfig } from '../../utils/config'
import { getCheckInActor } from '@/utils/scannerAuth'
import type { Reservation } from '@/types'

interface ActionResult {
  success: boolean
  error?: string
}

export async function setReservationAvailability(
  reservationId: string,
  available: boolean
): Promise<ActionResult> {
  const actor = await getCheckInActor()

  if (!actor) {
    return { success: false, error: 'Non autorisé.' }
  }

  const config = getReservationConfig()

  if ('error' in config) {
    return { success: false, error: config.error }
  }

  if (!reservationId) {
    return { success: false, error: 'Identifiant de réservation manquant.' }
  }

  try {
    const { databases } = await createAdminClient()

    if (actor.type === 'scanner') {
      const reservation = (await databases.getDocument(
        config.databaseId,
        config.collectionId,
        reservationId
      )) as unknown as Reservation

      if (reservation.event_ID !== actor.eventId) {
        return { success: false, error: 'Ce billet appartient à un autre événement.' }
      }
    }

    await databases.updateDocument(config.databaseId, config.collectionId, reservationId, {
      available,
    })

    revalidatePath('/admin/reservations')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to update reservation availability', error)
    return {
      success: false,
      error: "Impossible de mettre à jour la disponibilité de la réservation.",
    }
  }
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run tests/updateReservationAvailability.test.ts`
Expected: PASS — 6 tests.

Run: `npx vitest run`
Expected: PASS — tous les tests précédents + les nouveaux.

- [ ] **Step 5: Commit**

```bash
git add tests/updateReservationAvailability.test.ts src/app/actions/updateReservationAvailability.ts
git commit -m "fix: require a valid check-in actor before toggling reservation availability"
```

---

### Task 7: QR code en URL + sécurisation de `/check-in` + recherche manuelle

**Files:**
- Create: `tests/scannerCheckIn.test.ts`
- Create: `src/app/actions/scannerCheckIn.ts`
- Modify: `src/utils/sendTicketEmail.ts`
- Modify: `src/app/check-in/page.tsx`

**Interfaces:**
- Consumes : `getCheckInActor` (Task 1), `setReservationAvailability` (Task 6, désormais sécurisée), `getReservationConfig` (existe déjà).
- Produces : `findReservationsByEmailForEvent(email: string, eventId?: string): Promise<{reservationId, customerName, ticketId, available}[]>` — fonction terminale de ce plan, rien d'autre n'en dépend.

- [ ] **Step 1: Écrire les tests de la recherche par courriel (ils vont échouer)**

Créer `tests/scannerCheckIn.test.ts` :

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { findReservationsByEmailForEvent } from '../src/app/actions/scannerCheckIn'

const mockListDocuments = vi.fn()
vi.mock('../config/appwrite', () => ({
  createAdminClient: () =>
    Promise.resolve({
      databases: {
        listDocuments: mockListDocuments,
      },
    }),
}))

vi.mock('node-appwrite', () => ({
  Query: {
    equal: (field: string, value: any) => `equal(${field},${value})`,
  },
}))

const mockGetCheckInActor = vi.fn()
vi.mock('@/utils/scannerAuth', () => ({
  getCheckInActor: () => mockGetCheckInActor(),
}))

describe('findReservationsByEmailForEvent', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DATABASE: 'test-db-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION: 'test-coll-reservation-id',
      NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS: 'test-coll-customers-id',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns an empty array without a valid actor', async () => {
    mockGetCheckInActor.mockResolvedValueOnce(null)

    expect(await findReservationsByEmailForEvent('a@b.com', 'event-1')).toEqual([])
    expect(mockListDocuments).not.toHaveBeenCalled()
  })

  it('returns an empty array when no customer matches the email', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockListDocuments.mockResolvedValueOnce({ documents: [] })

    expect(await findReservationsByEmailForEvent('a@b.com')).toEqual([])
  })

  it("scopes the search to the scanner's event regardless of the eventId argument", async () => {
    mockGetCheckInActor.mockResolvedValueOnce({
      type: 'scanner',
      scannerId: 's1',
      eventId: 'event-1',
      name: 'Porte 1',
    })
    mockListDocuments.mockResolvedValueOnce({ documents: [{ $id: 'customer-1', fullName: 'Jeanne Tremblay' }] })
    mockListDocuments.mockResolvedValueOnce({
      documents: [{ $id: 'reservation-1', ticket_ID: 'ticket-1', available: true }],
    })

    const results = await findReservationsByEmailForEvent('jeanne@example.com', 'event-attacker-supplied')

    expect(results).toEqual([
      { reservationId: 'reservation-1', customerName: 'Jeanne Tremblay', ticketId: 'ticket-1', available: true },
    ])
    expect(mockListDocuments).toHaveBeenNthCalledWith(2, 'test-db-id', 'test-coll-reservation-id', [
      'equal(customer_ID,customer-1)',
      'equal(event_ID,event-1)',
    ])
  })

  it('returns an empty array on failure', async () => {
    mockGetCheckInActor.mockResolvedValueOnce({ type: 'admin' })
    mockListDocuments.mockRejectedValueOnce(new Error('down'))

    expect(await findReservationsByEmailForEvent('a@b.com')).toEqual([])
  })
})
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run tests/scannerCheckIn.test.ts`
Expected: FAIL — `Cannot find module '../src/app/actions/scannerCheckIn'`

- [ ] **Step 3: Créer `scannerCheckIn.ts`**

Créer `src/app/actions/scannerCheckIn.ts` :

```ts
'use server'

import { Query } from 'node-appwrite'

import { createAdminClient } from '../../../config/appwrite'
import { getReservationConfig } from '@/utils/config'
import { getCheckInActor } from '@/utils/scannerAuth'
import type { Customer, Reservation } from '@/types'

export interface ReservationSearchResult {
  reservationId: string
  customerName: string
  ticketId: string
  available: boolean
}

export async function findReservationsByEmailForEvent(
  email: string,
  eventId?: string
): Promise<ReservationSearchResult[]> {
  const actor = await getCheckInActor()
  if (!actor || !email) {
    return []
  }

  const scopedEventId = actor.type === 'scanner' ? actor.eventId : eventId

  const config = getReservationConfig()
  if ('error' in config) {
    return []
  }

  const customerCollection = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS
  if (!customerCollection) {
    return []
  }

  try {
    const { databases } = await createAdminClient()

    const { documents: customers } = await databases.listDocuments(config.databaseId, customerCollection, [
      Query.equal('email', email),
    ])

    const customer = customers[0] as unknown as Customer | undefined
    if (!customer) {
      return []
    }

    const reservationQueries = [Query.equal('customer_ID', customer.$id)]
    if (scopedEventId) {
      reservationQueries.push(Query.equal('event_ID', scopedEventId))
    }

    const { documents: reservations } = await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      reservationQueries
    )

    return (reservations as unknown as Reservation[]).map((reservation) => ({
      reservationId: reservation.$id,
      customerName: customer.fullName,
      ticketId: reservation.ticket_ID,
      available: reservation.available !== false,
    }))
  } catch (error) {
    console.error('Failed to search reservations by email', error)
    return []
  }
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run tests/scannerCheckIn.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Corriger le QR code pour encoder une URL**

Dans `src/utils/sendTicketEmail.ts`, dans `sendTicketConfirmationEmail`, remplacer :

```ts
  const qrPayload = JSON.stringify({
    reservationId: payload.reservationId,
    ticketId: payload.ticket.$id,
    eventId: payload.event.$id,
    customerId: payload.customerId,
    email: payload.email,
    paymentIntent: payload.paymentIntent,
  })

  const qrCodeUrl = await generateQrCodeDataUrl(qrPayload)
```

par :

```ts
  const checkInUrl = `${process.env.NEXT_PUBLIC_URL}/check-in?id=${payload.reservationId}`

  const qrCodeUrl = await generateQrCodeDataUrl(checkInUrl)
```

- [ ] **Step 6: Sécuriser et simplifier `/check-in`**

Remplacer le contenu de `src/app/check-in/page.tsx` par :

```tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import type { Reservation, Ticket, events, Customer } from '@/types'
import { createAdminClient } from '../../../config/appwrite'
import { getReservationConfig } from '@/utils/config'
import { setReservationAvailability } from '../actions/updateReservationAvailability'
import { getCheckInActor } from '@/utils/scannerAuth'
import { findReservationsByEmailForEvent } from '../actions/scannerCheckIn'

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

async function searchByEmail(formData: FormData) {
  'use server'

  const email = formData.get('email')
  const params = new URLSearchParams()

  if (typeof email === 'string' && email.trim()) {
    params.set('email', email.trim())
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
  const emailParam = getFirstValue(resolvedSearchParams.email)

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

  let searchResults: Awaited<ReturnType<typeof findReservationsByEmailForEvent>> = []
  if (!reservationId && emailParam) {
    searchResults = await findReservationsByEmailForEvent(
      emailParam,
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
              Si l&apos;appareil photo ne scanne pas le billet, recherchez le client par courriel.
            </p>
            <form action={searchByEmail} className="flex gap-3">
              <input
                type="email"
                name="email"
                defaultValue={emailParam ?? ''}
                placeholder="courriel@exemple.com"
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

            {emailParam && searchResults.length === 0 && (
              <p className="text-sm text-slate-500">Aucune réservation trouvée pour ce courriel.</p>
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
```

Changements clés par rapport à l'existant : vérification d'acteur avec redirection si absente (préservant `id`/`data` pour revenir au bon billet après connexion) ; `eventId`/`ticketId`/`customerId` ne viennent plus jamais de l'URL — ils sont relus depuis `reservation.event_ID`/`ticket_ID`/`customer_ID` en base ; portée événement appliquée pour un scanner ; accepte `?id=` (nouveau format du QR) et `?data=` (ancien format JSON, en repli, `reservationId` uniquement) ; ajout du formulaire de recherche par courriel quand aucun billet n'est identifié dans l'URL.

- [ ] **Step 7: Vérifier les types et lancer la suite complète**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

Run: `npx vitest run`
Expected: PASS — tous les tests, y compris les 4 nouveaux de ce Task.

- [ ] **Step 8: Commit**

```bash
git add tests/scannerCheckIn.test.ts src/app/actions/scannerCheckIn.ts src/utils/sendTicketEmail.ts src/app/check-in/page.tsx
git commit -m "feat: secure /check-in behind scanner/admin auth, fix QR to a real URL, add manual email search"
```

---

### Task 8: Vérification complète

**Files:** aucun changement de fichier — vérification uniquement.

**Interfaces:** aucune.

- [ ] **Step 1: Suite de tests complète**

Run: `npx vitest run`
Expected: PASS — tous les fichiers verts, y compris `scannerAuth.test.ts` (12), `adminScanners.test.ts` (9), `updateReservationAvailability.test.ts` (6), `scannerCheckIn.test.ts` (4) en plus des 45 existants (76 au total).

- [ ] **Step 2: Types et build**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

Run: `npm run build`
Expected: `✓ Compiled successfully`. Les routes `/admin/scanners`, `/scan`, `/scan/login`, `/api/scanner/login`, `/api/scanner/logout` apparaissent dans la liste des routes générées.

- [ ] **Step 3: Vérification du rendu (redirections d'accès non authentifié)**

`SCANNER_SESSION_SECRET` doit être présent dans `.env` pour que le serveur démarre correctement avec ce code (sinon `getSessionSecret()` lève dès qu'une session scanner est vérifiée) — si absent, en ajouter un temporaire dans `.env` pour ce test (`SCANNER_SESSION_SECRET=temporary-test-secret-change-me`), sans le committer (`.env` est déjà ignoré par git).

```bash
npm run dev &
echo $! > /tmp/dev.pid
for i in $(seq 1 60); do curl -sf http://localhost:3000 >/dev/null 2>&1 && break; sleep 1; done

echo "--- /check-in sans session : doit rediriger vers /scan/login ---"
curl -s -o /dev/null -D - http://localhost:3000/check-in | grep -i "^location:"

echo "--- /scan sans session : doit rediriger vers /scan/login ---"
curl -s -o /dev/null -D - http://localhost:3000/scan | grep -i "^location:"

echo "--- /admin/scanners sans session admin : doit rediriger vers /admin/login ---"
curl -s -o /dev/null -D - http://localhost:3000/admin/scanners | grep -i "^location:"

kill $(cat /tmp/dev.pid) 2>/dev/null
```

Expected : les trois `Location:` pointent respectivement vers `/scan/login` (avec un paramètre `redirect=` encodant `/check-in` pour la première commande), `/scan/login`, et `/admin/login`.

Ne pas tenter de créer un vrai compte scanner ou de se connecter avec des identifiants réels dans cette étape — cela nécessiterait d'écrire dans la base Appwrite de production via la clé admin, hors du périmètre d'une vérification automatisée. La connexion scanner de bout en bout (créer un compte via `/admin/scanners`, se connecter sur `/scan/login`, scanner un vrai billet) est à vérifier manuellement par un humain avant mise en service, une fois la collection `scanners` et les variables d'environnement `NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS`/`SCANNER_SESSION_SECRET` réellement configurées.

- [ ] **Step 4: Rapport final**

Consigner dans le rapport de cette tâche : les résultats des 3 étapes précédentes, et rappeler explicitement les deux prérequis d'infrastructure non couverts par le code (collection Appwrite `scanners` à créer manuellement, variables d'environnement à définir) ainsi que le fait que le parcours de connexion scanner de bout en bout n'a pas été testé avec de vraies données.

