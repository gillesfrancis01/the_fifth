"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiBarChart2, FiCalendar, FiCreditCard, FiLayers } from 'react-icons/fi'

const links = [
  { href: '/admin/dashboard', label: 'Vue d’ensemble', icon: FiBarChart2 },
  { href: '/admin/events', label: 'Événements', icon: FiCalendar },
  { href: '/admin/tickets', label: 'Tickets', icon: FiLayers },
  { href: '/admin/reservations', label: 'Réservations', icon: FiCreditCard },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.45)] backdrop-blur lg:sticky lg:top-10">
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/70 via-zinc-900/40 to-zinc-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Administration</p>
        <h1 className="mt-2 text-lg font-semibold text-white">Console stratégique</h1>
        <p className="mt-1 text-xs text-zinc-400">Naviguez entre les volets clés et gardez la maîtrise des opérations.</p>
      </div>

      <nav className="mt-6 space-y-2">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname ? pathname === href || pathname.startsWith(`${href}/`) : false

          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'border-main/40 bg-main/10 text-white'
                  : 'border-transparent text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-white'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  isActive ? 'bg-main/20 text-main' : 'bg-zinc-900/60 text-main group-hover:bg-main/10'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-gradient-to-br from-main/10 via-zinc-900/40 to-zinc-900/70 p-4 text-sm text-zinc-300">
        <h2 className="text-sm font-semibold text-white">Contrôle des performances</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Analysez vos réservations et ajustez votre offre en toute sérénité.
        </p>
        <Link
          href="/admin/reservations"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-main px-3 py-2 text-xs font-semibold text-black transition hover:opacity-90"
        >
          Voir les réservations
        </Link>
      </div>
    </aside>
  )
}
