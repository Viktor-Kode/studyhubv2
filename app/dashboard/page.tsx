'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { questionsApi, Question } from '@/lib/api/questions'

export default function DashboardPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionContent, setQuestionContent] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const data = await questionsApi.getAll()
      setQuestions(data)
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to load questions'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!questionContent.trim()) {
      setError('Question content cannot be empty')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const newQuestion = await questionsApi.create({
        content: questionContent.trim(),
      })
      setQuestions([newQuestion, ...questions])
      setQuestionContent('')
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to submit question'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

          {/* Question Submission Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ask a Question
            </h2>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <textarea
                value={questionContent}
                onChange={(e) => setQuestionContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Type your question here..."
                disabled={submitting}
              />
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={submitting || !questionContent.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Question'}
                </button>
              </div>
            </form>
          </div>

          {/* Questions List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Questions
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No questions yet. Submit your first question above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                          {question.content}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(question.createdAt)}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            question.status === 'answered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {question.status === 'answered' ? 'Answered' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
