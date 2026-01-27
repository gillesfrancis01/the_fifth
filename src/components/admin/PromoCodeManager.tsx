'use client'

import { createPromoCode, deletePromoCode, getPromoCodes, togglePromoCode } from '@/app/actions/promo'
import { PromoCode } from '@/types'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState, useTransition } from 'react'

export default function PromoCodeManager({ initialCodes }: { initialCodes: PromoCode[] }) {
    const router = useRouter()
    const [codes, setCodes] = useState<PromoCode[]>(initialCodes)
    const [isPending, startTransition] = useTransition()
    const [formData, setFormData] = useState({ code: '', type: 'percentage', value: '' })
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        setCodes(initialCodes)
    }, [initialCodes])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setFeedback(null)

        if (!formData.code || !formData.value) return

        startTransition(async () => {
            const result = await createPromoCode({
                code: formData.code.toUpperCase(),
                type: formData.type as 'percentage' | 'fixed',
                value: Number(formData.value)
            })

            if (result.success) {
                setFormData({ code: '', type: 'percentage', value: '' })
                setFeedback({ type: 'success', message: 'Code promo créé !' })
                router.refresh()
            } else {
                setFeedback({ type: 'error', message: result.error || 'Erreur inconnue' })
            }
        })
    }

    const handleToggle = async (id: string, currentStatus: boolean) => {
        startTransition(async () => {
            await togglePromoCode(id, currentStatus)
            router.refresh()
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce code promo ?')) return

        startTransition(async () => {
            await deletePromoCode(id)
            router.refresh()
        })
    }

    return (
        <div className="space-y-10">
            {/* Create Form */}
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
                <h2 className="text-2xl font-bold font-Josefin text-white mb-6">Créer un code promo</h2>
                <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400">Code</label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-main outline-none transition-colors"
                            placeholder="EX: SUMMER10"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400">Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-main outline-none transition-colors"
                        >
                            <option value="percentage">Pourcentage (%)</option>
                            <option value="fixed">Montant Fixe ($)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400">Valeur</label>
                        <input
                            type="number"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-main outline-none transition-colors"
                            placeholder="10"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-main text-black font-bold py-3 px-6 rounded-lg hover:bg-opacity-80 transition-opacity disabled:opacity-50 h-[50px]"
                    >
                        {isPending ? '...' : 'Créer'}
                    </button>
                </form>
                {feedback && (
                    <p className={`mt-4 text-sm ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {feedback.message}
                    </p>
                )}
            </div>

            {/* List */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold font-Josefin text-white">Codes existants</h3>
                <div className="grid gap-4">
                    {codes.map(promo => (
                        <div key={promo.$id} className="flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                            <div className='flex items-center gap-6'>
                                <div className={`w-3 h-3 rounded-full ${promo.active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                <div>
                                    <p className="text-xl font-bold text-white tracking-wider">{promo.code}</p>
                                    <p className="text-sm text-gray-400">
                                        {promo.type === 'percentage' ? `-${promo.value}%` : `-$${promo.value}`} | {promo.active ? 'Actif' : 'Inactif'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleToggle(promo.$id, promo.active)}
                                    disabled={isPending}
                                    className="px-4 py-2 rounded-lg border border-white/10 text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                >
                                    {promo.active ? 'Désactiver' : 'Activer'}
                                </button>
                                <button
                                    onClick={() => handleDelete(promo.$id)}
                                    disabled={isPending}
                                    className="text-red-400 hover:text-red-300 transition-colors p-2"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                    {codes.length === 0 && (
                        <p className="text-gray-500 italic">Aucun code promo actif.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
