'use client'

import { useState, useEffect } from 'react'
import { reminderService, Reminder } from '@/lib/services/reminderService'
import {
    FiPlus, FiEdit2, FiTrash2, FiClock, FiCalendar, FiX,
    FiCheck, FiAlertTriangle, FiCheckCircle, FiBell,
    FiMapPin, FiBook, FiRepeat, FiFilter, FiSearch,
    FiMail, FiMessageSquare, FiSettings, FiInfo,
    FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import { toast } from 'react-hot-toast'

type TabMode = 'calendar' | 'list' | 'settings'
type FilterType = 'all' | 'study' | 'exam' | 'deadline' | 'assignment' | 'class'

export default function TimetableReminders() {
    const [reminders, setReminders] = useState<Reminder[]>([])
    const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([])
    const [activeTab, setActiveTab] = useState<TabMode>('calendar')
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [viewDate, setViewDate] = useState(new Date()) // Month/Year currently being viewed
    const [testingSend, setTestingSend] = useState(false)
    const [sendSuccess, setSendSuccess] = useState(false)
    const [sendError, setSendError] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'study' as Reminder['type'],
        subject: '',
        location: '',
        emailEnabled: true,
        notifyBefore: 15,
        recurring: 'none' as Reminder['recurring'],
        recurringDays: [] as number[]
    })

    useEffect(() => {
        if (user?.uid) {
            loadReminders()
            reminderService.requestNotificationPermission()
            reminderService.init()
        }
    }, [user?.uid])

    useEffect(() => {
        filterReminders()
    }, [reminders, filterType, searchQuery, selectedDate])

    const loadReminders = async () => {
        if (!user?.uid) return
        try {
            setLoading(true)
            const all = await reminderService.getAll(user.uid)
            setReminders(all)
        } finally {
            setLoading(false)
        }
    }




    const filterReminders = () => {
        let filtered = [...reminders]

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(r => r.type === filterType)
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(r =>
                r.title.toLowerCase().includes(query) ||
                r.description?.toLowerCase().includes(query) ||
                r.subject?.toLowerCase().includes(query)
            )
        }

        // Date filter for calendar view
        if (activeTab === 'calendar') {
            filtered = filtered.filter(r => r.date === selectedDate)
        }

        // Sort by date and time
        filtered.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date)
            if (dateCompare !== 0) return dateCompare
            return a.time.localeCompare(b.time)
        })

        setFilteredReminders(filtered)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.uid) return

        const reminderData = {
            ...formData
        }

        try {
            if (editingId) {
                await reminderService.update(user.uid, editingId, reminderData)
            } else {
                await reminderService.add(user.uid, reminderData)
            }

            loadReminders()
            resetForm()
        } catch (error) {
            console.error('Failed to save reminder:', error)
            toast.error('Error saving reminder')
        }
    }

    const handleDelete = async (id: string) => {
        if (!user?.uid) return
        if (confirm('Delete this reminder?')) {
            await reminderService.delete(user.uid, id)
            loadReminders()
        }
    }

    const handleEdit = (reminder: Reminder) => {
        setFormData({
            title: reminder.title,
            description: reminder.description || '',
            date: reminder.date,
            time: reminder.time,
            type: reminder.type,
            subject: reminder.subject || '',
            location: reminder.location || '',
            emailEnabled: reminder.emailEnabled ?? true,
            notifyBefore: reminder.notifyBefore || 15,
            recurring: reminder.recurring || 'none',
            recurringDays: reminder.recurringDays || []
        })
        setEditingId(reminder.id)
        setShowAddForm(true)
    }

    const handleMarkComplete = async (id: string) => {
        if (!user?.uid) return
        await reminderService.markCompleted(user.uid, id)
        loadReminders()
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            date: selectedDate,
            time: '09:00',
            type: 'study',
            subject: '',
            location: '',
            emailEnabled: true,
            notifyBefore: 15,
            recurring: 'none',
            recurringDays: []
        })
        setEditingId(null)
        setShowAddForm(false)
    }


    const typeOptions = [
        { value: 'study', label: 'Study Session', color: 'blue', icon: '📚' },
        { value: 'exam', label: 'Exam', color: 'red', icon: '📝' },
        { value: 'deadline', label: 'Deadline', color: 'orange', icon: '⏰' },
        { value: 'assignment', label: 'Assignment', color: 'purple', icon: '📄' },
        { value: 'class', label: 'Class', color: 'green', icon: '🏫' }
    ]

    const getTypeColor = (type: string) => {
        const colorMap: Record<string, string> = {
            study: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
            exam: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
            deadline: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
            assignment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
            class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
            other: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
        }
        return colorMap[type] || colorMap.study
    }

    const todayReminders = reminders.filter(r => r.date === new Date().toISOString().split('T')[0] && !r.completed)
    const [upcomingRemindersCount, setUpcomingRemindersCount] = useState(0)

    useEffect(() => {
        if (user?.uid) {
            reminderService.getUpcoming(user.uid, 7).then(upcoming => {
                setUpcomingRemindersCount(upcoming.length)
            })
        }
    }, [reminders, user?.uid])

    return (
        <div className="space-y-6">

            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {/* Tab Switcher */}
                    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        {(['calendar', 'list', 'settings'] as TabMode[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${activeTab === tab
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {tab === 'calendar' ? <FiCalendar className="inline mr-1" />
                                    : tab === 'list' ? <FiFilter className="inline mr-1" />
                                        : <FiSettings className="inline mr-1" />}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab !== 'settings' && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                       text-white rounded-xl transition shadow-md font-medium"
                    >
                        <FiPlus /> Add Reminder
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            {activeTab !== 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 
                          rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Today</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{todayReminders.length}</p>
                            </div>
                            <FiCalendar className="text-3xl text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 
                          rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Next 7 Days</p>
                                <p className="text-2xl font-bold text-orange-900 dark:text-blue-100">{upcomingRemindersCount}</p>
                            </div>
                            <FiBell className="text-3xl text-orange-500" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 
                          rounded-xl p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 dark:text-green-300 mb-1">Total Active</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {reminders.filter(r => !r.completed).length}
                                </p>
                            </div>
                            <FiCheckCircle className="text-3xl text-green-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="space-y-6">

                    {/* Notification Preferences */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <FiBell className="text-blue-600 dark:text-blue-400 text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Notification Preferences</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage how you want to be reminded
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FiBell className="text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Browser Notifications
                                    </span>
                                </div>
                                <button
                                    onClick={() => reminderService.requestNotificationPermission()}
                                    className="text-sm font-semibold text-blue-500 hover:text-blue-600 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md"
                                >
                                    Enable
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FiMail className="text-indigo-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email Notifications
                                    </span>
                                </div>
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    Active (Sent to {user?.email})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Calendar View */}
            {
                activeTab === 'calendar' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Monthly Calendar Grid */}
                        <div className="lg:col-span-8 flex flex-col gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <CalendarGrid
                                    viewDate={viewDate}
                                    setViewDate={setViewDate}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    reminders={reminders}
                                />
                            </div>
                        </div>

                        {/* Reminders for Selected Date */}
                        <div className="lg:col-span-4">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm sticky top-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        {new Date(selectedDate).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric'
                                        })} Reminders
                                    </h3>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-500">
                                        {filteredReminders.length} tasks
                                    </span>
                                </div>

                                {filteredReminders.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                                        <FiCalendar className="mx-auto text-4xl mb-3 text-gray-300" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Rest day! No tasks</p>
                                        <button
                                            onClick={() => {
                                                setFormData({ ...formData, date: selectedDate })
                                                setShowAddForm(true)
                                            }}
                                            className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-semibold inline-flex items-center gap-1"
                                        >
                                            <FiPlus /> Add Task
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                        {filteredReminders.map(reminder => (
                                            <ReminderCardSmall
                                                key={reminder.id}
                                                reminder={reminder}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onComplete={handleMarkComplete}
                                                getTypeColor={getTypeColor}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* List View */}
            {
                activeTab === 'list' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-wrap gap-3">
                                <div className="flex-1 min-w-64 relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search reminders..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                             rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    />
                                </div>
                                <select
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value as FilterType)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                >
                                    <option value="all">All Types</option>
                                    {typeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Reminders List */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {filteredReminders.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <FiFilter className="mx-auto text-4xl mb-3 opacity-50" />
                                    <p>No reminders found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredReminders.map(reminder => (
                                        <ReminderCard
                                            key={reminder.id}
                                            reminder={reminder}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onComplete={handleMarkComplete}
                                            getTypeColor={getTypeColor}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Add/Edit Form Modal */}
            {
                showAddForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {editingId ? 'Edit Reminder' : 'Add New Reminder'}
                                </h2>
                                <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                    <FiX className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Math Exam, Chemistry Assignment"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                             rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Additional details..."
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                             rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    />
                                </div>

                                {/* Date and Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                               rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Time *
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                               rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Type and Notify Before */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Type *
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                               rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                        >
                                            {typeOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.icon} {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Notify Before
                                        </label>
                                        <select
                                            value={formData.notifyBefore}
                                            onChange={e => setFormData({ ...formData, notifyBefore: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                               rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                        >
                                            <option value={5}>5 minutes</option>
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={1440}>1 day</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Subject and Location */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Subject (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="e.g., Mathematics"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                               rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Location (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g., Room 101"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                               rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                                        Notification Channels
                                    </h4>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.emailEnabled}
                                            onChange={e => setFormData({ ...formData, emailEnabled: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.emailEnabled}
                                            onChange={e => setFormData({ ...formData, emailEnabled: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <FiMail className="text-blue-500 text-lg" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Email Notification
                                        </span>
                                    </label>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white 
                             rounded-xl transition font-bold"
                                    >
                                        {editingId ? 'Update Reminder' : 'Add Reminder'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white 
                             rounded-xl transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

// Calendar Grid Component
function CalendarGrid({
    viewDate,
    setViewDate,
    selectedDate,
    setSelectedDate,
    reminders
}: {
    viewDate: Date
    setViewDate: (d: Date) => void
    selectedDate: string
    setSelectedDate: (s: string) => void
    reminders: Reminder[]
}) {
    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

    const month = viewDate.getMonth()
    const year = viewDate.getFullYear()

    const totalDays = daysInMonth(month, year)
    const startDay = firstDayOfMonth(month, year)

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const calendarDays = []
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null)
    }
    for (let i = 1; i <= totalDays; i++) {
        calendarDays.push(i)
    }

    const isToday = (day: number) => {
        const today = new Date()
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
    }

    const isSelected = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return selectedDate === dateStr
    }

    return (
        <div className="select-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate)}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                        <FiChevronLeft />
                    </button>
                    <button
                        onClick={() => setViewDate(new Date())}
                        className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    >
                        Today
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                        <FiChevronRight />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
                {weekdays.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
                {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} />

                    const reminderCount = reminders.filter(r => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        return r.date === dateStr && !r.completed
                    }).length

                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                            className={`relative h-14 md:h-20 p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1
                                ${isSelected(day)
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <span className={`text-sm md:text-base font-semibold ${isToday(day)
                                ? 'w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-full'
                                : isSelected(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                {day}
                            </span>
                            {reminderCount > 0 && (
                                <div className="flex gap-0.5">
                                    {Array.from({ length: Math.min(reminderCount, 3) }).map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    ))}
                                    {reminderCount > 3 && <span className="text-[10px] text-blue-500 font-bold">+</span>}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// Smaller Reminder Card for Calendar View
function ReminderCardSmall({
    reminder,
    onEdit,
    onDelete,
    onComplete,
    getTypeColor
}: {
    reminder: Reminder
    onEdit: (r: Reminder) => void
    onDelete: (id: string) => void
    onComplete: (id: string) => void
    getTypeColor: (type: Reminder['type']) => string
}) {
    return (
        <div className={`p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition shadow-sm ${reminder.completed ? 'opacity-60 grayscale' : 'bg-gray-50/50 dark:bg-gray-700/30'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${reminder.type === 'exam' ? 'bg-red-500' : reminder.type === 'study' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                        <h4 className={`font-bold text-gray-900 dark:text-white truncate ${reminder.completed ? 'line-through' : ''}`}>
                            {reminder.title}
                        </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><FiClock /> {reminder.time}</span>
                        {reminder.subject && <span className="truncate flex items-center gap-1"><FiBook /> {reminder.subject}</span>}
                    </div>
                </div>
                <div className="flex gap-1">
                    {!reminder.completed && (
                        <button onClick={() => onComplete(reminder.id)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
                            <FiCheckCircle />
                        </button>
                    )}
                    <button onClick={() => onEdit(reminder)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <FiEdit2 />
                    </button>
                </div>
            </div>
        </div>
    )
}

// Reminder Card Component
function ReminderCard({
    reminder,
    onEdit,
    onDelete,
    onComplete,
    getTypeColor
}: {
    reminder: Reminder
    onEdit: (r: Reminder) => void
    onDelete: (id: string) => void
    onComplete: (id: string) => void
    getTypeColor: (type: Reminder['type']) => string
}) {
    const isPast = new Date(`${reminder.date}T${reminder.time}`) < new Date()
    const isToday = reminder.date === new Date().toISOString().split('T')[0]

    return (
        <div className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${reminder.completed ? 'opacity-60' : ''
            }`}>
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h4 className={`font-semibold text-gray-900 dark:text-white ${reminder.completed ? 'line-through' : ''
                                }`}>
                                {reminder.title}
                            </h4>
                            {reminder.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {reminder.description}
                                </p>
                            )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(reminder.type)}`}>
                            {reminder.type}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                            <FiCalendar className="text-xs" />
                            {isToday ? 'Today' : new Date(reminder.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <FiClock className="text-xs" />
                            {reminder.time}
                        </span>
                        {reminder.subject && (
                            <span className="flex items-center gap-1">
                                <FiBook className="text-xs" />
                                {reminder.subject}
                            </span>
                        )}
                        {reminder.location && (
                            <span className="flex items-center gap-1">
                                <FiMapPin className="text-xs" />
                                {reminder.location}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {reminder.emailEnabled && (
                            <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 
                               bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                <FiMail /> Email
                            </span>
                        )}
                        {reminder.recurring !== 'none' && (
                            <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 
                               bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                                <FiRepeat /> {reminder.recurring}
                            </span>
                        )}
                        {isPast && !reminder.completed && (
                            <span className="text-xs text-red-600 dark:text-red-400 
                               bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                                <FiAlertTriangle className="inline mr-1" /> Overdue
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-1">
                    {!reminder.completed && (
                        <button
                            onClick={() => onComplete(reminder.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 
                         rounded-lg transition"
                            title="Mark as complete"
                        >
                            <FiCheckCircle />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(reminder)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 
                       rounded-lg transition"
                    >
                        <FiEdit2 />
                    </button>
                    <button
                        onClick={() => onDelete(reminder.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                       rounded-lg transition"
                    >
                        <FiTrash2 />
                    </button>
                </div>
            </div>
        </div>
    )
}
