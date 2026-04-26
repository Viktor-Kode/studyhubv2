import type { Metadata } from 'next'

const siteName = 'StudyHelp'
const defaultTitle = 'StudyHelp - Free online Past Question & JAMB/WAEC Study Tools'
const defaultDescription =
  'The #1 AI-powered study platform for students. Free online CBT practice, JAMB/WAEC prep, collaborative study groups, and AI-driven notes.'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.studyhelp.site'
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
      site: '@StudyHelpAI',
      title: resolvedTitle,
      description: resolvedDescription,
      images: [imageUrl],
    },
  }
}

export function getSiteUrl() {
  return siteUrl
}
