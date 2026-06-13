import type { ReservationWithDetails } from '@/types/admin-dashboard'
import { formatEventDateTime } from '@/utils/eventDate'
import { formatReservationTimestamp } from '@/utils/reservations'

interface ReservationsTableProps {
  reservations: ReservationWithDetails[]
  emptyMessage?: string
}

export default function ReservationsTable({ reservations, emptyMessage }: ReservationsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.95)]">
      <table className="min-w-full table-fixed divide-y divide-zinc-800 text-left text-sm">
        <thead className="bg-zinc-900/70 text-xs uppercase tracking-[0.3em] text-zinc-400">
          <tr>
            <th scope="col" className="w-40 px-4 py-3">Réservation</th>
            <th scope="col" className="w-64 px-4 py-3">Client</th>
            <th scope="col" className="w-64 px-4 py-3">Événement</th>
            <th scope="col" className="w-48 px-4 py-3">Ticket</th>
            <th scope="col" className="w-56 px-4 py-3">Paiement</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {reservations.map(({ reservation, customer, event, ticket }) => (
            <tr key={reservation.$id} className="hover:bg-zinc-900/40">
              <td className="px-4 py-3 align-top font-mono text-xs text-zinc-300">
                <div className="flex flex-col gap-1 break-all">
                  <span className="font-semibold text-zinc-100">{reservation.$id}</span>
                  <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                    {formatReservationTimestamp(reservation.$createdAt)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 align-top text-sm text-zinc-200">
                <div className="flex flex-col gap-1 break-words">
                  <span className="font-medium">{customer?.fullName ?? 'Client inconnu'}</span>
                  <span className="text-xs text-zinc-400">{customer?.email ?? 'Adresse non communiquée'}</span>
                </div>
              </td>
              <td className="px-4 py-3 align-top text-sm text-zinc-200">
                <div className="flex flex-col gap-1 break-words">
                  <span>{event?.name ?? 'Événement inconnu'}</span>
                  {event && (
                    <span className="text-xs text-zinc-400">{formatEventDateTime(event.date, 'fr-FR')}</span>
                  )}
                  {event?.adresse && <span className="text-xs text-zinc-500">{event.adresse}</span>}
                </div>
              </td>
              <td className="px-4 py-3 align-top text-sm text-zinc-200">
                <div className="flex flex-col gap-1 break-words">
                  <span>{ticket?.name ?? 'Ticket inconnu'}</span>
                  {typeof ticket?.price === 'number' && (
                    <span className="text-xs text-zinc-400">
                      {ticket.price === 0 ? 'Gratuit' : ticket.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 align-top text-xs text-zinc-400">
                <div className="flex flex-col gap-1 break-all">
                  <span className="font-medium text-zinc-200">{reservation.paymentIntent}</span>
                  <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                    {reservation.status ?? 'Statut non défini'}
                  </span>
                </div>
              </td>
            </tr>
          ))}
          {reservations.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                {emptyMessage ?? 'Aucune réservation enregistrée pour le moment.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
