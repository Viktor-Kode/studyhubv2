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

// Get instruction based on specific topic field from Past Questions API
export const getInstructionForTopic = (topic: string | null | undefined, subject?: string): string => {
  if (!topic) {
    return 'Choose the correct option.'
  }

  const cleanTopic = topic.trim().toLowerCase()
  const cleanSubject = subject?.trim().toLowerCase() || ''

  // English Language topic mapping
  if (cleanSubject.includes('english')) {
    if (cleanTopic.includes('synonym') || cleanTopic.includes('nearest in meaning')) {
      return 'Choose the option nearest in meaning to the underlined word.'
    }
    if (cleanTopic.includes('antonym') || cleanTopic.includes('opposite in meaning')) {
      return 'Choose the option opposite in meaning to the underlined word.'
    }
    if (cleanTopic.includes('sentence completion') || cleanTopic.includes('fill in the blank') || cleanTopic === 'completion' || cleanTopic.includes('lexis')) {
      return 'Choose the option that correctly completes the sentence.'
    }
    if (cleanTopic.includes('idiom') || cleanTopic.includes('proverb') || cleanTopic.includes('interpretation') || cleanTopic.includes('figurative')) {
      return 'Choose the option that correctly interprets the underlined expression.'
    }
    if (cleanTopic.includes('oral') || cleanTopic.includes('phonetics') || cleanTopic.includes('stress') || cleanTopic.includes('rhyme') || cleanTopic.includes('vowel') || cleanTopic.includes('consonant')) {
      return 'Choose the option that has the same sound, stress pattern, or rhyme as indicated.'
    }
    if (cleanTopic.includes('comprehension') || cleanTopic.includes('cloze')) {
      return 'Read the passage carefully and answer the questions that follow.'
    }
    if (cleanTopic.includes('grammar') || cleanTopic.includes('concord') || cleanTopic.includes('tense') || cleanTopic.includes('parts of speech')) {
      return 'From the options, choose the grammatically correct or most appropriate answer.'
    }
  }

  // Generic topic mappings
  if (cleanTopic.includes('synonym') || cleanTopic.includes('nearest in meaning')) {
    return 'Choose the option nearest in meaning to the underlined word.'
  }
  if (cleanTopic.includes('antonym') || cleanTopic.includes('opposite in meaning')) {
    return 'Choose the option opposite in meaning to the underlined word.'
  }
  if (cleanTopic.includes('idiom') || cleanTopic.includes('proverb') || cleanTopic.includes('interpretation')) {
    return 'Choose the option that correctly interprets the underlined expression.'
  }
  if (cleanTopic.includes('comprehension')) {
    return 'Read the passage carefully and answer the questions that follow.'
  }
  if (cleanTopic.includes('fill in') || cleanTopic.includes('sentence completion')) {
    return 'Choose the option that correctly completes the sentence.'
  }

  return 'Choose the most correct option.'
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
  topic?: string | null
  tested_word?: string | null
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
  let category: QuestionCategory = 'general'
  let instruction = 'Choose the correct option.'

  if (q.topic) {
    const cleanTopic = q.topic.trim().toLowerCase()
    instruction = getInstructionForTopic(q.topic, q.subject || '')

    if (cleanTopic.includes('comprehension') || cleanTopic.includes('cloze')) {
      category = 'comprehension'
    } else if (cleanTopic.includes('synonym') || cleanTopic.includes('antonym') || cleanTopic.includes('vocab')) {
      category = 'vocabulary'
    } else if (cleanTopic.includes('grammar') || cleanTopic.includes('concord') || cleanTopic.includes('tense')) {
      category = 'grammar'
    } else if (cleanTopic.includes('completion') || cleanTopic.includes('fill in')) {
      category = 'sentence_completion'
    } else if (cleanTopic.includes('oral') || cleanTopic.includes('stress') || cleanTopic.includes('sound')) {
      category = 'oral_english'
    } else if (cleanTopic.includes('idiom') || cleanTopic.includes('proverb') || cleanTopic.includes('interpretation')) {
      category = 'idiom_proverb'
    }
  } else {
    category = detectQuestionCategory(questionText)
    instruction = getQuestionInstruction(category, q.subject || '')
  }

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
    id: String(q.id || q._id || `q_${Date.now()}_${Math.random()}`),
    question: questionText,
    options,
    correctAnswer,
    explanation: q.solution || q.explanation || q.note || q.discussion || q.answer_explanation || q.knowledge_deep_dive || q.knowledgeDeepDive || q.modelAnswer || q.reason || '',
    subject: q.subject || '',
    year: String(q.year || ''),
    examType: examType,
    category,
    instruction,
    image,
    topic: q.topic || null,
    tested_word: q.tested_word || null
  }
}

