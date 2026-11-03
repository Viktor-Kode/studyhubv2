"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { type LearningNode, type StudyPathTopic } from "@/lib/data/studyPath"
import { analyzeStudyPathNodeSummary } from "@/src/services/api"
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, RotateCcw, Sparkles } from "lucide-react"
import "./blurting.css"

type RecallCard = { front: string; back: string }
type RecallMode = "flashcards" | "summary"
type SummaryAnalysis = { covered: string[]; missing: string[]; feedback: string }

function buildLessonCards(node: LearningNode): RecallCard[] {
  const cards: RecallCard[] = []
  for (const quiz of [node.quiz, node.quiz2]) {
    if (!quiz?.question?.trim()) continue
    const answer = quiz.options?.[quiz.correctAnswerIndex]
    if (!answer) continue
    cards.push({
      front: quiz.question.trim(),
      back: [answer, quiz.explanation?.trim()].filter(Boolean).join(" — "),
    })
  }

  for (const concept of node.keyConcepts || []) {
    if (cards.length >= 3) break
    const [term, ...detail] = concept.split(":")
    const meaning = detail.join(":").trim()
    if (term.trim() && meaning) {
      cards.push({ front: `What does ${term.trim()} mean in this lesson?`, back: meaning })
    } else if (concept.trim()) {
      cards.push({ front: `What should you remember about ${node.title}?`, back: concept.trim() })
    }
  }

  return cards.slice(0, 3)
}

function resolveNode(nodeIdStr: string): { node: LearningNode; courseId: string; courseTitle: string } | null {
  const id = Number.parseInt(nodeIdStr, 10)
  if (!Number.isFinite(id) || typeof window === "undefined") return null

  const candidates: StudyPathTopic[] = []
  try {
    const active = localStorage.getItem("studyhelp_active_topic")
    if (active) candidates.push(JSON.parse(active) as StudyPathTopic)
    const saved = localStorage.getItem("studyhelp_saved_topics")
    if (saved) {
      const topics = JSON.parse(saved) as StudyPathTopic[]
      if (Array.isArray(topics)) candidates.push(...topics)
    }
  } catch { /* Ignore malformed local cache. */ }

  for (const topic of candidates) {
    const node = topic?.nodes?.find((item) => item.id === id)
    if (node) return { node, courseId: topic.topicId || "", courseTitle: topic.title || "" }
  }
  return null
}

