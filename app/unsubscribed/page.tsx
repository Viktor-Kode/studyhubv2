'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function UnsubscribedPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          {error ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                We couldn&apos;t process your unsubscribe request. Please try again or contact support.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You&apos;ve been unsubscribed</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                You won&apos;t receive any more marketing emails from StudyHelp.
              </p>
            </>
          )}
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
          >
            Back to StudyHelp
          </Link>
        </div>
      </div>
    </div>
  )
}
