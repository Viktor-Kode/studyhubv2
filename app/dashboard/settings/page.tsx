'use client'

import { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Bell, Moon, Sun, Trash2, LogOut, Camera, Check,
  ChevronRight, Shield, LifeBuoy,
} from 'lucide-react'
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
      })
      setAvatarPreview(p.avatar ?? user.avatar ?? null)
    } catch {
      setForm({
        displayName: user.name ?? '',
        phone: '',
        schoolName: '',
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
          avatar: avatarPreview,
        },
      })
      useAuthStore.getState().setUser({
        ...user!,
        name: form.displayName,
        avatar: avatarPreview ?? undefined,
        schoolName: form.schoolName.trim() || undefined,
      })
      onSaved()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-section">
      <h3 className="section-title">Profile</h3>

      <div className="avatar-section">
        <div className="avatar-wrapper">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              {form.displayName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          )}
          <button
            type="button"
            className="avatar-edit-btn"
            onClick={() => fileRef.current?.click()}
          >
            <Camera size={14} />
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <div>
          <p className="avatar-name">{form.displayName || 'Student'}</p>
          <p className="avatar-email">{user?.email}</p>
        </div>
      </div>

      <div className="settings-form">
        <div className="form-group">
          <label>Display Name</label>
          <input
            className="settings-input"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            className="settings-input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 08012345678"
            type="tel"
          />
          <span className="field-hint">Used for WhatsApp notifications</span>
        </div>

        <div className="form-group">
          <label>School name</label>
          <input
            className="settings-input"
            value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            placeholder="e.g. Lagos State Senior Secondary School"
          />
          <span className="field-hint">Shown on your dashboard profile</span>
        </div>

        <button
          type="button"
          className="save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
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
    <div className="settings-section">
      <h3 className="section-title">Account & Security</h3>

      <div className="form-group">
        <label>Email Address</label>
        <div className="readonly-field">
          <Mail size={16} />
          <span>{user?.email}</span>
          <span className="verified-badge">Verified</span>
        </div>
        <span className="field-hint">Email cannot be changed</span>
      </div>

      <div className="form-group">
        <label>Subscription</label>
        <div className="subscription-status">
          <div className="sub-info">
            <span className={`sub-badge ${isActive ? 'active' : 'free'}`}>
              {isActive ? `${planType} Plan` : 'Free Plan'}
            </span>
          </div>
          <a href="/dashboard/pricing" className="upgrade-link-btn">
            {isActive ? 'Manage Plan' : 'Upgrade'}
          </a>
        </div>
      </div>

      {/* Password reset via Firebase (email users only) */}
      {!isGoogle && (
        <div className="form-group">
          <label>Password</label>
          <div className="password-reset-box">
            <div>
              <p className="reset-title">Reset Password</p>
              <p className="reset-desc">
                We will send a password reset link to <strong>{user?.email}</strong>
              </p>
            </div>
            {resetSent ? (
              <div className="reset-sent">
                <Check size={14} /> Email sent!
              </div>
            ) : (
              <button
                type="button"
                className="reset-btn"
                onClick={handlePasswordReset}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sign-in method */}
      <div className="form-group">
        <label>Sign-in Method</label>
        <div className="signin-method">
          {isGoogle ? (
            <div className="provider-badge google">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Signed in with Google
            </div>
          ) : (
            <div className="provider-badge email">
              <Mail size={14} />
              Signed in with Email
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Notifications Section ─────────────────────────────────────────────────────

const NOTIFICATION_ITEMS = [
  { key: 'streakReminder' as const, label: 'Daily Streak Reminder', desc: 'Get reminded if you have not studied today' },
  { key: 'cbtResults' as const, label: 'CBT Result Notifications', desc: 'Receive your score after every CBT practice' },
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
    <div className="settings-section">
      <h3 className="section-title">Notifications</h3>

      <div className="settings-push-row">
        <div>
          <h4>Push notifications</h4>
          <p className="settings-push-desc">
            Get alerts for likes, comments, CBT results and more — even when the app is closed (browser or installed PWA).
          </p>
        </div>
        <button
          type="button"
          className={`settings-notif-btn ${pushEnabled ? 'enabled' : ''}`}
          onClick={() => void handlePushToggle()}
          disabled={pushLoading}
        >
          {pushLoading ? 'Loading…' : pushEnabled ? '🔔 Enabled' : '🔕 Enable'}
        </button>
      </div>

      {!hasPhone && (
        <div className="warning-banner">
          <Bell size={16} />
          <p>Add a phone number in Profile to receive WhatsApp notifications</p>
        </div>
      )}

      <div className="toggle-list">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.key} className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">{item.label}</span>
              <span className="toggle-desc">{item.desc}</span>
            </div>
            <button
              type="button"
              className={`toggle-switch ${prefs[item.key] ? 'on' : 'off'}`}
              onClick={() =>
                setPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
              }
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="save-btn"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
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
    <div className="settings-section">
      <h3 className="section-title">Help &amp; Support</h3>
      <p className="field-hint mb-4" style={{ marginTop: '-0.5rem' }}>
        Turn on to show the tour or help chat buttons on screen. By default they stay hidden; only enable them when you want quick access.
      </p>

      <div className="toggle-list">
        <div className="toggle-row">
          <div className="toggle-info">
            <span className="toggle-label">Show tour button</span>
            <span className="toggle-desc">Floating button (bottom-left) to start the page tour</span>
          </div>
          <button
            type="button"
            className={`toggle-switch ${tourButtonVisible ? 'on' : 'off'}`}
            onClick={toggleTour}
            aria-pressed={tourButtonVisible}
          >
            <div className="toggle-thumb" />
          </button>
        </div>
        <div className="toggle-row">
          <div className="toggle-info">
            <span className="toggle-label">Show help chatbot</span>
            <span className="toggle-desc">Quick answers about using StudyHelp</span>
          </div>
          <button
            type="button"
            className={`toggle-switch ${chatbotVisible ? 'on' : 'off'}`}
            onClick={toggleChat}
            aria-pressed={chatbotVisible}
          >
            <div className="toggle-thumb" />
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
    <div className="settings-section">
      <h3 className="section-title">Appearance</h3>

      <div className="form-group">
        <label>Theme</label>
        <div className="theme-options">
          <button
            type="button"
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => applyTheme('light')}
          >
            <Sun size={18} />
            Light
          </button>
          <button
            type="button"
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => applyTheme('dark')}
          >
            <Moon size={18} />
            Dark
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Text Size</label>
        <div className="font-size-options">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              type="button"
              className={`font-size-btn ${fontSize === size ? 'active' : ''}`}
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
    <div className="settings-section">
      <h3 className="section-title danger-title">Danger Zone</h3>

      <div className="danger-item">
        <div className="danger-info">
          <span className="danger-label">Clear Study Data</span>
          <span className="danger-desc">
            Removes all streaks, CBT history, flashcard progress and study sessions.
            Account stays active.
          </span>
        </div>
        <button
          type="button"
          className="danger-btn secondary"
          onClick={handleClearData}
        >
          Clear Data
        </button>
      </div>

      <div className="danger-item">
        <div className="danger-info">
          <span className="danger-label">Delete Account</span>
          <span className="danger-desc">
            Permanently deletes your account and all data. This cannot be undone.
          </span>
        </div>
      </div>

      <div className="delete-confirm-section">
        <p>
          Type <strong>DELETE</strong> to confirm account deletion:
        </p>
        <input
          className="settings-input danger-input"
          value={confirmDelete}
          onChange={(e) => setConfirmDelete(e.target.value)}
          placeholder="Type DELETE here"
        />
        <button
          type="button"
          className="danger-btn primary"
          onClick={handleDeleteAccount}
          disabled={confirmDelete !== 'DELETE' || loading}
        >
          {loading ? 'Deleting...' : 'Delete My Account'}
        </button>
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

        <div className="settings-layout">
          <div className="settings-mobile-nav md:hidden">
            <label className="settings-mobile-label" htmlFor="settings-section-select">
              Section
            </label>
            <select
              id="settings-section-select"
              className="settings-section-select"
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
            >
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="button" className="settings-mobile-logout" onClick={handleLogout}>
              <LogOut size={18} />
              Log Out
            </button>
          </div>

          <div className="settings-sidebar hidden md:block">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`settings-nav-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <s.icon size={18} />
                <span>{s.label}</span>
                <ChevronRight size={15} className="nav-arrow" />
              </button>
            ))}
            <button
              type="button"
              className="settings-nav-item logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>

          <div className="settings-content">
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
    </ProtectedRoute>
  )
}
