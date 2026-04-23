import type { Metadata } from 'next'
import { buildSeoMetadata } from '@/lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Contact Us | StudyHelp Nigeria',
  description: 'Have a question or need assistance? Contact the StudyHelp team at studyhelp440@gmail.com for support with your WAEC, JAMB, or NECO prep.',
  path: '/contact',
  keywords: ['Contact StudyHelp', 'StudyHelp customer service', 'email StudyHelp', 'StudyHelp phone number', 'reach out to StudyHelp'],
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
