import type { Metadata } from 'next'
import { buildSeoMetadata } from '@/lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Payment Verification - StudyHelp',
  description: 'Securely verify your StudyHelp subscription payment and continue your learning journey.',
  path: '/payment/verify',
  noindex: true,
})

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
