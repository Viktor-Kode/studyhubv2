'use client'

import { useRouter } from 'next/navigation'
import type { AppUser } from '@/lib/types/auth'
import './onboarding.css'

function getSteps(user: AppUser) {
  const isUni = user.onboarding?.studentType === 'university'
  const subj = user.onboarding?.subjects?.[0] || (isUni ? 'your course' : 'your subjects')

  return [
    {
      id: 'cbt',
      icon: '📝',
      title: isUni ? 'Practice past exam questions' : 'Take your first CBT practice test',
      description: isUni
        ? `Practice ${user.onboarding?.subjects?.[0] || 'your course'} questions`
        : `Practice ${subj} past questions`,
      link: '/dashboard/cbt',
      done: user.progress?.hasCompletedCBT,
      cta: 'Start Practice →',
      color: '#5B4CF5',
    },
    {
      id: 'ai_tutor',
      icon: '🤖',
      title: isUni ? 'Ask AI to explain a concept' : 'Ask the AI Tutor a question',
      description: isUni
        ? 'Get explanations for complex university topics'
        : 'Get instant explanations on any topic',
      link: '/dashboard/chat',
      done: user.progress?.hasUsedAITutor,
      cta: 'Ask AI Tutor →',
      color: '#0891B2',
    },
    {
      id: 'library',
      icon: '📚',
      title: isUni ? 'Upload your lecture notes or textbook' : 'Upload a study material',
      description: isUni
        ? 'Read and track your course materials in one place'
        : 'Add a textbook or past question PDF to your library',
      link: '/dashboard/library',
      done: user.progress?.hasUploadedLibrary,
      cta: 'Upload PDF →',
      color: '#059669',
    },
    {
      id: 'community',
      icon: '🌐',
      title: isUni ? 'Join a study group' : 'Join the community',
      description: isUni
        ? 'Study with coursemates and share resources'
        : 'Connect with other students and share study tips',
      link: '/community',
      done: user.progress?.hasJoinedCommunity,
      cta: isUni ? 'Find a Group →' : 'Visit Community →',
      color: '#D97706',
    },
    {
      id: 'flashcard',
      icon: '🃏',
      title: isUni ? 'Create flashcards for key concepts' : 'Create a flashcard',
      description: isUni
        ? 'Build cards for definitions, cases, or formulae'
        : 'Build your first card or generate a deck with AI',
      link: '/dashboard/flip-cards',
      done: user.progress?.hasCreatedFlashcard,
      cta: 'Open Flashcards →',
      color: '#7C3AED',
    },
  ]
}

export default function NextStepsCard({ user }: { user: AppUser }) {
  const router = useRouter()
  const steps = getSteps(user)
  const allDone = steps.every((s) => s.done)
  const completedCount = steps.filter((s) => s.done).length

  if (allDone) return null

  const pct = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="next-steps-card">
      <div className="next-steps-header">
        <div>
          <h3>
            {completedCount === 0 ? `Welcome! Here's how to get started 🚀` : `You're doing great! Keep going 💪`}
          </h3>
          <p>
            {completedCount} of {steps.length} steps completed
          </p>
        </div>
        <div className="next-steps-progress-wrap">
          <div className="next-steps-progress-track">
            <div className="next-steps-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span>{pct}%</span>
        </div>
      </div>

      <div className="next-steps-list">
        {steps.map((st, i) => (
          <div
            key={st.id}
            role={st.done ? undefined : 'button'}
            tabIndex={st.done ? undefined : 0}
            className={`next-step-item ${st.done ? 'done' : ''}`}
            onClick={() => {
              if (!st.done) router.push(st.link)
            }}
            onKeyDown={(e) => {
              if (!st.done && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                router.push(st.link)
              }
            }}
          >
            <div
              className="next-step-number"
              style={{ background: st.done ? '#10B981' : st.color }}
            >
              {st.done ? '✓' : i + 1}
            </div>
            <div className="next-step-content">
              <div className="next-step-title-row">
                <span className="next-step-icon">{st.icon}</span>
                <span className="next-step-title">{st.title}</span>
                {st.done ? <span className="next-step-done-badge">Done ✓</span> : null}
              </div>
              <p className="next-step-desc">{st.description}</p>
            </div>
            {!st.done ? <span className="next-step-cta">{st.cta}</span> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
