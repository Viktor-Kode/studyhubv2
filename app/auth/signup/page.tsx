'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { signInWithGoogle, signUpWithEmail, buildAppUser, saveUserRole } from '@/lib/firebase-auth'
import {
    FiMail, FiLock, FiUser, FiEye, FiEyeOff,
    FiAlertCircle, FiCheckCircle, FiLoader
} from 'react-icons/fi'
import { FaGoogle, FaUserGraduate } from 'react-icons/fa'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

const NIGERIAN_UNIVERSITIES = [
    'University of Ibadan (UI)',
    'University of Lagos (UNILAG)',
    'Obafemi Awolowo University (OAU)',
    'University of Benin (UNIBEN)',
    'Ahmadu Bello University (ABU)',
    'Federal University of Technology, Akure (FUTA)',
    'Lagos State University (LASU)',
    'National Open University of Nigeria (NOUN)',
    'University of Nigeria, Nsukka (UNN)',
    'University of Ilorin (UNILORIN)',
    'Federal University of Technology, Minna (FUTMINNA)',
    'Covenant University',
    'Babcock University',
    'Bayero University Kano (BUK)',
    'Nnamdi Azikiwe University (UNIZIK)',
    'University of Port Harcourt (UNIPORT)',
    'Federal University of Agriculture, Abeokuta (FUNAAB)',
    'Ladoke Akintola University of Technology (LAUTECH)',
    'Rivers State University (RSU)',
    'Delta State University (DELSU)'
]

export default function SignupPage() {
    const router = useRouter()
    const { setUser, refreshUser } = useAuthStore()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const ref = params.get('ref')
            if (ref) {
                localStorage.setItem('refCode', ref)
                console.log('[Referral] Stored refCode in localStorage on signup page:', ref)
            }
        }
    }, [])

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        institution: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (formData.institution.trim() === '') {
            setSuggestions(NIGERIAN_UNIVERSITIES)
        } else {
            const filtered = NIGERIAN_UNIVERSITIES.filter((uni) =>
                uni.toLowerCase().includes(formData.institution.toLowerCase())
            )
            setSuggestions(filtered)
        }
    }, [formData.institution])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setError('')
    }

    const validateForm = () => {
        if (!formData.name || !formData.email || !formData.password) {
            setError('All fields are required')
            return false
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const user = await signUpWithEmail(
                formData.email,
                formData.password,
                formData.name,
                'student',
                formData.institution
            )
            setUser(user)

            // Process referral if stored in localStorage
            if (typeof window !== 'undefined') {
                const refCode = localStorage.getItem('refCode')
                if (refCode) {
                    try {
                        const { apiClient } = await import('@/lib/api/client')
                        await apiClient.post('/referral/apply', { refCode })
                        localStorage.removeItem('refCode')
                        console.log('[Referral] Applied referral code successfully and cleared from localStorage')
                    } catch (refErr) {
                        console.error('[Referral] Failed to apply referral code:', refErr)
                    }
                }
            }

            await refreshUser()
            setSuccess('Account created successfully!')
            setTimeout(() => router.push('/dashboard/student'), 1200)
        } catch (err: any) {
            const code = err?.code
            const msg =
                code === 'auth/email-already-in-use'
                    ? 'An account with this email already exists'
                    : code === 'auth/weak-password'
                        ? 'Password should be at least 6 characters'
                        : err?.message || 'Failed to create account'
            setError(msg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        setError('')
        try {
            const { appUser, firebaseUser } = await signInWithGoogle()

            const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (!profileSnap.exists()) {
                // Auto-register as student in Firestore
                await saveUserRole(firebaseUser.uid, 'student', firebaseUser.displayName || 'User', firebaseUser.email || '')
                const appUser = buildAppUser(firebaseUser, 'student')
                setUser(appUser)

                // Process referral for Google sign up
                if (typeof window !== 'undefined') {
                    const refCode = localStorage.getItem('refCode')
                    if (refCode) {
                        try {
                            const { apiClient } = await import('@/lib/api/client')
                            await apiClient.post('/referral/apply', { refCode })
                            localStorage.removeItem('refCode')
                            console.log('[Referral] Applied referral code for new Google user successfully')
                        } catch (refErr) {
                            console.error('[Referral] Failed to apply referral code for new Google user:', refErr)
                        }
                    }
                }

                await refreshUser()
                router.push('/dashboard/student')
                return
            }

            if (appUser && appUser.role) {
                setUser(appUser)

                // Process referral for Google sign up if they are new and have a refCode
                if (typeof window !== 'undefined') {
                    const refCode = localStorage.getItem('refCode')
                    if (refCode) {
                        try {
                            const { apiClient } = await import('@/lib/api/client')
                            await apiClient.post('/referral/apply', { refCode })
                            localStorage.removeItem('refCode')
                            console.log('[Referral] Applied referral code for Google Sign-In successfully')
                        } catch (refErr) {
                            console.error('[Referral] Failed to apply referral code for Google Sign-In:', refErr)
                        }
                    }
                }

                await refreshUser()
                if (appUser.role === 'admin') {
                    router.push('/dashboard/admin')
                } else {
                    router.push('/dashboard/student')
                }
            }
        } catch (err: any) {
            if (err?.code !== 'auth/popup-closed-by-user') {
                setError(err?.message || 'Google sign-in failed')
            }
        } finally {
            setGoogleLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-md w-full">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        StudyHelp
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create your account to get started
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">

                    {/* Google Button */}
                    <div className="mb-6">
                        <button
                            id="google-signup-btn"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading || isLoading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4
                         border-2 border-gray-300 dark:border-gray-600 rounded-xl
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium
                         text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {googleLoading
                                ? <FiLoader className="animate-spin text-xl" />
                                : <FaGoogle className="text-xl text-red-500" />
                            }
                            Continue with Google
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                Or continue with email
                            </span>
                        </div>
                    </div>

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

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">


                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300" />
                                <input
                                    id="signup-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* School/Institution (Nigerian Uni Autocomplete) */}
                        <div className="relative" ref={suggestionsRef}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                What's your school or university? <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <FaUserGraduate className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300" />
                                <input
                                    id="signup-institution"
                                    type="text"
                                    name="institution"
                                    value={formData.institution}
                                    onChange={(e) => {
                                        setFormData({ ...formData, institution: e.target.value })
                                        setShowSuggestions(true)
                                        setError('')
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="e.g. University of Lagos"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoComplete="off"
                                />
                            </div>

                            {/* Autocomplete Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg focus:outline-none">
                                    {suggestions.map((uni, idx) => (
                                        <li
                                            key={idx}
                                            onClick={() => {
                                                setFormData({ ...formData, institution: uni })
                                                setShowSuggestions(false)
                                            }}
                                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                        >
                                            {uni}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300" />
                                <input
                                    id="signup-email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300" />
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300" />
                                <input
                                    id="signup-confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600
                             rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="signup-submit-btn"
                            type="submit"
                            disabled={isLoading || googleLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl
                         transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <FiLoader className="animate-spin" />
                                    Creating Account…
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link
                            href="/auth/login"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Terms */}
                <p className="mt-6 text-center text-xs text-gray-600 dark:text-gray-300">
                    By signing up, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    )
}
