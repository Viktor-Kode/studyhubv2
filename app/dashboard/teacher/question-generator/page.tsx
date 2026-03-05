'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import GeneratorTabsHeader from '@/components/dashboard/GeneratorTabsHeader'
import { usePersistedState } from '@/hooks/usePersistedState'
import { questionsApi } from '@/lib/api/questions'
import { Zap, Save, Trash2, Edit2, CheckCircle, Lightbulb, Loader2 } from 'lucide-react'

interface GenForm {
  subject: string
  topic: string
  difficulty: string
  type: string
  count: number
  examType: string
}

interface GenQuestion {
  id: string
  questionText: string
  options?: Record<string, string>
  correctAnswer?: string
  explanation?: string
  difficulty?: string
  type?: string
  totalMarks?: number
  subject?: string
  topic?: string
  saved?: boolean
}

function QuestionCard({
  question,
  index,
  isEditing,
  onEdit,
  onSaveEdit,
  onDelete,
  onSave,
}: {
  question: GenQuestion
  index: number
  isEditing: boolean
  onEdit: () => void
  onSaveEdit: (q: GenQuestion) => void
  onDelete: () => void
  onSave: () => void
}) {
  const [edited, setEdited] = useState(question)

  if (isEditing) {
    return (
      <div className="question-card editing">
        <div className="edit-header">
          <span className="edit-header-text"><Edit2 size={14} /> Editing Question {index + 1}</span>
          <button onClick={() => onSaveEdit(edited)} className="save-edit-btn" type="button">
            <CheckCircle size={14} /> Save Changes
          </button>
        </div>
        <textarea
          className="edit-textarea"
          value={edited.questionText}
          onChange={(e) => setEdited({ ...edited, questionText: e.target.value })}
          rows={3}
        />
        {edited.options &&
          Object.entries(edited.options).map(([key, val]) => (
            <div key={key} className="edit-option">
              <span className="option-key">{key}.</span>
              <input
                className="edit-input"
                value={val}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    options: { ...edited.options!, [key]: e.target.value },
                  })
                }
              />
              <button
                type="button"
                className={`correct-toggle ${edited.correctAnswer === key ? 'correct' : ''}`}
                onClick={() => setEdited({ ...edited, correctAnswer: key })}
              >
                {edited.correctAnswer === key ? <CheckCircle size={16} /> : '○'}
              </button>
            </div>
          ))}
        <div className="edit-section">
          <label>Explanation</label>
          <textarea
            className="edit-textarea small"
            value={edited.explanation || ''}
            onChange={(e) => setEdited({ ...edited, explanation: e.target.value })}
            rows={2}
          />
        </div>
        <div className="edit-marks">
          <label>Marks</label>
          <input
            type="number"
            className="edit-input small"
            value={edited.totalMarks || 1}
            onChange={(e) => setEdited({ ...edited, totalMarks: parseInt(e.target.value) || 1 })}
            min={1}
            max={20}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`question-card ${question.saved ? 'saved' : ''}`}>
      <div className="qcard-header">
        <span className="qcard-num">Q{index + 1}</span>
        <div className="qcard-badges">
          <span className={`badge diff-${question.difficulty || 'medium'}`}>
            {question.difficulty || 'medium'}
          </span>
          <span className="badge type-badge">{question.type || 'MCQ'}</span>
          {question.totalMarks && (
            <span className="badge marks-badge">{question.totalMarks} mark(s)</span>
          )}
        </div>
        <div className="qcard-actions">
          <button type="button" onClick={onEdit} className="icon-btn" title="Edit">
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={onSave}
            className="icon-btn save"
            title="Save to bank"
            disabled={question.saved}
          >
            {question.saved ? <CheckCircle size={16} /> : <Save size={16} />}
          </button>
          <button type="button" onClick={onDelete} className="icon-btn delete" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="qcard-text">{question.questionText}</p>
      {question.options && (
        <div className="qcard-options">
          {Object.entries(question.options).map(([key, val]) => (
            <div
              key={key}
              className={`qcard-option ${question.correctAnswer === key ? 'correct-option' : ''}`}
            >
              <span className="option-key">{key}.</span>
              <span>{val}</span>
              {question.correctAnswer === key && <span className="tick">✓</span>}
            </div>
          ))}
        </div>
      )}
      {question.explanation && (
        <div className="qcard-explanation">
          <Lightbulb size={16} className="qcard-explanation-icon" />
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

const DEFAULT_FORM: GenForm = {
  subject: '',
  topic: '',
  difficulty: 'medium',
  type: 'MCQ',
  count: 5,
  examType: 'JAMB',
}

export default function QuestionGeneratorPage() {
  const [form, setForm] = usePersistedState<GenForm>('gen_form', DEFAULT_FORM)
  const [questions, setQuestions] = useState<GenQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!form.subject || !form.topic) {
      alert('Please fill in subject and topic')
      return
    }
    setLoading(true)
    try {
      const res = await questionsApi.generateWithMeta({
        subject: form.subject,
        topic: form.topic,
        difficulty: form.difficulty,
        type: form.type,
        count: form.count,
        examType: form.examType,
        dryRun: true,
      })
      if (res.success && res.questions?.length) {
        setQuestions(
          res.questions.map((q: any, i: number) => ({
            ...q,
            id: `q-${Date.now()}-${i}`,
            saved: false,
          }))
        )
      } else {
        alert('No questions generated. Try again.')
      }
    } catch {
      alert('Generation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuestion = async (q: GenQuestion) => {
    if (q.saved) return
    try {
      await questionsApi.saveToBank({
        questionText: q.questionText,
        options: q.options || undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        type: q.type,
        totalMarks: q.totalMarks,
        subject: form.subject,
        topic: form.topic,
      })
      setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, saved: true } : x)))
    } catch {
      alert('Failed to save question.')
    }
  }

  const handleSaveAll = async () => {
    const unsaved = questions.filter((q) => !q.saved)
    for (const q of unsaved) {
      await handleSaveQuestion(q)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="generator-page w-full min-w-0">
        <BackButton label="Dashboard" href="/dashboard" />
        <GeneratorTabsHeader />

        <div className="generator-form">
          <div className="form-row">
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Topic</label>
              <input
                type="text"
                placeholder="e.g. Quadratic Equations"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row three-col">
            <div className="form-group">
              <label>Question Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="form-input"
              >
                <option value="MCQ">Multiple Choice</option>
                <option value="theory">Theory</option>
                <option value="fill-blank">Fill in Blank</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="form-input"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Exam Type</label>
              <select
                value={form.examType}
                onChange={(e) => setForm({ ...form, examType: e.target.value })}
                className="form-input"
              >
                <option value="JAMB">JAMB</option>
                <option value="WAEC">WAEC</option>
                <option value="NECO">NECO</option>
                <option value="test">Class Test</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Final Exam</option>
              </select>
            </div>
          </div>

          <div className="form-row count-row">
            <div className="form-group count-group">
              <label>Number of Questions</label>
              <div className="count-control">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, count: Math.max(1, form.count - 1) })}
                  className="count-btn"
                >
                  −
                </button>
                <span className="count-display">{form.count}</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, count: Math.min(20, form.count + 1) })}
                  className="count-btn"
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              className="generate-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner"><Loader2 size={18} className="animate-spin" /> Generating...</span>
              ) : (
                <>
                  <Zap size={18} /> Generate Questions
                </>
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="generating-state">
            <div className="spinner" />
            <p>
              AI is generating {form.count} {form.type} questions on <strong>{form.topic}</strong>...
            </p>
          </div>
        )}

        {questions.length > 0 && (
          <div className="questions-section">
            <div className="questions-header">
              <h3>Generated Questions ({questions.length})</h3>
              <div className="bulk-actions">
                <button type="button" className="save-all-btn" onClick={handleSaveAll}>
                  <Save size={14} /> Save All
                </button>
                <button type="button" className="clear-btn" onClick={() => setQuestions([])}>
                  <Trash2 size={14} /> Clear
                </button>
              </div>
            </div>

            {questions.map((q, index) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={index}
                isEditing={editingId === q.id}
                onEdit={() => setEditingId(q.id)}
                onSaveEdit={(updated) => {
                  setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...updated, id: q.id } : x)))
                  setEditingId(null)
                }}
                onDelete={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}
                onSave={() => handleSaveQuestion(q)}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
