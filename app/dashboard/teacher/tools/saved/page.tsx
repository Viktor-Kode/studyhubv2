'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FolderOpen, Trash2, Loader, FileText, BarChart2, Calendar, CheckSquare, Layers, BookOpen, MessageSquare } from 'lucide-react'
import { apiClient } from '@/lib/api/client'

const TOOL_LABELS: Record<string, string> = {
  lesson_note: 'Lesson Note',
  result_compiler: 'Result Compiler',
  scheme_of_work: 'Scheme of Work',
  marking_scheme: 'Marking Scheme',
  differentiated: 'Differentiated Questions',
  comprehension: 'Comprehension Builder',
  report_comments: 'Report Comments',
  report_sheet: 'Report Sheet',
  teacher_diary: "Teacher's Diary",
  class_register: 'Class Register',
}

const TOOL_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  lesson_note: FileText,
  result_compiler: BarChart2,
  scheme_of_work: Calendar,
  marking_scheme: CheckSquare,
  differentiated: Layers,
  comprehension: BookOpen,
  report_comments: MessageSquare,
  report_sheet: BarChart2,
  teacher_diary: BookOpen,
  class_register: FileText,
}

interface SavedItem {
  id: string
  toolType: string
  slug: string
  title: string
  meta?: Record<string, unknown>
  createdAt: string
}

export default function SavedPage() {
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get('/teacher-tools/saved')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.items)) setItems(res.data.items)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Delete this saved item?')) return
    setDeletingId(id)
    try {
      await apiClient.delete(`/teacher-tools/saved/${type}/${id}`)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' })
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="tool-page flex items-center justify-center min-h-[200px]">
        <Loader size={32} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <FolderOpen size={24} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">My Saved</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Open or delete your saved lesson notes, schemes, results, and more
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-8 text-center text-gray-500 dark:text-gray-400">
          <p className="font-medium">No saved items yet</p>
          <p className="text-sm mt-1">Generate something in any tool and click Save to see it here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = TOOL_ICONS[item.toolType] || FileText
            const label = TOOL_LABELS[item.toolType] || item.toolType
            return (
              <li
                key={`${item.toolType}-${item.id}`}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-indigo-500 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/teacher/tools/${item.slug}?saved=${item.id}&type=${item.toolType}`}
                    className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 block truncate"
                  >
                    {item.title || 'Untitled'}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {label} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.toolType, item.id)}
                  disabled={deletingId === item.id}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  aria-label="Delete"
                >
                  {deletingId === item.id ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
