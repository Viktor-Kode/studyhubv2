"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import {
  DEFAULT_TOPIC,
  SAMPLE_TOPICS,
  type LearningNode,
} from "@/lib/data/studyPath"
import "../lesson-loop.css"
import { FiX, FiClock } from "react-icons/fi"

type Phase = "lesson" | "quiz" | "reward"

const SEG_ON  = "#3DDC97"
const SEG_OFF = "#243146"
const DAYS    = ["M", "T", "W", "T", "F", "S", "S"]

function resolveNode(nodeIdStr: string): LearningNode | null {
  const id = parseInt(nodeIdStr, 10)
  if (isNaN(id)) return null
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("studyhelp_active_topic")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const node = parsed?.nodes?.find((n: LearningNode) => n.id === id)
        if (node) return node
      } catch { /* ignore */ }
    }
  }
  for (const topic of SAMPLE_TOPICS) {
    const node = topic.nodes.find((n) => n.id === id)
    if (node) return node
  }
  return DEFAULT_TOPIC.nodes.find((n) => n.id === id) ?? null
}

function LessonLoopContent() {
  const params  = useParams()
  const router  = useRouter()
  const nodeId  = (params?.nodeId as string) ?? ""

  const node = useMemo(() => resolveNode(nodeId), [nodeId])

  const [phase,   setPhase]   = useState<Phase>("lesson")
  const [correct, setCorrect] = useState(false)
  const [wrong,   setWrong]   = useState<number[]>([])
  const [xp,      setXp]      = useState(2480)

  useEffect(() => {
    setPhase("lesson")
    setCorrect(false)
    setWrong([])
  }, [nodeId])

  if (!node) {
    return (
      <div className="ll-root" style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#94A3B8", fontSize: 18, fontWeight: 800 }}>Node not found.</p>
        <Link href="/dashboard/student" className="ll-cta-btn green" style={{ width: "auto", padding: "0 32px" }}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const q       = node.quiz
  const lc      = node.lessonContent
  const letters = ["A", "B", "C", "D"]
  const step    = phase === "lesson" ? 1 : phase === "quiz" ? 2 : 3

  const showCorrect = phase === "quiz" && correct
  const showWrong   = phase === "quiz" && !correct && wrong.length > 0
  const barBg       = showCorrect ? "#0F2E28" : showWrong ? "#3B1219" : "#0F1528"
  const barBorder   = showCorrect ? "#1F6F55" : showWrong ? "#7F1D1D" : "#1E2A47"

  const xpEarned = node.xp ?? 20
  const headerXp = phase === "reward" ? xp + xpEarned : xp

  const handleGoReward = () => {
    if (correct) {
      setPhase("reward")
      setXp((prev) => prev + xpEarned)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["student", "teacher"]}>
      <div className="ll-root">
        <div className="ll-container">

          {/* TOP BAR */}
          <header className="ll-topbar">
            <button className="ll-close-btn" onClick={() => router.back()} aria-label="Close lesson">
              <FiX size={20} strokeWidth={2.6} />
            </button>
            <div role="img" aria-label={`Step ${step} of 3`} className="ll-progress-bar">
              <div className="ll-seg" style={{ background: SEG_ON }} />
              <div className="ll-seg" style={{ background: step >= 2 ? SEG_ON : SEG_OFF }} />
              <div className="ll-seg" style={{ background: step >= 3 ? SEG_ON : SEG_OFF }} />
            </div>
            <div className="ll-xp-pill">
              <svg role="img" aria-label="XP" width="16" height="16" viewBox="0 0 24 24" fill="#FFD23F">
                <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
              </svg>
              <span>{headerXp.toLocaleString()}</span>
            </div>
          </header>

          {/* MAIN */}
          <main className="ll-main">

            {/* PHASE 1: CONCEPT */}
            {phase === "lesson" && (
              <div className="ll-rise" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="ll-concept-header">
                  <div className="ll-badge-row">
                    <span className="ll-badge-concept">CONCEPT</span>
                    <span className="ll-badge-duration">
                      <FiClock size={14} />
                      {node.duration}
                    </span>
                  </div>
                  <h1 className="ll-concept-title">{node.title}</h1>
                </div>

                {lc ? (
                  <>
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
                    <div className="ll-paragraphs">
                      {lc.paragraphs.map((p, i) => (
                        <p key={i} className="ll-para">{p}</p>
                      ))}
                    </div>
                    <div className="ll-key-card">
                      <div className="ll-key-card-header">
                        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"
                          stroke="#FFB547" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="15" r="4" />
                          <path d="M11 12l9-9M16 7l3 3M14 9l2 2" />
                        </svg>
                        <span className="ll-key-label">KEY CONCEPTS</span>
                      </div>
                      {lc.keyConcepts.map((kc, i) => (
                        <div key={i} className="ll-key-item">
                          <div className="ll-key-num">{i + 1}</div>
                          <span className="ll-key-text">{kc}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="ll-para">{node.summary}</p>
                    <div className="ll-key-card">
                      <div className="ll-key-card-header">
                        <span className="ll-key-label">KEY CONCEPTS</span>
                      </div>
                      {node.keyConcepts.map((kc, i) => (
                        <div key={i} className="ll-key-item">
                          <div className="ll-key-num">{i + 1}</div>
                          <span className="ll-key-text">{kc}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PHASE 2: QUIZ */}
            {phase === "quiz" && (
              <div className="ll-rise" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="ll-quiz-header">
                  <div className="ll-badge-row">
                    <span className="ll-badge-checkpoint">CHECKPOINT</span>
                    <span className="ll-quiz-sub">Pick one answer</span>
                  </div>
                  <h1 className="ll-question">{q?.question ?? "No quiz available for this node."}</h1>
                </div>
                {q && (
                  <div className="ll-options">
                    {q.options.map((opt, i) => {
                      const isCorrect = correct && i === q.correctAnswerIndex
                      const isWrong   = !correct && wrong.includes(i)
                      const isDimmed  = correct && i !== q.correctAnswerIndex
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
                          disabled={correct}
                          onClick={() => {
                            if (correct) return
                            if (i === q.correctAnswerIndex) setCorrect(true)
                            else if (!wrong.includes(i)) setWrong((prev) => [...prev, i])
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

            {/* PHASE 3: REWARD */}
            {phase === "reward" && (
              <div className="ll-reward-root ll-rise">
                <div className="ll-reward-trophy ll-pop">
                  <div className="ll-reward-glow ll-glow" />
                  <div className="ll-reward-circle">
                    <svg role="img" aria-label="Completed" width="64" height="64" viewBox="0 0 24 24" fill="none"
                      stroke="#052E16" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 6.5" />
                    </svg>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h1 className="ll-reward-heading">Node Completed!</h1>
                  <span className="ll-reward-sub">{node.title}</span>
                </div>

                <div className="ll-reward-stats">
                  <section className="ll-stat-xp">
                    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="#FFD23F">
                      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
                    </svg>
                    <span className="ll-stat-xp-num">+{xpEarned} XP</span>
                    <span className="ll-stat-xp-sub">{(xp + xpEarned).toLocaleString()} XP total</span>
                  </section>
                  <section className="ll-stat-goal">
                    <div style={{ position: "relative", width: 38, height: 38 }}>
                      <svg aria-hidden="true" width="38" height="38" viewBox="0 0 44 44" fill="none"
                        style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="22" cy="22" r="17" stroke="#1F6F55" strokeWidth="6" />
                        <circle cx="22" cy="22" r="17" stroke="#3DDC97" strokeWidth="6"
                          strokeLinecap="round" strokeDasharray="106.8 106.8" />
                      </svg>
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="#3DDC97" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"
                        style={{ position: "absolute", left: 10, top: 10 }}>
                        <path d="M5 12.5l4.5 4.5L19 6.5" />
                      </svg>
                    </div>
                    <span className="ll-stat-goal-num">Goal done</span>
                    <span className="ll-stat-goal-sub">50 / 50 XP today</span>
                  </section>
                </div>

                <section className="ll-streak-card">
                  <div className="ll-streak-header">
                    <span className="ll-streak-label">STREAK</span>
                    <span className="ll-streak-val">12 day streak kept</span>
                  </div>
                  <div className="ll-streak-days">
                    {DAYS.map((d, i) => (
                      <div key={i} className="ll-streak-day">
                        <div className="ll-streak-dot" style={{ borderColor: i === 6 ? "#F2F5FA" : "#22C55E" }}>
                          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="#052E16" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12.5l4.5 4.5L19 6.5" />
                          </svg>
                        </div>
                        <span className="ll-streak-day-label"
                          style={{ color: i === 6 ? "#F2F5FA" : "#94A3B8" }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {node.nextNodeTitle && (
                  <section className="ll-next-card">
                    <div className="ll-next-icon">
                      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="11" width="14" height="10" rx="2.5" />
                        <path d="M8 11V8a4 4 0 0 1 7.5-2" />
                      </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span className="ll-next-sublabel">NEXT NODE UNLOCKED</span>
                      <span className="ll-next-title">{node.nextNodeTitle}</span>
                    </div>
                  </section>
                )}
              </div>
            )}

          </main>

          {/* FOOTER */}
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
                  <div className="ll-feedback-body correct">{q?.explanation}</div>
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
                  <div className="ll-feedback-body wrong">{q?.hint} Pick another answer to try again.</div>
                </div>
              </div>
            )}

            {phase === "lesson" && (
              <button className="ll-cta-btn green" onClick={() => setPhase("quiz")}>
                GOT IT, LET&apos;S TEST
              </button>
            )}
            {phase === "quiz" && (
              <button
                className={`ll-cta-btn ${correct ? "green" : "disabled"}`}
                onClick={handleGoReward}
                disabled={!correct}
              >
                CONTINUE
              </button>
            )}
            {phase === "reward" && (
              <Link href="/dashboard/student" className="ll-cta-btn green">
                <span>BACK TO MAP</span>
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="#08241A">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Link>
            )}
          </footer>

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
