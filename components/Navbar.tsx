'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

export default function Navbar() {
  const router = useRouter()
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
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
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              StudyHelp
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                >
                  Dashboard
                </Link>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-200 dark:border-blue-800">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-500 font-medium text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
