import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const routes: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/',               priority: 1.0, freq: 'daily' },
    { path: '/upgrade',        priority: 0.9, freq: 'weekly' },
    { path: '/questions',      priority: 0.8, freq: 'daily' },
    { path: '/groups',         priority: 0.7, freq: 'weekly' },
    { path: '/contact',        priority: 0.6, freq: 'monthly' },
    { path: '/help-center',    priority: 0.6, freq: 'monthly' },
    { path: '/privacy-policy', priority: 0.3, freq: 'yearly' },
    { path: '/terms',          priority: 0.3, freq: 'yearly' },
    { path: '/cookie-policy',  priority: 0.3, freq: 'yearly' },
  ]

  return routes.map(({ path, priority, freq }) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }))
}
