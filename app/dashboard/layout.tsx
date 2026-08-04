'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useThemeStore } from '@/lib/store/themeStore'
import { FiHome, FiBook, FiClock, FiCalendar, FiCreditCard,
    FiBarChart2, FiMenu, FiX,
    FiGrid, FiFileText, FiCpu, FiBookOpen, FiShield, FiFile, FiUsers, FiPhone,
    FiTarget
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { MdQuiz, MdSchool } from 'react-icons/md'
import { BiCard } from 'react-icons/bi'
import { useTimerStore } from '@/lib/store/timerStore'
import { usePWA } from '@/hooks/usePWA'
import { useSaveLastPage } from '@/hooks/useSaveLastPage'
import BackButton from '@/components/BackButton'
import WebPushPrompt from '@/components/WebPushPrompt'
import WhatsAppCollectModal from '@/components/WhatsAppCollectModal'
import { getProgressQueue, removeProgressItem } from '@/lib/utils/offlineDb'
import { cbtApi } from '@/lib/api/cbt'
import { reviewCard } from '@/lib/api/flashcardApi'
import { studyPlanApi } from '@/lib/api/studyPlanApi'
import { toast } from 'react-hot-toast'
import ReminderBanner from '@/components/dashboard/ReminderBanner'

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
    roles?: ('student' | 'teacher' | 'admin')[]
}

