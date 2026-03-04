'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { postutmeApi, type PostUTMEResult } from '@/lib/api/postutmeApi'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi'

export default function PostUTMEResultDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [result, setResult] = useState<PostUTMEResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    postutmeApi
      .getResultById(id)
      .then((data) => setResult(data.result))
      .catch(() => setResult(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="postutme-page">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!result) {
    return (
      <ProtectedRoute>
        <div className="postutme-page">
          <p className="text-gray-500">Result not found.</p>
          <Link href="/dashboard/postutme/results" className="text-indigo-600 hover:underline mt-4 inline-block">
            ← Back to results
          </Link>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="postutme-page">
        <Link
          href="/dashboard/postutme/results"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 mb-6"
        >
          <FiArrowLeft /> Back to results
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {result.universityName || result.universitySlug || 'Post-UTME'} — Result
          </h2>
          <p className="text-gray-500 mb-4">
            {result.subject || 'Mixed'} • {result.year || 'Mixed'} • {new Date(result.takenAt).toLocaleString()}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
              <p className="text-sm text-gray-500">Correct</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
              <p className="text-sm text-gray-500">Wrong</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-indigo-600">{result.accuracy}%</p>
              <p className="text-sm text-gray-500">Accuracy</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {Math.floor((result.timeTaken || 0) / 60)}m
              </p>
              <p className="text-sm text-gray-500">Time</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Answer Review
          </h3>
          {(result.answers || []).map((a, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border ${
                a.isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                {a.isCorrect ? (
                  <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <FiX className="text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-gray-900 dark:text-white font-medium">
                  Q{i + 1}: {a.questionText?.slice(0, 120)}
                  {a.questionText && a.questionText.length > 120 ? '...' : ''}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                Your answer: <strong>{a.selectedAnswer}</strong>
                {!a.isCorrect && (
                  <> • Correct: <strong>{a.correctAnswer}</strong></>
                )}
              </p>
              {a.explanation && (
                <p className="text-sm text-gray-500 mt-2 ml-6 italic">{a.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
}
