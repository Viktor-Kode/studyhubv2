import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Get Answers to Your Study Questions
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with experienced tutors who can help you understand complex topics
            and excel in your studies.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/signup"
              className="px-8 py-3 text-lg font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 text-lg font-medium text-primary-600 bg-white border-2 border-primary-600 rounded-md hover:bg-primary-50 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ask Questions
            </h3>
            <p className="text-gray-600">
              Submit your study questions and get detailed explanations from
              qualified tutors.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Track Progress
            </h3>
            <p className="text-gray-600">
              Monitor the status of your questions and see when tutors respond
              with answers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Learn Better
            </h3>
            <p className="text-gray-600">
              Get personalized explanations that help you understand concepts
              deeply and improve your grades.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
