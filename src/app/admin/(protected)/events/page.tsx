import EventManager from '@/components/admin/EventManager'
import { fetchEvents } from '../loaders'
import { formatEventDateTime } from '@/utils/eventDate'

export default async function AdminEventsPage() {
  const events = await fetchEvents()

  const now = new Date()
  const upcomingEvents = events.filter((event) => new Date(event.date).getTime() >= now.getTime())
  const archivedEvents = events.filter((event) => new Date(event.date).getTime() < now.getTime())

  return (
    <div className="space-y-10">
      <section className="space-y-6 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-zinc-950/95 p-8 shadow-[0_35px_90px_-45px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Gestion des événements</p>
          <h2 className="text-3xl font-semibold text-white">Planifiez, affinez et publiez vos expériences</h2>
          <p className="text-sm text-zinc-400">
            Centralisez la création de vos événements et gardez un historique clair pour vos opérations marketing.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <EventMetric label="Total" value={events.length} helper="Événements enregistrés" />
          <EventMetric label="À venir" value={upcomingEvents.length} helper="Préparez vos campagnes" />
          <EventMetric label="Archivés" value={archivedEvents.length} helper="Gardez une trace" />
          <EventMetric label="Dernière mise à jour" value={formatLastUpdate(events)} helper="Basé sur la date la plus proche" />
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Chronologie rapide</h3>
          <p className="text-sm text-zinc-400">
            Visualisez vos prochaines échéances et assurez-vous que tous les contenus sont prêts à être diffusés.
          </p>
        </div>
        <ul className="space-y-4">
          {events
            .slice()
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((event) => (
              <li key={event.$id} className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{event.name}</p>
                  <p className="text-xs text-zinc-400">ID {event.$id}</p>
                </div>
                <div className="flex flex-col items-start gap-1 text-xs text-zinc-400 sm:items-end">
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                    {formatEventDateTime(event.date, 'fr-FR')}
                  </span>
                  <span>{event.adresse || 'Adresse à confirmer'}</span>
                </div>
              </li>
            ))}

          {events.length === 0 && (
            <li className="rounded-2xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
              Aucun événement n’est enregistré pour le moment. Commencez par en créer un ci-dessous.
            </li>
          )}
        </ul>
      </section>

      <EventManager events={events} />
    </div>
  )
}

function formatLastUpdate(events: { date: string }[]) {
  if (events.length === 0) {
    return '—'
  }

  const sorted = events
    .slice()
    .map((event) => Date.parse(event.date))
    .filter((timestamp) => !Number.isNaN(timestamp))
    .sort((a, b) => b - a)

  if (sorted.length === 0) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(sorted[0])
  )
}

function EventMetric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{helper}</p>
    </div>
  )
}
