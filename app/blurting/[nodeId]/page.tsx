"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import RetentionModeSwitcher from "@/components/study/RetentionModeSwitcher"
import { DEFAULT_TOPIC, SAMPLE_TOPICS, type LearningNode } from "@/lib/data/studyPath"
import {
  FiArrowLeft,
  FiClock,
  FiZap,
  FiCheckCircle,
  FiAlertTriangle,
  FiRepeat,
  FiTrendingUp,
  FiEdit3,
  FiSend,
  FiAward,
} from "react-icons/fi"
import "./blurting.css"

function resolveNode(nodeIdStr: string): { node: LearningNode; courseId: string; courseTitle: string } | null {
  const id = parseInt(nodeIdStr, 10)
  if (isNaN(id)) return null

  // Check localStorage active topic first
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("studyhelp_active_topic")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const found = parsed?.nodes?.find((n: LearningNode) => n.id === id)
        if (found) {
          return {
            node: found,
            courseId: parsed.topicId || "csc202-queues-deques",
            courseTitle: parsed.title || "Data Structures",
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  // Check sample topics
  for (const topic of SAMPLE_TOPICS) {
    const found = topic.nodes.find((n) => n.id === id)
    if (found) {
      return {
        node: found,
        courseId: topic.topicId,
        courseTitle: topic.title,
      }
    }
  }

  const defNode = DEFAULT_TOPIC.nodes.find((n) => n.id === id)
  if (defNode) {
    return {
      node: defNode,
      courseId: DEFAULT_TOPIC.topicId,
      courseTitle: DEFAULT_TOPIC.title,
    }
  }

  return null
}

export default function BlurtingStudioPage() {
  return (
    <ProtectedRoute>
      <BlurtingStudioContent />
    </ProtectedRoute>
  )
}

function BlurtingStudioContent() {
  const params = useParams()
  const router = useRouter()
  const nodeId = (params?.nodeId as string) || "4"

  const nodeData = useMemo(() => resolveNode(nodeId), [nodeId])
  const node = nodeData?.node
  const courseId = nodeData?.courseId || "csc202-queues-deques"

  // Step state: 1 = Study Prompt (30s), 2 = The Blank Canvas, 3 = AI Evaluation
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: 30s Countdown timer
  const [countdown, setCountdown] = useState(30)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Step 2: Canvas state
  const [blurtText, setBlurtText] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const blurtTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Step 3: Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalResult, setEvalResult] = useState<{
    score: number
    xp: number
    matchedConcepts: string[]
    missedConcepts: string[]
    feedbackSummary: string
  } | null>(null)

  // Countdown effect for Step 1
  useEffect(() => {
    if (step === 1) {
      setCountdown(30)
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setStep(2)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [step])

  // Elapsed timer effect for Step 2
  useEffect(() => {
    if (step === 2) {
      setElapsedSeconds(0)
      blurtTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (blurtTimerRef.current) clearInterval(blurtTimerRef.current)
    }
  }, [step])

  // Format elapsed time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`
  }

  // Word count & Char count
  const wordCount = useMemo(() => {
    const trimmed = blurtText.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }, [blurtText])

  // Grade My Blurt Handler
  const handleGradeBlurt = () => {
    if (!node) return
    setIsEvaluating(true)
    setStep(3)

    // Simulate realistic AI semantic diff check
    setTimeout(() => {
      const lowerText = blurtText.toLowerCase()
      const keyConcepts = node.keyConcepts || []

      const matched: string[] = []
      const missed: string[] = []

      keyConcepts.forEach((c) => {
        const words = c.toLowerCase().split(/\s+/)
        // match if either the full phrase or key word is present
        const isMatched =
          lowerText.includes(c.toLowerCase()) ||
          words.some((w) => w.length > 3 && lowerText.includes(w))

        if (isMatched) {
          matched.push(c)
        } else {
          missed.push(c)
        }
      })

      // Calculate accuracy
      const conceptCoverage =
        keyConcepts.length > 0 ? (matched.length / keyConcepts.length) * 60 : 40
      const lengthBonus = Math.min(30, Math.floor(wordCount * 0.7))
      const rawScore = Math.min(98, Math.max(35, Math.round(conceptCoverage + lengthBonus)))
      const xpEarned = Math.round(rawScore * 0.7)

      let feedback = ""
      if (rawScore >= 80) {
        feedback = `Outstanding retention! You articulated the primary invariants of ${node.title} and preserved key semantic boundaries.`
      } else if (rawScore >= 60) {
        feedback = `Solid grasp of fundamental mechanics. You remembered ${matched.length} key terms, but missed critical edge details.`
      } else {
        feedback = `Good early retrieval effort. Blurting works through contrast: review the missed terms below, then re-drill in flashcards.`
      }

      setEvalResult({
        score: rawScore,
        xp: xpEarned,
        matchedConcepts: matched,
        missedConcepts: missed,
        feedbackSummary: feedback,
      })
      setIsEvaluating(false)
    }, 1200)
  }

  const handleRestart = () => {
    setBlurtText("")
    setEvalResult(null)
    setStep(1)
  }

  if (!node) {
    return (
      <div className="bl-root" style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#94A3B8", fontSize: 18, fontWeight: 800 }}>Node not found.</p>
        <Link href="/dashboard/student" className="bl-cta-btn bl-cta-purple" style={{ width: "auto", padding: "0 28px" }}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const timerProgress = ((30 - countdown) / 30) * 100

  return (
    <div className="bl-root">
      <div className="bl-glow-top" />

      <div className="bl-container">
        {/* Header with Mode Switcher */}
        <header className="bl-topbar">
          <Link
            href={`/dashboard/student/map/${courseId}`}
            className="bl-btn-icon"
            title="Return to Map"
          >
            <FiArrowLeft />
          </Link>

          {/* Mode Switcher Tab */}
          <RetentionModeSwitcher
            activeMode="blurting"
            courseId={courseId}
            nodeId={node.id}
            compact
          />

          <div style={{ width: 42 }} />
        </header>

        {/* Step Indicator Bar */}
        <div className="bl-steps-bar">
          <div className={`bl-step-item ${step === 1 ? "active" : "completed"}`}>
            <span>1. Study Prompt</span>
          </div>
          <div className="bl-step-sep" />
          <div className={`bl-step-item ${step === 2 ? "active" : step === 3 ? "completed" : ""}`}>
            <span>2. The Blurt</span>
          </div>
          <div className="bl-step-sep" />
          <div className={`bl-step-item ${step === 3 ? "active" : ""}`}>
            <span>3. AI Evaluation</span>
          </div>
        </div>

        {/* ── STEP 1: STUDY PROMPT (30s) ── */}
        {step === 1 && (
          <div className="bl-study-card">
            <div className="bl-timer-header">
              <div className="bl-countdown-pill">
                <div className="bl-timer-circle">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="#1E2A47"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="4"
                      strokeDasharray="125.6"
                      strokeDashoffset={125.6 - (125.6 * timerProgress) / 100}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                  <span className="bl-timer-number">{countdown}s</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#F8FAFC" }}>
                    Absorb the core ideas
                  </div>
                  <div style={{ fontSize: 13, color: "#94A3B8" }}>
                    Canvas unlocks in {countdown} seconds
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="bl-btn-icon"
                style={{ width: "auto", padding: "0 14px", fontSize: 13, fontWeight: 800, gap: 6 }}
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current)
                  setStep(2)
                }}
              >
                <span>Skip Timer</span>
              </button>
            </div>

            <div className="bl-study-content">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#A78BFA",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Node #{node.id} • Final Retention Briefing
              </span>
              <h1 className="bl-study-title">{node.title}</h1>
              <p className="bl-study-summary">{node.summary}</p>

              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase" }}>
                  Key Concepts to memorize
                </div>
                <div className="bl-concepts-row">
                  {node.keyConcepts.map((concept, idx) => (
                    <span key={idx} className="bl-concept-chip">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {node.lessonContent?.analogy && (
                <div className="bl-analogy-box">
                  <strong style={{ color: "#A78BFA" }}>Core Analogy:</strong>{" "}
                  {node.lessonContent.analogy}
                </div>
              )}
            </div>

            <button
              type="button"
              className="bl-cta-btn bl-cta-purple"
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setStep(2)
              }}
            >
              <FiEdit3 />
              <span>I&apos;m Ready — Start Blurting Canvas</span>
            </button>
          </div>
        )}

        {/* ── STEP 2: THE BLANK CANVAS (THE BLURT) ── */}
        {step === 2 && (
          <div className="bl-canvas-card">
            <div className="bl-canvas-stats-bar">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="bl-live-metric">
                  <FiEdit3 style={{ color: "#A78BFA" }} />
                  <span>{wordCount} Words</span>
                </span>
                <span className="bl-live-metric">
                  <FiClock style={{ color: "#38BDF8" }} />
                  <span>{formatTime(elapsedSeconds)}</span>
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                Distraction-free recall active
              </span>
            </div>

            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#F8FAFC",
                  margin: "0 0 6px 0",
                  lineHeight: 1.3,
                }}
              >
                Type or brain-dump everything you remember about {node.title} without looking.
              </h2>
              <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>
                Don&apos;t worry about spelling or perfection. Stream-of-consciousness recall triggers memory consolidation.
              </p>
            </div>

            <textarea
              autoFocus
              className="bl-editor-area"
              placeholder={`Write down everything you recall about ${node.title}...\n- What is the definition and main idea?\n- How does it work under the hood?\n- What were the key terms and analogies?`}
              value={blurtText}
              onChange={(e) => setBlurtText(e.target.value)}
            />

            <div className="bl-canvas-tips">
              <FiZap style={{ color: "#FFD23F" }} />
              <span>Aim for 40+ words for maximum AI evaluation fidelity.</span>
            </div>

            <button
              type="button"
              className="bl-cta-btn bl-cta-purple"
              disabled={wordCount < 5}
              style={{ opacity: wordCount < 5 ? 0.6 : 1 }}
              onClick={handleGradeBlurt}
            >
              <FiSend />
              <span>Grade My Blurt</span>
            </button>
          </div>
        )}

        {/* ── STEP 3: AI EVALUATION SCREEN ── */}
        {step === 3 && (
          <div className="bl-eval-card">
            {isEvaluating ? (
              <div style={{ padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: "4px solid rgba(139, 92, 246, 0.2)",
                    borderTopColor: "#8B5CF6",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#F8FAFC", margin: 0 }}>
                  Analyzing Semantic Retention...
                </h3>
                <p style={{ fontSize: 14, color: "#94A3B8", margin: 0, maxWidth: 360 }}>
                  Comparing your blurt against course nodes, syllabus invariants, and key terminology.
                </p>
              </div>
            ) : evalResult ? (
              <>
                <div className="bl-eval-score-header">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#C4B5FD", textTransform: "uppercase" }}>
                      Retention Score
                    </div>
                    <div className="bl-score-number-badge">
                      {evalResult.score}%
                    </div>
                    <div style={{ fontSize: 14, color: "#E2E8F0", marginTop: 4 }}>
                      {evalResult.score >= 80 ? "Mastery Grade" : "Good Retention Drill"}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div className="bl-xp-pill">
                      <FiAward />
                      <span>+{evalResult.xp} XP Earned</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>
                      {wordCount} words analyzed
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 18, borderRadius: 16, border: "1px solid #1E2A47" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#A78BFA", textTransform: "uppercase", marginBottom: 6 }}>
                    AI Diagnostic Feedback
                  </div>
                  <p className="bl-feedback-quote">
                    &ldquo;{evalResult.feedbackSummary}&rdquo;
                  </p>
                </div>

                {/* Diff Check Section */}
                <div className="bl-diff-section">
                  {evalResult.missedConcepts.length > 0 && (
                    <div className="bl-diff-box-missed">
                      <div className="bl-diff-title missed">
                        <FiAlertTriangle />
                        <span>What You Missed</span>
                      </div>
                      <p style={{ fontSize: 14, color: "#FCA5A5", margin: 0 }}>
                        Key terms omitted from your blurt:
                      </p>
                      <div className="bl-concepts-row" style={{ marginTop: 4 }}>
                        {evalResult.missedConcepts.map((m, idx) => (
                          <span
                            key={idx}
                            className="bl-concept-chip"
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              borderColor: "rgba(239, 68, 68, 0.35)",
                              color: "#FCA5A5",
                            }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {evalResult.matchedConcepts.length > 0 && (
                    <div className="bl-diff-box-matched">
                      <div className="bl-diff-title matched">
                        <FiCheckCircle />
                        <span>What You Got Right</span>
                      </div>
                      <div className="bl-concepts-row" style={{ marginTop: 4 }}>
                        {evalResult.matchedConcepts.map((m, idx) => (
                          <span
                            key={idx}
                            className="bl-concept-chip"
                            style={{
                              background: "rgba(34, 197, 94, 0.15)",
                              borderColor: "rgba(34, 197, 94, 0.35)",
                              color: "#86EFAC",
                            }}
                          >
                            ✓ {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="bl-cta-btn"
                    style={{ background: "linear-gradient(135deg, #FFD23F 0%, #F59E0B 100%)", color: "#0F172A" }}
                    onClick={() => router.push(`/vault/${courseId}?nodeId=${node.id}`)}
                  >
                    <FiZap />
                    <span>Review in Flashcards Vault</span>
                  </button>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      type="button"
                      className="bl-btn-icon"
                      style={{ width: "100%", height: 48, borderRadius: 14, fontWeight: 800, fontSize: 14 }}
                      onClick={handleRestart}
                    >
                      <FiRepeat style={{ marginRight: 6 }} />
                      <span>Try Again (Re-blurt)</span>
                    </button>

                    <Link
                      href={`/dashboard/student/map/${courseId}`}
                      className="bl-btn-icon"
                      style={{
                        width: "100%",
                        height: 48,
                        borderRadius: 14,
                        fontWeight: 800,
                        fontSize: 14,
                        textDecoration: "none",
                      }}
                    >
                      <span>Return to Map</span>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
