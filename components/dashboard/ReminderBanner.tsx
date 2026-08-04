'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiBell, FiX, FiChevronLeft, FiChevronRight, FiCalendar, FiClock } from 'react-icons/fi'
import { reminderService, Reminder } from '@/lib/services/reminderService'
import { useAuthStore } from '@/lib/store/authStore'
import { format, parseISO, isToday, isTomorrow, differenceInMinutes } from 'date-fns'

import { usePathname } from 'next/navigation'

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    exam:       { bg: 'from-red-500/10 to-rose-500/10',     text: 'text-red-700 dark:text-red-300',     border: 'border-red-400/40',    dot: 'bg-red-500' },
    deadline:   { bg: 'from-orange-500/10 to-amber-500/10', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-400/40', dot: 'bg-orange-500' },
    assignment: { bg: 'from-yellow-500/10 to-amber-500/10', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-400/40', dot: 'bg-yellow-400' },
    study:      { bg: 'from-emerald-500/10 to-teal-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-400/40', dot: 'bg-emerald-500' },
    class:      { bg: 'from-blue-500/10 to-indigo-500/10',  text: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-400/40',   dot: 'bg-blue-500' },
    other:      { bg: 'from-purple-500/10 to-violet-500/10', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-400/40', dot: 'bg-purple-500' },
}

const PRIORITY_LABEL: Record<string, string> = {
    high: '🔴 High',
    medium: '🟡 Medium',
    low: '🟢 Low',
}

function getWhenLabel(date: string, time: string): string {
    const dt = new Date(`${date}T${time}`)
    const now = new Date()
    const mins = differenceInMinutes(dt, now)

    if (mins < 0) return 'Past due'
    if (mins < 60) return `in ${mins} min`
    if (isToday(dt)) return `Today at ${format(dt, 'h:mm a')}`
    if (isTomorrow(dt)) return `Tomorrow at ${format(dt, 'h:mm a')}`
    return format(dt, 'EEE, MMM d · h:mm a')
}

const DISMISS_KEY = 'reminder_banner_dismissed_at'

export default function ReminderBanner() {
    const pathname = usePathname()
    const { user } = useAuthStore()
    const [reminders, setReminders] = useState<Reminder[]>([])
    const [index, setIndex] = useState(0)
    const [dismissed, setDismissed] = useState(false)
    const [loaded, setLoaded] = useState(false)

    // Only show on main dashboard pages
    const isDashboardHome = pathname === '/dashboard' || pathname === '/dashboard/student'

    useEffect(() => {
        // Check if the user already dismissed the banner in this session
        const dismissedAt = sessionStorage.getItem(DISMISS_KEY)
        if (dismissedAt) {
            setDismissed(true)
            setLoaded(true)
            return
        }

        if (!user?.uid) return

        reminderService.getUpcoming(user.uid, 7).then(upcoming => {
            const now = new Date()
            // Filter out past-due/expired reminders so they disappear when due
            const activeUpcoming = upcoming.filter(r => {
                const dt = new Date(`${r.date}T${r.time}`)
                return dt > now
            })
            setReminders(activeUpcoming)
            setLoaded(true)
        }).catch(() => setLoaded(true))
    }, [user?.uid])

    const dismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, Date.now().toString())
        setDismissed(true)
    }

    if (!isDashboardHome || !loaded || dismissed || reminders.length === 0) return null

    const reminder = reminders[index]
    const colors = TYPE_COLORS[reminder.type] ?? TYPE_COLORS.other

    return (
        <div
            className={`mx-3 sm:mx-5 md:mx-6 mt-3 sm:mt-4 rounded-2xl border bg-gradient-to-r ${colors.bg} ${colors.border} shadow-sm`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3 px-4 py-3">
                {/* Bell icon with pulsing dot */}
                <div className="relative flex-shrink-0 mt-0.5">
                    <FiBell className={`text-xl ${colors.text}`} />
                    <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className={`text-xs font-bold uppercase tracking-widest ${colors.text} opacity-70`}>
                            {reminder.type}
                        </span>
                        {reminder.priority && (
                            <span className="text-xs opacity-60 font-medium">
                                {PRIORITY_LABEL[reminder.priority]}
                            </span>
                        )}
                        {reminders.length > 1 && (
                            <span className={`text-xs font-semibold ml-auto ${colors.text} opacity-50`}>
                                {index + 1} / {reminders.length}
                            </span>
                        )}
                    </div>

                    <p className={`font-bold text-sm sm:text-base truncate mt-0.5 ${colors.text}`}>
                        {reminder.title}
                    </p>

                    <div className={`flex flex-wrap items-center gap-3 mt-1 text-xs font-medium ${colors.text} opacity-80`}>
                        <span className="flex items-center gap-1">
                            <FiClock size={11} />
                            {getWhenLabel(reminder.date, reminder.time)}
                        </span>
                        {reminder.subject && (
                            <span className="flex items-center gap-1">
                                <FiCalendar size={11} />
                                {reminder.subject}
                            </span>
                        )}
                    </div>

                    {reminder.description && (
                        <p className={`text-xs mt-1 line-clamp-1 ${colors.text} opacity-60`}>
                            {reminder.description}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Cycle reminders */}
                    {reminders.length > 1 && (
                        <>
                            <button
                                onClick={() => setIndex(i => (i - 1 + reminders.length) % reminders.length)}
                                aria-label="Previous reminder"
                                className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${colors.text}`}
                            >
                                <FiChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setIndex(i => (i + 1) % reminders.length)}
                                aria-label="Next reminder"
                                className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${colors.text}`}
                            >
                                <FiChevronRight size={16} />
                            </button>
                        </>
                    )}

                    {/* View all */}
                    <Link
                        href="/dashboard/reminders"
                        className={`hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${colors.border} ${colors.text} hover:bg-black/5 dark:hover:bg-white/10 transition`}
                    >
                        View all
                    </Link>

                    {/* Dismiss */}
                    <button
                        onClick={dismiss}
                        aria-label="Dismiss reminder banner"
                        className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${colors.text} opacity-60 hover:opacity-100`}
                    >
                        <FiX size={16} />
                    </button>
                </div>
            </div>

            {/* Mobile "View all" link */}
            <div className="sm:hidden px-4 pb-3 -mt-1">
                <Link
                    href="/dashboard/reminders"
                    className={`text-xs font-bold ${colors.text} underline underline-offset-2 opacity-70 hover:opacity-100`}
                >
                    View all reminders →
                </Link>
            </div>
        </div>
    )
}
