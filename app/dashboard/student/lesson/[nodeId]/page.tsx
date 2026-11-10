"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import GuestSignupModal from "@/components/GuestSignupModal"
import { useAuthStore } from "@/lib/store/authStore"
import {
  DEFAULT_TOPIC,
  SAMPLE_TOPICS,
  type LearningNode,
  type StudyPathTopic,
  type QuizData,
} from "@/lib/data/studyPath"
import "../lesson-loop.css"
import ThemeToggle from "@/components/ThemeToggle"
import { FiArrowLeft, FiArrowRight, FiRefreshCw, FiCheck, FiBookOpen, FiX, FiAward, FiZap } from "react-icons/fi"
import { updateStudyPathNode } from "@/src/services/api"

interface SlideDef {
  id: string
  type: "source" | "breakdown" | "key_concepts" | "quiz" | "reward" | "assessment_intro"
  title: string
  badge: string
  breakdownPart?: 0 | 1
  legacyFallback?: boolean
  quizNum?: number
}

const SEG_ON  = "#2EE59D"
const SEG_OFF = "#1E293B"

function renderBreakdownText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>
  )
}

function resolveNodeAndTopic(nodeIdStr: string): { node: LearningNode | null; topic: StudyPathTopic | null } {
  const id = parseInt(nodeIdStr, 10)
  if (isNaN(id)) return { node: null, topic: null }
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("studyhelp_active_topic")
    if (saved) {
      try {
        const parsed: StudyPathTopic = JSON.parse(saved)
        const found = parsed?.nodes?.find((n) => n.id === id)
        if (found) return { node: found, topic: parsed }
      } catch { /* ignore */ }
    }
  }
  for (const topic of SAMPLE_TOPICS) {
    const found = topic.nodes.find((n) => n.id === id)
    if (found) return { node: found, topic }
  }
  const defNode = DEFAULT_TOPIC.nodes.find((n) => n.id === id) ?? null
  return { node: defNode, topic: DEFAULT_TOPIC }
}

/**
 * Builds a dynamic, unique second quiz tailored to the node's specific concept
 * (Never repeats identical questions across nodes)
 */
/**
 * Builds 10 comprehensive assessment questions across all unit topics
 */
function build10QuestionFinalQuiz(topic: StudyPathTopic | null, node: LearningNode): QuizData[] {
  if (Array.isArray(node.finalQuiz) && node.finalQuiz.length >= 10) {
    return node.finalQuiz.slice(0, 10)
  }

  const result: QuizData[] = []
  if (Array.isArray(node.finalQuiz) && node.finalQuiz.length > 0) {
    result.push(...node.finalQuiz)
  }

  // Pull existing questions from previous nodes
  if (topic && Array.isArray(topic.nodes)) {
    for (const otherNode of topic.nodes) {
      if (otherNode.id === node.id) continue
      if (otherNode.quiz?.question && !result.some((q) => q.question === otherNode.quiz!.question)) {
        result.push(otherNode.quiz)
      }
      if (otherNode.quiz2?.question && !result.some((q) => q.question === otherNode.quiz2!.question)) {
        result.push(otherNode.quiz2)
      }
      if (result.length >= 10) break
    }
  }


  return result.slice(0, 10)
}

