export const CHALLENGE_PASS_MARK = 5
export const CHALLENGE_XP_PER_QUESTION = 5
export const TOTAL_CHALLENGE_QUESTIONS = 10
export const MAX_CHALLENGE_XP = TOTAL_CHALLENGE_QUESTIONS * CHALLENGE_XP_PER_QUESTION

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

export interface LessonBreakdownSlide {
  heading: string
  body: string
  memoryTip?: string
}

export interface ChallengeQuestion {
  id: number
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
  sourceNodeIds: number[]
  type: 'recall' | 'connect' | 'compare' | 'sequence' | 'cause-effect' | 'synthesis'
  xp: number
}

export interface ChallengeSummary {
  status: 'locked' | 'active' | 'completed'
  questionCount: number
  passMark: number
  maxXp: number
  bestScore: number
  bestXp: number
  passed?: boolean
}

export interface ChallengeSubmitResult {
  score: number
  total: number
  passed: boolean
  passMark: number
  attemptXp: number
  xpAwarded: number
  maxXp: number
  missedNodeIds: number[]
  perQuestion: {
    id: number
    correct: boolean
    xp: number
  }[]
}

export interface LearningNode {
  id: number
  title: string
  status: 'completed' | 'active' | 'locked'
  contentStatus?: 'pending' | 'generating' | 'ready' | 'failed'
  generationError?: string
  xp: number
  duration: string
  unit?: string
  summary: string
  breakdown?: LessonBreakdownSlide[]
  sourceFacts?: string[]
  sourcePages?: number[]
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
  completed?: boolean
  challenge?: ChallengeSummary
  nodes: LearningNode[]
}

export const DEFAULT_TOPIC: StudyPathTopic = {
  topicId: '',
  title: '',
  courseCode: '',
  currentProgress: 0,
  completed: false,
  challenge: {
    status: 'locked',
    questionCount: 10,
    passMark: 5,
    maxXp: 50,
    bestScore: 0,
    bestXp: 0,
  },
  nodes: []
}

export const SAMPLE_TOPICS: StudyPathTopic[] = []
