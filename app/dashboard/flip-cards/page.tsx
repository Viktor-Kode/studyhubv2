'use client'

import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  FiPlus, FiTrash2, FiEdit2, FiArrowRight, FiArrowLeft,
  FiRefreshCw, FiStar, FiLayers, FiBarChart2,
  FiSearch, FiFilter, FiX, FiCheck, FiHeart,
  FiShuffle, FiBookOpen, FiLoader, FiGlobe, FiZap, FiDownload,
  FiActivity, FiHash, FiMonitor, FiEdit3, FiTarget,
  FiBook, FiCheckCircle, FiXCircle // for deck icon mapping and feedback
} from 'react-icons/fi'
import { BiBrain, BiTestTube } from 'react-icons/bi'
import { useAuthStore } from '@/lib/store/authStore'
import {
  createFlashCard,
  getFlashCards,
  updateFlashCard,
  deleteFlashCard,
  reviewCard,
  toggleFavorite,
  getFlashCardStats,
  getDueCards,
  createDeck,
  getDecks,
  deleteDeck,
  saveStudySession,
  generateAIFlashCards,
  getPublicDecks,
  cloneDeck,
  exportFlashCards,
  FlashCard,
  FlashCardDeck
} from '@/lib/api/flashcardApi'

type ViewMode = 'study' | 'review' | 'list' | 'decks' | 'public' | 'stats'

