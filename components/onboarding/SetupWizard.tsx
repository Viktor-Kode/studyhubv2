'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { getFirebaseToken } from '@/lib/store/authStore'
import type { AppUser, OnboardingStudentType } from '@/lib/types/auth'
import './onboarding.css'

const STUDENT_TYPE_OPTIONS: {
  label: string
  value: OnboardingStudentType
  desc: string
}[] = [
  {
    label: '🏫 Secondary School',
    value: 'secondary',
    desc: 'JSS1 — SS3, preparing for WAEC, NECO, JAMB',
  },
  {
    label: '🎓 University Student',
    value: 'university',
    desc: 'Undergraduate or postgraduate student',
  },
  {
    label: '📚 JAMB / Post-UTME',
    value: 'jamb',
    desc: 'Waiting for admission, preparing for post-UTME',
  },
  {
    label: '🔄 Remedial / Resit',
    value: 'remedial',
    desc: 'Resitting exams or on remedial programme',
  },
]

function getExamOptions(studentType: OnboardingStudentType | '') {
  if (studentType === 'university') {
    return [
      { label: '📝 Semester Exams', value: 'Semester Exams' },
      { label: '🔬 Practicals', value: 'Practicals' },
      { label: '📖 Carry-over Papers', value: 'Carry-over Papers' },
      { label: '🎓 Final Year / Project', value: 'Final Year' },
      { label: '🏥 Professional (MDCN, NLE)', value: 'Professional Exams' },
      { label: '📊 Postgraduate (Masters/PhD)', value: 'Postgraduate' },
    ]
  }
  if (studentType === 'jamb') {
    return [
      { label: 'UTME / JAMB', value: 'UTME' },
      { label: 'Post-UTME', value: 'Post-UTME' },
      { label: 'Direct Entry', value: 'Direct Entry' },
      { label: 'WAEC (as backup)', value: 'WAEC' },
    ]
  }
  return [
    { label: 'UTME / JAMB', value: 'UTME' },
    { label: 'WAEC', value: 'WAEC' },
    { label: 'NECO', value: 'NECO' },
    { label: 'NABTEB', value: 'NABTEB' },
    { label: 'GCE', value: 'GCE' },
    { label: 'Common Entrance', value: 'Common Entrance' },
  ]
}

