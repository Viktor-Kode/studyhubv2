'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  FiTrash2, FiClock, FiFileText, FiLoader, FiExternalLink,
  FiEdit2, FiSave, FiX, FiChevronLeft, FiChevronRight, FiLayers, FiRotateCw, FiZap
} from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'
import ReactMarkdown from 'react-markdown'
import { fetchStudyNotes, deleteStudyNote, updateStudyNote, StudyNote } from '@/lib/api/quizApi'
import { generateAIFlashCards, FlashCard } from '@/lib/api/flashcardApi'
import { toast } from 'react-hot-toast'

export default function NotesHistory() {
    const [notes, setNotes] = useState<StudyNote[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editingTitle, setEditingTitle] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    // Flashcard state inside note detail
    const [noteTab, setNoteTab] = useState<'note' | 'flashcard'>('note')
    const [noteCards, setNoteCards] = useState<FlashCard[]>([])
    const [cardIndex, setCardIndex] = useState(0)
    const [cardFlipped, setCardFlipped] = useState(false)
    const [generatingCards, setGeneratingCards] = useState(false)
    const [cardsLoaded, setCardsLoaded] = useState(false)
    
    const searchParams = useSearchParams()
    const router = useRouter()
    const noteId = searchParams.get('id')

    // Helper
    const toLocaleLongDateString = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    }

    useEffect(() => {
        loadNotes()
    }, [])

    // Sync selection with URL
    useEffect(() => {
        if (noteId && notes.length > 0) {
            const found = notes.find(n => n._id === noteId)
            if (found) {
                setSelectedNote(found)
                // If we're editing but the note changed, close editor
                setIsEditingTitle(false)
            }
        } else {
            setSelectedNote(null)
            setIsEditingTitle(false)
        }
    }, [noteId, notes])

    // Reset flashcard state whenever a new note is selected
    useEffect(() => {
        setNoteTab('note')
        setNoteCards([])
        setCardIndex(0)
        setCardFlipped(false)
        setCardsLoaded(false)
    }, [selectedNote?._id])

    const handleGenerateCards = async () => {
        if (!selectedNote || generatingCards) return
        setGeneratingCards(true)
        try {
            const res = await generateAIFlashCards({
                text: selectedNote.content.slice(0, 4000),
                amount: 10,
                category: selectedNote.title
            }).catch(() => null)
            if (res?.success && Array.isArray(res.flashCards) && res.flashCards.length > 0) {
                setNoteCards(res.flashCards)
            } else {
                // Fallback: extract from markdown
                const cards = extractCardsFromText(selectedNote.content, selectedNote.title)
                setNoteCards(cards)
            }
        } catch {
            const cards = extractCardsFromText(selectedNote.content, selectedNote.title)
            setNoteCards(cards)
        } finally {
            setGeneratingCards(false)
            setCardsLoaded(true)
        }
    }

    function extractCardsFromText(text: string, title: string): FlashCard[] {
        const cards: FlashCard[] = []
        const boldRegex = /(?:^|\n)(?:\d+\.\s*|\*\s*|- \s*)?\*\*(.*?)\*\*\s*[:\-\u2013]?\s*([^\n]+)/g
        let m
        while ((m = boldRegex.exec(text)) !== null) {
            const front = m[1].trim().replace(/^#+\s*/, '')
            const back = m[2].trim()
            if (front.length >= 3 && back.length >= 5) cards.push({ userId: '', front, back, category: title })
        }
        return cards.slice(0, 15)
    }

    const loadNotes = async () => {
        try {
            setLoading(true)
            const response = await fetchStudyNotes()
            if (response.success) {
                setNotes(response.notes)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch notes')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this study note?')) return

        try {
            setDeleting(id)
            const response = await deleteStudyNote(id)
            if (response.success) {
                setNotes(prev => prev.filter(n => n._id !== id))
                if (noteId === id) {
                    router.push('/dashboard/notes-history')
                }
                toast.success('Note deleted successfully')
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete note')
        } finally {
            setDeleting(null)
        }
    }

    const handleUpdateTitle = async () => {
        if (!selectedNote || !editingTitle.trim()) return
        if (editingTitle.trim() === selectedNote.title) {
            setIsEditingTitle(false)
            return
        }

        try {
            setIsUpdating(true)
            const response = await updateStudyNote(selectedNote._id, { title: editingTitle.trim() })
            if (response.success) {
                setNotes(prev => prev.map(n => n._id === selectedNote._id ? { ...n, title: editingTitle.trim() } : n))
                setSelectedNote(prev => prev ? { ...prev, title: editingTitle.trim() } : null)
                setIsEditingTitle(false)
                toast.success('Note name updated')
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update note name')
        } finally {
            setIsUpdating(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FiLoader className="text-4xl text-emerald-500 animate-spin" />
            <p className="font-bold text-emerald-600 animate-pulse uppercase tracking-widest text-xs">Retrieving your archives...</p>
        </div>
    )

    if (error) return (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 rounded-2xl p-8 text-center">
            <p className="text-red-500 font-bold mb-4">{error}</p>
            <button onClick={loadNotes} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition">Try Again</button>
        </div>
    )

    if (notes.length === 0) return (
        <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-20 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiFileText className="text-3xl text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Notes Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8 font-medium">Generate some study notes in the Question Bank to see them here.</p>
        </div>
    )

    return (
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
            {/* List Side */}
            <div className={`lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 ${selectedNote ? 'hidden lg:block' : 'block'}`}>
                {notes.map((note) => (
                    <div
                        key={note._id}
                        onClick={() => router.push(`/dashboard/notes-history?id=${note._id}`)}
                        className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer relative
              ${selectedNote?._id === note._id
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/5'
                                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-200'}
            `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 transition truncate pr-12">{note.title}</h4>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(note._id) }}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                disabled={deleting === note._id}
                            >
                                {deleting === note._id ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                            {note.content.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-auto">
                            <span className="flex items-center gap-1"><FiClock className="text-emerald-500" /> {new Date(note.createdAt).toLocaleDateString()}</span>
                            {note.sourceFileName && <span className="flex items-center gap-1 truncate max-w-[100px]"><FiFileText /> {note.sourceFileName}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Viewer Side */}
            <div className={`lg:col-span-2 ${!selectedNote ? 'hidden lg:block' : 'block'}`}>
                {selectedNote ? (
                    <div className="bg-transparent p-0 sm:p-4 h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                            <button 
                                onClick={() => { setSelectedNote(null); router.push('/dashboard/notes-history') }}
                                className="flex items-center gap-2 text-emerald-600 font-bold mb-2 w-fit hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition"
                            >
                                <FiChevronLeft /> Back to Notes
                            </button>
                            <div className="flex-1">
                                {isEditingTitle ? (
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            className="text-xl sm:text-2xl font-black bg-gray-50 dark:bg-gray-900 border-2 border-emerald-500 rounded-xl px-4 py-1 w-full focus:outline-none text-gray-900 dark:text-white"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateTitle()
                                                if (e.key === 'Escape') setIsEditingTitle(false)
                                            }}
                                        />
                                        <button
                                            onClick={handleUpdateTitle}
                                            disabled={isUpdating}
                                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
                                            title="Save"
                                        >
                                            {isUpdating ? <FiLoader className="animate-spin" /> : <FiSave />}
                                        </button>
                                        <button
                                            onClick={() => setIsEditingTitle(false)}
                                            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                            title="Cancel"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 mb-2 group/title">
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{selectedNote.title}</h2>
                                        <button
                                            onClick={() => {
                                                setEditingTitle(selectedNote.title)
                                                setIsEditingTitle(true)
                                            }}
                                            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition shrink-0"
                                            title="Edit Name"
                                        >
                                            <FiEdit2 size={16} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-md">Saved Note</span>
                                    <span>{toLocaleLongDateString(selectedNote.createdAt)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    try {
                                        sessionStorage.setItem('quiz_source_content', selectedNote.content)
                                        sessionStorage.setItem('quiz_source_title', selectedNote.title || 'Study Note')
                                        window.location.href = '/dashboard/question-bank?tab=quiz&source=notes'
                                    } catch (e) {
                                        toast.error('Note too large. Please copy the content and paste it manually in Question Bank.')
                                    }
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                            >
                                <BiBrain className="text-lg" />
                                Practice with Quiz
                            </button>
                        </div>
                        {/* ── Tab row: Note | Flashcards ──────────────────────── */}
                        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl w-fit">
                            <button
                                onClick={() => setNoteTab('note')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                                    noteTab === 'note'
                                        ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                            >
                                <FiFileText /> Note
                            </button>
                            <button
                                onClick={() => {
                                    setNoteTab('flashcard')
                                    if (!cardsLoaded && !generatingCards) handleGenerateCards()
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                                    noteTab === 'flashcard'
                                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                            >
                                <FiLayers /> Flashcards
                                {noteCards.length > 0 && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                                        {noteCards.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* ── NOTE CONTENT ───────────────────────────────────── */}
                        {noteTab === 'note' && (
                            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed font-medium text-gray-700 dark:text-gray-300 flex-1 overflow-y-auto">
                                <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                            </div>
                        )}

                        {/* ── FLASHCARD VIEW ─────────────────────────────────── */}
                        {noteTab === 'flashcard' && (
                            <div className="flex-1">
                                {generatingCards ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <FiLoader className="text-3xl text-indigo-500 animate-spin" />
                                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Generating flashcards from your note...</p>
                                    </div>
                                ) : noteCards.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                                        <FiLayers className="text-4xl text-gray-300" />
                                        <p className="font-bold text-gray-500">No flashcards yet</p>
                                        <button
                                            onClick={handleGenerateCards}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-indigo-500/20"
                                        >
                                            <FiZap /> Generate Flashcards
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-full flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400">
                                                Card {cardIndex + 1} of {noteCards.length}
                                            </span>
                                            <span className="text-xs text-indigo-500 flex items-center gap-1">
                                                <FiRotateCw /> Tap to flip
                                            </span>
                                        </div>

                                        {/* 3D flip card */}
                                        <div
                                            onClick={() => setCardFlipped(f => !f)}
                                            className="cursor-pointer w-full h-64 select-none"
                                            style={{ perspective: '1000px' }}
                                        >
                                            <div
                                                className="relative w-full h-full rounded-2xl shadow-lg"
                                                style={{
                                                    transformStyle: 'preserve-3d',
                                                    transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                                    transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)'
                                                }}
                                            >
                                                {/* FRONT */}
                                                <div
                                                    className="absolute inset-0 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-6 flex flex-col justify-between"
                                                    style={{ backfaceVisibility: 'hidden' }}
                                                >
                                                    <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full w-fit">Question</span>
                                                    <p className="text-base font-bold text-gray-900 dark:text-white text-center px-2 leading-relaxed">
                                                        {noteCards[cardIndex]?.front}
                                                    </p>
                                                    <span className="text-xs text-gray-400 text-center">Tap to reveal answer</span>
                                                </div>
                                                {/* BACK */}
                                                <div
                                                    className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between border-2 border-indigo-300"
                                                    style={{
                                                        backfaceVisibility: 'hidden',
                                                        transform: 'rotateY(180deg)',
                                                        background: '#eef2ff'
                                                    }}
                                                >
                                                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full w-fit bg-indigo-200 text-indigo-800">Answer</span>
                                                    <p className="text-base font-semibold text-center px-2 leading-relaxed" style={{ color: '#1e1b4b' }}>
                                                        {noteCards[cardIndex]?.back}
                                                    </p>
                                                    <span className="text-xs text-center" style={{ color: '#6366f1' }}>Tap to return to question</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Navigation */}
                                        <div className="flex items-center justify-between w-full">
                                            <button
                                                onClick={() => { setCardFlipped(false); setCardIndex(i => i > 0 ? i - 1 : noteCards.length - 1) }}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition"
                                            >
                                                <FiChevronLeft /> Previous
                                            </button>
                                            <button
                                                onClick={() => setCardFlipped(f => !f)}
                                                className="flex items-center gap-2 px-5 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black hover:bg-indigo-200 transition"
                                            >
                                                <FiRotateCw /> Flip
                                            </button>
                                            <button
                                                onClick={() => { setCardFlipped(false); setCardIndex(i => i < noteCards.length - 1 ? i + 1 : 0) }}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition"
                                            >
                                                Next <FiChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl opacity-50">
                        <FiExternalLink className="text-4xl text-gray-300 mb-4" />
                        <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Select a note from your collection</p>
                    </div>
                )}
            </div>
        </div>
    )
}
