import { examSyllabi, getSyllabus, getSubjectsForExam, ExamType as SyllabusExamType } from '../data/examSyllabi'
import { getFirebaseToken } from '../store/authStore'
import { triggerUpgradeModal } from '../upgradeHandler'
import katex from 'katex'
import 'katex/dist/katex.min.css'

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
  // Optional diagram or image associated with the question
  image?: string | null
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
  'NECO': 'wassce',
  'POST_UTME': 'post-utme',
  'BECE': 'wassce' // Fallback for junior exams to secondary level if needed
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
    const trimmed = rawAnswer.trim().toLowerCase();
    const letterIndex = optionKeys.indexOf(trimmed);
    if (letterIndex >= 0) {
      correctAnswer = letterIndex;
    } else if (!isNaN(parseInt(trimmed))) {
      correctAnswer = parseInt(trimmed);
    } else {
      correctAnswer = 0;
    }
  } else if (typeof rawAnswer === 'number') {
    correctAnswer = rawAnswer;
  }

  // Clean up question text
  const questionText = (q.question || q.content || '')
    .replace(/\s+/g, ' ')
    .trim()

  // Detect category and generate instruction
  const category = detectQuestionCategory(questionText)
  const instruction = getQuestionInstruction(category, q.subject || '')

  // Preserve possible image fields from ALOC payload
  const image =
    q.image ||
    q.diagram ||
    q.img ||
    q.image_url ||
    q.imageUrl ||
    q.questionImage ||
    q.picture ||
    q.figure ||
    q.image_link ||
    null

  return {
    id: String(q.id || `q_${Date.now()}_${Math.random()}`),
    question: questionText,
    options,
    correctAnswer,
    explanation: q.solution || q.explanation || q.note || q.discussion || q.answer_explanation || q.knowledge_deep_dive || q.knowledgeDeepDive || q.modelAnswer || q.reason || '',
    subject: q.subject || '',
    year: String(q.year || ''),
    examType: examType,
    category,
    instruction,
    image
  }
}

// ─── Math & HTML Rendering ───────────────────────────────────────────────────
export const renderQuestion = (text: string): string => {
  if (!text) return ''

  // 1. Unescape HTML entities first
  let rendered = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")

  // 2. Handle <sup> and <sub> by converting to LaTeX
  rendered = rendered
    .replace(/<sup>(.*?)<\/sup>/g, '^{$1}')
    .replace(/<sub>(.*?)<\/sub>/g, '_{$1}')

  // 3. Handle common math symbols
  rendered = rendered
    .replace(/√/g, '\\sqrt')
    .replace(/π/g, '\\pi')
    .replace(/²/g, '^{2}')
    .replace(/³/g, '^{3}')
    .replace(/±/g, '\\pm')
    .replace(/×/g, '\\times')
    .replace(/÷/g, '\\div')

  // 4. Custom heuristic: if the string contains LaTeX-like characters 
  // but NO $ delimiters, we try to wrap common patterns
  if (!rendered.includes('$')) {
    // Find sequences like x^2, (y+1)_3, etc.
    // Also catch anything with \sqrt, \pi, etc.
    const mathRegex = /([a-zA-Z0-9]\^\{?\.?\}?|[a-zA-Z0-9]_\{?\.?\}?|\\sqrt|\\pi|\\times|\\div|\\pm)/
    if (mathRegex.test(rendered)) {
      // For simplicity, if it looks like it has math, we try to render it.
      // But we use 'throwOnError: false' so it falls back to raw text if it fails.
      try {
        return katex.renderToString(rendered, {
          throwOnError: false,
          displayMode: false,
          trust: true
        })
      } catch {
        return rendered
      }
    }
  }

  // 5. Traditional $...$ delimiter support
  rendered = rendered.replace(/\$([^$]+)\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex, { throwOnError: false })
    } catch {
      return latex
    }
  })

  return rendered
}

// ─── ALOC year range ─────────────────────────────────────────────────────────
// ALOC only has data from 2001 to 2020. Years 2021–2025 DO NOT exist.
// Requesting a missing year causes ALOC to return an HTML 404 page, which
// then crashes JSON.parse with "Unexpected token '<', <!DOCTYPE..."
const ALOC_MIN_YEAR = 2001
const ALOC_MAX_YEAR = 2020

// ─── Defensive fetch helper ───────────────────────────────────────────────────
// Reads response as raw TEXT first, then parses JSON.
// If ALOC returns an HTML error page this gives a clean error instead of
// the cryptic "Unexpected token '<'" crash.
async function safeJson(res: Response): Promise<any> {
  const text = await res.text()
  const snippet = text.trim().substring(0, 150)

  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    console.error(
      `[CBT] ALOC returned HTML instead of JSON (HTTP ${res.status}).\n` +
      `URL: ${res.url}\nSnippet: ${snippet}`
    )
    throw new Error(
      `ALOC API returned an HTML page (HTTP ${res.status}). ` +
      `This means the year/subject combination does not exist, ` +
      `or the Access Token is invalid. Snippet: ${snippet}`
    )
  }

  try {
    return JSON.parse(text)
  } catch {
    console.error(`[CBT] Failed to parse JSON. Raw response:\n${snippet}`)
    throw new Error(`ALOC returned non-JSON response (HTTP ${res.status}). Snippet: ${snippet}`)
  }
}

// Internal helper for authorized backend calls
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getFirebaseToken();
  const headers = {
    ...options.headers,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  } as Record<string, string>;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

