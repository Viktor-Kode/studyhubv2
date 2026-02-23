'use client'

import { useState } from 'react'
import { FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa'
import { FiLoader, FiCheckCircle } from 'react-icons/fi'
import { saveUserRole } from '@/lib/firebase-auth'
import type { AppRole, AppUser } from '@/lib/types/auth'

interface RoleSelectionModalProps {
    user: any // Firebase User
    onCompleted: (role: AppRole) => void
}

export default function RoleSelectionModal({ user, onCompleted }: RoleSelectionModalProps) {
    const [selectedRole, setSelectedRole] = useState<AppRole | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleConfirm = async () => {
        if (!selectedRole || !user) return

        setIsSubmitting(true)
        try {
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';

            // Save role to Firestore
            await saveUserRole(user.uid, selectedRole, displayName, user.email || undefined)

            onCompleted(selectedRole)
        } catch (error: any) {
            console.error('Error saving role:', error)
            alert(`Failed to save role: ${error.message || 'Unknown error'}. Please try again.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiCheckCircle className="text-3xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Almost there!</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Please select your role to personalize your experience.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setSelectedRole('student')}
                        className={`p-6 border-2 rounded-2xl transition-all flex flex-col items-center gap-3 group
                            ${selectedRole === 'student'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className={`p-4 rounded-xl transition-colors ${selectedRole === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                            <FaUserGraduate className="text-2xl" />
                        </div>
                        <span className={`font-bold ${selectedRole === 'student' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                            Student
                        </span>
                    </button>

                    <button
                        onClick={() => setSelectedRole('teacher')}
                        className={`p-6 border-2 rounded-2xl transition-all flex flex-col items-center gap-3 group
                            ${selectedRole === 'teacher'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className={`p-4 rounded-xl transition-colors ${selectedRole === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                            <FaChalkboardTeacher className="text-2xl" />
                        </div>
                        <span className={`font-bold ${selectedRole === 'teacher' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                            Teacher
                        </span>
                    </button>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!selectedRole || isSubmitting}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <FiLoader className="animate-spin" />
                            Saving Profile...
                        </>
                    ) : (
                        'Complete Setup'
                    )}
                </button>
            </div>
        </div>
    )
}
