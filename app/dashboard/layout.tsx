'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useThemeStore } from '@/lib/store/themeStore'
import { authService } from '@/lib/auth/authService'
import {
    FiHome, FiBook, FiClock, FiCalendar, FiCreditCard,
    FiBarChart2, FiMenu, FiX, FiLogOut,
    FiUser, FiSettings, FiSun, FiMoon, FiChevronDown,
    FiGrid, FiFileText
} from 'react-icons/fi'
import { MdQuiz, MdSchool } from 'react-icons/md'
import { BiCard } from 'react-icons/bi'

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
    roles?: ('student' | 'teacher')[]
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/dashboard/question-bank', label: 'Question Bank', icon: FiBook },
    { href: '/dashboard/question-history', label: 'Question History', icon: FiFileText },
    { href: '/dashboard/study-timer', label: 'Study Timer', icon: FiClock },
    { href: '/dashboard/flip-cards', label: 'Flashcard Hub', icon: BiCard },
    { href: '/dashboard/timetable', label: 'Timetable & Reminders', icon: FiCalendar },
    { href: '/dashboard/cgpa', label: 'CGPA Calculator', icon: FiCreditCard, roles: ['student'] },
    { href: '/dashboard/cbt', label: 'CBT Practice', icon: MdQuiz },
    { href: '/dashboard/analytics', label: 'Progress Analytics', icon: FiBarChart2 },
    { href: '/dashboard/settings', label: 'Settings', icon: FiSettings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const { theme, toggleTheme } = useThemeStore()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)

    const handleLogout = async () => {
        try {
            await authService.logout()
        } catch (error) {
            // ignore logout errors
        } finally {
            logout()
            router.push('/auth/login')
        }
    }

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true
        return user?.role && item.roles.includes(user.role)
    })

    const isDark = theme === 'dark'

    return (
        <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                {/* Top Navbar */}
                <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
                    <div className="h-full px-4 flex items-center justify-between">

                        {/* Left: Logo + Menu Toggle */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                            >
                                {sidebarOpen ? <FiX className="text-xl text-gray-700 dark:text-gray-300" /> : <FiMenu className="text-xl text-gray-700 dark:text-gray-300" />}
                            </button>

                            <Link href="/dashboard" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <MdSchool className="text-white text-xl" />
                                </div>
                                <span className="font-bold text-xl hidden sm:block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    StudyBuddy
                                </span>
                            </Link>
                        </div>

                        {/* Right: User Menu + Theme Toggle */}
                        <div className="flex items-center gap-3">

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {isDark ? (
                                    <FiSun className="text-xl text-yellow-400" />
                                ) : (
                                    <FiMoon className="text-xl text-gray-600" />
                                )}
                            </button>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <FiUser className="text-white" />
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user?.name || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                            {user?.role || 'Student'}
                                        </p>
                                    </div>
                                    <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                                </button>

                                {/* Dropdown */}
                                {showUserMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowUserMenu(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user?.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {user?.email}
                                                </p>
                                            </div>

                                            <Link
                                                href="/dashboard/settings"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <FiSettings className="text-base" />
                                                Settings
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            >
                                                <FiLogOut className="text-base" />
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Sidebar */}
                <aside
                    className={`fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                        }`}
                >
                    <div className="h-full overflow-y-auto py-4">
                        <nav className="space-y-1 px-3">
                            {filteredNavItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <Icon className={`text-lg ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="pt-16 lg:pl-64">
                    <div className="p-6">
                        <ProtectedRoute>
                            {children}
                        </ProtectedRoute>
                    </div>
                </main>
            </div>
        </div>
    )
}
