import { getFirebaseToken } from '@/lib/store/authStore'

const API_BASE_URL = '/api/backend/flashcards'

async function getDefaultHeaders(): Promise<Record<string, string>> {
    const token = await getFirebaseToken()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
}

export interface FlashCard {
    _id?: string
    userId: string
    front: string
    back: string
    category: string
    difficulty?: 'easy' | 'medium' | 'hard'
    tags?: string[]
    reviewCount?: number
    correctCount?: number
    incorrectCount?: number
    lastReviewed?: Date
    nextReviewDate?: Date
    masteryLevel?: number
    isFavorite?: boolean
    status?: 'unseen' | 'learning' | 'reviewing' | 'mastered'
    deckId?: string | any
}

export interface FlashCardDeck {
    _id?: string
    userId: string
    name: string
    description?: string
    category?: string
    cardCount?: number
    tags?: string[]
    color?: string
    icon?: string
    isPublic?: boolean
}

// ─── Card Operations ──────────────────────────────────────────────────────────

export const createFlashCard = async (cardData: Partial<FlashCard>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cards`, {
            method: 'POST',
            headers: await getDefaultHeaders(),
            body: JSON.stringify(cardData)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to create flashcard')
        return data
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create flashcard')
    }
}

export const generateAIFlashCards = async (data: { text: string; userId: string; deckId?: string; amount?: number; category?: string }) => {
    const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: await getDefaultHeaders(),
        body: JSON.stringify(data)
    })
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate AI flashcards')
    }
    return response.json()
}

export const getFlashCards = async (params?: { category?: string; deckId?: string; favorite?: boolean; search?: string; shuffle?: boolean; limit?: number }) => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    const response = await fetch(`${API_BASE_URL}/cards${query ? `?${query}` : ''}`, {
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch flashcards')
    return response.json()
}

export const getDueCards = async () => {
    const response = await fetch(`${API_BASE_URL}/cards/due`, {
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch due cards')
    return response.json()
}

export const updateFlashCard = async (cardId: string, updateData: Partial<FlashCard>) => {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
        method: 'PUT',
        headers: await getDefaultHeaders(),
        body: JSON.stringify(updateData)
    })
    if (!response.ok) throw new Error('Failed to update flashcard')
    return response.json()
}

export const deleteFlashCard = async (cardId: string) => {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
        method: 'DELETE',
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete flashcard')
    return response.json()
}

export const reviewCard = async (payload: {
    cardId: string;
    deckId?: string;
    subject?: string;
    topic?: string;
    rating: number; // 1-4
}) => {
    try {
        if (!payload.cardId) throw new Error('Card ID is required')
        const response = await fetch(`${API_BASE_URL}/cards/${payload.cardId}/review`, {
            method: 'POST',
            headers: await getDefaultHeaders(),
            body: JSON.stringify(payload)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to review card')
        return data
    } catch (error: any) {
        throw new Error(error.message || 'Failed to review card')
    }
}

export const toggleFavorite = async (cardId: string) => {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}/favorite`, {
        method: 'POST',
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to toggle favorite')
    return response.json()
}

export const getFlashCardStats = async () => {
    const response = await fetch(`${API_BASE_URL}/stats`, {
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch stats')
    return response.json()
}

// ─── Deck Operations ──────────────────────────────────────────────────────────

export const createDeck = async (deckData: Partial<FlashCardDeck>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/decks`, {
            method: 'POST',
            headers: await getDefaultHeaders(),
            body: JSON.stringify(deckData)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to create deck')
        return data
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create deck')
    }
}

export const getDecks = async () => {
    const response = await fetch(`${API_BASE_URL}/decks`, {
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch decks')
    return response.json()
}

export const getPublicDecks = async (params?: { category?: string; search?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    const response = await fetch(`${API_BASE_URL}/public-decks${query ? `?${query}` : ''}`, {
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch public decks')
    return response.json()
}

export const cloneDeck = async (deckId: string) => {
    const response = await fetch(`${API_BASE_URL}/decks/${deckId}/clone`, {
        method: 'POST',
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to clone deck')
    return response.json()
}

export const updateDeck = async (deckId: string, updateData: Partial<FlashCardDeck>) => {
    const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
        method: 'PUT',
        headers: await getDefaultHeaders(),
        body: JSON.stringify(updateData)
    })
    if (!response.ok) throw new Error('Failed to update deck')
    return response.json()
}

export const deleteDeck = async (deckId: string, deleteCards: boolean = false) => {
    const response = await fetch(`${API_BASE_URL}/decks/${deckId}?deleteCards=${deleteCards}`, {
        method: 'DELETE',
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete deck')
    return response.json()
}

// ─── Bulk Operations ──────────────────────────────────────────────────────────

export const exportFlashCards = async (params?: { format?: 'json' | 'csv'; deckId?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    const response = await fetch(`${API_BASE_URL}/export${query ? `?${query}` : ''}`, {
        headers: await getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to export flashcards')
    if (params?.format === 'csv') return response.blob()
    return response.json()
}

export const importFlashCards = async (flashCards: any[], deckId?: string) => {
    const response = await fetch(`${API_BASE_URL}/import`, {
        method: 'POST',
        headers: await getDefaultHeaders(),
        body: JSON.stringify({ flashCards, deckId })
    })
    if (!response.ok) throw new Error('Failed to import flashcards')
    return response.json()
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const saveStudySession = async (sessionData: {
    deckId?: string
    cardsStudied: number
    correctAnswers: number
    incorrectAnswers: number
    duration: number
    sessionType?: 'study' | 'review' | 'quiz'
}) => {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: await getDefaultHeaders(),
        body: JSON.stringify(sessionData)
    })
    if (!response.ok) throw new Error('Failed to save session')
    return response.json()
}
