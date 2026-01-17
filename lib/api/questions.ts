import { apiClient } from './client'

export interface Question {
  id: string
  content: string
  status: 'pending' | 'answered'
  response?: string
  createdAt: string
  updatedAt: string
}

export interface CreateQuestionData {
  content: string
}

export interface GeneratedQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'fill-in-gap' | 'theory'
  difficulty: 'easy' | 'medium' | 'hard'
  subject: string
  options?: string[]
  answer?: string
}

export interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[]
  message?: string
}

export const questionsApi = {
  getAll: async (): Promise<Question[]> => {
    const response = await apiClient.get<Question[]>('/questions')
    return response.data
  },

  getById: async (id: string): Promise<Question> => {
    const response = await apiClient.get<Question>(`/questions/${id}`)
    return response.data
  },

  create: async (data: CreateQuestionData): Promise<Question> => {
    const response = await apiClient.post<Question>('/questions', data)
    return response.data
  },

  generateFromPDF: async (
    file: File,
    options?: {
      difficulty?: 'easy' | 'medium' | 'hard'
      questionType?: 'multiple-choice' | 'fill-in-gap' | 'theory' | 'all'
      numberOfQuestions?: number
      subject?: string
      assessmentType?: 'assignment' | 'mid-term' | 'examination' | 'classwork'
      marksPerQuestion?: number
    }
  ): Promise<GenerateQuestionsResponse> => {
    const formData = new FormData()
    formData.append('pdf', file)
    
    if (options?.difficulty) {
      formData.append('difficulty', options.difficulty)
    }
    if (options?.questionType) {
      formData.append('questionType', options.questionType)
    }
    if (options?.numberOfQuestions) {
      formData.append('numberOfQuestions', options.numberOfQuestions.toString())
    }
    if (options?.subject) {
      formData.append('subject', options.subject)
    }
    if (options?.assessmentType) {
      formData.append('assessmentType', options.assessmentType)
    }
    if (options?.marksPerQuestion) {
      formData.append('marksPerQuestion', options.marksPerQuestion.toString())
    }

    const response = await apiClient.post<GenerateQuestionsResponse>(
      '/questions/generate-from-pdf',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for PDF processing
      }
    )
    return response.data
  },
}
