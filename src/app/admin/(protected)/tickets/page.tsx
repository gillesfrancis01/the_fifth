import TicketManager from '@/components/admin/TicketManager'
import { fetchEvents, fetchTicketsForEvents } from '../loaders'
import { formatEventDateTime } from '@/utils/eventDate'

export default async function AdminTicketsPage() {
  const events = await fetchEvents()
  const { ticketsByEvent, ticketsWithEvent, totalTickets, availableTickets } = await fetchTicketsForEvents(events)

  return (
    <div className="space-y-10">
      <section className="space-y-6 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-zinc-950/95 p-8 shadow-[0_35px_90px_-45px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Gestion des tickets</p>
          <h2 className="text-3xl font-semibold text-white">Structurez l’offre tarifaire de vos événements</h2>
          <p className="text-sm text-zinc-400">
            Paramétrez les niveaux de prix, suivez la disponibilité et ajustez votre stratégie commerciale en temps réel.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TicketMetric label="Tickets publiés" value={totalTickets} helper="En circulation" />
          <TicketMetric label="Disponibles" value={availableTickets} helper="Prêts à être vendus" />
          <TicketMetric label="Événements couverts" value={events.length} helper="Avec tickets assignés" />
          <TicketMetric label="Taux de disponibilité" value={formatAvailability(totalTickets, availableTickets)} helper="Capacité restante" />
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Aperçu inventaire</h3>
          <p className="text-sm text-zinc-400">
            Contrôlez la répartition des tickets par événement et anticipez les tensions sur les stocks.
          </p>
        </div>
        <ul className="space-y-4">
          {events.map((event) => {
            const tickets = ticketsByEvent.get(event.$id) ?? []
            const available = tickets.filter((ticket) => ticket.available).length

            return (
              <li key={event.$id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{event.name}</p>
                    <p className="text-xs text-zinc-400">{formatEventDateTime(event.date, 'fr-FR')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">{tickets.length} tickets</span>
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">{available} disponibles</span>
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">
                      {tickets.length > 0 ? `${Math.round(((tickets.length - available) / tickets.length) * 100)}% vendus` : '0% vendu'}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}

          {events.length === 0 && (
            <li className="rounded-2xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
              Publiez un événement avant d’ajouter des tickets.
            </li>
          )}
        </ul>
      </section>

      <TicketManager events={events} tickets={ticketsWithEvent} />
    </div>
  )
}

function TicketMetric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{helper}</p>
    </div>
  )
}

function formatAvailability(total: number, available: number) {
  if (total === 0) {
    return '—'
  }

  const percentage = Math.round((available / total) * 100)
  return `${percentage}%`
}
