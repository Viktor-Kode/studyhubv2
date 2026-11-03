"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import RetentionModeSwitcher from "@/components/study/RetentionModeSwitcher"
import {
  getFlashcardsForCourse,
  type Flashcard,
} from "@/lib/data/flashcards"
import { type StudyPathTopic } from "@/lib/data/studyPath"
import { getFlashcards, reviewFlashcard } from "@/src/services/api"
import {
  FiArrowLeft,
  FiRepeat,
  FiCheckCircle,
  FiAward,
  FiZap,
  FiVolume2,
  FiVolumeX,
  FiHelpCircle,
  FiLock,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCw,
  FiX,
  FiLoader,
} from "react-icons/fi"
import { BiBrain } from "react-icons/bi"
import "./vault.css"

export default function FlashcardVaultPage() {
  return (
    <ProtectedRoute>
      <VaultContent />
    </ProtectedRoute>
  )
}

function VaultContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const courseId = params?.courseId as string | undefined
  const resolvedCourseId = courseId || ""
  const nodeIdQuery = searchParams?.get("nodeId")
  const modeQuery = searchParams?.get("mode")
  const initialNodeId = nodeIdQuery ? parseInt(nodeIdQuery, 10) : undefined

  // Active Tab: Flashcards vs Blind Summary
  const [activeTab, setActiveTab] = useState<"flashcards" | "blind">(
    modeQuery === "blind" ? "blind" : "flashcards"
  )

  // Find topic info for header from localStorage (no demo data)
  const [topic, setTopic] = useState<StudyPathTopic | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const tryLoad = () => {
      try {
        const rawActive = localStorage.getItem("studyhelp_active_topic")
        if (rawActive) {
          const parsed = JSON.parse(rawActive)
          if (!resolvedCourseId || parsed?.topicId === resolvedCourseId) {
            setTopic(parsed)
            return
          }
        }
        const rawSaved = localStorage.getItem("studyhelp_saved_topics")
        if (rawSaved && resolvedCourseId) {
          const list: StudyPathTopic[] = JSON.parse(rawSaved)
          const found = list.find((t) => t.topicId === resolvedCourseId)
          if (found) {
            setTopic(found)
            return
          }
        }
      } catch {}
    }
    tryLoad()
  }, [resolvedCourseId])

  // Active deck state (Hard cards get scheduled to repeat)
  const [deck, setDeck] = useState<Flashcard[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Blind Summary State
  const [point1, setPoint1] = useState("")
  const [point2, setPoint2] = useState("")
  const [point3, setPoint3] = useState("")
  const [blindSubmitted, setBlindSubmitted] = useState(false)
  const [blindAwarding, setBlindAwarding] = useState(false)
  const [earnedXp, setEarnedXp] = useState<number | null>(null)

  // Tracking metrics
  const [hardCount, setHardCount] = useState(0)
  const [goodCount, setGoodCount] = useState(0)
  const [easyCount, setEasyCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [totalReviewed, setTotalReviewed] = useState(0)

  // Load cards from backend API on mount, with localStorage fallback
  useEffect(() => {
    let cancelled = false
    setIsLoadingCards(true)

    getFlashcards({ category: resolvedCourseId })
      .then((res: any[]) => {
        if (cancelled) return
        if (Array.isArray(res) && res.length > 0) {
          const mapped: Flashcard[] = res.map((c, i) => ({
            id: c._id || c.id || `card-${i}`,
            nodeId: c.nodeId || initialNodeId || 1,
            nodeTitle: c.nodeTitle || c.category || topic?.title || 'Study Card',
            term: c.front || c.term || 'Concept',
            question: c.front || c.question || 'Concept question',
            definition: c.back || c.definition || 'Concept definition',
            analogy: c.analogy,
            keyConcepts: c.keyConcepts || c.tags || [],
            codeSnippet: c.codeSnippet,
            tags: c.tags || []
          }))
          setDeck(mapped)
        } else {
          // Graceful fallback using localStorage topic nodes
          const fallback = getFlashcardsForCourse(resolvedCourseId, initialNodeId)
          setDeck(fallback)
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('[FlashcardVault] Backend load failed, falling back to local:', err)
        const fallback = getFlashcardsForCourse(resolvedCourseId, initialNodeId)
        setDeck(fallback)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCards(false)
      })

    return () => { cancelled = true }
  }, [resolvedCourseId, initialNodeId, topic?.title])

  const currentCard: Flashcard | undefined = deck[currentIndex]

  // Play subtle visual/audio feedback
  const playChime = useCallback((type: "flip" | "good" | "hard") => {
    if (typeof window === "undefined") return
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === "flip") {
        osc.frequency.setValueAtTime(320, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(0.04, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
      } else if (type === "good") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.14) // E5
        gain.gain.setValueAtTime(0.06, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      } else if (type === "hard") {
        osc.frequency.setValueAtTime(340, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.05, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
        osc.start()
        osc.stop(ctx.currentTime + 0.12)
      }
    } catch {
      // AudioContext not allowed or unsupported
    }
  }, [])

  // Flip Card Handler
  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev
      if (soundEnabled) playChime("flip")
      return next
    })
  }, [soundEnabled, playChime])

  // Confidence Rating Actions
  const handleRate = useCallback(
    (rating: "hard" | "good" | "easy") => {
      if (!currentCard) return

      if (soundEnabled) {
        if (rating === "hard") playChime("hard")
        else playChime("good")
      }

      setTotalReviewed((prev) => prev + 1)
      setIsFlipped(false)

      let updatedDeck = [...deck]

      if (rating === "hard") {
        setHardCount((prev) => prev + 1)
        // Schedule card to repeat soon: reinsert 2 slots forward or at the end
        const repeatCard = { ...currentCard, id: `${currentCard.id}-rep-${Date.now()}` }
        const insertPos = Math.min(currentIndex + 3, updatedDeck.length)
        updatedDeck.splice(insertPos, 0, repeatCard)
      } else if (rating === "good") {
        setGoodCount((prev) => prev + 1)
      } else if (rating === "easy") {
        setEasyCount((prev) => prev + 1)
      }

      setDeck(updatedDeck)

      if (currentIndex + 1 >= updatedDeck.length) {
        setIsComplete(true)
      } else {
        setCurrentIndex((prev) => prev + 1)
      }

      // Sync SRS rating with backend
      if (currentCard && !currentCard.id.includes('-rep-')) {
        reviewFlashcard({
          cardId: currentCard.id,
          rating,
          subject: topic.courseCode || topic.title,
          topic: currentCard.nodeTitle
        }).catch((err) => console.warn('[reviewFlashcard] sync error:', err))
      }
    },
    [currentCard, currentIndex, deck, soundEnabled, playChime, topic.courseCode, topic.title]
  )

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keystrokes if user is typing in inputs or textareas
      const target = e.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
        return
      }

      if (activeTab !== "flashcards" || isComplete) return

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        toggleFlip()
      } else if (e.key === "1") {
        e.preventDefault()
        handleRate("hard")
      } else if (e.key === "2") {
        e.preventDefault()
        handleRate("good")
      } else if (e.key === "3") {
        e.preventDefault()
        handleRate("easy")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTab, isComplete, toggleFlip, handleRate])

  // Reset Deck
  const handleRestart = () => {
    const fallback = getFlashcardsForCourse(courseId, initialNodeId)
    setDeck(fallback)
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsComplete(false)
    setHardCount(0)
    setGoodCount(0)
    setEasyCount(0)
    setTotalReviewed(0)
  }

  // Handle Blind Summary Submit
  const handleBlindSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBlindAwarding(true)
    setTimeout(() => {
      setBlindAwarding(false)
      setEarnedXp(25)
      setBlindSubmitted(true)
    }, 600)
  }

  const handleBlindReset = () => {
    setPoint1("")
    setPoint2("")
    setPoint3("")
    setBlindSubmitted(false)
    setEarnedXp(null)
  }

  const filledCount = [point1, point2, point3].filter((p) => p.trim().length > 0).length
  const canSubmitBlind = filledCount === 3

  const totalCards = deck.length
  const activeNodeId = currentCard?.nodeId || initialNodeId || 1
  const activeNode = topic.nodes.find((n) => n.id === activeNodeId) || topic.nodes[0]

  return (
    <div className="rv-root">
      <div className="rv-glow-top" />

      <div className="rv-container">
        {/* Topbar */}
        <header className="rv-topbar">
          <Link
            href={`/dashboard/student/map/${courseId}`}
            className="rv-icon-btn"
            title="Back to Study Map"
          >
            <FiArrowLeft />
          </Link>

          {/* Mode Switcher Tab (Flashcards vs Blind Summary) */}
          <RetentionModeSwitcher
            activeMode={activeTab}
            courseId={courseId}
            nodeId={activeNodeId}
            onChangeMode={(mode) => setActiveTab(mode)}
            compact
          />

          <button
            type="button"
            className="rv-icon-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute SFX" : "Enable SFX"}
          >
            {soundEnabled ? <FiVolume2 style={{ color: "#3DDC97" }} /> : <FiVolumeX style={{ color: "#94A3B8" }} />}
          </button>
        </header>

        {/* ── TAB 1: FLASHCARDS ── */}
        {activeTab === "flashcards" && (
          isLoadingCards ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, gap: 16 }}>
              <FiLoader size={30} style={{ color: "#3DDC97", animation: "spin 1s linear infinite" }} />
              <span style={{ color: "#94A3B8", fontSize: 14, fontWeight: 600 }}>Loading flashcards from vault...</span>
            </div>
          ) : !isComplete ? (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {/* Card Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "0 4px" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#94A3B8" }}>
                  Card {currentIndex + 1} of {totalCards}
                </span>
                <span
                  onClick={toggleFlip}
                  style={{
                    fontSize: 13,
                    color: "#818CF8",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <FiRotateCw /> Tap to flip
                </span>
              </div>

              {/* Card Element */}
              {currentCard && (
                <div className="rv-card-scene">
                  <div
                    tabIndex={0}
                    role="button"
                    aria-label="Flashcard. Tap or press space to flip"
                    className={`rv-flip-card ${isFlipped ? "flipped" : ""}`}
                    onClick={toggleFlip}
                  >
                    {/* FRONT FACE */}
                    <div className="rv-card-face rv-card-front">
                      <div className="rv-card-badge-row">
                        <span className="rv-card-topic-tag">QUESTION</span>
                        <span className="rv-card-node-tag">
                          Node #{currentCard.nodeId}: {currentCard.nodeTitle}
                        </span>
                      </div>

                      <div className="rv-card-body">
                        <h2 className="rv-card-term-title">{currentCard.term}:</h2>
                        <p className="rv-card-question">{currentCard.question}</p>
                      </div>

                      <div className="rv-card-flip-prompt">
                        <span>Tap to reveal answer</span>
                      </div>
                    </div>

                    {/* BACK FACE */}
                    <div className="rv-card-face rv-card-back">
                      <div className="rv-card-badge-row">
                        <span
                          className="rv-card-topic-tag"
                          style={{
                            background: "rgba(5, 150, 105, 0.2)",
                            color: "#34D399",
                            borderColor: "rgba(5, 150, 105, 0.4)",
                          }}
                        >
                          ANSWER
                        </span>
                        <span className="rv-card-node-tag">{currentCard.term}</span>
                      </div>

                      <div className="rv-card-body">
                        <div className="rv-card-definition">
                          {currentCard.definition}
                        </div>

                        {currentCard.codeSnippet && (
                          <pre className="rv-card-code">
                            <code>{currentCard.codeSnippet}</code>
                          </pre>
                        )}
                      </div>

                      <div className="rv-card-flip-prompt">
                        <span>Tap to return to question</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Dock: Controls (Previous / Flip / Next) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.2fr 1fr",
                  gap: 12,
                  marginTop: "auto",
                }}
              >
                <button
                  type="button"
                  className="rv-icon-btn"
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 16,
                    fontWeight: 800,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: "#1E293B",
                    color: currentIndex > 0 ? "#F8FAFC" : "#64748B",
                    borderColor: "#334155",
                    cursor: currentIndex > 0 ? "pointer" : "not-allowed",
                  }}
                  disabled={currentIndex === 0}
                  onClick={() => {
                    if (currentIndex > 0) {
                      setIsFlipped(false)
                      setCurrentIndex((prev) => prev - 1)
                    }
                  }}
                >
                  <FiChevronLeft size={18} />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 16,
                    fontWeight: 900,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "#4F46E5",
                    color: "#FFFFFF",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(79, 70, 229, 0.4)",
                    transition: "transform 0.1s ease",
                  }}
                  onClick={toggleFlip}
                >
                  <FiRotateCw size={17} />
                  <span>Flip</span>
                </button>

                <button
                  type="button"
                  className="rv-icon-btn"
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 16,
                    fontWeight: 800,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: "#1E293B",
                    color: "#F8FAFC",
                    borderColor: "#334155",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    handleRate("good")
                  }}
                >
                  <span>Next</span>
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* COMPLETION VIEW */
            <div className="rv-finish-card">
              <div className="rv-trophy-badge">
                <FiAward style={{ fontSize: 44, color: "#0F172A" }} />
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "#F8FAFC" }}>
                Flashcard Drill Done!
              </h1>
              <p style={{ fontSize: 14, color: "#94A3B8", margin: 0, maxWidth: 380 }}>
                You reviewed {totalReviewed} concept cards for <strong>{topic.title}</strong>.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  width: "100%",
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  className="rv-flip-action-btn"
                  style={{ background: "#059669" }}
                  onClick={() => {
                    handleRestart()
                    setActiveTab("blind")
                  }}
                >
                  <BiBrain size={20} />
                  <span>Continue to Blind Summary</span>
                </button>

                <button
                  type="button"
                  className="rv-icon-btn"
                  style={{ width: "100%", height: 50, borderRadius: 14, fontWeight: 800 }}
                  onClick={handleRestart}
                >
                  <FiRepeat style={{ marginRight: 8 }} />
                  <span>Drill Cards Again</span>
                </button>

                <Link
                  href={`/dashboard/student/map/${courseId}`}
                  style={{
                    color: "#94A3B8",
                    fontSize: 14,
                    fontWeight: 700,
                    textAlign: "center",
                    textDecoration: "none",
                    marginTop: 4,
                  }}
                >
                  Return to Study Map
                </Link>
              </div>
            </div>
          )
        )}

        {/* ── TAB 2: BLIND SUMMARY CHALLENGE ── */}
        {activeTab === "blind" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, maxWidth: 580, margin: "0 auto", width: "100%" }}>
            {/* Clean Prompt Card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(79, 70, 229, 0.08) 100%)",
                borderRadius: 16,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(129, 140, 248, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FiLock style={{ color: "#FBBF24", fontSize: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF" }}>
                  Recall: <strong style={{ color: "#FBBF24" }}>{activeNode.title}</strong>
                </span>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: filledCount === 3 ? "#059669" : "rgba(129, 140, 248, 0.2)",
                  color: filledCount === 3 ? "#FFFFFF" : "#C7D2FE",
                }}
              >
                {filledCount} / 3 Completed
              </span>
            </div>

            {!blindSubmitted ? (
              <form onSubmit={handleBlindSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Point 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8" }}>
                    Point 1
                  </label>
                  <textarea
                    rows={2}
                    value={point1}
                    onChange={(e) => setPoint1(e.target.value)}
                    placeholder="Core concept or primary rule..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: 14,
                      background: "#131C31",
                      border: "1px solid #1E293B",
                      borderRadius: 12,
                      color: "#F8FAFC",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>

                {/* Point 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8" }}>
                    Point 2
                  </label>
                  <textarea
                    rows={2}
                    value={point2}
                    onChange={(e) => setPoint2(e.target.value)}
                    placeholder="Supporting mechanism or detail..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: 14,
                      background: "#131C31",
                      border: "1px solid #1E293B",
                      borderRadius: 12,
                      color: "#F8FAFC",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>

                {/* Point 3 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8" }}>
                    Point 3
                  </label>
                  <textarea
                    rows={2}
                    value={point3}
                    onChange={(e) => setPoint3(e.target.value)}
                    placeholder="Key takeaway or practical application..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: 14,
                      background: "#131C31",
                      border: "1px solid #1E293B",
                      borderRadius: 12,
                      color: "#F8FAFC",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmitBlind || blindAwarding}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 14,
                    background: canSubmitBlind ? "#4F46E5" : "#1E293B",
                    color: canSubmitBlind ? "#FFFFFF" : "#64748B",
                    fontSize: 14,
                    fontWeight: 900,
                    border: "none",
                    cursor: canSubmitBlind ? "pointer" : "not-allowed",
                    boxShadow: canSubmitBlind ? "0 4px 14px rgba(79, 70, 229, 0.4)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {blindAwarding ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <span>Submit & Claim +25 XP</span>
                      <FiZap style={{ color: "#FDE047" }} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Blind Submitted Results */
              <div
                style={{
                  background: "#111827",
                  border: "2px solid #1E293B",
                  borderRadius: 22,
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(5, 150, 105, 0.2)",
                    border: "2px solid #059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34D399",
                    fontSize: 32,
                  }}
                >
                  ⚡
                </div>

                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: "#F8FAFC", margin: 0 }}>
                    Recall Completed! +{earnedXp ?? 25} XP
                  </h3>
                  <p style={{ fontSize: 13, color: "#94A3B8", margin: "6px 0 0" }}>
                    Forcing your brain to retrieve knowledge strengthens memory pathways by up to 40%.
                  </p>
                </div>

                {/* Key Concepts Reference */}
                <div style={{ width: "100%", background: "#172238", padding: "16px", borderRadius: 14, textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: 8 }}>
                    Key Concepts to Compare:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#E2E8F0", fontSize: 13, lineHeight: 1.6 }}>
                    {activeNode.keyConcepts?.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: "flex", gap: 10, width: "100%" }}>
                  <button
                    type="button"
                    onClick={handleBlindReset}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 14,
                      background: "#1E293B",
                      color: "#E2E8F0",
                      fontSize: 13,
                      fontWeight: 800,
                      border: "1px solid #334155",
                      cursor: "pointer",
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("flashcards")}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 14,
                      background: "#059669",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 900,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Review Cards
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
