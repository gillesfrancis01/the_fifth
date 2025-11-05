const links = [
  { href: '#overview', label: 'Vue d’ensemble' },
  { href: '#events', label: 'Événements' },
  { href: '#tickets', label: 'Tickets' },
  { href: '#reservations', label: 'Réservations' },
]

export default function AdminSidebar() {
  return (
    <aside className="sticky top-10 h-fit rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Navigation</h2>
      <nav className="mt-4 space-y-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800/60 hover:text-white"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  )
}
