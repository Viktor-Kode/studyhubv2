import axios from 'axios'
import { examSyllabi, getSyllabus, getSubjectsForExam, ExamType as SyllabusExamType } from '../data/examSyllabi'

export type ExamType = 'WAEC' | 'JAMB' | 'POST_UTME' | 'NECO' | 'BECE'

// ─── Question type detection ───────────────────────────────────────────────

type QuestionCategory =
  | 'comprehension'      // references a passage → needs context
  | 'vocabulary'         // word meanings, synonyms, antonyms
  | 'grammar'            // tense, parts of speech, concord
  | 'sentence_completion' // fill-in-the-blank sentences
  | 'oral_english'       // stress, rhyme, phonetics
  | 'idiom_proverb'      // idioms and proverbs
  | 'general'            // everything else

const PASSAGE_SIGNALS = [
  'the passage', 'the extract', 'the text above', 'according to the passage',
  'from the passage', 'the writer', 'the author', 'the poem', 'the story',
  'in paragraph', 'lines', 'stanza', 'the article', 'passage above',
  'read the following', 'read the passage', 'according to the text',
  'the narrator', 'from the text', 'the reading'
]

const VOCABULARY_SIGNALS = [
  'means the same', 'opposite in meaning', 'nearest in meaning', 'antonym',
  'synonym', 'word class', 'correctly spell', 'correctly defines',
  'best replaces', 'best synonym', 'means nearly', 'closest in meaning',
  'appropriate word', 'most appropriate', 'word that', 'meaning of',
  'definition of'
]

const GRAMMAR_SIGNALS = [
  'grammatically', 'correct form', 'correct tense', 'subject-verb',
  'concord', 'parts of speech', 'figure of speech', 'mood of the verb',
  'passive form', 'active form', 'indirect speech', 'reported speech',
  'direct speech', 'punctuation', 'correctly punctuated', 'clause',
  'subordinate', 'relative pronoun', 'conjunction', 'preposition'
]

const ORAL_SIGNALS = [
  'stress', 'rhyme', 'vowel sound', 'consonant', 'syllable',
  'phonetic', 'pronunciation', 'emphatic stress', 'same vowel',
  'same consonant', 'intonation', 'speech sound', '//'
]

const IDIOM_SIGNALS = [
  'idiom', 'proverb', 'expression means', 'phrase means',
  'meaning of the expression', 'the saying'
]

const COMPLETION_SIGNALS = [
  '___', '……', '....', 'fill in', 'blank', 'complete the',
  'choose the word that correctly'
]

export const detectQuestionCategory = (question: string): QuestionCategory => {
  const q = question.toLowerCase()

  // Passage-dependent - must filter out
  if (PASSAGE_SIGNALS.some(s => q.includes(s))) return 'comprehension'

  // Oral English
  if (ORAL_SIGNALS.some(s => q.includes(s))) return 'oral_english'

  // Idioms & proverbs
  if (IDIOM_SIGNALS.some(s => q.includes(s))) return 'idiom_proverb'

  // Vocabulary
  if (VOCABULARY_SIGNALS.some(s => q.includes(s))) return 'vocabulary'

  // Grammar
  if (GRAMMAR_SIGNALS.some(s => q.includes(s))) return 'grammar'

  // Sentence completion
  if (COMPLETION_SIGNALS.some(s => q.includes(s))) return 'sentence_completion'

  return 'general'
}

// Get a human-readable instruction label per question category
export const getQuestionInstruction = (category: QuestionCategory, subject: string): string => {
  const map: Record<QuestionCategory, string> = {
    comprehension: '',
    vocabulary: 'Choose the option that is nearest in meaning to the underlined word or best fills the gap.',
    grammar: 'From the options, choose the grammatically correct or most appropriate answer.',
    sentence_completion: 'Choose the option that correctly completes the sentence.',
    oral_english: 'Choose the option that has the same vowel sound, stress pattern, or rhyme as indicated.',
    idiom_proverb: 'Choose the option that gives the correct meaning of the underlined idiom or expression.',
    general: 'Choose the most correct option from the following.'
  }
  return map[category] || map.general
}

export interface CBTQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  subject: string
  year: string
  examType: ExamType
  category?: QuestionCategory
  instruction?: string
}

