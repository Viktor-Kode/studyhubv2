'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import WhatsAppNumberInput from '@/components/WhatsAppNumberInput'
import { FaWhatsapp } from 'react-icons/fa'
import { FiX, FiLoader } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

export default function WhatsAppCollectModal() {
    const { user, refreshUser, isBackendSynced } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [phone, setPhone] = useState('')
    const [isValid, setIsValid] = useState(false)
    const [loading, setLoading] = useState(false)

    // Guard: only open the modal once per mount. Re-running on every user
    // change caused the modal to flicker or reopen after refreshUser() calls.
    const hasCheckedRef = useRef(false)

    useEffect(() => {
        // Wait until the user object is loaded and synced with MongoDB backend
        if (!user || !isBackendSynced) return

        // Only run the check once — subsequent user updates (e.g. refreshUser()
        // called by dashboard layout) must NOT reopen the modal.
        if (hasCheckedRef.current) return
        hasCheckedRef.current = true

        const hasNoPhone = !user.phone && !user.phoneNumber
        const isDismissed = localStorage.getItem('dismissed_whatsapp_prompt') === 'true'

        if (hasNoPhone && !isDismissed) {
            setIsOpen(true)
        }
    }, [user, isBackendSynced])

    const handleSkip = () => {
        localStorage.setItem('dismissed_whatsapp_prompt', 'true')
        setIsOpen(false)
        toast('We\'ll remind you later! You can also update this anytime in Settings.', {
            icon: '📲',
            duration: 4000
        })
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid || !phone) {
            toast.error('Please enter a valid WhatsApp number')
            return
        }

        setLoading(true)
        try {
            // Update profile phone (which updates both phone and phoneNumber on backend)
            await apiClient.patch('/users/update-me', { phone })

            // Mark as dismissed so it never reopens this session even if phone
            // hasn't propagated to the store yet
            localStorage.setItem('dismissed_whatsapp_prompt', 'true')

            // Refresh local auth state
            await refreshUser()

            toast.success('WhatsApp number saved! You\'re all set for reminders 🚀')
            setIsOpen(false)
        } catch (err: any) {
            console.error('[WhatsAppCollect] Failed to save number:', err)
            toast.error(err.response?.data?.message || err.message || 'Failed to save number. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
            <div
                className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8 relative border border-gray-100 dark:border-gray-700/60 max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in fade-in zoom-in duration-300"
                role="dialog"
                aria-modal="true"
            >
                {/* Close Button / Dismiss */}
                <button
                    type="button"
                    onClick={handleSkip}
                    disabled={loading}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    aria-label="Close modal"
                >
                    <FiX size={20} />
                </button>

                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

                {/* Content */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mb-4">
                        <FaWhatsapp className="w-10 h-10 text-green-500 animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                        Get Study Reminders 📲
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 px-2">
                        Never miss a streak or study goal! Get automated reminders, exam prep updates, and learning tips directly on WhatsApp.
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <WhatsAppNumberInput
                        value={phone}
                        onChange={setPhone}
                        onValidChange={setIsValid}
                        className="text-left"
                    />

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 mt-8">
                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className={`w-full py-3.5 px-6 font-bold text-white rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2
                                ${loading
                                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                    : !isValid
                                        ? 'bg-green-500/60 dark:bg-green-600/60 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600 active:scale-[0.98] shadow-green-500/20 hover:shadow-green-500/30'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="animate-spin text-lg" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Enable WhatsApp Reminders</span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={loading}
                            className="w-full py-2.5 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                        >
                            Maybe later
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
