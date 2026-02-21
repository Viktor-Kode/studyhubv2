'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { authService } from '@/lib/auth/authService'
import { signIn } from 'next-auth/react'
import {
    FiMail, FiLock, FiUser, FiEye, FiEyeOff,
    FiAlertCircle, FiCheckCircle, FiLoader
} from 'react-icons/fi'
import { FaGoogle, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa'

export default function SignupPage() {
    const router = useRouter()
    const { login } = useAuthStore()

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student' as 'student' | 'teacher'
    })

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setError('')
    }

    const validateForm = () => {
        if (!formData.name || !formData.email || !formData.password) {
            setError('All fields are required')
            return false
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return false
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const result = await authService.signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            })

            login(result.user, result.token)
            setSuccess(result.message || 'Account created successfully!')

            setTimeout(() => {
                router.push('/dashboard')
            }, 1500)

        } catch (err: any) {
            setError(err.message || 'Failed to create account')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuthSignIn = async (provider: 'google') => {
        try {
            await signIn(provider, { callbackUrl: '/auth/oauth-complete' })
        } catch (err: any) {
            setError(`${provider} sign in failed`)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-md w-full">

                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        StudyBuddy
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create your account to get started
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">

                    {/* OAuth Buttons */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => handleOAuthSignIn('google')}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 
                         border-2 border-gray-300 dark:border-gray-600 rounded-xl
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium
                         text-gray-700 dark:text-gray-300"
                        >
                            <FaGoogle className="text-xl text-red-500" />
                            Continue with Google
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                            <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                            <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                        </div>
                    )}

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Role - AT TOP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                I am a...
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'student' })}
                                    className={`p-4 border-2 rounded-xl transition ${formData.role === 'student'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <FaUserGraduate className={`text-2xl mx-auto mb-1 ${formData.role === 'student' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <p className="font-medium text-gray-900 dark:text-white">Student</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'teacher' })}
                                    className={`p-4 border-2 rounded-xl transition ${formData.role === 'teacher'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <FaChalkboardTeacher className={`text-2xl mx-auto mb-1 ${formData.role === 'teacher' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <p className="font-medium text-gray-900 dark:text-white">Teacher</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 
                         hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl 
                         transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <FiLoader className="animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link
                            href="/auth/login"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Terms */}
                <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    By signing up, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    )
}
