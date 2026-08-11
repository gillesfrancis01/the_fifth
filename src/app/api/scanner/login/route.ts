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
