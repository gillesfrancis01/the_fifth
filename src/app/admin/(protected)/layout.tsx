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
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,59,61,0.2),_transparent_55%)]"
      />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <div className="lg:w-72 lg:flex-shrink-0">
          <AdminSidebar />
        </div>
        <div className="flex-1">
          <header className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-6 py-6 shadow-[0_25px_60px_-35px_rgba(0,0,0,0.65)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Administration</p>
              <h1 className="mt-2 text-3xl font-semibold text-main">Console de gestion</h1>
              <p className="mt-2 text-sm text-zinc-300">
                Surveillez l’activité des événements, harmonisez les billets et gardez un œil sur les réservations clés.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:items-end">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-400">
                Dernière connexion sécurisée
                <span className="ml-2 font-medium text-zinc-200">{new Date().toLocaleDateString('fr-FR')}</span>
              </div>
              <LogoutButton />
            </div>
          </header>
          <main className="mt-10 space-y-12 pb-12">{children}</main>
        </div>
      </div>
    </div>
  )
}
