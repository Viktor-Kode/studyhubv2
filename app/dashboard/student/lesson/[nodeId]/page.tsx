"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import {
  DEFAULT_TOPIC,
  SAMPLE_TOPICS,
  type LearningNode,
  type StudyPathTopic,
  type QuizData,
} from "@/lib/data/studyPath"
import "../lesson-loop.css"
import { FiClock, FiArrowLeft, FiArrowRight, FiFileText, FiRefreshCw, FiCheck, FiBookOpen, FiX } from "react-icons/fi"
import { generateQuiz } from "@/lib/api/quizApi"
import { updateStudyPathNode } from "@/src/services/api"

interface SlideDef {
  id: string
  type: "source" | "explanation" | "key_concepts" | "quiz" | "reward"
  title: string
  badge: string
  explanationPart?: 1 | 2
  quizNum?: 1 | 2
}

const SEG_ON  = "#2EE59D"
const SEG_OFF = "#1E293B"
const DAYS    = ["M", "T", "W", "T", "F", "S", "S"]

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

function buildDefaultQuiz2(node: LearningNode): QuizData {
  const primaryConcept = node.keyConcepts?.[0] || node.title
  const secondaryConcept = node.keyConcepts?.[1] || "application"
  return {
    question: `In practical problem-solving, how is ${primaryConcept} most effectively applied?`,
    options: [
      `To optimize workflow and ensure reliable behavior through ${secondaryConcept}`,
      `By discarding all state and recalculating everything from scratch repeatedly`,
      `By bypassing index bounds and assuming infinite memory is always available`,
      `By avoiding any direct structure and relying purely on random lookups`
    ],
    correctAnswerIndex: 0,
    explanation: `${node.title} centers on ${primaryConcept} combined with ${secondaryConcept} to maintain predictable, high-performance execution.`,
    hint: `Focus on the core efficiency benefit highlighted in the breakdown.`
  }
}

