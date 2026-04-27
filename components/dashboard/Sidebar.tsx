'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePWA } from '@/hooks/usePWA'
import {
  FaHome,
  FaBrain,
  FaClock,
  FaCalculator,
  FaChartBar,
  FaCalendar,
  FaLaptop,
  FaBook,
  FaFileAlt,
  FaTimes,
  FaHistory,
  FaStickyNote,
  FaGraduationCap,
  FaGraduationCap,
  FaTrophy,
  FaPhone,
  FaWhatsapp
} from 'react-icons/fa'

const studentMenuItems = [
  { href: '/dashboard/student', icon: FaHome, label: 'Dashboard' },

  { href: '/dashboard/question-bank', icon: FaBrain, label: 'Question Generator' },
  { href: '/dashboard/tutor', icon: FaGraduationCap, label: 'AI Tutor' },
  { href: '/dashboard/library', icon: FaBook, label: 'My Library' },
  { href: '/dashboard/notes', icon: FaStickyNote, label: 'My Notes' },
  { href: '/dashboard/question-history', icon: FaHistory, label: 'Quiz History' },
  { href: '/dashboard/study-timer', icon: FaClock, label: 'Study Timer' },
  { href: '/dashboard/chat', icon: FaBrain, label: 'AI Assistant' },
  { href: '/dashboard/cgpa', icon: FaCalculator, label: 'CGPA Calculator' },
  { href: '/dashboard/timetable', icon: FaCalendar, label: 'Timetable & Reminders' },
  { href: '/dashboard/cbt', icon: FaLaptop, label: 'Past Question' },
  { href: '/dashboard/student/pdf-cbt', icon: FaFileAlt, label: 'PDF to CBT' },

  { href: '/dashboard/analytics', icon: FaChartBar, label: 'Analytics' },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { isInstallable, isInstalled, installApp } = usePWA()
  const menuItems = studentMenuItems

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileOpen])

  const sidebarContent = (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">StudyHelp</h2>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <FaTimes className="text-xl" />
          </button>
        )}
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'border-2 border-blue-600 bg-transparent text-blue-600 dark:bg-blue-600 dark:text-white'
                : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <Icon className="text-lg" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Support Section */}
      <div className="mt-auto px-6 py-6 border-t border-gray-100 dark:border-gray-700">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Support</h4>
        <div className="space-y-2">
          <a
            href="tel:+2349163345794"
            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <FaPhone className="text-lg text-blue-600 dark:text-blue-400" />
            <span>Call Support</span>
          </a>
          <a
            href="https://wa.me/2349163345794"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <FaWhatsapp className="text-lg text-green-500" />
            <span>WhatsApp Support</span>
          </a>
        </div>
      </div>

      {/* Download App Button */}
      {!isInstalled && (
        <div className="mt-4 px-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center text-center">
              <FaLaptop className="text-3xl mb-2 opacity-90" />
              <h3 className="font-bold text-sm mb-1">Get the app</h3>
              <p className="text-xs text-blue-100 mb-3">
                {isInstallable
                  ? 'Install StudyHelp to access your dashboard faster from your home screen.'
                  : 'On this device, open your browser menu and choose "Add to Home Screen" to install StudyHelp.'}
              </p>
              <button
                onClick={installApp}
                disabled={!isInstallable}
                className={`w-full py-2 bg-white text-blue-600 text-xs font-bold rounded-lg shadow transition-colors ${
                  !isInstallable ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-50'
                }`}
                aria-label="Install App"
              >
                {isInstallable ? 'Install Now' : 'Add via Browser Menu'}
              </button>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && onMobileClose && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-transparent dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-[60] transform transition-transform duration-300 ease-in-out lg:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-full overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
