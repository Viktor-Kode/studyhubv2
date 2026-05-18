'use client'

import { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Bell, Moon, Sun, Trash2, LogOut, Camera, Check,
  ChevronRight, Shield, LifeBuoy, Settings, HelpCircle, Palette,
  Users, Copy, Award, Share2
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

type TabType = 'profile' | 'account' | 'notifications' | 'appearance' | 'help' | 'referrals'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const { user, refreshUser } = useAuthStore()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab') as TabType
      if (tab && ['profile', 'account', 'notifications', 'appearance', 'help', 'referrals'].includes(tab)) {
        setActiveTab(tab)
      }
    }
  }, [])
  
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
                onClick={() => setActiveTab('referrals')}
                className={`settings-tab flex items-center gap-2 ${activeTab === 'referrals' ? 'active' : ''}`}
            >
                <Users className="w-4 h-4" /> Referrals
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
            {activeTab === 'referrals' && <ReferralSection />}
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

                // Save to backend
                await apiClient.post('/notifications/subscribe', subscription);
                setPushEnabled(true);
                toast.success('Subscription saved!');
            }

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

function ReferralSection() {
    const [stats, setStats] = useState<any>({
        referralCode: '',
        referralCount: 0,
        aiCredits: 0,
        creditsEarned: 0
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
                <h4 className="text-2xl font-black mb-2">Invite Friends, Earn Credits!</h4>
                <p className="text-blue-100 text-sm max-w-md">
                    Share your unique referral link with your classmates. You'll get +20 AI credits for every friend who signs up using your link!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    <span className="text-2xl font-black">+{stats.creditsEarned}</span>
                    <span className="text-xs text-gray-500 mt-1">Credits Earned</span>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col items-center text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-3">
                        <Settings size={24} />
                    </div>
                    <span className="text-2xl font-black">{stats.aiCredits}</span>
                    <span className="text-xs text-gray-500 mt-1">Total AI Credits</span>
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
