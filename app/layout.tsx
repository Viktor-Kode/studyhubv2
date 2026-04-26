import './globals.css'
import '@/styles/gamification-modern.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import ThemeProvider from '@/components/ThemeProvider'
import { buildSeoMetadata, getSiteUrl } from '@/lib/seo'

import Providers from '@/components/Providers'
import HelpWidgetLayer from '@/components/help/HelpWidgetLayer'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import GoogleAdSense from '@/components/GoogleAdSense'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  ...buildSeoMetadata({
    title: 'StudyHelp - #1 Best Online CBT Practice, JAMB, WAEC & AI Study Tools',
    description:
      'Prepare for success with StudyHelp. The most advanced AI study platform for students. Free CBT practice for JAMB, WAEC, NECO, and Post-UTME with real-time analytics and AI explanations.',
    path: '/',
    keywords: [
      'JAMB CBT practice',
      'WAEC past questions',
      'NECO CBT',
      'Post-UTME practice',
      'online study tools',
      'AI study assistant',
      'study notes',
      'education Nigeria',
      'exam prep platform',
      'study help JAMB',
      'studyhelp CBT',
    ],
  }),
  metadataBase: new URL(siteUrl),
  manifest: '/site.webmanifest',
  verification: {
    other: {
      'google-adsense-account': 'ca-pub-6986605854364658',
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '167x167', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StudyHelp',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#5B4CF5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Verification & Meta Tags managed by Metadata API */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StudyHelp" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon.png" />
        
        <GoogleAdSense />
      </head>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider>
            <HelpWidgetLayer />
            {children}
          </ThemeProvider>
        </Providers>
        <Analytics />
        {/* Third-party scripts loaded after page becomes interactive */}
        <Script
          src="https://js.paystack.co/v2/inline.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}

