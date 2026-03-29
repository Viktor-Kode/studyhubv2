'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api/client'
import type { AppUser } from '@/lib/types/auth'
import './onboarding.css'

const ALL_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Biology',
  'Chemistry',
  'Physics',
  'Economics',
  'Government',
  'Literature in English',
  'Geography',
  'Agricultural Science',
  'Civic Education',
  'Further Mathematics',
  'Commerce',
  'Accounting',
  'Christian Religious Studies',
  'Islamic Religious Studies',
  'French',
  'History',
]

const EXAM_OPTIONS = ['UTME / JAMB', 'WAEC', 'NECO', 'NABTEB', 'Post-UTME', 'GCE']

type WizardAnswers = {
  examType: string
  subjects: string[]
  goal: string
  studyHoursPerDay: string
}

export default function SetupWizard({
  user,
  onComplete,
}: {
  user: AppUser
  onComplete: () => void
}) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>({
    examType: '',
    subjects: [],
    goal: '',
    studyHoursPerDay: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const firstName = user.name?.split(' ')[0] || 'there'
  const lastStepIndex = 3
  const progressPct = lastStepIndex > 0 ? (step / lastStepIndex) * 100 : 0

  const postOnboarding = async (body: WizardAnswers) => {
    await apiClient.post('/users/onboarding', body)
  }

  const handleComplete = async () => {
    setSaving(true)
    setError('')
    try {
      await postOnboarding(answers)
      onComplete()
    } catch (e) {
      console.error(e)
      setError('Could not save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    setError('')
    try {
      await postOnboarding({
        examType: '',
        subjects: [],
        goal: 'Exploring',
        studyHoursPerDay: '',
      })
      onComplete()
    } catch (e) {
      console.error(e)
      setError('Could not save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="wizard-overlay" role="dialog">
      <div className="wizard-modal">
        <div className="wizard-progress-bar">
          <div className="wizard-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {step === 0 && (
          <div className="wizard-step">
            <div className="wizard-emoji">👋</div>
            <h2>Welcome to StudyHelp, {firstName}!</h2>
            <p>Let&apos;s set up your account in 3 quick steps so we can personalise your experience.</p>
            <p className="wizard-time">⏱️ Takes less than 1 minute</p>
            {error ? <p className="text-red-500 text-sm">{error}</p> : null}
            <button type="button" className="wizard-btn-primary" onClick={() => setStep(1)}>
              Let&apos;s Go →
            </button>
            <button type="button" className="wizard-skip" onClick={handleSkip} disabled={saving}>
              Skip for now
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="wizard-step">
            <h2>What exam are you preparing for?</h2>
            <p>We&apos;ll show you the most relevant past questions</p>
            <div className="wizard-options-grid">
              {EXAM_OPTIONS.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  className={`wizard-option ${answers.examType === exam ? 'selected' : ''}`}
                  onClick={() => setAnswers((a) => ({ ...a, examType: exam }))}
                >
                  {exam}
                </button>
              ))}
            </div>
            <div className="wizard-nav">
              <button type="button" className="wizard-btn-secondary" onClick={() => setStep(0)}>
                ← Back
              </button>
              <button
                type="button"
                className="wizard-btn-primary"
                onClick={() => setStep(2)}
                disabled={!answers.examType}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <h2>Which subjects are you studying?</h2>
            <p>Select all that apply — you can change these later</p>
            <div className="wizard-subjects-grid">
              {ALL_SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`wizard-subject ${answers.subjects.includes(sub) ? 'selected' : ''}`}
                  onClick={() => {
                    setAnswers((a) => ({
                      ...a,
                      subjects: a.subjects.includes(sub)
                        ? a.subjects.filter((s) => s !== sub)
                        : [...a.subjects, sub],
                    }))
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
            <p className="wizard-selected-count">{answers.subjects.length} selected</p>
            <div className="wizard-nav">
              <button type="button" className="wizard-btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                type="button"
                className="wizard-btn-primary"
                onClick={() => setStep(3)}
                disabled={answers.subjects.length === 0}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step">
            <h2>What&apos;s your main goal?</h2>
            <div className="wizard-options-grid">
              {[
                { label: '🎓 Get into university', value: 'Get into university' },
                { label: '📜 Pass my WAEC/NECO', value: 'Pass WAEC/NECO' },
                { label: '🏆 Score 300+ in JAMB', value: 'Score 300+ in JAMB' },
                { label: '📚 Improve my grades', value: 'Improve grades' },
                { label: '🔄 Resit my exams', value: 'Resit exams' },
                { label: '✨ Just exploring', value: 'Exploring' },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`wizard-option ${answers.goal === g.value ? 'selected' : ''}`}
                  onClick={() => setAnswers((a) => ({ ...a, goal: g.value }))}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <h3 style={{ marginTop: 24 }}>How many hours can you study per day?</h3>
            <div className="wizard-options-row">
              {['Less than 1 hour', '1-2 hours', '2-3 hours', '3+ hours'].map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`wizard-option ${answers.studyHoursPerDay === h ? 'selected' : ''}`}
                  onClick={() => setAnswers((a) => ({ ...a, studyHoursPerDay: h }))}
                >
                  {h}
                </button>
              ))}
            </div>

            {error ? <p className="text-red-500 text-sm">{error}</p> : null}
            <div className="wizard-nav">
              <button type="button" className="wizard-btn-secondary" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                type="button"
                className="wizard-btn-primary"
                onClick={handleComplete}
                disabled={!answers.goal || saving}
              >
                {saving ? 'Saving...' : "Let's Start! 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