function BlurtingStudioContent() {
  const params = useParams()
  const router = useRouter()
  const nodeId = (params?.nodeId as string) || ""
  const nodeData = useMemo(() => resolveNode(nodeId), [nodeId])
  const node = nodeData?.node
  const courseId = nodeData?.courseId || ""
  const [mode, setMode] = useState<RecallMode>("flashcards")
  const [cards, setCards] = useState<RecallCard[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [cardError, setCardError] = useState("")
  const [summaryText, setSummaryText] = useState("")
  const [summaryAnalysis, setSummaryAnalysis] = useState<SummaryAnalysis | null>(null)
  const [isAnalyzingSummary, setIsAnalyzingSummary] = useState(false)
  const [summaryAnalysisError, setSummaryAnalysisError] = useState("")

  const loadCards = useCallback((force = false) => {
    if (!node || !nodeData) return
    const cacheKey = `studyhelp_active_recall_${nodeData.courseId}_${node.id}`
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached) as RecallCard[]
          if (Array.isArray(parsed) && parsed.length === 3) {
            setCards(parsed)
            setCardError("")
            return
          }
        }
      } catch { /* Regenerate if the cache is invalid. */ }
    }

    setCardError("")
    const lessonCards = buildLessonCards(node)
    if (lessonCards.length !== 3) {
      setCards([])
      setCardError("This lesson does not have enough quiz and key-concept content to make three flashcards yet.")
      return
    }
    localStorage.setItem(cacheKey, JSON.stringify(lessonCards))
    setCards(lessonCards)
    setCardIndex(0)
    setCardFlipped(false)
  }, [node, nodeData])

  useEffect(() => {
    if (mode === "flashcards" && node && cards.length === 0 && !cardError) {
      loadCards()
    }
  }, [mode, node, cards.length, cardError, loadCards])

  const close = () => router.push(courseId ? `/dashboard/student/map/${encodeURIComponent(courseId)}` : "/dashboard/student")
  const goToCard = (index: number) => {
    setCardIndex(index)
    setCardFlipped(false)
  }
  const analyzeSummary = async () => {
    if (!courseId || !node || summaryText.trim().length < 10 || isAnalyzingSummary) return
    setIsAnalyzingSummary(true)
    setSummaryAnalysisError("")
    try {
      const payload = await analyzeStudyPathNodeSummary(courseId, node.id, summaryText.trim())
      if (!payload?.analysis) throw new Error("The review response was incomplete. Please try again.")
      setSummaryAnalysis(payload.analysis)
    } catch (error) {
      setSummaryAnalysisError(error instanceof Error ? error.message : "Could not analyze your summary.")
    } finally {
      setIsAnalyzingSummary(false)
    }
  }

  if (!node) {
    return <main className="recall-page"><section className="recall-empty"><h1>Lesson not found</h1><button onClick={() => router.push("/dashboard/student")}>Back to dashboard</button></section></main>
  }

  return (
    <main className="recall-page">
      <div className="recall-shell">
        <header className="recall-header">
          <button className="recall-back" onClick={close} aria-label="Back to map"><ArrowLeft size={19} /></button>
          <div className="recall-heading">
            <span>{nodeData?.courseTitle || "Active Recall"}</span>
            <h1>{node.title}</h1>
          </div>
        </header>

        <nav className="recall-tabs" aria-label="Active recall modes">
          <button className={mode === "flashcards" ? "selected" : ""} onClick={() => setMode("flashcards")}><BookOpen size={17} /> Flashcards <span>3</span></button>
          <button className={mode === "summary" ? "selected" : ""} onClick={() => setMode("summary")}><Sparkles size={17} /> Type summary</button>
        </nav>

        {mode === "flashcards" ? (
          <section className="recall-content">
            <div className="recall-section-heading"><div><h2>Lesson flashcards</h2><p>Recall the answer before you reveal it.</p></div>{cards.length === 3 && <span>{cardIndex + 1} / 3</span>}</div>
            {cardError ? (
              <div className="recall-state recall-error"><p>{cardError}</p><button onClick={() => void loadCards(true)}><RotateCcw size={16} /> Try again</button></div>
            ) : cards.length === 3 ? (
              <>
                <button className={`recall-flashcard ${cardFlipped ? "flipped" : ""}`} onClick={() => setCardFlipped((value) => !value)} aria-label={cardFlipped ? "Show question" : "Reveal answer"}>
                  <span className="recall-card-label">{cardFlipped ? "ANSWER" : "QUESTION"}</span>
                  <span className="recall-card-text">{cardFlipped ? cards[cardIndex].back : cards[cardIndex].front}</span>
                  <span className="recall-card-hint">{cardFlipped ? <><EyeOff size={15} /> Tap to return to question</> : <><Eye size={15} /> Tap to reveal answer</>}</span>
                </button>
                <div className="recall-card-controls">
                  <button onClick={() => goToCard((cardIndex + 2) % 3)} aria-label="Previous flashcard"><ArrowLeft size={18} /> Previous</button>
                  <div className="recall-dots">{cards.map((_, index) => <button key={index} className={index === cardIndex ? "current" : ""} onClick={() => goToCard(index)} aria-label={`Go to flashcard ${index + 1}`} />)}</div>
                  <button onClick={() => goToCard((cardIndex + 1) % 3)}>Next <ArrowRight size={18} /></button>
                </div>
              </>
            ) : null}
          </section>
        ) : (
          <section className="recall-content summary-mode">
            <div className="recall-section-heading"><div><h2>Summarize from memory</h2><p>Write what you remember, then compare with the lesson summary.</p></div></div>
            <textarea value={summaryText} onChange={(event) => { setSummaryText(event.target.value); setSummaryAnalysis(null); setSummaryAnalysisError("") }} placeholder={`Summarize ${node.title} from memory…`} rows={7} />
            <div className="recall-summary-actions">
              <span>{summaryText.trim() ? summaryText.trim().split(/\s+/).length : 0} words</span>
              <button onClick={() => void analyzeSummary()} disabled={summaryText.trim().length < 10 || isAnalyzingSummary}>{isAnalyzingSummary ? <><span className="recall-button-spinner" /> Analyzing…</> : <><Sparkles size={16} /> Analyze my summary</>}</button>
            </div>
            {summaryAnalysisError && <p className="recall-analysis-error" role="alert">{summaryAnalysisError}</p>}
            {summaryAnalysis && (
              <div className="recall-analysis" aria-live="polite">
                <p className="recall-feedback">{summaryAnalysis.feedback}</p>
                <div className="recall-analysis-columns">
                  <section className="recall-covered"><h3><Check size={16} /> What you got</h3>{summaryAnalysis.covered.length ? <ul>{summaryAnalysis.covered.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No key ideas were clearly identified yet.</p>}</section>
                  <section className="recall-missing"><h3><BookOpen size={16} /> What was missing</h3>{summaryAnalysis.missing.length ? <ul>{summaryAnalysis.missing.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>You covered the main lesson ideas.</p>}</section>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

export default function BlurtingStudioPage() {
  return <ProtectedRoute><BlurtingStudioContent /></ProtectedRoute>
}
