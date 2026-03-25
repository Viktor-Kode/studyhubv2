'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import {
  Upload,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Download,
  Eye,
  X,
  Check,
  BookOpen,
  Clock,
  Award,
  Loader
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'

const ASSESSMENT_TYPES = [
  // Monochrome assessment accents (no red/amber/green/purple).
  { value: 'exam', label: 'Exam', color: '#0F172A' },
  { value: 'test', label: 'Test', color: '#0F172A' },
  { value: 'assignment', label: 'Assignment', color: '#0F172A' },
  { value: 'classwork', label: 'Classwork', color: '#0F172A' },
  { value: 'quiz', label: 'Quiz', color: '#0F172A' },
]

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
]

interface Question {
  text: string
  type: string
  options?: string[]
  answer: string
  explanation?: string
  marks?: number
  order?: number
}

interface QuestionSet {
  _id: string
  title: string
  subject?: string
  classLevel?: string
  assessmentType?: string
  totalMarks?: number
  duration?: number
  instructions?: string
  sourceFileName?: string
  status?: string
  createdAt?: string
  questions?: Question[]
}

const TEACHER_QGEN_KEY = 'teacher_qgen_session'

export default function QuestionGeneratorPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'sets' | 'edit'>('generate')
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(false)
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null)
  const [previewSet, setPreviewSet] = useState<QuestionSet | null>(null)

  useEffect(() => {
    fetchQuestionSets()
  }, [])

  const handleStartNew = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(TEACHER_QGEN_KEY)
      } catch {
        // ignore
      }
    }
    setEditingSet(null)
    setActiveTab('generate')
  }

  const fetchQuestionSets = async () => {
    try {
      const res = await apiClient.get('/teacher/question-sets')
      if (res.data?.success) setQuestionSets(res.data.sets || [])
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question set?')) return
    try {
      await apiClient.delete(`/teacher/question-sets/${id}`)
      setQuestionSets((prev) => prev.filter((s) => s._id !== id))
      if (editingSet?._id === id) setEditingSet(null)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleEdit = async (set: QuestionSet) => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/teacher/question-sets/${set._id}`)
      if (res.data?.success) {
        setEditingSet(res.data.set)
        setActiveTab('edit')
      }
    } catch (err) {
      console.error('Edit fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // On initial load, check for a saved editing session and restore it
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(TEACHER_QGEN_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { setId?: string; title?: string; savedAt?: string }
      if (!saved?.setId) return

      const existing = questionSets.find((s) => s._id === saved.setId)
      if (existing) {
        handleEdit(existing)
      } else {
        handleEdit({ _id: saved.setId } as QuestionSet)
      }
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSets])

  const handleGeneratedFromTab = (set: QuestionSet) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          TEACHER_QGEN_KEY,
          JSON.stringify({
            setId: set._id,
            title: set.title,
            savedAt: new Date().toISOString(),
          })
        )
      } catch {
        // ignore storage errors
      }
    }
    setQuestionSets((prev) => [set, ...prev])
    setEditingSet(set)
    setActiveTab('edit')
  }

  const handlePreview = async (set: QuestionSet) => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/teacher/question-sets/${set._id}`)
      if (res.data?.success) setPreviewSet(res.data.set)
    } catch (err) {
      console.error('Preview error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="teacher-page">
        <BackButton label="Dashboard" href="/dashboard/teacher" />

        <div className="teacher-header">
          <div>
            <h1>Question Generator</h1>
            <p>Upload documents and generate assessments with AI</p>
          </div>
          <button
            type="button"
            className="new-set-btn"
            onClick={handleStartNew}
          >
            <Plus size={16} /> New Assessment
          </button>
        </div>

        <div className="teacher-stats">
          <div className="tstat-card">
            <BookOpen size={18} color="#0F172A" />
            <div>
              <span className="tstat-num">{questionSets.length}</span>
              <span className="tstat-label">Total Sets</span>
            </div>
          </div>
          <div className="tstat-card">
            <Award size={18} color="#0F172A" />
            <div>
              <span className="tstat-num">
                {questionSets.filter((s) => s.status === 'published').length}
              </span>
              <span className="tstat-label">Published</span>
            </div>
          </div>
          <div className="tstat-card">
            <FileText size={18} color="#0F172A" />
            <div>
              <span className="tstat-num">
                {questionSets.filter((s) => s.status === 'draft').length}
              </span>
              <span className="tstat-label">Drafts</span>
            </div>
          </div>
        </div>

        <div className="teacher-tabs">
          {[
            { id: 'generate' as const, label: '+ Generate' },
            { id: 'sets' as const, label: `My Sets (${questionSets.length})` },
            ...(editingSet ? [{ id: 'edit' as const, label: 'Edit Questions' }] : []),
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`teacher-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'generate' && (
          <GenerateTab
            onGenerated={handleGeneratedFromTab}
          />
        )}

        {activeTab === 'sets' && (
          <MySetsTab
            sets={questionSets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPreview={handlePreview}
          />
        )}

        {activeTab === 'edit' && editingSet && (
          <EditTab
            set={editingSet}
            onSaved={(updated) => {
              setQuestionSets((prev) =>
                prev.map((s) => (s._id === updated._id ? updated : s))
              )
              setEditingSet(updated)
            }}
          />
        )}

        {previewSet && (
          <PreviewModal set={previewSet} onClose={() => setPreviewSet(null)} />
        )}
      </div>
    </ProtectedRoute>
  )
}

// ─── Generate Tab ────────────────────────────────────
function GenerateTab({ onGenerated }: { onGenerated: (set: QuestionSet) => void }) {
  const [form, setForm] = useState({
    title: '',
    subject: '',
    classLevel: '',
    assessmentType: 'test',
    questionCount: 10,
    marksPerQuestion: 2,
    questionTypes: ['mcq' as string],
    duration: 60,
    instructions: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f: File | undefined) => {
    if (!f) return
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    if (!allowed.includes(f.type)) {
      setError('Only PDF, Word (.docx) or text files allowed')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB')
      return
    }
    setFile(f)
    setError('')
    if (!form.title) {
      setForm((prev) => ({
        ...prev,
        title: f.name.replace(/\.[^/.]+$/, ''),
      }))
    }
  }

  const toggleQuestionType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.length > 1
          ? prev.questionTypes.filter((t) => t !== type)
          : prev.questionTypes
        : [...prev.questionTypes, type],
    }))
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a document')
      return
    }
    if (!form.title) {
      setError('Please enter a title')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('document', file)
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, Array.isArray(val) ? val.join(',') : String(val))
      })

      const res = await apiClient.post('/teacher/generate', formData)

      const data = res.data
      if (!data?.success) {
        setError(data?.error || 'Generation failed')
        return
      }
      onGenerated(data.questionSet)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error || (err as Error).message
      setError('Something went wrong: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="generate-tab">
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files[0])
        }}
        onClick={() => document.getElementById('teacher-file-input')?.click()}
      >
        <input
          id="teacher-file-input"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {file ? (
          <div className="file-selected">
            <FileText size={32} color="#0F172A" />
            <div>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
            <button
              type="button"
              className="remove-file-btn"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <Upload size={36} color="#9CA3AF" />
            <p className="upload-title">Drop your document here</p>
            <p className="upload-sub">PDF, Word (.docx) or Text file — max 10MB</p>
            <button type="button" className="upload-browse-btn">
              Browse Files
            </button>
          </div>
        )}
      </div>

      <div className="generate-form">
        <div className="form-row">
          <div className="form-group">
            <label>Assessment Title *</label>
            <input
              className="teacher-input"
              placeholder="e.g. Chemistry Mid-Term Test"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              className="teacher-input"
              placeholder="e.g. Chemistry, Mathematics"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Class / Level</label>
            <input
              className="teacher-input"
              placeholder="e.g. SS2, JSS3, 200 Level"
              value={form.classLevel}
              onChange={(e) => setForm((p) => ({ ...p, classLevel: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Assessment Type *</label>
            <div className="type-chips">
              {ASSESSMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-chip ${form.assessmentType === t.value ? 'active' : ''}`}
                  style={
                    form.assessmentType === t.value
                      ? { background: t.color, borderColor: t.color, color: 'white' }
                      : {}
                  }
                  onClick={() =>
                    setForm((p) => ({ ...p, assessmentType: t.value }))
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-row three-col">
          <div className="form-group">
            <label>Number of Questions *</label>
            <input
              className="teacher-input"
              type="number"
              min={1}
              max={100}
              value={form.questionCount}
              onChange={(e) =>
                setForm((p) => ({ ...p, questionCount: Number(e.target.value) }))
              }
            />
          </div>
          <div className="form-group">
            <label>Marks per Question</label>
            <input
              className="teacher-input"
              type="number"
              min={0.5}
              step={0.5}
              value={form.marksPerQuestion}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  marksPerQuestion: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              className="teacher-input"
              type="number"
              min={5}
              value={form.duration}
              onChange={(e) =>
                setForm((p) => ({ ...p, duration: Number(e.target.value) }))
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>Question Types</label>
          <div className="qtype-options">
            {QUESTION_TYPES.map((t) => (
              <label key={t.value} className="qtype-option">
                <input
                  type="checkbox"
                  checked={form.questionTypes.includes(t.value)}
                  onChange={() => toggleQuestionType(t.value)}
                />
                <span
                  className={`qtype-label ${form.questionTypes.includes(t.value) ? 'checked' : ''}`}
                >
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Instructions (optional)</label>
          <textarea
            className="teacher-input teacher-textarea"
            placeholder="e.g. Answer all questions. Time allowed: 60 minutes."
            value={form.instructions}
            onChange={(e) =>
              setForm((p) => ({ ...p, instructions: e.target.value }))
            }
            rows={3}
          />
        </div>

        <div className="total-marks-preview">
          <span>Total Marks:</span>
          <strong>{form.questionCount * form.marksPerQuestion}</strong>
          <span className="marks-breakdown">
            ({form.questionCount} questions × {form.marksPerQuestion} marks)
          </span>
        </div>

        {error && <div className="teacher-error">{error}</div>}

        <button
          type="button"
          className="generate-btn"
          onClick={handleSubmit}
          disabled={loading || !file}
        >
          {loading ? (
            <>
              <Loader size={18} className="spin" />
              Generating {form.questionCount} questions...
            </>
          ) : (
            <>
              <Plus size={18} />
              Generate Questions
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── My Sets Tab ─────────────────────────────────────
function MySetsTab({
  sets,
  onEdit,
  onDelete,
  onPreview,
}: {
  sets: QuestionSet[]
  onEdit: (set: QuestionSet) => void
  onDelete: (id: string) => void
  onPreview: (set: QuestionSet) => void
}) {
  if (sets.length === 0)
    return (
      <div className="empty-sets">
        <FileText size={48} color="#E5E7EB" />
        <h3>No question sets yet</h3>
        <p>Upload a document and generate your first assessment</p>
      </div>
    )

  return (
    <div className="sets-list">
      {sets.map((set) => {
        const typeConfig = ASSESSMENT_TYPES.find(
          (t) => t.value === set.assessmentType
        )
        return (
          <div key={set._id} className="set-card">
            <div className="set-card-left">
              <div className="set-card-top">
                <span
                  className="assessment-badge"
                  style={{
                    background: typeConfig
                      ? `${typeConfig.color}20`
                      : '#E5E7EB',
                    color: typeConfig?.color || '#374151',
                  }}
                >
                  {typeConfig?.label || set.assessmentType}
                </span>
                <span className={`status-badge ${set.status}`}>{set.status}</span>
              </div>
              <h3 className="set-title">{set.title}</h3>
              <div className="set-meta">
                {set.subject && <span>{set.subject}</span>}
                {set.classLevel && <span>• {set.classLevel}</span>}
                <span>• {set.totalMarks} marks</span>
                <span>• {set.duration} mins</span>
              </div>
              {set.sourceFileName && (
                <div className="set-source">
                  <FileText size={12} />
                  {set.sourceFileName}
                </div>
              )}
              <span className="set-date">
                {set.createdAt
                  ? new Date(set.createdAt).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''}
              </span>
            </div>
            <div className="set-card-actions">
              <button
                type="button"
                className="set-action-btn preview"
                onClick={() => onPreview(set)}
                title="Preview"
              >
                <Eye size={15} />
              </button>
              <button
                type="button"
                className="set-action-btn edit"
                onClick={() => onEdit(set)}
                title="Edit"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="set-action-btn delete"
                onClick={() => onDelete(set._id)}
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Edit Tab ─────────────────────────────────────────
function EditTab({
  set,
  onSaved,
}: {
  set: QuestionSet
  onSaved: (updated: QuestionSet) => void
}) {
  const [questions, setQuestions] = useState<Question[]>(set.questions || [])
  const [meta, setMeta] = useState({
    title: set.title,
    subject: set.subject || '',
    classLevel: set.classLevel || '',
    assessmentType: set.assessmentType || 'test',
    duration: set.duration || 60,
    instructions: set.instructions || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState(0)

  const updateQuestion = (index: number, field: string, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    )
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const options = [...(q.options || [])]
        options[oIndex] = value
        return { ...q, options }
      })
    )
  }

  const addQuestion = () => {
    const newQ: Question = {
      text: '',
      type: 'mcq',
      options: ['A. ', 'B. ', 'C. ', 'D. '],
      answer: '',
      explanation: '',
      marks: questions[0]?.marks || 1,
      order: questions.length + 1,
    }
    setQuestions((prev) => [...prev, newQ])
    setExpandedIndex(questions.length)
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return
    setQuestions((prev) => prev.filter((_, i) => i !== index))
    if (expandedIndex >= index)
      setExpandedIndex(Math.max(0, expandedIndex - 1))
  }

  const moveQuestion = (index: number, direction: number) => {
    const newQ = [...questions]
    const target = index + direction
    if (target < 0 || target >= newQ.length) return
    ;[newQ[index], newQ[target]] = [newQ[target], newQ[index]]
    setQuestions(newQ)
    setExpandedIndex(target)
  }

  const handleSave = async (status: string) => {
    setSaving(true)
    try {
      const res = await apiClient.put(`/teacher/question-sets/${set._id}`, {
        ...meta,
        questions,
        status,
      })
      if (res.data?.success) {
        onSaved(res.data.set)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadQuestions = () => {
    const content = formatQuestionsOnly(meta, questions)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meta.title} - Questions.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAnswers = () => {
    const content = formatAnswersOnly(meta, questions)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meta.title} - Answers.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="edit-tab">
      <div className="edit-header">
        <div className="edit-meta-grid">
          <input
            className="edit-title-input"
            value={meta.title}
            onChange={(e) => setMeta((p) => ({ ...p, title: e.target.value }))}
            placeholder="Assessment Title"
          />
          <div className="edit-meta-row">
            <input
              className="teacher-input"
              placeholder="Subject"
              value={meta.subject}
              onChange={(e) => setMeta((p) => ({ ...p, subject: e.target.value }))}
            />
            <input
              className="teacher-input"
              placeholder="Class / Level"
              value={meta.classLevel}
              onChange={(e) =>
                setMeta((p) => ({ ...p, classLevel: e.target.value }))
              }
            />
            <input
              className="teacher-input"
              type="number"
              placeholder="Duration (mins)"
              value={meta.duration}
              onChange={(e) =>
                setMeta((p) => ({
                  ...p,
                  duration: Number(e.target.value),
                }))
              }
            />
            <select
              className="teacher-input"
              value={meta.assessmentType}
              onChange={(e) =>
                setMeta((p) => ({ ...p, assessmentType: e.target.value }))
              }
            >
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="edit-actions">
          <span className="question-count-badge">
            {questions.length} Questions •{' '}
            {questions.reduce((s, q) => s + (q.marks || 1), 0)} Marks
          </span>
          <button
            type="button"
            className="download-btn"
            onClick={handleDownloadQuestions}
          >
            <Download size={15} /> Download Questions
          </button>
          <button
            type="button"
            className="download-btn"
            onClick={handleDownloadAnswers}
          >
            <Download size={15} /> Download Answers
          </button>
          <button
            type="button"
            className="save-draft-btn"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            {saving ? 'Saving...' : saved ? <><Check size={15} /> Saved!</> : 'Save Draft'}
          </button>
          <button
            type="button"
            className="publish-btn"
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            Publish
          </button>
        </div>
      </div>

      <div className="questions-list">
        {questions.map((q, index) => (
          <div
            key={index}
            className={`question-card ${expandedIndex === index ? 'expanded' : ''}`}
          >
            <div
              className="question-header"
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? -1 : index)
              }
            >
              <div className="qheader-left">
                <span className="q-number">Q{index + 1}</span>
                <span className="q-type-tag">
                  {q.type?.replace('_', ' ')}
                </span>
                <span className="q-preview">
                  {q.text
                    ? q.text.slice(0, 60) + (q.text.length > 60 ? '...' : '')
                    : 'Empty question'}
                </span>
              </div>
              <div className="qheader-right">
                <span className="q-marks">
                  {q.marks} mk{(q.marks ?? 1) !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  className="q-move-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveQuestion(index, -1)
                  }}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="q-move-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveQuestion(index, 1)
                  }}
                  disabled={index === questions.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="q-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeQuestion(index)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {expandedIndex === index && (
              <div className="question-editor">
                <div className="form-group">
                  <label>Question</label>
                  <textarea
                    className="teacher-input"
                    rows={3}
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(index, 'text', e.target.value)
                    }
                    placeholder="Enter question text..."
                  />
                </div>

                <div className="editor-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      className="teacher-input"
                      value={q.type}
                      onChange={(e) => {
                        const type = e.target.value
                        updateQuestion(index, 'type', type)
                        if (type === 'true_false') {
                          updateQuestion(index, 'options', ['True', 'False'])
                        } else if (type === 'short_answer') {
                          updateQuestion(index, 'options', [])
                        } else {
                          updateQuestion(index, 'options', [
                            'A. ',
                            'B. ',
                            'C. ',
                            'D. ',
                          ])
                        }
                      }}
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marks</label>
                    <input
                      className="teacher-input"
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={q.marks}
                      onChange={(e) =>
                        updateQuestion(index, 'marks', parseFloat(e.target.value))
                      }
                    />
                  </div>
                </div>

                {q.type === 'mcq' && (
                  <div className="form-group">
                    <label>Options</label>
                    <div className="options-list">
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} className="option-row">
                          <input
                            type="radio"
                            name={`answer-${index}`}
                            checked={q.answer === opt}
                            onChange={() =>
                              updateQuestion(index, 'answer', opt)
                            }
                            title="Mark as correct answer"
                          />
                          <input
                            className="teacher-input option-input"
                            value={opt}
                            onChange={(e) =>
                              updateOption(index, oi, e.target.value)
                            }
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          />
                          {q.answer === opt && (
                            <span className="correct-indicator">
                              <Check size={14} /> Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="option-hint">
                      Click the radio button to mark the correct answer
                    </p>
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="form-group">
                    <label>Correct Answer</label>
                    <div className="tf-options">
                      {['True', 'False'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          className={`tf-btn ${q.answer === val ? 'active' : ''}`}
                          onClick={() =>
                            updateQuestion(index, 'answer', val)
                          }
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="form-group">
                    <label>Model Answer</label>
                    <textarea
                      className="teacher-input"
                      rows={2}
                      value={q.answer}
                      onChange={(e) =>
                        updateQuestion(index, 'answer', e.target.value)
                      }
                      placeholder="Enter the expected answer..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Explanation (optional)</label>
                  <textarea
                    className="teacher-input"
                    rows={2}
                    value={q.explanation || ''}
                    onChange={(e) =>
                      updateQuestion(index, 'explanation', e.target.value)
                    }
                    placeholder="Explain why this is the correct answer..."
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          className="add-question-btn"
          onClick={addQuestion}
        >
          <Plus size={16} /> Add Question
        </button>
      </div>
    </div>
  )
}

// ─── Preview Modal ────────────────────────────────────
function PreviewModal({
  set,
  onClose,
}: {
  set: QuestionSet
  onClose: () => void
}) {
  const typeConfig = ASSESSMENT_TYPES.find((t) => t.value === set.assessmentType)
  const questions = set.questions || []

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="preview-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="preview-header">
          <div>
            <h2>{set.title}</h2>
            <div className="preview-meta">
              <span
                style={{
                  color: typeConfig?.color,
                  fontWeight: 700,
                }}
              >
                {typeConfig?.label}
              </span>
              {set.subject && <span>• {set.subject}</span>}
              {set.classLevel && <span>• {set.classLevel}</span>}
              <span>• {set.totalMarks} marks</span>
              <span>• {set.duration} mins</span>
            </div>
            {set.instructions && (
              <p className="preview-instructions">
                <strong>Instructions:</strong> {set.instructions}
              </p>
            )}
          </div>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="preview-questions">
          {questions.map((q, i) => (
            <div key={i} className="preview-question">
              <div className="pq-header">
                <span className="pq-number">{i + 1}.</span>
                <span className="pq-text">{q.text}</span>
                <span className="pq-marks">
                  ({q.marks} mk{(q.marks ?? 1) !== 1 ? 's' : ''})
                </span>
              </div>
              {q.options && q.options.length > 0 && (
                <ul className="pq-options">
                  {q.options.map((opt, oi) => (
                    <li
                      key={oi}
                      className={`pq-option ${opt === q.answer ? 'correct' : ''}`}
                    >
                      {opt === q.answer && <Check size={13} />}
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === 'short_answer' && (
                <div className="pq-answer">
                  <strong>Answer:</strong> {q.answer}
                </div>
              )}
              {q.explanation && (
                <div className="pq-explanation">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function buildDownloadHeader(
  meta: {
    title: string
    assessmentType?: string
    subject?: string
    classLevel?: string
    duration?: number
    instructions?: string
  },
  questions: Question[]
) {
  const typeConfig = ASSESSMENT_TYPES.find(
    (t) => t.value === meta.assessmentType
  )
  let out = ''
  out += `${meta.title}\n`
  out += `${'='.repeat(meta.title.length)}\n\n`
  out += `Type: ${typeConfig?.label || meta.assessmentType}\n`
  if (meta.subject) out += `Subject: ${meta.subject}\n`
  if (meta.classLevel) out += `Class: ${meta.classLevel}\n`
  out += `Duration: ${meta.duration} minutes\n`
  out += `Total Marks: ${questions.reduce((s, q) => s + (q.marks || 1), 0)}\n`
  if (meta.instructions) out += `\nInstructions: ${meta.instructions}\n`
  out += `\n${'─'.repeat(50)}\n\n`

  return out
}

function formatQuestionsOnly(
  meta: {
    title: string
    assessmentType?: string
    subject?: string
    classLevel?: string
    duration?: number
    instructions?: string
  },
  questions: Question[]
) {
  let out = buildDownloadHeader(meta, questions)

  questions.forEach((q, i) => {
    out += `${i + 1}. ${q.text} (${q.marks} mark${(q.marks ?? 1) !== 1 ? 's' : ''})\n`
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt) => {
        out += `   ${opt}\n`
      })
    }
    out += '\n'
  })

  return out
}

function formatAnswersOnly(
  meta: {
    title: string
    assessmentType?: string
    subject?: string
    classLevel?: string
    duration?: number
    instructions?: string
  },
  questions: Question[]
) {
  let out = buildDownloadHeader(
    { ...meta, title: `${meta.title} — Answer Key` },
    questions
  )

  questions.forEach((q, i) => {
    out += `${i + 1}. Answer: ${q.answer}\n`
    if (q.explanation) out += `   Explanation: ${q.explanation}\n`
  })

  return out
}
