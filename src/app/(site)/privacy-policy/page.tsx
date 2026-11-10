import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { privacyPolicy } from '@/constants/legal'

export const metadata: Metadata = {
  title: 'Privacy Policy | The Fifth Event',
  description: 'How The Fifth Event collects, uses and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return <LegalPage documents={privacyPolicy} />
}
