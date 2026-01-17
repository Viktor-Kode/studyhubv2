'use client'
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

export default function Home() {

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative z-0 overflow-hidden">
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
