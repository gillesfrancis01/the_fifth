import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isValidAdminSession } from '@/utils/adminAuth'
import LogoutButton from '@/components/admin/LogoutButton'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const token = cookies().get('admin-token')?.value

  if (!isValidAdminSession(token)) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <div className="lg:w-72 lg:flex-shrink-0">
          <AdminSidebar />
        </div>
        <div className="flex-1">
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
          <main className="mt-10 space-y-12 pb-12">{children}</main>
        </div>
      </div>
    </div>
  )
}