function LessonLoopContent() {
  const params = useParams()
  const router = useRouter()
  const nodeId = (params?.nodeId as string) ?? ""

  const [{ node, topic }, setNodeAndTopic] = useState<{ node: LearningNode | null; topic: StudyPathTopic | null }>({ node: null, topic: null })
  const [mounted, setMounted] = useState(false)

  // Resolve node after mount so localStorage is available (avoids SSR hydration
  // mismatch that causes sourceFacts / breakdown to appear empty on first render)
  useEffect(() => {
    setNodeAndTopic(resolveNodeAndTopic(nodeId))
    setMounted(true)
  }, [nodeId])

  // Determine if this is the final 10-question assessment node
  const isFinalAssessment = useMemo(() => {
    if (!node) return false
    if (node.isFinalQuiz) return true
    if (topic?.nodes && topic.nodes.length > 0) {
      const isLastNode = topic.nodes[topic.nodes.length - 1].id === node.id
      const isSecondToLastSummary = topic.nodes.length >= 2 && topic.nodes[topic.nodes.length - 2].isSummary
      if (isLastNode && (isSecondToLastSummary || node.title.toLowerCase().includes("assessment") || node.title.toLowerCase().includes("quiz") || node.title.toLowerCase().includes("challenge"))) {
        return true
      }
    }
    return false
  }, [node, topic])

  // Regular Quizzes state (for normal nodes)
  const [quiz1, setQuiz1] = useState<QuizData | null>(null)
  const [quiz2, setQuiz2] = useState<QuizData | null>(null)
  const [selectedOpt1, setSelectedOpt1] = useState<number | null>(null)
  const [correct1, setCorrect1] = useState(false)
  const [wrong1, setWrong1] = useState<number[]>([])

  const [selectedOpt2, setSelectedOpt2] = useState<number | null>(null)
  const [correct2, setCorrect2] = useState(false)
  const [wrong2, setWrong2] = useState<number[]>([])

  // Final 10-Question Assessment State
  const [finalQuizzes, setFinalQuizzes] = useState<QuizData[]>([])
  const [finalAnswers, setFinalAnswers] = useState<Record<number, { selected: number | null; correct: boolean; wrong: number[] }>>({})

  // Slide Index & Meta
  const [slideIdx, setSlideIdx] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [xp, setXp] = useState(2510)
  const [streak, setStreak] = useState(12)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()

  // Read stored user stats
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedStats = localStorage.getItem("studyhelp_user_stats")
        if (savedStats) {
          const parsed = JSON.parse(savedStats)
          if (typeof parsed.streak === "number" && parsed.streak > 0) setStreak(parsed.streak)
          if (typeof parsed.xp === "number" && parsed.xp > 0) setXp(parsed.xp)
        }
      } catch { /* ignore */ }
    }
  }, [])

  // Initialize node and quiz data
  useEffect(() => {
    if (node) {
      if (isFinalAssessment) {
        const tenQuestions = build10QuestionFinalQuiz(topic, node)
        setFinalQuizzes(tenQuestions)
        const initialMap: Record<number, { selected: number | null; correct: boolean; wrong: number[] }> = {}
        for (let i = 1; i <= tenQuestions.length; i++) {
          initialMap[i] = { selected: null, correct: false, wrong: [] }
        }
        setFinalAnswers(initialMap)
      } else {
        setQuiz1(node.quiz || null)
        setQuiz2(node.quiz2 || null)
        setSelectedOpt1(null)
        setCorrect1(false)
        setWrong1([])
        setSelectedOpt2(null)
        setCorrect2(false)
        setWrong2([])
      }
      setSlideIdx(0)
      setHasCompleted(false)
    }
  }, [nodeId, node, isFinalAssessment, topic])

  // Build dynamic slide definitions
  const slides = useMemo<SlideDef[]>(() => {
    if (!node) return []
    const list: SlideDef[] = []

    // ── 10-QUESTION FINAL ASSESSMENT FLOW ──
    if (isFinalAssessment) {
      // Slide 0: Assessment briefing
      list.push({
        id: "assessment_intro",
        type: "assessment_intro",
        title: node.title,
        badge: "FINAL ASSESSMENT"
      })

      // Slide 1..10: 10 Quiz Questions
      const count = finalQuizzes.length || 10
      for (let i = 1; i <= count; i++) {
        list.push({
          id: `quiz_${i}`,
          type: "quiz",
          title: node.title,
          badge: `QUESTION ${i}/${count}`,
          quizNum: i
        })
      }

      // Final Reward slide
      list.push({
        id: "reward",
        type: "reward",
        title: node.title,
        badge: "UNIT MASTERED"
      })

      return list
    }

    // ── REGULAR / SUMMARY NODE FLOW ──
    list.push({ id: "source_text", type: "source", title: node.title, badge: "FROM THE DOCUMENT" })

    const hasBreakdown = Array.isArray(node.breakdown)
      && node.breakdown.length === 2
      && node.breakdown.every((slide) => Boolean(slide?.heading && slide?.body))
    if (hasBreakdown) {
      list.push({ id: "breakdown_1", type: "breakdown", title: node.title, badge: "CONCEPT BREAKDOWN 1/2", breakdownPart: 0 })
      list.push({ id: "breakdown_2", type: "breakdown", title: node.title, badge: "CONCEPT BREAKDOWN 2/2", breakdownPart: 1 })
    } else {
      list.push({ id: "breakdown_legacy", type: "breakdown", title: node.title, badge: "CONCEPT BREAKDOWN", breakdownPart: 0, legacyFallback: true })
    }

    list.push({ id: "key_concepts", type: "key_concepts", title: node.title, badge: "KEY CONCEPTS" })

    // Quiz 1 (Core Understanding)
    list.push({
      id: "quiz_1",
      type: "quiz",
      title: node.title,
      badge: "QUIZ 1/2",
      quizNum: 1
    })

    list.push({
      id: "quiz_2",
      type: "quiz",
      title: node.title,
      badge: "QUIZ 2/2",
      quizNum: 2
    })

    // Final Reward
    list.push({
      id: "reward",
      type: "reward",
      title: node.title,
      badge: "LESSON COMPLETED"
    })

    return list
  }, [node, isFinalAssessment, finalQuizzes])

  const currentSlide = slides[slideIdx] || slides[0]
  const totalSlides = slides.length

  // Exit back to topic study map
  const handleClose = () => {
    if (topic?.topicId) {
      router.push(`/dashboard/student/map/${topic.topicId}`)
    } else {
      router.push("/dashboard/student")
    }
  }

  // Completion logic: updates localStorage and calls backend API
  const markNodeComplete = useCallback(async () => {
    if (!node || hasCompleted) return
    setHasCompleted(true)

    // Update active topic in localStorage
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("studyhelp:first-node-completed"))
      try {
        const saved = localStorage.getItem("studyhelp_active_topic")
        if (saved) {
          const storedTopic: StudyPathTopic = JSON.parse(saved)
          if (storedTopic && Array.isArray(storedTopic.nodes)) {
            const idx = storedTopic.nodes.findIndex((n) => n.id === node.id)
            if (idx !== -1) {
              storedTopic.nodes[idx].status = "completed"
              if (idx + 1 < storedTopic.nodes.length && storedTopic.nodes[idx + 1].status === "locked") {
                storedTopic.nodes[idx + 1].status = "active"
              }
              storedTopic.currentProgress = storedTopic.nodes.filter((n) => n.status === "completed").length
              localStorage.setItem("studyhelp_active_topic", JSON.stringify(storedTopic))
            }
          }
        }
      } catch (e) {
        console.warn("[LessonLoop] localStorage update error:", e)
      }
    }

    // Call backend API to mark complete and unlock next node
    const topicId = topic?.topicId || "active"
    try {
      await updateStudyPathNode(topicId, node.id, "completed")
    } catch (apiErr) {
      console.warn("[LessonLoop] Backend updateStudyPathNode sync error:", apiErr)
    }
  }, [node, topic, hasCompleted])

  const handleRegenerateQuiz = async () => {
    if (!node || !topic?.topicId || isRegenerating) return
    setIsRegenerating(true)
    try {
      const response = await fetch("/api/study-path/" + encodeURIComponent(topic.topicId) + "/node/" + node.id + "/regenerate", { method: "POST", headers: { "Content-Type": "application/json" } })
      const payload = await response.json()
      if (!response.ok || !payload?.node) throw new Error(payload?.message || "Quiz regeneration failed")
      const fresh = payload.node as LearningNode
      const saved = localStorage.getItem("studyhelp_active_topic")
      if (saved) { const stored: StudyPathTopic = JSON.parse(saved); stored.nodes = stored.nodes.map((item) => item.id === node.id ? { ...item, ...fresh } : item); localStorage.setItem("studyhelp_active_topic", JSON.stringify(stored)) }
      setQuiz1(fresh.quiz || null); setQuiz2(fresh.quiz2 || null)
      setSelectedOpt1(null); setCorrect1(false); setWrong1([])
      setSelectedOpt2(null); setCorrect2(false); setWrong2([])
    } catch (error) { console.error("[LessonLoop] Node regeneration failed:", error) }
    finally { setIsRegenerating(false) }
  }

  const nextNode = useMemo(() => {
    if (!topic?.nodes || !node) return null
    const idx = topic.nodes.findIndex((n) => n.id === node.id)
    if (idx !== -1 && idx + 1 < topic.nodes.length) {
      return topic.nodes[idx + 1]
    }
    return topic.nodes.find((n) => n.id === node.id + 1) || null
  }, [topic, node])

  // ── All hooks are above this line. Early returns are safe from here. ──

  if (!mounted) {
    return <div className="ll-root" />
  }

  if (!node || !currentSlide) {
    return (
      <div className="ll-root" style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#94A3B8", fontSize: 18, fontWeight: 800 }}>Lesson not found.</p>
        <Link href="/dashboard/student" className="ll-cta-btn green" style={{ width: "auto", padding: "0 32px" }}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const letters = ["A", "B", "C", "D"]

  // Active quiz resolution
  const qNum = currentSlide.quizNum || 1
  let activeQuiz: QuizData | null = null
  let activeSelected: number | null = null
  let activeCorrect = false
  let activeWrong: number[] = []

  if (isFinalAssessment) {
    activeQuiz = finalQuizzes[qNum - 1] || null
    const currentAns = finalAnswers[qNum] || { selected: null, correct: false, wrong: [] }
    activeSelected = currentAns.selected
    activeCorrect = currentAns.correct
    activeWrong = currentAns.wrong
  } else {
    if (qNum === 2) {
      activeQuiz = quiz2
      activeSelected = selectedOpt2
      activeCorrect = correct2
      activeWrong = wrong2
    } else {
      activeQuiz = quiz1
      activeSelected = selectedOpt1
      activeCorrect = correct1
      activeWrong = wrong1
    }
  }

  const showCorrect = currentSlide.type === "quiz" && activeCorrect
  const showWrong = currentSlide.type === "quiz" && !activeCorrect && activeWrong.length > 0
  const barBg = showCorrect ? "#0F2E28" : showWrong ? "#3B1219" : "#0F1528"
  const barBorder = showCorrect ? "#1F6F55" : showWrong ? "#7F1D1D" : "#1E2A47"

  const xpEarned = node.xp ?? (isFinalAssessment ? 100 : 30)
  const breakdownSlide = node.breakdown?.[currentSlide.breakdownPart ?? 0]
  const lessonKeyConcepts = node.keyConcepts || []
  const nextNodeTitle = node.nextNodeTitle || nextNode?.title || (nextNode ? `Lesson ${nextNode.id}` : null)

  // Determine if NEXT is disabled
  const isNextDisabled =
    currentSlide.type === "quiz" && Boolean(activeQuiz) && (!activeCorrect || activeSelected === null)

  const handlePrev = () => {
    if (slideIdx > 0) {
      setSlideIdx((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (slideIdx + 1 < totalSlides) {
      const nextIdx = slideIdx + 1
      setSlideIdx(nextIdx)
      if (slides[nextIdx]?.type === "reward") {
        setXp((prev) => prev + xpEarned)
        markNodeComplete()
      }
    } else {
      // Finished Reward Slide
      if (nextNode) {
        if (!isAuthenticated && nextNode.id >= 2) {
          setSignupModalOpen(true)
          return
        }
        router.push(`/dashboard/student/lesson/${nextNode.id}`)
      } else {
        router.push(topic?.topicId ? `/dashboard/student/map/${topic.topicId}` : "/dashboard/student")
      }
    }
  }

  return (
    <ProtectedRoute allowedRoles={["student", "teacher"]} allowGuest={true}>
      <div className="ll-root">
        <div className="ll-container">

          {/* TOP BAR: [X] close button inline with progress bar */}
          <header className="ll-topbar">
            <div className="ll-topbar-header-row">
              <button
                type="button"
                className="ll-close-btn"
                onClick={handleClose}
                aria-label="Exit lesson loop"
                title="Close lesson"
              >
                <FiX size={20} />
              </button>

              {/* Dynamic Progress Segments */}
              <div role="img" aria-label={`Step ${slideIdx + 1} of ${totalSlides}`} className="ll-progress-bar">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className={`ll-seg ${i <= slideIdx ? "active" : ""}`}
                  />
                ))}
              </div>
            </div>

            {currentSlide.type !== "reward" && currentSlide.badge && (
              <div className="ll-topbar-subrow">
                <span className="ll-badge-concept">
                  {currentSlide.badge}
                </span>
              </div>
            )}
          </header>

          {/* MAIN */}
          <main className={`ll-main ${currentSlide.type === "reward" ? "ll-main-reward" : ""} ${["source", "breakdown", "key_concepts"].includes(currentSlide.type) ? "ll-main-breakdown" : ""} ${(showCorrect || showWrong) ? "ll-main-feedback" : ""}`}>

            {/* ASSESSMENT INTRO SLIDE (FOR 10-QUESTION FINAL ASSESSMENT) */}
            {currentSlide.type === "assessment_intro" && (
              <div className="ll-rise" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="ll-concept-header">
                  <h1 className="ll-concept-title">{node.title}</h1>
                </div>

                <div className="ll-source-card ll-assessment-card">
                  <div className="ll-assessment-header">
                    <span className="ll-assessment-badge">
                      <FiAward size={14} />
                      UNIT ASSESSMENT
                    </span>
                    <div className="ll-assessment-meta-chips">
                      <span className="ll-assessment-chip">10 Questions</span>
                      <span className="ll-assessment-chip gold">+{xpEarned} XP</span>
                    </div>
                  </div>

                  <p className={`ll-assessment-desc${summaryExpanded ? " expanded" : " clamped"}`}>
                    {node.summary}
                  </p>
                  {node.summary && node.summary.split(/\s+/).length > 35 && (
                    <button type="button" className="ll-read-more" onClick={() => setSummaryExpanded((value) => !value)}>
                      {summaryExpanded ? "Read less" : "Read more"}
                    </button>
                  )}

                  <div className="ll-source-note" style={{ marginTop: 8 }}>
                    <span className="ll-note-icon">💡</span>
                    <span className="ll-note-text">Answer each question correctly to advance. Tap <strong>NEXT</strong> below to begin.</span>
                  </div>
                </div>
              </div>
            )}

            {currentSlide.type === "source" && (
              <div className="ll-rise ll-source-screen">
                <div className="ll-breakdown-header">
                  <h1 className="ll-breakdown-title">{node.title}</h1>
                  <div className="ll-breakdown-meta">
                    <span><FiBookOpen size={15} /> Original material</span>
                    {node.sourcePages?.length ? <span>Page{node.sourcePages.length > 1 ? "s" : ""} {node.sourcePages.join(", ")}</span> : null}
                  </div>
                </div>
                {node.slideImage && (
                  <div className="my-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-black/5 dark:bg-black/20 flex justify-center">
                    <img
                      src={node.slideImage}
                      alt={`${node.title} original slide`}
                      className="max-h-64 w-auto object-contain rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}
                <section className="ll-breakdown-section">
                  <h2>From your document</h2>
                  {node.sourceFacts?.length ? (
                    <ul className="ll-source-facts">
                      {node.sourceFacts.map((fact, index) => <li key={`${index}-${fact}`}>{fact}</li>)}
                    </ul>
                  ) : (
                    <p className="ll-breakdown-body">Source wording is unavailable for this lesson.</p>
                  )}
                </section>
              </div>
            )}

            {/* TWO-SLIDE CONCEPT BREAKDOWN (legacy nodes get a compact one-slide fallback) */}
            {currentSlide.type === "breakdown" && (
              <div className="ll-rise ll-breakdown-screen">
                <div className="ll-breakdown-header">
                  <h1 className="ll-breakdown-title">{node.title}</h1>
                </div>

                {currentSlide.legacyFallback ? (
                  <>
                    <section className="ll-breakdown-section">
                      <h2>Lesson recap</h2>
                      <p className="ll-breakdown-body">{node.summary || node.lessonContent?.paragraphs?.[0] || "Summary unavailable."}</p>
                    </section>
                  </>
                ) : (
                  <>
                    <section className="ll-breakdown-section">
                      <h2>{breakdownSlide?.heading}</h2>
                      <p className="ll-breakdown-body">{renderBreakdownText(breakdownSlide?.body || "Explanation unavailable.")}</p>
                    </section>

                    {currentSlide.breakdownPart === 1 && (
                      <>
                        {breakdownSlide?.memoryTip && <div className="ll-memory-tip"><FiZap size={19} /><div><span className="ll-memory-tip-label">MEMORY TIP</span><p>{renderBreakdownText(breakdownSlide.memoryTip)}</p></div></div>}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {currentSlide.type === "key_concepts" && (
              <div className="ll-rise ll-key-concepts-screen">
                <div className="ll-breakdown-header">
                  <h1 className="ll-breakdown-title">Key concepts</h1>
                  <div className="ll-breakdown-meta"><span>{node.title}</span></div>
                </div>
                {lessonKeyConcepts.length > 0 ? (
                  <section className="ll-breakdown-recap ll-key-concepts-list">
                    {lessonKeyConcepts.map((concept, index) => <div className="ll-breakdown-concept" key={`${index}-${concept}`}><span>{index + 1}</span><p>{concept}</p></div>)}
                  </section>
                ) : <p className="ll-breakdown-body">Key concepts are unavailable for this lesson.</p>}
              </div>
            )}

            {/* CHECKPOINT QUIZZES */}
            {currentSlide.type === "quiz" && (
              <div className="ll-rise" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="ll-quiz-header">
                  <div className="ll-header-actions" style={{ justifyContent: "flex-end" }}>
                    {/* Small regenerate button at the top */}
                    <button
                      type="button"
                      className={`ll-btn-regen ${isRegenerating ? "spinning" : ""}`}
                      onClick={() => handleRegenerateQuiz()}
                      disabled={isRegenerating}
                      title="Regenerate both lesson questions"
                    >
                      <FiRefreshCw size={13} />
                      <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
                    </button>
                  </div>

                  <h1 className="ll-question" style={{ marginTop: 6 }}>
                    {activeQuiz?.question ?? "Quiz unavailable, tap Regenerate"}
                  </h1>
                </div>

                {activeQuiz && (
                  <div className="ll-options">
                    {activeQuiz.options.map((opt, i) => {
                      const isCorrect = activeCorrect && i === activeQuiz.correctAnswerIndex
                      const isWrong = !activeCorrect && activeWrong.includes(i)
                      const isDimmed = activeCorrect && i !== activeQuiz.correctAnswerIndex
                      const optClass = isCorrect ? 'correct' : isWrong ? 'wrong' : isDimmed ? 'dimmed' : ''
                      return (
                        <button
                          key={i}
                          className={`ll-option-btn ${optClass}`}
                          disabled={activeCorrect}
                          onClick={() => {
                            if (activeCorrect) return
                            if (isFinalAssessment) {
                              const isRight = i === activeQuiz!.correctAnswerIndex
                              setFinalAnswers((prev) => {
                                const current = prev[qNum] || { selected: null, correct: false, wrong: [] }
                                return {
                                  ...prev,
                                  [qNum]: {
                                    selected: i,
                                    correct: isRight,
                                    wrong: isRight ? current.wrong : (current.wrong.includes(i) ? current.wrong : [...current.wrong, i])
                                  }
                                }
                              })
                            } else if (qNum === 1) {
                              setSelectedOpt1(i)
                              if (i === activeQuiz!.correctAnswerIndex) setCorrect1(true)
                              else if (!wrong1.includes(i)) setWrong1((prev) => [...prev, i])
                            } else {
                              setSelectedOpt2(i)
                              if (i === activeQuiz!.correctAnswerIndex) setCorrect2(true)
                              else if (!wrong2.includes(i)) setWrong2((prev) => [...prev, i])
                            }
                          }}
                          
                        >
                          <span className="ll-option-badge">
                            {letters[i]}
                          </span>
                          <span className="ll-option-text">{opt}</span>
                          <span className="ll-option-icon">
                            {isCorrect && (
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                                stroke="#3DDC97" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12.5l4.5 4.5L19 6.5" />
                              </svg>
                            )}
                            {isWrong && (
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                                stroke="#F87171" strokeWidth="3.2" strokeLinecap="round">
                                <path d="M6 6l12 12M18 6L6 18" />
                              </svg>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* FINAL SLIDE: REWARD & COMPLETION */}
            {currentSlide.type === "reward" && (
              <div className="ll-reward-screen ll-rise">
                <div className="ll-reward-center">
                  <div className="ll-reward-check-circle ll-pop">
                    <svg
                      role="img"
                      aria-label="Completed"
                      width="54"
                      height="54"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#052E16"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  <h1 className="ll-reward-title">{isFinalAssessment ? "Map Completed!" : "Lesson completed!"}</h1>
                  <p className="ll-reward-subtitle">{node.title}</p>

                  <div className="ll-reward-pills">
                    <div className="ll-reward-pill-xp">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#FBBF24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span>+{xpEarned} XP</span>
                    </div>

                    <div className="ll-reward-pill-streak">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#FB923C">
                        <path d="M12 2c.5 3 2.5 5 4.5 7 1.5 1.5 2.5 3.5 2.5 5.5A7 7 0 1 1 5 14.5c0-3.5 3-6.5 4.5-8.5.5 2 1.5 3.5 2.5 4 0-3 0-6 0-8z" />
                      </svg>
                      <span>{streak} day streak</span>
                    </div>
                  </div>

                  <div className="ll-reward-total-xp">
                    {(xp + xpEarned).toLocaleString()} XP total
                  </div>
                </div>

                <div className="ll-reward-bottom">
                  {nextNodeTitle && (
                    <div className="ll-reward-upnext">
                      <span className="ll-reward-upnext-tag">UP NEXT</span>
                      <span className="ll-reward-upnext-title">{nextNodeTitle}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="ll-reward-continue-btn"
                    onClick={handleNext}
                    aria-label="Continue to next lesson or dashboard"
                  >
                    <span>{nextNode ? "CONTINUE" : "FINISH MAP"}</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#052E16"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

          </main>

          {/* FOOTER */}
          {currentSlide.type !== "reward" && (
            <footer className={`ll-footer ${showCorrect ? "ll-footer-correct" : showWrong ? "ll-footer-wrong" : ""}`}>
              {showCorrect && (
                <div className="ll-feedback">
                  <div className="ll-feedback-icon correct">
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#052E16" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 6.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="ll-feedback-title correct">Correct!</div>
                    <div className="ll-feedback-body correct">{activeQuiz?.explanation}</div>
                  </div>
                </div>
              )}
              {showWrong && (
                <div className="ll-feedback">
                  <div className="ll-feedback-icon wrong">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="#3B0A0A" strokeWidth="3.6" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </div>
                  <div>
                    <div className="ll-feedback-title wrong">Not quite</div>
                    <div className="ll-feedback-body wrong">{activeQuiz?.hint || "Pick another answer to try again."}</div>
                  </div>
                </div>
              )}

              <div className="ll-nav-row">
                <button
                  type="button"
                  className={`ll-cta-btn ll-btn-prev ${slideIdx === 0 ? "disabled" : ""}`}
                  disabled={slideIdx === 0}
                  onClick={handlePrev}
                  aria-label="Previous step"
                >
                  <FiArrowLeft size={20} />
                  <span>PREV</span>
                </button>
                <button
                  type="button"
                  className={`ll-cta-btn ${isNextDisabled ? "disabled" : "green"}`}
                  disabled={isNextDisabled}
                  onClick={handleNext}
                  aria-label="Next step"
                >
                  <span>NEXT</span>
                  <FiArrowRight size={20} />
                </button>
              </div>
            </footer>
          )}

          {/* Guest signup interception */}
          {signupModalOpen && (
            <GuestSignupModal
              isOpen={signupModalOpen}
              onClose={() => setSignupModalOpen(false)}
              topicId={topic?.topicId || ""}
              nodeId={nextNode?.id || 2}
              onSuccess={() => {
                if (nextNode) {
                  router.push(`/dashboard/student/lesson/${nextNode.id}`)
                }
              }}
            />
          )}

        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function LessonLoopPage() {
  return (
    <Suspense fallback={<div className="ll-root" />}>
      <LessonLoopContent />
    </Suspense>
  )
}
