'use client'

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

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const isTeacher = user?.role === 'teacher'
  const menuItems = isTeacher ? teacherMenuItems : studentMenuItems

  return (
    <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">StudyHelp</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
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
    </aside>
  )
}