// ─── Math & HTML Rendering ───────────────────────────────────────────────────
export const renderQuestion = (text: string, testedWord?: string | null): string => {
  if (!text) return ''

  // 1. Unescape HTML entities first
  let rendered = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")

  // Underline tested word if present
  if (testedWord && testedWord.trim()) {
    const trimmedWord = testedWord.trim()
    try {
      const escaped = trimmedWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(`\\b(${escaped})\\b`, 'gi')
      if (regex.test(rendered)) {
        rendered = rendered.replace(regex, '<u>$1</u>')
      } else {
        const idx = rendered.toLowerCase().indexOf(trimmedWord.toLowerCase())
        if (idx !== -1) {
          const originalPart = rendered.substring(idx, idx + trimmedWord.length)
          rendered = rendered.substring(0, idx) + `<u>${originalPart}</u>` + rendered.substring(idx + trimmedWord.length)
        }
      }
    } catch (e) {
      console.error('Error underlining tested word:', e)
    }
  }

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
// ALOC has data from 2001 to 2023.
// Requesting a missing year causes ALOC to return an HTML 404 page, which
// then crashes JSON.parse with "Unexpected token '<', <!DOCTYPE..."
const ALOC_MIN_YEAR = 2001
const ALOC_MAX_YEAR = 2023

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
        amount: String(Math.min(amount, 100)),
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
   * Get available metadata (subjects and years) from the backend proxy
   */
  getMetadata: async (): Promise<{ subjects: string[], years: string[], examTypes: string[] }> => {
    try {
      const res = await fetchWithAuth('/api/backend/cbt/subjects');
      return await safeJson(res);
    } catch (err: any) {
      console.error('[CBT API] Error fetching metadata:', err.message);
      // Fallbacks in case backend fails
      return { 
        subjects: ['English Language'], 
        years: ['2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'],
        examTypes: ['utme']
      };
    }
  },

  /**
   * Get available years
   */
  getAvailableYears: async (examType: ExamType): Promise<AvailableYearsResponse> => {
    const meta = await cbtApi.getMetadata();
    return { years: meta.years };
  },

  /**
   * Get available subjects based on Exam Type
   */
  getAvailableSubjects: async (
    examType: ExamType,
    year?: string
  ): Promise<AvailableSubjectsResponse> => {
    const meta = await cbtApi.getMetadata();
    return { subjects: meta.subjects };
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
  getExplanation: async (
    question: string,
    correctAnswer: string,
    options: string[] = [],
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    const stream = !!onChunk;
    try {
      const res = await fetchWithAuth('/api/backend/cbt/explain', {
        method: 'POST',
        body: JSON.stringify({ question, correctAnswer, options, stream })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) return data.message || 'AI Limit Reached. Please upgrade your plan for more explanations.';
        throw new Error(data.message || 'Failed to get explanation');
      }

      const isStream = res.headers.get('Content-Type')?.includes('text/event-stream');

      if (stream && isStream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullExplanation = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.content) {
                  onChunk!(parsed.content);
                  fullExplanation += parsed.content;
                }
                if (parsed.error) throw new Error(parsed.error);
              } catch (e) { }
            }
          }
        }
        return fullExplanation;
      }

      const data = await res.json().catch(() => ({}));
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

  /**
   * Server-side answer verification (Security Hardening)
   */
  verifyAnswer: async (params: {
    questionId: string | number
    selectedAnswer: string
    questionText?: string
    isAiGenerated?: boolean
    subject?: string
    year?: string
    examType?: string
  }): Promise<{ correct: boolean; actualAnswer: string; explanation: string }> => {
    const res = await fetchWithAuth('/api/backend/cbt/verify-answer', {
      method: 'POST',
      body: JSON.stringify(params),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to verify answer')
    }
    return data
  },

  voteExplanation: async (
    question: string,
    correctAnswer: string,
    options: string[],
    vote: 'up' | 'down'
  ): Promise<{ success: boolean; upvotes: number; downvotes: number }> => {
    try {
      const res = await fetchWithAuth('/api/backend/cbt/explain/vote', {
        method: 'POST',
        body: JSON.stringify({ question, correctAnswer, options, vote })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to vote explanation');
      return data;
    } catch (err: any) {
      console.error('[CBT API] Failed to vote explanation:', err);
      throw err;
    }
  },
}
