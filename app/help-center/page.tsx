import type { Metadata } from 'next'
import LandingNavbar from '@/components/LandingNavbar'
import Footer from '@/components/sections/Footer'
import { buildSeoMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata: Metadata = buildSeoMetadata({
  title: 'Help Center & Student Support | StudyHelp Nigeria',
  description: 'Need help with StudyHelp? Find answers to FAQs about JAMB, WAEC, premium subscriptions, and troubleshooting the CBT platform.',
  path: '/help-center',
  keywords: ['StudyHelp help center', 'customer support', 'StudyHelp FAQs', 'CBT platform help', 'subscription support', 'contact support'],
})

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 relative z-0 overflow-hidden pt-24">
      <LandingNavbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">StudyHelp Help Center</h1>
          <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
            Find answers to frequently asked questions, learn how to use our CBT platform, and get support for your exam preparation.
          </p>
          <div className="max-w-xl mx-auto relative">
            <input 
              type="text" 
              placeholder="What do you need help with?" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 text-white pl-12 focus:outline-none focus:border-[#5B4CF5] focus:ring-1 focus:ring-[#5B4CF5]"
            />
            <svg className="w-5 h-5 absolute left-4 top-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Category 1 */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-[#5B4CF5]/50 transition-colors">
            <div className="p-3 bg-[#5B4CF5]/10 w-fit rounded-lg text-[#5B4CF5] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Account & Profile</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">How to reset your password</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">Updating your profile information</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">Changing exam preferences (JAMB/WAEC)</a></li>
            </ul>
          </div>

          {/* Category 2 */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-[#5B4CF5]/50 transition-colors">
            <div className="p-3 bg-[#5B4CF5]/10 w-fit rounded-lg text-[#5B4CF5] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Billing & Subscriptions</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">How to upgrade to Premium (₦600/week)</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">Managing your payment methods</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">How to cancel your subscription</a></li>
            </ul>
          </div>

          {/* Category 3 */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-[#5B4CF5]/50 transition-colors">
            <div className="p-3 bg-[#5B4CF5]/10 w-fit rounded-lg text-[#5B4CF5] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">CBT Practice & Scores</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">How to resume a paused CBT mock exam</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">Understanding your performance analytics</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-[#5B4CF5] text-sm">Where to find detailed answer explanations</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 p-8 bg-zinc-900 rounded-xl border border-zinc-800 text-center flex flex-col items-center">
          <h3 className="text-2xl font-bold text-white mb-4">Can't find what you're looking for?</h3>
          <p className="mb-6 text-zinc-400 max-w-lg">
            Our support team is always ready to assist you. Reach out to us directly and we'll get back to you as soon as possible.
          </p>
          <div className="flex gap-4">
            <Link href="/contact" className="bg-[#5B4CF5] hover:bg-[#4a3df0] text-white font-semibold py-3 px-8 rounded-full transition-colors">
              Contact Support
            </Link>
            <Link href="/dashboard/student" className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-8 rounded-full transition-colors border border-zinc-700">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
