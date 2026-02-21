'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/auth/authService'
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi'

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [token, setToken] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const tokenParam = searchParams.get('token')
        if (tokenParam) {
            setToken(tokenParam)
        } else {
            setError('Invalid reset link. Please request a new password reset.')
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (!token) {
            setError('Invalid reset token')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            await authService.resetPassword(token, password)
            setSuccess(true)

            setTimeout(() => {
                router.push('/auth/login')
            }, 3000)

        } catch (err: any) {
            setError(err.message || 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-md w-full">

                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiLock className="text-3xl text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create a new password for your account
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                            <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-6">
                            <FiCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Password Reset Successful!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Your password has been reset. Redirecting to login...
                            </p>
                            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                                <FiLoader className="animate-spin" />
                                <span>Redirecting...</span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            setError('')
                                        }}
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Must be at least 6 characters
                                </p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value)
                                            setError('')
                                        }}
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
                                disabled={isLoading || !token}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 
                           hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl 
                           transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <FiLoader className="animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Help Text */}
                {!success && (
                    <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Remember your password?{' '}
                        <Link
                            href="/auth/login"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    )
}
