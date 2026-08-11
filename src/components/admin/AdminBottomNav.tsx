'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PiCalendarBlank,
  PiChartLineUp,
  PiMaskHappy,
  PiTicket,
  PiTag,
  PiUsersThree,
  PiImage,
  PiBriefcase,
  PiDotsThreeOutline,
  PiX,
} from 'react-icons/pi'

const primaryLinks = [
  { href: '/admin/dashboard', label: 'Accueil', icon: PiChartLineUp },
  { href: '/admin/events', label: 'Événements', icon: PiMaskHappy },
  { href: '/admin/reservations', label: 'Réservations', icon: PiCalendarBlank },
  { href: '/admin/tickets', label: 'Tickets', icon: PiTicket },
] as const

const moreLinks = [
  { href: '/admin/promo-codes', label: 'Codes Promo', icon: PiTag },
  { href: '/admin/customers', label: 'Clients & invités', icon: PiUsersThree },
  { href: '/admin/gallery', label: 'Galerie', icon: PiImage },
  { href: '/admin/providers', label: 'Prestataires', icon: PiBriefcase },
  { href: '/admin/dashboard#stats', label: 'Statistiques', icon: PiChartLineUp },
] as const

function isLinkActive(pathname: string | null, href: string) {
  const [path] = href.split('#')
  return pathname ? pathname === path || pathname.startsWith(`${path}/`) : false
}

export default function AdminBottomNav() {
  const pathname = usePathname()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    if (!isSheetOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSheetOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isSheetOpen])

  const isPrimaryActive = primaryLinks.some((link) => isLinkActive(pathname, link.href))
  const isMoreActive = !isPrimaryActive && moreLinks.some((link) => isLinkActive(pathname, link.href))

  return (
    <>
      <nav
        aria-label="Navigation admin mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[rgba(10,10,10,0.92)] pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
      >
        {primaryLinks.map(({ href, label, icon: Icon }) => {
          const isActive = isLinkActive(pathname, href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] uppercase tracking-wide transition-colors ${
                isActive ? 'text-[rgba(201,161,77,1)]' : 'text-white/55'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] uppercase tracking-wide transition-colors ${
            isMoreActive ? 'text-[rgba(201,161,77,1)]' : 'text-white/55'
          }`}
          aria-haspopup="true"
          aria-expanded={isSheetOpen}
        >
          <PiDotsThreeOutline className="h-5 w-5" />
          <span>Plus</span>
        </button>
      </nav>

      {isSheetOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={() => setIsSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Plus de liens"
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-white/10 bg-[linear-gradient(180deg,rgba(15,15,15,0.98),rgba(4,4,4,0.96))] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-[0_-40px_80px_-40px_rgba(0,0,0,0.9)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg text-white">Plus de liens</h2>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70"
                aria-label="Fermer"
              >
                <PiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const isActive = isLinkActive(pathname, href)

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsSheetOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                      isActive
                        ? 'border-[rgba(201,161,77,0.45)] bg-[rgba(201,161,77,0.08)] text-white'
                        : 'border-white/5 text-white/70'
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-[rgba(201,161,77,0.85)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-medium tracking-wide">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
