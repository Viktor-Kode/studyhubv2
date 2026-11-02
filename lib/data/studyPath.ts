export interface LessonContent {
  analogy: string
  paragraphs: string[]
  keyConcepts: string[]
}

export interface QuizData {
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
  hint?: string
}

export interface LearningNode {
  id: number
  title: string
  status: 'completed' | 'active' | 'locked'
  xp: number
  duration: string
  summary: string
  keyConcepts: string[]
  lessonContent?: LessonContent
  quiz?: QuizData
  quiz2?: QuizData
  finalQuiz?: QuizData[]
  isSummary?: boolean
  isFinalQuiz?: boolean
  nextNodeTitle?: string
}

export interface StudyPathTopic {
  topicId: string
  title: string
  courseCode: string
  currentProgress: number
  nodes: LearningNode[]
}

export const DEFAULT_TOPIC: StudyPathTopic = {
  topicId: '',
  title: '',
  courseCode: '',
  currentProgress: 0,
  nodes: []
}

export const SAMPLE_TOPICS: StudyPathTopic[] = []
