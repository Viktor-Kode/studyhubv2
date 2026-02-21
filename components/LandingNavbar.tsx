'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store/authStore'
import { useEffect, useState } from 'react'

export default function LandingNavbar() {
  const { isAuthenticated, user } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const dashboardLink = user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 border border-cyan-400 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:border-cyan-300 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] overflow-hidden">
              <Image
                src="/favicon-32x32.png"
                alt="StudyHelp Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              StudyHelp
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/auth/login"
                  className="text-white/60 hover:text-white font-medium transition-colors duration-300 uppercase tracking-wide text-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-cyan-400 text-black px-6 py-2.5 rounded-lg hover:bg-cyan-300 transition-all duration-300 font-bold text-sm uppercase tracking-wide hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] hover:scale-105"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <Link
                href={dashboardLink}
                className="bg-cyan-400 text-black px-6 py-2.5 rounded-lg hover:bg-cyan-300 transition-all duration-300 font-bold text-sm uppercase tracking-wide hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] hover:scale-105"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
