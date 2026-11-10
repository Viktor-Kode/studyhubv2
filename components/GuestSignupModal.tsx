'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { AppUser } from '@/lib/types/auth'
import { X, Lock, Sparkles, Loader2, ArrowRight } from 'lucide-react'

interface GuestSignupModalProps {
  isOpen: boolean
  onClose: () => void
  topicId: string
  nodeId?: number
  onSuccess: () => void
}

export default function GuestSignupModal({
  isOpen,
  onClose,
  topicId,
  nodeId = 2,
  onSuccess,
}: GuestSignupModalProps) {
  const [isLogin, setIsLogin] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const anonId = typeof window !== 'undefined' ? localStorage.getItem('studyhelp_anon_session_id') : null
      const endpoint = isLogin ? '/api/users/login' : '/api/users/signup'
      const payload: Record<string, any> = {
        email,
        password,
        anonymousSessionId: anonId || undefined,
        claimTopicId: topicId || undefined,
      }

      if (!isLogin) {
        if (!name.trim()) {
          throw new Error('Please enter your name')
        }
        payload.name = name.trim()
        payload.role = 'student'
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || (isLogin ? 'Failed to log in' : 'Failed to create account'))
      }

      const token = data.token
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('studyhelp_auth_token', token)
        localStorage.removeItem('studyhelp_anon_session_id')
      }

      // Populate user in store
      const returnedUser = data.data?.user || data.user
      if (returnedUser) {
        const appUser: AppUser = {
          uid: returnedUser._id || returnedUser.id || 'usr_' + Date.now(),
          email: returnedUser.email || email,
          name: returnedUser.name || name || 'Student',
          role: returnedUser.role || 'student',
        }
        setUser(appUser)
      }

      // If claiming succeeded, let's also fire a claim call just in case it wasn't done atomically in auth
      if (anonId && topicId && token) {
        try {
          await fetch('/api/study-paths/claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ topicId, anonymousSessionId: anonId }),
          })
        } catch {
          // Non-blocking
        }
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Free Trial Completed
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Unlock Node {nodeId} &amp; Keep Progress
            </h2>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Create a free account to unlock Node {nodeId}, claim your Node 1 XP, and continue your full study roadmap.
        </p>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-5">
          <button
            type="button"
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
              !isLogin
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => {
              setIsLogin(false)
              setError(null)
            }}
          >
            Create Free Account
          </button>
          <button
            type="button"
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
              isLogin
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => {
              setIsLogin(true)
              setError(null)
            }}
          >
            Already Have an Account?
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Log In & Unlock' : 'Unlock Node 2 Now'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

