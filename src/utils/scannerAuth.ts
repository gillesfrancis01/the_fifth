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
