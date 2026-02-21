'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authService } from '@/lib/auth/authService'
import { FiMail, FiAlertCircle, FiCheckCircle, FiLoader, FiArrowLeft } from 'react-icons/fi'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            setError('Please enter your email')
            return
        }

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const result = await authService.forgotPassword(email)
            setSuccess(result.message)
            setEmail('')
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-md w-full">

                {/* Back Button */}
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
                >
                    <FiArrowLeft /> Back to login
                </Link>

                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiMail className="text-3xl text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        No worries! We'll send you reset instructions
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

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                            <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                        </div>
                    )}

                    {!success && (
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
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            setError('')
                                        }}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 
                               rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
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
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    )}

                    {success && (
                        <div className="text-center">
                            <div className="text-5xl mb-4">📧</div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Check your email for the reset link. It may take a few minutes to arrive.
                            </p>
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <FiArrowLeft className="text-sm" />
                                Back to login
                            </Link>
                        </div>
                    )}
                </div>

                {/* Help Text */}
                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Remember your password?{' '}
                    <Link
                        href="/auth/login"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
