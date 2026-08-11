import ScannerManager from '@/components/admin/ScannerManager'
import getAllEvents from '@/app/actions/getAllEvent'
import { getScanners } from '@/app/actions/adminScanners'

export default async function AdminScannersPage() {
  const [events, scanners] = await Promise.all([getAllEvents(), getScanners()])

  return (
    <div className="space-y-10">
      <ScannerManager events={events ?? []} scanners={scanners} />
    </div>
  )
}
