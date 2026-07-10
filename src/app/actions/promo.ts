'use server'

import { createAdminClient } from "../../../config/appwrite"
import { PromoCode } from "@/types"
import { ID, Query } from "node-appwrite"
import { requireAdminSession } from "@/utils/adminAuth"

const PROMO_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROMO_CODES

export async function getPromoCodes() {
    if (!(await requireAdminSession())) {
        return []
    }

    try {
        const { databases } = await createAdminClient()
        if (!PROMO_COLLECTION_ID) return []

        const { documents } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE!,
            PROMO_COLLECTION_ID,
            [Query.orderDesc('$createdAt')]
        )

        return documents as unknown as PromoCode[]
    } catch (error) {
        console.error('Failed to get promo codes', error)
        return []
    }
}

export async function createPromoCode(data: Omit<PromoCode, '$id' | 'active'>) {
    if (!(await requireAdminSession())) {
        return { success: false, error: "Non autorisé" }
    }

    try {
        const { databases } = await createAdminClient()
        if (!PROMO_COLLECTION_ID) throw new Error("Collection ID not found")

        // Check uniqueness
        const existing = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE!,
            PROMO_COLLECTION_ID,
            [Query.equal('code', data.code)]
        )

        if (existing.total > 0) {
            return { success: false, error: "Ce code existe déjà" }
        }

        const doc = await databases.createDocument(
            process.env.NEXT_PUBLIC_DATABASE!,
            PROMO_COLLECTION_ID,
            ID.unique(),
            {
                ...data,
                active: true
            }
        )

        return { success: true, data: doc }
    } catch (error) {
        console.error('Failed to create promo code', error)
        return { success: false, error: "Erreur lors de la création" }
    }
}

export async function togglePromoCode(id: string, currentStatus: boolean) {
    if (!(await requireAdminSession())) {
        return { success: false, error: "Non autorisé" }
    }

    try {
        const { databases } = await createAdminClient()
        if (!PROMO_COLLECTION_ID) throw new Error("Collection ID not found")

        await databases.updateDocument(
            process.env.NEXT_PUBLIC_DATABASE!,
            PROMO_COLLECTION_ID,
            id,
            { active: !currentStatus }
        )
        return { success: true }
    } catch (error) {
        console.error('Failed to toggle promo code', error)
        return { success: false, error: "Erreur de mise à jour" }
    }
}

export async function deletePromoCode(id: string) {
    if (!(await requireAdminSession())) {
        return { success: false, error: "Non autorisé" }
    }

    try {
        const { databases } = await createAdminClient()
        if (!PROMO_COLLECTION_ID) throw new Error("Collection ID not found")

        await databases.deleteDocument(
            process.env.NEXT_PUBLIC_DATABASE!,
            PROMO_COLLECTION_ID,
            id
        )
        return { success: true }
    } catch (error) {
        console.error('Failed to delete promo code', error)
        return { success: false, error: "Impossible de supprimer" }
    }
}

export async function verifyPromoCode(code: string) {
    try {
        const { databases } = await createAdminClient()
        if (!PROMO_COLLECTION_ID) return { success: false, error: "Système de promo indisponible" }

        const { documents } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE!,
            PROMO_COLLECTION_ID,
            [
                Query.equal('code', code),
                Query.equal('active', true)
            ]
        )

        if (documents.length === 0) {
            return { success: false, error: "Code invalide ou expiré" }
        }

        return { success: true, promo: documents[0] as unknown as PromoCode }
    } catch (error) {
        console.error('Promo verification failed', error)
        return { success: false, error: "Erreur de vérification" }
    }
}
