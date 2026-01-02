
import { Customer } from '@/types'

interface CustomersTableProps {
    customers: Customer[]
}

export default function CustomersTable({ customers }: CustomersTableProps) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.95)]">
            <table className="min-w-full table-fixed divide-y divide-zinc-800 text-left text-sm">
                <thead className="bg-zinc-900/70 text-xs uppercase tracking-[0.3em] text-zinc-400">
                    <tr>
                        <th scope="col" className="w-64 px-4 py-3">Nom complet</th>
                        <th scope="col" className="w-64 px-4 py-3">Email</th>
                        <th scope="col" className="w-48 px-4 py-3">Téléphone</th>
                        <th scope="col" className="w-48 px-4 py-3">Inscrit depuis</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {customers.map((customer) => (
                        <tr key={customer.$id} className="hover:bg-zinc-900/40">
                            <td className="px-4 py-3 align-top font-medium text-zinc-200">
                                {customer.fullName || '—'}
                            </td>
                            <td className="px-4 py-3 align-top text-zinc-300">
                                {customer.email}
                            </td>
                            <td className="px-4 py-3 align-top text-zinc-400">
                                {customer.phone || '—'}
                            </td>
                            <td className="px-4 py-3 align-top text-xs text-zinc-500">
                                {new Date(customer.$createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </td>
                        </tr>
                    ))}
                    {customers.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-400">
                                Aucun client enregistré pour le moment.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