function LessonLoopContent() {
  const params = useParams()
  const router = useRouter()
  const nodeId = (params?.nodeId as string) ?? ""

  const { node, topic } = useMemo(() => resolveNodeAndTopic(nodeId), [nodeId])

  // Quizzes state
  const [quiz1, setQuiz1] = useState<QuizData | null>(null)
  const [quiz2, setQuiz2] = useState<QuizData | null>(null)

  // Quiz 1 Interaction
  const [selectedOpt1, setSelectedOpt1] = useState<number | null>(null)
  const [correct1, setCorrect1] = useState(false)
  const [wrong1, setWrong1] = useState<number[]>([])

  // Quiz 2 Interaction
  const [selectedOpt2, setSelectedOpt2] = useState<number | null>(null)
  const [correct2, setCorrect2] = useState(false)
  const [wrong2, setWrong2] = useState<number[]>([])

  // Slide Index
  const [slideIdx, setSlideIdx] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [xp, setXp] = useState(2510)
  const [streak, setStreak] = useState(12)
  const [hasCompleted, setHasCompleted] = useState(false)

  // Read stored user stats if available
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
      setQuiz1(node.quiz || null)
      setQuiz2(buildDefaultQuiz2(node))
      setSlideIdx(0)
      setSelectedOpt1(null)
      setCorrect1(false)
      setWrong1([])
      setSelectedOpt2(null)
      setCorrect2(false)
      setWrong2([])
      setHasCompleted(false)
    }
  }, [nodeId, node])

  // Build dynamic slide definitions
  const slides = useMemo<SlideDef[]>(() => {
    if (!node) return []
    const list: SlideDef[] = []

    // 1. Source material excerpt slide (straight off uploaded material)
    list.push({
      id: "source",
      type: "source",
      title: node.title,
      badge: "SOURCE EXCERPT"
    })

    // 2. Explanation slide(s)
    const lc = node.lessonContent
    const isLongExplanation = lc && (lc.paragraphs.length > 1 || (lc.paragraphs.join(" ").length > 320))

    if (isLongExplanation) {
      list.push({
        id: "exp_1",
        type: "explanation",
        title: node.title,
        badge: "EXPLANATION · 1/2",
        explanationPart: 1
      })
      list.push({
        id: "exp_2",
        type: "explanation",
        title: node.title,
        badge: "EXPLANATION · 2/2",
        explanationPart: 2
      })
    } else {
      list.push({
        id: "exp_all",
        type: "explanation",
        title: node.title,
        badge: "CONCEPT BREAKDOWN",
        explanationPart: 1
      })
    }

    // 3. KEY CONCEPTS TO MASTER: Dedicated slide flow
    list.push({
      id: "key_concepts",
      type: "key_concepts",
      title: node.title,
      badge: "KEY CONCEPTS"
    })

    // 4. Quiz 1
    list.push({
      id: "quiz_1",
      type: "quiz",
      title: node.title,
      badge: "QUIZ 1/2",
      quizNum: 1
    })

    // 5. Quiz 2
    list.push({
      id: "quiz_2",
      type: "quiz",
      title: node.title,
      badge: "QUIZ 2/2",
      quizNum: 2
    })

    // 6. Final Reward / Progression
    list.push({
      id: "reward",
      type: "reward",
      title: node.title,
      badge: "NODE COMPLETED"
    })

    return list
  }, [node])

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

  // Handle AI question regeneration
  const handleRegenerateQuiz = async (quizNum: 1 | 2) => {
    if (!node || isRegenerating) return
    setIsRegenerating(true)

    const contextText = `${node.title}: ${node.lessonContent?.paragraphs?.join(" ") || node.summary}. Key concepts: ${node.keyConcepts.join(", ")}.`

    try {
      const res = await generateQuiz(contextText, 1, "multiple-choice", node.title, true)
      if (res?.data && res.data.length > 0) {
        const item = res.data[0]
        const rawAns = item.answer
        let ansIdx = 0
        if (typeof rawAns === "number") ansIdx = rawAns
        else if (typeof rawAns === "string" && /^[0-3]$/.test(rawAns)) ansIdx = parseInt(rawAns, 10)
        else if (typeof rawAns === "string" && /^[a-d]$/i.test(rawAns)) ansIdx = rawAns.toLowerCase().charCodeAt(0) - 97
        else if (Array.isArray(item.options)) {
          const match = item.options.findIndex(opt => opt.toLowerCase().trim() === String(rawAns).toLowerCase().trim())
          if (match !== -1) ansIdx = match
        }

        const freshQuiz: QuizData = {
          question: item.content || (item as any).question || "Check your understanding:",
          options: item.options && item.options.length === 4 ? item.options : ["Option A", "Option B", "Option C", "Option D"],
          correctAnswerIndex: ansIdx,
          explanation: item.knowledgeDeepDive || "Great work! This reinforces the core concept.",
          hint: "Think back to the key terms and analogy."
        }

        if (quizNum === 1) {
          setQuiz1(freshQuiz)
          setSelectedOpt1(null)
          setCorrect1(false)
          setWrong1([])
        } else {
          setQuiz2(freshQuiz)
          setSelectedOpt2(null)
          setCorrect2(false)
          setWrong2([])
        }
      }
    } catch (err) {
      console.warn("[LessonLoop] AI question regeneration failed:", err)
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!node || !currentSlide) {
    return (
      <div className="ll-root" style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#94A3B8", fontSize: 18, fontWeight: 800 }}>Node not found.</p>
        <Link href="/dashboard/student" className="ll-cta-btn green" style={{ width: "auto", padding: "0 32px" }}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const lc = node.lessonContent
  const letters = ["A", "B", "C", "D"]
  const activeQuiz = currentSlide.quizNum === 1 ? quiz1 : quiz2
  const activeSelected = currentSlide.quizNum === 1 ? selectedOpt1 : selectedOpt2
  const activeCorrect = currentSlide.quizNum === 1 ? correct1 : correct2
  const activeWrong = currentSlide.quizNum === 1 ? wrong1 : wrong2

  const showCorrect = currentSlide.type === "quiz" && activeCorrect
  const showWrong = currentSlide.type === "quiz" && !activeCorrect && activeWrong.length > 0
  const barBg = showCorrect ? "#0F2E28" : showWrong ? "#3B1219" : "#0F1528"
  const barBorder = showCorrect ? "#1F6F55" : showWrong ? "#7F1D1D" : "#1E2A47"

  const xpEarned = node.xp ?? 30
  const headerXp = currentSlide.type === "reward" ? xp + xpEarned : xp

  const nextNode = useMemo(() => {
    if (!topic?.nodes || !node) return null
    const idx = topic.nodes.findIndex((n) => n.id === node.id)
    if (idx !== -1 && idx + 1 < topic.nodes.length) {
      return topic.nodes[idx + 1]
    }
    return topic.nodes.find((n) => n.id === node.id + 1) || null
  }, [topic, node])

  const nextNodeTitle = node.nextNodeTitle || nextNode?.title || (nextNode ? `Node ${nextNode.id}` : null)

  // Determine if NEXT is disabled
  const isNextDisabled =
    currentSlide.type === "quiz" && (!activeCorrect || activeSelected === null)

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
        router.push(`/dashboard/student/lesson/${nextNode.id}`)
      } else {
        router.push(topic?.topicId ? `/dashboard/student/map/${topic.topicId}` : "/dashboard/student")
      }
    }
  }

  return (
    <ProtectedRoute allowedRoles={["student", "teacher"]}>
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
                    className="ll-seg"
                    style={{ background: i <= slideIdx ? SEG_ON : SEG_OFF }}
                  />
                ))}
              </div>
            </div>

            {currentSlide.type !== "reward" && currentSlide.badge && (
              <div className="ll-topbar-subrow">
                <span className={currentSlide.type === "source" ? "ll-badge-source" : "ll-badge-concept"}>
                  {currentSlide.type === "source" && <FiFileText size={13} />}
                  {currentSlide.badge}
                </span>
              </div>
            )}
          </header>

          {/* MAIN */}
          <main className={`ll-main ${currentSlide.type === "reward" ? "ll-main-reward" : ""}`}>

            {/* SLIDE 1: SOURCE MATERIAL EXCERPT */}
            {currentSlide.type === "source" && (
              <div className="ll-rise" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="ll-concept-header">
                  <h1 className="ll-concept-title">{node.title}</h1>
                </div>

                <div className="ll-source-card">
                  <div className="ll-source-header">
                    <span className="ll-source-label">
                      <FiBookOpen size={14} />
                      DIRECT FROM UPLOADED MATERIAL
                    </span>
                    <span className="ll-source-meta">Section #{node.id}</span>
                  </div>
                  <div className="ll-source-quote-box">
                    <p className="ll-source-text">
                      "{node.summary || lc?.paragraphs?.[0] || 'Original source material section for this concept.'}"
                    </p>
                  </div>
                  <p className="ll-source-note">
                    <span>💡</span> Click Next to see our AI breakdown with analogies and key concepts.
                  </p>
                </div>
              </div>
            )}

            {/* SLIDE 2 / 3: EXPLAINED VERSION */}
            {currentSlide.type === "explanation" && (
              <div className="ll-rise" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="ll-concept-header">
                  <h1 className="ll-concept-title">{node.title}</h1>
                </div>

                {/* PART 1: Analogy & Core Idea */}
                {currentSlide.explanationPart === 1 && (
                  <>
                    {lc?.analogy && (
                      <div className="ll-analogy-card">
                        <div className="ll-analogy-icon">
                          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none"
                            stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18h6M10 21h4" />
                            <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
                          </svg>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="ll-analogy-label">THINK OF IT LIKE THIS</div>
                          <p className="ll-analogy-text">{lc.analogy}</p>
                        </div>
                      </div>
                    )}
                    {lc?.paragraphs && lc.paragraphs.length > 0 && (
                      <div className="ll-paragraphs">
                        <p className="ll-para">{lc.paragraphs[0]}</p>
                      </div>
                    )}
                  </>
                )}

                {/* PART 2: Deep Dive Paragraphs */}
                {currentSlide.explanationPart === 2 && (
                  <div className="ll-paragraphs">
                    {lc?.paragraphs && lc.paragraphs.length > 1 ? (
                      lc.paragraphs.slice(1).map((p, i) => (
                        <p key={i} className="ll-para">{p}</p>
                      ))
                    ) : (
                      <p className="ll-para">{node.summary || "Further exploration and practical implications."}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 4: KEY CONCEPTS TO MASTER (DEDICATED FLOW) */}
            {currentSlide.type === "key_concepts" && (
              <div className="ll-rise" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="ll-concept-header">
                  <h1 className="ll-concept-title">{node.title}</h1>
                </div>

                <div className="ll-key-card" style={{ padding: "24px" }}>
                  <div className="ll-key-card-header">
                    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="#FFB547" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="15" r="4" />
                      <path d="M11 12l9-9M16 7l3 3M14 9l2 2" />
                    </svg>
                    <span className="ll-key-label" style={{ fontSize: 14 }}>KEY CONCEPTS TO MASTER</span>
                  </div>
                  {(lc?.keyConcepts || node.keyConcepts || [node.title]).map((kc, i) => (
                    <div key={i} className="ll-key-item" style={{ padding: "16px" }}>
                      <div className="ll-key-num">{i + 1}</div>
                      <span className="ll-key-text" style={{ fontSize: 18 }}>{kc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHECKPOINT QUIZZES (QUIZ 1 & QUIZ 2): Clean Question & Small AI Regen Button */}
            {currentSlide.type === "quiz" && (
              <div className="ll-rise" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="ll-quiz-header">
                  <div className="ll-header-actions" style={{ justifyContent: "flex-end" }}>
                    {/* Small regenerate button at the top */}
                    <button
                      type="button"
                      className={`ll-btn-regen ${isRegenerating ? "spinning" : ""}`}
                      onClick={() => handleRegenerateQuiz(currentSlide.quizNum || 1)}
                      disabled={isRegenerating}
                      title="Generate a similar question"
                    >
                      <FiRefreshCw size={13} />
                      <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
                    </button>
                  </div>

                  <h1 className="ll-question" style={{ marginTop: 6 }}>
                    {activeQuiz?.question ?? "Check your understanding of this concept."}
                  </h1>
                </div>

                {activeQuiz && (
                  <div className="ll-options">
                    {activeQuiz.options.map((opt, i) => {
                      const isCorrect = activeCorrect && i === activeQuiz.correctAnswerIndex
                      const isWrong = !activeCorrect && activeWrong.includes(i)
                      const isDimmed = activeCorrect && i !== activeQuiz.correctAnswerIndex
                      let bg = "#0F1528", border = "#1E2A47", shadow = "0 4px 0 #0A111C"
                      let color = "#F2F5FA", badgeBg = "#1E293B", badgeClr = "#C5D2E6"
                      if (isCorrect) {
                        bg = "#0F2E28"; border = "#22C55E"; shadow = "0 4px 0 #15803D"
                        badgeBg = "#22C55E"; badgeClr = "#052E16"
                      } else if (isWrong) {
                        bg = "#3B1219"; border = "#F87171"; shadow = "0 4px 0 #7F1D1D"
                        color = "#FECACA"; badgeBg = "#F87171"; badgeClr = "#3B0A0A"
                      } else if (isDimmed) {
                        color = "#8392AD"; shadow = "none"
                      }
                      return (
                        <button
                          key={i}
                          className="ll-option-btn"
                          disabled={activeCorrect}
                          onClick={() => {
                            if (activeCorrect) return
                            if (currentSlide.quizNum === 1) {
                              setSelectedOpt1(i)
                              if (i === activeQuiz.correctAnswerIndex) setCorrect1(true)
                              else if (!wrong1.includes(i)) setWrong1((prev) => [...prev, i])
                            } else {
                              setSelectedOpt2(i)
                              if (i === activeQuiz.correctAnswerIndex) setCorrect2(true)
                              else if (!wrong2.includes(i)) setWrong2((prev) => [...prev, i])
                            }
                          }}
                          style={{ background: bg, borderColor: border, boxShadow: shadow, color }}
                        >
                          <span className="ll-option-badge" style={{ background: badgeBg, color: badgeClr }}>
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

            {/* FINAL SLIDE: REWARD & COMPLETION (Duolingo Style Node Completed) */}
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

                  <h1 className="ll-reward-title">Node completed!</h1>
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
                    <span>CONTINUE</span>
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

          {/* FOOTER (Shown only during lesson and quiz slides) */}
          {currentSlide.type !== "reward" && (
            <footer className="ll-footer" style={{ background: barBg, borderColor: barBorder }}>
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

