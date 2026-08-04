'use client'

import { useState, useEffect } from 'react'
import {
  FiPlus, FiTrash2, FiClock, FiCalendar, FiX,
  FiCheckCircle, FiEdit2, FiSearch, FiBell, FiMail, FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { format, parseISO, compareAsc, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import { reminderService, Reminder } from '@/lib/services/reminderService'
import { useReminderScheduler } from '@/hooks/useReminderScheduler'

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  study:      { label: 'Study Session', emoji: '📚', color: 'blue' },
  exam:       { label: 'Exam',          emoji: '📝', color: 'red' },
  deadline:   { label: 'Deadline',      emoji: '⏳', color: 'orange' },
  assignment: { label: 'Assignment',    emoji: '📋', color: 'yellow' },
  class:      { label: 'Class',         emoji: '🏫', color: 'purple' },
  other:      { label: 'Other',         emoji: '📌', color: 'gray' },
} as const

const NOTIFY_OPTIONS = [
  { value: 5,  label: '5 min before' },
  { value: 10, label: '10 min before' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
]

const PRIORITY_MAP: Record<string, number> = { high: 0, medium: 1, low: 2 }

type ReminderType = keyof typeof TYPE_CONFIG

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTypeStyle(type: string) {
  const c = TYPE_CONFIG[type as ReminderType]?.color ?? 'gray'
  const map: Record<string, string> = {
    blue:   'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    red:    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
    orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
    gray:   'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300',
  }
  return map[c] ?? map.gray
}

function getLeftBorderColor(type: string) {
  const map: Record<string, string> = {
    exam: 'border-l-red-500', deadline: 'border-l-orange-500',
    study: 'border-l-blue-500', assignment: 'border-l-yellow-500',
    class: 'border-l-purple-500', other: 'border-l-gray-400',
  }
  return map[type] ?? 'border-l-gray-400'
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function StudyReminders() {
  const { user } = useAuthStore()
  const userId = user?.uid || 'guest'

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')
  const [userEmail, setUserEmail] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())

  const defaultForm = {
    title: '', date: '', time: '',
    type: 'study' as ReminderType,
    notifyBefore: 15,
    description: '',
    emailEnabled: false,
  }
  const [form, setForm] = useState(defaultForm)

  // ── Scheduler ──────────────────────────────────────────────────────────────
  const { scheduleReminder, rescheduleAll } = useReminderScheduler(userId)

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const all = await reminderService.getAll(userId)
        setReminders(all)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    const loadProfile = async () => {
      try {
        const res = await apiClient.get('/settings')
        if (res.data.profile?.email) setUserEmail(res.data.profile.email)
      } catch { /* ignore */ }
    }
    loadData()
    loadProfile()
  }, [userId])

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim() || !form.date || !form.time) {
      toast.error('Please fill in title, date and time')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
      } as Omit<Reminder, 'id' | 'completed'>

      if (editingId) {
        await reminderService.update(userId, editingId, body)
        toast.success('Reminder updated')
      } else {
        const newId = await reminderService.add(userId, body)
        // Schedule local notifications for the new reminder
        const newReminder: Reminder = { ...body, id: newId, _id: newId, completed: false }
        scheduleReminder(newReminder)

        // Confirmation notification (immediate)
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'default') await Notification.requestPermission()
          if (Notification.permission === 'granted') {
            try {
              const reg = await navigator.serviceWorker.ready
              await reg.showNotification(`🔔 Reminder Set: ${form.title}`, {
                body: `Scheduled for ${form.date} at ${form.time}. You'll be notified ${form.notifyBefore} min before and at the time.`,
                icon: '/android-chrome-192x192.png',
              })
            } catch { /* ignore */ }
          }
        }

        toast.success('Reminder set! Notifications scheduled 🔔')
      }

      const updated = await reminderService.getAll(userId)
      setReminders(updated)
      resetForm()
    } catch {
      toast.error('Failed to save reminder')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reminder?')) return
    try {
      await reminderService.delete(userId, id)
      setReminders(prev => prev.filter(r => r._id !== id && r.id !== id))
    } catch { toast.error('Failed to delete') }
  }

  const toggleComplete = async (reminder: Reminder) => {
    const id = (reminder._id || reminder.id) as string
    try {
      await reminderService.update(userId, id, { completed: !reminder.completed })
      const updated = await reminderService.getAll(userId)
      setReminders(updated)
    } catch { /* ignore */ }
  }

  const startEdit = (reminder: Reminder) => {
    setForm({
      title: reminder.title,
      date: reminder.date,
      time: reminder.time,
      type: reminder.type as ReminderType,
      notifyBefore: reminder.notifyBefore ?? 15,
      description: reminder.description ?? '',
      sendWhatsApp: reminder.sendWhatsApp ?? false,
    })
    setEditingId((reminder._id || reminder.id) as string)
    setShowModal(true)
  }

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId(null)
    setShowModal(false)
  }

  // ── Mini Calendar Helpers ──────────────────────────────────────────────────
  const calDays = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) })
  const startPad = startOfMonth(calMonth).getDay() // 0=Sun
  const reminderDates = reminders.filter(r => !r.completed).map(r => r.date)

  // ── Hide bottom nav when modal is open ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (showModal) {
      window.dispatchEvent(new Event('modal-open'))
    } else {
      window.dispatchEvent(new Event('modal-close'))
    }
    return () => {
      window.dispatchEvent(new Event('modal-close'))
    }
  }, [showModal])

  // ── Filter / Sort ──────────────────────────────────────────────────────────
  const displayed = reminders
    .filter(r => filterType === 'all' || r.type === filterType)
    .filter(r => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (sortBy === 'date') return compareAsc(parseISO(`${a.date}T${a.time}`), parseISO(`${b.date}T${b.time}`))
      return PRIORITY_MAP[a.priority ?? 'medium'] - PRIORITY_MAP[b.priority ?? 'medium']
    })

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-full" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl w-full" />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-sm shrink-0"
          >
            <FiPlus /> New Reminder
          </button>
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reminders…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none text-sm"
          >
            <option value="all">All types</option>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none text-sm"
          >
            <option value="date">By date</option>
            <option value="priority">By priority</option>
          </select>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Study', count: reminders.filter(r => !r.completed && r.type === 'study').length,    cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
          { label: 'Exams', count: reminders.filter(r => !r.completed && r.type === 'exam').length,     cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
          { label: 'Deadlines', count: reminders.filter(r => !r.completed && r.type === 'deadline').length, cls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
          { label: 'Done', count: reminders.filter(r => r.completed).length,                           cls: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
        ].map(s => (
          <div key={s.label} className={`${s.cls} rounded-xl p-4`}>
            <div className="text-2xl font-black">{s.count}</div>
            <div className="text-xs font-semibold uppercase tracking-widest mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <FiCalendar className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
            <p className="font-semibold text-gray-500 dark:text-gray-400">No reminders found</p>
          </div>
        ) : displayed.map(r => (
          <div
            key={r._id || r.id}
            className={`group bg-white dark:bg-gray-800 p-4 rounded-2xl border transition-all shadow-sm hover:shadow-md ${
              r.completed ? 'opacity-60 border-gray-200 dark:border-gray-700' : `border-l-4 border-gray-200 dark:border-gray-700 ${getLeftBorderColor(r.type)}`
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide border ${getTypeStyle(r.type)}`}>
                    {TYPE_CONFIG[r.type as ReminderType]?.emoji} {r.type}
                  </span>
                  {r.completed && (
                    <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold flex items-center gap-1">
                      <FiCheckCircle size={10} /> Done
                    </span>
                  )}
                </div>
                <h3 className={`font-bold text-gray-900 dark:text-white truncate ${r.completed ? 'line-through' : ''}`}>
                  {r.title}
                </h3>
                {r.description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 line-clamp-1">{r.description}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1"><FiCalendar size={11} /> {format(parseISO(r.date), 'EEE, d MMM yyyy')}</span>
                  <span className="flex items-center gap-1"><FiClock size={11} /> {r.time}</span>
                  {r.notifyBefore && (
                    <span className="flex items-center gap-1"><FiBell size={11} /> {r.notifyBefore} min before</span>
                  )}
                  {r.emailEnabled && (
                    <span className="flex items-center gap-1 text-blue-500"><FiMail size={11} /> Email</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => toggleComplete(r)} title={r.completed ? 'Mark incomplete' : 'Mark done'} className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 transition">
                  <FiCheckCircle size={15} />
                </button>
                <button onClick={() => startEdit(r)} title="Edit" className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition">
                  <FiEdit2 size={15} />
                </button>
                <button onClick={() => handleDelete((r._id || r.id) as string)} title="Delete" className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition">
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mini Calendar ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"><FiChevronLeft size={16} /></button>
          <span className="font-bold text-gray-800 dark:text-white text-sm">{format(calMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"><FiChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
          {calDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const hasReminder = reminderDates.includes(dateStr)
            const isCurrentMonth = isSameMonth(day, calMonth)
            return (
              <div
                key={dateStr}
                className={`relative flex items-center justify-center w-full aspect-square rounded-lg text-xs font-semibold transition cursor-default
                  ${isToday(day) ? 'bg-blue-600 text-white' : ''}
                  ${!isToday(day) && hasReminder ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
                  ${!isToday(day) && !hasReminder && isCurrentMonth ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                  ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                `}
              >
                {format(day, 'd')}
                {hasReminder && !isToday(day) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          data-modal="true"
          className="modal modal-overlay fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-gray-900 w-full max-w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden box-border">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingId ? 'Edit Reminder' : 'New Reminder'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  You'll be notified before and at the scheduled time
                </p>
              </div>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500">
                <FiX size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto box-border">

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  What's the reminder for? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Physics Midterm, Submit Assignment…"
                  className="w-full max-w-full min-w-0 box-border px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full max-w-full min-w-0 box-border px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base appearance-none"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                  className="w-full max-w-full min-w-0 box-border px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base appearance-none"
                />
              </div>

              {/* Type (pill selector) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm({ ...form, type: k as ReminderType })}
                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition ${
                        form.type === k
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {v.emoji} {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notify before */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <FiBell className="inline mr-1.5 text-blue-500" size={14} />
                  Notify me
                </label>
                <select
                  value={form.notifyBefore}
                  onChange={e => setForm({ ...form, notifyBefore: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {NOTIFY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Note (optional, collapsed by default via placeholder) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Note <span className="text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Any extra details…"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Email toggle */}
              <label className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.emailEnabled}
                  onChange={e => setForm({ ...form, emailEnabled: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <FiMail className="text-blue-500" size={18} />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Send email reminder{userEmail ? ` to ${userEmail}` : ''}
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Set Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
