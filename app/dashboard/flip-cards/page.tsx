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
  exportFlashCards,
  FlashCard,
  FlashCardDeck
} from '@/lib/api/flashcardApi'

type ViewMode = 'study' | 'review' | 'list' | 'decks' | 'mastered'

export default function FlipCardsPage() {
  // Auth
  const { user } = useAuthStore()
  const userId = user?.uid || ''

  // Data state
  const [cards, setCards] = useState<FlashCard[]>([])
  const [filteredCards, setFilteredCards] = useState<FlashCard[]>([])
  const [decks, setDecks] = useState<FlashCardDeck[]>([])
  const [stats, setStats] = useState<any>(null)
  const [dueCards, setDueCards] = useState<FlashCard[]>([])

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
        getFlashCards(),
        getDecks(),
        getFlashCardStats(),
        getDueCards()
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


  // =================== FILTERING ===================

  useEffect(() => {
    let sourceCards = viewMode === 'review' ? dueCards : cards
    let filtered = [...sourceCards]

    // Hide mastered cards from study, review and list unless in Mastered mode
    if (viewMode === 'study' || viewMode === 'review' || viewMode === 'list') {
      filtered = filtered.filter(c => c.status !== 'mastered')
    } else if (viewMode === 'mastered') {
      filtered = cards.filter(c => c.status === 'mastered')
    }

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
    // Only reset index and flip state if the view mode or significant filters changed
    // This avoids jumping back to card 1 when just mastering a card during study
  }, [cards, dueCards, viewMode, selectedCategory, selectedDeckId, showFavoritesOnly, searchQuery])

  // Reset index when structural filters change
  useEffect(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [viewMode, selectedCategory, selectedDeckId, showFavoritesOnly, searchQuery])

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

  const handleReview = async (rating: number) => {
    const currentCard = filteredCards[currentIndex]
    if (!currentCard?._id || isReviewing) return

    setIsReviewing(true)
    setReviewFeedback(rating >= 3 ? 'correct' : 'incorrect')

    try {
      const payload = {
        cardId: currentCard._id,
        deckId: typeof currentCard.deckId === 'object' ? currentCard.deckId?._id : currentCard.deckId,
        subject: currentCard.category,
        topic: 'General', // Fallback
        rating
      }

      const res = await reviewCard(payload)

      if (rating >= 3) setSessionCorrect(prev => prev + 1)
      else setSessionIncorrect(prev => prev + 1)

      // Update card mastery in local state (Simplified mapping for UI)
      setCards(prev => prev.map(c => {
        if (c._id === currentCard._id) {
          return {
            ...c,
            reviewCount: (c.reviewCount || 0) + 1,
            status: res.status,
            nextReviewDate: res.nextReview
          }
        }
        return c
      }))

      // Show feedback then move to next card
      setTimeout(() => {
        setReviewFeedback(null)
        setIsFlipped(false)
        setIsReviewing(false)

        if (currentIndex < filteredCards.length - 1) {
          setCurrentIndex(prev => prev + 1)
        } else {
          // All cards reviewed
          showSuccess(`Session complete! SRS updated.`)
          saveStudySession({
            deckId: selectedDeckId !== 'All' ? selectedDeckId : undefined,
            cardsStudied: sessionCorrect + sessionIncorrect + 1,
            correctAnswers: rating >= 3 ? sessionCorrect + 1 : sessionCorrect,
            incorrectAnswers: rating < 3 ? sessionIncorrect + 1 : sessionIncorrect,
            duration: Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000),
            sessionType: viewMode === 'review' ? 'review' : 'study'
          })
          setViewMode('stats')
          loadData()
        }
      }, 1000)

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


  // =================== AI GENERATION ===================

  const handleGenerateAI = async () => {
    if (!aiText.trim()) return
    setIsGenerating(true)
    setError('')
    try {
      await generateAIFlashCards({
        text: aiText,
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

  const allCategories = ['All', ...Array.from(new Set(cards.map(c => c.category)))]

  if (isLoading && !cards.length && !decks.length) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
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
    <ProtectedRoute allowedRoles={['student']}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Flashcard Hub
            </h1>
            {dueCards.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                {dueCards.length} DUE TODAY
              </span>
            )}
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
                const blob = await exportFlashCards({ format: 'csv' });
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
        <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'decks', label: 'My Decks', icon: FiLayers },
            { id: 'study', label: 'Study', icon: FiBookOpen },
            { id: 'review', label: `Review (${dueCards.length})`, icon: FiRefreshCw },
            { id: 'list', label: 'All Cards', icon: FiFilter },
            { id: 'mastered', label: 'Mastered', icon: FiCheckCircle }
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
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-white/10">
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
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border-2 border-gray-100 dark:border-gray-700 shadow-2xl flex flex-col items-center justify-center text-center">
                      <span className="absolute top-6 md:top-10 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-4 md:px-6 py-1 md:py-2 rounded-full">
                        Question
                      </span>
                      <h2 className="text-2xl md:text-4xl font-black leading-tight text-gray-900 dark:text-white max-w-lg px-2">
                        {filteredCards[currentIndex].front}
                      </h2>
                      <p className="absolute bottom-6 md:bottom-10 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                        Tap to reveal answer
                      </p>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-2xl flex flex-col items-center justify-center text-center rotate-y-180 overflow-hidden">
                      {/* Feedback Overlay */}
                      {reviewFeedback && (
                        <div className={`absolute inset-0 flex items-center justify-center rounded-[2rem] md:rounded-[3rem] z-10 transition-all duration-300 ${reviewFeedback === 'correct'
                          ? 'bg-green-500/90'
                          : 'bg-red-500/90'
                          }`}>
                          <div className="text-center text-white p-4 md:p-8">
                            <div className="text-5xl md:text-7xl mb-4 animate-bounce">
                              {reviewFeedback === 'correct' ? <FiCheckCircle /> : <FiActivity />}
                            </div>
                            <p className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                              {reviewFeedback === 'correct' ? 'Got it!' : 'Keep Going!'}
                            </p>
                            <p className="text-xs md:text-sm mt-2 opacity-90 font-bold uppercase tracking-widest px-2">
                              {reviewFeedback === 'correct'
                                ? 'Mastery increased! Moving to next card...'
                                : 'Scheduled for sooner review. Moving on...'}
                            </p>
                          </div>
                        </div>
                      )}

                      <span className="absolute top-6 md:top-10 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-blue-100 bg-white/10 px-4 md:px-6 py-1 md:py-2 rounded-full">
                        Resolution
                      </span>
                      <p className="text-xl md:text-3xl text-white font-bold leading-relaxed max-w-lg mb-4 md:mb-8 px-2">
                        {filteredCards[currentIndex].back}
                      </p>

                      <div className="flex gap-4 mt-8 w-full px-6">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (filteredCards[currentIndex]?._id && !isReviewing) handleReview(1) // Not Mastered
                          }}
                          disabled={isReviewing}
                          className={`flex-1 py-4 rounded-[1.5rem] bg-white/10 text-white font-black uppercase tracking-widest border-2 border-white/20 hover:bg-white/20 transition-all ${isReviewing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Still Learning
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (filteredCards[currentIndex]?._id && !isReviewing) handleReview(4) // Mastered
                          }}
                          disabled={isReviewing}
                          className={`flex-1 py-4 rounded-[1.5rem] bg-white text-blue-600 font-black uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all ${isReviewing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Mastered
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
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700/50">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${card.status === 'mastered' ? 'bg-green-100 text-green-700' :
                        card.status === 'reviewing' ? 'bg-blue-100 text-blue-700' :
                          card.status === 'learning' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-500'
                        }`}>
                        {card.status || 'unseen'}
                      </span>
                      {card.nextReviewDate && (
                        <span className="text-[9px] font-bold text-gray-400">
                          Next: {new Date(card.nextReviewDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiRefreshCw className="text-xs" />
                      <span className="text-[10px] font-black">{card.reviewCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== MASTERED VIEW ========== */}
        {viewMode === 'mastered' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-400">Mastered Cards</h2>
              <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {filteredCards.length} CARDS MASTERED
              </span>
            </div>

            {filteredCards.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <FiCheckCircle size={48} className="text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-black mb-2">No Mastered Cards Yet</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Keep studying to master your flashcards! They will appear here once you're confident in them.</p>
                <button onClick={() => setViewMode('study')} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Start Studying</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCards.map((card) => (
                  <div key={card._id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-lg">
                        {card.category}
                      </span>
                      <div className="flex gap-2">
                        <FiCheckCircle className="text-green-500" />
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{card.front}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-6">{card.back}</p>

                    <button
                      onClick={async () => {
                        try {
                          setIsReviewing(true)
                          const payload = {
                            cardId: card._id!,
                            deckId: typeof card.deckId === 'object' ? card.deckId?._id : card.deckId,
                            subject: card.category,
                            rating: 1 // Back to learning
                          }
                          await reviewCard(payload)
                          showSuccess('Card moved back to study deck!')
                          loadData()
                        } catch (err: any) {
                          setError(err.message || 'Failed to update card status')
                        } finally {
                          setIsReviewing(false)
                        }
                      }}
                      className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      <FiRefreshCw className={isReviewing ? 'animate-spin' : ''} /> Still Learning
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div >

      {/* AI Generator Modal */}
      {
        showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isGenerating && setShowAIModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center">
                    <FiZap size={24} />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">AI Generator</h2>
                </div>
                <button onClick={() => setShowAIModal(false)} className="text-gray-400"><FiX /></button>
              </div>

              <div className="space-y-6 overflow-y-auto no-scrollbar pr-2 pb-2">
                <p className="text-gray-500 font-medium bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl text-sm border-l-4 border-purple-500">
                  Paste your notes or some study text below. Our AI will automatically generate clear, professional flashcards for you.
                </p>
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Paste your lecture notes, textbook text, or concepts here... (Min 50 characters)"
                  className="w-full h-48 md:h-80 p-5 md:p-6 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-purple-500 rounded-2xl md:rounded-[2rem] outline-none transition-all font-medium text-base md:text-lg placeholder:text-gray-400"
                />
                <div className="flex gap-4">
                  <button
                    disabled={isGenerating || aiText.length < 50}
                    onClick={handleGenerateAI}
                    className="flex-1 py-4 md:py-5 bg-purple-600 text-white rounded-2xl md:rounded-[1.5rem] font-black text-lg md:text-xl hover:bg-purple-700 transition-all disabled:opacity-30 shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 md:gap-4 shrink-0"
                  >
                    {isGenerating ? <FiLoader className="animate-spin" /> : <FiZap />}
                    {isGenerating ? 'GENERATING...' : 'GENERATE CARDS'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Deck Form Modal */}
      {
        showDeckForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeckForm(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl flex flex-col max-h-[90vh]">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6 md:mb-8 shrink-0">Create Deck</h2>
              <form onSubmit={handleCreateDeck} className="space-y-6 overflow-y-auto no-scrollbar pr-2 pb-2">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Collection Name</label>
                  <input
                    required placeholder="e.g. Advanced Microbiology"
                    value={deckFormData.name} onChange={(e) => setDeckFormData({ ...deckFormData, name: e.target.value })}
                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-xl md:rounded-2xl outline-none font-bold text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Category</label>
                  <select
                    value={deckFormData.category}
                    onChange={e => setDeckFormData({ ...deckFormData, category: e.target.value })}
                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-xl md:rounded-2xl outline-none font-bold text-sm md:text-base"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-3">System Icon</label>
                  <div className="flex gap-2 md:gap-3 flex-wrap">
                    {deckIcons.map(icon => (
                      <button
                        key={icon} type="button"
                        onClick={() => setDeckFormData({ ...deckFormData, icon })}
                        className={`text-xl md:text-2xl w-10 md:w-12 h-10 md:h-12 rounded-xl border-4 transition-all flex items-center justify-center ${deckFormData.icon === icon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent bg-gray-50 dark:bg-gray-900'
                          }`}
                      >
                        {getDeckIcon(icon)}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isSaving} className="w-full py-4 md:py-5 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 shrink-0 text-sm md:text-base">
                  {isSaving ? 'CREATING...' : 'CREATE COLLECTION'}
                </button>
              </form>
            </div>
          </div>
        )
      }
    </ProtectedRoute >
  )
}
