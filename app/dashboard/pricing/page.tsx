'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { paymentApi } from '@/lib/api/paymentApi'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FiCheck, FiX, FiLoader, FiZap, FiAward, FiStar } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const PLANS = [
    {
        type: 'free',
        name: 'Free',
        price: '₦0',
        duration: '',
        description: 'Perfect for trying StudyHelp',
        features: [
            { text: '5 AI messages', included: true },
            { text: '3 flashcard sets', included: true },
            { text: 'Basic CBT practice', included: true },
            { text: 'Limited subjects', included: true },
        ],
        buttonText: 'Current Plan',
        highlight: false,
        color: 'gray'
    },
    {
        type: 'weekly',
        name: 'Weekly',
        price: '₦600',
        duration: 'week',
        description: 'Boost your exam prep for 7 days',
        features: [
            { text: '80 AI messages', included: true },
            { text: '40 flashcard sets', included: true },
            { text: 'Full CBT access', included: true },
            { text: 'Basic analytics', included: true },
            { text: 'Study plan', included: true },
        ],
        buttonText: 'Get Weekly',
        highlight: false,
        color: 'blue'
    },
    {
        type: 'monthly',
        name: 'Monthly',
        price: '₦2,300',
        duration: 'month',
        description: 'Best value for serious students',
        features: [
            { text: '250 AI messages', included: true },
            { text: '120 flashcard sets', included: true },
            { text: 'Full CBT + Exam Mode', included: true },
            { text: 'Advanced analytics', included: true },
            { text: 'Full study plan', included: true },
            { text: 'Priority features', included: true },
        ],
        buttonText: 'Get Monthly',
        highlight: true,
        color: 'emerald'
    },
    {
        type: 'addon',
        name: 'AI Add-On',
        price: '₦500',
        duration: '',
        description: 'Extra AI messages on any plan',
        features: [
            { text: '+100 AI messages', included: true },
            { text: 'Added to current plan', included: true },
            { text: 'Never expires', included: true },
        ],
        buttonText: 'Buy Add-On',
        highlight: false,
        color: 'purple'
    },
]

export default function PricingPage() {
    const { user } = useAuthStore()
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
    const [status, setStatus] = useState<any | null>(null)

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const data = await paymentApi.getStatus()
                if (data?.success) setStatus(data)
            } catch {
                // ignore
            }
        }
        loadStatus()
    }, [])

    const handleSubscribe = async (planType: string) => {
        if (planType === 'free') return

        try {
            setLoadingPlan(planType)
            const data = await paymentApi.initializePayment(planType)

            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl
            } else {
                toast.error('Failed to start payment. Please try again.')
            }
        } catch (err: any) {
            console.error('Payment error:', err)
            toast.error('Payment failed. Please try again.')
        } finally {
            setLoadingPlan(null)
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                            Simple, Transparent <span className="text-blue-600">Pricing</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Choose the right plan to accelerate your study journey.
                            Unlock more tests, subjects, and AI power.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.type}
                                className={`flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-xl border-2 transition-all duration-300 hover:scale-105 ${plan.highlight
                                    ? 'border-emerald-500 ring-4 ring-emerald-500/10 scale-105 z-10'
                                    : 'border-transparent hover:border-blue-500/50'
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 text-center rounded-t-lg">
                                        Most Popular
                                    </div>
                                )}

                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                        <div className={`p-2 rounded-lg bg-${plan.color}-100 dark:bg-${plan.color}-900/30 text-${plan.color}-600`}>
                                            {plan.type === 'premium' ? <FiStar className="text-xl" /> : plan.type === 'growth' ? <FiZap className="text-xl" /> : <FiAward className="text-xl" />}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                                        {plan.duration && (
                                            <span className="text-gray-500 ml-1">/ {plan.duration}</span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 min-h-[40px]">
                                        {plan.description}
                                    </p>

                                    <button
                                        onClick={() => plan.price !== '₦0' && handleSubscribe(plan.type)}
                                        disabled={plan.price === '₦0' || loadingPlan !== null}
                                        className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${plan.highlight
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                                            : plan.price === '₦0'
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                            } disabled:opacity-50`}
                                    >
                                        {loadingPlan === plan.type ? (
                                            <FiLoader className="animate-spin" />
                                        ) : plan.type === 'free' ? 'Current Plan' : plan.buttonText}
                                    </button>
                                </div>

                                <div className="p-8 border-t border-gray-100 dark:border-gray-800 flex-grow">
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                {feature.included ? (
                                                    <FiCheck className="text-green-500 mt-1 flex-shrink-0" />
                                                ) : (
                                                    <FiX className="text-red-300 dark:text-gray-600 mt-1 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm ${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}`}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 p-8 md:p-12 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Need a custom plan?</h2>
                            <p className="text-gray-600 dark:text-gray-400">For schools and tutorial centers with 50+ students.</p>
                        </div>
                        <button className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-all">
                            Contact Sales
                        </button>
                    </div>
                </div>

                {/* Usage display */}
                {status && (
                    <div className="max-w-4xl mx-auto mt-12">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Current Usage</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">🤖 AI Messages</span>
                                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all"
                                            style={{
                                                width: `${(status.usage.ai.used / Math.max(status.usage.ai.limit, 1)) * 100}%`,
                                                backgroundColor: status.usage.ai.used >= status.usage.ai.limit ? '#EF4444' : '#4F46E5'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                        {status.usage.ai.used}/{status.usage.ai.limit}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">📇 Flashcard Sets</span>
                                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 transition-all"
                                            style={{
                                                width: `${(status.usage.flashcards.used / Math.max(status.usage.flashcards.limit, 1)) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                        {status.usage.flashcards.used}/{status.usage.flashcards.limit}
                                    </span>
                                </div>
                            </div>
                            {status.subscription.daysLeft > 0 && (
                                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                    ⏰ Plan expires in {status.subscription.daysLeft} day(s)
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    )
}
