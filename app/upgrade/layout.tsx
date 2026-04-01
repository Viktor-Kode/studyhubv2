import type { Metadata } from 'next'
import { buildSeoMetadata } from '@/lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Upgrade Plan - StudyHelp',
  description: 'Upgrade your StudyHelp plan to unlock more advanced learning features.',
  path: '/upgrade',
  noindex: true,
})

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
