import { getTokenFromCookie } from '@/lib/store/authStore'

// Build the base URL for flashcard endpoints
// NEXT_PUBLIC_API_URL = http://localhost:5000/api (already ends with /api)
const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const API_BASE_URL = rawUrl.endsWith('/api')
    ? `${rawUrl}/flashcards`
    : `${rawUrl}/api/flashcards`

function getDefaultHeaders(): Record<string, string> {
    const token = getTokenFromCookie()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
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

// Card operations
export const createFlashCard = async (cardData: Partial<FlashCard>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cards`, {
            method: 'POST',
            headers: getDefaultHeaders(),
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
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
    })
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate AI flashcards')
    }
    return response.json()
}

export const getFlashCards = async (userId: string, params?: { category?: string; deckId?: string; favorite?: boolean; search?: string; shuffle?: boolean; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString()
    const response = await fetch(`${API_BASE_URL}/cards/${userId}?${query}`, {
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch flashcards')
    return response.json()
}

export const getDueCards = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/cards/${userId}/due`, {
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch due cards')
    return response.json()
}

export const updateFlashCard = async (cardId: string, updateData: Partial<FlashCard>) => {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: JSON.stringify(updateData)
    })
    if (!response.ok) throw new Error('Failed to update flashcard')
    return response.json()
}

export const deleteFlashCard = async (cardId: string) => {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
        method: 'DELETE',
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete flashcard')
    return response.json()
}

export const reviewCard = async (cardId: string, wasCorrect: boolean) => {
    try {
        if (!cardId) throw new Error('Card ID is required')
        const response = await fetch(`${API_BASE_URL}/cards/${cardId}/review`, {
            method: 'POST',
            headers: getDefaultHeaders(),
            body: JSON.stringify({ wasCorrect })
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
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to toggle favorite')
    return response.json()
}

export const getFlashCardStats = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/stats/${userId}`, {
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch stats')
    return response.json()
}

// Deck operations
export const createDeck = async (deckData: Partial<FlashCardDeck>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/decks`, {
            method: 'POST',
            headers: getDefaultHeaders(),
            body: JSON.stringify(deckData)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to create deck')
        return data
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create deck')
    }
}

export const getDecks = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/decks/${userId}`, {
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch decks')
    return response.json()
}

export const getPublicDecks = async (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    const response = await fetch(`${API_BASE_URL}/public-decks?${query}`, {
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch public decks')
    return response.json()
}

export const cloneDeck = async (deckId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/decks/${deckId}/clone`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ userId })
    })
    if (!response.ok) throw new Error('Failed to clone deck')
    return response.json()
}

export const updateDeck = async (deckId: string, updateData: Partial<FlashCardDeck>) => {
    const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: JSON.stringify(updateData)
    })
    if (!response.ok) throw new Error('Failed to update deck')
    return response.json()
}

export const deleteDeck = async (deckId: string, deleteCards: boolean = false) => {
    const response = await fetch(`${API_BASE_URL}/decks/${deckId}?deleteCards=${deleteCards}`, {
        method: 'DELETE',
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete deck')
    return response.json()
}

// Bulk Operations
export const exportFlashCards = async (userId: string, params?: { format?: 'json' | 'csv'; deckId?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    const response = await fetch(`${API_BASE_URL}/export/${userId}?${query}`, {
        headers: getDefaultHeaders()
    })
    if (!response.ok) throw new Error('Failed to export flashcards')

    if (params?.format === 'csv') {
        return response.blob()
    }
    return response.json()
}

export const importFlashCards = async (userId: string, flashCards: any[], deckId?: string) => {
    const response = await fetch(`${API_BASE_URL}/import`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ userId, flashCards, deckId })
    })
    if (!response.ok) throw new Error('Failed to import flashcards')
    return response.json()
}

// Sessions
export const saveStudySession = async (sessionData: {
    userId: string
    deckId?: string
    cardsStudied: number
    correctAnswers: number
    incorrectAnswers: number
    duration: number
    sessionType?: 'study' | 'review' | 'quiz'
}) => {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(sessionData)
    })
    if (!response.ok) throw new Error('Failed to save session')
    return response.json()
}
