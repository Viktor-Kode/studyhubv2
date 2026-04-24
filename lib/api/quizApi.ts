import { getFirebaseToken } from '@/lib/store/authStore'

const API_BASE_URL = '/api/backend/ai'

async function authHeaders(): Promise<Record<string, string>> {
    const token = await getFirebaseToken()
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
    lastResult?: {
        correctAnswers: number
        totalQuestions: number
        accuracy: number
        answers: {
            questionId: String
            selectedAnswer: String
            correctAnswer: String
            isCorrect: Boolean
        }[]
    }
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

export interface TutorChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp?: string | Date
}

export interface TutorChatSessionPreview {
    sessionId: string
    title: string
    subject: string
    messageCount: number
    lastMessage: string
    createdAt: string
    updatedAt: string
}

export interface TutorChatSessionFull {
    sessionId: string
    subject: string
    messages: TutorChatMessage[]
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
    forceNew: boolean = false,
    onChunk?: (chunk: string) => void
): Promise<QuizResponse> => {
    const stream = !!onChunk;
    const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authHeaders() },
        body: JSON.stringify({ text, amount, questionType, fileName, forceNew, stream })
    })
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || errorData.detail || 'Failed to generate quiz'
        throw new Error(errorMessage)
    }

    const isStream = response.headers.get('Content-Type')?.includes('text/event-stream');

    if (stream && isStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let finalData: QuizResponse | null = null;

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
                            fullContent += parsed.content;
                        }
                        if (parsed.done) {
                            finalData = {
                                success: true,
                                data: parsed.questions,
                                sessionId: parsed.sessionId
                            };
                        }
                        if (parsed.error) throw new Error(parsed.error);
                    } catch (e) {
                        // might be partial JSON in some cases, though SSE usually prevents this
                    }
                }
            }
        }
        
        if (finalData) return finalData;
    }

    return response.json()
}

export const getAllQuizSessions = async (): Promise<SessionsListResponse> => {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: { ...await authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to fetch quiz sessions')
    return response.json()
}

export const deleteQuizSession = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
        method: 'DELETE',
        headers: { ...await authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to delete quiz session')
    return response.json()
}

export const generateStudyNotes = async (
    text: string,
    fileName?: string,
    onChunk?: (chunk: string) => void
): Promise<{ success: boolean; notes: string }> => {
    const stream = !!onChunk;
    const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authHeaders() },
        body: JSON.stringify({ text, fileName, stream })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || errorData.detail || 'Failed to generate study notes'
        throw new Error(errorMessage)
    }

    const isStream = response.headers.get('Content-Type')?.includes('text/event-stream');

    if (stream && isStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullNotes = '';

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
                            fullNotes += parsed.content;
                        }
                        if (parsed.error) throw new Error(parsed.error);
                    } catch (e) { }
                }
            }
        }
        return { success: true, notes: fullNotes };
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
        headers: { 'Content-Type': 'application/json', ...await authHeaders() },
        body: JSON.stringify({ title, content, sourceFileName, tags })
    })
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || errorData.detail || 'Failed to save study note'
        throw new Error(errorMessage)
    }
    return response.json()
}

export const fetchStudyNotes = async (): Promise<{ success: boolean; notes: StudyNote[] }> => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
        headers: { ...await authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to fetch study notes')
    return response.json()
}

export const deleteStudyNote = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: { ...await authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to delete study note')
    return response.json()
}

export const chatWithTutor = async (
    message: string,
    context?: string,
    chatHistory: { role: string; content: string }[] = [],
    onChunk?: (chunk: string) => void
): Promise<{ success: boolean; reply: string }> => {
    const stream = !!onChunk;
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authHeaders() },
        body: JSON.stringify({ message, context, chatHistory, stream })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || errorData.detail || 'Tutor is currently unavailable'
        throw new Error(errorMessage)
    }

    const isStream = response.headers.get('Content-Type')?.includes('text/event-stream');

    if (stream && isStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = '';

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
                            fullReply += parsed.content;
                        }
                        if (parsed.error) throw new Error(parsed.error);
                    } catch (e) { }
                }
            }
        }
        return { success: true, reply: fullReply };
    }

    return response.json()
}

export const getTutorChatHistory = async (): Promise<{ success: boolean; sessions: TutorChatSessionPreview[] }> => {
    const response = await fetch('/api/backend/chat/history', {
        headers: { ...await authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to fetch tutor chat history')
    return response.json()
}

export const getTutorChatSession = async (sessionId: string): Promise<{ success: boolean; session: TutorChatSessionFull }> => {
    const response = await fetch(`/api/backend/chat/history/${sessionId}`, {
        headers: { ...await authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to fetch tutor chat session')
    return response.json()
}

export const saveTutorChatSession = async (
    sessionId: string | null,
    messages: TutorChatMessage[],
    subject: string = ''
): Promise<{ success: boolean; sessionId: string }> => {
    const response = await fetch('/api/backend/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authHeaders() },
        body: JSON.stringify({ sessionId, messages, subject })
    })
    if (!response.ok) throw new Error('Failed to save tutor chat session')
    return response.json()
}

export const deleteTutorChatSession = async (sessionId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/backend/chat/history/${sessionId}`, {
        method: 'DELETE',
        headers: { ...await authHeaders() }
    })
    if (!response.ok) throw new Error('Failed to delete tutor chat session')
    return response.json()
}
