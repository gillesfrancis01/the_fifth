import { NextResponse } from 'next/server'
import { getExpectedAdminToken } from '@/utils/adminAuth'

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { message: "L'accès administrateur n'est pas configuré." },
      { status: 500 }
    )
  }

  let password: string | undefined

  try {
    const body = await request.json()
    password = body?.password
  } catch {
    return NextResponse.json({ message: 'Requête invalide.' }, { status: 400 })
  }

  if (!password) {
    return NextResponse.json({ message: 'Mot de passe requis.' }, { status: 400 })
  }

  console.log(process.env); if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: 'Identifiants incorrects.' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  const token = getExpectedAdminToken()

  response.cookies.set('admin-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
    path: '/'
  })

  return response
}
