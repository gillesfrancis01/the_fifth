'use server'

import { Customer } from '@/types'
import { createAdminClient } from '../../../config/appwrite'
import { requireAdminSession } from '@/utils/adminAuth'

import { Query } from 'node-appwrite'

export default async function getAllCustomers(): Promise<Customer[]> {
  if (!(await requireAdminSession())) {
    return []
  }

  try {
    const { databases } = await createAdminClient()

    const { documents } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS!,
      [Query.orderDesc('$createdAt'), Query.limit(1000)]
    )

    return documents as unknown as Customer[]
  } catch (error) {
    console.error('failed to get customers', error)
    return []
  }
}
