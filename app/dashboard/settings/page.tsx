'use client'

import { useState, useEffect, useRef } from 'react'
import {
    User, Mail, Bell, Moon, Sun, Trash2, LogOut, Camera, Check,
    ChevronRight, Shield, LifeBuoy, Settings, HelpCircle, Palette,
    Users, Copy, Award, Share2
} from 'lucide-react'
import { MdSchool, MdQuiz } from 'react-icons/md'
import {
    FiGrid, FiBookOpen, FiUser, FiBell, FiShield, FiHelpCircle,
    FiLayout, FiWifiOff, FiDownload, FiTrash2, FiRefreshCw,
    FiPhone, FiLogOut, FiChevronRight, FiArrowLeft
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { useAuthStore } from '@/lib/store/authStore'
import { useThemeStore } from '@/lib/store/themeStore'
import { firebaseSignOut } from '@/lib/firebase-auth'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { useHelpWidgets } from '@/hooks/useHelpWidgets'
import { toast } from 'react-hot-toast'
import { getOfflineStorageUsage, getOfflineItemsSummary, clearAllOfflineData } from '@/lib/utils/offlineDb'
import { SUPPORT_CALL_URL, SUPPORT_WHATSAPP_URL } from '@/components/dashboard/navConfig'
import './settings-v3.css'

type TabType = 'profile' | 'account' | 'notifications' | 'appearance' | 'help' | 'referrals' | 'offline'

interface SectionMeta {
    id: TabType
    label: string
    subtitle: string
    icon: React.ComponentType<{ className?: string; size?: number }>
}

const SETTINGS_SECTIONS: SectionMeta[] = [
    { id: 'profile', label: 'Profile', subtitle: 'Manage your name, school, and study profile', icon: FiUser },
    { id: 'account', label: 'Account', subtitle: 'Security, email address, password, and session', icon: FiShield },
    { id: 'notifications', label: 'Notifications', subtitle: 'Study reminders, email alerts, and schedules', icon: FiBell },
    { id: 'appearance', label: 'Appearance', subtitle: 'Dark mode and dashboard display theme', icon: Palette },
    { id: 'referrals', label: 'Referrals', subtitle: 'Invite classmates and earn free StudyHelp Pro access', icon: Users },
    { id: 'help', label: 'Help', subtitle: 'Reach the team, call, WhatsApp, or browse guides', icon: FiHelpCircle },
    { id: 'offline', label: 'Offline', subtitle: 'Manage cached courses, lessons, and storage', icon: FiWifiOff },
]

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('profile')
    const [mobileActiveTab, setMobileActiveTab] = useState<TabType | null>(null)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const { user, refreshUser } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const tab = params.get('tab') as TabType
            if (tab && ['profile', 'account', 'notifications', 'appearance', 'help', 'referrals', 'offline'].includes(tab)) {
                setActiveTab(tab)
                setMobileActiveTab(tab)
            }
        }
    }, [])

    const handleSaved = () => {
        refreshUser()
        toast.success('Settings updated successfully')
    }

    const currentSectionMeta = SETTINGS_SECTIONS.find(
        (s) => s.id === (mobileActiveTab || activeTab)
    )

    // Shared section content renderer to guarantee zero duplication
    const renderSectionContent = (tab: TabType) => {
        switch (tab) {
            case 'profile':
                return <ProfileSection user={user} onSaved={handleSaved} />
            case 'account':
                return (
                    <AccountSection
                        user={user}
                        onSaved={handleSaved}
                        onLogoutClick={() => setShowLogoutModal(true)}
                    />
                )
            case 'notifications':
                return <NotificationsSection user={user} onSaved={handleSaved} />
            case 'appearance':
                return <AppearanceSection onSaved={handleSaved} />
            case 'referrals':
                return <ReferralSection />
            case 'help':
                return <HelpSection onSaved={handleSaved} />
            case 'offline':
                return <OfflineSection />
            default:
                return null
        }
    }

    return (
        <ProtectedRoute>
            <div className="settings-v3-container">
                {/* ═════════════════════════════════════════════════════════
                    MOBILE SETTINGS VIEW (Visible on screens <= 1024px)
                    ═════════════════════════════════════════════════════════ */}
                <div className="settings-mobile-container">
                    {mobileActiveTab === null ? (
                        /* Mobile Settings List View (matches mockup screen 1) */
                        <div>
                            <div className="mb-4">
                                <BackButton label="Back" href="/dashboard/student" />
                            </div>

                            <header className="mb-6">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                                    Settings
                                </h1>
                                <p className="text-xs font-medium text-slate-400">
                                    Manage your account and app preferences
                                </p>
                            </header>

                            {/* 7 Section rows with Icon + Label + Chevron */}
                            <div className="settings-rows-group">
                                {SETTINGS_SECTIONS.map((section) => {
                                    const Icon = section.icon
                                    return (
                                        <button
                                            key={section.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveTab(section.id)
                                                setMobileActiveTab(section.id)
                                            }}
                                            className="settings-row-item"
                                        >
                                            <div className="settings-row-left">
                                                <span className="settings-row-icon">
                                                    <Icon size={18} />
                                                </span>
                                                <span className="settings-row-label">{section.label}</span>
                                            </div>
                                            <FiChevronRight className="settings-row-chevron" />
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Support group */}
                            <div className="mb-6">
                                <h3 className="settings-group-title">Support</h3>
                                <div className="settings-rows-group">
                                    <a href={SUPPORT_CALL_URL} className="settings-row-item">
                                        <div className="settings-row-left">
                                            <span className="settings-row-icon text-blue-500">
                                                <FiPhone size={18} />
                                            </span>
                                            <span className="settings-row-label">Call support</span>
                                        </div>
                                        <FiChevronRight className="settings-row-chevron" />
                                    </a>

                                    <a
                                        href={SUPPORT_WHATSAPP_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="settings-row-item"
                                    >
                                        <div className="settings-row-left">
                                            <span className="settings-row-icon text-green-500">
                                                <FaWhatsapp size={18} />
                                            </span>
                                            <span className="settings-row-label">WhatsApp support</span>
                                        </div>
                                        <FiChevronRight className="settings-row-chevron" />
                                    </a>
                                </div>
                            </div>

                            {/* Red Log Out button at bottom */}
                            <div className="pt-2 pb-4">
                                <button
                                    type="button"
                                    onClick={() => setShowLogoutModal(true)}
                                    className="settings-mobile-logout-btn"
                                >
                                    <FiLogOut size={18} />
                                    <span>Log out</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Mobile Section Detail View (matches mockup screen 2) */
                        <div>
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => setMobileActiveTab(null)}
                                    className="settings-mobile-back-btn"
                                >
                                    <FiArrowLeft size={16} />
                                    <span>Settings</span>
                                </button>
                            </div>

                            <header className="mb-6">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                                    {currentSectionMeta?.label || 'Settings'}
                                </h1>
                                <p className="text-xs font-medium text-slate-400">
                                    {currentSectionMeta?.subtitle}
                                </p>
                            </header>

                            <div>{renderSectionContent(mobileActiveTab)}</div>
                        </div>
                    )}
                </div>

                {/* ═════════════════════════════════════════════════════════
                    DESKTOP SETTINGS VIEW (Visible on screens > 1024px)
                    ═════════════════════════════════════════════════════════ */}
                <div className="settings-desktop-container">
                    <div className="mb-4">
                        <BackButton label="Back" href="/dashboard/student" />
                    </div>

                    <header className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight mb-1">
                            Settings
                        </h1>
                        <p className="text-sm font-medium text-slate-400">
                            Manage your account and app preferences
                        </p>
                    </header>

                    <nav className="settings-tabs no-scrollbar" aria-label="Settings tabs">
                        {SETTINGS_SECTIONS.map((section) => {
                            const Icon = section.icon
                            const active = activeTab === section.id
                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setActiveTab(section.id)}
                                    className={`settings-tab flex items-center gap-2 ${active ? 'active' : ''}`}
                                >
                                    <Icon size={16} /> {section.label}
                                </button>
                            )
                        })}
                    </nav>

                    <main className="max-w-4xl">
                        {renderSectionContent(activeTab)}
                    </main>
                </div>

                {/* ═════════════════════════════════════════════════════════
                    LOG OUT CONFIRMATION MODAL
                    ═════════════════════════════════════════════════════════ */}
                {showLogoutModal && (
                    <div
                        className="settings-modal-overlay"
                        onClick={() => setShowLogoutModal(false)}
                    >
                        <div
                            className="settings-modal-card"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 mx-auto">
                                <FiLogOut size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                                Log Out
                            </h3>
                            <p className="text-xs text-center text-slate-400 mb-6">
                                Are you sure you want to log out of your StudyHelp account?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setShowLogoutModal(false)
                                        await firebaseSignOut()
                                        router.push('/auth/login')
                                    }}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    )
}

