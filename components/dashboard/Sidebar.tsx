'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import {
  FaHome,
  FaBrain,
  FaClock,
  FaCalculator,
  FaBell,
  FaChartBar,
  FaCalendar,
  FaLaptop,
  FaBook,
  FaChalkboardTeacher,
  FaUsers,
  FaFilePdf,
  FaQuestionCircle,
  FaTimes,
} from 'react-icons/fa'

const studentMenuItems = [
  { href: '/dashboard', icon: FaHome, label: 'Dashboard' },
  { href: '/dashboard/question-bank', icon: FaBrain, label: 'Question Bank' },
  { href: '/dashboard/study-timer', icon: FaClock, label: 'Study Timer' },
  { href: '/dashboard/cgpa', icon: FaCalculator, label: 'CGPA Calculator' },
  { href: '/dashboard/timetable', icon: FaCalendar, label: 'Timetable & Reminders' },
  { href: '/dashboard/cbt', icon: FaLaptop, label: 'CBT Practice' },
  { href: '/dashboard/flip-cards', icon: FaBook, label: 'Flip Cards' },
  { href: '/dashboard/analytics', icon: FaChartBar, label: 'Analytics' },
]

const teacherMenuItems = [
  { href: '/dashboard/teacher', icon: FaHome, label: 'Dashboard' },
  { href: '/dashboard/teacher/question-generator', icon: FaFilePdf, label: 'Question Generator' },
  { href: '/dashboard/teacher/questions', icon: FaQuestionCircle, label: 'Question Bank' },
  { href: '/dashboard/teacher/classes', icon: FaUsers, label: 'Class Management' },
  { href: '/dashboard/teacher/analytics', icon: FaChartBar, label: 'Analytics' },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const isTeacher = user?.role === 'teacher'
  const menuItems = isTeacher ? teacherMenuItems : studentMenuItems

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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="text-lg" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && onMobileClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
