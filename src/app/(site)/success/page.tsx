import SuccessClient from '@/components/SuccessClient'
import { Suspense } from 'react'

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen text-white bg-black flex items-center justify-center">Chargement...</div>}>
      <SuccessClient />
    </Suspense>
  )
}
