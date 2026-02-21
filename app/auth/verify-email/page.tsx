'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiCheckCircle, FiXCircle, FiLoader, FiArrowRight } from 'react-icons/fi'

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const token = searchParams.get('token')
        if (token) {
            verifyToken(token)
        } else {
            setStatus('error')
            setMessage('Invalid verification link.')
        }
    }, [searchParams])

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            })

            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage(data.message || 'Email verified successfully!')
            } else {
                setStatus('error')
                setMessage(data.error || 'Verification failed.')
            }
        } catch (err) {
            setStatus('error')
            setMessage('Something went wrong. Please try again later.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 text-center">

                    {status === 'loading' && (
                        <div className="py-8">
                            <FiLoader className="text-5xl text-blue-500 animate-spin mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying Your Email</h1>
                            <p className="text-gray-600 dark:text-gray-400">Please wait a moment...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-8">
                            <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Great Success!</h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">{message}</p>
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg"
                            >
                                Sign In <FiArrowRight />
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-8">
                            <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">{message}</p>
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/auth/signup"
                                    className="py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                    Back to Signup
                                </Link>
                                <Link
                                    href="/"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                >
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    )
}
