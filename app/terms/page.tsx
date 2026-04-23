import type { Metadata } from 'next'
import LandingNavbar from '@/components/LandingNavbar'
import Footer from '@/components/sections/Footer'
import { buildSeoMetadata } from '@/lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Terms of Service | StudyHelp Nigeria',
  description: 'Read the Terms of Service for using StudyHelp. Learn about our user agreements, premium subscriptions (₦600/week), and platform guidelines.',
  path: '/terms',
  keywords: ['StudyHelp terms of service', 'terms and conditions', 'user agreement', 'StudyHelp subscription rules', 'exam prep terms'],
})

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 relative z-0 overflow-hidden pt-24">
      <LandingNavbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-zinc-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using the StudyHelp platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. User Accounts</h2>
            <p>When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Subscriptions & Payments</h2>
            <p>StudyHelp offers a premium subscription model at <strong>₦600 per week</strong>. This subscription grants full access to all JAMB, WAEC, and NECO CBT practice questions and detailed explanations. Subscriptions are billed on a recurring basis and can be cancelled at any time through your dashboard.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use Policy</h2>
            <p>You agree not to use the platform to cheat, scrape content, or distribute our proprietary questions and answers. StudyHelp reserves the right to suspend or terminate accounts that violate our community guidelines without prior notice or refund.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
            <p>The CBT platform, custom solutions, content, and features are and will remain the exclusive property of StudyHelp. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of StudyHelp.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p>In no event shall StudyHelp, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the platform.</p>
          </section>
          
          <div className="mt-12 p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to study smart?</h3>
            <p className="mb-6">By using StudyHelp, you're agreeing to study smart and respect the community.</p>
            <a href="/dashboard/student" className="inline-block bg-[#5B4CF5] hover:bg-[#4a3df0] text-white font-semibold py-3 px-8 rounded-full transition-colors">
              Upgrade to Premium today!
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
