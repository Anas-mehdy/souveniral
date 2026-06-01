import type { Metadata } from 'next'
import { PrivacyPolicyClient } from './PrivacyPolicyClient'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası / سياسة الخصوصية',
  description: 'SouvenirAl gizlilik politikası — kişisel verilerinizin nasıl işlendiğini öğrenin.',
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}
