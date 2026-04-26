'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'

const PUBLIC_ROUTES = [
  '/',
  '/contact',
  '/help-center',
  '/privacy-policy',
  '/terms',
  '/cookie-policy',
  '/about'
]

export default function GoogleAdSense() {
  const pathname = usePathname()
  
  // Only load AdSense on public pages and NOT on dashboard or auth pages
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isProtectedBase = pathname.startsWith('/dashboard') || pathname.startsWith('/auth')
  
  if (!isPublicRoute || isProtectedBase) {
    return null
  }

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6986605854364658"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
