
import TicketManager from '@/components/admin/TicketManager'
import { fetchEvents, fetchTicketsForEvents } from '../loaders'
import { formatEventDateTime } from '@/utils/eventDate'

export default async function AdminTicketsPage() {
  const events = await fetchEvents()
  const { ticketsByEvent, ticketsWithEvent, totalTickets, availableTickets } = await fetchTicketsForEvents(events)

  const soldTickets = totalTickets - availableTickets
  const availabilityRate = totalTickets > 0 ? Math.round((availableTickets / totalTickets) * 100) : 0

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(170deg,rgba(15,15,15,0.95),rgba(5,5,5,0.85))] p-8 shadow-[0_45px_95px_-60px_rgba(0,0,0,0.85)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.15),transparent_70%)] opacity-70" />
        <div className="relative grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-black/50 px-4 py-1 text-[11px] uppercase tracking-[0.4em] text-white/70">
              Tickets & réservations
            </span>
            <h1 className="font-heading text-4xl text-main">Architecture tarifaire de la maison</h1>
            <p className="max-w-3xl text-sm text-white/70">
              Déployez des gammes VIP, Gold et Standard, synchronisez vos inventaires et orchestrez les réservations d’exception.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Tickets publiés" value={totalTickets} helper="En circulation" />
              <Metric label="Disponibles" value={availableTickets} helper="Prêts à être vendus" />
              <Metric label="Vendues" value={soldTickets} helper="Captées par les clients" />
              <Metric label="Taux de disponibilité" value={`${availabilityRate}%`} helper="Capacité restante" />
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/15 bg-black/55 p-6">
              <h2 className="font-heading text-2xl text-white">Segments premium</h2>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {['VIP', 'GOLD', 'STANDARD'].map((tier) => (
                  <li key={tier} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                    <span className="font-heading text-lg text-main">{tier}</span>
                    <span className="rounded-full border border-white/15 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-white/60">
                      Gestion dédiée
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="#tickets"
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border border-white/15 px-6 py-3 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
            >
              <span className="absolute inset-0 translate-y-full bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.18),transparent_70%)] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
              <span className="relative">Créer un ticket</span>
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <article className="space-y-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.9),rgba(4,4,4,0.8))] p-6 shadow-[0_45px_90px_-60px_rgba(0,0,0,0.85)]">
          <header className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Inventaire</p>
            <h2 className="font-heading text-2xl text-white">Répartition par événement</h2>
            <p className="text-sm text-white/60">Anticipez les tensions sur les stocks et activez vos campagnes ciblées.</p>
          </header>
          <ul className="space-y-4">
            {events.map((event) => {
              const tickets = ticketsByEvent.get(event.$id) ?? []
              const totalQuantity = tickets.reduce((total, ticket) => total + ticket.quantity, 0)
              const available = tickets.reduce(
                (total, ticket) => total + (ticket.available ? ticket.remaining : 0),
                0
              )
              const sold = tickets.reduce((total, ticket) => total + ticket.sold, 0)
              const sellThrough = totalQuantity > 0 ? Math.round((sold / totalQuantity) * 100) : 0

              return (
                <li
                  key={event.$id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:border-[rgba(201,161,77,0.45)]"
                >
                  <div className="absolute inset-0 translate-y-full bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.16),transparent_70%)] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
                  <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-medium text-white">{event.name}</p>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/45">{formatEventDateTime(event.date, 'fr-FR')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                      <span className="inline-flex items-center rounded-full border border-white/15 px-3 py-1">{totalQuantity} en stock</span>
                      <span className="inline-flex items-center rounded-full border border-white/15 px-3 py-1">{available} disponibles</span>
                      <span className="inline-flex items-center rounded-full border border-white/15 px-3 py-1">{sellThrough}% vendus</span>
                    </div>
                  </div>
                </li>
              )
            })}

            {events.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
                Publiez un événement avant d’ajouter des tickets.
              </li>
            )}
          </ul>
        </article>

        <article className="space-y-5 rounded-3xl border border-white/10 bg-[linear-gradient(190deg,rgba(8,8,8,0.95),rgba(3,3,3,0.82))] p-6 shadow-[0_35px_85px_-55px_rgba(0,0,0,0.85)]">
          <header className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">VIP monitoring</p>
            <h2 className="font-heading text-2xl text-white">Statut des réservations</h2>
            <p className="text-sm text-white/60">Suivez en un regard vos segments clés et leurs disponibilités.</p>
          </header>
          <div className="space-y-4 text-sm text-white/70">
            <StatusRow label="VIP" available={countTickets(ticketsWithEvent, 'VIP')} />
            <StatusRow label="GOLD" available={countTickets(ticketsWithEvent, 'GOLD')} />
            <StatusRow label="STANDARD" available={countTickets(ticketsWithEvent, 'STANDARD')} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/40 p-5 text-xs text-white/60">
            <p>Déployez des expériences personnalisées : QR code, paiement Stripe, invitation privée ou cashless.</p>
          </div>
        </article>
      </section>

      <TicketManager events={events} tickets={ticketsWithEvent} />
    </div>
  )
}

function Metric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[11px] uppercase tracking-[0.4em] text-white/55">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/60">{helper}</p>
    </div>
  )
}

function StatusRow({ label, available }: { label: string; available: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
      <span className="font-heading text-lg text-main">{label}</span>
      <span className="text-sm text-white/70">{available} tickets disponibles</span>
    </div>
  )
}

function countTickets(tickets: TicketWithEvent[], tier: string) {
  return tickets
    .filter((ticket) => ticket.name.toLowerCase().includes(tier.toLowerCase()))
    .reduce((total, ticket) => total + (ticket.available ? ticket.remaining : 0), 0)
}