function getSubjectList(studentType: OnboardingStudentType | '') {
  if (studentType === 'university') {
    return [
      'Anatomy',
      'Physiology',
      'Biochemistry',
      'Pharmacology',
      'Pathology',
      'Microbiology',
      'Immunology',
      'Surgery',
      'Medicine',
      'Nursing',
      'Engineering Mathematics',
      'Thermodynamics',
      'Fluid Mechanics',
      'Electrical Circuits',
      'Structural Analysis',
      'Programming / Coding',
      'Microeconomics',
      'Macroeconomics',
      'Statistics',
      'Business Law',
      'Accounting',
      'Finance',
      'Marketing',
      'Management',
      'Constitutional Law',
      'Criminal Law',
      'Contract Law',
      'Tort Law',
      'Philosophy',
      'Sociology',
      'Psychology',
      'Mass Communication',
      'English Literature',
      'Linguistics',
      'History',
      'Research Methods',
      'GST / Use of English',
      'ICT / Computer Science',
    ]
  }
  return [
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
}

function getGoalOptions(studentType: OnboardingStudentType | '') {
  if (studentType === 'university') {
    return [
      { label: '🎓 Graduate with First Class', value: 'First Class' },
      { label: '📈 Improve my CGPA', value: 'Improve CGPA' },
      { label: '🔄 Clear my carry-overs', value: 'Clear carry-overs' },
      { label: '🏥 Pass professional exams', value: 'Pass professional exams' },
      { label: '🎯 Prepare for final year', value: 'Final year prep' },
      { label: '📚 Stay on top of coursework', value: 'Stay on top' },
    ]
  }
  return [
    { label: '🎓 Get into university', value: 'Get into university' },
    { label: '📜 Pass my WAEC/NECO', value: 'Pass WAEC/NECO' },
    { label: '🏆 Score 300+ in JAMB', value: 'Score 300+ in JAMB' },
    { label: '📚 Improve my grades', value: 'Improve grades' },
    { label: '🔄 Resit my exams', value: 'Resit exams' },
    { label: '✨ Just exploring', value: 'Exploring' },
  ]
}

type WizardAnswers = {
  studentType: OnboardingStudentType | ''
  examTypes: string[]
  subjects: string[]
  goals: string[]
  studyHoursPerDay: string
}

type OnboardingPayload = WizardAnswers & {
  studentType: OnboardingStudentType
  examType?: string
  goal?: string
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
    studentType: '',
    examTypes: [],
    subjects: [],
    goals: [],
    studyHoursPerDay: '',
  })
  const [customSubject, setCustomSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const firstName = user.name?.split(' ')[0] || 'there'
  const lastStepIndex = 4
  const progressPct = (step / lastStepIndex) * 100

  const examOptions = getExamOptions(answers.studentType)
  const subjectList = getSubjectList(answers.studentType)
  const goalOptions = getGoalOptions(answers.studentType)

  const getErrorMessage = (e: unknown) => {
    const apiError = e as {
      response?: { data?: { message?: string; error?: string } }
      message?: string
    }
    return (
      apiError?.response?.data?.message ||
      apiError?.response?.data?.error ||
      apiError?.message ||
      'Could not save. Please try again.'
    )
  }

  const postOnboarding = async (body: OnboardingPayload) => {
    const token = await getFirebaseToken()
    if (!token) {
      throw new Error('You are not signed in. Please log in again and retry onboarding.')
    }

    // Try supported backend variants for compatibility across deployments.
    const endpoints = ['/users/onboarding', '/user/onboard']
    let lastError: unknown = null
    for (const endpoint of endpoints) {
      try {
        await apiClient.post(endpoint, body)
        return
      } catch (e: any) {
        lastError = e
        // If endpoint is missing, try next path.
        if (e?.response?.status === 404) continue
        throw e
      }
    }
    throw lastError || new Error('Onboarding endpoint not found on server.')
  }

  const handleExamToggle = (exam: string) => {
    setAnswers((a) => ({
      ...a,
      examTypes: a.examTypes.includes(exam)
        ? a.examTypes.filter((item) => item !== exam)
        : [...a.examTypes, exam],
    }))
  }

  const handleGoalToggle = (goal: string) => {
    setAnswers((a) => ({
      ...a,
      goals: a.goals.includes(goal)
        ? a.goals.filter((item) => item !== goal)
        : [...a.goals, goal],
    }))
  }

  const handleAddCustomSubject = () => {
    const trimmed = customSubject.trim()
    if (!trimmed) return
    if (answers.subjects.some((sub) => sub.toLowerCase() === trimmed.toLowerCase())) {
      setCustomSubject('')
      return
    }
    setAnswers((a) => ({
      ...a,
      subjects: [...a.subjects, trimmed],
    }))
    setCustomSubject('')
  }

  const handleComplete = async () => {
    if (!answers.studentType) return
    setSaving(true)
    setError('')
    try {
      await postOnboarding({
        ...answers,
        studentType: answers.studentType,
        examType: answers.examTypes[0] || '',
        goal: answers.goals[0] || '',
      })
      onComplete()
    } catch (e) {
      console.error(e)
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    setError('')
    try {
      await postOnboarding({
        studentType: 'secondary',
        examTypes: [],
        subjects: [],
        goals: ['Exploring'],
        studyHoursPerDay: '',
        examType: '',
        goal: 'Exploring',
      })
      onComplete()
    } catch (e) {
      console.error(e)
      setError(getErrorMessage(e))
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
            <p>
              Let&apos;s set you up in a few quick steps so we can personalise your experience.
            </p>
            <p className="wizard-time">⏱️ Takes less than 2 minutes</p>
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
            <div className="wizard-emoji">🎓</div>
            <h2>Which best describes you?</h2>
            <p>We&apos;ll personalise your experience based on your level</p>
            <div className="wizard-student-type-grid">
              {STUDENT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`wizard-option-card ${answers.studentType === opt.value ? 'selected' : ''}`}
                  onClick={() =>
                    setAnswers((a) => ({
                      ...a,
                      studentType: opt.value,
                      examTypes: [],
                    }))
                  }
                >
                  <span className="woc-label">{opt.label}</span>
                  <span className="woc-desc">{opt.desc}</span>
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
                disabled={!answers.studentType}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <h2>What are you preparing for?</h2>
            <p>We&apos;ll highlight the most relevant tools and content</p>
            <div className="wizard-options-grid">
              {examOptions.map((exam) => (
                <button
                  key={exam.value}
                  type="button"
                  className={`wizard-option ${answers.examTypes.includes(exam.value) ? 'selected' : ''}`}
                  onClick={() => handleExamToggle(exam.value)}
                >
                  {exam.label}
                </button>
              ))}
            </div>
            <div className="wizard-nav">
              <button type="button" className="wizard-btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                type="button"
                className="wizard-btn-primary"
                onClick={() => setStep(3)}
                disabled={answers.examTypes.length === 0}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step">
            <h2>
              {answers.studentType === 'university'
                ? 'Which courses or topics are you studying?'
                : 'Which subjects are you studying?'}
            </h2>
            <p>Select all that apply — you can change these later</p>
            <div className="wizard-subjects-grid">
              {subjectList.map((sub) => (
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
            <div className="wizard-custom-subject">
              <input
                type="text"
                value={customSubject}
                placeholder="Add custom subject (e.g. Technical Drawing, ICT)"
                onChange={(e) => setCustomSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomSubject()
                  }
                }}
                className="wizard-custom-input"
              />
              <button type="button" className="wizard-btn-secondary" onClick={handleAddCustomSubject}>
                + Add Subject
              </button>
            </div>
            <p className="wizard-selected-count">{answers.subjects.length} selected</p>
            <div className="wizard-nav">
              <button type="button" className="wizard-btn-secondary" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                type="button"
                className="wizard-btn-primary"
                onClick={() => setStep(4)}
                disabled={answers.subjects.length === 0}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-step">
            <h2>What&apos;s your main goal?</h2>
            <div className="wizard-options-grid">
              {goalOptions.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`wizard-option ${answers.goals.includes(g.value) ? 'selected' : ''}`}
                  onClick={() => handleGoalToggle(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <h3 style={{ marginTop: 24 }}>How many hours can you study per day?</h3>
            <div className="wizard-options-row">
              {["I'm not sure yet", 'Less than 1 hour', '1-2 hours', '2-3 hours', '3+ hours'].map((h) => (
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
              <button type="button" className="wizard-btn-secondary" onClick={() => setStep(3)}>
                ← Back
              </button>
              <button
                type="button"
                className="wizard-btn-primary"
                onClick={handleComplete}
                disabled={answers.goals.length === 0 || saving}
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
