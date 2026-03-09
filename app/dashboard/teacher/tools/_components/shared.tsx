'use client'

import { Loader, Zap } from 'lucide-react'

export function ToolInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  placeholder?: string
  value: string | number
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="form-group">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        className="teacher-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function ToolGenerateBtn({
  loading,
  onClick,
  label,
}: {
  loading: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      className="generate-btn flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader size={18} className="animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Zap size={18} />
          {label}
        </>
      )}
    </button>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="note-section mb-5">
      <h4 className="note-section-title text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-2 pb-1 border-b-2 border-indigo-100 dark:border-indigo-900/50">
        {title}
      </h4>
      <div className="note-section-content text-sm text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  )
}

export async function getToken(): Promise<string | null> {
  const { getAuth } = await import('firebase/auth')
  const user = getAuth().currentUser
  return user ? await user.getIdToken() : localStorage.getItem('token')
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
