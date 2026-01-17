'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

export default function Navbar() {
  const router = useRouter()
  const { isAuthenticated, user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <Image 
                src="/favicon-32x32.png" 
                alt="StudyHelp Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-gray-800">StudyHelp</span>
          </Link>
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-800 font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