export interface TopicGeneratedQuestion {
  question: string
  options: { A: string; B: string; C: string; D: string }
  answer: string
  explanation: string
}

export const cbtApi = {
  /**
   * Get questions from ALOC API via internal proxy
   * For Post-UTME, pass school (e.g. UNILAG) for school-specific questions
   */
  getQuestions: async (
    examType: ExamType,
    year: string,
    subject: string,
    amount: number = 20,
    school?: string
  ): Promise<{ questions: CBTQuestion[], debug?: string }> => {
    const examSlug = EXAM_TYPE_MAP[examType]
    const subjectSlug = SUBJECT_SLUG_MAP[subject] || subject.toLowerCase().replace(/ /g, '-')

    try {
      const params = new URLSearchParams({
        subject: subjectSlug,
        type: examSlug,
        amount: String(Math.min(amount, 40)),
        year: year
      })
      if (examType === 'POST_UTME' && school) {
        params.set('school', school)
      }

      console.log('[CBT] Fetching from proxy:', params.toString())
      const res = await fetchWithAuth(`/api/backend/cbt/questions?${params}`)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 403 && (errorData.upgradeRequired || errorData.showUpgrade || errorData.code === 'CBT_LIMIT_REACHED')) {
          triggerUpgradeModal('cbt')
        }
        throw new Error(errorData.message || errorData.error || `Server returned ${res.status}`)
      }

      const data = await res.json()

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        let allQuestions = data.data
          .filter((q: any) => q.question && (q.option || q.options))
          .map((q: any) => parseALOCQuestion(q, examType))
          .filter((q: CBTQuestion) => q.options.length >= 2)

        // For English Language: filter out comprehension questions
        const isEnglish = subjectSlug === 'english' || subject.toLowerCase().includes('english')
        const questions = isEnglish
          ? allQuestions.filter((q: CBTQuestion) => q.category !== 'comprehension')
          : allQuestions

        if (questions.length === 0 && allQuestions.length > 0) {
          // If we filtered out EVERYTHING (likely all were comprehension), just return the original set
          // better than an empty screen.
          return { questions: allQuestions.slice(0, amount) }
        }

        return { questions: questions.slice(0, amount) }
      }

      throw new Error(`No questions found for ${subject}.`)

    } catch (err: any) {
      console.error('[CBT API] Error:', err.message)
      throw new Error(err.message)
    }
  },

  /**
   * Get available years (Mocked for now as ALOC doesn't have a clear years endpoint)
   * Returns range 2000-2024
   */
  getAvailableYears: async (examType: ExamType): Promise<AvailableYearsResponse> => {
    const years: string[] = []
    // ALOC ONLY has questions for 2001–2020.
    // DO NOT include 2021+ — those years return HTML error pages, causing JSON.parse to crash.
    for (let i = ALOC_MAX_YEAR; i >= ALOC_MIN_YEAR; i--) {
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
  },

  /**
   * Save CBT Session result
   */
  saveResult: async (resultData: any): Promise<any> => {
    try {
      const res = await fetchWithAuth('/api/backend/cbt/results', {
        method: 'POST',
        body: JSON.stringify(resultData)
      });
      return await safeJson(res);
    } catch (err: any) {
      console.error('[CBT API] Failed to save result:', err);
      throw err;
    }
  },

  /**
   * Get CBT Results summary for a student
   */
  getResultsSummary: async (studentId?: string): Promise<any> => {
    try {
      const url = studentId ? `/api/cbt/results/summary?studentId=${studentId}` : '/api/cbt/results/summary';
      const res = await fetchWithAuth(url.replace('/api/cbt', '/api/backend/cbt'));
      return await safeJson(res);
    } catch (err: any) {
      console.error('[CBT API] Failed to fetch summary:', err);
      throw err;
    }
  },

  /**
   * Get all CBT results for the current student
   */
  getAllResults: async (): Promise<any> => {
    try {
      const res = await fetchWithAuth('/api/backend/cbt/results');
      const data = await safeJson(res);
      return data.data || [];
    } catch (err: any) {
      console.error('[CBT API] Failed to fetch all results:', err);
      throw err;
    }
  },

  /**
   * Generate explanation for a question via AI
   */
  getExplanation: async (question: string, correctAnswer: string, options: string[]): Promise<string> => {
    try {
      const res = await fetchWithAuth('/api/backend/cbt/explain', {
        method: 'POST',
        body: JSON.stringify({ question, correctAnswer, options })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 403) return data.message || 'AI Limit Reached. Please upgrade your plan for more explanations.';
        throw new Error(data.message || 'Failed to get explanation');
      }

      return data.explanation;
    } catch (err: any) {
      console.error('[CBT API] Failed to get explanation:', err);
      return 'Could not generate explanation at this time. Please check your internet connection or try again later.';
    }
  },

  /**
   * AI-generated MCQs for syllabus topic study (not from question bank).
   */
  generateTopicQuestions: async (params: {
    exam: string
    subject: string
    topic: string
    count?: number
  }): Promise<TopicGeneratedQuestion[]> => {
    const res = await fetchWithAuth('/api/backend/cbt/generate-topic-questions', {
      method: 'POST',
      body: JSON.stringify({
        exam: params.exam,
        subject: params.subject,
        topic: params.topic,
        count: params.count ?? 5,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to generate questions')
    }
    if (!Array.isArray(data.questions)) {
      throw new Error('Invalid response from server')
    }
    return data.questions as TopicGeneratedQuestion[]
  },
}