export interface CBTQuestionsResponse {
  questions: CBTQuestion[]
  total: number
  year?: string
  subject?: string
  debug?: string
}

export interface AvailableYearsResponse {
  years: string[]
}

export interface AvailableSubjectsResponse {
  subjects: string[]
}

const EXAM_TYPE_MAP: Record<string, string> = {
  'JAMB': 'utme',
  'WAEC': 'wassce',
  'NECO': 'neco',
  'POST_UTME': 'post-utme',
  'BECE': 'bece' // Fallback, BECE support varies
}

// Subject Slug Map to match ALOC expected slugs
const SUBJECT_SLUG_MAP: Record<string, string> = {
  'English Language': 'english',
  'Mathematics': 'mathematics',
  'Commerce': 'commerce',
  'Accounting': 'accounting',
  'Biology': 'biology',
  'Physics': 'physics',
  'Chemistry': 'chemistry',
  'English Literature': 'englishlit',
  'Government': 'government',
  'CRK': 'crk',
  'Geography': 'geography',
  'Economics': 'economics',
  'IRK': 'irk',
  'Civic Education': 'civiledu',
  'Insurance': 'insurance',
  'Current Affairs': 'currentaffairs',
  'History': 'history'
}

const parseALOCQuestion = (q: any, examType: ExamType): CBTQuestion => {
  // ALOC format: option = { a: "text", b: "text", c: "text", d: "text" }
  const optionKeys = ['a', 'b', 'c', 'd', 'e']
  const options: string[] = []

  // Handle both q.option and q.options formats
  const optionSource = q.option || q.options || {}

  if (typeof optionSource === 'object' && !Array.isArray(optionSource)) {
    // Object format: { a: "...", b: "...", c: "...", d: "..." }
    optionKeys.forEach(key => {
      const val = optionSource[key]
      if (val && typeof val === 'string' && val.trim()) {
        options.push(val.trim())
      }
    })
  } else if (Array.isArray(optionSource)) {
    // Array format: ["...", "...", "...", "..."]
    optionSource.forEach((opt: string) => {
      if (opt && typeof opt === 'string') {
        options.push(opt.trim())
      }
    })
  }

  // Parse correct answer
  // ALOC answer can be: "a", "b", "c", "d" (letter) or 0, 1, 2, 3 (index)
  let correctAnswer = 0
  const rawAnswer = q.answer || q.correct_answer || q.correctAnswer || 'a'

  if (typeof rawAnswer === 'string') {
    const letterIndex = optionKeys.indexOf(rawAnswer.toLowerCase())
    correctAnswer = letterIndex >= 0 ? letterIndex : 0
  } else if (typeof rawAnswer === 'number') {
    correctAnswer = rawAnswer
  }

  // Clean up question text
  const questionText = (q.question || q.content || '')
    .replace(/\s+/g, ' ')
    .trim()

  // Detect category and generate instruction
  const category = detectQuestionCategory(questionText)
  const instruction = getQuestionInstruction(category, q.subject || '')

  return {
    id: String(q.id || `q_${Date.now()}_${Math.random()}`),
    question: questionText,
    options,
    correctAnswer,
    explanation: q.solution || q.explanation || q.note || '',
    subject: q.subject || '',
    year: String(q.year || ''),
    examType: examType,
    category,
    instruction
  }
}

