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
} from "react-icons/fi"
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
  const initialNodeId = nodeIdQuery ? parseInt(nodeIdQuery, 10) : undefined

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

  const totalCards = deck.length
  const progressPercent =
    totalCards > 0 ? Math.round(((currentIndex) / totalCards) * 100) : 0
  const remainingCount = Math.max(0, totalCards - currentIndex)
  const activeNodeId = currentCard?.nodeId || initialNodeId || 1

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

          {/* Mode Switcher Tab */}
          <RetentionModeSwitcher
            activeMode="flashcards"
            courseId={courseId}
            nodeId={activeNodeId}
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

        {!isComplete ? (
          <>
            {/* Progress Section */}
            <section className="rv-progress-wrap">
              <div className="rv-progress-meta">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="rv-progress-pill">
                    <FiZap style={{ fontSize: 14 }} />
                    <span>Card {currentIndex + 1} of {totalCards}</span>
                  </span>
                  <span style={{ fontSize: 13, color: "#64748B" }}>
                    ({remainingCount} remaining)
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                  <span style={{ color: "#F87171" }}>Hard: {hardCount}</span>
                  <span style={{ color: "#60A5FA" }}>Good: {goodCount}</span>
                  <span style={{ color: "#34D399" }}>Easy: {easyCount}</span>
                </div>
              </div>

              <div className="rv-progress-track">
                <div
                  className="rv-progress-fill"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />
              </div>
            </section>

            {/* 3D Flip Card Container */}
            {currentCard && (
              <div className="rv-card-scene">
                <div
                  tabIndex={0}
                  role="button"
                  aria-label="Flashcard. Press space to flip"
                  className={`rv-flip-card ${isFlipped ? "flipped" : ""}`}
                  onClick={toggleFlip}
                >
                  {/* FRONT FACE */}
                  <div className="rv-card-face rv-card-front">
                    <div className="rv-card-badge-row">
                      <span className="rv-card-topic-tag">Key Concept</span>
                      <span className="rv-card-node-tag">
                        Node #{currentCard.nodeId}: {currentCard.nodeTitle}
                      </span>
                    </div>

                    <div className="rv-card-body">
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#FFD23F",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {topic.courseCode}
                      </span>
                      <h2 className="rv-card-term-title">{currentCard.term}</h2>
                      <p className="rv-card-question">{currentCard.question}</p>
                    </div>

                    <div className="rv-card-flip-prompt">
                      <FiRepeat style={{ fontSize: 16 }} />
                      <span>Click card or press [SPACE] to flip</span>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="rv-card-face rv-card-back">
                    <div className="rv-card-badge-row">
                      <span
                        className="rv-card-topic-tag"
                        style={{
                          background: "rgba(61, 220, 151, 0.12)",
                          color: "#3DDC97",
                          borderColor: "rgba(61, 220, 151, 0.3)",
                        }}
                      >
                        Explanation & Takeaway
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
                      <span>Rate your confidence below</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Dock: Confidence Rating Buttons */}
            <div className="rv-dock-wrap">
              {!isFlipped ? (
                <button
                  type="button"
                  className="rv-flip-action-btn"
                  onClick={toggleFlip}
                >
                  <FiRepeat />
                  <span>Reveal Answer</span>
                </button>
              ) : (
                <div className="rv-buttons-grid">
                  <button
                    type="button"
                    className="rv-btn-rate rv-btn-hard"
                    onClick={() => handleRate("hard")}
                    title="Repeats in current session"
                  >
                    <span>Hard</span>
                    <span className="rv-btn-shortcut">[ 1 ] Soon</span>
                  </button>

                  <button
                    type="button"
                    className="rv-btn-rate rv-btn-good"
                    onClick={() => handleRate("good")}
                    title="Standard interval review"
                  >
                    <span>Good</span>
                    <span className="rv-btn-shortcut">[ 2 ] Standard</span>
                  </button>

                  <button
                    type="button"
                    className="rv-btn-rate rv-btn-easy"
                    onClick={() => handleRate("easy")}
                    title="Pushes card out as mastered"
                  >
                    <span>Easy</span>
                    <span className="rv-btn-shortcut">[ 3 ] Mastered</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* COMPLETION VIEW */
          <div className="rv-finish-card">
            <div className="rv-trophy-badge">
              <FiAward style={{ fontSize: 44, color: "#0F172A" }} />
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#F8FAFC" }}>
              Vault Drill Completed!
            </h1>
            <p style={{ fontSize: 15, color: "#94A3B8", margin: 0, maxWidth: 380 }}>
              You reviewed {totalReviewed} concept cards for <strong>{topic.title}</strong>. Active recall cements these pathways.
            </p>

            <div className="rv-stats-row">
              <div className="rv-stat-pill">
                <span className="rv-stat-pill-val" style={{ color: "#34D399" }}>
                  {easyCount}
                </span>
                <span className="rv-stat-pill-lbl">Mastered</span>
              </div>
              <div className="rv-stat-pill">
                <span className="rv-stat-pill-val" style={{ color: "#60A5FA" }}>
                  {goodCount}
                </span>
                <span className="rv-stat-pill-lbl">Solid</span>
              </div>
              <div className="rv-stat-pill">
                <span className="rv-stat-pill-val" style={{ color: "#F87171" }}>
                  {hardCount}
                </span>
                <span className="rv-stat-pill-lbl">Reviewed</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                width: "100%",
                marginTop: 8,
              }}
            >
              <button
                type="button"
                className="rv-flip-action-btn"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
                onClick={() => router.push(`/blurting/${activeNodeId}`)}
              >
                <FiZap />
                <span>Test Retention in Blurting Studio</span>
              </button>

              <button
                type="button"
                className="rv-icon-btn"
                style={{ width: "100%", height: 50, borderRadius: 14, fontWeight: 800 }}
                onClick={handleRestart}
              >
                <FiRepeat style={{ marginRight: 8 }} />
                <span>Drill Deck Again</span>
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
        )}
      </div>
    </div>
  )
}
