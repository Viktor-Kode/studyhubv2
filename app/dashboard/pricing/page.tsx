 'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { paymentApi } from '@/lib/api/paymentApi'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FiCheck, FiX, FiLoader, FiZap, FiAward } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { PLANS } from '@/lib/config/plans'

const DASHBOARD_PLANS = [
    { type: 'free', description: 'Perfect for trying StudyHelp', buttonText: 'Current Plan', highlight: false, color: 'gray' },
    { type: 'weekly', description: 'Boost your exam prep for 7 days', buttonText: 'Get Weekly', highlight: false, color: 'blue' },
    { type: 'monthly', description: 'Best value for serious students', buttonText: 'Get Monthly', highlight: true, color: 'emerald' },
    { type: 'addon', description: 'Extra AI messages on any plan', buttonText: 'Buy Add-On', highlight: false, color: 'purple' },
]

export default function PricingPage() {
    const { user } = useAuthStore()
    const searchParams = useSearchParams()
    const isTeacherFlow = searchParams?.get('from') === 'teacher'
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
                            {isTeacherFlow ? (
                              <>Teacher <span className="text-gray-900 dark:text-white">Plans</span></>
                            ) : (
                              <>Simple, Transparent <span className="text-gray-900 dark:text-white">Pricing</span></>
                            )}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            {isTeacherFlow
                              ? 'Choose the right plan to unlock StudyHelp Teacher Tools for lesson notes, result sheets, schemes of work and more.'
                              : 'Choose the right plan to accelerate your study journey. Unlock more tests, subjects, and AI power.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {DASHBOARD_PLANS.map((meta) => {
                          const plan = PLANS[meta.type as keyof typeof PLANS]
                          if (!plan || !('features' in plan)) return null

                          // For teacher flow, we keep the same backend plan keys/prices
                          // but change the copy to focus on teacher tools instead of student CBT usage.
                          let planName = plan.name
                          let description = meta.description
                          let features: { text: string; included: boolean }[] =
                            plan.features.map((text) => ({ text, included: true }))

                          if (isTeacherFlow) {
                            if (meta.type === 'free') {
                              planName = 'Teacher Free Trial'
                              description = 'Test all teacher tools with limited free uses.'
                              features = [
                                { text: 'Access all teacher tools', included: true },
                                { text: '3 free runs per tool (Lesson Note, Scheme of Work, Result Compiler, etc.)', included: true },
                                { text: 'Export lesson notes, schemes and reports as PDF/Word', included: true },
                                { text: 'Perfect to try StudyHelp in your classroom', included: true },
                              ]
                            } else if (meta.type === 'weekly') {
                              planName = 'Teacher Basic (Weekly)'
                              description = 'Short-term access to core teacher tools.'
                              features = [
                                { text: 'Unlimited Lesson Note Generator & Scheme of Work', included: true },
                                { text: 'Access to Result Compiler & Report Comments', included: true },
                                { text: 'Unlock saving & exporting for all generated content', included: true },
                                { text: 'Priority over free users for AI generation speed', included: true },
                              ]
                            } else if (meta.type === 'monthly') {
                              planName = 'Teacher Premium (Monthly)'
                              description = 'Best for schools and serious teachers.'
                              features = [
                                { text: 'Unlimited access to ALL Teacher Tools', included: true },
                                { text: 'Unlimited saves & downloads for lesson notes and reports', included: true },
                                { text: 'Best value for full-term planning and assessments', included: true },
                                { text: 'Priority support for teachers and school admins', included: true },
                              ]
                            } else if (meta.type === 'addon') {
                              // Hide AI add-on in dedicated teacher flow – it is student-focused.
                              return null
                            }
                          }

                          const price = plan.price === 0 ? '₦0' : `₦${plan.price.toLocaleString()}`
                          const duration = meta.type === 'weekly' ? 'week' : meta.type === 'monthly' ? 'month' : ''
                          return (
                            <div
                                key={meta.type}
                                className={`flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-xl border-2 transition-all duration-300 hover:scale-105 ${meta.highlight
                                    ? 'border-gray-300 ring-4 ring-gray-300/30 scale-105 z-10'
                                    : 'border-transparent hover:border-gray-300/70'
                                    }`}
                            >
                                {meta.highlight && (
                                    <div className="bg-gray-900 text-white text-xs font-bold uppercase tracking-widest py-1.5 text-center rounded-t-lg">
                                        Most Popular
                                    </div>
                                )}

                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{planName}</h3>
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                                            {meta.type === 'addon' ? <FiZap className="text-xl" /> : <FiAward className="text-xl" />}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-4xl font-black text-gray-900 dark:text-white">{price}</span>
                                        {duration && (
                                            <span className="text-gray-500 ml-1">/ {duration}</span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 min-h-[40px]">
                                        {description}
                                    </p>

                                    <button
                                        onClick={() => price !== '₦0' && handleSubscribe(meta.type)}
                                        disabled={price === '₦0' || loadingPlan !== null}
                                        className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${meta.highlight
                                            ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-black/10'
                                            : price === '₦0'
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                                : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-black/10'
                                            } disabled:opacity-50`}
                                    >
                                        {loadingPlan === meta.type ? (
                                            <FiLoader className="animate-spin" />
                                        ) : meta.type === 'free' ? 'Current Plan' : meta.buttonText}
                                    </button>
                                </div>

                                <div className="p-8 border-t border-gray-100 dark:border-gray-800 flex-grow">
                                    <ul className="space-y-4">
                                        {features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                {feature.included ? (
                                                    <FiCheck className="text-gray-900 dark:text-white mt-1 flex-shrink-0" />
                                                ) : (
                                                    <FiX className="text-gray-500 dark:text-gray-300 mt-1 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm ${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}`}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )})}
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
                                                backgroundColor: status.usage.ai.used >= status.usage.ai.limit ? '#D97706' : '#0F172A'
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
                                            className="h-full bg-gray-900 dark:bg-white transition-all"
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
