import { redirect } from 'next/navigation'

import ScannerLogoutButton from '@/components/scan/ScannerLogoutButton'
import { requireScannerSession } from '@/utils/scannerAuth'

export default async function ScannerHomePage() {
  const scanner = await requireScannerSession()

  if (!scanner) {
    redirect('/scan/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-4 py-24 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Connecté</p>
        <h1 className="text-2xl font-semibold text-white">{scanner.name}</h1>
        <p className="text-sm text-white/60">Scannez un billet avec l&apos;appareil photo pour le valider.</p>
      </div>
      <ScannerLogoutButton />
    </div>
  )
}
