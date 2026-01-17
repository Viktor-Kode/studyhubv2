'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { FaUser } from 'react-icons/fa'
import { HiOutlineLogout } from 'react-icons/hi'
import Image from 'next/image'

export default function Header() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push('/')
  }

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 overflow-hidden">
              <Image 
                src="/favicon-32x32.png" 
                alt="StudyHelp Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                StudyHelp
              </span>
              <div className="text-xs text-gray-500">Student Dashboard</div>
            </div>
          </Link>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-1 text-gray-600">
              <FaUser className="text-gray-400" />
              <span className="text-sm font-medium ml-1">
                {user?.email?.split('@')[0]}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-300 group"
            >
              <HiOutlineLogout className="text-xl group-hover:rotate-180 transition-transform duration-300" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
