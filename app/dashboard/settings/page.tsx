'use client'

import { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Bell, Moon, Sun, Trash2, LogOut, Camera, Check,
  ChevronRight, Shield, LifeBuoy, Settings, HelpCircle, Palette
} from 'lucide-react'
import { MdSchool, MdQuiz } from 'react-icons/md'
import { FiGrid, FiBookOpen, FiUser, FiBell, FiShield, FiHelpCircle, FiLayout } from 'react-icons/fi'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { useThemeStore } from '@/lib/store/themeStore'
import { firebaseSignOut } from '@/lib/firebase-auth'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { useHelpWidgets } from '@/hooks/useHelpWidgets'
import { toast } from 'react-hot-toast'
import './settings-v3.css'

type TabType = 'profile' | 'account' | 'notifications' | 'appearance' | 'help'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const { user, refreshUser } = useAuthStore()
  
  const handleSaved = () => {
    refreshUser()
    toast.success('Settings updated successfully')
  }

  return (
    <ProtectedRoute>
      <div className="settings-v3-container">
        <header className="mb-8">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your account and app preferences</p>
        </header>

        <nav className="settings-tabs no-scrollbar">
            <button 
                onClick={() => setActiveTab('profile')}
                className={`settings-tab flex items-center gap-2 ${activeTab === 'profile' ? 'active' : ''}`}
            >
                <FiUser /> Profile
            </button>
            <button 
                onClick={() => setActiveTab('account')}
                className={`settings-tab flex items-center gap-2 ${activeTab === 'account' ? 'active' : ''}`}
            >
                <FiShield /> Account
            </button>
            <button 
                onClick={() => setActiveTab('notifications')}
                className={`settings-tab flex items-center gap-2 ${activeTab === 'notifications' ? 'active' : ''}`}
            >
                <FiBell /> Notifications
            </button>
            <button 
                onClick={() => setActiveTab('appearance')}
                className={`settings-tab flex items-center gap-2 ${activeTab === 'appearance' ? 'active' : ''}`}
            >
                <Palette className="w-4 h-4" /> Appearance
            </button>
            <button 
                onClick={() => setActiveTab('help')}
                className={`settings-tab flex items-center gap-2 ${activeTab === 'help' ? 'active' : ''}`}
            >
                <FiHelpCircle /> Help
            </button>
        </nav>

        <main className="max-w-4xl">
            {activeTab === 'profile' && <ProfileSection user={user} onSaved={handleSaved} />}
            {activeTab === 'account' && <AccountSection user={user} onSaved={handleSaved} />}
            {activeTab === 'notifications' && <NotificationsSection user={user} onSaved={handleSaved} />}
            {activeTab === 'appearance' && <AppearanceSection onSaved={handleSaved} />}
            {activeTab === 'help' && <HelpSection onSaved={handleSaved} />}
        </main>
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
      } catch {}
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
                    onChange={e => setForm({...form, displayName: e.target.value})}
                />
            </div>
            <div className="settings-group">
                <label className="settings-label">Phone Number</label>
                <input 
                    className="settings-input-v3" 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="e.g. 08012345678"
                />
            </div>
            <div className="settings-group">
                <label className="settings-label">School Name</label>
                <input 
                    className="settings-input-v3" 
                    value={form.schoolName} 
                    onChange={e => setForm({...form, schoolName: e.target.value})}
                />
            </div>
            <div className="settings-group">
                <label className="settings-label">Class / Level</label>
                <input 
                    className="settings-input-v3" 
                    value={form.classLevel} 
                    onChange={e => setForm({...form, classLevel: e.target.value})}
                />
            </div>
            <div className="settings-group md:col-span-2">
                <label className="settings-label">Course of Study (Optional)</label>
                <input 
                    className="settings-input-v3" 
                    value={form.courseOfStudy} 
                    onChange={e => setForm({...form, courseOfStudy: e.target.value})}
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

function AccountSection({ user, onSaved }: any) {
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
        </div>
    )
}

function NotificationsSection({ user, onSaved }: any) {
    const [prefs, setPrefs] = useState<any>({
        streakReminder: true,
        cbtResults: true,
        goalReminder: true,
        planExpiry: true,
    })
    const [loading, setLoading] = useState(false)
    const [pushEnabled, setPushEnabled] = useState(false)

    useEffect(() => {
        apiClient.get('/settings').then(res => {
            if (res.data?.notificationPrefs) setPrefs(res.data.notificationPrefs)
        })
        
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPushEnabled(Notification.permission === 'granted')
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

    const requestPushPermission = async () => {
        try {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
                const registration = await navigator.serviceWorker.ready
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                
                if (!vapidKey) {
                    toast.error('Notification configuration missing')
                    return
                }

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                })

                await apiClient.post('/notifications/subscribe', subscription)
                setPushEnabled(true)
                toast.success('Notifications enabled!')
            } else {
                toast.error('Permission denied')
            }
        } catch (err) {
            console.error('Push error:', err)
            toast.error('Failed to enable notifications')
        }
    }

    const handleTestPush = async () => {
        if (!pushEnabled) {
            await requestPushPermission()
            return
        }
        setLoading(true)
        try {
            await apiClient.post('/notifications/test-push')
            toast.success('Test notification sent!')
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to send test notification')
        } finally {
            setLoading(false)
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
                        onClick={pushEnabled ? undefined : requestPushPermission}
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

            <h4 className="font-bold text-sm mb-4 text-gray-400 uppercase tracking-wider">Other Alerts</h4>
            <div className="space-y-4">
                {[
                    { key: 'streakReminder', label: 'Daily Streak Reminder', desc: 'Stay on track with daily alerts' },
                    { key: 'cbtResults', label: 'Quiz Results', desc: 'Get your scores via notification' },
                    { key: 'goalReminder', label: 'Goal Reminders', desc: 'Updates on your study targets' },
                    { key: 'planExpiry', label: 'Plan Expiry', desc: 'Alerts before your sub runs out' },
                ].map(item => (
                    <div key={item.key} className="v3-toggle">
                        <div>
                            <p className="font-bold text-sm">{item.label}</p>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <button 
                            onClick={() => toggle(item.key)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${prefs[item.key] ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${prefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
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
            <h3 className="text-xl font-bold mb-6">Help & Support</h3>
            
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

            <div className="mt-8 p-6 bg-blue-500/5 rounded-2xl flex items-center justify-between">
                <div>
                    <h4 className="font-bold">Need more help?</h4>
                    <p className="text-xs text-gray-500">Our support team is available 24/7</p>
                </div>
                <button className="v3-btn-primary px-6 py-2 text-sm">Contact Us</button>
            </div>
        </div>
    )
}
