'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await authApi.login({ 
        email: email.trim().toLowerCase(), 
        password 
      })
      
      // Handle successful login - normalize response
      const token = response.token || response.accessToken
      const user = response.user || response.data?.user
      
      if (user && token) {
        // Normalize user object
        const normalizedUser = {
          id: user.id || user._id || user.email,
          email: user.email || email,
          role: user.role,
          phone: user.phone,
          schoolName: user.schoolName,
        }
        setAuth(normalizedUser, token)
        router.push('/dashboard')
      } else if (response.data) {
        // Try nested data structure
        const nestedToken = response.data.token || response.data.accessToken
        const nestedUser = response.data.user
        if (nestedUser && nestedToken) {
          const normalizedUser = {
            id: nestedUser.id || nestedUser._id || nestedUser.email,
            email: nestedUser.email || email,
            role: nestedUser.role,
            phone: nestedUser.phone,
            schoolName: nestedUser.schoolName,
          }
          setAuth(normalizedUser, nestedToken)
          router.push('/dashboard')
        } else {
          setError('Login successful but invalid response format. Please try again.')
        }
      } else {
        setError('Login successful but invalid response format. Please try again.')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      
      // Comprehensive error handling
      let errorMessage = 'An error occurred during login. Please try again.'
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status
        const data = err.response.data
        
        if (status === 400) {
          // Bad request - validation errors
          if (data.message) {
            errorMessage = data.message
          } else if (data.error) {
            errorMessage = data.error
          } else if (Array.isArray(data.errors)) {
            errorMessage = data.errors.join(', ')
          } else if (typeof data === 'string') {
            errorMessage = data
          }
        } else if (status === 401) {
          // Unauthorized - invalid credentials
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (status === 404) {
          // Not found - user doesn't exist
          errorMessage = 'No account found with this email. Please sign up first.'
        } else if (status === 422) {
          // Unprocessable entity
          errorMessage = data.message || data.error || 'Invalid data provided. Please check your information.'
        } else if (status === 500) {
          // Server error
          errorMessage = 'Server error. Please try again later.'
        } else if (data?.message) {
          errorMessage = data.message
        } else if (data?.error) {
          errorMessage = data.error
        }
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Request timeout
        errorMessage = 'Request timed out. Please check your internet connection and try again.'
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
      } else if (err.message) {
        // Error setting up the request
        if (err.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link
                href="/signup"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                create a new account
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
