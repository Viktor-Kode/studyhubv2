'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, FileText, Clock } from 'lucide-react'

const STUDENT_GENERATOR_PATH = '/dashboard/question-bank'
const NOTES_PATH = '/dashboard/notes'
const HISTORY_PATH = '/dashboard/question-history'

export default function GeneratorTabsHeader() {
  const pathname = usePathname()
  const generatorPath = STUDENT_GENERATOR_PATH
  const isGenerator = pathname?.includes('question-generator') || pathname?.includes('question-bank')
  const isNotes = pathname?.includes('/notes') && !pathname?.includes('question-bank')
  const isHistory = pathname?.includes('question-history')

  return (
    <div className="generator-top-section">
      <div className="generator-title-block">
        <h2>Question Generator</h2>
        <p>Deep Learning through Active Recall</p>
      </div>
      <div className="generator-tabs">
        <Link
          href={generatorPath}
          className={`generator-tab ${isGenerator ? 'active' : ''}`}
        >
          <Zap size={15} />
          AI Question Bank
        </Link>
        <Link
          href={NOTES_PATH}
          className={`generator-tab ${isNotes ? 'active' : ''}`}
        >
          <FileText size={15} />
          My Notes
        </Link>
        <Link
          href={HISTORY_PATH}
          className={`generator-tab ${isHistory ? 'active' : ''}`}
        >
          <Clock size={15} />
          History
        </Link>
      </div>
    </div>
  )
}
