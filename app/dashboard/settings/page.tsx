'use client'

import { useState, useEffect } from 'react'
import {
    Moon, Sun, Check, Palette, Users, Copy, Award, Share2,
    ShieldCheck, Lock, BellRing, Sparkles
} from 'lucide-react'
import { MdSchool, MdQuiz } from 'react-icons/md'
import {
    FiBookOpen, FiUser, FiBell, FiShield, FiHelpCircle,
    FiPhone, FiLogOut, FiChevronRight, FiArrowLeft, FiMail,
    FiClock, FiAlertCircle, FiCheck
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
import { SUPPORT_CALL_URL, SUPPORT_WHATSAPP_URL } from '@/components/dashboard/navConfig'
import './settings-v3.css'

type TabType = 'profile' | 'account' | 'notifications' | 'appearance' | 'help' | 'referrals'

interface SectionMeta {
    id: TabType
    label: string
    subtitle: string
    icon: React.ComponentType<{ className?: string; size?: number | string }>
}

const SETTINGS_SECTIONS: SectionMeta[] = [
    { id: 'profile', label: 'Profile', subtitle: 'Manage your name, school, and study profile', icon: FiUser },
    { id: 'account', label: 'Account', subtitle: 'Security, email address, password, and session', icon: FiShield },
    { id: 'notifications', label: 'Notifications', subtitle: 'Study reminders, email alerts, and schedules', icon: FiBell },
    { id: 'appearance', label: 'Appearance', subtitle: 'Dark mode and dashboard display theme', icon: Palette },
    { id: 'referrals', label: 'Referrals', subtitle: 'Invite classmates and earn free StudyHelp Pro access', icon: Users },
    { id: 'help', label: 'Help', subtitle: 'Reach the team, call, WhatsApp, or browse guides', icon: FiHelpCircle },
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
            if (tab && ['profile', 'account', 'notifications', 'appearance', 'help', 'referrals'].includes(tab)) {
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
                        /* Mobile Settings List View */
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

                            {/* Section rows with Icon + Label + Chevron */}
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
                        /* Mobile Section Detail View */
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
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
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

// ─── Reusable Rock-Solid Toggle Switch ───────────────────────────────────────

function Toggle({
    checked,
    onChange,
    disabled = false,
    ariaLabel,
}: {
    checked: boolean
    onChange?: () => void
    disabled?: boolean
    ariaLabel?: string
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed ${
                checked ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    )
}

// ─── Avatar Presets (Curated selection for students) ─────────────────────────

const AVATAR_PRESETS = [
    { id: 'felix', label: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4' },
    { id: 'aneka', label: 'Aneka', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffd5dc' },
    { id: 'caleb', label: 'Caleb', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Caleb&backgroundColor=d1d4f9' },
    { id: 'luna', label: 'Luna', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffdfbf' },
    { id: 'george', label: 'George', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=George&backgroundColor=c0aede' },
    { id: 'daisy', label: 'Daisy', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy&backgroundColor=b6e3f4' },
    { id: 'spark', label: 'Spark', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Spark&backgroundColor=d1d4f9' },
    { id: 'nova', label: 'Nova', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nova&backgroundColor=ffd5dc' },
]

const INSTITUTION_CSV_URLS = [
    'https://raw.githubusercontent.com/reality-farouqk/nigeria-tertiary-institutions-api/main/data/nigerian_universities_faculties.csv',
    'https://raw.githubusercontent.com/reality-farouqk/nigeria-tertiary-institutions-api/main/data/nigerian_polytechnics_schools.csv',
    'https://raw.githubusercontent.com/reality-farouqk/nigeria-tertiary-institutions-api/main/data/nigerian_colleges_of_education_schools.csv',
]

let institutionNamesRequest: Promise<string[]> | null = null

function parseInstitutionNames(csv: string): string[] {
    const rows: string[][] = []
    let row: string[] = []
    let cell = ''
    let quoted = false

    for (let i = 0; i < csv.length; i += 1) {
        const char = csv[i]
        if (char === '"') {
            if (quoted && csv[i + 1] === '"') {
                cell += '"'
                i += 1
            } else {
                quoted = !quoted
            }
        } else if (char === ',' && !quoted) {
            row.push(cell)
            cell = ''
        } else if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && csv[i + 1] === '\n') i += 1
            row.push(cell)
            if (row.some((value) => value.trim())) rows.push(row)
            row = []
            cell = ''
        } else {
            cell += char
        }
    }
    if (cell || row.length) {
        row.push(cell)
        rows.push(row)
    }

    const headers = rows[0]?.map((value) => value.replace(/^\uFEFF/, '').trim().toLowerCase()) || []
    const nameIndex = headers.findIndex((value) => value === 'university name' || value === 'institution name')
    if (nameIndex < 0) return []
    return rows.slice(1).map((values) => values[nameIndex]?.trim()).filter((value): value is string => Boolean(value))
}

function loadInstitutionNames(): Promise<string[]> {
    if (!institutionNamesRequest) {
        institutionNamesRequest = Promise.all(INSTITUTION_CSV_URLS.map(async (url) => {
            const response = await fetch(url)
            if (!response.ok) throw new Error('Unable to load school suggestions')
            return parseInstitutionNames(await response.text())
        })).then((lists) => Array.from(new Set(lists.flat())).sort((a, b) => a.localeCompare(b)))
            .catch((error) => {
                institutionNamesRequest = null
                throw error
            })
    }
    return institutionNamesRequest
}

// ─── Profile Section ─────────────────────────────────────────────────────────

function ProfileSection({ user, onSaved }: any) {
    const defaultAvatar = user?.avatar || AVATAR_PRESETS[0].url
    const [form, setForm] = useState({
        displayName: user?.name || '',
        phone: '',
        schoolName: user?.schoolName || '',
        classLevel: user?.classLevel || '',
        courseOfStudy: user?.courseOfStudy || '',
    })
    const [loading, setLoading] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string>(defaultAvatar)
    const [institutionNames, setInstitutionNames] = useState<string[]>([])
    const [schoolSuggestionsOpen, setSchoolSuggestionsOpen] = useState(false)
    const [schoolSuggestionsLoading, setSchoolSuggestionsLoading] = useState(false)
    const [schoolSuggestionsError, setSchoolSuggestionsError] = useState(false)

    useEffect(() => {
        if (!schoolSuggestionsOpen || form.schoolName.trim().length < 2 || institutionNames.length) return
        let active = true
        setSchoolSuggestionsError(false)
        setSchoolSuggestionsLoading(true)
        loadInstitutionNames()
            .then((names) => { if (active) setInstitutionNames(names) })
            .catch(() => {
                if (active) {
                    setInstitutionNames([])
                    setSchoolSuggestionsError(true)
                }
            })
            .finally(() => { if (active) setSchoolSuggestionsLoading(false) })
        return () => { active = false }
    }, [schoolSuggestionsOpen, form.schoolName, institutionNames.length])

    const matchingInstitutions = form.schoolName.trim().length >= 2
        ? institutionNames.filter((name) => name.toLowerCase().includes(form.schoolName.trim().toLowerCase())).slice(0, 7)
        : []

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
                if (p.avatar) {
                    setAvatarPreview(p.avatar)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('studyhelp_avatar', p.avatar)
                    }
                    useAuthStore.setState((state) => ({
                        user: state.user ? { ...state.user, avatar: p.avatar } : null
                    }))
                } else if (user?.avatar) {
                    setAvatarPreview(user.avatar)
                }
            } catch { }
        }
        load()
    }, [user?.uid])

    const handleSave = async () => {
        setLoading(true)
        try {
            await apiClient.put('/settings', { profile: { ...form, avatar: avatarPreview } })
            if (typeof window !== 'undefined') {
                localStorage.setItem('studyhelp_avatar', avatarPreview)
            }
            useAuthStore.setState((state) => ({
                user: state.user ? { ...state.user, avatar: avatarPreview, name: form.displayName || state.user.name } : null
            }))
            onSaved()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="settings-clean-section space-y-8">
            {/* Redesigned Profile Header (Avatar selected for them, no file upload) */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-200/70 dark:border-white/10">
                <div className="relative shrink-0">
                    <img
                        src={avatarPreview}
                        className="w-24 h-24 rounded-2xl ring-4 ring-purple-500/20 shadow-md object-cover bg-gradient-to-br from-indigo-500/10 to-purple-500/10"
                        alt="Profile avatar"
                    />
                    <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-sm flex items-center gap-1">
                        <Sparkles size={10} /> Avatar
                    </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            {form.displayName || 'Student'}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            {user?.role === 'teacher' ? 'Teacher' : 'Student'}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {user?.email}
                    </p>

                    {/* Avatar selection presets */}
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Select your avatar
                        </p>
                        <div className="avatar-presets-scroll">
                            {AVATAR_PRESETS.map((item) => {
                                const isSelected = avatarPreview === item.url
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        title={item.label}
                                        onClick={() => {
                                            setAvatarPreview(item.url)
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('studyhelp_avatar', item.url)
                                            }
                                            useAuthStore.setState((state) => ({
                                                user: state.user ? { ...state.user, avatar: item.url } : null
                                            }))
                                        }}
                                        className={`avatar-preset-btn ${isSelected ? 'active' : ''}`}
                                    >
                                        <img src={item.url} alt={item.label} className="avatar-preset-img" />
                                        {isSelected && (
                                            <span className="avatar-preset-check">
                                                <FiCheck size={11} />
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Redesigned Form Fields (Borderless & Clean) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        <FiUser className="text-purple-500" size={14} /> Display Name
                    </label>
                    <input
                        className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-medium"
                        value={form.displayName}
                        onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                        placeholder="Your full name"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        <FiPhone className="text-purple-500" size={14} /> Phone Number
                    </label>
                    <input
                        className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-medium"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. 08012345678"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        <MdSchool className="text-purple-500" size={15} /> School Name
                    </label>
                    <div className="relative">
                        <input
                            className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-medium"
                            value={form.schoolName}
                            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                            onFocus={() => setSchoolSuggestionsOpen(true)}
                            onBlur={() => setSchoolSuggestionsOpen(false)}
                            placeholder="Type your school name or select a suggestion"
                            autoComplete="off"
                            role="combobox"
                            aria-autocomplete="list"
                            aria-expanded={schoolSuggestionsOpen && matchingInstitutions.length > 0}
                            aria-controls="school-name-suggestions"
                        />
                        {schoolSuggestionsOpen && form.schoolName.trim().length >= 2 && (
                            <div id="school-name-suggestions" role="listbox" className="absolute z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                {matchingInstitutions.map((name) => (
                                    <button
                                        key={name}
                                        type="button"
                                        role="option"
                                        aria-selected={name === form.schoolName}
                                        className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-purple-50 focus:bg-purple-50 focus:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                                        onPointerDown={(event) => event.preventDefault()}
                                        onClick={() => {
                                            setForm({ ...form, schoolName: name })
                                            setSchoolSuggestionsOpen(false)
                                        }}
                                    >
                                        {name}
                                    </button>
                                ))}
                                {!schoolSuggestionsLoading && matchingInstitutions.length === 0 && (
                                    <p className="px-3 py-2.5 text-sm text-slate-500">
                                        {schoolSuggestionsError
                                            ? 'Suggestions could not be loaded. You can still enter your school name.'
                                            : 'No match found. You can keep your school name as typed.'}
                                    </p>
                                )}
                                {schoolSuggestionsLoading && <p className="px-3 py-2.5 text-sm text-slate-500">Loading school suggestions…</p>}
                            </div>
                        )}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Choose a suggestion or enter any school name yourself.</p>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        <MdQuiz className="text-purple-500" size={15} /> Class / Level
                    </label>
                    <input
                        className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-medium"
                        value={form.classLevel}
                        onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
                        placeholder="e.g. SS3, 100L, Post-UTME"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        <FiBookOpen className="text-purple-500" size={14} /> Course of Study (Optional)
                    </label>
                    <input
                        className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-medium"
                        value={form.courseOfStudy}
                        onChange={(e) => setForm({ ...form, courseOfStudy: e.target.value })}
                        placeholder="e.g. Medicine, Computer Science, Law"
                    />
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="v3-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 min-w-[200px]"
                >
                    {loading ? (
                        <>Saving Changes...</>
                    ) : (
                        <>
                            <Check size={18} />
                            <span>Save Profile Changes</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

// ─── Account & Security Section ──────────────────────────────────────────────

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
            toast.success('Password reset link sent to your email!')
        } catch (err: any) {
            toast.error('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="settings-clean-section space-y-6">
            <header className="pb-4 border-b border-slate-200/70 dark:border-white/10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    Account & Security
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Manage your authentication details, security, and active session
                </p>
            </header>

            <div className="space-y-4">
                {/* Email Address */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <FiMail size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Email Address
                            </p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {user?.email || 'No email provided'}
                            </p>
                        </div>
                    </div>
                    <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        <Check size={13} /> Verified
                    </span>
                </div>

                {/* Authentication Method */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            {isGoogle ? (
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    className="w-5 h-5"
                                    alt="Google"
                                />
                            ) : (
                                <ShieldCheck size={18} />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Authentication Method
                            </p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {isGoogle ? 'Google Account OAuth' : 'Email & Secure Password'}
                            </p>
                        </div>
                    </div>
                    <span className="self-start sm:self-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Connected
                    </span>
                </div>

                {/* Password Management (if password login) */}
                {!isGoogle && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Lock size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                                    Password
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                                    Want to change your password? We will send a secure link directly to your email address.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handlePasswordReset}
                            disabled={loading}
                            className="v3-btn-outline whitespace-nowrap self-start sm:self-center text-xs px-4 py-2"
                        >
                            {loading ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </div>
                )}

                {/* Session Management & Logout */}
                <div className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                                <FiLogOut size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-0.5">
                                    Session Management
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Log out of your StudyHelp account on this device.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onLogoutClick}
                            className="settings-logout-btn self-start sm:self-center"
                        >
                            <FiLogOut size={16} />
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Notification Preferences Section ────────────────────────────────────────

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
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;
            }

            if (Notification.permission === 'denied') {
                alert('Notifications are blocked. Please enable them in your browser settings.');
                return;
            }

            setLoading(true);

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
        <div className="settings-clean-section space-y-6">
            <header className="pb-4 border-b border-slate-200/70 dark:border-white/10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    Notification Preferences
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Control how and when StudyHelp sends you study reminders and performance digests
                </p>
            </header>

            {/* Push Notifications Card */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <BellRing size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                Study Reminders & Push Alerts
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Receive instant push notifications for planned study sessions, streaks, and goals
                            </p>
                        </div>
                    </div>
                    <Toggle
                        checked={pushEnabled}
                        onChange={pushEnabled ? undefined : handleTestPush}
                        disabled={pushEnabled}
                        ariaLabel="Enable push notifications"
                    />
                </div>

                {/* Test Push Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                    <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                            Test Your Setup
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Verify this device can successfully display StudyHelp notifications.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleTestPush}
                        disabled={loading}
                        className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                            pushEnabled
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        {loading ? 'Sending...' : pushEnabled ? 'Send Test Notification' : 'Enable Notifications First'}
                    </button>
                </div>
            </div>

            {/* Study Routine Section */}
            <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                    Study Routine & Alerts
                </h4>

                <div className="space-y-3">
                    {/* Next-step reminder */}
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                        <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                Next-step reminder
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                At most once a week while you’re away, highlighting a specific unfinished lesson.
                            </p>
                        </div>
                        <Toggle
                            checked={Boolean(prefs.studyReminders)}
                            onChange={() => toggle('studyReminders')}
                            ariaLabel="Toggle next-step reminder"
                        />
                    </div>

                    {/* Reminder time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <FiClock size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                    Daily reminder time
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Local timezone ({prefs.timezone || 'Africa/Lagos'})
                                </p>
                            </div>
                        </div>
                        <input
                            type="time"
                            value={prefs.reminderTime || '18:00'}
                            onChange={(event) => setPrefs((current: any) => ({ ...current, reminderTime: event.target.value }))}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 self-start sm:self-auto"
                        />
                    </div>

                    {/* Email reminder backup */}
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                        <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                Email reminder backup
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Send the next study step to your email inbox when push notifications are not delivered.
                            </p>
                        </div>
                        <Toggle
                            checked={Boolean(prefs.emailStudyReminders)}
                            onChange={() => toggle('emailStudyReminders')}
                            disabled={emailUnsubscribed}
                            ariaLabel="Toggle email reminder backup"
                        />
                    </div>

                    {/* Weekly progress recap */}
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                        <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                Weekly progress recap
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Summary email with completed lessons, active days, XP gained, and recommended next steps.
                            </p>
                        </div>
                        <Toggle
                            checked={Boolean(prefs.weeklyDigest)}
                            onChange={() => toggle('weeklyDigest')}
                            disabled={emailUnsubscribed}
                            ariaLabel="Toggle weekly progress recap"
                        />
                    </div>

                    {emailUnsubscribed && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                            <FiAlertCircle size={14} className="shrink-0" />
                            <span>Email alerts are unsubscribed for this account. Email reminders and recaps are paused.</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={save}
                    disabled={loading}
                    className="v3-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 min-w-[200px]"
                >
                    {loading ? 'Saving...' : 'Update Notification Settings'}
                </button>
            </div>
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

// ─── Appearance Section ──────────────────────────────────────────────────────

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

// ─── Help Section ────────────────────────────────────────────────────────────

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

// ─── Referral Section ────────────────────────────────────────────────────────

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
