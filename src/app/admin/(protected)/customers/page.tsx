import getAllCustomers from '@/app/actions/getAllCustomers'
import CustomersTable from '@/components/admin/CustomersTable'
import ExportButton from '@/components/admin/ExportButton'

export default async function AdminCustomersPage() {
    const customers = await getAllCustomers()

    // Calculate some simple metrics
    const totalCustomers = customers.length
    const recentCustomers = customers.filter(c => {
        const joinedAt = new Date(c.$createdAt).getTime()
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        return joinedAt > sevenDaysAgo
    }).length

    // Prepare export data
    const exportData = customers.map(c => ({
        Nom: c.fullName ?? 'Inconnu',
        Email: c.email,
        Telephone: c.phone ?? '',
        Inscrit: new Date(c.$createdAt ?? '').toLocaleDateString('fr-FR'),
        ID: c.$id
    }))

    return (
        <div className="space-y-10">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(170deg,rgba(15,15,15,0.95),rgba(5,5,5,0.85))] p-8 shadow-[0_45px_95px_-60px_rgba(0,0,0,0.85)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.15),transparent_70%)] opacity-70" />
                <div className="relative grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-5">
                        <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-black/50 px-4 py-1 text-[11px] uppercase tracking-[0.4em] text-white/70">
                            Membres & Invités
                        </span>
                        <h1 className="font-heading text-4xl text-main">Base Clients</h1>
                        <p className="max-w-3xl text-sm text-white/70">
                            Gérez votre communauté, visualisez les nouveaux inscrits et maintenez le lien avec vos meilleurs ambassadeurs.
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Metric label="Clients enregistrés" value={totalCustomers} helper="Base totale" />
                        <Metric label="Nouveaux (7j)" value={recentCustomers} helper="Dernière semaine" />
                    </div>
                </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <header className="space-y-2">
                        <h2 className="font-heading text-xl text-white">Liste complète</h2>
                        <p className="text-xs text-white/50">
                            Affichage des {customers.length} clients les plus récents.
                        </p>
                    </header>
                    <ExportButton data={exportData} filename="base_clients" label="Exporter Clients" />
                </div>
                <CustomersTable customers={customers} />
            </section>
        </div>
    )
}

function Metric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-xs text-white/60">{helper}</p>
        </div>
    )
}
