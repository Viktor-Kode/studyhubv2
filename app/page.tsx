'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LandingNavbar from '@/components/LandingNavbar'
import HeroSection from '@/components/sections/HeroSection'
import TeacherFeatures from '@/components/sections/TeacherFeatures'
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
    if (user.role === 'teacher') {
      router.replace('/dashboard/teacher')
      return
    }
    router.replace('/dashboard/student')
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) return null
  if (isAuthenticated && user) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative z-0 overflow-hidden">
      {/* Navigation Bar */}
      <LandingNavbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Additional Sections */}
      <TeacherFeatures />
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
