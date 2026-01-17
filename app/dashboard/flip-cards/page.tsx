'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FaPlus, FaTrash, FaEdit, FaArrowRight, FaArrowLeft, FaSync } from 'react-icons/fa'

interface FlashCard {
  id: string
  front: string
  back: string
  category: string
}

export default function FlipCardsPage() {
  const [cards, setCards] = useState<FlashCard[]>([
    {
      id: '1',
      front: 'What is React?',
      back: 'React is a JavaScript library for building user interfaces, particularly web applications.',
      category: 'Programming',
    },
    {
      id: '2',
      front: 'What is the capital of Nigeria?',
      back: 'Abuja is the capital city of Nigeria.',
      category: 'Geography',
    },
  ])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<FlashCard, 'id'>>({
    front: '',
    back: '',
    category: 'General',
  })

  const currentCard = cards[currentIndex]

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      setCards(cards.map((c) => (c.id === editingId ? { ...formData, id: editingId } : c)))
      setEditingId(null)
    } else {
      setCards([...cards, { ...formData, id: Date.now().toString() }])
    }
    setFormData({ front: '', back: '', category: 'General' })
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    setCards(cards.filter((c) => c.id !== id))
    if (currentIndex >= cards.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleEdit = (card: FlashCard) => {
    setFormData({ front: card.front, back: card.back, category: card.category })
    setEditingId(card.id)
    setShowAddForm(true)
  }

  const categories = ['General', 'Programming', 'Mathematics', 'Science', 'Geography', 'History']

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Flip Cards
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Study with interactive flashcards
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingId(null)
              setFormData({ front: '', back: '', category: 'General' })
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaPlus />
            Add Card
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Edit Card' : 'Add New Card'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Front (Question)
                </label>
                <textarea
                  required
                  value={formData.front}
                  onChange={(e) => setFormData({ ...formData, front: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Back (Answer)
                </label>
                <textarea
                  required
                  value={formData.back}
                  onChange={(e) => setFormData({ ...formData, back: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'} Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingId(null)
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No flashcards yet. Create your first card!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Flashcard Display */}
            <div className="max-w-2xl mx-auto">
              <div
                className="relative h-96 cursor-pointer perspective-1000"
                onClick={handleFlip}
              >
                <div
                  className={`absolute inset-0 w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-sm text-blue-500 font-medium mb-2 block">
                        {currentCard.category}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentCard.front}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Click to flip
                      </p>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg flex items-center justify-center rotate-y-180">
                    <div className="text-center">
                      <span className="text-sm text-blue-500 font-medium mb-2 block">
                        Answer
                      </span>
                      <p className="text-lg text-gray-900 dark:text-white">
                        {currentCard.back}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Click to flip back
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaArrowLeft />
                </button>
                <button
                  onClick={handleFlip}
                  className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FaSync />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === cards.length - 1}
                  className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaArrowRight />
                </button>
              </div>

              <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                Card {currentIndex + 1} of {cards.length}
              </div>
            </div>

            {/* Cards List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                All Cards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      index === currentIndex
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => {
                      setCurrentIndex(index)
                      setIsFlipped(false)
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-blue-500 font-medium">{card.category}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(card)
                          }}
                          className="p-1 text-gray-500 hover:text-blue-500"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(card.id)
                          }}
                          className="p-1 text-gray-500 hover:text-red-500"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {card.front}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {card.back}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
