import type { Metadata } from 'next'
import { buildSeoMetadata } from '@/lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Question Details - StudyHelp',
  description: 'View your submitted question and tutor response on StudyHelp.',
  path: '/questions',
  noindex: true,
})

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
