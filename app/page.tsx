'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import LandingNavbar from '@/components/LandingNavbar'
import HeroSection from '@/components/sections/HeroSection'
import SocialProofBar from '@/components/sections/SocialProofBar'
import ProblemSection from '@/components/sections/ProblemSection'
import FeaturesSection from '@/components/sections/FeaturesSection'
import HowItWorks from '@/components/sections/HowItWorks'
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
    <div className="min-h-screen bg-[#0a0d1a] relative z-0 overflow-hidden">
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
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+234-916-334-5794',
                contactType: 'customer support',
                areaServed: 'NG',
                availableLanguage: 'English',
              },
              sameAs: [
                'https://twitter.com/StudyHelpAI',
              ],
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
              '@type': 'SoftwareApplication',
              name: 'StudyHelp',
              operatingSystem: 'Web, Android, iOS',
              applicationCategory: 'EducationApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'NGN',
              },
              description:
                'AI-powered CBT practice platform for Nigerian university students. Turn lecturer notes into practice questions for JAMB, WAEC, NECO, and Post-UTME.',
              url: 'https://www.studyhelp.site',
            },
            {
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'StudyHelp',
              url: 'https://www.studyhelp.site',
              description:
                'The #1 AI-powered study platform for Nigerian university students preparing for JAMB, WAEC, NECO, and Post-UTME examinations.',
              areaServed: {
                '@type': 'Country',
                name: 'Nigeria',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is StudyHelp?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'StudyHelp is an AI-powered CBT practice platform built for Nigerian university students. It lets you turn your lecturer notes into practice questions for JAMB, WAEC, NECO, and Post-UTME exams.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is StudyHelp free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Yes! StudyHelp has a free plan with 3 practice sessions (10 questions each). You can upgrade to a Weekly plan (₦1,000) or Monthly plan (₦3,500) for unlimited access.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can StudyHelp generate JAMB past questions?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Yes. StudyHelp uses AI to generate CBT-style practice questions in the format of JAMB, WAEC, NECO, and Post-UTME exams. You can also upload your own notes and get custom questions instantly.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I prepare for WAEC using StudyHelp?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Sign up for free on StudyHelp, select WAEC as your exam type, choose your subjects, and start practicing. The AI study tutor explains every answer so you learn while you practice.',
                  },
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

      {/* Social Proof Bar */}
      <SocialProofBar />

      {/* Problem Section */}
      <ProblemSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Pricing Section */}
      <PricingSection />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  )
}
