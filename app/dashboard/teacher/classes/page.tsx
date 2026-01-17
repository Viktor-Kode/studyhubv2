'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { 
  FaUsers, 
  FaPlus, 
  FaEdit, 
  FaTrash,
  FaSearch,
  FaQuestionCircle,
  FaArrowLeft,
  FaTimes,
  FaCheck,
  FaUserPlus,
  FaCalendar,
  FaClipboardList,
  FaBullhorn,
  FaFileExport,
  FaEye,
  FaClock,
  FaGraduationCap
} from 'react-icons/fa'

interface Student {
  id: string
  name: string
  email?: string
  studentId?: string
  addedAt: string
}

interface Assignment {
  id: string
  title: string
  type: 'assignment' | 'classwork' | 'mid-term' | 'examination'
  dueDate: string
  totalMarks: number
  createdAt: string
}

interface Announcement {
  id: string
  title: string
  message: string
  createdAt: string
}

interface Class {
  id: string
  name: string
  subject: string
  studentCount: number
  questionsGenerated: number
  description?: string
  createdAt: string
  students?: Student[]
  schedule?: {
    day: string
    time: string
    location?: string
  }[]
  assignments?: Assignment[]
  announcements?: Announcement[]
}

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showClassDetails, setShowClassDetails] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [activeTab, setActiveTab] = useState<'students' | 'schedule' | 'assignments' | 'announcements'>('students')
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    studentCount: 0,
  })
  const [newStudent, setNewStudent] = useState({ name: '', email: '', studentId: '' })
  const [newSchedule, setNewSchedule] = useState({ day: '', time: '', location: '' })
  const [newAssignment, setNewAssignment] = useState({ title: '', type: 'assignment' as const, dueDate: '', totalMarks: 0 })
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' })

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    filterClasses()
  }, [classes, searchTerm])

  const loadClasses = () => {
    try {
      const savedClasses = localStorage.getItem('teacherClasses')
      if (savedClasses) {
        const parsed = JSON.parse(savedClasses)
        setClasses(parsed)
        setFilteredClasses(parsed)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClasses = () => {
    if (!searchTerm) {
      setFilteredClasses(classes)
      return
    }
    const filtered = classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredClasses(filtered)
  }

  const openModal = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls)
      setFormData({
        name: cls.name,
        subject: cls.subject,
        description: cls.description || '',
        studentCount: cls.studentCount,
      })
    } else {
      setEditingClass(null)
      setFormData({
        name: '',
        subject: '',
        description: '',
        studentCount: 0,
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingClass(null)
    setFormData({
      name: '',
      subject: '',
      description: '',
      studentCount: 0,
    })
  }

  const saveClass = () => {
    if (!formData.name || !formData.subject) {
      alert('Please fill in all required fields')
      return
    }

    if (editingClass) {
      // Update existing class
      const updated = classes.map((cls) =>
        cls.id === editingClass.id
          ? {
              ...cls,
              ...formData,
            }
          : cls
      )
      setClasses(updated)
      localStorage.setItem('teacherClasses', JSON.stringify(updated))
    } else {
      // Create new class
      const newClass: Class = {
        id: `class-${Date.now()}`,
        ...formData,
        questionsGenerated: 0,
        createdAt: new Date().toISOString(),
      }
      const updated = [...classes, newClass]
      setClasses(updated)
      localStorage.setItem('teacherClasses', JSON.stringify(updated))
    }

    closeModal()
  }

  const deleteClass = (id: string) => {
    if (confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      const updated = classes.filter((cls) => cls.id !== id)
      setClasses(updated)
      localStorage.setItem('teacherClasses', JSON.stringify(updated))
    }
  }

  const openClassDetails = (cls: Class) => {
    setSelectedClass(cls)
    setShowClassDetails(true)
    setActiveTab('students')
  }

  const closeClassDetails = () => {
    setShowClassDetails(false)
    setSelectedClass(null)
  }

  const addStudent = () => {
    if (!selectedClass || !newStudent.name) {
      alert('Please enter student name')
      return
    }
    const student: Student = {
      id: `student-${Date.now()}`,
      name: newStudent.name,
      email: newStudent.email || undefined,
      studentId: newStudent.studentId || undefined,
      addedAt: new Date().toISOString(),
    }
    const updated = classes.map((cls) =>
      cls.id === selectedClass.id
        ? {
            ...cls,
            students: [...(cls.students || []), student],
            studentCount: (cls.students?.length || 0) + 1,
          }
        : cls
    )
    setClasses(updated)
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) || null)
    localStorage.setItem('teacherClasses', JSON.stringify(updated))
    setNewStudent({ name: '', email: '', studentId: '' })
  }

  const removeStudent = (studentId: string) => {
    if (!selectedClass) return
    if (confirm('Remove this student from the class?')) {
      const updated = classes.map((cls) =>
        cls.id === selectedClass.id
          ? {
              ...cls,
              students: (cls.students || []).filter((s) => s.id !== studentId),
              studentCount: Math.max(0, (cls.students?.length || 0) - 1),
            }
          : cls
      )
      setClasses(updated)
      setSelectedClass(updated.find((c) => c.id === selectedClass.id) || null)
      localStorage.setItem('teacherClasses', JSON.stringify(updated))
    }
  }

  const addSchedule = () => {
    if (!selectedClass || !newSchedule.day || !newSchedule.time) {
      alert('Please fill in day and time')
      return
    }
    const updated = classes.map((cls) =>
      cls.id === selectedClass.id
        ? {
            ...cls,
            schedule: [...(cls.schedule || []), { ...newSchedule }],
          }
        : cls
    )
    setClasses(updated)
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) || null)
    localStorage.setItem('teacherClasses', JSON.stringify(updated))
    setNewSchedule({ day: '', time: '', location: '' })
  }

  const removeSchedule = (index: number) => {
    if (!selectedClass) return
    const updated = classes.map((cls) =>
      cls.id === selectedClass.id
        ? {
            ...cls,
            schedule: (cls.schedule || []).filter((_, i) => i !== index),
          }
        : cls
    )
    setClasses(updated)
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) || null)
    localStorage.setItem('teacherClasses', JSON.stringify(updated))
  }

  const addAssignment = () => {
    if (!selectedClass || !newAssignment.title || !newAssignment.dueDate) {
      alert('Please fill in all required fields')
      return
    }
    const assignment: Assignment = {
      id: `assignment-${Date.now()}`,
      ...newAssignment,
      createdAt: new Date().toISOString(),
    }
    const updated = classes.map((cls) =>
      cls.id === selectedClass.id
        ? {
            ...cls,
            assignments: [...(cls.assignments || []), assignment],
          }
        : cls
    )
    setClasses(updated)
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) || null)
    localStorage.setItem('teacherClasses', JSON.stringify(updated))
    setNewAssignment({ title: '', type: 'assignment', dueDate: '', totalMarks: 0 })
  }

  const removeAssignment = (assignmentId: string) => {
    if (!selectedClass) return
    const updated = classes.map((cls) =>
      cls.id === selectedClass.id
        ? {
            ...cls,
            assignments: (cls.assignments || []).filter((a) => a.id !== assignmentId),
          }
        : cls
    )
    setClasses(updated)
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) || null)
    localStorage.setItem('teacherClasses', JSON.stringify(updated))
  }

  const addAnnouncement = () => {
    if (!selectedClass || !newAnnouncement.title || !newAnnouncement.message) {
      alert('Please fill in all fields')
      return
    }
    const announcement: Announcement = {
      id: `announcement-${Date.now()}`,
      ...newAnnouncement,
      createdAt: new Date().toISOString(),
    }
    const updated = classes.map((cls) =>
      cls.id === selectedClass.id
        ? {
            ...cls,
            announcements: [...(cls.announcements || []), announcement],
          }
        : cls
    )
    setClasses(updated)
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) || null)
    localStorage.setItem('teacherClasses', JSON.stringify(updated))
    setNewAnnouncement({ title: '', message: '' })
  }

  const removeAnnouncement = (announcementId: string) => {
    if (!selectedClass) return
    const updated = classes.map((cls) =>
      cls.id === selectedClass.id
        ? {
            ...cls,
            announcements: (cls.announcements || []).filter((a) => a.id !== announcementId),
          }
        : cls
    )
    setClasses(updated)
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) || null)
    localStorage.setItem('teacherClasses', JSON.stringify(updated))
  }

  const exportClassData = (cls: Class) => {
    const data = {
      class: {
        name: cls.name,
        subject: cls.subject,
        description: cls.description,
        studentCount: cls.studentCount,
        questionsGenerated: cls.questionsGenerated,
      },
      students: cls.students || [],
      schedule: cls.schedule || [],
      assignments: cls.assignments || [],
      announcements: cls.announcements || [],
    }
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${cls.name}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0)
  const totalQuestions = classes.reduce((sum, cls) => sum + cls.questionsGenerated, 0)

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard/teacher"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaArrowLeft />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Class Management
              </h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                TEACHER
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage your classes and students
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Create Class
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Classes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{classes.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Students</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Questions Generated</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuestions}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Classes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{classes.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaUsers className="mx-auto mb-2 text-3xl" />
              <p className="mb-2">No classes found</p>
              <button
                onClick={() => openModal()}
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
              >
                Create your first class →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {cls.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {cls.subject}
                      </p>
                      {cls.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-3 line-clamp-2">
                          {cls.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(cls)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit class"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteClass(cls.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete class"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <FaUsers className="text-xs" />
                        {cls.studentCount} students
                      </span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <FaQuestionCircle className="text-xs" />
                        {cls.questionsGenerated} questions
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingClass ? 'Edit Class' : 'Create New Class'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., CS101, Mathematics 101"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Computer Science, Mathematics"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Students
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveClass}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaCheck /> {editingClass ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Class Details Modal */}
        {showClassDetails && selectedClass && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedClass.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedClass.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportClassData(selectedClass)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Export class data"
                  >
                    <FaFileExport />
                  </button>
                  <button
                    onClick={closeClassDetails}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                {[
                  { id: 'students', label: 'Students', icon: FaUsers },
                  { id: 'schedule', label: 'Schedule', icon: FaCalendar },
                  { id: 'assignments', label: 'Assignments', icon: FaClipboardList },
                  { id: 'announcements', label: 'Announcements', icon: FaBullhorn },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Students Tab */}
                {activeTab === 'students' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Student Roster ({selectedClass.students?.length || 0})
                      </h3>
                      <button
                        onClick={addStudent}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <FaUserPlus /> Add Student
                      </button>
                    </div>

                    {/* Add Student Form */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add New Student</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Student Name *"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="email"
                          placeholder="Email (optional)"
                          value={newStudent.email}
                          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Student ID (optional)"
                          value={newStudent.studentId}
                          onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <button
                        onClick={addStudent}
                        className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Add Student
                      </button>
                    </div>

                    {/* Students List */}
                    <div className="space-y-2">
                      {selectedClass.students && selectedClass.students.length > 0 ? (
                        selectedClass.students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {student.email && <span>{student.email}</span>}
                                {student.studentId && <span>ID: {student.studentId}</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => removeStudent(student.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No students added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Class Schedule
                      </h3>
                      <button
                        onClick={addSchedule}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <FaPlus /> Add Schedule
                      </button>
                    </div>

                    {/* Add Schedule Form */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add Schedule</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={newSchedule.day}
                          onChange={(e) => setNewSchedule({ ...newSchedule, day: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">Select Day</option>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={newSchedule.time}
                          onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Location (optional)"
                          value={newSchedule.location}
                          onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <button
                        onClick={addSchedule}
                        className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Add Schedule
                      </button>
                    </div>

                    {/* Schedule List */}
                    <div className="space-y-2">
                      {selectedClass.schedule && selectedClass.schedule.length > 0 ? (
                        selectedClass.schedule.map((schedule, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center gap-4">
                              <FaCalendar className="text-blue-500" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{schedule.day}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  <FaClock className="inline mr-1" />
                                  {schedule.time}
                                  {schedule.location && ` • ${schedule.location}`}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeSchedule(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No schedule added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Assignments & Tests ({selectedClass.assignments?.length || 0})
                      </h3>
                      <button
                        onClick={addAssignment}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <FaPlus /> Add Assignment
                      </button>
                    </div>

                    {/* Add Assignment Form */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add Assignment/Test</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Title *"
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <select
                          value={newAssignment.type}
                          onChange={(e) => setNewAssignment({ ...newAssignment, type: e.target.value as any })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="assignment">Assignment</option>
                          <option value="classwork">Classwork</option>
                          <option value="mid-term">Mid-Term Test</option>
                          <option value="examination">Examination</option>
                        </select>
                        <input
                          type="date"
                          value={newAssignment.dueDate}
                          onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Total Marks"
                          value={newAssignment.totalMarks}
                          onChange={(e) => setNewAssignment({ ...newAssignment, totalMarks: parseInt(e.target.value) || 0 })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <button
                        onClick={addAssignment}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Add Assignment
                      </button>
                    </div>

                    {/* Assignments List */}
                    <div className="space-y-2">
                      {selectedClass.assignments && selectedClass.assignments.length > 0 ? (
                        selectedClass.assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{assignment.title}</h4>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    assignment.type === 'assignment' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                                    assignment.type === 'classwork' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                                    assignment.type === 'mid-term' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400' :
                                    'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400'
                                  }`}>
                                    {assignment.type === 'assignment' ? 'Assignment' : assignment.type === 'classwork' ? 'Classwork' : assignment.type === 'mid-term' ? 'Mid-Term' : 'Examination'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span><FaClock className="inline mr-1" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                  <span><FaGraduationCap className="inline mr-1" /> {assignment.totalMarks} marks</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeAssignment(assignment.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No assignments added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Announcements Tab */}
                {activeTab === 'announcements' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Announcements ({selectedClass.announcements?.length || 0})
                      </h3>
                      <button
                        onClick={addAnnouncement}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <FaPlus /> Add Announcement
                      </button>
                    </div>

                    {/* Add Announcement Form */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">New Announcement</h4>
                      <input
                        type="text"
                        placeholder="Title *"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm mb-3"
                      />
                      <textarea
                        placeholder="Message *"
                        value={newAnnouncement.message}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                      />
                      <button
                        onClick={addAnnouncement}
                        className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Post Announcement
                      </button>
                    </div>

                    {/* Announcements List */}
                    <div className="space-y-3">
                      {selectedClass.announcements && selectedClass.announcements.length > 0 ? (
                        selectedClass.announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{announcement.title}</h4>
                              <button
                                onClick={() => removeAnnouncement(announcement.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <FaTrash />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{announcement.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(announcement.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No announcements yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
