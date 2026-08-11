import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import ScannerLoginForm from '@/components/scan/ScannerLoginForm'
import { requireScannerSession } from '@/utils/scannerAuth'

export default async function ScannerLoginPage() {
  const scanner = await requireScannerSession()

  if (scanner) {
    redirect('/scan')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-24">
      <Suspense fallback={null}>
        <ScannerLoginForm />
      </Suspense>
    </div>
  )
}
