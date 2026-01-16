'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { questionsApi, Question } from '@/lib/api/questions'

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.id as string
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (questionId) {
      fetchQuestion()
    }
  }, [questionId])

  const fetchQuestion = async () => {
    try {
      setLoading(true)
      const data = await questionsApi.getById(questionId)
      setQuestion(data)
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to load question'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 text-primary-600 hover:text-primary-700 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : question ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Status Badge */}
              <div className="mb-6">
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

              {/* Question Content */}
              <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-500 mb-2">
                  Your Question
                </h2>
                <p className="text-lg text-gray-900 whitespace-pre-wrap">
                  {question.content}
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Asked on {formatDate(question.createdAt)}
                </p>
              </div>

              {/* Response Section */}
              {question.status === 'answered' && question.response ? (
                <div className="border-t border-gray-200 pt-8">
                  <h2 className="text-sm font-medium text-gray-500 mb-2">
                    Tutor Response
                  </h2>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {question.response}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Answered on {formatDate(question.updatedAt)}
                  </p>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      Your question is pending. A tutor will respond soon.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
    </ProtectedRoute>
  )
}