// ─── Sections ────────────────────────────────────────────────────────────────

function ProfileSection({ user, onSaved }: any) {
    const [form, setForm] = useState({
        displayName: user?.name || '',
        phone: '',
        schoolName: user?.schoolName || '',
        classLevel: user?.classLevel || '',
        courseOfStudy: user?.courseOfStudy || '',
    })
    const [loading, setLoading] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiClient.get('/settings')
                const p = res.data?.profile || {}
                setForm({
                    displayName: p.name || user?.name || '',
                    phone: p.phone || '',
                    schoolName: p.schoolName || '',
                    classLevel: p.classLevel || '',
                    courseOfStudy: p.courseOfStudy || '',
                })
                setAvatarPreview(p.avatar || user?.avatar || null)
            } catch { }
        }
        load()
    }, [user?.uid])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => setAvatarPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await apiClient.put('/settings', { profile: { ...form, avatar: avatarPreview } })
            onSaved()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="settings-card">
            <div className="flex flex-col items-center mb-8">
                <div className="v3-avatar-wrapper">
                    {avatarPreview ? (
                        <img src={avatarPreview} className="v3-avatar-img" alt="Profile" />
                    ) : (
                        <div className="v3-avatar-placeholder">{form.displayName[0] || 'U'}</div>
                    )}
                    <div className="v3-avatar-edit" onClick={() => fileRef.current?.click()}>
                        <Camera size={16} />
                    </div>
                </div>
                <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                <h3 className="text-xl font-bold">{form.displayName || 'Student'}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="settings-group">
                    <label className="settings-label">Display Name</label>
                    <input
                        className="settings-input-v3"
                        value={form.displayName}
                        onChange={e => setForm({ ...form, displayName: e.target.value })}
                    />
                </div>
                <div className="settings-group">
                    <label className="settings-label">Phone Number</label>
                    <input
                        className="settings-input-v3"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. 08012345678"
                    />
                </div>
                <div className="settings-group">
                    <label className="settings-label">School Name</label>
                    <input
                        className="settings-input-v3"
                        value={form.schoolName}
                        onChange={e => setForm({ ...form, schoolName: e.target.value })}
                    />
                </div>
                <div className="settings-group">
                    <label className="settings-label">Class / Level</label>
                    <input
                        className="settings-input-v3"
                        value={form.classLevel}
                        onChange={e => setForm({ ...form, classLevel: e.target.value })}
                    />
                </div>
                <div className="settings-group md:col-span-2">
                    <label className="settings-label">Course of Study (Optional)</label>
                    <input
                        className="settings-input-v3"
                        value={form.courseOfStudy}
                        onChange={e => setForm({ ...form, courseOfStudy: e.target.value })}
                    />
                </div>
            </div>

            <div className="mt-8">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="v3-btn-primary w-full md:w-auto"
                >
                    {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
            </div>
        </div>
    )
}

