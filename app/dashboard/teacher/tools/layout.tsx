'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  BarChart2,
  MessageSquare,
  Calendar,
  CheckSquare,
  Layers,
  BookOpen,
  Lock,
  Menu,
  X,
  ClipboardList,
  Download,
  FolderOpen
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'

const TOOLS = [
  { id: 'lesson-note', label: 'Lesson Note Generator', icon: FileText, color: '#4F46E5', bg: '#EEF2FF', desc: 'Generate full lesson notes from topic name', free: true },
  { id: 'class-register', label: 'Class Register', icon: ClipboardList, color: '#2563EB', bg: '#EFF6FF', desc: 'Attendance + score sheet template (PDF)', free: true },
  { id: 'report-sheet', label: 'Report Sheet', icon: BarChart2, color: '#D97706', bg: '#FEF3C7', desc: 'Full termly report cards per student (PDF)', free: true },
  { id: 'teacher-diary', label: "Teacher's Diary", icon: BookOpen, color: '#059669', bg: '#ECFDF5', desc: 'Weekly lesson plan diary (PDF)', free: true },
  { id: 'templates', label: 'Templates', icon: Download, color: '#7C3AED', bg: '#F5F3FF', desc: 'Lesson note, scheme of work, exam timetable PDFs', free: true },
  { id: 'result-compiler', label: 'Result Compiler', icon: BarChart2, color: '#059669', bg: '#ECFDF5', desc: 'Compile, grade and rank student results', free: true },
  { id: 'report-comments', label: 'Report Card Comments', icon: MessageSquare, color: '#D97706', bg: '#FEF3C7', desc: 'Generate personalised comments for 30+ students', free: true },
  { id: 'scheme-of-work', label: 'Scheme of Work', icon: Calendar, color: '#7C3AED', bg: '#F5F3FF', desc: 'Full term scheme aligned to NERDC curriculum', free: true },
  { id: 'marking-scheme', label: 'Marking Scheme', icon: CheckSquare, color: '#DC2626', bg: '#FEF2F2', desc: 'Detailed marking guide with key points per question', free: true },
  { id: 'differentiated', label: 'Differentiated Questions', icon: Layers, color: '#0891B2', bg: '#ECFEFF', desc: '3 difficulty versions of same test from one document', free: true },
  { id: 'comprehension', label: 'Comprehension Builder', icon: BookOpen, color: '#BE185D', bg: '#FDF2F8', desc: 'Generate questions, vocabulary and summary tasks', free: true },
]

export default function TeacherToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [teacherPlan, setTeacherPlan] = useState<'free' | 'weekly' | 'monthly'>('free')
  const [usage, setUsage] = useState<Record<string, number>>({})

  useEffect(() => {
    apiClient.get('/teacher-tools/usage').then((res) => {
      if (res.data?.success) {
        setTeacherPlan(res.data.teacherPlan || 'free')
        setUsage(res.data.teacherUsage || {})
      }
    }).catch(() => {})
  }, [])

  const isPaid = teacherPlan !== 'free'
  const toolFromPath = pathname.split('/').pop() || 'lesson-note'

  return (
    <div className="teacher-tools-layout flex min-h-[70vh] relative bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Mobile toggle */}
      <button
        type="button"
        className="sidebar-toggle lg:hidden fixed top-20 left-4 z-[60] flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md font-semibold text-sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        <span>Teacher Tools</span>
      </button>

      {/* Sidebar */}
      <aside
        className={`teacher-sidebar w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-200 fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ top: 'var(--nav-height, 4rem)' }}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-base">Teacher Tools</h2>
          <div className={`plan-indicator mt-2 text-xs font-semibold px-2 py-1 rounded-full inline-block
            ${teacherPlan === 'free' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
            {isPaid ? 'Unlimited ✓' : '3 free uses per tool'}
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const isLocked = !tool.free && !isPaid
            const isActive = toolFromPath === tool.id

            return (
              <Link
                key={tool.id}
                href={`/dashboard/teacher/tools/${tool.id}`}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left transition-colors
                  ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? tool.bg : 'transparent' }}
                >
                  <Icon size={17} color={isActive ? tool.color : '#6B7280'} />
                </div>
                <span className="flex-1 text-sm">{tool.label}</span>
                {isLocked && <Lock size={13} className="text-gray-400 flex-shrink-0" />}
              </Link>
            )
          })}

          <Link
            href="/dashboard/teacher/tools/saved"
            onClick={() => setSidebarOpen(false)}
            className={`sidebar-item flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left transition-colors
              ${toolFromPath === 'saved' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50 dark:bg-amber-900/20">
              <FolderOpen size={17} color="#D97706" />
            </div>
            <span className="flex-1 text-sm">My Saved</span>
          </Link>

          <Link
            href="/dashboard/teacher/question-generator"
            onClick={() => setSidebarOpen(false)}
            className={`sidebar-item flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left transition-colors
              ${pathname.includes('question-generator') ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/20">
              <FileText size={17} color="#4F46E5" />
            </div>
            <span className="flex-1 text-sm">Question Generator</span>
          </Link>
        </nav>

        {!isPaid && (
          <div className="sidebar-upgrade m-3 p-4 rounded-xl text-white bg-gradient-to-br from-indigo-600 to-purple-600">
            <p className="text-xs mb-2 opacity-90">Unlock all tools + unlimited usage</p>
            <div className="flex gap-2 mb-2 text-xs">
              <span>₦1,500/week</span>
              <span className="font-bold text-sm">₦3,500/month</span>
            </div>
            <Link
              href="/dashboard/upgrade?plan=teacher"
              className="block w-full py-2 text-center bg-white text-indigo-600 rounded-lg text-sm font-bold"
            >
              Upgrade Now
            </Link>
          </div>
        )}
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main className="teacher-main flex-1 p-4 sm:p-6 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