const navItems: NavItem[] = [
    // Shared
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },


    // Learner tools (students + teachers; no separate teacher dashboard)
    { href: '/dashboard/question-bank', label: 'Question Generator', icon: FiBook, roles: ['student', 'teacher'] },
    { href: '/dashboard/library', label: 'My Library', icon: FiBookOpen, roles: ['student', 'teacher'] },
    { href: '/dashboard/study-timer', label: 'Study Timer', icon: FiClock, roles: ['student', 'teacher'] },
    { href: '/dashboard/timetable', label: 'Timetable & Reminders', icon: FiCalendar, roles: ['student', 'teacher'] },
    { href: '/dashboard/cgpa', label: 'CGPA Calculator', icon: FiCreditCard, roles: ['student', 'teacher'] },
    { href: '/dashboard/cbt', label: 'Past Question', icon: MdQuiz, roles: ['student', 'teacher'] },

    { href: '/dashboard/analytics', label: 'Progress Analytics', icon: FiBarChart2, roles: ['student', 'teacher'] },

    // Shared (but logically separates history by role maybe, both can use it)
    { href: '/dashboard/question-history', label: 'Quiz History', icon: FiFileText },

    // Admin only
    { href: '/dashboard/admin', label: 'Admin Dashboard', icon: FiShield, roles: ['admin'] },
    { href: '/dashboard/student/community', label: 'Leaderboard', icon: FiTarget, roles: ['student', 'teacher', 'admin'] },
    { href: '/dashboard/admin/logins', label: 'Dashboard Logins', icon: FiClock, roles: ['admin'] },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { user } = useAuthStore()
    useSaveLastPage()
    const { theme } = useThemeStore()
    const { isInstallable, isInstalled, installApp } = usePWA()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isOffline, setIsOffline] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    const syncProgress = async () => {
        try {
            const queue = await getProgressQueue()
            if (queue.length === 0) return

            setIsSyncing(true)
            toast.loading('Syncing offline progress...', { id: 'offline-sync' })

            for (const item of queue) {
                try {
                    if (item.type === 'cbt') {
                        await cbtApi.saveResult(item.data)
                    } else if (item.type === 'flashcard') {
                        await reviewCard(item.data)
                    } else if (item.type === 'planner') {
                        await studyPlanApi.updateTaskStatus(item.data.taskId, item.data.completed)
                    }
                    if (item.key !== undefined) {
                        await removeProgressItem(item.key)
                    }
                } catch (err) {
                    console.error('Failed to sync offline item:', item, err)
                }
            }

            toast.success('Offline progress synchronized!', { id: 'offline-sync' })
        } catch (error) {
            console.error('Offline sync error:', error)
            toast.error('Failed to sync some offline progress.', { id: 'offline-sync' })
        } finally {
            setIsSyncing(false)
        }
    }

    useEffect(() => {
        if (typeof window === 'undefined') return

        const updateOnlineStatus = () => {
            const offline = !navigator.onLine
            setIsOffline(offline)
            if (!offline) {
                syncProgress()
            }
        }

        updateOnlineStatus()
        window.addEventListener('online', updateOnlineStatus)
        window.addEventListener('offline', updateOnlineStatus)

        if (navigator.onLine) {
            syncProgress()
        }

        return () => {
            window.removeEventListener('online', updateOnlineStatus)
            window.removeEventListener('offline', updateOnlineStatus)
        }
    }, [])


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
    const isTutorPage = pathname === '/dashboard/tutor'
    const isDarkFullPage =
        pathname === '/dashboard/student' ||
        pathname === '/dashboard/study' ||
        pathname === '/dashboard/community' ||
        pathname === '/dashboard/leaderboard' ||
        pathname === '/dashboard/profile' ||
        pathname === '/dashboard/analytics' ||
        pathname === '/dashboard/timetable' ||
        pathname === '/dashboard/notes-history' ||
        (pathname ? pathname.startsWith('/dashboard/student/') : false)

    if (isTutorPage) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
                <ProtectedRoute>
                    {children}
                </ProtectedRoute>
                <WebPushPrompt />
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${isDark || isDarkFullPage ? 'dark' : ''}`} style={isDarkFullPage ? { background: 'var(--bg)' } : undefined}>
            <div className={`min-h-screen ${isDarkFullPage ? '' : 'bg-gray-50 dark:bg-gray-900'}`} style={isDarkFullPage ? { background: 'var(--bg)' } : undefined}>



                {/* Sidebar */}
                <aside
                    id="sidebar-nav"
                    className={`fixed top-0 left-0 bottom-0 w-64 max-w-[min(256px,85vw)] bg-white lg:bg-transparent dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-transform duration-300 overflow-hidden flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                        }`}
                    aria-label="Main navigation"
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
                                        // Disable prefetch for the library to avoid unused CSS preload warnings from PDF components
                                        prefetch={item.href === '/dashboard/library' ? false : undefined}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition min-w-0 ${isActive
                                            ? 'border-2 border-blue-600 bg-transparent text-blue-600 dark:bg-blue-900/20 dark:border-transparent dark:text-blue-400'
                                            : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <Icon className={`text-lg flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                        <span className="break-words min-w-0 flex-1">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Support Section */}
                        <div className="mt-auto px-4 py-6 border-t border-gray-100 dark:border-gray-700 min-w-0">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Support</h4>
                            <div className="space-y-2">
                                <Link
                                    href="/dashboard/settings?tab=referrals"
                                    onClick={() => setSidebarOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    <FiUsers className="text-lg text-purple-600 dark:text-purple-400" />
                                    <span>Refer & Earn</span>
                                </Link>
                                <a
                                    href="tel:+2349163345794"
                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    <FiPhone className="text-lg text-blue-600 dark:text-blue-400" />
                                    <span>Call Support</span>
                                </a>
                                <a
                                    href="https://wa.me/2349163345794"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    <FaWhatsapp className="text-lg text-green-500" />
                                    <span>WhatsApp Support</span>
                                </a>
                            </div>
                        </div>

                        {/* Download App Button */}
                        {!isInstalled && (
                            <div className="mt-4 px-4 pb-4 min-w-0">
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
                <main className="pt-0 lg:pl-64 min-w-0 w-full max-w-full overflow-x-hidden">
                    {isOffline && (
                        <div className="mx-3 sm:mx-5 md:mx-6 mt-3 sm:mt-5 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-pulse">
                            <span className="text-base leading-none">⚡</span>
                            <span>You're offline — showing cached content</span>
                        </div>
                    )}
                    <ReminderBanner />
                    <div className="p-3 sm:p-5 md:p-6 w-full max-w-full min-w-0 box-border overflow-hidden">
                        {(() => {
                            const noGlobalBack = [
                                '/dashboard',
                                '/dashboard/student',
                                '/dashboard/admin',
                            ]
                            const hasOwnBack = [
                                '/dashboard/settings',
                                '/dashboard/cbt',
                                '/dashboard/notes',
                                '/dashboard/notes-history',
                                '/dashboard/question-history',
                                '/dashboard/timetable',
                                '/dashboard/reminders',
                                '/dashboard/chat',
                                '/dashboard/analytics',
                                '/dashboard/student/study-groups',
                                '/dashboard/student/pomodoro',
                                '/dashboard/student/notes',
                                '/dashboard/student/library',
                                '/dashboard/student/group-cbt',
                                '/dashboard/student/community',
                                '/dashboard/student/cbt/syllabus',
                                '/dashboard/cbt/study',
                                '/dashboard/tutor',
                                '/dashboard/admin/logins',
                                '/dashboard/admin/logins-today',
                                '/dashboard/admin/email-test',
                                '/dashboard/settings/test-email',
                            ]
                            const shouldShow = !noGlobalBack.includes(pathname) &&
                                !hasOwnBack.some(p => pathname === p || pathname.startsWith(p + '/'))
                            return shouldShow ? (
                                <div className="mb-4">
                                    <BackButton />
                                </div>
                            ) : null
                        })()}
                        <ProtectedRoute>
                            {children}
                        </ProtectedRoute>
                        <WebPushPrompt />
                        <WhatsAppCollectModal />
                    </div>
                </main>
            </div>
        </div>
    )
}
