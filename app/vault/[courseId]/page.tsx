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
import { DEFAULT_TOPIC, SAMPLE_TOPICS } from "@/lib/data/studyPath"
import {
  FiArrowLeft,
  FiRepeat,
  FiCheckCircle,
  FiAward,
  FiZap,
  FiVolume2,
  FiVolumeX,
  FiHelpCircle,
  FiTrendingUp,
  FiLock,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCw,
  FiX,
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

  const courseId = (params?.courseId as string) || "csc202-queues-deques"
  const nodeIdQuery = searchParams?.get("nodeId")
  const modeQuery = searchParams?.get("mode")
  const initialNodeId = nodeIdQuery ? parseInt(nodeIdQuery, 10) : undefined

  // Active Tab: Flashcards vs Blind Summary
  const [activeTab, setActiveTab] = useState<"flashcards" | "blind">(
    modeQuery === "blind" ? "blind" : "flashcards"
  )

  // Find topic info for header
  const topic = useMemo(() => {
    return (
      SAMPLE_TOPICS.find((t) => t.topicId === courseId) || DEFAULT_TOPIC
    )
  }, [courseId])

  // Initial cards
  const initialCards = useMemo(() => {
    return getFlashcardsForCourse(courseId, initialNodeId)
  }, [courseId, initialNodeId])

  // Active deck state (Hard cards get scheduled to repeat)
  const [deck, setDeck] = useState<Flashcard[]>([])
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

  // Initialize deck
  useEffect(() => {
    if (initialCards && initialCards.length > 0) {
      setDeck([...initialCards])
      setCurrentIndex(0)
      setIsFlipped(false)
      setIsComplete(false)
      setHardCount(0)
      setGoodCount(0)
      setEasyCount(0)
      setTotalReviewed(0)
    }
  }, [initialCards])

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
    },
    [currentCard, currentIndex, deck, soundEnabled, playChime]
  )

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete) return

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
  }, [isComplete, toggleFlip, handleRate])

  // Reset Deck
  const handleRestart = () => {
    if (initialCards && initialCards.length > 0) {
      setDeck([...initialCards])
      setCurrentIndex(0)
      setIsFlipped(false)
      setIsComplete(false)
      setHardCount(0)
      setGoodCount(0)
      setEasyCount(0)
      setTotalReviewed(0)
    }
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
          !isComplete ? (
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

                        {currentCard.analogy && (
                          <div className="rv-card-analogy-box">
                            <FiTrendingUp style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>
                              <strong>Analogy:</strong> {currentCard.analogy}
                            </span>
                          </div>
                        )}

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
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, maxWidth: 580, margin: "0 auto", width: "100%" }}>
            {/* Blind Summary Header Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                borderRadius: 20,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 8px 24px -4px rgba(79, 70, 229, 0.4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  🙈
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#FBBF24",
                        color: "#0F172A",
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      ACTIVE RECALL
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#FDE047", display: "flex", alignItems: "center", gap: 3 }}>
                      <FiZap /> +25 XP
                    </span>
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: "4px 0 0", color: "#FFFFFF" }}>
                    Blind Summary Challenge
                  </h2>
                </div>
              </div>
            </div>

            {/* Context Notice */}
            <div
              style={{
                background: "#2D2B66",
                borderRadius: 18,
                padding: "16px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  flexShrink: 0,
                }}
              >
                <FiLock size={16} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#FFFFFF" }}>
                  Content hidden for recall testing:{" "}
                  <span style={{ textDecoration: "underline", color: "#FBBF24" }}>
                    {activeNode.title}
                  </span>
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#E0E7FF", lineHeight: 1.45 }}>
                  Without looking back at your summary or notes, test your retention by typing 3 main points you remember.
                </p>
              </div>
            </div>

            {!blindSubmitted ? (
              <form onSubmit={handleBlindSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: 12, fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    <BiBrain size={16} style={{ color: "#818CF8" }} />
                    TYPE 3 MAIN POINTS BELOW:
                  </label>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: filledCount === 3 ? "#059669" : "#312E81",
                      color: "#FFFFFF",
                    }}
                  >
                    {filledCount} / 3 Completed
                  </span>
                </div>

                {/* Point 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: "#4F46E5", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>
                      1
                    </span>
                    First Main Point
                  </label>
                  <textarea
                    rows={2}
                    value={point1}
                    onChange={(e) => setPoint1(e.target.value)}
                    placeholder="e.g. The core concept or primary principle discussed..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: 14,
                      background: "#131C31",
                      border: "1px solid #1E293B",
                      borderRadius: 14,
                      color: "#F8FAFC",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>

                {/* Point 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: "#4F46E5", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>
                      2
                    </span>
                    Second Main Point
                  </label>
                  <textarea
                    rows={2}
                    value={point2}
                    onChange={(e) => setPoint2(e.target.value)}
                    placeholder="e.g. Key rule, definition, or supporting detail..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: 14,
                      background: "#131C31",
                      border: "1px solid #1E293B",
                      borderRadius: 14,
                      color: "#F8FAFC",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>

                {/* Point 3 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: "#4F46E5", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>
                      3
                    </span>
                    Third Main Point
                  </label>
                  <textarea
                    rows={2}
                    value={point3}
                    onChange={(e) => setPoint3(e.target.value)}
                    placeholder="e.g. Conclusion, formula, or practical takeaway..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: 14,
                      background: "#131C31",
                      border: "1px solid #1E293B",
                      borderRadius: 14,
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
                    padding: 16,
                    borderRadius: 16,
                    background: canSubmitBlind ? "#4F46E5" : "#1E293B",
                    color: canSubmitBlind ? "#FFFFFF" : "#64748B",
                    fontSize: 15,
                    fontWeight: 900,
                    border: "none",
                    cursor: canSubmitBlind ? "pointer" : "not-allowed",
                    boxShadow: canSubmitBlind ? "0 4px 16px rgba(79, 70, 229, 0.4)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 6,
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
