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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-[#0a0d1a]/95 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 border border-purple-500 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:border-purple-400 group-hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] overflow-hidden bg-slate-900">
              <Image
                src="/apple-touch-icon.png"
                alt="StudyHelp Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              StudyHelp
            </span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              href="/#pricing"
              className="text-slate-400 hover:text-white font-medium transition-colors duration-300 text-sm hidden sm:inline"
            >
              Pricing
            </Link>
            {!isAuthenticated ? (
              <>
                <Link
                  href="/auth/login"
                  className="text-slate-400 hover:text-white font-medium transition-colors duration-300 text-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition-all duration-300 font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition-all duration-300 font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.3)]"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
