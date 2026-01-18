'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import StudyReminders from '@/components/dashboard/StudyReminders'
import { FaPlus, FaTrash, FaEdit, FaClock, FaMapMarkerAlt, FaMagic, FaCheck, FaBell, FaCalendar } from 'react-icons/fa'

interface Reminder {
  id: string
  title: string
  date: string
  time: string
  type: 'deadline' | 'study' | 'exam'
  whatsappNumber?: string
  sendWhatsApp?: boolean
  timetableId?: string // Link to timetable item
}

interface ScheduleItem {
  id: string
  title: string
  course: string
  day: string
  time: string
  location: string
  type: 'lecture' | 'lab' | 'tutorial' | 'exam'
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

interface Subject {
  name: string
  hoursPerWeek: number
  difficulty: 'easy' | 'medium' | 'hard'
  preferredDays: string[]
  preferredTimes: string[]
}

interface GeneratorSettings {
  subjects: Subject[]
  startTime: string
  endTime: string
  breakDuration: number
  studySessionDuration: number
  daysPerWeek: string[]
}

function TimetablePageContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'timetable' | 'reminders'>('timetable')

  // Check if we should open reminders tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'reminders') {
      setActiveTab('reminders')
    }
  }, [searchParams])
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: '1',
      title: 'Mathematics',
      course: 'MATH 201',
      day: 'Monday',
      time: '09:00',
      location: 'Room 101',
      type: 'lecture',
    },
    {
      id: '2',
      title: 'Physics Lab',
      course: 'PHYS 202',
      day: 'Wednesday',
      time: '14:00',
      location: 'Lab A',
      type: 'lab',
    },
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<ScheduleItem, 'id'>>({
    title: '',
    course: '',
    day: 'Monday',
    time: '09:00',
    location: '',
    type: 'lecture',
  })
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorSettings>({
    subjects: [{ name: '', hoursPerWeek: 2, difficulty: 'medium', preferredDays: [], preferredTimes: [] }],
    startTime: '08:00',
    endTime: '20:00',
    breakDuration: 15,
    studySessionDuration: 2,
    daysPerWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  })
  const [reminders, setReminders] = useState<Reminder[]>([])

  // Convert day name to next occurrence date
  const getNextDateForDay = (dayName: string): string => {
    const dayMap: { [key: string]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }

    const today = new Date()
    const currentDay = today.getDay()
    const targetDay = dayMap[dayName]

    let daysUntilTarget = targetDay - currentDay
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7 // Next week
    } else if (daysUntilTarget === 0) {
      // If it's today, check if the time has passed
      const [hours, minutes] = formData.time.split(':').map(Number)
      const scheduleTime = new Date()
      scheduleTime.setHours(hours, minutes, 0, 0)
      if (scheduleTime < today) {
        daysUntilTarget = 7 // Next week
      }
    }

    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysUntilTarget)
    return targetDate.toISOString().split('T')[0]
  }

  // Convert timetable type to reminder type
  const timetableTypeToReminderType = (type: ScheduleItem['type']): Reminder['type'] => {
    switch (type) {
      case 'exam':
        return 'exam'
      case 'lecture':
      case 'lab':
      case 'tutorial':
        return 'study'
      default:
        return 'study'
    }
  }

  // Create reminder from timetable item
  const createReminderFromSchedule = (schedule: ScheduleItem): Reminder => {
    const date = getNextDateForDay(schedule.day)
    return {
      id: `reminder-${schedule.id}`,
      title: `${schedule.title} - ${schedule.course}`,
      date: date,
      time: schedule.time,
      type: timetableTypeToReminderType(schedule.type),
      timetableId: schedule.id,
    }
  }

  // Sync reminders with schedules
  useEffect(() => {
    setReminders((prevReminders) => {
      const scheduleReminders: Reminder[] = schedules.map((schedule) => {
        // Check if reminder already exists
        const existingReminder = prevReminders.find((r) => r.timetableId === schedule.id)
        if (existingReminder) {
          // Update existing reminder
          const date = getNextDateForDay(schedule.day)
          return {
            ...existingReminder,
            title: `${schedule.title} - ${schedule.course}`,
            date: date,
            time: schedule.time,
            type: timetableTypeToReminderType(schedule.type),
          }
        }
        // Create new reminder
        return createReminderFromSchedule(schedule)
      })

      // Keep manual reminders (those without timetableId) and add schedule reminders
      const manualReminders = prevReminders.filter((r) => !r.timetableId)
      return [...manualReminders, ...scheduleReminders]
    })
  }, [schedules])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      setSchedules(schedules.map((s) => (s.id === editingId ? { ...formData, id: editingId } : s)))
      setEditingId(null)
    } else {
      setSchedules([...schedules, { ...formData, id: Date.now().toString() }])
    }
    setFormData({ title: '', course: '', day: 'Monday', time: '09:00', location: '', type: 'lecture' })
    setShowAddForm(false)
  }

  const handleEdit = (schedule: ScheduleItem) => {
    setFormData({ title: schedule.title, course: schedule.course, day: schedule.day, time: schedule.time, location: schedule.location, type: schedule.type })
    setEditingId(schedule.id)
    setShowAddForm(true)
  }

  const handleDelete = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id))
    // Also remove associated reminder
    setReminders(reminders.filter((r) => r.timetableId !== id))
  }

  const getTypeColor = (type: ScheduleItem['type']) => {
    const colors = {
      lecture: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      lab: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      tutorial: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      exam: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    }
    return colors[type]
  }

  const getSchedulesByDay = (day: string) => {
    return schedules.filter((s) => s.day === day).sort((a, b) => a.time.localeCompare(b.time))
  }

  const generateTimetable = () => {
    const generatedSchedules: ScheduleItem[] = []
    let scheduleId = Date.now()

    generatorSettings.subjects.forEach((subject) => {
      if (!subject.name) return

      const hoursNeeded = subject.hoursPerWeek
      const sessionsPerWeek = Math.ceil(hoursNeeded / generatorSettings.studySessionDuration)
      const sessionsPerDay = Math.ceil(sessionsPerWeek / generatorSettings.daysPerWeek.length)

      // Distribute sessions across preferred days or available days
      const availableDays = subject.preferredDays.length > 0 
        ? subject.preferredDays 
        : generatorSettings.daysPerWeek

      let sessionCount = 0
      availableDays.forEach((day) => {
        if (sessionCount >= sessionsPerWeek) return

        const sessionsForDay = Math.min(sessionsPerDay, sessionsPerWeek - sessionCount)
        
        // Generate time slots
        const availableTimes = subject.preferredTimes.length > 0
          ? subject.preferredTimes
          : timeSlots.filter(
              (time) => time >= generatorSettings.startTime && time <= generatorSettings.endTime
            )

        for (let i = 0; i < sessionsForDay && sessionCount < sessionsPerWeek; i++) {
          const timeIndex = sessionCount % availableTimes.length
          const time = availableTimes[timeIndex]

          generatedSchedules.push({
            id: (scheduleId++).toString(),
            title: subject.name,
            course: subject.name,
            day: day,
            time: time,
            location: 'Study Area',
            type: 'tutorial',
          })
          sessionCount++
        }
      })
    })

    // Merge with existing schedules (avoid duplicates)
    const existingTitles = new Set(schedules.map((s) => `${s.title}-${s.day}-${s.time}`))
    const newSchedules = generatedSchedules.filter(
      (s) => !existingTitles.has(`${s.title}-${s.day}-${s.time}`)
    )

    setSchedules([...schedules, ...newSchedules])
    setShowGenerator(false)
  }

  const addSubject = () => {
    setGeneratorSettings({
      ...generatorSettings,
      subjects: [
        ...generatorSettings.subjects,
        { name: '', hoursPerWeek: 2, difficulty: 'medium', preferredDays: [], preferredTimes: [] },
      ],
    })
  }

  const removeSubject = (index: number) => {
    setGeneratorSettings({
      ...generatorSettings,
      subjects: generatorSettings.subjects.filter((_, i) => i !== index),
    })
  }

  const updateSubject = (index: number, field: keyof Subject, value: any) => {
    const updatedSubjects = [...generatorSettings.subjects]
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value }
    setGeneratorSettings({ ...generatorSettings, subjects: updatedSubjects })
  }

  const toggleDay = (subjectIndex: number, day: string) => {
    const subject = generatorSettings.subjects[subjectIndex]
    const preferredDays = subject.preferredDays.includes(day)
      ? subject.preferredDays.filter((d) => d !== day)
      : [...subject.preferredDays, day]
    updateSubject(subjectIndex, 'preferredDays', preferredDays)
  }

  const toggleTime = (subjectIndex: number, time: string) => {
    const subject = generatorSettings.subjects[subjectIndex]
    const preferredTimes = subject.preferredTimes.includes(time)
      ? subject.preferredTimes.filter((t) => t !== time)
      : [...subject.preferredTimes, time]
    updateSubject(subjectIndex, 'preferredTimes', preferredTimes)
  }

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Schedule & Reminders
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage your class schedule, study timetable, and reminders
          </p>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                activeTab === 'timetable'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <FaCalendar />
              Timetable
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                activeTab === 'reminders'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <FaBell />
              Reminders
            </button>
          </div>
        </div>

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div className="max-w-4xl">
            <StudyReminders 
              reminders={reminders}
              setReminders={setReminders}
            />
          </div>
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Timetable
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your class schedule and activities
              </p>
            </div>
            <div className="flex gap-3">
            <button
              onClick={() => {
                setShowGenerator(true)
                setShowAddForm(false)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <FaMagic />
              Generate Timetable
            </button>
            <button
              onClick={() => {
                setShowAddForm(true)
                setShowGenerator(false)
                setEditingId(null)
                setFormData({ title: '', course: '', day: 'Monday', time: '09:00', location: '', type: 'lecture' })
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FaPlus />
              Add Schedule
            </button>
            </div>
          </div>

        {showGenerator && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaMagic className="text-purple-500" />
              Generate Study Timetable
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create an optimized study schedule based on your subjects and preferences
            </p>

            {/* General Settings */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={generatorSettings.startTime}
                    onChange={(e) => setGeneratorSettings({ ...generatorSettings, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={generatorSettings.endTime}
                    onChange={(e) => setGeneratorSettings({ ...generatorSettings, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Session Duration (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={generatorSettings.studySessionDuration}
                    onChange={(e) => setGeneratorSettings({ ...generatorSettings, studySessionDuration: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Study Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        const daysPerWeek = generatorSettings.daysPerWeek.includes(day)
                          ? generatorSettings.daysPerWeek.filter((d) => d !== day)
                          : [...generatorSettings.daysPerWeek, day]
                        setGeneratorSettings({ ...generatorSettings, daysPerWeek })
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        generatorSettings.daysPerWeek.includes(day)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subjects */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Subjects</h3>
                <button
                  onClick={addSubject}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  <FaPlus />
                  Add Subject
                </button>
              </div>

              {generatorSettings.subjects.map((subject, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject Name
                      </label>
                      <input
                        type="text"
                        value={subject.name}
                        onChange={(e) => updateSubject(index, 'name', e.target.value)}
                        placeholder="e.g., Mathematics"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hours/Week
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={subject.hoursPerWeek}
                        onChange={(e) => updateSubject(index, 'hoursPerWeek', parseInt(e.target.value) || 2)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={subject.difficulty}
                        onChange={(e) => updateSubject(index, 'difficulty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    {generatorSettings.subjects.length > 1 && (
                      <div className="flex items-end">
                        <button
                          onClick={() => removeSubject(index)}
                          className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Days (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {days.map((day) => (
                          <button
                            key={day}
                            onClick={() => toggleDay(index, day)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              subject.preferredDays.includes(day)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Times (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => toggleTime(index, time)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              subject.preferredTimes.includes(time)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={generateTimetable}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                <FaMagic />
                Generate Timetable
              </button>
              <button
                onClick={() => setShowGenerator(false)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Edit Schedule' : 'Add New Schedule'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day
                  </label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time
                  </label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleItem['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'} Schedule
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingId(null)
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {days.map((day) => (
            <div key={day} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-center">{day}</h3>
              <div className="space-y-3">
                {getSchedulesByDay(day).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No classes</p>
                ) : (
                  getSchedulesByDay(day).map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`p-3 rounded-lg border ${getTypeColor(schedule.type)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{schedule.title}</h4>
                          <p className="text-xs opacity-80">{schedule.course}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-80">
                        <FaClock className="text-xs" />
                        <span>{schedule.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-80 mt-1">
                        <FaMapMarkerAlt className="text-xs" />
                        <span>{schedule.location}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default function TimetablePage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    }>
      <TimetablePageContent />
    </Suspense>
  )
}
