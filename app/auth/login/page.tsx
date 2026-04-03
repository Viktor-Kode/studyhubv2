'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { signInWithGoogle, loginWithEmail, buildAppUser } from '@/lib/firebase-auth'
import {
    FiMail, FiLock, FiEye, FiEyeOff,
    FiAlertCircle, FiLoader
} from 'react-icons/fi'
import { FaGoogle } from 'react-icons/fa'
import RoleSelectionModal from '@/components/RoleSelectionModal'
import type { AppRole } from '@/lib/types/auth'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function LoginPage() {
    const router = useRouter()
    const { setUser, refreshUser } = useAuthStore()

    const [formData, setFormData] = useState({ email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [pendingFirebaseUser, setPendingFirebaseUser] = useState<any>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.email || !formData.password) {
            setError('Please enter email and password')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const user = await loginWithEmail(formData.email, formData.password)
            setUser(user)
            await refreshUser()
            if (user.role === 'admin') {
                router.push('/dashboard/admin')
            } else {
                router.push('/dashboard/student')
            }
        } catch (err: any) {
            const msg = err?.code === 'auth/invalid-credential'
                ? 'Invalid email or password'
                : err?.message || 'Failed to login'
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
                setPendingFirebaseUser(firebaseUser)
                setShowRoleModal(true)
                return
            }

            if (appUser && appUser.role) {
                setUser(appUser)
                await refreshUser()
                if (appUser.role === 'admin') {
                    router.push('/dashboard/admin')
                } else {
                    router.push('/dashboard/student')
                }
            } else {
                setPendingFirebaseUser(firebaseUser)
                setShowRoleModal(true)
            }
        } catch (err: any) {
            if (err?.code !== 'auth/popup-closed-by-user') {
                setError(err?.message || 'Google sign-in failed')
            }
        } finally {
            setGoogleLoading(false)
        }
    }

    const handleRoleCompleted = async (role: AppRole) => {
        if (!pendingFirebaseUser) return
        const appUser = buildAppUser(pendingFirebaseUser, role)
        setUser(appUser)
        setShowRoleModal(false)
        await refreshUser()
        if (appUser.role === 'admin') {
            router.push('/dashboard/admin')
        } else {
            router.push('/dashboard/student')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            {showRoleModal && pendingFirebaseUser && (
                <RoleSelectionModal
                    user={pendingFirebaseUser}
                    onCompleted={handleRoleCompleted}
                />
            )}
            <div className="max-w-md w-full">

                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        StudyHelp
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Welcome back! Sign in to your account
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">

                    {/* Google Button */}
                    <div className="mb-6">
                        <button
                            id="google-signin-btn"
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

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                            <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300" />
                                <input
                                    id="login-email"
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
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300" />
                                <input
                                    id="login-password"
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

                        {/* Submit */}
                        <button
                            id="login-submit-btn"
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
                                    Signing in…
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Signup Link */}
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/auth/signup"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