function AccountSection({ user, onSaved, onLogoutClick }: any) {
    const isGoogle = user?.provider === 'google' || user?.providerData?.[0]?.providerId === 'google.com'
    const [loading, setLoading] = useState(false)

    const handlePasswordReset = async () => {
        if (!user?.email) return
        setLoading(true)
        try {
            const { auth } = await import('@/lib/firebase')
            const { sendPasswordResetEmail } = await import('firebase/auth')
            await sendPasswordResetEmail(auth, user.email)
            toast.success('Reset email sent!')
        } catch (err: any) {
            toast.error('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="settings-card">
            <h3 className="text-xl font-bold mb-6">Account & Security</h3>

            <div className="settings-group">
                <label className="settings-label">Email Address</label>
                <div className="settings-input-v3 bg-gray-50/50 dark:bg-white/5 opacity-80 flex items-center justify-between">
                    <span>{user?.email}</span>
                    <Check className="text-green-500 w-4 h-4" />
                </div>
            </div>

            <div className="settings-group">
                <label className="settings-label">Authentication Method</label>
                <div className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl">
                    {isGoogle ? (
                        <>
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                            </div>
                            <span className="font-bold">Google Account</span>
                        </>
                    ) : (
                        <>
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                                <Mail size={16} />
                            </div>
                            <span className="font-bold">Email & Password</span>
                        </>
                    )}
                </div>
            </div>

            {!isGoogle && (
                <div className="mt-8 p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <h4 className="font-bold mb-2">Password</h4>
                    <p className="text-sm text-gray-500 mb-4">Want to change your password? We'll send you a secure link.</p>
                    <button
                        onClick={handlePasswordReset}
                        disabled={loading}
                        className="v3-btn-outline"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>
            )}

            {/* Red Log Out button at the bottom of Account section with confirmation */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h4 className="font-bold text-red-600 dark:text-red-400 mb-1">Session Management</h4>
                <p className="text-sm text-gray-500 mb-4">Log out of your StudyHelp account on this device.</p>
                <button
                    type="button"
                    onClick={onLogoutClick}
                    className="settings-logout-btn"
                >
                    <FiLogOut size={16} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    )
}

function NotificationsSection({ user, onSaved }: any) {
    const [prefs, setPrefs] = useState<any>({
        studyReminders: false,
        emailStudyReminders: false,
        weeklyDigest: false,
        reminderTime: '18:00',
        timezone: 'Africa/Lagos',
    })
    const [loading, setLoading] = useState(false)
    const [pushEnabled, setPushEnabled] = useState(false)
    const [emailUnsubscribed, setEmailUnsubscribed] = useState(false)

    useEffect(() => {
        apiClient.get('/settings').then(res => {
            setEmailUnsubscribed(Boolean(res.data?.notificationStatus?.emailUnsubscribed))
            if (res.data?.notificationPrefs) {
                const detectedZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Africa/Lagos'
                setPrefs((current: any) => ({
                    ...current,
                    ...res.data.notificationPrefs,
                    timezone: res.data.timezoneDetected ? res.data.notificationPrefs.timezone : detectedZone,
                }))
            }
        })

        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription())
                    .then((subscription) => setPushEnabled(Boolean(subscription)))
                    .catch(() => setPushEnabled(false))
            } else {
                setPushEnabled(false)
            }
        }
    }, [])

    const toggle = (key: string) => {
        setPrefs((p: any) => ({ ...p, [key]: !p[key] }))
    }

    const save = async () => {
        setLoading(true)
        try {
            await apiClient.put('/settings', { notificationPrefs: prefs })
            onSaved()
        } finally {
            setLoading(false)
        }
    }

    const handleTestPush = async () => {
        if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
            toast.error('Notifications are not supported in this browser.');
            return;
        }

        try {
            // Step 1 — Check permission
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;
            }

            if (Notification.permission === 'denied') {
                alert('Notifications are blocked. Please enable them in your browser settings.');
                return;
            }

            setLoading(true);

            // Step 2 — Subscribe if not already subscribed
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidKey) {
                    toast.error('Configuration error: VAPID key missing.');
                    setLoading(false);
                    return;
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                });

                setPushEnabled(true);
                toast.success('Subscription saved!');
            }

            await apiClient.post('/notifications/subscribe', {
                subscription,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || prefs.timezone,
            });

            // Step 3 — Send test notification
            await apiClient.post('/notifications/test-push');
            toast.success('Test notification sent!');
        } catch (err: any) {
            console.error('Push Flow Error:', err);
            toast.error(err.response?.data?.error || 'Notification setup failed. Try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="settings-card">
            <h3 className="text-xl font-bold mb-6">Notification Preferences</h3>

            <div className="space-y-4 mb-8">
                <div className="v3-toggle p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">Study Reminders</p>
                        <p className="text-xs text-gray-500">Get push notifications for study sessions and goals</p>
                    </div>
                    <button
                        onClick={pushEnabled ? undefined : handleTestPush}
                        disabled={pushEnabled}
                        className={`w-11 h-6 rounded-full transition-colors relative ${pushEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                    <p className="font-bold text-sm mb-2">Test Your Setup</p>
                    <p className="text-xs text-gray-500 mb-4">Make sure you can receive notifications on this device.</p>
                    <button
                        onClick={handleTestPush}
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl font-bold transition-all active:scale-[0.98] ${pushEnabled ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        {loading ? 'Sending...' : pushEnabled ? 'Send Test Notification' : 'Enable Notifications First'}
                    </button>
                </div>
            </div>

            <h4 className="font-bold text-sm mb-4 text-gray-400 uppercase tracking-wider">Study routine</h4>
            <div className="space-y-4 mb-8">
                <div className="v3-toggle p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">Next-step reminder</p>
                        <p className="text-xs text-gray-500">At most once a week while you’re away, with a specific unfinished lesson. Enable push below or choose email backup.</p>
                    </div>
                    <button type="button" role="switch" aria-checked={Boolean(prefs.studyReminders)} onClick={() => toggle('studyReminders')} className={`w-11 h-6 rounded-full transition-colors relative ${prefs.studyReminders ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${prefs.studyReminders ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                <label className="block p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                    <span className="font-bold text-sm">Reminder time</span>
                    <span className="block text-xs text-gray-500 mt-1">Uses your local time ({prefs.timezone || 'Africa/Lagos'}).</span>
                    <input type="time" value={prefs.reminderTime || '18:00'} onChange={(event) => setPrefs((current: any) => ({ ...current, reminderTime: event.target.value }))} className="mt-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-sm" />
                </label>
                <div className="v3-toggle">
                    <div>
                        <p className="font-bold text-sm">Email reminder backup</p>
                        <p className="text-xs text-gray-500">Email the same next step only when push isn’t available.</p>
                    </div>
                    <button type="button" role="switch" aria-checked={Boolean(prefs.emailStudyReminders)} disabled={emailUnsubscribed} onClick={() => toggle('emailStudyReminders')} className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-40 ${prefs.emailStudyReminders ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${prefs.emailStudyReminders ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                <div className="v3-toggle">
                    <div>
                        <p className="font-bold text-sm">Weekly progress recap</p>
                        <p className="text-xs text-gray-500">A short email with completed lessons, active days, XP, and your next step.</p>
                    </div>
                    <button type="button" role="switch" aria-checked={Boolean(prefs.weeklyDigest)} disabled={emailUnsubscribed} onClick={() => toggle('weeklyDigest')} className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-40 ${prefs.weeklyDigest ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${prefs.weeklyDigest ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                {emailUnsubscribed && <p className="text-xs text-amber-600 dark:text-amber-400">Email notifications are unsubscribed for this account, so email reminders and recaps are disabled.</p>}
            </div>

            <button onClick={save} disabled={loading} className="v3-btn-primary mt-8 w-full md:w-auto">
                {loading ? 'Saving...' : 'Update Notification Settings'}
            </button>
        </div>
    )
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function AppearanceSection({ onSaved }: any) {
    const { theme, setTheme } = useThemeStore()

    return (
        <div className="settings-card">
            <h3 className="text-xl font-bold mb-6">Appearance</h3>

            <label className="settings-label">Color Theme</label>
            <div className="appearance-grid">
                <div
                    onClick={() => setTheme('light')}
                    className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                >
                    <Sun className={`mx-auto mb-2 ${theme === 'light' ? 'text-purple-500' : 'text-gray-400'}`} />
                    <p className="font-bold text-sm">Light</p>
                </div>
                <div
                    onClick={() => setTheme('dark')}
                    className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                >
                    <Moon className={`mx-auto mb-2 ${theme === 'dark' ? 'text-purple-500' : 'text-gray-400'}`} />
                    <p className="font-bold text-sm">Dark</p>
                </div>
            </div>
        </div>
    )
}

function HelpSection({ onSaved }: any) {
    const { tourButtonVisible, chatbotVisible, setTourHidden, setChatbotHidden } = useHelpWidgets()

    return (
        <div className="settings-card">
            <h3 className="text-xl font-bold mb-1">Help & Support</h3>
            <p className="text-sm text-slate-400 mb-6">Reach the team or browse answers.</p>

            {/* Direct Support Channels (Call & WhatsApp) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <a
                    href={SUPPORT_CALL_URL}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 hover:border-blue-500/50 transition-all flex items-center gap-3.5 no-underline group"
                >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <FiPhone size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                            Call support
                        </div>
                        <div className="text-xs text-slate-400">
                            +234 916 334 5794
                        </div>
                    </div>
                </a>

                <a
                    href={SUPPORT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 hover:border-green-500/50 transition-all flex items-center gap-3.5 no-underline group"
                >
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                        <FaWhatsapp size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-green-500 transition-colors">
                            WhatsApp support
                        </div>
                        <div className="text-xs text-slate-400">
                            Chat directly with our team
                        </div>
                    </div>
                </a>
            </div>

            <div className="space-y-4">
                <div className="v3-toggle">
                    <div>
                        <p className="font-bold text-sm">Show Page Tour</p>
                        <p className="text-xs text-gray-500">Interactive guide for new features</p>
                    </div>
                    <button
                        onClick={() => setTourHidden(tourButtonVisible)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${tourButtonVisible ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${tourButtonVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                <div className="v3-toggle">
                    <div>
                        <p className="font-bold text-sm">AI Help Chatbot</p>
                        <p className="text-xs text-gray-500">Floating assistant for instant support</p>
                    </div>
                    <button
                        onClick={() => setChatbotHidden(chatbotVisible)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${chatbotVisible ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${chatbotVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="mt-8 p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Have feedback or need answers?</h4>
                    <p className="text-xs text-slate-400">Our support desk is available to help every student succeed.</p>
                </div>
                <a
                    href={SUPPORT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v3-btn-primary px-6 py-2 text-sm whitespace-nowrap inline-flex items-center justify-center text-center no-underline"
                >
                    Contact Support
                </a>
            </div>
        </div>
    )
}

function ReferralSection() {
    const [stats, setStats] = useState<any>({
        referralCode: '',
        referralCount: 0,
        referralDaysEarned: 0,
        rewardedReferrals: 0
    })
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get('/referral/stats')
                if (res.data?.status === 'success') {
                    setStats(res.data.data)
                }
            } catch (err) {
                console.error('Failed to fetch referral stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const referralLink = `https://www.studyhelp.site/auth/signup?ref=${stats.referralCode || 'YOUR_CODE'}`

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink)
        setCopied(true)
        toast.success('Referral link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    const shareText = `I've been using StudyHelp to practice exam questions and it's actually helping 📚 Sign up free here: ${referralLink}`

    const handleShareWhatsApp = () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
        window.open(url, '_blank')
    }

    if (loading) {
        return (
            <div className="settings-card flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="settings-card">
            <h3 className="text-xl font-bold mb-6">Refer & Earn</h3>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                    <Award size={200} />
                </div>
                <h4 className="text-2xl font-black mb-2">Invite Friends, Get 1 Free Day!</h4>
                <p className="text-white text-sm max-w-md opacity-90">
                    Share your unique referral link with your classmates. For every friend who signs up using your link, you'll get <strong>1 day of free unlimited AI credits</strong> — no payment needed!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col items-center text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                        <Users size={24} />
                    </div>
                    <span className="text-2xl font-black">{stats.referralCount}</span>
                    <span className="text-xs text-gray-500 mt-1">Total Referrals</span>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col items-center text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                        <Award size={24} />
                    </div>
                    <span className="text-2xl font-black">{stats.referralDaysEarned ?? 0}</span>
                    <span className="text-xs text-gray-500 mt-1">Free Days Earned</span>
                </div>
            </div>

            <div className="settings-group">
                <label className="settings-label">Your Unique Referral Link</label>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="settings-input-v3 flex-grow bg-gray-50/50 dark:bg-white/5 opacity-90 overflow-x-auto whitespace-nowrap scrollbar-thin select-all font-mono py-3 px-4 rounded-xl flex items-center justify-between border border-gray-200 dark:border-white/10">
                        {referralLink}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="v3-btn-primary flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px]"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            </div>

            <div className="mt-8 border-t border-gray-100 dark:border-white/10 pt-6">
                <h4 className="font-bold text-sm mb-4">Quick Share</h4>
                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={handleShareWhatsApp}
                        className="flex-grow flex items-center justify-center gap-3 py-3 px-6 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl shadow-lg transition active:scale-[0.98]"
                    >
                        <Share2 size={18} />
                        Share on WhatsApp
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Offline Section ──────────────────────────────────────────────────────────

function OfflineSection() {
    const { user } = useAuthStore()
    const isPro = user?.plan?.type && user.plan.type !== 'free'

    const [storageUsage, setStorageUsage] = useState<{ bytes: number; formatted: string } | null>(null)
    const [summary, setSummary] = useState<{
        questionsCount: number
        flashcardsCount: number
        plannerTasksCount: number
        pendingSyncCount: number
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isClearing, setIsClearing] = useState(false)
    const [confirmClear, setConfirmClear] = useState(false)
    const [isOnline, setIsOnline] = useState(true)

    const loadMetrics = async () => {
        setIsLoading(true)
        try {
            const [usage, items] = await Promise.all([
                getOfflineStorageUsage(),
                getOfflineItemsSummary()
            ])
            setStorageUsage(usage)
            setSummary(items)
        } catch (err) {
            console.error('Failed to load offline metrics:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setIsOnline(navigator.onLine)
        const update = () => setIsOnline(navigator.onLine)
        window.addEventListener('online', update)
        window.addEventListener('offline', update)
        loadMetrics()
        return () => {
            window.removeEventListener('online', update)
            window.removeEventListener('offline', update)
        }
    }, [])

    const handleClearAll = async () => {
        if (!confirmClear) {
            setConfirmClear(true)
            return
        }
        setIsClearing(true)
        try {
            await clearAllOfflineData()
            setSummary({ questionsCount: 0, flashcardsCount: 0, plannerTasksCount: 0, pendingSyncCount: 0 })
            setStorageUsage({ bytes: 0, formatted: '0 B' })
            setConfirmClear(false)
            toast.success('All offline data cleared.')
            await loadMetrics()
        } catch (err) {
            toast.error('Failed to clear offline data.')
        } finally {
            setIsClearing(false)
        }
    }

    const storeItems = [
        {
            label: 'CBT Questions',
            count: summary?.questionsCount ?? 0,
            icon: '📝',
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        },
        {
            label: 'Flashcards',
            count: summary?.flashcardsCount ?? 0,
            icon: '🃏',
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
        },
        {
            label: 'Planner Tasks',
            count: summary?.plannerTasksCount ?? 0,
            icon: '📅',
            color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
        },
        {
            label: 'Pending Sync',
            count: summary?.pendingSyncCount ?? 0,
            icon: '🔄',
            color: summary?.pendingSyncCount
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                : 'text-gray-500 bg-gray-50 dark:bg-gray-800',
        },
    ]

    return (
        <div className="settings-section space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <FiWifiOff className="text-amber-500" /> Offline Mode
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        Manage your locally cached study data. Data is stored in your browser's IndexedDB and syncs automatically when you reconnect.
                    </p>
                </div>
                {/* Status pill */}
                <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${isOnline
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>

            {!isPro && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⭐</span>
                    <div>
                        <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Pro Feature</p>
                        <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                            Offline mode is a Pro-exclusive feature. Upgrade to study without internet access.
                        </p>
                    </div>
                </div>
            )}

            {/* Storage usage */}
            <div className="settings-card p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest">Storage Usage</h3>
                    <button
                        onClick={loadMetrics}
                        disabled={isLoading}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-gray-400 hover:text-blue-500"
                        title="Refresh metrics"
                    >
                        <FiRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-3 text-gray-400 py-4">
                        <FiRefreshCw size={16} className="animate-spin" />
                        <span className="text-sm">Loading storage data...</span>
                    </div>
                ) : (
                    <>
                        {/* Total */}
                        <div className="mb-6">
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-black text-gray-900 dark:text-white">{storageUsage?.formatted ?? '—'}</span>
                                <span className="text-sm text-gray-400 mb-1">used by this app</span>
                            </div>
                            {/* Simple visual bar */}
                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.min(((storageUsage?.bytes ?? 0) / (50 * 1024 * 1024)) * 100, 100)}%`
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">of ~50 MB estimated quota</p>
                        </div>

                        {/* Per-store grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {storeItems.map(item => (
                                <div key={item.label} className={`flex flex-col items-center text-center p-3 rounded-xl ${item.color}`}>
                                    <span className="text-2xl mb-1">{item.icon}</span>
                                    <span className="text-xl font-black">{item.count}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-75">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Pending sync note */}
            {(summary?.pendingSyncCount ?? 0) > 0 && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 flex items-start gap-3">
                    <FiRefreshCw className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">
                            {summary?.pendingSyncCount} item{summary!.pendingSyncCount !== 1 ? 's' : ''} waiting to sync
                        </p>
                        <p className="text-blue-700 dark:text-blue-400 text-xs mt-0.5">
                            These will automatically sync to the server the next time you go online.
                        </p>
                    </div>
                </div>
            )}

            {/* Danger zone */}
            <div className="settings-card p-6 rounded-2xl bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 shadow-sm">
                <h3 className="font-bold text-red-600 dark:text-red-400 text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FiTrash2 size={14} /> Danger Zone
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    This will permanently delete all locally cached questions, flashcards, planner data, and the pending sync queue from this device. Your online data is not affected.
                </p>
                <button
                    onClick={handleClearAll}
                    disabled={isClearing}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${confirmClear
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 animate-pulse'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800'
                        }`}
                >
                    {isClearing
                        ? <><FiRefreshCw className="animate-spin" /> Clearing...</>
                        : confirmClear
                            ? <><FiTrash2 /> Confirm — Clear Everything</>
                            : <><FiTrash2 /> Clear All Offline Data</>
                    }
                </button>
                {confirmClear && !isClearing && (
                    <button
                        onClick={() => setConfirmClear(false)}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}
