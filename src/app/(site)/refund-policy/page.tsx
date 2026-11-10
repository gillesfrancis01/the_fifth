import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { refundPolicy } from '@/constants/legal'

export const metadata: Metadata = {
  title: 'Refund Policy | The Fifth Event',
  description: 'Ticket refund and cancellation policy of The Fifth Event.',
}

export default function RefundPolicyPage() {
  return <LegalPage documents={refundPolicy} />
}
