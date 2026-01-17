import { apiClient } from './client'
import { examSyllabi, getSyllabus, getSubjectsForExam, ExamType as SyllabusExamType } from '../data/examSyllabi'

export type ExamType = 'WAEC' | 'JAMB' | 'POST_UTME' | 'NECO' | 'BECE'

export interface CBTQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  subject: string
  year: string
  examType: ExamType
}

export interface CBTQuestionsResponse {
  questions: CBTQuestion[]
  total: number
  year?: string
  subject?: string
}

export interface AvailableYearsResponse {
  years: string[]
}

export interface AvailableSubjectsResponse {
  subjects: string[]
}

// Mock/Placeholder API - Replace with real API endpoint when available
const CBT_API_BASE = process.env.NEXT_PUBLIC_CBT_API_URL || 'https://api.example.com/cbt'

/**
 * Generate basic questions from syllabus structure (fallback when AI API not available)
 * This creates template questions that can be enhanced by the backend AI
 */
const generateBasicQuestionsFromSyllabus = async (
  examType: ExamType,
  subject: string,
  year: string | undefined,
  limit: number,
  syllabus: any
): Promise<CBTQuestionsResponse> => {
  const questions: CBTQuestion[] = []
  const topics = syllabus.topics || []
  
  // Generate questions based on topics (weighted by importance)
  const questionsPerTopic = Math.ceil(limit / Math.max(topics.length, 1))
  
  topics.forEach((topic: any, topicIndex: number) => {
    const numQuestions = Math.min(questionsPerTopic, limit - questions.length)
    
    for (let i = 0; i < numQuestions && questions.length < limit; i++) {
      questions.push({
        id: `syllabus-${examType}-${subject}-${topicIndex}-${i}`,
        question: `[${topic.topic}] This is a sample question about ${topic.topic}. The backend AI will generate proper questions based on the ${examType} ${subject} syllabus.`,
        options: [
          'Option A (AI will generate proper options)',
          'Option B (AI will generate proper options)',
          'Option C (AI will generate proper options)',
          'Option D (AI will generate proper options)',
        ],
        correctAnswer: 0,
        explanation: `This is a placeholder. The backend AI will generate proper questions matching ${examType} ${subject} exam style.`,
        subject,
        year: year || new Date().getFullYear().toString(),
        examType,
      })
    }
  })

  return {
    questions,
    total: questions.length,
    year: year || new Date().getFullYear().toString(),
    subject,
  }
}

export const cbtApi = {
  /**
   * Generate questions from syllabus using AI
   * @param examType - Type of exam (WAEC, JAMB, NECO, etc.)
   * @param year - Year of the exam (e.g., '2023', '2024')
   * @param subject - Subject name (e.g., 'Mathematics', 'English')
   * @param limit - Number of questions to generate (default: 50)
   */
  getQuestions: async (
    examType: ExamType,
    year?: string,
    subject?: string,
    limit: number = 50
  ): Promise<CBTQuestionsResponse> => {
    try {
      if (!subject) {
        throw new Error('Subject is required')
      }

      // Get syllabus information
      const syllabus = getSyllabus(examType as SyllabusExamType, subject)
      if (!syllabus) {
        throw new Error(`Syllabus not found for ${examType} ${subject}`)
      }

      // Generate questions using AI based on syllabus
      const response = await apiClient.post<CBTQuestionsResponse>(
        '/cbt/generate-from-syllabus',
        {
          examType,
          subject,
          year: year || new Date().getFullYear().toString(),
          syllabus: {
            topics: syllabus.topics,
            questionStyle: syllabus.questionStyle,
            difficultyLevel: syllabus.difficultyLevel,
            questionFormat: syllabus.questionFormat,
          },
          numberOfQuestions: limit,
        },
        {
          timeout: 120000, // 2 minutes timeout for AI generation
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Error generating questions from syllabus:', error)
      
      // Fallback: If backend API doesn't exist yet, generate basic questions from syllabus
      if (error.response?.status === 404 || error.code === 'ECONNREFUSED' || error.message?.includes('Network')) {
        // Backend endpoint doesn't exist yet - generate basic questions from syllabus
        console.warn('Backend API endpoint not available. Generating basic questions from syllabus structure.')
        
        // Get syllabus information for fallback
        const syllabus = getSyllabus(examType as SyllabusExamType, subject!)
        if (!syllabus) {
          throw new Error(`Syllabus not found for ${examType} ${subject}`)
        }
        
        return await generateBasicQuestionsFromSyllabus(examType, subject!, year, limit, syllabus)
      }
      
      throw new Error(error.response?.data?.message || 'Failed to generate questions')
    }
  },

  /**
   * Get available years for a specific exam type
   */
  getAvailableYears: async (examType: ExamType): Promise<AvailableYearsResponse> => {
    try {
      // TODO: Replace with actual API endpoint
      // const response = await apiClient.get(`${CBT_API_BASE}/years`, {
      //   params: { examType }
      // })
      // return response.data

      // Mock data - replace with actual API call
      const currentYear = new Date().getFullYear()
      const years: string[] = []
      for (let i = currentYear; i >= 2010; i--) {
        years.push(i.toString())
      }
      return { years }
    } catch (error: any) {
      console.error('Error fetching available years:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch available years')
    }
  },

  /**
   * Get available subjects for a specific exam type and year
   */
  getAvailableSubjects: async (
    examType: ExamType,
    year?: string
  ): Promise<AvailableSubjectsResponse> => {
    try {
      // Get subjects from syllabus data
      const subjects = getSubjectsForExam(examType as SyllabusExamType)
      
      if (subjects.length === 0) {
        // Fallback to common subjects if syllabus doesn't have the exam
        const commonSubjects = [
          'Mathematics',
          'English Language',
          'Physics',
          'Chemistry',
          'Biology',
          'Government',
          'Economics',
          'Literature in English',
          'Geography',
          'History',
          'Commerce',
          'Accounting',
          'Further Mathematics',
          'Computer Studies',
        ]
        return { subjects: commonSubjects }
      }

      return { subjects }
    } catch (error: any) {
      console.error('Error fetching available subjects:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch available subjects')
    }
  },

  /**
   * Fallback: Use OpenTriviaDB for general questions (not exam-specific)
   * This can be used as a backup or for practice
   */
  getTriviaQuestions: async (category: string, difficulty: string = 'medium', amount: number = 10) => {
    try {
      // OpenTriviaDB API (free, no auth required)
      const categoryMap: { [key: string]: number } = {
        mathematics: 19,
        science: 17,
        computers: 18,
        general: 9,
      }

      const categoryId = categoryMap[category.toLowerCase()] || 9
      const response = await fetch(
        `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`
      )
      const data = await response.json()

      // Transform OpenTriviaDB format to our CBT format
      return {
        questions: data.results.map((q: any, index: number) => ({
          id: `trivia-${index}`,
          question: q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
          options: [...q.incorrect_answers, q.correct_answer]
            .map((a: string) => a.replace(/&quot;/g, '"').replace(/&#039;/g, "'"))
            .sort(() => Math.random() - 0.5), // Shuffle options
          correctAnswer: [...q.incorrect_answers, q.correct_answer]
            .sort(() => Math.random() - 0.5)
            .indexOf(q.correct_answer),
          explanation: undefined,
          subject: category,
          year: 'Practice',
          examType: 'WAEC' as ExamType, // Default type
        })),
        total: data.results.length,
      }
    } catch (error) {
      console.error('Error fetching trivia questions:', error)
      throw new Error('Failed to fetch practice questions')
    }
  },
}
