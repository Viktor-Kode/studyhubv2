'use client'

import { useState, useEffect } from 'react'
import {
  FaBell, FaPlus, FaTrash, FaCalendar, FaEdit,
  FaWhatsapp, FaCheckCircle, FaTimes, FaSearch,
  FaFilter, FaClock
} from 'react-icons/fa'
import { format, isPast, parseISO, compareAsc } from 'date-fns'
import { useAuthStore } from '@/lib/store/authStore'

interface Reminder {
  id: string
  title: string
  date: string
  time: string
  type: 'deadline' | 'study' | 'exam' | 'other'
  completed: boolean
  whatsappNumber?: string
  sendWhatsApp?: boolean
  description?: string
  priority: 'low' | 'medium' | 'high'
}

export default function StudyReminders() {
  const { user } = useAuthStore()
  const userId = user?.id || 'guest'
  // State
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filter & Search State
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')

  // WhatsApp Config State
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isWhatsAppConfirmed, setIsWhatsAppConfirmed] = useState(false)
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false)

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Reminder>>({
    title: '',
    date: '',
    time: '',
    type: 'study',
    priority: 'medium',
    description: '',
    sendWhatsApp: false
  })

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const match = typeof document !== 'undefined'
          ? document.cookie.match(/(^| )auth-token=([^;]+)/)
          : null
        const token = match ? decodeURIComponent(match[2]) : ''
        const headers = { 'Authorization': `Bearer ${token}` }

        const response = await fetch('/api/reminders', { headers })
        const { reminders: dbReminders } = await response.json()

        if (dbReminders?.length > 0) {
          setReminders(dbReminders)
        } else {
          // Default demo data if empty - optional, or just start empty
          setReminders([])
        }

        // WhatsApp number could be in User profile - for now, we'll just use a local state synced to a setting
        // or a specific settings API.
      } catch (error) {
        console.error('Failed to load reminders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // CRUD Operations
  const handleSaveReminder = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const match = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null
      const token = match ? decodeURIComponent(match[2]) : ''
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const method = editingId ? 'PUT' : 'POST'
      const body = { ...formData, _id: editingId }

      const response = await fetch('/api/reminders', {
        method,
        headers,
        body: JSON.stringify(body)
      })
      const { reminder } = await response.json()

      if (editingId) {
        setReminders(prev => prev.map(r => r._id === editingId ? reminder : r))
      } else {
        setReminders(prev => [...prev, reminder])
      }

      resetForm()
    } catch (error) {
      console.error('Failed to save reminder:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      try {
        const match = typeof document !== 'undefined'
          ? document.cookie.match(/(^| )auth-token=([^;]+)/)
          : null
        const token = match ? decodeURIComponent(match[2]) : ''

        await fetch(`/api/reminders?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        setReminders(prev => prev.filter(r => r._id !== id))
      } catch (error) {
        console.error('Failed to delete reminder:', error)
      }
    }
  }

  const toggleComplete = async (reminder: any) => {
    try {
      const match = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null
      const token = match ? decodeURIComponent(match[2]) : ''
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...reminder, completed: !reminder.completed })
      })
      const { reminder: updated } = await response.json()
      setReminders(prev => prev.map(r => r._id === updated._id ? updated : r))
    } catch (error) {
      console.error('Failed to toggle completion:', error)
    }
  }

  const startEdit = (reminder: any) => {
    setFormData(reminder)
    setEditingId(reminder._id)
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '', date: '', time: '', type: 'study',
      priority: 'medium', description: '', sendWhatsApp: false
    })
    setEditingId(null)
    setShowAddModal(false)
  }

  // Helper Functions
  const getFilteredReminders = () => {
    let filtered = reminders

    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      )
    }

    return filtered.sort((a, b) => {
      // Always put completed at bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1

      if (sortBy === 'date') {
        const dateA = parseISO(`${a.date}T${a.time}`)
        const dateB = parseISO(`${b.date}T${b.time}`)
        return compareAsc(dateA, dateB)
      } else {
        const priorityMap = { high: 0, medium: 1, low: 2 }
        return priorityMap[a.priority] - priorityMap[b.priority]
      }
    })
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
      case 'deadline': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
      case 'study': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="text-xs font-bold text-red-500 uppercase tracking-wider">High Priority</span>
      case 'medium': return <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Medium Priority</span>
      case 'low': return <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Low Priority</span>
    }
  }

  // --- Render ---

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>
  )

  const displayedReminders = getFilteredReminders()

  return (
    <div className="space-y-6">

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
          >
            <FaPlus /> New Reminder
          </button>

          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="study">Study Sessions</option>
            <option value="exam">Exams</option>
            <option value="deadline">Deadlines</option>
            <option value="other">Other</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{reminders.filter(r => !r.completed && r.type === 'study').length}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Study Sessions</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">{reminders.filter(r => !r.completed && r.type === 'exam').length}</div>
          <div className="text-sm text-red-600 dark:text-red-400">Upcoming Exams</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{reminders.filter(r => !r.completed && r.type === 'deadline').length}</div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Deadlines</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{reminders.filter(r => r.completed).length}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
        </div>
      </div>

      {/* Reminder List */}
      <div className="space-y-4">
        {displayedReminders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
            <FaCalendar className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reminders found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or add a new reminder.</p>
          </div>
        ) : (
          displayedReminders.map(reminder => (
            <div
              key={reminder._id}
              className={`group relative bg-white dark:bg-gray-800 p-5 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${reminder.completed
                ? 'opacity-60 border-gray-200 dark:border-gray-700'
                : 'border-l-4 ' + (reminder.type === 'exam' ? 'border-l-red-500 border-gray-200 dark:border-gray-700' : reminder.type === 'deadline' ? 'border-l-orange-500 border-gray-200 dark:border-gray-700' : 'border-l-blue-500 border-gray-200 dark:border-gray-700')
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded textxs font-medium text-xs uppercase tracking-wide ${getTypeStyle(reminder.type)}`}>
                      {reminder.type}
                    </span>
                    {getPriorityBadge(reminder.priority)}
                    {reminder.completed && (
                      <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                        <FaCheckCircle /> Completed
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg font-bold text-gray-900 dark:text-white mb-1 ${reminder.completed ? 'line-through decoration-2 decoration-gray-400' : ''}`}>
                    {reminder.title}
                  </h3>

                  {reminder.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {reminder.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <div className="flex items-center gap-1.5">
                      <FaCalendar className="text-gray-400" />
                      {format(parseISO(reminder.date), 'EEEE, d MMMM yyyy')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaClock className="text-gray-400" />
                      {reminder.time}
                    </div>
                    {reminder.sendWhatsApp && isWhatsAppConfirmed && (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 px-2 py-0.5 rounded-full text-xs font-medium">
                        <FaWhatsapp />
                        Next reminder on WhatsApp
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleComplete(reminder)}
                    className={`p-2 rounded-lg transition-colors ${reminder.completed
                      ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    title={reminder.completed ? "Mark as Incomplete" : "Mark as Complete"}
                  >
                    {reminder.completed ? <FaTimes /> : <FaCheckCircle />}
                  </button>
                  <button
                    onClick={() => startEdit(reminder)}
                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(reminder._id)}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Add/Edit Modal --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Reminder' : 'New Reminder'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Physics Midterm Exam"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="study">Study Session</option>
                    <option value="exam">Exam</option>
                    <option value="deadline">Deadline</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  placeholder="Additional details..."
                />
              </div>

              {/* WhatsApp Toggle */}
              {isWhatsAppConfirmed && whatsappNumber && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <input
                    type="checkbox"
                    id="send-whatsapp-modal"
                    checked={formData.sendWhatsApp}
                    onChange={e => setFormData({ ...formData, sendWhatsApp: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="send-whatsapp-modal" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    <FaWhatsapp className="text-green-500" />
                    <span>Send WhatsApp notification to {whatsappNumber}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReminder}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                {editingId ? 'Update Reminder' : 'Create Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
