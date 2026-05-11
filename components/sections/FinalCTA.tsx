'use client'

import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="py-24 bg-[#0a0d1a] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto bg-gradient-to-b from-slate-900 to-slate-900/50 border border-slate-800 rounded-[3rem] p-12 md:p-20 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to join <span className="text-purple-400">183+ students</span>?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Stop struggling and start studying smarter. It takes less than 30 seconds to get started.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/auth/signup"
              className="px-12 py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(147,51,234,0.4)]"
            >
              Start Free Now
            </Link>
          </div>
          
          <p className="mt-8 text-slate-500 text-sm">
            No credit card required • Instant access • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
