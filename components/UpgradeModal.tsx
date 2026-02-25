'use client'

import { FiArrowRight, FiZap, FiCheck, FiX } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

interface UpgradeModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    message?: string
}

export default function UpgradeModal({
    isOpen,
    onClose,
    title = "Upgrade Required",
    message = "You've reached the limit for your current plan. Upgrade to unlock more features!"
}: UpgradeModalProps) {
    const router = useRouter()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FiZap className="text-2xl" />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition text-gray-400 hover:text-gray-600"
                        >
                            <FiX />
                        </button>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                        {title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="space-y-3 mb-8">
                        {[
                            "Unlock all subjects",
                            "Get more AI explanations",
                            "Unlimited practice tests",
                            "Advanced study analytics"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                    <FiCheck className="text-xs" />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/dashboard/pricing')}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 group"
                        >
                            View Pricing Plans
                            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
