'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { postutmeApi, type PostUTMEResult } from '@/lib/api/postutmeApi'
import Link from 'next/link'
import { FiArrowLeft, FiAward } from 'react-icons/fi'

export default function PostUTMEResultsPage() {
  const [results, setResults] = useState<PostUTMEResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postutmeApi
      .getResults()
      .then((data) => setResults(data.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ProtectedRoute>
      <div className="postutme-page">
        <div className="postutme-header">
          <Link
            href="/dashboard/postutme"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 mb-4"
          >
            <FiArrowLeft /> Back to Post-UTME
          </Link>
          <h2>📋 My Post-UTME Results</h2>
          <p>View your past Post-UTME practice results</p>
        </div>

        {loading ? (
          <div className="uni-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="uni-card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="notes-empty">
            <span className="empty-icon">📋</span>
            <h3>No results yet</h3>
            <p>Complete a Post-UTME practice to see your results here</p>
            <Link
              href="/dashboard/postutme"
              className="new-note-btn mt-4 inline-block"
            >
              Start Practice
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
              <Link
                key={r._id}
                href={`/dashboard/postutme/results/${r._id}`}
                className="uni-card block hover:border-indigo-400"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {r.universityName || r.universitySlug || 'Post-UTME'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {r.subject || 'Mixed'} • {r.year || 'Mixed'} • {r.totalQuestions} questions
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <FiAward /> {r.accuracy}%
                    </span>
                    <p className="text-xs text-gray-500">
                      {r.correctAnswers}/{r.totalQuestions} correct
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(r.takenAt).toLocaleDateString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
