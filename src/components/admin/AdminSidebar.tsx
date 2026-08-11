"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PiCalendarBlank,
  PiChartLineUp,
  PiMaskHappy,
  PiTicket,
  PiUsersThree,
  PiTag,
  PiImage,
  PiBriefcase,
  PiCaretLeftBold,
  PiCaretRightBold,
} from 'react-icons/pi'
import Image from 'next/image'

const links = [
  { href: '/admin/dashboard', label: 'Vue d\'ensemble', icon: PiChartLineUp },
  { href: '/admin/events', label: 'Événements', icon: PiMaskHappy },
  { href: '/admin/tickets', label: 'Tickets', icon: PiTicket },
  { href: '/admin/promo-codes', label: 'Codes Promo', icon: PiTag },
  { href: '/admin/reservations', label: 'Réservations', icon: PiCalendarBlank },
  { href: '/admin/customers', label: 'Clients & invités', icon: PiUsersThree },
  { href: '/admin/gallery', label: 'Galerie', icon: PiImage },
  { href: '/admin/providers', label: 'Prestataires', icon: PiBriefcase },
  { href: '/admin/dashboard#stats', label: 'Statistiques', icon: PiChartLineUp },
] as const

interface AdminSidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function AdminSidebar({ isCollapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="relative hidden h-full flex-col gap-6 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(18,18,18,0.95),rgba(6,6,6,0.88))] p-6 text-sm shadow-[0_45px_90px_-60px_rgba(0,0,0,0.85)] backdrop-blur transition-all duration-300 xl:sticky xl:top-10 xl:flex">
      <div className="absolute inset-0 rounded-3xl border border-white/5 [mask-image:radial-gradient(circle_at_top,black,transparent_70%)] pointer-events-none" />

      {/* Header with Logo and Desktop Toggle */}
      <div className="relative flex items-center justify-between">
        <div className={`inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 transition-all duration-300 ${isCollapsed ? 'p-2' : 'px-4 py-3'}`}>
          <Link href="/">
            <Image
              src="/logo.png"
              alt="logo-the-fifth"
              width={isCollapsed ? 35 : 100}
              height={isCollapsed ? 35 : 100}
              className="transition-all duration-300"
            />
          </Link>
        </div>

        {/* Toggle Button for Desktop */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-white transition hover:border-[rgba(201,161,77,0.45)] hover:text-main"
          title={isCollapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {isCollapsed ? <PiCaretRightBold className="h-4 w-4" /> : <PiCaretLeftBold className="h-4 w-4" />}
        </button>
      </div>

      {/* Collapsible Area */}
      <div className="flex flex-col gap-6">
        <div className={`space-y-2 transition-all duration-300 ${isCollapsed ? 'xl:hidden' : 'block'}`}>
          <h2 className="font-heading text-2xl text-white">Ambiance & Direction</h2>
          <p className="text-xs leading-relaxed text-white/60">
            Naviguez dans l\'univers after-dark de la maison, pilotez les expériences et activez votre réseau VIP.
          </p>
        </div>

        <div className="relative h-[1px] w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <nav className="relative space-y-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname ? pathname === href || pathname.startsWith(`${href}/`) : false

            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 transition-all duration-300 ${isActive
                  ? 'border-[rgba(201,161,77,0.45)] bg-[rgba(201,161,77,0.08)] text-white shadow-[0_20px_35px_-25px_rgba(201,161,77,0.7)]'
                  : 'border-white/5 text-white/60 hover:border-[rgba(201,161,77,0.35)] hover:text-white'
                  } ${isCollapsed ? 'xl:justify-center xl:px-0' : ''}`}
                title={isCollapsed ? label : undefined}
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-[radial-gradient(circle_at_left,rgba(201,161,77,0.16),transparent_70%)] transition duration-500 group-hover:translate-x-0" />
                <span
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-[rgba(201,161,77,0.85)] transition-all duration-300 ${isActive ? 'border-[rgba(201,161,77,0.6)] bg-[rgba(201,161,77,0.1)] text-[rgba(201,161,77,1)]' : 'group-hover:border-[rgba(201,161,77,0.45)] group-hover:text-[rgba(201,161,77,1)]'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`relative font-medium tracking-wide transition-all duration-300 ${isCollapsed ? 'xl:hidden' : 'block'}`}>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={`relative mt-auto space-y-3 rounded-3xl border border-white/10 bg-black/60 p-5 ${isCollapsed ? 'xl:hidden' : 'block'}`}>
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.14),transparent_65%)] opacity-70" />
          <div className="relative space-y-2">
            <h3 className="font-heading text-lg text-main">Signature Lounge</h3>
            <p className="text-xs leading-relaxed text-white/65">
              Survolez les indicateurs, synchronisez les équipes et gardez la cadence des nuits dorées.
            </p>
          </div>
          <Link
            href="/admin/reservations"
            className="relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/75 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
          >
            <span className="absolute inset-0 bg-[radial-gradient(circle,rgba(201,161,77,0.16),transparent_72%)] opacity-0 transition group-hover:opacity-100" />
            <span className="relative">Réservations live</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
