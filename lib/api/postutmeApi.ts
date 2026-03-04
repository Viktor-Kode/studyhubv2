import { apiClient } from './client'

export interface University {
  _id: string
  name: string
  shortName: string
  slug: string
  logo?: string
  location?: string
  type: 'federal' | 'state' | 'private'
  availableSubjects?: string[]
  availableYears?: number[]
  totalQuestions?: number
}

export interface UniversityDetails extends University {
  availableYears: number[]
  availableSubjects: string[]
  totalQuestions: number
}

export interface PostUTMEQuestion {
  id: string
  _id?: string
  question: string
  questionText?: string
  options: string[]
  correctAnswer: number
  explanation?: string
  subject?: string
  year?: string
  image?: string
}

export interface PostUTMEQuestionsResponse {
  success: boolean
  questions: PostUTMEQuestion[]
  total: number
  university: string
  subject: string
  year: string
}

export interface PostUTMEResult {
  _id: string
  universityName?: string
  universitySlug?: string
  subject?: string
  year?: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  skipped: number
  accuracy: number
  timeTaken: number
  answers: Array<{
    questionId: string
    questionText: string
    selectedAnswer: string
    correctAnswer: string
    explanation?: string
    isCorrect: boolean
  }>
  takenAt: string
}

export const postutmeApi = {
  getUniversities: async (params?: { type?: string; search?: string }) => {
    const sp = new URLSearchParams()
    if (params?.type) sp.append('type', params.type)
    if (params?.search) sp.append('search', params.search)
    const url = sp.toString() ? `/postutme/universities?${sp}` : '/postutme/universities'
    const res = await apiClient.get<{ success: boolean; universities: University[] }>(url)
    return res.data
  },

  getUniversityBySlug: async (slug: string) => {
    const res = await apiClient.get<{ success: boolean; university: UniversityDetails }>(
      `/postutme/universities/${slug}`
    )
    return res.data
  },

  getQuestions: async (params: {
    university: string
    subject?: string
    year?: string
    count?: number
  }) => {
    const sp = new URLSearchParams()
    sp.append('university', params.university)
    if (params.subject) sp.append('subject', params.subject)
    if (params.year) sp.append('year', params.year)
    if (params.count) sp.append('count', String(params.count))
    const res = await apiClient.get<PostUTMEQuestionsResponse>(
      `/postutme/questions?${sp}`
    )
    return res.data
  },

  saveResult: async (data: {
    universityId?: string
    universitySlug?: string
    universityName?: string
    subject?: string
    year?: number
    totalQuestions: number
    correctAnswers: number
    wrongAnswers: number
    skipped: number
    accuracy: number
    timeTaken: number
    answers: Array<{
      questionId: string
      questionText: string
      selectedAnswer: string
      correctAnswer: string
      explanation?: string
      isCorrect: boolean
    }>
  }) => {
    const res = await apiClient.post<{ success: boolean; result: PostUTMEResult }>(
      '/postutme/results',
      data
    )
    return res.data
  },

  getResults: async () => {
    const res = await apiClient.get<{ success: boolean; results: PostUTMEResult[] }>(
      '/postutme/results'
    )
    return res.data
  },

  getResultById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; result: PostUTMEResult }>(
      `/postutme/results/${id}`
    )
    return res.data
  },
}
