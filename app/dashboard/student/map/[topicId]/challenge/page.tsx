'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  CHALLENGE_PASS_MARK,
  CHALLENGE_XP_PER_QUESTION,
  TOTAL_CHALLENGE_QUESTIONS,
  MAX_CHALLENGE_XP,
  type ChallengeQuestion,
  type ChallengeSubmitResult,
  type StudyPathTopic,
} from '@/lib/data/studyPath'
import {
  getStudyPath,
  getStudyPathChallenge,
  submitStudyPathChallenge,
  retryStudyPathChallenge
} from '@/src/services/api'
import {
  FiX,
  FiZap,
  FiAward,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRight,
  FiArrowLeft,
  FiBookOpen
} from 'react-icons/fi'
import './challenge.css'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown; error?: unknown; detail?: unknown; issues?: unknown } } }).response
    const data = response?.data
    const message = data?.message || data?.error || data?.detail
    if (typeof message === 'string' && message.trim()) return message
    if (Array.isArray(data?.issues) && data.issues.length) return `Question generation needs another attempt: ${data.issues.join('; ')}`
  }
  if (error instanceof Error && error.message && !/request failed with status code/i.test(error.message)) return error.message
  return fallback
}

function loadCachedTopic(topicId: string): StudyPathTopic | null {
  try {
    const active = localStorage.getItem('studyhelp_active_topic')
    const saved = localStorage.getItem('studyhelp_saved_topics')
    const choices = [
      ...(active ? [JSON.parse(active) as StudyPathTopic] : []),
      ...(saved ? JSON.parse(saved) as StudyPathTopic[] : []),
    ]
    return choices.find((t) => t?.topicId === topicId) || null
  } catch {
    return null
  }
}

