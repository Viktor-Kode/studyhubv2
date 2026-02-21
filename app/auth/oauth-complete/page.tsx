'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { authService } from '@/lib/auth/authService'
import { useAuthStore } from '@/lib/store/authStore'
import { FiLoader, FiUser, FiAlertCircle } from 'react-icons/fi'
import { FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa'

export default function OAuthCompletePage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const { login } = useAuthStore()

    const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null)
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [checkingProfile, setCheckingProfile] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }

        if (status === 'authenticated' && session?.user) {
            checkExistingProfile()
        }
    }, [status, session])

    const checkExistingProfile = async () => {
        try {
            // Check if user already has a role
            const result = await authService.getCurrentUser()

            if (result.user && result.user.role) {
                // User already has profile, redirect to dashboard
                console.log('[OAuthComplete] Profile exists, logging in with token');
                login(result.user, result.token || '')
                router.push('/dashboard')
            } else {
                // Need to complete profile
                setCheckingProfile(false)
                setName(session?.user?.name || '')
            }
        } catch (err) {
            // New user, need to complete profile
            setCheckingProfile(false)
            setName(session?.user?.name || '')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedRole) {
            setError('Please select your role')
            return
        }

        if (!name.trim()) {
            setError('Please enter your name')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const result = await authService.completeOAuthProfile(selectedRole, name)
            console.log('[OAuthComplete] Profile saved, logging in with token');
            login(result.user, result.token || '')
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Failed to complete profile')
        } finally {
            setIsLoading(false)
        }
    }

    if (checkingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                    <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Setting up your account...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-md w-full">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiUser className="text-3xl text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Complete Your Profile
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Just one more step to get started!
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                            <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Role Selection - AT TOP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                I am a...
                            </label>
                            <div className="grid grid-cols-2 gap-4">

                                {/* Student Card */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRole('student')
                                        setError('')
                                    }}
                                    className={`p-6 border-2 rounded-xl transition ${selectedRole === 'student'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                                        }`}
                                >
                                    <div className="text-center">
                                        <FaUserGraduate className={`text-3xl mx-auto mb-2 ${selectedRole === 'student' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <p className="font-bold text-gray-900 dark:text-white mb-1">Student</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Access study tools & resources
                                        </p>
                                    </div>
                                </button>

                                {/* Teacher Card */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRole('teacher')
                                        setError('')
                                    }}
                                    className={`p-6 border-2 rounded-xl transition ${selectedRole === 'teacher'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                                        }`}
                                >
                                    <div className="text-center">
                                        <FaChalkboardTeacher className={`text-3xl mx-auto mb-2 ${selectedRole === 'teacher' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <p className="font-bold text-gray-900 dark:text-white mb-1">Teacher</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Manage classes & students
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value)
                                    setError('')
                                }}
                                placeholder="John Doe"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
                           rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !selectedRole}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 
                         hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl 
                         transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <FiLoader className="animate-spin" />
                                    Setting up...
                                </>
                            ) : (
                                'Continue to Dashboard'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
