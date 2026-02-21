'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  FaQuestionCircle,
  FaSearch,
  FaFilter,
  FaTrash,
  FaEdit,
  FaFileExport,
  FaArrowLeft,
  FaCheckCircle
} from 'react-icons/fa'
import Link from 'next/link'

interface Question {
  id: string
  question: string
  type: string
  difficulty: string
  subject?: string
  createdAt: string
  options?: string[]
  correctAnswer?: number
  explanation?: string
}

export default function TeacherQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')

  useEffect(() => {
    loadQuestions()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, searchTerm, filterDifficulty, filterType, filterSubject])

  const loadQuestions = async () => {
    try {
      const match = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null
      const token = match ? decodeURIComponent(match[2]) : ''
      const headers = { 'Authorization': `Bearer ${token}` }

      const response = await fetch('/api/ai/questions', { headers })
      const result = await response.json()

      if (result.success) {
        setQuestions(result.questions)
        setFilteredQuestions(result.questions)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterQuestions = () => {
    let filtered = [...questions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((q) =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === filterDifficulty)
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((q) => q.type === filterType)
    }

    // Subject filter
    if (filterSubject !== 'all') {
      filtered = filtered.filter((q) => q.subject === filterSubject)
    }

    setFilteredQuestions(filtered)
  }

  const deleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        const match = typeof document !== 'undefined'
          ? document.cookie.match(/(^| )auth-token=([^;]+)/)
          : null
        const token = match ? decodeURIComponent(match[2]) : ''

        await fetch(`/api/ai/questions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        setQuestions(prev => prev.filter(q => (q as any)._id !== id && (q as any).id !== id))
      } catch (error) {
        console.error('Error deleting question:', error)
      }
    }
  }

  const exportQuestions = () => {
    const dataStr = JSON.stringify(filteredQuestions, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `questions-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const uniqueSubjects = Array.from(new Set(questions.map((q) => q.subject).filter(Boolean)))
  const uniqueTypes = Array.from(new Set(questions.map((q) => q.type).filter(Boolean)))

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
                Question Bank
              </h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                TEACHER
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and organize all your generated questions
            </p>
          </div>
          <button
            onClick={exportQuestions}
            disabled={filteredQuestions.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <FaFileExport /> Export
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Questions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{questions.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Filtered Results</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredQuestions.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subjects</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueSubjects.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Question Types</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueTypes.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Filter */}
          {uniqueSubjects.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaQuestionCircle className="mx-auto mb-2 text-3xl" />
              <p className="mb-2">No questions found</p>
              <Link
                href="/dashboard/teacher/question-generator"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
              >
                Generate your first question →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question: any) => (
                <div
                  key={question._id || question.id}
                  className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${question.difficulty === 'easy'
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : question.difficulty === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                          }`}>
                          {question.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded text-xs font-medium">
                          {question.type}
                        </span>
                        {question.subject && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 rounded text-xs font-medium">
                            {question.subject}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-2">
                        {question.question}
                      </p>
                      {question.options && question.options.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {question.options.map((option: string, idx: number) => (
                            <div
                              key={idx}
                              className={`text-sm p-2 rounded ${idx === question.correctAnswer
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 font-medium'
                                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                              {String.fromCharCode(65 + idx)}. {option}
                              {idx === question.correctAnswer && (
                                <FaCheckCircle className="inline ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        Created: {new Date(question.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteQuestion(question._id || question.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete question"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
