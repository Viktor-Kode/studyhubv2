'use client'
import LandingNavbar from '@/components/LandingNavbar'
import Footer from '@/components/sections/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 relative z-0 overflow-hidden pt-24">
      <LandingNavbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">Contact Us</h1>
        <p className="text-center text-lg mb-12 text-zinc-400">
          We're here to help you succeed! Whether you have a question about a past question, a billing issue, or just need some study advice, drop us a line.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 rounded-lg text-[#5B4CF5]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Email Support</h3>
                  <a href="mailto:studyhelp440@gmail.com" className="text-[#5B4CF5] hover:underline">studyhelp440@gmail.com</a>
                  <p className="text-sm text-zinc-500 mt-1">We usually reply within 24 hours.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 rounded-lg text-[#5B4CF5]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Call or WhatsApp</h3>
                  <div className="flex flex-col gap-1">
                    <a href="tel:+2349163345794" className="text-[#5B4CF5] hover:underline">+234 9163345794</a>
                    <a href="https://wa.me/2349163345794" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline flex items-center gap-1">
                      Chat on WhatsApp
                    </a>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">Available for quick support and inquiries.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 rounded-lg text-[#5B4CF5]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Business Hours</h3>
                  <p className="text-zinc-400">Monday - Friday: 8:00 AM - 6:00 PM (WAT)</p>
                  <p className="text-sm text-zinc-500 mt-1">Weekend support available for premium members.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-10 p-6 bg-[#5B4CF5]/10 rounded-xl border border-[#5B4CF5]/20">
              <h3 className="text-white font-medium mb-2">Check the Help Center</h3>
              <p className="text-sm mb-4">Your question might already be answered! Visit our Help Center for instant solutions.</p>
              <a href="/help-center" className="text-[#5B4CF5] font-medium hover:underline flex items-center gap-2">
                Visit Help Center <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
                <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5B4CF5] focus:ring-1 focus:ring-[#5B4CF5]" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                <input type="email" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5B4CF5] focus:ring-1 focus:ring-[#5B4CF5]" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Subject</label>
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5B4CF5] focus:ring-1 focus:ring-[#5B4CF5]">
                  <option>General Inquiry</option>
                  <option>Billing & Subscriptions (₦600/week)</option>
                  <option>Technical Issue</option>
                  <option>Partnership</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Message</label>
                <textarea rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5B4CF5] focus:ring-1 focus:ring-[#5B4CF5]" placeholder="How can we help you?"></textarea>
              </div>
              <button 
                type="button" 
                onClick={() => alert("Message submitted! We will get back to you at studyhelp440@gmail.com.")}
                className="w-full bg-[#5B4CF5] hover:bg-[#4a3df0] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
