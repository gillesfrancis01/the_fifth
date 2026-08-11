# Barre de navigation mobile (admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la navigation mobile actuelle du panneau admin (bouton hamburger qui déplie la liste en place) par une barre de navigation fixe en bas d'écran, façon application mobile native.

**Architecture:** Un nouveau composant client `AdminBottomNav` porte 4 liens directs + un onglet « Plus » ouvrant une feuille ancrée en bas listant les 5 liens restants. `AdminLayoutWrapper` le rend en plus du contenu existant. `AdminSidebar` perd son comportement mobile (hamburger + liste dépliée) et ne s'affiche plus qu'à partir du seuil `xl`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, react-icons (Phosphor `Pi*`).

## Global Constraints

- Seuil de bascule desktop/mobile : `xl` (1280px) — celui déjà utilisé partout ailleurs dans `AdminSidebar`/`AdminLayoutWrapper`, à ne pas changer.
- Liens directs de la barre du bas, dans cet ordre : Accueil (`/admin/dashboard`), Événements (`/admin/events`), Réservations (`/admin/reservations`), Tickets (`/admin/tickets`).
- Liens sous l'onglet « Plus », dans cet ordre : Codes Promo (`/admin/promo-codes`), Clients & invités (`/admin/customers`), Galerie (`/admin/gallery`), Prestataires (`/admin/providers`), Statistiques (`/admin/dashboard#stats`).
- Pas de composant `Sheet` générique ni de réutilisation du `Modal` centré existant pour la feuille « Plus » — patron d'interaction différent (ancré en bas), un seul usage ne justifie pas une abstraction partagée.
- Style visuel cohérent avec l'existant : accent doré `rgba(201,161,77,…)` sur l'état actif, fond noir translucide, pas de nouvelle palette.
- Pas de test automatisé à ajouter (aucun composant admin n'en a aujourd'hui, pas de React Testing Library dans ce projet) — vérification par `tsc --noEmit`, `npm run build`, et un contrôle de rendu HTML via un appel authentifié au serveur de dev.

---

### Task 1: Composant `AdminBottomNav`

**Files:**
- Create: `src/components/admin/AdminBottomNav.tsx`

**Interfaces:**
- Consumes : rien de nouveau (uniquement `next/link`, `next/navigation`, `react-icons/pi`).
- Produces : `export default function AdminBottomNav(): JSX.Element`, un composant sans props, consommé par le Task 2 (`AdminLayoutWrapper`).

- [ ] **Step 1: Créer le composant**

Créer `src/components/admin/AdminBottomNav.tsx` :

```tsx
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

  const isMoreActive = moreLinks.some((link) => isLinkActive(pathname, link.href))

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
```

- [ ] **Step 2: Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminBottomNav.tsx
git commit -m "feat: add AdminBottomNav mobile navigation component"
```

---

### Task 2: Brancher `AdminBottomNav` dans `AdminLayoutWrapper`

**Files:**
- Modify: `src/components/admin/AdminLayoutWrapper.tsx`

**Interfaces:**
- Consumes : `AdminBottomNav` (Task 1), sans props.
- Produces : rien de nouveau pour les tâches suivantes — cette tâche rend la barre visible sur toutes les pages admin, en plus de l'ancien menu (Task 3 retire l'ancien).

- [ ] **Step 1: Modifier le composant**

Remplacer le contenu de `src/components/admin/AdminLayoutWrapper.tsx` par :

```tsx
'use client'

