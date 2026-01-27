import { getPromoCodes } from '@/app/actions/promo'
import PromoCodeManager from '@/components/admin/PromoCodeManager'

export default async function PromoCodesPage() {
    const promos = await getPromoCodes()

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/55">Marketing & Ventes</p>
                <h1 className="font-heading text-4xl text-white">Codes Promo</h1>
                <p className="text-sm text-white/60">Gérez les réductions et offres spéciales pour vos événements.</p>
            </div>

            <PromoCodeManager initialCodes={promos} />
        </div>
    )
}