export default function UnitChallengePlayer() {
  const params = useParams()
  const router = useRouter()
  const topicId = (params?.topicId as string) || ''

  const [topic, setTopic] = useState<StudyPathTopic | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const [questions, setQuestions] = useState<ChallengeQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>([])

  const [runningXp, setRunningXp] = useState(0)
  const [xpBouncing, setXpBouncing] = useState(false)

  // Practice / Review mode state
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [reviewInitialOpen, setReviewInitialOpen] = useState(false)

  // Submitting & Results
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ChallengeSubmitResult | null>(null)

  // Initial load
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = async () => {
      try {
        const remote = await getStudyPath(topicId)
        const resolved = (remote as StudyPathTopic | null) || loadCachedTopic(topicId)
        if (!cancelled) setTopic(resolved)
      } catch {
        if (!cancelled) setTopic(loadCachedTopic(topicId))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [topicId])

  const allLessonsDone = Boolean(topic?.nodes?.length && topic.nodes.every((n) => n.status === 'completed'))
  const isAlreadyPassed = Boolean(topic?.challenge?.status === 'completed' || topic?.challenge?.passed || topic?.completed)

  // Check if topic is already passed and open review mode on first load
  useEffect(() => {
    if (!loading && topic && isAlreadyPassed && !isPracticeMode && !reviewInitialOpen) {
      setReviewInitialOpen(true)
    }
  }, [loading, topic, isAlreadyPassed, isPracticeMode, reviewInitialOpen])

  // Fetch or generate questions
  const loadQuestions = useCallback(async () => {
    if (!topicId || !allLessonsDone) return
    setGenerating(true)
    setGenerationError(null)
    try {
      const data = await getStudyPathChallenge(topicId)
      if (Array.isArray(data?.questions) && data.questions.length === TOTAL_CHALLENGE_QUESTIONS) {
        setQuestions(data.questions)
      } else {
        throw new Error(data?.message || 'Could not load 10 overview questions.')
      }
    } catch (err) {
      console.error('[Challenge] Generation error:', err)
      const msg = getRequestErrorMessage(err, 'Could not prepare the 10 question overview. Please try again.')
      setGenerationError(msg)
    } finally {
      setGenerating(false)
    }
  }, [topicId, allLessonsDone])

  useEffect(() => {
    if (!loading && topic && allLessonsDone && (!isAlreadyPassed || isPracticeMode) && questions.length === 0 && !generating && !generationError) {
      void loadQuestions()
    }
  }, [loading, topic, allLessonsDone, isAlreadyPassed, isPracticeMode, questions.length, generating, generationError, loadQuestions])

  const backToMap = useCallback(() => {
    if (questionIndex > 0 && !result && questions.length > 0) {
      const ok = window.confirm('Leave challenge? Your progress will not be saved and no partial credit is awarded.')
      if (!ok) return
    }
    router.push(`/dashboard/student/map/${encodeURIComponent(topicId)}`)
  }, [questionIndex, result, questions.length, router, topicId])

  const handleSelectOption = (idx: number) => {
    if (revealed || submitting) return
    setSelectedOpt(idx)
  }

  const handleCheckAnswer = () => {
    if (selectedOpt === null || revealed) return
    const currentQ = questions[questionIndex]
    const isCorrect = selectedOpt === currentQ.correctAnswerIndex

    if (isCorrect) {
      const earnedXp = currentQ.xp || CHALLENGE_XP_PER_QUESTION
      setRunningXp((prev) => prev + earnedXp)
      setXpBouncing(true)
      setTimeout(() => setXpBouncing(false), 400)
    }

    setRevealed(true)
  }

  const handleNextQuestion = async () => {
    const updatedAnswers = [...answers, selectedOpt]
    setAnswers(updatedAnswers)
    setSelectedOpt(null)
    setRevealed(false)

    if (questionIndex + 1 < TOTAL_CHALLENGE_QUESTIONS) {
      setQuestionIndex((prev) => prev + 1)
    } else {
      // Completed all 10 questions -> Submit to backend
      setSubmitting(true)
      try {
        const submissionResult = await submitStudyPathChallenge(topicId, updatedAnswers)
        setResult(submissionResult)

        // Update local cache if available
        try {
          const cached = localStorage.getItem('studyhelp_active_topic')
          if (cached) {
            const parsed = JSON.parse(cached) as StudyPathTopic
            if (parsed.topicId === topicId) {
              if (submissionResult.passed) {
                parsed.completed = true
                parsed.currentProgress = 100
                if (parsed.challenge) {
                  parsed.challenge.status = 'completed'
                  parsed.challenge.bestScore = Math.max(parsed.challenge.bestScore || 0, submissionResult.score)
                  parsed.challenge.bestXp = Math.max(parsed.challenge.bestXp || 0, submissionResult.attemptXp)
                }
              }
              localStorage.setItem('studyhelp_active_topic', JSON.stringify(parsed))
            }
          }
        } catch { /* ignore local cache failure */ }
      } catch (err) {
        console.error('[Challenge] Submit error:', err)
        // Fallback local calculation if backend fails
        const localScore = updatedAnswers.filter((ans, idx) => ans === questions[idx]?.correctAnswerIndex).length
        const localPassed = localScore >= CHALLENGE_PASS_MARK
        setResult({
          score: localScore,
          total: TOTAL_CHALLENGE_QUESTIONS,
          passed: localPassed,
          passMark: CHALLENGE_PASS_MARK,
          attemptXp: localScore * CHALLENGE_XP_PER_QUESTION,
          xpAwarded: isPracticeMode ? 0 : localScore * CHALLENGE_XP_PER_QUESTION,
          maxXp: MAX_CHALLENGE_XP,
          missedNodeIds: [],
          perQuestion: questions.map((q, idx) => ({
            id: q.id,
            correct: updatedAnswers[idx] === q.correctAnswerIndex,
            xp: updatedAnswers[idx] === q.correctAnswerIndex ? (q.xp || CHALLENGE_XP_PER_QUESTION) : 0
          }))
        })
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleRetry = async () => {
    setResult(null)
    setQuestionIndex(0)
    setSelectedOpt(null)
    setRevealed(false)
    setAnswers([])
    setRunningXp(0)
    setGenerating(true)
    setGenerationError(null)
    try {
      const data = await retryStudyPathChallenge(topicId)
      if (Array.isArray(data?.questions) && data.questions.length === TOTAL_CHALLENGE_QUESTIONS) {
        setQuestions(data.questions)
      } else {
        throw new Error(data?.message || 'Could not generate new questions.')
      }
    } catch (err) {
      console.error('[Challenge] Retry error:', err)
      setGenerationError(getRequestErrorMessage(err, 'Could not prepare a new 10 question overview. Please try again.'))
    } finally {
      setGenerating(false)
    }
  }

  const startPracticeMode = () => {
    setReviewInitialOpen(false)
    setIsPracticeMode(true)
    setQuestionIndex(0)
    setSelectedOpt(null)
    setRevealed(false)
    setAnswers([])
    setRunningXp(0)
    setResult(null)
    void loadQuestions()
  }

  const currentQ = questions[questionIndex]
  const isAnswerCorrect = revealed && selectedOpt === currentQ?.correctAnswerIndex

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <main className="unit-challenge-page">
        <div className="unit-challenge-container">

          {/* TOP BAR */}
          <header className="unit-challenge-topbar">
            <div className="unit-challenge-topbar-row">
              <button
                type="button"
                className="unit-challenge-close-btn"
                onClick={backToMap}
                aria-label="Exit challenge"
              >
                <FiX size={20} />
              </button>

              <div className="unit-challenge-progress-bar" aria-label={`Progress: ${questionIndex + 1} of 10`}>
                {Array.from({ length: TOTAL_CHALLENGE_QUESTIONS }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`unit-challenge-seg ${idx <= questionIndex ? 'active' : ''}`}
                  />
                ))}
              </div>

              <div className={`unit-challenge-xp-pill ${xpBouncing ? 'bounce' : ''}`}>
                <FiZap size={16} />
                <span>+{runningXp} XP</span>
              </div>
            </div>

            <div className="unit-challenge-subrow">
              <span className="unit-challenge-badge-chip">
                <FiAward size={12} />
                UNIT CHALLENGE
              </span>
              <span>Question {Math.min(questionIndex + 1, TOTAL_CHALLENGE_QUESTIONS)} of {TOTAL_CHALLENGE_QUESTIONS}</span>
            </div>
          </header>

          {/* BODY / STATES */}
          {loading ? (
            <div className="unit-challenge-centered-state">
              <div className="unit-challenge-spinner" />
              <h2 className="unit-challenge-state-title">Loading topic...</h2>
            </div>
          ) : !allLessonsDone ? (
            <div className="unit-challenge-centered-state">
              <div className="unit-challenge-gold-icon">
                <FiAlertCircle size={32} />
              </div>
              <h2 className="unit-challenge-state-title">Finish lessons first</h2>
              <p className="unit-challenge-state-desc">
                The Unit Challenge unlocks after every node in this study map is completed.
              </p>
              <button type="button" className="unit-challenge-action-btn" onClick={backToMap}>
                Back to map
              </button>
            </div>
          ) : reviewInitialOpen ? (
            // REVIEW / ALREADY COMPLETED STATE
            <div className="unit-challenge-centered-state">
              <div className="unit-challenge-trophy-circle">
                <FiAward size={42} />
              </div>
              <h2 className="unit-challenge-state-title">Map Completed!</h2>
              <p className="unit-challenge-state-desc">
                You previously passed the Unit Challenge for <strong>{topic?.title}</strong> with a best score of {topic?.challenge?.bestScore ?? 0}/10.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, marginTop: 12 }}>
                <button type="button" className="unit-challenge-action-btn gold" onClick={startPracticeMode}>
                  Retake for practice (no XP)
                </button>
                <button type="button" className="unit-challenge-close-btn" style={{ width: '100%', height: 46 }} onClick={backToMap}>
                  Back to map
                </button>
              </div>
            </div>
          ) : generating ? (
            <div className="unit-challenge-centered-state">
              <div className="unit-challenge-spinner" />
              <h2 className="unit-challenge-state-title">Preparing your challenge...</h2>
              <p className="unit-challenge-state-desc">
                Synthesizing 10 overview questions connecting all nodes and source facts.
              </p>
            </div>
          ) : generationError ? (
            <div className="unit-challenge-centered-state">
              <div className="unit-challenge-gold-icon">
                <FiAlertCircle size={32} />
              </div>
              <h2 className="unit-challenge-state-title">Challenge unavailable</h2>
              <p className="unit-challenge-state-desc">{generationError}</p>
              <div className="unit-challenge-error-actions">
                <button type="button" className="unit-challenge-action-btn" onClick={() => void loadQuestions()}>
                  <FiRefreshCw size={16} /> Try again
                </button>
                <button type="button" className="unit-challenge-close-btn" style={{ height: 50, padding: '0 16px' }} onClick={backToMap}>
                  Back to map
                </button>
              </div>
            </div>
          ) : result ? (
            // RESULT SCREEN (PASS / FAIL)
            <section className="unit-challenge-result-card">
              {result.passed && (
                <div className="celebration-sparkles">
                  <span className="sparkle" />
                  <span className="sparkle" />
                  <span className="sparkle" />
                  <span className="sparkle" />
                  <span className="sparkle" />
                </div>
              )}

              <div className="unit-challenge-trophy-circle">
                <FiAward size={42} />
              </div>

              <h2 className="unit-challenge-state-title" style={{ fontSize: 28, marginTop: 4 }}>
                {result.passed ? 'Map completed!' : 'Challenge Incomplete'}
              </h2>

              <div className={`unit-challenge-result-score ${result.passed ? 'passed' : 'failed'}`}>
                {result.score} <small>/ {result.total}</small>
              </div>

              <p className="unit-challenge-state-desc" style={{ marginTop: 0 }}>
                {result.passed
                  ? `Congratulations! You mastered the unit overview for ${topic?.title}.`
                  : `You got ${result.score}/10. You need ${CHALLENGE_PASS_MARK} to pass.`}
              </p>

              {/* XP Breakdown Card */}
              <div className="unit-challenge-breakdown-card">
                <div className="unit-challenge-breakdown-row">
                  <span>Score breakdown:</span>
                  <b>{result.score} correct × {CHALLENGE_XP_PER_QUESTION} = <span className="xp-val">{result.attemptXp} XP</span></b>
                </div>
                <div className="unit-challenge-breakdown-row">
                  <span>XP added:</span>
                  <b className="xp-val">+{result.xpAwarded} XP</b>
                </div>
                {result.attemptXp > result.xpAwarded && !isPracticeMode && (
                  <p className="unit-challenge-improvement-note">
                    You already earned part of this XP on a previous attempt.
                  </p>
                )}
                {isPracticeMode && (
                  <p className="unit-challenge-improvement-note">
                    Practice mode: 0 XP awarded.
                  </p>
                )}
              </div>

              {/* Missed Nodes Links if failed */}
              {!result.passed && Array.isArray(result.missedNodeIds) && result.missedNodeIds.length > 0 && (
                <div className="unit-challenge-missed-section">
                  <p className="unit-challenge-missed-title">Review these lessons:</p>
                  <div className="unit-challenge-missed-list">
                    {result.missedNodeIds.map((nodeId) => {
                      const matchedNode = topic?.nodes?.find((n) => n.id === nodeId)
                      return (
                        <Link
                          key={nodeId}
                          href={`/dashboard/student/lesson/${nodeId}`}
                          className="unit-challenge-missed-item"
                        >
                          <span>
                            <strong>Lesson #{nodeId}:</strong> {matchedNode?.title || 'Review topic'}
                          </span>
                          <FiBookOpen size={16} />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
                {!result.passed ? (
                  <>
                    <button type="button" className="unit-challenge-action-btn gold" onClick={handleRetry}>
                      <FiRefreshCw size={16} /> Try again
                    </button>
                    <button type="button" className="unit-challenge-close-btn" style={{ width: '100%', height: 46 }} onClick={backToMap}>
                      Back to map
                    </button>
                  </>
                ) : (
                  <button type="button" className="unit-challenge-action-btn" onClick={backToMap}>
                    Back to map <FiArrowRight size={18} />
                  </button>
                )}
              </div>
            </section>
          ) : currentQ ? (
            // ACTIVE QUESTION SCREEN
            <main className="unit-challenge-main">
              <div className="unit-challenge-question-block">
                <div className="unit-challenge-question-header-row">
                  <span className="unit-challenge-qtype-chip">
                    {currentQ.type || 'SYNTHESIS'}
                  </span>
                  <span className="unit-challenge-q-xp">
                    +{currentQ.xp || CHALLENGE_XP_PER_QUESTION} XP
                  </span>
                </div>
                <h1 className="unit-challenge-question">{currentQ.question}</h1>
              </div>

              <div className="unit-challenge-options">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedOpt === i
                  const isCorrect = revealed && i === currentQ.correctAnswerIndex
                  const isWrong = revealed && isSelected && !isCorrect
                  const isDimmed = revealed && !isCorrect && !isSelected

                  const optClass = isCorrect ? 'correct' : isWrong ? 'wrong' : isSelected ? 'selected' : isDimmed ? 'dimmed' : ''

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={revealed}
                      className={`unit-challenge-opt-btn ${optClass}`}
                      onClick={() => handleSelectOption(i)}
                    >
                      <span className="unit-challenge-opt-letter">{OPTION_LETTERS[i]}</span>
                      <span className="unit-challenge-opt-text">{opt}</span>
                      <span className="unit-challenge-opt-icon">
                        {isCorrect && <FiCheck size={20} color="#22C55E" strokeWidth={3} />}
                        {isWrong && <FiX size={20} color="#EF4444" strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </main>
          ) : null}

          {/* STICKY FOOTER */}
          {!result && currentQ && !loading && !generating && !generationError && !reviewInitialOpen && (
            <footer className={`unit-challenge-footer ${revealed ? (isAnswerCorrect ? 'feedback-correct' : 'feedback-wrong') : ''}`}>
              {revealed && (
                <div className="unit-challenge-feedback-box">
                  <div className={`unit-challenge-feedback-icon ${isAnswerCorrect ? 'correct' : 'wrong'}`}>
                    {isAnswerCorrect ? <FiCheck size={18} strokeWidth={3} /> : <FiX size={18} strokeWidth={3} />}
                  </div>
                  <div className="unit-challenge-feedback-text">
                    <div className={`unit-challenge-feedback-title ${isAnswerCorrect ? 'correct' : 'wrong'}`}>
                      {isAnswerCorrect ? `Correct! +${currentQ.xp || CHALLENGE_XP_PER_QUESTION} XP` : 'Not quite.'}
                    </div>
                    <div className="unit-challenge-feedback-body">
                      {currentQ.explanation}
                    </div>
                  </div>
                </div>
              )}

              {!revealed ? (
                <button
                  type="button"
                  className="unit-challenge-action-btn"
                  disabled={selectedOpt === null}
                  onClick={handleCheckAnswer}
                >
                  CHECK ANSWER
                </button>
              ) : (
                <button
                  type="button"
                  className="unit-challenge-action-btn"
                  disabled={submitting}
                  onClick={() => void handleNextQuestion()}
                >
                  {submitting
                    ? 'Submitting...'
                    : questionIndex === TOTAL_CHALLENGE_QUESTIONS - 1
                    ? 'SEE RESULTS'
                    : 'CONTINUE'}
                  <FiArrowRight size={18} />
                </button>
              )}
            </footer>
          )}

        </div>
      </main>
    </ProtectedRoute>
  )
}
