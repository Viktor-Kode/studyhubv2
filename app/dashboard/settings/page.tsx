'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  User, Mail, Bell, Moon, Sun, Trash2, LogOut, Camera, Check,
  ChevronRight, Shield, LifeBuoy,
} from 'lucide-react'
import { MdSchool, MdQuiz } from 'react-icons/md'
import { FiGrid, FiBookOpen } from 'react-icons/fi'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { useAuthStore } from '@/lib/store/authStore'
import { useThemeStore } from '@/lib/store/themeStore'
import { firebaseSignOut } from '@/lib/firebase-auth'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { useHelpWidgets } from '@/hooks/useHelpWidgets'

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection({
  user,
  onSaved,
}: {
  user: { uid: string; email?: string; name?: string; avatar?: string } | null
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    schoolName: '',
    classLevel: '',
    courseOfStudy: '',
  })
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSettings()
  }, [user?.uid])

  const loadSettings = async () => {
    if (!user?.uid) return
    try {
      const res = await apiClient.get('/settings')
      const p = res.data?.profile || {}
      setForm({
        displayName: p.name ?? user.name ?? '',
        phone: p.phone ?? '',
        schoolName: p.schoolName ?? '',
        classLevel: p.classLevel ?? '',
        courseOfStudy: p.courseOfStudy ?? '',
      })
      setAvatarPreview(p.avatar ?? user.avatar ?? null)
    } catch {
      setForm({
        displayName: user.name ?? '',
        phone: '',
        schoolName: '',
        classLevel: '',
        courseOfStudy: '',
      })
      setAvatarPreview(user.avatar ?? null)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB')
      return
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      const MAX = 200
      let width = img.naturalWidth
      let height = img.naturalHeight
      if (width > height) {
        if (width > MAX) {
          height *= MAX / width
          width = MAX
        }
      } else {
        if (height > MAX) {
          width *= MAX / height
          height = MAX
        }
      }
      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', 0.7)
      setAvatarPreview(compressed)
    }
    img.src = URL.createObjectURL(file)
  }

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      alert('Display name cannot be empty')
      return
    }
    setLoading(true)
    try {
      await apiClient.put('/settings', {
        profile: {
          name: form.displayName,
          phone: form.phone,
          schoolName: form.schoolName.trim(),
          classLevel: form.classLevel.trim(),
          courseOfStudy: form.courseOfStudy.trim(),
          avatar: avatarPreview,
        },
      })
      useAuthStore.getState().setUser({
        ...user!,
        name: form.displayName,
        avatar: avatarPreview ?? undefined,
        schoolName: form.schoolName.trim() || undefined,
        classLevel: form.classLevel.trim() || undefined,
        courseOfStudy: form.courseOfStudy.trim() || undefined,
      })
      onSaved()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-section animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">Profile Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your public information</p>
      </div>

      <div className="avatar-section">
        <div className="avatar-wrapper group">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="avatar-img transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="avatar-placeholder animate-gradient">
              {form.displayName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          )}
          <button
            type="button"
            className="avatar-edit-btn hover:scale-110 active:scale-95 transition-all"
            onClick={() => fileRef.current?.click()}
            title="Change Avatar"
          >
            <Camera size={18} />
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <div className="avatar-info">
          <div className="flex flex-col gap-1">
            <h4 className="avatar-name text-gray-900 dark:text-white">{form.displayName || 'Student'}</h4>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              <p className="avatar-email mb-0 text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="avatar-badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1.5 border border-green-200/50 dark:border-green-800/50">
              <Check size={12} className="stroke-[3]" />
              Verified Account
            </div>
          </div>
        </div>
      </div>

      <div className="settings-form mt-4">
        <div className="form-group">
          <label className="flex items-center gap-2">
            <User size={14} className="text-primary-500" />
            Display Name
          </label>
          <input
            className="settings-input focus:ring-2 focus:ring-primary-500/20"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label className="flex items-center gap-2">
            <LifeBuoy size={14} className="text-primary-500" />
            Phone Number
          </label>
          <input
            className="settings-input focus:ring-2 focus:ring-primary-500/20"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 08012345678"
            type="tel"
          />
          <span className="field-hint text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Used for WhatsApp notifications
          </span>
        </div>

        <div className="form-group">
          <label className="flex items-center gap-2">
            <MdSchool size={14} className="text-primary-500" />
            School name
          </label>
          <input
            className="settings-input focus:ring-2 focus:ring-primary-500/20"
            value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            placeholder="e.g. University of Lagos"
          />
          <span className="field-hint text-xs">Shown on your dashboard profile</span>
        </div>

        <div className="form-group">
          <label className="flex items-center gap-2">
            <FiGrid size={14} className="text-primary-500" />
            Class / level
          </label>
          <input
            className="settings-input focus:ring-2 focus:ring-primary-500/20"
            value={form.classLevel}
            onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
            placeholder="e.g. 100 Level, SS3, Year 12"
          />
          <span className="field-hint text-xs">Your current academic level</span>
        </div>

        <div className="form-group full-width">
          <label className="flex items-center gap-2">
            <FiBookOpen size={14} className="text-primary-500" />
            Course / program <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            className="settings-input focus:ring-2 focus:ring-primary-500/20"
            value={form.courseOfStudy}
            onChange={(e) => setForm({ ...form, courseOfStudy: e.target.value })}
            placeholder="e.g. Medicine, Computer Science, Law"
          />
          <span className="field-hint text-xs">Only applicable for university students</span>
        </div>

        <div className="form-actions border-t border-gray-100 dark:border-gray-800 pt-6 mt-2">
          <button
            type="button"
            className="save-btn bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 px-8"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner border-2 border-white/30 border-t-white w-4 h-4 rounded-full animate-spin"></span>
                Saving Changes...
              </>
            ) : (
              <>
                <Check size={18} />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Account Section ───────────────────────────────────────────────────────────

function AccountSection({
  user,
  onSaved,
}: {
  user: {
    email?: string
    provider?: string
    plan?: { type: string }
    providerData?: Array<{ providerId?: string }>
  } | null
  onSaved: () => void
}) {
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const isGoogleUser = user?.provider === 'google'
  const planType = user?.plan?.type || 'free'
  const isActive = planType !== 'free'

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setLoading(true)
    setResetSent(false)
    try {
      const { auth } = await import('@/lib/firebase')
      const { sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(auth, user.email)
      setResetSent(true)
    } catch (err: any) {
      alert('Failed to send reset email: ' + (err?.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const isGoogle = isGoogleUser || (user as any)?.providerData?.[0]?.providerId === 'google.com'

  return (
    <div className="settings-section animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">Account & Security</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account access and plan</p>
      </div>

      <div className="settings-form">
        <div className="form-group full-width">
          <label className="flex items-center gap-2">
            <Mail size={14} className="text-primary-500" />
            Email Address
          </label>
          <div className="readonly-field bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Mail size={18} />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">{user?.email}</span>
            </div>
            <span className="verified-badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200/50 dark:border-green-800/50">Verified</span>
          </div>
          <span className="field-hint text-xs mt-1">Email cannot be changed for security reasons</span>
        </div>

        <div className="form-group full-width">
          <label className="flex items-center gap-2">
            <Shield size={14} className="text-primary-500" />
            Subscription & Plan
          </label>
          <div className="subscription-status-card bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/20 dark:to-indigo-950/20 border-primary-100 dark:border-primary-900/50 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="sub-icon-wrap bg-white dark:bg-gray-800 shadow-sm border border-primary-100 dark:border-primary-900/50">
                <Shield className="sub-icon text-primary-500" />
              </div>
              <div className="sub-details">
                <span className="sub-label text-primary-600 dark:text-primary-400 uppercase tracking-wider text-[10px] font-bold">Current Plan</span>
                <span className={`sub-value block text-xl font-black ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {isActive ? `${planType.toUpperCase()} PLAN` : 'FREE TIER'}
                </span>
              </div>
            </div>
            <Link href="/dashboard/pricing" className="upgrade-link-btn bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 transition-all">
              {isActive ? 'Manage Subscription' : 'Upgrade to Pro'}
            </Link>
          </div>
        </div>

        {!isGoogle && (
          <div className="form-group full-width">
            <label className="flex items-center gap-2">
              <Shield size={14} className="text-primary-500" />
              Password & Security
            </label>
            <div className="password-reset-box bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="reset-title font-bold text-gray-900 dark:text-white mb-1">Reset Password</p>
                <p className="reset-desc text-sm text-gray-500 dark:text-gray-400">
                  A password reset link will be sent to your email address.
                </p>
              </div>
              {resetSent ? (
                <div className="reset-sent flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-100 dark:border-green-900/30">
                  <Check size={18} /> <span>Email sent!</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="reset-btn bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:text-primary-500 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-all font-bold px-6 py-2.5 rounded-xl text-sm"
                  onClick={handlePasswordReset}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="form-group full-width">
          <label className="flex items-center gap-2">
            <LogOut size={14} className="text-primary-500" />
            Sign-in Method
          </label>
          <div className="signin-method flex items-center gap-3">
            {isGoogle ? (
              <div className="provider-badge google bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-bold text-gray-700 dark:text-gray-200">Google Account</span>
              </div>
            ) : (
              <div className="provider-badge email bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
                <Mail size={18} className="text-primary-500" />
                <span className="font-bold text-gray-700 dark:text-gray-200">Email & Password</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Notifications Section ─────────────────────────────────────────────────────

const NOTIFICATION_ITEMS = [
  { key: 'streakReminder' as const, label: 'Daily Streak Reminder', desc: 'Get reminded if you have not studied today' },
  { key: 'cbtResults' as const, label: 'Past Question Result Notifications', desc: 'Receive your score after every practice' },
  { key: 'goalReminder' as const, label: 'Goal Reminders', desc: 'Get reminded about your study goals' },
  { key: 'planExpiry' as const, label: 'Plan Expiry Warnings', desc: 'Be notified before your plan expires' },
  { key: 'weeklyReport' as const, label: 'Weekly Progress Report', desc: 'Receive a summary of your weekly activity' },
]

const DEFAULT_PREFS = {
  streakReminder: true,
  cbtResults: true,
  goalReminder: true,
  planExpiry: true,
  weeklyReport: false,
}

function NotificationsSection({
  user,
  onSaved,
}: {
  user: { phoneNumber?: string; phone?: string; notificationsEnabled?: boolean } | null
  onSaved: () => void
}) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [loading, setLoading] = useState(false)
  const [profilePhone, setProfilePhone] = useState('')
  const [pushEnabled, setPushEnabled] = useState(!!user?.notificationsEnabled)
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
    loadPrefs()
  }, [])

  useEffect(() => {
    if (typeof user?.notificationsEnabled === 'boolean') {
      setPushEnabled(user.notificationsEnabled)
    }
  }, [user?.notificationsEnabled])

  const loadPrefs = async () => {
    try {
      const res = await apiClient.get('/settings')
      const np = res.data?.notificationPrefs
      if (np) setPrefs((p) => ({ ...p, ...np }))
      const phone = res.data?.profile?.phone
      if (phone) setProfilePhone(phone)
      const ne = res.data?.profile?.notificationsEnabled
      if (typeof ne === 'boolean') setPushEnabled(ne)
    } catch {}
  }

  const handlePushToggle = async () => {
    setPushLoading(true)
    try {
      if (!pushEnabled) {
        const { enablePushNotifications } = await import('@/lib/services/pushNotifications')
        const result = await enablePushNotifications()
        if (result.success) {
          setPushEnabled(true)
          await useAuthStore.getState().refreshUser()
          onSaved()
          alert('Notifications enabled. You can get updates even when the app is closed.')
        } else if (result.reason === 'Permission denied') {
          alert('Please allow notifications in your browser settings and try again.')
        } else {
          alert(result.reason || 'Could not enable push notifications.')
        }
      } else {
        const { disablePushNotifications } = await import('@/lib/services/pushNotifications')
        await disablePushNotifications()
        setPushEnabled(false)
        await useAuthStore.getState().refreshUser()
        onSaved()
      }
    } finally {
      setPushLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await apiClient.put('/settings', { notificationPrefs: prefs })
      onSaved()
    } catch {
      alert('Failed to save notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const hasPhone = !!(
    profilePhone ||
    (user as any)?.phoneNumber ||
    (user as any)?.phone
  )

  return (
    <div className="settings-section animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">Notifications</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Control how you receive updates</p>
      </div>

      <div className="settings-push-row bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Bell size={18} className="text-primary-500" />
            Push Notifications
          </h4>
          <p className="settings-push-desc text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Get instant alerts for study reminders, Past Question results, and more even when the app is closed.
          </p>
        </div>
        <button
          type="button"
          className={`settings-notif-btn px-6 py-2.5 rounded-xl font-bold transition-all ${
            pushEnabled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600'
          }`}
          onClick={() => void handlePushToggle()}
          disabled={pushLoading}
        >
          {pushLoading ? (
             <div className="flex items-center gap-2">
               <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
               Processing...
             </div>
          ) : pushEnabled ? '🔔 Enabled' : '🔕 Enable Now'}
        </button>
      </div>

      {!hasPhone && (
        <div className="warning-banner bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <LifeBuoy size={16} />
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Add a phone number in <strong>Profile</strong> to receive WhatsApp notifications.
          </p>
        </div>
      )}

      <div className="toggle-list divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.key} className="toggle-row p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
            <div className="toggle-info pr-4">
              <span className="toggle-label block font-bold text-gray-800 dark:text-gray-200">{item.label}</span>
              <span className="toggle-desc text-sm text-gray-500 dark:text-gray-400">{item.desc}</span>
            </div>
            <button
              type="button"
              className={`toggle-switch relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                prefs[item.key] ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onClick={() =>
                setPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
              }
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions border-t border-gray-100 dark:border-gray-800 pt-6">
        <button
          type="button"
          className="save-btn bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 transition-all font-bold px-8 py-3 rounded-xl"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Update Preferences'}
        </button>
      </div>
    </div>
  )
}

// ─── Help & Support (floating widgets) ───────────────────────────────────────

function HelpSupportSection({ onSaved }: { onSaved: () => void }) {
  const {
    tourButtonVisible,
    chatbotVisible,
    setTourHidden,
    setChatbotHidden,
  } = useHelpWidgets()

  const toggleTour = () => {
    void setTourHidden(tourButtonVisible)
    onSaved()
  }

  const toggleChat = () => {
    void setChatbotHidden(chatbotVisible)
    onSaved()
  }

  return (
    <div className="settings-section animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">Help & Support</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Quick access to assistance</p>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl mb-2 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
          <LifeBuoy size={20} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-1">
          Enable these floating widgets if you need a guide through the features or have questions while studying.
        </p>
      </div>

      <div className="toggle-list border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        <div className="toggle-row p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
          <div className="toggle-info">
            <span className="toggle-label block font-bold text-gray-800 dark:text-gray-200">Show page tour</span>
            <span className="toggle-desc text-sm text-gray-500 dark:text-gray-400">Floating button to start an interactive tour of the app</span>
          </div>
          <button
            type="button"
            className={`toggle-switch relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              tourButtonVisible ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onClick={toggleTour}
            aria-pressed={tourButtonVisible}
          >
             <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  tourButtonVisible ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
          </button>
        </div>
        <div className="toggle-row p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
          <div className="toggle-info">
            <span className="toggle-label block font-bold text-gray-800 dark:text-gray-200">Help Chatbot</span>
            <span className="toggle-desc text-sm text-gray-500 dark:text-gray-400">Floating AI assistant to answer your questions</span>
          </div>
          <button
            type="button"
            className={`toggle-switch relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              chatbotVisible ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onClick={toggleChat}
            aria-pressed={chatbotVisible}
          >
             <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  chatbotVisible ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Appearance Section ────────────────────────────────────────────────────────

function AppearanceSection({ onSaved }: { onSaved: () => void }) {
  const { theme, setTheme } = useThemeStore()
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return 'medium'
    return localStorage.getItem('fontSize') || 'medium'
  })

  const applyTheme = (t: 'light' | 'dark') => {
    setTheme(t)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', t)
    }
    onSaved()
  }

  const applyFontSize = (size: string) => {
    setFontSize(size)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fontSize', size)
      const sizes: Record<string, string> = {
        small: '14px',
        medium: '16px',
        large: '18px',
      }
      document.documentElement.style.fontSize = sizes[size] || sizes.medium
    }
    onSaved()
  }

  useEffect(() => {
    const size = localStorage.getItem('fontSize') || 'medium'
    const sizes: Record<string, string> = {
      small: '14px',
      medium: '16px',
      large: '18px',
    }
    document.documentElement.style.fontSize = sizes[size] || sizes.medium
  }, [])

  return (
    <div className="settings-section animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">Appearance</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Personalize your interface</p>
      </div>

      <div className="form-group mb-4">
        <label className="flex items-center gap-2 mb-3">
          <Sun size={14} className="text-primary-500" />
          Color Theme
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              theme === 'light' 
                ? 'bg-white border-primary-500 text-primary-600 shadow-xl shadow-primary-500/10' 
                : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => applyTheme('light')}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 dark:bg-gray-800'}`}>
              <Sun size={24} />
            </div>
            <span className="font-bold">Light Mode</span>
          </button>
          <button
            type="button"
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              theme === 'dark' 
                ? 'bg-gray-800 border-primary-400 text-white shadow-xl shadow-primary-400/10' 
                : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => applyTheme('dark')}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-primary-900 text-primary-300' : 'bg-gray-200 dark:bg-gray-800'}`}>
              <Moon size={24} />
            </div>
            <span className="font-bold">Dark Mode</span>
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="flex items-center gap-2 mb-3">
          <MdQuiz size={14} className="text-primary-500" />
          Text Size
        </label>
        <div className="flex p-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              type="button"
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                fontSize === size 
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              onClick={() => applyFontSize(size)}
            >
              <span
                style={{
                  fontSize:
                    size === 'small' ? '12px' : size === 'medium' ? '15px' : '18px',
                }}
              >
                A
              </span>
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Danger Section ────────────────────────────────────────────────────────────

function DangerSection() {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'DELETE') {
      alert('Type DELETE to confirm')
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.delete('/users/me')
      if (res.data?.success !== false) {
        await firebaseSignOut().catch(() => {})
        useAuthStore.getState().logout()
        router.push('/auth/login')
      } else {
        alert(res.data?.message || 'Failed to delete account')
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Account deletion may not be supported. Contact support.'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClearData = async () => {
    const ok = window.confirm(
      'This will clear all your study history, streaks, CBT results and flashcard progress. This cannot be undone. Continue?'
    )
    if (!ok) return
    try {
      await apiClient.post('/users/clear-data')
      alert('All study data cleared.')
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          'Clear data may not be supported. Your data may be stored locally.'
      )
    }
  }

  return (
    <div className="settings-section animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title text-red-600 dark:text-red-400">Danger Zone</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Irreversible account actions</p>
      </div>

      <div className="space-y-4">
        <div className="danger-item bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="danger-info">
            <span className="danger-label block font-bold text-gray-900 dark:text-white mb-1">Clear Study Data</span>
            <span className="danger-desc text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Removes all streaks, CBT history, flashcard progress and study sessions.
              Your account and library stay active.
            </span>
          </div>
          <button
            type="button"
            className="danger-btn secondary bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-2.5 rounded-xl font-bold transition-all"
            onClick={handleClearData}
          >
            Clear All Data
          </button>
        </div>

        <div className="danger-item bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 p-6 rounded-2xl">
          <div className="danger-info mb-6">
            <span className="danger-label block font-bold text-gray-900 dark:text-white mb-1 text-lg">Delete Account</span>
            <span className="danger-desc text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Permanently deletes your account and all associated data. This action is **final** and cannot be reversed.
            </span>
          </div>
          
          <div className="delete-confirm-section bg-white dark:bg-gray-900/50 border border-red-200 dark:border-red-900/30 rounded-xl p-5">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Please type <strong className="text-red-600 dark:text-red-400 tracking-widest px-2 py-0.5 bg-red-50 dark:bg-red-900/30 rounded mx-1">DELETE</strong> to confirm:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="settings-input danger-input flex-1 border-red-200 dark:border-red-900/50 focus:border-red-500 focus:ring-red-500/10"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder="Type DELETE here"
              />
              <button
                type="button"
                className="danger-btn primary bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all font-bold px-8 py-2.5 rounded-xl disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                onClick={handleDeleteAccount}
                disabled={confirmDelete !== 'DELETE' || loading}
              >
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Settings Page ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account & Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'help', label: 'Help & Support', icon: LifeBuoy },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
]

export default function SettingsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('profile')
  const [saved, setSaved] = useState(false)

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleLogout = async () => {
    try {
      await firebaseSignOut()
    } catch {}
    useAuthStore.getState().logout()
    router.push('/auth/login')
  }

  return (
    <ProtectedRoute>
      <div className="settings-page">
        <BackButton label="Dashboard" href="/dashboard" />

        <div className="settings-header">
          <h2>Settings</h2>
          {saved && (
            <div className="saved-toast">
              <Check size={14} /> Saved successfully
            </div>
          )}
        </div>

        <div className="settings-layout mt-4">
          {/* Mobile Navigation - Horizontal Scrollable Tabs */}
          <nav className="settings-mobile-tabs md:hidden">
            <div className="tabs-container">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`mobile-tab-item ${activeSection === s.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <s.icon size={18} />
                  <span>{s.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="settings-desktop-wrap">
            <aside className="settings-sidebar hidden md:flex">
              <div className="sidebar-nav-group w-full">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`settings-nav-item w-full ${activeSection === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(s.id)}
                  >
                    <div className="nav-item-content">
                      <s.icon size={20} className={`nav-icon transition-colors ${activeSection === s.id ? 'text-primary-500' : 'text-gray-400'}`} />
                      <span className="font-semibold">{s.label}</span>
                    </div>
                    {activeSection === s.id && <div className="active-indicator bg-primary-500 shadow-[0_0_8px_rgba(91,76,245,0.4)]" />}
                    <ChevronRight size={16} className={`nav-arrow transition-all ${activeSection === s.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                  </button>
                ))}
              </div>

              <div className="sidebar-footer border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                <button
                  type="button"
                  className="settings-nav-item logout-btn group w-full"
                  onClick={handleLogout}
                >
                  <div className="nav-item-content">
                    <LogOut size={20} className="nav-icon transition-transform group-hover:-translate-x-1" />
                    <span className="font-bold">Log Out</span>
                  </div>
                </button>
              </div>
            </aside>

            <div className="settings-content min-h-[600px]">
              {activeSection === 'profile' && (
                <ProfileSection user={user} onSaved={() => { showSaved(); useAuthStore.getState().refreshUser() }} />
              )}
              {activeSection === 'account' && (
                <AccountSection user={user} onSaved={showSaved} />
              )}
              {activeSection === 'notifications' && (
                <NotificationsSection user={user} onSaved={showSaved} />
              )}
              {activeSection === 'help' && <HelpSupportSection onSaved={showSaved} />}
              {activeSection === 'appearance' && (
                <AppearanceSection onSaved={showSaved} />
              )}
              {activeSection === 'danger' && <DangerSection />}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
