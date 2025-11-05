import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isValidAdminSession } from '@/utils/adminAuth'
import LogoutButton from '@/components/admin/LogoutButton'

export const dynamic = 'force-dynamic'

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const token = cookies().get('admin-token')?.value

  if (!isValidAdminSession(token)) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-6 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Administration</p>
            <h1 className="mt-2 text-3xl font-semibold text-main">Console de gestion</h1>
            <p className="mt-1 text-sm text-zinc-300">
              Gérez les événements, les réservations et les tickets de la communauté.
            </p>
          </div>
          <LogoutButton />
        </header>
        <main className="pb-12">{children}</main>
      </div>
    </div>
  )
}
