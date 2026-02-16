const API_BASE_URL = 'http://localhost:5000/api/ai';

export interface Question {
    _id: string;
    content: string;
    options: string[];
    answer: number | string;
    explanation: string;
    subject: string;
    type: string;
    createdAt: string;
}

export interface QuizSession {
    _id: string;
    title: string;
    questionType: string;
    questionCount: number;
    questions: Question[];
    createdAt: string;
}

export interface QuizResponse {
    success: boolean;
    data: Question[];
    sessionId?: string;
    isDuplicate?: boolean;
    message?: string;
}

export interface SessionsListResponse {
    success: boolean;
    data: QuizSession[];
}

export const generateQuiz = async (
    text: string,
    amount: number,
    questionType: string = 'multiple-choice',
    fileName?: string
): Promise<QuizResponse> => {
    const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, amount, questionType, fileName })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate quiz');
    }
    return response.json();
};

export const getAllQuizSessions = async (): Promise<SessionsListResponse> => {
    const response = await fetch(`${API_BASE_URL}/sessions`);
    if (!response.ok) throw new Error('Failed to fetch quiz sessions');
    return response.json();
};

export const deleteQuizSession = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete quiz session');
    return response.json();
};
