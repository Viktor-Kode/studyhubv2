'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useThemeStore } from '@/lib/store/themeStore'
import { firebaseSignOut } from '@/lib/firebase-auth'
import {
    FiHome, FiBook, FiClock, FiCalendar, FiCreditCard,
    FiBarChart2, FiMenu, FiX, FiLogOut, FiAward,
    FiUser, FiSettings, FiSun, FiMoon, FiChevronDown,
    FiGrid, FiFileText, FiCpu, FiBookOpen, FiShield, FiFile, FiUsers
} from 'react-icons/fi'
import { MdQuiz, MdSchool } from 'react-icons/md'
import { BiCard } from 'react-icons/bi'
import { useTimerStore } from '@/lib/store/timerStore'
import { usePWA } from '@/hooks/usePWA'
import { useSaveLastPage } from '@/hooks/useSaveLastPage'
import NotificationBell from '@/components/notifications/NotificationBell'

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
    roles?: ('student' | 'teacher' | 'admin')[]
}

const navItems: NavItem[] = [
    // Shared
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/dashboard/settings', label: 'Settings', icon: FiSettings },

    // Learner tools (students + teachers; no separate teacher dashboard)
    { href: '/dashboard/question-bank', label: 'Question Generator', icon: FiBook, roles: ['student', 'teacher'] },
    { href: '/dashboard/library', label: 'My Library', icon: FiBookOpen, roles: ['student', 'teacher'] },
    { href: '/dashboard/study-timer', label: 'Study Timer', icon: FiClock, roles: ['student', 'teacher'] },
    { href: '/dashboard/timetable', label: 'Timetable & Reminders', icon: FiCalendar, roles: ['student', 'teacher'] },
    { href: '/dashboard/cgpa', label: 'CGPA Calculator', icon: FiCreditCard, roles: ['student', 'teacher'] },
    { href: '/dashboard/cbt', label: 'CBT Practice', icon: MdQuiz, roles: ['student', 'teacher'] },
    { href: '/dashboard/student/pdf-cbt', label: 'PDF to CBT', icon: FiFile, roles: ['student', 'teacher'] },
    { href: '/dashboard/analytics', label: 'Progress Analytics', icon: FiBarChart2, roles: ['student', 'teacher'] },

    // Shared (but logically separates history by role maybe, both can use it)
    { href: '/dashboard/question-history', label: 'Quiz History', icon: FiFileText },

    // Admin only
    { href: '/dashboard/admin', label: 'Admin Dashboard', icon: FiShield, roles: ['admin'] },
    { href: '/community', label: 'Community', icon: FiAward, roles: ['admin'] },
    { href: '/dashboard/admin/logins', label: 'Dashboard Logins', icon: FiClock, roles: ['admin'] },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuthStore()
    useSaveLastPage()
    const { theme, toggleTheme } = useThemeStore()
    const { isInstallable, isInstalled, installApp } = usePWA()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)

    const handleLogout = async () => {
        try {
            await firebaseSignOut()
        } catch (error) {
            // ignore logout errors
        } finally {
            logout()
            router.push('/auth/login')
        }
    }

    const store = useTimerStore()

    // Initialize Global Timer State — fires once per login session (keyed on uid).
    // Deliberately NOT depending on the full `user` object so that background
    // refreshUser() profile patches don't re-trigger init() and cause duplicate
    // /api/backend/study/active-timer requests.
    const uid = user?.uid
    useEffect(() => {
        if (uid) {
            store.init()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid])

    // Global Timer TICK to run anywhere in dashboard
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (store.isActive && !store.isPaused) {
            interval = setInterval(() => {
                store.tick()
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [store.isActive, store.isPaused, store])

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true
        return user?.role && item.roles.includes(user.role as 'student' | 'teacher' | 'admin')
    })

    const isDark = theme === 'dark'

    return (
        <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                {/* Top Navbar */}
                <nav className="fixed top-0 left-0 right-0 min-h-14 sm:min-h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 w-full max-w-[100vw] pt-[env(safe-area-inset-top)]">
                    <div className="h-full px-3 sm:px-4 flex items-center justify-between min-w-0 w-full">

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
                                    StudyHelp
                                </span>
                            </Link>
                        </div>

                        {/* Right: User Menu + Theme Toggle */}
                        <div className="flex items-center gap-3">

                            <NotificationBell />

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
                                        <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
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
                    className={`fixed top-14 sm:top-16 left-0 bottom-0 w-64 max-w-[min(256px,85vw)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-transform duration-300 overflow-hidden flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                        }`}
                >
                    <div className="h-full overflow-y-auto overflow-x-hidden py-4 min-w-0">
                        <nav className="space-y-1 px-3 min-w-0">
                            {filteredNavItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition min-w-0 ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <Icon className={`text-lg flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                        <span className="break-words min-w-0 flex-1">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Download App Button */}
                        {!isInstalled && (
                            <div className="mt-8 px-4 pb-4 min-w-0">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden min-w-0">
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <FiCpu className="text-3xl mb-2 opacity-90" />
                                        <h3 className="font-bold text-sm mb-1 text-white">Get the app</h3>
                                        <p className="text-xs text-white/95 mb-3 break-words overflow-hidden leading-snug [text-shadow:0_1px_2px_rgba(0,0,0,0.2)]">
                                            {isInstallable
                                                ? 'Install StudyHelp to access your dashboard faster from your home screen.'
                                                : 'On this device, use your browser menu and choose "Add to Home Screen" to install StudyHelp.'}
                                        </p>
                                        <button
                                            onClick={installApp}
                                            disabled={!isInstallable}
                                            className={`w-full py-2 bg-white text-blue-600 text-xs font-bold rounded-lg shadow transition-colors ${!isInstallable ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-50'
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
                </aside>

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-[calc(4rem+env(safe-area-inset-top))] lg:pl-64 min-w-0 w-full max-w-full overflow-x-hidden">
                    <div className="p-3 sm:p-5 md:p-6 w-full max-w-full min-w-0 box-border overflow-hidden">
                        <ProtectedRoute>
                            {children}
                        </ProtectedRoute>
                    </div>
                </main>
            </div>
        </div>
    )
}
