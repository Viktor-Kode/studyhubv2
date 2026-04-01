import type { Metadata } from 'next'

const siteName = 'StudyHelp'
const defaultTitle = 'StudyHelp - Ace Your Exams with Free CBTs & Study Tools'
const defaultDescription =
  'Free online CBT practice, collaborative study groups, notes, and learning tools for students and educators.'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://studyhub.com'
const defaultImage = `${siteUrl}/og-image.png`

type BuildSeoMetadataArgs = {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
  image?: string
  type?: 'website' | 'article'
  keywords?: string[]
}

export function buildSeoMetadata({
  title,
  description,
  path = '/',
  noindex = false,
  image,
  type = 'website',
  keywords = [],
}: BuildSeoMetadataArgs = {}): Metadata {
  const resolvedTitle = title || defaultTitle
  const resolvedDescription = description || defaultDescription
  const canonical = new URL(path, siteUrl).toString()
  const imageUrl = image || defaultImage

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type,
      url: canonical,
      siteName,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@studyhub',
      title: resolvedTitle,
      description: resolvedDescription,
      images: [imageUrl],
    },
  }
}

export function getSiteUrl() {
  return siteUrl
}
