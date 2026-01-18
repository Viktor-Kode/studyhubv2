'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { FaUser, FaBars } from 'react-icons/fa'
import { HiOutlineLogout } from 'react-icons/hi'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const isTeacher = user?.role === 'teacher'

  const handleLogout = () => {
    clearAuth()
    router.push('/')
  }

  return (
    <header className="bg-white dark:bg-gray-900/90 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
            >
              <FaBars className="text-xl" />
            </button>

            <Link
              href={isTeacher ? "/dashboard/teacher" : "/dashboard"}
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center space-x-1 text-gray-600 dark:text-gray-300">
              <FaUser className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium ml-1">
                {user?.email?.split('@')[0]}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors duration-300 group"
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
