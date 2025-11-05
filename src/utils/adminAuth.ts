import { createHash } from 'crypto'

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
