'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { paymentApi } from '@/lib/api/paymentApi'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FiCheck, FiX, FiLoader, FiZap, FiAward, FiStar, FiZapOff } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const PLANS = [
    {
        type: 'free',
        name: 'Free',
        price: '₦0',
        description: 'Perfect for getting started',
        features: [
            { text: '1 CBT Practice Test', included: true },
            { text: '5 AI Explanations', included: true },
            { text: 'English Language only', included: true },
            { text: 'Community Support', included: true },
            { text: 'Limited Analytics', included: true },
            { text: 'Multi-device Syncing', included: false },
        ],
        buttonText: 'Current Plan',
        highlight: false,
        color: 'gray'
    },
    {
        type: 'starter',
        name: 'Starter',
        price: '₦500',
        description: 'Boost your exam prep',
        features: [
            { text: '5 CBT Practice Tests', included: true },
            { text: '10 AI Explanations', included: true },
            { text: '1 Subject of your choice', included: true },
            { text: 'Ad-free Experience', included: true },
            { text: 'Detailed Analytics', included: true },
            { text: 'Priority Support', included: false },
        ],
        buttonText: 'Upgrade Now',
        highlight: false,
        color: 'blue'
    },
    {
        type: 'growth',
        name: 'Growth',
        price: '₦1,500',
        description: 'The most popular choice',
        features: [
            { text: '20 CBT Practice Tests', included: true },
            { text: '50 AI Explanations', included: true },
            { text: 'All Subjects included', included: true },
            { text: 'Advanced Analytics', included: true },
            { text: 'Study Reminders', included: true },
            { text: 'Priority Email Support', included: true },
        ],
        buttonText: 'Buy Growth',
        highlight: true,
        color: 'emerald'
    },
    {
        type: 'premium',
        name: 'Premium',
        price: '₦3,000',
        description: 'For serious high-achievers',
        features: [
            { text: '60 CBT Practice Tests', included: true },
            { text: '200 AI Explanations', included: true },
            { text: 'All Subjects + Early Access', included: true },
            { text: 'Full Performance Reports', included: true },
            { text: 'Personal Study Planner', included: true },
            { text: '24/7 Premium Support', included: true },
        ],
        buttonText: 'Get Premium',
        highlight: false,
        color: 'purple'
    }
]

export default function PricingPage() {
    const { user } = useAuthStore()
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

    const handleSubscribe = async (planType: string) => {
        if (user?.plan?.type === planType) {
            toast.error("You are already on this plan")
            return
        }

        try {
            setLoadingPlan(planType)
            // Step 1: Initialize payment on backend
            const data = await paymentApi.initializePayment(planType)

            // Step 2: Open Paystack popup
            const handler = (window as any).PaystackPop.setup({
                key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxxxxxxxxxxxxxxx",
                email: user?.email,
                amount: data.amount,
                ref: data.reference,
                currency: 'NGN',
                metadata: { planType, userId: (user as any)?._id || (user as any)?.uid },
                onSuccess: async (transaction: any) => {
                    // Step 3: Verify payment on backend
                    try {
                        const verify = await paymentApi.verifyPayment(transaction.reference)
                        if (verify.success) {
                            toast.success('🎉 Plan upgraded successfully!')
                            window.location.reload()
                        }
                    } catch (err) {
                        console.error('Verification error:', err)
                        toast.error('Payment verification failed.')
                    }
                },
                onCancel: () => {
                    console.log('Payment cancelled')
                    toast.error('Payment cancelled')
                }
            })

            handler.openIframe()

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
                                        <span className="text-gray-500 ml-1">/ month</span>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 min-h-[40px]">
                                        {plan.description}
                                    </p>

                                    <button
                                        onClick={() => plan.price !== '₦0' && handleSubscribe(plan.type)}
                                        disabled={plan.price === '₦0' || (user?.plan?.type === plan.type) || loadingPlan !== null}
                                        className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${user?.plan?.type === plan.type
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : plan.highlight
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                            } disabled:opacity-50`}
                                    >
                                        {loadingPlan === plan.type ? (
                                            <FiLoader className="animate-spin" />
                                        ) : user?.plan?.type === plan.type ? (
                                            <>Current Plan</>
                                        ) : (
                                            plan.buttonText
                                        )}
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

                    <div className="mt-24 p-12 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Need a custom plan?</h2>
                            <p className="text-gray-600 dark:text-gray-400">For schools and tutorial centers with 50+ students.</p>
                        </div>
                        <button className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-all">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
