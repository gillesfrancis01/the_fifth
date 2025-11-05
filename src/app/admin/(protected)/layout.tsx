import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isValidAdminSession } from '@/utils/adminAuth'
import LogoutButton from '@/components/admin/LogoutButton'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { FiSearch } from 'react-icons/fi'
import { PiBellSimpleRinging, PiGearSix, PiUserCircle } from 'react-icons/pi'

export const dynamic = 'force-dynamic'

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const token = cookies().get('admin-token')?.value

  if (!isValidAdminSession(token)) {
    redirect('/admin/login')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-[#f8f5f0]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(201,161,77,0.12),transparent_52%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(68,54,24,0.18),transparent_55%)]"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-10 px-6 pb-16 pt-10 xl:flex-row xl:gap-14 xl:px-10">
        <div className="xl:w-80 xl:flex-shrink-0">
          <AdminSidebar />
        </div>
        <div className="flex-1 space-y-10">
          <header className="space-y-6">
            <div className="glass-elevated relative overflow-hidden rounded-3xl px-6 py-6 shadow-[0_40px_80px_-60px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_0%,rgba(201,161,77,0.25),transparent_55%)]" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-5">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-black/60 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80">
                      THE FIFTH
                    </span>
                    <h1 className="text-3xl font-semibold text-main lg:text-4xl">Interface d’administration signature</h1>
                  </div>
                  <p className="max-w-2xl text-sm text-white/70">
                    Pilotez vos événements de prestige, orchestrez les expériences VIP et offrez une gestion digne d’une maison de couture nocturne.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-4 lg:w-auto lg:items-end">
                  <div className="relative hidden w-full max-w-xs lg:block">
                    <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      type="search"
                      placeholder="Rechercher un client, un ticket, un événement…"
                      className="w-full rounded-full border border-white/10 bg-white/5 px-12 py-3 text-sm text-white placeholder:text-white/40 focus:border-[rgba(201,161,77,0.55)] focus:outline-none focus:ring-2 focus:ring-[rgba(201,161,77,0.35)]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 text-white/80">
                    <button className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 transition hover:border-[rgba(201,161,77,0.45)] hover:text-[rgba(201,161,77,1)]">
                      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(201,161,77,0.18),transparent_68%)] opacity-0 transition group-hover:opacity-100" />
                      <PiBellSimpleRinging className="relative h-5 w-5" />
                    </button>
                    <button className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 transition hover:border-[rgba(201,161,77,0.45)] hover:text-[rgba(201,161,77,1)]">
                      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(201,161,77,0.18),transparent_68%)] opacity-0 transition group-hover:opacity-100" />
                      <PiUserCircle className="relative h-5 w-5" />
                    </button>
                    <button className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 transition hover:border-[rgba(201,161,77,0.45)] hover:text-[rgba(201,161,77,1)]">
                      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(201,161,77,0.18),transparent_68%)] opacity-0 transition group-hover:opacity-100" />
                      <PiGearSix className="relative h-5 w-5" />
                    </button>
                    <LogoutButton />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:hidden">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  type="search"
                  placeholder="Rechercher un client, un ticket, un événement…"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-12 py-3 text-sm text-white placeholder:text-white/40 focus:border-[rgba(201,161,77,0.55)] focus:outline-none focus:ring-2 focus:ring-[rgba(201,161,77,0.35)]"
                />
              </div>
            </div>
          </header>

          <main className="space-y-12 pb-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
