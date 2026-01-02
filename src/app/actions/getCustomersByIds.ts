'use server'

import { Customer } from '@/types'
import { createAdminClient } from '../../../config/appwrite'
import { Query } from 'node-appwrite'

export default async function getCustomersByIds(ids: string[]): Promise<Customer[]> {
    if (ids.length === 0) {
        return []
    }

    try {
        const { databases } = await createAdminClient()

        // Appwrite queries with large arrays can be limited, so we batch if necessary
        // However, for 100 items (page size), it typically works. 
        // If IDs list is huge (>100), we should split, but for this use case (100 reservations max) it fits.

        // De-duplicate IDs
        const uniqueIds = Array.from(new Set(ids))

        const { documents } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS!,
            [
                Query.equal('$id', uniqueIds),
                Query.limit(uniqueIds.length) // Ensure we get them all
            ]
        )

        return documents as unknown as Customer[]
    } catch (error) {
        console.error('failed to get customers by ids', error)
        return []
    }
}