export default function FlipCardsPage() {
  // Auth
  const { user } = useAuthStore()
  const userId = (user as any)?.id || (user as any)?._id || ''

  // Data state
  const [cards, setCards] = useState<FlashCard[]>([])
  const [filteredCards, setFilteredCards] = useState<FlashCard[]>([])
  const [decks, setDecks] = useState<FlashCardDeck[]>([])
  const [stats, setStats] = useState<any>(null)
  const [dueCards, setDueCards] = useState<FlashCard[]>([])
  const [publicDecks, setPublicDecks] = useState<FlashCardDeck[]>([])

  // UI state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('decks')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Review state
  const [reviewFeedback, setReviewFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDeckId, setSelectedDeckId] = useState('All')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDeckForm, setShowDeckForm] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aiText, setAiText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [formData, setFormData] = useState({
    front: '',
    back: '',
    category: 'General',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    tags: '',
    deckId: selectedDeckId !== 'All' ? selectedDeckId : ''
  })

  const [deckFormData, setDeckFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    color: '#3B82F6',
    icon: 'book' // Default to identifier
  })

  // Study session tracking
  const [sessionStartTime, setSessionStartTime] = useState(new Date())
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionIncorrect, setSessionIncorrect] = useState(0)

  const categories = [
    'General', 'Programming', 'Mathematics',
    'Science', 'Geography', 'History', 'Language', 'Other'
  ]

  const deckIcons = ['book', 'activity', 'hash', 'globe', 'monitor', 'edit', 'target', 'star']

  const getDeckIcon = (iconName: string) => {
    switch (iconName) {
      case 'book': return <FiBook />
      case 'activity': return <FiActivity />
      case 'hash': return <FiHash />
      case 'globe': return <FiGlobe />
      case 'monitor': return <FiMonitor />
      case 'edit': return <FiEdit3 />
      case 'target': return <FiTarget />
      case 'star': return <FiStar />
      // Fallback for emojis if they exist in DB
      case '📚': return <FiBook />
      case '🔬': return <FiActivity />
      case '🧮': return <FiHash />
      case '🌍': return <FiGlobe />
      case '💻': return <FiMonitor />
      case '📝': return <FiEdit3 />
      case '🎯': return <FiTarget />
      case '⭐': return <FiStar />
      default: return <FiBook />
    }
  }

  // =================== DATA LOADING ===================

  const loadData = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    setError('')

    try {
      const [cardsRes, decksRes, statsRes, dueRes] = await Promise.all([
        getFlashCards(userId),
        getDecks(userId),
        getFlashCardStats(userId),
        getDueCards(userId)
      ])

      setCards(cardsRes.flashCards || [])
      setDecks(decksRes.decks || [])
      setStats(statsRes.stats || null)
      setDueCards(dueRes.flashCards || [])
    } catch (err: any) {
      setError('Failed to load flashcards. Please check your connection.')
      console.error('Load data error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const [bookQuery, setBookQuery] = useState('')
  const [books, setBooks] = useState<any[]>([])
  const [isSearchingBooks, setIsSearchingBooks] = useState(false)

  const searchBooks = async (query: string) => {
    if (!query.trim()) return
    setIsSearchingBooks(true)
    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`)
      const data = await response.json()
      setBooks(data.docs || [])
    } catch (err) {
      console.error('Book search error:', err)
      setError('Failed to fetch books')
    } finally {
      setIsSearchingBooks(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'public' && bookQuery.trim() === '') {
      // Default search for educational books
      searchBooks('education science technology')
    }
  }, [viewMode])

  // =================== FILTERING ===================

  useEffect(() => {
    let sourceCards = viewMode === 'review' ? dueCards : cards
    let filtered = [...sourceCards]

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(c => c.category === selectedCategory)
    }

    if (selectedDeckId !== 'All') {
      filtered = filtered.filter(c => {
        const id = typeof c.deckId === 'object' ? c.deckId?._id : c.deckId
        return id === selectedDeckId
      })
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(c => c.isFavorite)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.front.toLowerCase().includes(query) ||
        c.back.toLowerCase().includes(query)
      )
    }

    setFilteredCards(filtered)
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [cards, dueCards, viewMode, selectedCategory, selectedDeckId, showFavoritesOnly, searchQuery])

  // =================== HELPERS ===================

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const getDeckName = (deckId?: string) => {
    if (!deckId) return null
    const deck = decks.find(d => d._id === deckId)
    return deck?.name
  }

  const getMasteryLabel = (level: number = 0) => {
    const labels = ['New', 'Beginner', 'Learning', 'Familiar', 'Proficient', 'Mastered']
    return labels[level] || 'New'
  }

  // =================== CARD OPERATIONS ===================

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setIsSaving(true)
    setError('')

    try {
      const cardData = {
        userId,
        front: formData.front.trim(),
        back: formData.back.trim(),
        category: formData.category,
        difficulty: formData.difficulty,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        deckId: formData.deckId || undefined
      }

      if (editingId) {
        const res = await updateFlashCard(editingId, cardData)
        setCards(prev => prev.map(c => c._id === editingId ? res.flashCard : c))
        showSuccess('Card updated successfully!')
      } else {
        const res = await createFlashCard(cardData)
        setCards(prev => [res.flashCard, ...prev])
        showSuccess('Card created successfully!')
      }

      resetForm()
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to save card')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm('Delete this flashcard? This cannot be undone.')) return

    try {
      await deleteFlashCard(cardId)
      setCards(prev => prev.filter(c => c._id !== cardId))
      showSuccess('Card deleted!')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete card')
    }
  }

  const handleEdit = (card: FlashCard) => {
    setFormData({
      front: card.front,
      back: card.back,
      category: card.category,
      difficulty: card.difficulty || 'medium',
      tags: card.tags?.join(', ') || '',
      deckId: card.deckId || ''
    })
    setEditingId(card._id || null)
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleFavorite = async (cardId: string) => {
    try {
      const res = await toggleFavorite(cardId)
      setCards(prev => prev.map(c =>
        c._id === cardId ? { ...c, isFavorite: res.flashCard.isFavorite } : c
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to toggle favorite')
    }
  }

  const handleReview = async (wasCorrect: boolean) => {
    const currentCard = filteredCards[currentIndex]
    if (!currentCard?._id || isReviewing) return

    setIsReviewing(true)
    setReviewFeedback(wasCorrect ? 'correct' : 'incorrect')

    try {
      await reviewCard(currentCard._id, wasCorrect)

      if (wasCorrect) setSessionCorrect(prev => prev + 1)
      else setSessionIncorrect(prev => prev + 1)

      // Update card mastery in local state
      setCards(prev => prev.map(c => {
        if (c._id === currentCard._id) {
          return {
            ...c,
            reviewCount: (c.reviewCount || 0) + 1,
            correctCount: wasCorrect ? (c.correctCount || 0) + 1 : (c.correctCount || 0),
            incorrectCount: !wasCorrect ? (c.incorrectCount || 0) + 1 : (c.incorrectCount || 0),
            masteryLevel: wasCorrect
              ? Math.min(5, (c.masteryLevel || 0) + 1)
              : Math.max(0, (c.masteryLevel || 0) - 1)
          }
        }
        return c
      }))

      // Show feedback for 1.5 seconds then move to next card
      setTimeout(() => {
        setReviewFeedback(null)
        setIsFlipped(false)
        setIsReviewing(false)

        if (currentIndex < filteredCards.length - 1) {
          setCurrentIndex(prev => prev + 1)
        } else {
          // All cards reviewed
          showSuccess(`Session complete! ✅ ${sessionCorrect + (wasCorrect ? 1 : 0)} correct, ❌ ${sessionIncorrect + (!wasCorrect ? 1 : 0)} incorrect`)
          saveStudySession({
            userId,
            deckId: selectedDeckId !== 'All' ? selectedDeckId : undefined,
            cardsStudied: sessionCorrect + sessionIncorrect + 1,
            correctAnswers: wasCorrect ? sessionCorrect + 1 : sessionCorrect,
            incorrectAnswers: !wasCorrect ? sessionIncorrect + 1 : sessionIncorrect,
            duration: Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000),
            sessionType: viewMode === 'review' ? 'review' : 'study'
          })
          setViewMode('stats')
          loadData()
        }
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Failed to record review')
      setReviewFeedback(null)
      setIsReviewing(false)
    }
  }

  // =================== DECK OPERATIONS ===================

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setIsSaving(true)
    try {
      const res = await createDeck({
        userId,
        ...deckFormData
      })
      setDecks(prev => [res.deck, ...prev])
      setDeckFormData({
        name: '',
        description: '',
        category: 'General',
        color: '#3B82F6',
        icon: 'book'
      })
      setShowDeckForm(false)
      showSuccess('Deck created successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to create deck')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Delete this deck? Cards will be kept but removed from the deck.')) return

    try {
      await deleteDeck(deckId, false)
      setDecks(prev => prev.filter(d => d._id !== deckId))
      showSuccess('Deck deleted!')
    } catch (err: any) {
      setError(err.message || 'Failed to delete deck')
    }
  }

  const handleClone = async (deckId: string) => {
    try {
      await cloneDeck(deckId, userId)
      showSuccess('Deck cloned successfully!')
      loadData()
      setViewMode('decks')
    } catch (error) {
      setError('Failed to clone deck')
    }
  }

  // =================== AI GENERATION ===================

  const handleGenerateAI = async () => {
    if (!aiText.trim()) return
    setIsGenerating(true)
    setError('')
    try {
      await generateAIFlashCards({
        text: aiText,
        userId,
        deckId: selectedDeckId !== 'All' ? selectedDeckId : undefined,
        amount: 5
      })
      loadData()
      setShowAIModal(false)
      setAiText('')
      showSuccess('AI Flashcards generated!')
    } catch (error) {
      setError('AI Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  // =================== NAVIGATION ===================

  const handleNextCard = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    }
  }

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }

  const handleShuffle = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5)
    setFilteredCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    showSuccess('Cards shuffled!')
  }

  const resetForm = () => {
    setFormData({
      front: '',
      back: '',
      category: 'General',
      difficulty: 'medium',
      tags: '',
      deckId: selectedDeckId !== 'All' ? selectedDeckId : ''
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const allCategories = ['All', ...new Set(cards.map(c => c.category))]

  if (isLoading && !cards.length && !decks.length) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your flashcard hub...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Flashcard Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {cards.length} cards • {dueCards.length} ready for review
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/20"
            >
              <FiZap /> AI Generate
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowAddForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20"
            >
              <FiPlus /> Add Card
            </button>
            <button
              onClick={async () => {
                const blob = await exportFlashCards(userId, { format: 'csv' });
                const url = window.URL.createObjectURL(blob as Blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'flashcards.csv';
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all font-bold"
            >
              <FiDownload /> Export
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <FiCheck className="text-green-500" />
            <p className="text-green-800 dark:text-green-300 font-medium">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <FiXCircle className="text-red-500" />
              <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-gray-400 hover:text-gray-600"><FiX /></button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit overflow-x-auto no-scrollbar">
          {[
            { id: 'decks', label: 'My Decks', icon: FiLayers },
            { id: 'study', label: 'Study', icon: FiBookOpen },
            { id: 'review', label: `Review (${dueCards.length})`, icon: FiRefreshCw },
            { id: 'list', label: 'All Cards', icon: FiFilter },
            { id: 'public', label: 'Library', icon: FiGlobe },
            { id: 'stats', label: 'Analytics', icon: FiBarChart2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setViewMode(tab.id as ViewMode)
                setSessionStartTime(new Date())
                setSessionCorrect(0)
                setSessionIncorrect(0)
              }}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all whitespace-nowrap ${viewMode === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>

        {/* Add Card Form */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm}></div>
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {editingId ? 'Update Card' : 'New Flashcard'}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <FiX className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCardSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Target Deck</label>
                    <select
                      value={formData.deckId}
                      onChange={e => setFormData({ ...formData, deckId: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold"
                    >
                      <option value="">Ungrouped</option>
                      {decks.map(deck => <option key={deck._id} value={deck._id}>{deck.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Front Side</label>
                  <textarea
                    required rows={3}
                    value={formData.front} onChange={e => setFormData({ ...formData, front: e.target.value })}
                    placeholder="What's the question?"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Back Side</label>
                  <textarea
                    required rows={3}
                    value={formData.back} onChange={e => setFormData({ ...formData, back: e.target.value })}
                    placeholder="And the answer..."
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold placeholder:text-gray-400"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit" disabled={isSaving}
                    className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
                  >
                    {isSaving ? <FiLoader className="animate-spin" /> : null}
                    {editingId ? 'UPDATE CARD' : 'SAVE CARD'}
                  </button>
                  <button
                    type="button" onClick={resetForm}
                    className="px-8 py-5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========== DECKS VIEW ========== */}
        {viewMode === 'decks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-400">Your Collections</h2>
              <button
                onClick={() => setShowDeckForm(true)}
                className="text-blue-600 hover:text-blue-700 font-black text-sm uppercase tracking-widest flex items-center gap-2"
              >
                <FiPlus /> Create New Deck
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map(deck => (
                <div
                  key={deck._id}
                  className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all cursor-pointer overflow-hidden"
                  onClick={() => {
                    setSelectedDeckId(deck._id || 'All')
                    setViewMode('study')
                    setSessionStartTime(new Date())
                  }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck._id!); }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg leading-none"
                    style={{ backgroundColor: deck.color + '20', color: deck.color }}
                  >
                    {getDeckIcon(deck.icon || 'book')}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{deck.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium line-clamp-2 mb-6">{deck.description || 'No description provided.'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-gray-500">
                      {deck.cardCount || 0} CARDS
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-blue-500">{deck.category}</span>
                  </div>
                </div>
              ))}
              {decks.length === 0 && (
                <div onClick={() => setShowDeckForm(true)} className="border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-500/50 transition-all">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all mb-4">
                    <FiPlus size={24} />
                  </div>
                  <p className="font-black text-gray-400 group-hover:text-blue-500 transition-all">CREATE YOUR FIRST DECK</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== STUDY & REVIEW VIEW ========== */}
        {(viewMode === 'study' || viewMode === 'review') && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('decks')}
                  className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-gray-200"
                >
                  <FiArrowLeft />
                </button>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {viewMode === 'review' ? 'Daily Review' : getDeckName(selectedDeckId) || 'Study Session'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleShuffle} className="p-3 bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:text-blue-500 transition-all" title="Shuffle Cards">
                  <FiShuffle />
                </button>
                <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl font-black text-sm">
                  {currentIndex + 1} / {filteredCards.length}
                </div>
              </div>
            </div>

            {filteredCards.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <FiBookOpen size={48} className="text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-black mb-2">No Cards Found</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Either this deck is empty or all cards are up to date! Try another deck or add new cards.</p>
                <button onClick={() => setViewMode('decks')} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Go Back</button>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-700"
                    style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                  />
                </div>

                {/* Session Score */}
                {(sessionCorrect + sessionIncorrect) > 0 && (
                  <div className="mt-3 flex justify-center gap-6 text-sm animate-in fade-in">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-black">
                      <FiCheck /> {sessionCorrect} GOT IT
                    </span>
                    <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-black">
                      <FiX /> {sessionIncorrect} STILL LEARNING
                    </span>
                    <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-black">
                      <FiTarget /> {Math.round((sessionCorrect / (sessionCorrect + sessionIncorrect)) * 100)}% ACCURACY
                    </span>
                  </div>
                )}

                <div
                  className="relative h-[28rem] cursor-pointer perspective-1000"
                  onClick={() => !isReviewing && setIsFlipped(!isFlipped)}
                >
                  <div
                    className={`absolute inset-0 w-full h-full transition-all duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''
                      }`}
                  >
                    {/* Front Side */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-[3rem] p-12 border-2 border-gray-100 dark:border-gray-700 shadow-2xl flex flex-col items-center justify-center text-center">
                      <span className="absolute top-10 text-xs font-black uppercase tracking-[0.3em] text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-6 py-2 rounded-full">
                        Question
                      </span>
                      <h2 className="text-4xl font-black leading-tight text-gray-900 dark:text-white max-w-lg">
                        {filteredCards[currentIndex].front}
                      </h2>
                      <p className="absolute bottom-10 text-xs font-black text-gray-400 uppercase tracking-widest">
                        Tap to reveal answer
                      </p>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 shadow-2xl flex flex-col items-center justify-center text-center rotate-y-180 overflow-hidden">
                      {/* Feedback Overlay */}
                      {reviewFeedback && (
                        <div className={`absolute inset-0 flex items-center justify-center rounded-[3rem] z-10 transition-all duration-300 ${reviewFeedback === 'correct'
                          ? 'bg-green-500/90'
                          : 'bg-red-500/90'
                          }`}>
                          <div className="text-center text-white p-8">
                            <div className="text-7xl mb-4 animate-bounce">
                              {reviewFeedback === 'correct' ? <FiCheckCircle /> : <FiActivity />}
                            </div>
                            <p className="text-3xl font-black uppercase tracking-tight">
                              {reviewFeedback === 'correct' ? 'Got it!' : 'Keep Going!'}
                            </p>
                            <p className="text-sm mt-2 opacity-90 font-bold uppercase tracking-widest">
                              {reviewFeedback === 'correct'
                                ? 'Mastery increased! Moving to next card...'
                                : 'Scheduled for sooner review. Moving on...'}
                            </p>
                          </div>
                        </div>
                      )}

                      <span className="absolute top-10 text-xs font-black uppercase tracking-[0.3em] text-blue-100 bg-white/10 px-6 py-2 rounded-full">
                        Resolution
                      </span>
                      <p className="text-3xl text-white font-bold leading-relaxed max-w-lg mb-8">
                        {filteredCards[currentIndex].back}
                      </p>

                      <div className="flex justify-center gap-4 mt-4 w-full px-6">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (filteredCards[currentIndex]?._id && !isReviewing) handleReview(false)
                          }}
                          disabled={isReviewing}
                          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg transition-all ${isReviewing
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95'
                            }`}
                        >
                          <FiX /> Still Learning
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (filteredCards[currentIndex]?._id && !isReviewing) handleReview(true)
                          }}
                          disabled={isReviewing}
                          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg transition-all ${isReviewing
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95'
                            }`}
                        >
                          <FiCheck /> I Got This!
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {!isFlipped && (
                  <div className="flex justify-between items-center px-6">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        handleToggleFavorite(filteredCards[currentIndex]._id!)
                      }}
                      className={`p-5 rounded-2xl transition-all shadow-lg ${filteredCards[currentIndex].isFavorite
                        ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-yellow-500/10'
                        : 'text-gray-400 bg-white dark:bg-gray-800 shadow-gray-200/50 dark:shadow-none'
                        }`}
                    >
                      {filteredCards[currentIndex].isFavorite ? <FiStar size={28} style={{ fill: 'currentColor' }} /> : <FiStar size={28} />}
                    </button>
                    <div className="flex gap-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePreviousCard(); }}
                        disabled={currentIndex === 0 || isReviewing}
                        className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none disabled:opacity-30 hover:text-blue-600"
                      >
                        <FiArrowLeft size={24} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                        disabled={currentIndex === filteredCards.length - 1 || isReviewing}
                        className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none disabled:opacity-30 hover:text-blue-600"
                      >
                        <FiArrowRight size={24} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== LIST VIEW ========== */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter cards..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-6 py-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-transparent outline-none font-bold"
              >
                {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`p-3 rounded-2xl transition-all ${showFavoritesOnly ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'}`}
              >
                <FiStar />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card) => (
                <div key={card._id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                      {card.category}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleEdit(card)} className="p-2 text-gray-400 hover:text-blue-500"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(card._id!)} className="p-2 text-gray-400 hover:text-red-500"><FiTrash2 /></button>
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{card.front}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">{card.back}</p>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400">
                    <span>{getMasteryLabel(card.masteryLevel)}</span>
                    <span className="flex items-center gap-1"><FiRefreshCw /> {card.reviewCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== ANALYTICS VIEW ========== */}
        {viewMode === 'stats' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Intelligence', value: stats.totalCards, color: 'blue', icon: BiBrain },
                { label: 'Mastery', value: stats.masteredCards, color: 'green', icon: FiCheck },
                { label: 'Daily Goal', value: stats.dueCards, color: 'orange', icon: FiRefreshCw },
                { label: 'Accuracy', value: `${stats.accuracy || 0}%`, color: 'purple', icon: FiHeart }
              ].map((item) => (
                <div key={item.label} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center text-xl bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-500`}>
                    <item.icon />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none lowercase mb-1">{item.value}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-black uppercase tracking-tight mb-8">Concept Mastery</h3>
                <div className="space-y-6">
                  {stats.categoryBreakdown?.map((cat: any) => (
                    <div key={cat._id}>
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                        <span>{cat._id}</span>
                        <span className="text-blue-500">{Math.round((cat.count / stats.totalCards) * 100)}%</span>
                      </div>
                      <div className="h-4 w-full bg-gray-50 dark:bg-gray-900 rounded-full overflow-hidden p-1 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                          style={{ width: `${(cat.count / stats.totalCards) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-black uppercase tracking-tight mb-8">Difficulty Distribution</h3>
                <div className="flex items-end justify-between h-48 gap-4 px-4">
                  {['easy', 'medium', 'hard'].map((diff) => {
                    const count = stats.difficultyBreakdown?.find((d: any) => d._id === diff)?.count || 0;
                    const height = stats.totalCards > 0 ? (count / stats.totalCards) * 100 : 0;
                    return (
                      <div key={diff} className="flex-1 flex flex-col items-center gap-4">
                        <div className="text-xs font-black text-gray-400">{count}</div>
                        <div
                          className={`w-full rounded-2xl transition-all duration-1000 opacity-80 hover:opacity-100 ${diff === 'easy' ? 'bg-green-500' : diff === 'hard' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                          style={{ height: `${height}%` }}
                        />
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{diff}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== PUBLIC LIBRARY VIEW ========== */}
        {viewMode === 'public' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={bookQuery}
                    onChange={e => setBookQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchBooks(bookQuery)}
                    placeholder="Search for books, textbooks, or authors..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold"
                  />
                </div>
                <button
                  onClick={() => searchBooks(bookQuery)}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  {isSearchingBooks ? <FiLoader className="animate-spin" /> : <FiSearch />}
                  SEARCH
                </button>
              </div>
            </div>

            {isSearchingBooks ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FiLoader className="animate-spin text-4xl text-blue-500 mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">Searching library...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book, idx) => (
                  <div
                    key={`${book.key}-${idx}`}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all flex flex-col h-full overflow-hidden"
                  >
                    <div className="h-48 mb-6 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
                      {book.cover_i ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiBook size={48} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black mb-1 line-clamp-2 leading-tight">{book.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4 line-clamp-1">
                        By {book.author_name ? book.author_name.join(', ') : 'Unknown Author'}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {book.first_publish_year && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-500">
                            {book.first_publish_year}
                          </span>
                        )}
                        {book.language && book.language[0] && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md text-blue-500">
                            {book.language[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`https://openlibrary.org${book.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all mt-auto"
                    >
                      View Details
                    </a>
                  </div>
                ))}
                {books.length === 0 && !isSearchingBooks && (
                  <div className="col-span-full py-20 text-center">
                    <FiSearch size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest">No books found matching your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Generator Modal */}
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isGenerating && setShowAIModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center">
                    <FiZap size={24} />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">AI Generator</h2>
                </div>
                <button onClick={() => setShowAIModal(false)} className="text-gray-400"><FiX /></button>
              </div>

              <div className="space-y-6">
                <p className="text-gray-500 font-medium bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl text-sm border-l-4 border-purple-500">
                  Paste your notes or some study text below. Our AI will automatically generate clear, professional flashcards for you.
                </p>
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Paste your lecture notes, textbook text, or concepts here... (Min 50 characters)"
                  className="w-full h-80 p-6 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-purple-500 rounded-[2rem] outline-none transition-all font-medium text-lg placeholder:text-gray-400"
                />
                <div className="flex gap-4">
                  <button
                    disabled={isGenerating || aiText.length < 50}
                    onClick={handleGenerateAI}
                    className="flex-1 py-5 bg-purple-600 text-white rounded-[1.5rem] font-black text-xl hover:bg-purple-700 transition-all disabled:opacity-30 shadow-xl shadow-purple-500/20 flex items-center justify-center gap-4"
                  >
                    {isGenerating ? <FiLoader className="animate-spin" /> : <FiZap />}
                    {isGenerating ? 'GENERATING...' : 'GENERATE CARDS'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deck Form Modal */}
        {showDeckForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeckForm(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Create Deck</h2>
              <form onSubmit={handleCreateDeck} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Collection Name</label>
                  <input
                    required placeholder="e.g. Advanced Microbiology"
                    value={deckFormData.name} onChange={(e) => setDeckFormData({ ...deckFormData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Category</label>
                  <select
                    value={deckFormData.category}
                    onChange={e => setDeckFormData({ ...deckFormData, category: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-3">System Icon</label>
                  <div className="flex gap-3 flex-wrap">
                    {deckIcons.map(icon => (
                      <button
                        key={icon} type="button"
                        onClick={() => setDeckFormData({ ...deckFormData, icon })}
                        className={`text-2xl w-12 h-12 rounded-xl border-4 transition-all flex items-center justify-center ${deckFormData.icon === icon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent bg-gray-50 dark:bg-gray-900'
                          }`}
                      >
                        {getDeckIcon(icon)}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isSaving} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                  {isSaving ? 'CREATING...' : 'CREATE COLLECTION'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
