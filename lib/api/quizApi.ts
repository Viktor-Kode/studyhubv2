import { getTokenFromCookie } from '@/lib/store/authStore'

// Use the internal Next.js proxy to avoid CORS issues
const API_BASE_URL = '/api/backend/ai'

function authHeaders(): Record<string, string> {
    const token = getTokenFromCookie()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export interface Question {
    _id: string
    content: string
    options: string[]
    answer: number | string
    knowledgeDeepDive: string
    subject: string
    type: string
    createdAt: string
}

export interface QuizSession {
    _id: string
    title: string
    questionType: string
    questionCount: number
    questions: Question[]
    createdAt: string
}

export interface QuizResponse {
    success: boolean
    data: Question[]
    sessionId?: string
    isDuplicate?: boolean
    message?: string
}

export interface StudyNote {
    _id: string
    title: string
    content: string
    sourceFileName?: string
    tags?: string[]
    createdAt: string
}

export interface SessionsListResponse {
    success: boolean
    data: QuizSession[]
}

export const generateQuiz = async (
    text: string,
    amount: number,
    questionType: string = 'multiple-choice',
    fileName?: string,
    forceNew: boolean = false
): Promise<QuizResponse> => {
    const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ text, amount, questionType, fileName, forceNew })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate quiz')
    }
    return response.json()
}

export const getAllQuizSessions = async (): Promise<SessionsListResponse> => {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: { ...authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to fetch quiz sessions')
    return response.json()
}

export const deleteQuizSession = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to delete quiz session')
    return response.json()
}

export const generateStudyNotes = async (
    text: string,
    fileName?: string
): Promise<{ success: boolean; notes: string }> => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ text, fileName })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate study notes')
    }
    return response.json()
}

export const saveStudyNote = async (
    title: string,
    content: string,
    sourceFileName?: string,
    tags: string[] = []
): Promise<{ success: boolean; note: StudyNote }> => {
    const response = await fetch(`${API_BASE_URL}/notes/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, content, sourceFileName, tags })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to save study note')
    }
    return response.json()
}

export const fetchStudyNotes = async (): Promise<{ success: boolean; notes: StudyNote[] }> => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
        headers: { ...authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to fetch study notes')
    return response.json()
}

export const deleteStudyNote = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to delete study note')
    return response.json()
}

export const chatWithTutor = async (
    message: string,
    context?: string,
    chatHistory: { role: string; content: string }[] = []
): Promise<{ success: boolean; reply: string }> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message, context, chatHistory })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Tutor is currently unavailable')
    }
    return response.json()
}
