
import EventManager from '@/components/admin/EventManager'
import { fetchEvents } from '../loaders'
import { formatEventDateTime } from '@/utils/eventDate'

export default async function AdminEventsPage() {
  const events = await fetchEvents()

  const now = new Date()
  const upcomingEvents = events.filter((event) => new Date(event.date).getTime() >= now.getTime())
  const archivedEvents = events.filter((event) => new Date(event.date).getTime() < now.getTime())

  const spotlightEvent = upcomingEvents[0] ?? events[0]

  return (
    <div className="space-y-10">
      <section
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 "
        style={{
          backgroundImage: spotlightEvent?.image
            ? `linear-gradient(180deg, rgba(5,5,5,0.7), rgba(5,5,5,0.95)), url(${spotlightEvent.image})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.12),transparent_70%)] w-[70vw]" />
        <div className="relative grid gap-8 p-8 xl:grid-cols-[2fr_1.2fr]">
          <div className="space-y-5">
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-black/50 px-4 py-1 text-[11px] uppercase tracking-[0.4em] text-white/70">
              Direction artistique
            </span>
            <h1 className="font-heading text-4xl text-main">{spotlightEvent ? spotlightEvent.name : 'Créer une soirée signature'}</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Composez des expériences immersives, alignez artistes et partenaires et incarnez le prestige d’une maison de couture nocturne.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <HighlightCard
                title="Total événements"
                value={events.length.toString()}
                helper={`${upcomingEvents.length} à venir · ${archivedEvents.length} passés`}
              />
              <HighlightCard
                title="Dernière création"
                value={spotlightEvent ? formatEventDateTime(spotlightEvent.date, 'fr-FR') : '—'}
                helper={spotlightEvent?.adresse ?? 'Adresse à confirmer'}
              />
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/15 bg-black/55 p-6 text-sm text-white/70">
              <h2 className="font-heading text-2xl text-white">Fiche événement</h2>
              {spotlightEvent ? (
                <ul className="mt-4 space-y-3 text-xs uppercase tracking-[0.35em] text-white/55">
                  <li className="flex flex-col gap-2">
                    <span className="text-white/50">Date & heure</span>
                    <span className="text-sm normal-case tracking-normal text-white/80">
                      {formatEventDateTime(spotlightEvent.date, 'fr-FR')}
                    </span>
                  </li>
                  <li className="flex flex-col gap-2">
                    <span className="text-white/50">Lieu</span>
                    <span className="text-sm normal-case tracking-normal text-white/80">
                      {spotlightEvent.adresse || 'À définir'}
                    </span>
                  </li>
                  <li className="flex flex-col gap-2">
                    <span className="text-white/50">Moodboard</span>
                    <span className="text-sm normal-case tracking-normal text-white/80">
                      {spotlightEvent.teaser || 'Ajoutez un moodboard pour partager l’ambiance.'}
                    </span>
                  </li>
                </ul>
              ) : (
                <p className="mt-4 text-xs text-white/60">
                  Commencez par créer un événement pour activer la fiche détaillée et les actions de publication.
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionButton href="/admin/tickets" label="Gérer billets" />
              <ActionButton href="/admin/reservations" label="Gestion VIP" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <article className="space-y-6 rounded-3xl border border-white/10 bg-[linear-gradient(170deg,rgba(12,12,12,0.9),rgba(5,5,5,0.78))] p-6 shadow-[0_45px_90px_-60px_rgba(0,0,0,0.85)]">
          <header className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Chronologie</p>
            <h2 className="font-heading text-2xl text-white">Vos soirées programmées</h2>
            <p className="text-sm text-white/60">Visualisez l’alignement des dates et assurez la cohérence de la direction artistique.</p>
          </header>
          <ul className="space-y-4">
            {events
              .slice()
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((event) => (
                <li
                  key={event.$id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:border-[rgba(201,161,77,0.45)]"
                >
                  <div className="absolute inset-0 translate-y-full bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.14),transparent_70%)] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
                  <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-medium text-white">{event.name}</p>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/45">ID {event.$id}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-xs text-white/60 sm:items-end">
                      <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-white/60">
                        {formatEventDateTime(event.date, 'fr-FR')}
                      </span>
                      <span>{event.adresse || 'Adresse à confirmer'}</span>
                    </div>
                  </div>
                </li>
              ))}

            {events.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
                Aucun événement n’est enregistré pour le moment. Commencez par en créer un ci-dessous.
              </li>
            )}
          </ul>
        </article>

        <article className="space-y-6 rounded-3xl border border-white/10 bg-[linear-gradient(190deg,rgba(8,8,8,0.95),rgba(3,3,3,0.82))] p-6 shadow-[0_35px_85px_-55px_rgba(0,0,0,0.85)]">
          <header className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Collections</p>
            <h2 className="font-heading text-2xl text-white">Segments de billets</h2>
            <p className="text-sm text-white/60">Préparez vos gammes VIP, Gold et Standard pour orchestrer vos ventes.</p>
          </header>
          <div className="space-y-4">
            {['VIP', 'GOLD', 'STANDARD'].map((tier) => (
              <div
                key={tier}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/70"
              >
                <span className="font-heading text-lg text-main">{tier}</span>
                <span className="rounded-full border border-white/15 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-white/60">
                  Gestion dédiée
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/40 p-5 text-xs text-white/60">
            <p>
              Utilisez la console ci-dessous pour publier, mettre en pause ou ajuster vos événements et leur communication.
            </p>
          </div>
        </article>
      </section>

      <EventManager events={events} />
    </div>
  )
}

function HighlightCard({
  title,
  value,
  helper,
}: {
  title: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-[11px] uppercase tracking-[0.4em] text-white/55">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/60">{helper}</p>
    </div>
  )
}

function ActionButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/15 px-6 py-3 text-[11px] uppercase tracking-[0.35em] text-white/75 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white"
    >
      <span className="absolute inset-0 translate-y-full bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.18),transparent_70%)] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
      <span className="relative">{label}</span>
    </a>
  )
}
