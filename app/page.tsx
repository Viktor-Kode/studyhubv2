'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import LandingNavbar from '@/components/LandingNavbar'
import HeroSection from '@/components/sections/HeroSection'
import StudentFeatures from '@/components/sections/StudentFeatures'
import AIWorkflow from '@/components/sections/AIWorkflow'
import DualDashboard from '@/components/sections/DualDashboard'
import BenefitsSection from '@/components/sections/BenefitsSection'
import IntegrationSection from '@/components/sections/IntegrationSection'
import Testimonials from '@/components/sections/Testimonials'
import PricingSection from '@/components/sections/PricingSection'
import FinalCTA from '@/components/sections/FinalCTA'
import Footer from '@/components/sections/Footer'
import { useAuthStore } from '@/lib/store/authStore'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return

    if (user.role === 'admin') {
      router.replace('/dashboard/admin')
      return
    }
    router.replace('/dashboard/student')
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) return null
  if (isAuthenticated && user) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative z-0 overflow-hidden">
      <Script
        id="home-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'StudyHelp',
              url: 'https://www.studyhelp.site',
              logo: 'https://www.studyhelp.site/logo.png',
            },
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'StudyHelp',
              url: 'https://www.studyhelp.site',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.studyhelp.site/?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://www.studyhelp.site/',
                },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: 'StudyHelp Core Features',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Past Question',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Shared Notes',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: 'Study Groups',
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: 'Progress Analytics',
                },
              ],
            },
          ]),
        }}
      />
      {/* Navigation Bar */}
      <LandingNavbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Additional Sections */}
      <StudentFeatures />
      <AIWorkflow />
      <DualDashboard />
      <BenefitsSection />
      <IntegrationSection />
      <Testimonials />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}
