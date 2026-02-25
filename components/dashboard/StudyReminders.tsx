'use client'

import { useState, useEffect } from 'react'
import {
  FiPlus, FiTrash2, FiClock, FiCalendar, FiX, FiCheck, FiAlertCircle, FiStar, FiFilter,
  FiSearch, FiCheckCircle, FiSettings, FiEdit2, FiInfo, FiBell, FiArrowRight
} from 'react-icons/fi'
import { MdWhatsapp } from 'react-icons/md'
import { toast } from 'react-hot-toast'
import { format, parseISO, compareAsc } from 'date-fns'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import { reminderService, Reminder } from '@/lib/services/reminderService'

export default function StudyReminders() {
  const { user } = useAuthStore()
  const userId = user?.uid || 'guest'

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
        const dbReminders = await reminderService.getAll(userId)
        setReminders(dbReminders)
      } catch (error) {
        console.error('Failed to load reminders:', error)
      } finally {
        setLoading(false)
      }
    }

    const loadUserProfile = async () => {
      try {
        const response = await apiClient.get('/settings')
        if (response.data.profile?.phone) {
          setWhatsappNumber(response.data.profile.phone)
          setIsWhatsAppConfirmed(true)
        }
      } catch (error) {
        console.error('Failed to load user profile for WhatsApp:', error)
      }
    }

    loadData()
    loadUserProfile()
  }, [userId])

  // CRUD Operations
  const handleSaveReminder = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const body = {
        ...formData,
        whatsappNumber: formData.sendWhatsApp ? whatsappNumber : undefined
      } as Omit<Reminder, 'id' | 'completed'>

      if (editingId) {
        await reminderService.update(userId, editingId, body)
      } else {
        await reminderService.add(userId, body)
      }

      // Refresh list
      const updatedList = await reminderService.getAll(userId)
      setReminders(updatedList)
      resetForm()
    } catch (error) {
      console.error('Failed to save reminder:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      try {
        await reminderService.delete(userId, id)
        setReminders(prev => prev.filter(r => r._id !== id && r.id !== id))
      } catch (error) {
        console.error('Failed to delete reminder:', error)
      }
    }
  }

  const toggleComplete = async (reminder: Reminder) => {
    try {
      const id = (reminder._id || reminder.id) as string
      await reminderService.update(userId, id, {
        completed: !reminder.completed
      })
      const updatedList = await reminderService.getAll(userId)
      setReminders(updatedList)
    } catch (error) {
      console.error('Failed to toggle completion:', error)
    }
  }

  const startEdit = (reminder: Reminder) => {
    setFormData(reminder)
    setEditingId((reminder._id || reminder.id) as string)
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
    let filtered = [...reminders]

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
      if (a.completed !== b.completed) return a.completed ? 1 : -1

      if (sortBy === 'date') {
        const dateA = parseISO(`${a.date}T${a.time}`)
        const dateB = parseISO(`${b.date}T${b.time}`)
        return compareAsc(dateA, dateB)
      } else {
        const priorityMap: Record<string, number> = { high: 0, medium: 1, low: 2 }
        const prioA = a.priority || 'medium'
        const prioB = b.priority || 'medium'
        return priorityMap[prioA] - priorityMap[prioB]
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

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high': return <span className="text-xs font-bold text-red-500 uppercase tracking-wider">High Priority</span>
      case 'medium': return <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Medium Priority</span>
      case 'low': return <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Low Priority</span>
      default: return <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Normal</span>
    }
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>
  )

  const displayedReminders = getFilteredReminders()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
          >
            <FiPlus /> New Reminder
          </button>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Study Sessions', count: reminders.filter(r => !r.completed && r.type === 'study').length, color: 'blue' },
          { label: 'Upcoming Exams', count: reminders.filter(r => !r.completed && r.type === 'exam').length, color: 'red' },
          { label: 'Deadlines', count: reminders.filter(r => !r.completed && r.type === 'deadline').length, color: 'orange' },
          { label: 'Completed', count: reminders.filter(r => r.completed).length, color: 'green' }
        ].map(stat => (
          <div key={stat.label} className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 p-4 rounded-xl border border-${stat.color}-100 dark:border-${stat.color}-800`}>
            <div className={`text-2xl font-bold text-${stat.color}-700 dark:text-${stat.color}-300`}>{stat.count}</div>
            <div className={`text-sm text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {displayedReminders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
            <FiCalendar className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reminders found</h3>
          </div>
        ) : (
          displayedReminders.map(reminder => (
            <div
              key={reminder._id || reminder.id}
              className={`group relative bg-white dark:bg-gray-800 p-5 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${reminder.completed ? 'opacity-60' : 'border-l-4 ' + (reminder.type === 'exam' ? 'border-l-red-500' : reminder.type === 'deadline' ? 'border-l-orange-500' : 'border-l-blue-500')}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${getTypeStyle(reminder.type)}`}>
                      {reminder.type}
                    </span>
                    {getPriorityBadge(reminder.priority)}
                    {reminder.completed && (
                      <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                        <FiCheckCircle /> Completed
                      </span>
                    )}
                  </div>
                  <h3 className={`text-lg font-bold text-gray-900 dark:text-white mb-1 ${reminder.completed ? 'line-through' : ''}`}>
                    {reminder.title}
                  </h3>
                  {reminder.description && <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{reminder.description}</p>}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <div className="flex items-center gap-1.5"><FiCalendar /> {format(parseISO(reminder.date), 'EEEE, d MMMM yyyy')}</div>
                    <div className="flex items-center gap-1.5"><FiClock /> {reminder.time}</div>
                    {reminder.sendWhatsApp && isWhatsAppConfirmed && (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 px-2 py-0.5 rounded-full text-xs font-medium">
                        <MdWhatsapp /> WhatsApp Enabled
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 transition-opacity">
                  <button onClick={() => toggleComplete(reminder)} className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200">
                    {reminder.completed ? <FiX /> : <FiCheckCircle />}
                  </button>
                  <button onClick={() => startEdit(reminder)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"><FiEdit2 /></button>
                  <button onClick={() => handleDelete((reminder._id || reminder.id) as string)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Reminder' : 'New Reminder'}</h3>
              <button onClick={resetForm}><FiX /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="e.g., Physics Midterm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    <option value="study">Study Session</option>
                    <option value="exam">Exam</option>
                    <option value="deadline">Deadline</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as any })} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 h-24" />
              </div>
              {isWhatsAppConfirmed && whatsappNumber && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <input type="checkbox" id="whatsapp" checked={formData.sendWhatsApp} onChange={e => setFormData({ ...formData, sendWhatsApp: e.target.checked })} />
                  <label htmlFor="whatsapp" className="flex items-center gap-2 text-sm cursor-pointer">
                    <MdWhatsapp className="text-green-500" /> Send WhatsApp to {whatsappNumber}
                  </label>
                </div>
              )}
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-700/50">
              <button onClick={resetForm} className="px-4 py-2 text-gray-600 dark:text-gray-300">Cancel</button>
              <button onClick={handleSaveReminder} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