import React, { useState, ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminBottomNav from './AdminBottomNav'
import LogoutButton from './LogoutButton'
import { FiSearch } from 'react-icons/fi'
import { PiBellSimpleRinging, PiGearSix, PiUserCircle, PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi'

export default function AdminLayoutWrapper({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-full flex-col gap-10 px-6 pb-28 pt-10 xl:flex-row xl:gap-10 xl:px-12 xl:pb-16 2xl:px-16">
      {/* Sidebar container with transition */}
      <div className={`transition-all duration-300 xl:flex-shrink-0 ${isCollapsed ? 'xl:w-24' : 'xl:w-80'}`}>
        <AdminSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </div>

      {/* Main content container */}
      <div className="flex-1 space-y-10 min-w-0">
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

        <main className="mx-auto w-full space-y-12 pb-6 px-1 sm:px-2 lg:px-4">{children}</main>
      </div>

      <AdminBottomNav />
    </div>
  )
}
```

The only changes from the current file: the new `AdminBottomNav` import and its render at the end of the root `<div>`, and the root `<div>`'s className changing `pb-16` to `pb-28 xl:pb-16` (so scrollable content clears the fixed bottom bar on mobile; unchanged on desktop where the bar is hidden).

- [ ] **Step 2: Vérifier les types et la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

Run: `npm run build`
Expected: `✓ Compiled successfully`, aucune erreur.

- [ ] **Step 3: Vérification du rendu (barre du bas présente)**

Démarrer le serveur de dev et vérifier que la barre s'affiche dans le HTML rendu pour un admin authentifié :

```bash
npm run dev &
echo $! > /tmp/dev.pid
for i in $(seq 1 60); do curl -sf http://localhost:3000 >/dev/null 2>&1 && break; sleep 1; done

ADMIN_PW=$(grep -E '^ADMIN_PASSWORD=' .env | head -1 | cut -d= -f2-)
curl -s -c /tmp/admin-cookies.txt -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" -d "{\"password\":\"$ADMIN_PW\"}" -o /tmp/login.json -w "LOGIN_%{http_code}\n"

curl -s -b /tmp/admin-cookies.txt http://localhost:3000/admin/dashboard -o /tmp/dashboard.html -w "PAGE_%{http_code}\n"
grep -o "Navigation admin mobile" /tmp/dashboard.html
grep -o "Toggle Navigation Menu" /tmp/dashboard.html || echo "OLD_HAMBURGER_MARKUP_ABSENT_OR_STILL_PRESENT_CHECK_MANUALLY"

kill $(cat /tmp/dev.pid) 2>/dev/null
```

Expected: `LOGIN_200`, `PAGE_200`, `Navigation admin mobile` found once (the new bar renders). The old hamburger's `Toggle Navigation Menu` aria-label is expected to **still be present** at this point — Task 3 removes it, not this task. Do not treat its presence as a failure here.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminLayoutWrapper.tsx
git commit -m "feat: render AdminBottomNav in the admin layout"
```

---

### Task 3: Retirer le hamburger mobile de `AdminSidebar` et vérification finale

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`

**Interfaces:**
- Consumes : aucune nouvelle dépendance.
- Produces : rien de consommé par d'autres tâches — c'est la tâche finale.

- [ ] **Step 1: Modifier le composant**

Remplacer le contenu de `src/components/admin/AdminSidebar.tsx` par :

```tsx
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
  { href: '/admin/dashboard', label: 'Vue d’ensemble', icon: PiChartLineUp },
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
            Naviguez dans l’univers after-dark de la maison, pilotez les expériences et activez votre réseau VIP.
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
```

Changes from the current file: root `<aside>` className goes from `flex` to `hidden … xl:flex`; the entire "Toggle Button for Mobile" block (the `PiList`/`PiX` hamburger button) is removed; the `isOpen`/`setIsOpen` state and its import (`useState` from `'react'`) are removed since nothing in this file uses them anymore; the "Collapsible Area" wrapper drops its `${isOpen ? 'flex' : 'hidden'} xl:flex` conditional and is now the plain `flex flex-col gap-6` it effectively always was on desktop; the two `onClick={() => setIsOpen(false)}` handlers (on the nav `Link` and the footer "Réservations live" `Link`) are removed along with the state they referenced. The `links` array, desktop collapse/expand behavior (`isCollapsed`/`onToggleCollapse`), and all styling are otherwise unchanged.

- [ ] **Step 2: Suite de tests complète**

Run: `npx vitest run`
Expected: PASS — 45/45 tests (this task touches no test-covered logic; confirms no regression).

- [ ] **Step 3: Vérification des types et build de production**

Run: `npx tsc --noEmit`
Expected: aucune erreur (en particulier, pas d'avertissement d'import inutilisé pour `useState`, `PiList`, `PiX` dans `AdminSidebar.tsx`).

Run: `npm run build`
Expected: `✓ Compiled successfully`, aucune erreur.

- [ ] **Step 4: Vérification finale du rendu (ancien menu disparu, nouveau présent)**

```bash
npm run dev &
echo $! > /tmp/dev.pid
for i in $(seq 1 60); do curl -sf http://localhost:3000 >/dev/null 2>&1 && break; sleep 1; done

ADMIN_PW=$(grep -E '^ADMIN_PASSWORD=' .env | head -1 | cut -d= -f2-)
curl -s -c /tmp/admin-cookies.txt -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" -d "{\"password\":\"$ADMIN_PW\"}" -o /tmp/login.json -w "LOGIN_%{http_code}\n"

curl -s -b /tmp/admin-cookies.txt http://localhost:3000/admin/dashboard -o /tmp/dashboard.html -w "PAGE_%{http_code}\n"
echo "--- new bottom nav present ---"
grep -c "Navigation admin mobile" /tmp/dashboard.html
echo "--- old hamburger gone ---"
grep -c "Toggle Navigation Menu" /tmp/dashboard.html || true

kill $(cat /tmp/dev.pid) 2>/dev/null
```

Expected: `LOGIN_200`, `PAGE_200`, the bottom nav count is `1`, the hamburger count is `0` (grep exits non-zero with no match, which is the expected/passing outcome here — do not treat that non-zero exit as a failure).

Do not attempt real interactive/visual browser verification (clicking the "Plus" tab, watching the sheet animate, confirming the fixed bar's visual position at a 375px viewport) — no browser automation tool is available in this environment. State explicitly in the report that this remains unverified visually and is deferred to the controller/human.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx
git commit -m "feat: remove mobile hamburger menu from AdminSidebar (replaced by AdminBottomNav)"
```
