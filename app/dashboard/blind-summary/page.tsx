'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import BottomNav from '@/components/dashboard/MobileBottomNav'
import BlindSummaryModal from '@/components/dashboard/BlindSummaryModal'
import { fetchStudyNotes, StudyNote } from '@/lib/api/quizApi'
import { useProgress } from '@/hooks/useProgress'
import {
  FiEyeOff, FiBookOpen, FiArrowRight, FiCheckCircle,
  FiZap, FiEdit3, FiFileText, FiLayers, FiX
} from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'
import '@/app/dashboard/student/dashboard-v3.css'

export default function BlindSummaryPage() {
  const { awardXP } = useProgress()
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null)
  const [customText, setCustomText] = useState('')
  const [customTitle, setCustomTitle] = useState('')

  // Modal active recall state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReadingMode, setIsReadingMode] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const res = await fetchStudyNotes()
      if (res?.success && Array.isArray(res.notes)) {
        setNotes(res.notes)
        if (res.notes.length > 0) {
          setSelectedNote(res.notes[0])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChallenge = () => {
    setIsModalOpen(true)
  }

  const activeText = selectedNote ? selectedNote.content : customText
  const activeTitle = selectedNote ? selectedNote.title : (customTitle || 'Active Recall Exercise')

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md">
                🙈
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Active Recall Tool
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-yellow-400 text-purple-950 rounded-full">
                    +25 XP
                  </span>
                </div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  Blind Summary
                </h1>
              </div>
            </div>

            <Link
              href="/dashboard/study"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              Back to Study Tools
            </Link>
          </div>
        </header>

        {/* Main Body Container */}
        <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
          {/* Explanation Banner */}
          <div className="p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-extrabold uppercase tracking-wide rounded-full">
                Active Recall Method
              </span>
            </div>
            <h2 className="text-2xl font-black text-white leading-tight">
              Test your retention without looking back!
            </h2>
            <p className="text-sm text-purple-100 max-w-xl leading-relaxed">
              Read your summary or notes below. When you&apos;re ready, start the <strong>Blind Summary Challenge</strong> — the content will hide, and you&apos;ll be prompted: <em>&quot;Type 3 main points without looking back.&quot;</em>
            </p>
          </div>

          {/* Section 1: Note Selection or Custom Input */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FiBookOpen className="w-4 h-4 text-purple-500" />
              1. Select a Note or Paste Material
            </h3>

            {/* Note Selector Pills */}
            {notes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Your Recent AI Summaries & Notes:
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {notes.map((note) => (
                    <button
                      key={note._id}
                      type="button"
                      onClick={() => {
                        setSelectedNote(note)
                        setCustomText('')
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                        selectedNote?._id === note._id
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {note.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedNote(null)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedNote === null
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    + Custom Text
                  </button>
                </div>
              </div>
            )}

            {/* Custom Input fallback */}
            {selectedNote === null && (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="Topic Title (e.g. Photosynthesis Notes)..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                />
                <textarea
                  rows={5}
                  placeholder="Paste your study summary or notes here to read first..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Note Preview Box */}
            {selectedNote && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    📖 Selected: {selectedNote.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Read carefully before starting recall!
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-6 leading-relaxed font-normal whitespace-pre-wrap">
                  {selectedNote.content}
                </div>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready? Content will be hidden during the challenge.
              </p>
              <button
                type="button"
                disabled={!activeText || activeText.trim().length < 10}
                onClick={handleStartChallenge}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <span>Start Blind Summary Challenge</span>
                <FiZap className="w-4 h-4 text-yellow-300" />
              </button>
            </div>
          </div>
        </main>

        {/* Active Recall Modal */}
        <BlindSummaryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSkip={() => setIsModalOpen(false)}
          title={activeTitle}
          originalSummaryText={activeText}
        />

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
