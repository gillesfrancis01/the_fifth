import { createHash } from 'crypto'
import { cookies } from 'next/headers'

export function getExpectedAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD

  if (!password) {
    throw new Error('ADMIN_PASSWORD is not configured')
  }

  return createHash('sha256').update(password).digest('hex')
}

export function isValidAdminSession(token: string | undefined): boolean {
  if (!token) {
    return false
  }

  try {
    return token === getExpectedAdminToken()
  } catch (error) {
    console.error('Unable to validate admin session:', error)
    return false
  }
}

// Server Actions are callable HTTP endpoints regardless of which page renders
// them, so every admin-only action must check this itself — page-level
// redirects in src/app/admin/(protected)/layout.tsx do not protect them.
export async function requireAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  return isValidAdminSession(cookieStore.get('admin-token')?.value)
}
