'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { paymentApi } from '@/lib/api/paymentApi'
import { useAuthStore } from '@/lib/store/authStore'
import { FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import Link from 'next/link'

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const transactionId = searchParams.get('transaction_id')
    const txRef = searchParams.get('tx_ref')
    const statusParam = searchParams.get('status')
    const { refreshUser } = useAuthStore()
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
    const [message, setMessage] = useState('Verifying your payment...')

    useEffect(() => {
        if (!transactionId || !txRef) {
            setStatus('failed')
            setMessage('No payment reference found.')
            return
        }

        const verify = async () => {
            try {
                if (statusParam === 'successful') {
                    const data = await paymentApi.verifyPayment(transactionId, txRef)
                    if (data.success) {
                        await refreshUser()
                        setStatus('success')
                        setMessage(data.message || 'Your plan has been upgraded successfully!')
                    } else {
                        setStatus('failed')
                        setMessage(data.error || 'Payment verification failed.')
                    }
                } else if (statusParam === 'cancelled') {
                    setStatus('failed')
                    setMessage('Payment was cancelled.')
                } else {
                    setStatus('failed')
                    setMessage('Payment was not successful.')
                }
            } catch (err: any) {
                setStatus('failed')
                setMessage(err.response?.data?.error || err.message || 'Verification error occurred.')
            }
        }

        verify()
    }, [transactionId, txRef, statusParam])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-gray-800">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <FiLoader className="text-5xl text-blue-500 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying Payment</h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <FiCheckCircle className="text-5xl text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">{message}</p>
                        <Link
                            href="/dashboard/student"
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                            <FiXCircle className="text-5xl text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">{message}</p>
                        <Link
                            href="/dashboard/pricing"
                            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all"
                        >
                            Try Again
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function VerifyPaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyContent />
        </Suspense>
    )
}
