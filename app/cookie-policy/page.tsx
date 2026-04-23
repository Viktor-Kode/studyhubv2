import type { Metadata } from 'next'
import LandingNavbar from '@/components/LandingNavbar'
import Footer from '@/components/sections/Footer'
import { buildSeoMetadata } from '@/lib/seo'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Cookie Policy | StudyHelp Nigeria',
  description: 'Understand how StudyHelp uses cookies to improve your CBT practice experience, track progress, and provide a personalized exam prep journey.',
  path: '/cookie-policy',
  keywords: ['StudyHelp cookie policy', 'web cookies', 'site tracking', 'browser cookies', 'user experience'],
})

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 relative z-0 overflow-hidden pt-24">
      <LandingNavbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Cookie Policy</h1>
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-zinc-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. What Are Cookies?</h2>
            <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. At StudyHelp, we use cookies to ensure you have the best studying experience.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Cookies</h2>
            <p>We use cookies for several reasons, primarily to keep you logged in so you don't lose your mock exam progress if your internet connection temporarily drops. They also help us understand how students use our platform, allowing us to improve our CBT questions and dashboard features.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Types of Cookies We Use</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Essential Cookies:</strong> These are required for the operation of StudyHelp. They include, for example, cookies that enable you to log into your account securely and process payments for the ₦600/week premium subscription.</li>
              <li><strong>Performance/Analytics Cookies:</strong> They allow us to recognize and count the number of students and see how they move around the platform. This helps us improve the way StudyHelp works, for instance, by ensuring students find the past questions they are looking for easily.</li>
              <li><strong>Functionality Cookies:</strong> These are used to recognize you when you return to StudyHelp. This enables us to personalize our content for you and remember your exam preferences (e.g., your choice of JAMB or WAEC).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Managing Your Cookie Preferences</h2>
            <p>You can set your browser not to accept cookies, and you can remove cookies from your browser. However, in a few cases, some of our platform features (like saving CBT mock exam progress) may not function properly without them.</p>
          </section>

          <div className="mt-12 p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
            <h3 className="text-xl font-bold text-white mb-2">We use cookies to save your progress!</h3>
            <p className="mb-6">Keep your mock exams synced and never lose your answers.</p>
            <a href="/auth/signup" className="inline-block bg-[#5B4CF5] hover:bg-[#4a3df0] text-white font-semibold py-3 px-8 rounded-full transition-colors">
              Create your account now
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
