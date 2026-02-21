'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState } from 'react'
import { FiSettings, FiUser, FiBell, FiLock, FiMoon, FiGlobe, FiCheckCircle, FiAlertCircle, FiLoader, FiLogOut, FiTrash2 } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/authStore'
import { useThemeStore } from '@/lib/store/themeStore'
import { authService } from '@/lib/auth/authService'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const { user, logout } = useAuthStore()
    const { theme, setTheme } = useThemeStore()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('profile')
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    // Security form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (passwordForm.newPassword.length < 6) {
            setError('New password must be at least 6 characters')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setIsLoading(true)
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
            // Get token from cookie (not localStorage)
            const match = typeof document !== 'undefined'
                ? document.cookie.match(/(^| )auth-token=([^;]+)/)
                : null
            const token = match ? decodeURIComponent(match[2]) : ''

            const response = await fetch(`${API_URL}/users/update-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            })

            const result = await response.json()
            if (!response.ok) {
                throw new Error(result.message || 'Failed to update password')
            }

            setSuccess('Password updated successfully!')
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err: any) {
            setError(err.message || 'Failed to update password')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await authService.logout()
        } catch { }
        logout()
        router.push('/auth/login')
    }

    return (
        <ProtectedRoute>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <FiSettings className="text-gray-400" />
                        Settings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Manage your account preferences and application settings
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2">
                        {[
                            { id: 'profile', label: 'Profile Settings', icon: FiUser },
                            { id: 'notifications', label: 'Notifications', icon: FiBell },
                            { id: 'security', label: 'Security', icon: FiLock },
                            { id: 'preferences', label: 'App Preferences', icon: FiMoon },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setError(''); setSuccess('') }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${activeTab === item.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <item.icon className="text-lg" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8">
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h2>

                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {user?.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                        <span className="inline-block mt-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium capitalize">
                                            {user?.role || 'student'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Display Name</label>
                                        <input
                                            type="text"
                                            defaultValue={user?.name || ''}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                                        <input
                                            type="email"
                                            defaultValue={user?.email || ''}
                                            disabled
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-400">Email cannot be changed</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <button className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold uppercase tracking-wide text-xs hover:opacity-90 transition">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
                                <div className="space-y-4">
                                    {['Study Reminders', 'New Quiz Available', 'Weekly Progress Report', 'Achievement Unlocked'].map((item) => (
                                        <div key={item} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{item}</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security Settings</h2>

                                {/* Status Messages */}
                                {error && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                                        <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                                        <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                                    </div>
                                )}

                                {/* Change Password */}
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Change Password</h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 dark:text-white"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 dark:text-white"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 dark:text-white"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoading ? <FiLoader className="animate-spin" /> : <FiLock />}
                                        Update Password
                                    </button>
                                </form>

                                {/* Divider */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Account Actions</h3>

                                    <div className="space-y-3">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-300 font-medium"
                                        >
                                            <FiLogOut />
                                            Sign Out
                                        </button>

                                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition text-red-700 dark:text-red-300 font-medium">
                                            <FiTrash2 />
                                            Delete Account
                                        </button>
                                    </div>
                                </div>

                                {/* Auth Provider Info */}
                                {user?.oauthProvider && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            <strong>Note:</strong> Your account is linked via {user.oauthProvider}. Password changes only apply to email/password logins.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">App Preferences</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <FiMoon className="text-gray-500" />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                                        </div>
                                        <select
                                            value={theme}
                                            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                                            className="bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 cursor-pointer"
                                        >
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <FiGlobe className="text-gray-500" />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Language</span>
                                        </div>
                                        <select className="bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 cursor-pointer">
                                            <option>English (US)</option>
                                            <option>French</option>
                                            <option>Spanish</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
