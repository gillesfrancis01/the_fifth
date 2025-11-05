import { FiBarChart2, FiCalendar, FiCreditCard, FiLayers } from 'react-icons/fi'

const links = [
  { href: '#overview', label: 'Vue d’ensemble', icon: FiBarChart2 },
  { href: '#events', label: 'Événements', icon: FiCalendar },
  { href: '#tickets', label: 'Tickets', icon: FiLayers },
  { href: '#reservations', label: 'Réservations', icon: FiCreditCard },
]

export default function AdminSidebar() {
  return (
    <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.45)] backdrop-blur lg:sticky lg:top-10">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Admin</p>
        <h1 className="mt-2 text-lg font-semibold text-white">Tableau de bord</h1>
        <p className="mt-1 text-xs text-zinc-400">Surveillez vos performances en temps réel.</p>
      </div>

      <nav className="mt-6 space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900/60 text-main transition group-hover:bg-main/10">
              <Icon className="h-4 w-4" />
            </span>
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/70 via-zinc-900/30 to-zinc-900/60 p-4 text-sm text-zinc-300">
        <h2 className="text-sm font-semibold text-white">Besoin d’un rappel ?</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Retrouvez les réservations non consultées et les tickets publiés en un clic.
        </p>
        <a
          href="#reservations"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-main px-3 py-2 text-xs font-semibold text-black transition hover:opacity-90"
        >
          Voir les réservations
        </a>
      </div>
    </aside>
  )
}
