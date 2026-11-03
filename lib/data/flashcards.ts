import { type LearningNode, type StudyPathTopic } from "./studyPath"

export interface Flashcard {
  id: string
  nodeId: number
  nodeTitle: string
  term: string
  question: string
  definition: string
  analogy?: string
  keyConcepts: string[]
  codeSnippet?: string
  tags?: string[]
}

export const FLASHCARD_VAULT: Record<string, Flashcard[]> = {}

export function getFlashcardsForCourse(courseId: string, nodeIdFilter?: number): Flashcard[] {
  let deck = FLASHCARD_VAULT[courseId]

  if (!deck) {
    let topic: StudyPathTopic | null = null

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("studyhelp_active_topic")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && (parsed.topicId === courseId || !courseId)) {
            topic = parsed
          }
        }
        if (!topic) {
          const rawSaved = localStorage.getItem("studyhelp_saved_topics")
          if (rawSaved) {
            const list: StudyPathTopic[] = JSON.parse(rawSaved)
            topic = list.find((t) => t.topicId === courseId) || null
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (topic && Array.isArray(topic.nodes) && topic.nodes.length > 0) {
      deck = topic.nodes.flatMap((node) =>
        node.keyConcepts.map((concept, idx) => ({
          id: `gen-${node.id}-${idx}`,
          nodeId: node.id,
          nodeTitle: node.title,
          term: concept,
          question: `How does "${concept}" operate within ${node.title}?`,
          definition:
            node.lessonContent?.paragraphs[idx % (node.lessonContent.paragraphs.length || 1)] ||
            node.summary ||
            `Core conceptual principle of ${concept} applied to ${node.title}.`,
          analogy: node.lessonContent?.analogy,
          keyConcepts: node.keyConcepts,
          tags: [node.title, "Core Concept"],
        }))
      )
    } else {
      deck = []
    }
  }

  if (nodeIdFilter && deck && deck.length > 0) {
    const filtered = deck.filter((c) => c.nodeId === nodeIdFilter)
    if (filtered.length > 0) return filtered
  }

  return deck || []
}
