'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { authService } from '@/lib/auth/authService'
import { signIn } from 'next-auth/react'
import {
    FiMail, FiLock, FiEye, FiEyeOff,
    FiAlertCircle, FiLoader
} from 'react-icons/fi'
import { FaGoogle } from 'react-icons/fa'

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuthStore()
    const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' || Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.email || !formData.password) {
            setError('Please enter email and password')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const result = await authService.login({
                email: formData.email,
                password: formData.password
            })

            login(result.user, result.token)
            router.push('/dashboard')

        } catch (err: any) {
            setError(err.message || 'Failed to login')
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
                        Welcome back! Sign in to continue
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">

                    {/* OAuth Buttons */}
                    {googleEnabled && (
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
                    )}

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

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                            <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

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
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Forgot?
                                </Link>
                            </div>
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
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Signup Link */}
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link
                            href="/auth/signup"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
