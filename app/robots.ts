import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/community/notifications',
          '/community/profile',
          '/payment/verify',
          '/debug-env'
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