export const cbtApi = {
  /**
   * Get questions from ALOC API via internal proxy
   */
  getQuestions: async (
    examType: ExamType,
    year: string,
    subject: string,
    amount: number = 20
  ): Promise<{ questions: CBTQuestion[], debug?: string }> => {
    const examSlug = EXAM_TYPE_MAP[examType]
    const subjectSlug = SUBJECT_SLUG_MAP[subject] || subject.toLowerCase().replace(/ /g, '-')

    const errors: string[] = []
    let finalQuestions: CBTQuestion[] = []

    // Helper to process response data
    const processData = (data: any): CBTQuestion[] => {
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const allQuestions = data.data
          .filter((q: any) => q.question && (q.option || q.options))
          .map((q: any) => parseALOCQuestion(q, examType))
          .filter((q: CBTQuestion) => q.options.length >= 2)

        // For English Language: filter out comprehension questions
        // that reference a missing passage since ALOC doesn't include passages
        const isEnglish = subjectSlug === 'english' || subject.toLowerCase().includes('english')

        const questions = isEnglish
          ? allQuestions.filter((q: CBTQuestion) => q.category !== 'comprehension')
          : allQuestions

        // If filtering removed too many, warn but still return what we have
        // Or if we have very few filtered questions, maybe returning purely general/grammar ones is better thanbroken comprehension ones
        if (isEnglish && allQuestions.length > 0 && questions.length < 3) {
          console.warn('English filter removed most questions. Returning allow-list only if possible.')
          return questions
        }

        return questions
      }
      return []
    }

    // ATTEMPT 1: Fetch with year filter
    try {
      const params = new URLSearchParams({
        subject: subjectSlug,
        type: examSlug,
        amount: String(Math.min(amount, 50)),
        year: year
      })

      console.log('CBT Attempt 1 - with year:', params.toString())
      const res = await fetch(`/api/cbt/questions?${params}`)
      const data = await res.json()

      const questions = processData(data)
      if (questions.length > 0) {
        console.log(`Loaded ${questions.length} questions with year filter`)
        return { questions }
      }
      errors.push(`Attempt 1 (with year ${year}): ${data.error || 'No valid questions returned'}`)
    } catch (err: any) {
      errors.push(`Attempt 1 failed: ${err.message}`)
      console.error('Attempt 1 error:', err)
    }

    // ATTEMPT 2: Fetch WITHOUT year filter
    try {
      const params = new URLSearchParams({
        subject: subjectSlug,
        type: examSlug,
        amount: String(Math.min(amount, 50))
      })

      console.log('CBT Attempt 2 - without year:', params.toString())
      const res = await fetch(`/api/cbt/questions?${params}`)
      const data = await res.json()

      const questions = processData(data)
      if (questions.length > 0) {
        console.log(`Loaded ${questions.length} questions without year filter`)
        return { questions }
      }
      errors.push(`Attempt 2 (no year): ${data.error || 'No valid questions returned'}`)
    } catch (err: any) {
      errors.push(`Attempt 2 failed: ${err.message}`)
      console.error('Attempt 2 error:', err)
    }

    // ATTEMPT 3: Try with english as fallback subject
    if (subjectSlug !== 'english') {
      try {
        const params = new URLSearchParams({
          subject: 'english',
          type: examSlug,
          amount: '20'
        })

        console.log('CBT Attempt 3 - english fallback')
        const res = await fetch(`/api/cbt/questions?${params}`)
        const data = await res.json()

        // We check if data exists but don't return it as "success" for the original subject request
        // This is just to verify API connectivity
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          console.log('English fallback worked - API is connected but subject is missing')
        }
        errors.push(`Attempt 3 (english fallback): API responded but no ${subject} questions`)
      } catch (err: any) {
        errors.push(`Attempt 3 failed: ${err.message}`)
      }
    }

    console.error('All CBT attempts failed:', errors)
    throw new Error(
      `No questions found for ${subject} (${examType} ${year}). ` +
      `filtered due to missing context? ` +
      `Debug: ${errors[0]}`
    )
  },

  /**
   * Get available years (Mocked for now as ALOC doesn't have a clear years endpoint)
   * Returns range 2000-2024
   */
  getAvailableYears: async (examType: ExamType): Promise<AvailableYearsResponse> => {
    const currentYear = new Date().getFullYear()
    const years: string[] = []
    // ALOC supports from ~2001 to recent
    for (let i = currentYear - 1; i >= 2001; i--) {
      years.push(i.toString())
    }
    return { years }
  },

  /**
   * Get available subjects based on Exam Type
   * Uses local mapping to ensure valid subjects are sent to API
   */
  getAvailableSubjects: async (
    examType: ExamType,
    year?: string
  ): Promise<AvailableSubjectsResponse> => {
    // Subject list supported by ALOC
    // Need to ensure these exact strings match what ALOC expects or handle mapping in proxy
    const subjects = [
      'English Language',
      'Mathematics',
      'Commerce',
      'Accounting',
      'Biology',
      'Physics',
      'Chemistry',
      'English Literature',
      'Government',
      'CRK',
      'Geography',
      'Economics',
      'IRK',
      'Civic Education',
      'Insurance',
      'Current Affairs',
      'History'
    ]
    return { subjects }
  }
}
