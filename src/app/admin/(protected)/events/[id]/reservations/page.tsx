
import AdminRealtimeSync from '@/components/admin/AdminRealtimeSync'
import ExportButton from '@/components/admin/ExportButton'
import ReservationsTable from '@/components/admin/ReservationsTable'
import getSingleEvent from '@/app/actions/getSingleEvent'
import getReservationsByEvent from '@/app/actions/getReservationsByEvent'
import getCustomersByIds from '@/app/actions/getCustomersByIds'
import getAllTickets from '@/app/actions/getAllTickets'
import { buildReservationsWithDetails } from '../../../loaders'
import { TicketWithAvailability } from '@/types'
import { formatEventDateTime } from '@/utils/eventDate'

export default async function EventReservationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const event = await getSingleEvent(id)

    if (!event) {
        return (
            <div className="flex h-screen items-center justify-center text-white">
                <p>Événement introuvable.</p>
            </div>
        )
    }

    // Fetch critical data in parallel
    const [reservations, tickets] = await Promise.all([
        getReservationsByEvent(id),
        getAllTickets(id),
    ])

    // Fetch relevant customers
    const customerIds = reservations
        .map((r) => r.customer_ID)
        .filter((cid): cid is string => Boolean(cid))

    const customers = await getCustomersByIds(customerIds)

    // Build ticket map
    const ticketMapById = new Map<string, TicketWithAvailability>(
        (tickets ?? []).map((ticket) => [ticket.$id, ticket])
    )

    // Build detailed reservations
    // Note: we pass [event] as an array because the helper expects an array of events
    const reservationsWithDetails = buildReservationsWithDetails(
        reservations,
        [event],
        customers,
        ticketMapById
    )

    const revenue = reservationsWithDetails.reduce((total, { ticket }) => total + (ticket?.price ?? 0), 0)
    const soldCount = reservationsWithDetails.length

    // Prepare export data
    const exportData = reservationsWithDetails.map(r => ({
        ID: r.reservation.$id,
        Date: new Date(r.reservation.$createdAt ?? '').toLocaleString('fr-FR'),
        Client: r.customer?.fullName ?? 'Inconnu',
        Email: r.customer?.email ?? '',
        Ticket: r.ticket?.name ?? 'Inconnu',
        Prix: r.ticket?.price ?? 0,
        Statut: r.reservation.status
    }))

    return (
        <div className="space-y-10">
            <AdminRealtimeSync />

            {/* Header */}
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(170deg,rgba(15,15,15,0.95),rgba(5,5,5,0.85))] p-8 shadow-[0_45px_95px_-60px_rgba(0,0,0,0.85)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.15),transparent_70%)] opacity-70" />
                <div className="relative">
                    <a href="/admin/events" className="mb-4 inline-flex items-center text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                        ← Retour aux événements
                    </a>
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-2">
                            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                                {event.adresse || 'Lieu non défini'}
                            </span>
                            <h1 className="font-heading text-3xl text-main">{event.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                                <p>{formatEventDateTime(event.date, 'fr-FR')}</p>
                                <ExportButton
                                    data={exportData}
                                    filename={`reservations_${event.name.replace(/\s+/g, '_').toLowerCase()}`}
                                    label="Export CSV"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Metric label="Revenus générés" value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(revenue)} />
                            <Metric label="Billets vendus" value={soldCount} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Table */}
            <section className="space-y-6 rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
                <header>
                    <h2 className="font-heading text-xl text-white">Liste des invités</h2>
                    <p className="text-xs text-white/50 mt-1">
                        {reservations.length === 0
                            ? "Aucune réservation pour cet événement."
                            : `Visualisation de ${reservations.length} réservation(s).`
                        }
                    </p>
                </header>

                <ReservationsTable
                    reservations={reservationsWithDetails}
                    emptyMessage="Aucun billet vendu pour le moment."
                />
            </section>
        </div>
    )
}

function Metric({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">{label}</p>
            <p className="mt-1 text-xl font-medium text-white">{value}</p>
        </div>
    )
}
