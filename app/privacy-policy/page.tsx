import type { Metadata } from 'next'
import LandingNavbar from '@/components/LandingNavbar'
import Footer from '@/components/sections/Footer'
import { buildSeoMetadata } from '@/lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Privacy Policy | StudyHelp Nigeria',
  description: 'Learn how StudyHelp protects your personal data, exam scores, and payment information. Your privacy is our top priority while you study.',
  path: '/privacy-policy',
  keywords: ['StudyHelp privacy policy', 'student data protection', 'user privacy', 'exam platform security', 'how we use your data'],
})

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 relative z-0 overflow-hidden pt-24">
      <LandingNavbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-zinc-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>At StudyHelp Nigeria, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our CBT practice platform. Our primary commitment is to protect student data so you can focus entirely on your exam preparation.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p>We collect information that you voluntarily provide to us when you register on the platform. This includes:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Personal Data:</strong> Name, email address, and profile picture (if applicable).</li>
              <li><strong>Educational Data:</strong> Your exam preferences (JAMB, WAEC, NECO), subjects of interest, and mock exam scores.</li>
              <li><strong>Financial Data:</strong> Data related to your payment method when you upgrade to our ₦600/week premium plan. We do not store full credit card numbers on our servers; they are processed securely by our payment gateways.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use your info to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Create and manage your student account.</li>
              <li>Process your ₦600/week subscription securely.</li>
              <li>Personalize your CBT experience and track your study progress.</li>
              <li>Send you targeted educational material, updates, and exam tips.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
            <p>We use administrative, technical, and physical security measures to help protect your personal information. Your passwords and payment information are encrypted. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p>We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, and customer service. We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties for marketing purposes.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p>You have the right to request access to your personal data, request correction of any inaccurate data, and request the deletion of your account and associated data. You can manage these settings directly from your student dashboard or by contacting our support team.</p>
          </section>
          
          <div className="mt-12 p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Your data is completely secure.</h3>
            <p className="mb-6">We protect your privacy so you can focus entirely on studying and crushing your exams.</p>
            <a href="/auth/signup" className="inline-block bg-[#5B4CF5] hover:bg-[#4a3df0] text-white font-semibold py-3 px-8 rounded-full transition-colors">
              Sign up and start practicing safely
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
