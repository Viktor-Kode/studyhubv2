'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { firebaseSignOut } from '@/lib/firebase-auth'
import { useThemeStore } from '@/lib/store/themeStore'
import { useTimerStore } from '@/lib/store/timerStore'
import { usePWA } from '@/hooks/usePWA'
import { useSaveLastPage } from '@/hooks/useSaveLastPage'
import { useReminderScheduler } from '@/hooks/useReminderScheduler'
import BackButton from '@/components/BackButton'
import WebPushPrompt from '@/components/WebPushPrompt'
import WhatsAppCollectModal from '@/components/WhatsAppCollectModal'
import { getProgressQueue, removeProgressItem } from '@/lib/utils/offlineDb'
import { cbtApi } from '@/lib/api/cbt'
import { reviewCard } from '@/lib/api/flashcardApi'
import { studyPlanApi } from '@/lib/api/studyPlanApi'
import { toast } from 'react-hot-toast'
import ReminderBanner from '@/components/dashboard/ReminderBanner'
import StudySidebar from '@/components/dashboard/StudySidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { user } = useAuthStore()

    const handleLogout = async () => {
        await firebaseSignOut()
        router.push('/auth/login')
    }
    useSaveLastPage()
    const { theme } = useThemeStore()
    usePWA()

    // Schedule reminder notifications globally across the dashboard
    useReminderScheduler(user?.uid)

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

    const isDark = theme === 'dark'
    const isTutorPage = pathname === '/dashboard/tutor'
    const isChatPage = pathname === '/dashboard/chat'
    const isAdminPage = pathname.startsWith('/dashboard/admin')
    const isMapPage = pathname.includes('/map')
    const isLessonPage = pathname.includes('/lesson')
    const isStudentDashboard = pathname === '/dashboard/student'

    if (isTutorPage || isChatPage || isAdminPage || isMapPage || isLessonPage) {
        return (
            <div className="min-h-[100dvh]" style={{ background: 'var(--bg)' }}>
                <ProtectedRoute>
                    {children}
                </ProtectedRoute>
                <WebPushPrompt />
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
            <div className="sp-app-shell">
                <StudySidebar />

                <main className="sp-app-main pt-0 min-w-0 w-full max-w-full overflow-x-hidden">
                    {isOffline && (
                        <div className="mx-3 sm:mx-5 md:mx-6 mt-3 sm:mt-5 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-pulse">
                            <span className="text-base leading-none">⚡</span>
                            <span>You're offline — showing cached content</span>
                        </div>
                    )}
                    <ReminderBanner />
                    <div className={`${isStudentDashboard ? 'p-0' : 'p-3 sm:p-5 md:p-6'} w-full max-w-full min-w-0 box-border overflow-hidden`}>
                        {(() => {
                            const noGlobalBack = [
                                '/dashboard',
                                '/dashboard/student',
                                '/dashboard/admin',
                            ]
                            const hasOwnBack = [
                                '/dashboard/settings',
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
