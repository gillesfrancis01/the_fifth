import AdminRealtimeSync from '@/components/admin/AdminRealtimeSync'
import ReservationManager from '@/components/admin/ReservationManager'
import { fetchAdminCoreData, fetchTicketsForEvents, buildReservationsWithDetails } from '../loaders'
import { formatReservationTimestamp } from '@/utils/reservations'

export default async function AdminReservationsPage() {
  const { events, reservations, customers } = await fetchAdminCoreData()
  const { ticketMapById, totalTickets, ticketsWithEvent } = await fetchTicketsForEvents(events)

  const reservationsWithDetails = buildReservationsWithDetails(reservations, events, customers, ticketMapById)

  const completedReservations = reservationsWithDetails
  const revenue = completedReservations.reduce((total, { ticket }) => total + (ticket?.price ?? 0), 0)
  const uniqueCustomers = new Set(completedReservations.map(({ customer }) => customer?.$id).filter(Boolean)).size
  const conversionRate = totalTickets > 0 ? Math.round((completedReservations.length / totalTickets) * 100) : 0
  const lastReservation = completedReservations
    .map((item) => item.reservation.$createdAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]

  // Prepare export data (flatten objects)
  const exportData = reservationsWithDetails.map(r => ({
    ID: r.reservation.$id,
    Date: new Date(r.reservation.$createdAt ?? '').toLocaleString('fr-FR'),
    Client: r.customer?.fullName ?? 'Inconnu',
    Email: r.customer?.email ?? '',
    Evenement: r.event?.name ?? 'Inconnu',
    Ticket: r.ticket?.name ?? 'Inconnu',
    Prix: r.ticket?.price ?? 0,
    Statut: r.reservation.available !== false ? 'Disponible' : 'Utilisé',
    Paiement: r.reservation.paymentIntent
  }))

  return (
    <div className="space-y-10">
      <AdminRealtimeSync />
      <section className="space-y-6 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-zinc-950/95 p-8 shadow-[0_35px_90px_-45px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Réservations</p>
          <h2 className="text-3xl font-semibold text-white">Analysez vos ventes et sécurisez le suivi</h2>
          <p className="text-sm text-zinc-400">
            Examinez les transactions enregistrées, identifiez vos clients fidèles et assurez-vous que les paiements sont conformes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReservationMetric label="Réservations" value={completedReservations.length} helper="Confirmées sur la plateforme" />
          <ReservationMetric label="Clients uniques" value={uniqueCustomers} helper="Contacts qualifiés" />
          <ReservationMetric label="Revenus estimés" value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(revenue)} helper="Basés sur le prix des tickets" />
          <ReservationMetric label="Conversion" value={`${conversionRate}%`} helper="Réservations / tickets publiés" />
        </div>
      </section>

      <ReservationManager
        events={events}
        tickets={ticketsWithEvent}
        reservations={reservationsWithDetails}
        exportData={exportData}
        lastReservationLabel={lastReservation ? formatReservationTimestamp(lastReservation) : '—'}
      />
    </div>
  )
}

function ReservationMetric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{helper}</p>
    </div>
  )
}
