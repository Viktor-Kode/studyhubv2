'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  FiTrash2, FiClock, FiFileText, FiLoader, FiExternalLink,
  FiEdit2, FiSave, FiX, FiChevronLeft, FiChevronRight, FiLayers, FiRotateCw, FiZap
} from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'
import FormattedMarkdown from '@/components/FormattedMarkdown'
import { fetchStudyNotes, deleteStudyNote, updateStudyNote, StudyNote } from '@/lib/api/quizApi'
import { generateAIFlashCards, FlashCard } from '@/lib/api/flashcardApi'
import { toast } from 'react-hot-toast'
import BlindSummaryModal from '@/components/dashboard/BlindSummaryModal'

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
    const [blindSummaryOpen, setBlindSummaryOpen] = useState(false)
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
        <div className="w-full">
            {selectedNote ? (
                /* Focused Reading View (centered max-w-6xl, full width usage, no card border radius box) */
                <div className="max-w-6xl mx-auto w-full bg-transparent p-0 sm:py-2 animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col min-h-[650px]">
                    {/* Top Row: Navigation + Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <button 
                            onClick={() => { setSelectedNote(null); router.push('/dashboard/notes-history') }}
                            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold w-fit hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3.5 py-2 rounded-xl transition"
                        >
                            <FiChevronLeft /> Back to All Notes
                        </button>
                        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                            <button
                                onClick={() => setBlindSummaryOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#5b4cf5] hover:bg-[#4b3ce5] text-white rounded-xl font-extrabold text-xs transition shadow-md"
                            >
                                <span>🙈 Blind Summary</span>
                                <span className="px-2 py-0.5 text-[10px] bg-yellow-400 text-gray-950 font-black rounded-full">+25 XP</span>
                            </button>
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
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#5b4cf5] hover:bg-[#4b3ce5] text-white rounded-xl font-black uppercase tracking-widest text-xs transition shadow-lg shadow-purple-500/20"
                            >
                                <BiBrain className="text-lg text-white" />
                                Practice with Quiz
                            </button>
                        </div>
                    </div>

                    {/* Dedicated Full-Width Title & Metadata Area */}
                    <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700/80">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="text-2xl sm:text-3xl font-black bg-gray-50 dark:bg-gray-900 border-2 border-emerald-500 rounded-xl px-4 py-2 w-full focus:outline-none text-gray-900 dark:text-white"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateTitle()
                                        if (e.key === 'Escape') setIsEditingTitle(false)
                                    }}
                                />
                                <button
                                    onClick={handleUpdateTitle}
                                    disabled={isUpdating}
                                    className="p-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
                                    title="Save"
                                >
                                    {isUpdating ? <FiLoader className="animate-spin" /> : <FiSave />}
                                </button>
                                <button
                                    onClick={() => setIsEditingTitle(false)}
                                    className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                    title="Cancel"
                                >
                                    <FiX />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight break-words flex-1">
                                    {selectedNote.title}
                                </h2>
                                <button
                                    onClick={() => {
                                        setEditingTitle(selectedNote.title)
                                        setIsEditingTitle(true)
                                    }}
                                    className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition shrink-0 mt-1"
                                    title="Edit Name"
                                >
                                    <FiEdit2 size={20} />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 mt-3">
                            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md">Saved Note</span>
                            <span>{toLocaleLongDateString(selectedNote.createdAt)}</span>
                        </div>
                    </div>

                    {/* ── Tab row: Note | Flashcards ──────────────────────── */}
                    <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl w-fit">
                        <button
                            onClick={() => setNoteTab('note')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                                noteTab === 'note'
                                    ? 'bg-[#5b4cf5] text-white shadow-md dark:bg-emerald-600 dark:text-white'
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
                                    ? 'bg-[#5b4cf5] text-white shadow-md dark:bg-indigo-600 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <FiLayers /> Flashcards
                            {noteCards.length > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                    noteTab === 'flashcard' ? 'bg-white/30 text-white' : 'bg-[#5b4cf5] text-white dark:bg-indigo-900/40 dark:text-indigo-300'
                                }`}>
                                    {noteCards.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* ── NOTE CONTENT ───────────────────────────────────── */}
                    {noteTab === 'note' && (
                        <div className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed font-medium text-gray-700 dark:text-gray-300 flex-1 overflow-y-auto pr-2">
                            <FormattedMarkdown content={selectedNote.content} />
                        </div>
                    )}

                    {/* ── FLASHCARD VIEW ─────────────────────────────────── */}
                    {noteTab === 'flashcard' && (
                        <div className="flex-1 flex flex-col justify-center">
                            {generatingCards ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <FiLoader className="text-3xl text-[#5b4cf5] animate-spin" />
                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Generating flashcards from your note...</p>
                                </div>
                            ) : noteCards.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                                    <FiLayers className="text-4xl text-gray-300" />
                                    <p className="font-bold text-gray-500">No flashcards yet</p>
                                    <button
                                        onClick={handleGenerateCards}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-[#5b4cf5] hover:bg-[#4b3ce5] text-white rounded-xl text-sm font-bold transition shadow-md"
                                    >
                                        <FiZap /> Generate Flashcards
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto w-full">
                                    <div className="w-full flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400">
                                            Card {cardIndex + 1} of {noteCards.length}
                                        </span>
                                        <span className="text-xs text-[#5b4cf5] dark:text-indigo-400 flex items-center gap-1 font-semibold">
                                            <FiRotateCw /> Tap to flip
                                        </span>
                                    </div>

                                    {/* 3D flip card */}
                                    <div
                                        onClick={() => setCardFlipped(f => !f)}
                                        className="cursor-pointer w-full h-80 select-none"
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
                                                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl flex flex-col"
                                                style={{ backfaceVisibility: 'hidden' }}
                                            >
                                                <div className="flex-shrink-0 px-6 pt-5">
                                                    <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full inline-block">Question</span>
                                                </div>
                                                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3 flex items-center justify-center">
                                                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center leading-relaxed">
                                                        {noteCards[cardIndex]?.front}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 text-center pb-4">
                                                    <span className="text-xs text-gray-400">Tap to reveal answer</span>
                                                </div>
                                            </div>
                                            {/* BACK */}
                                            <div
                                                className="absolute inset-0 rounded-2xl flex flex-col"
                                                style={{
                                                    backfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)',
                                                    background: '#eef2ff'
                                                }}
                                            >
                                                <div className="flex-shrink-0 px-6 pt-5">
                                                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full inline-block bg-[#5b4cf5] text-white">Answer</span>
                                                </div>
                                                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3 flex items-center justify-center">
                                                    <p className="text-lg sm:text-xl font-semibold text-center leading-relaxed text-slate-900">
                                                        {noteCards[cardIndex]?.back}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 text-center pb-4">
                                                    <span className="text-xs font-bold text-[#5b4cf5]">Tap to return to question</span>
                                                </div>
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
                                            className="flex items-center gap-2 px-5 py-2 bg-[#5b4cf5] hover:bg-[#4b3ce5] text-white rounded-xl text-xs font-black transition"
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
                /* Browse All Notes Grid View */
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map((note) => (
                            <div
                                key={note._id}
                                onClick={() => router.push(`/dashboard/notes-history?id=${note._id}`)}
                                className="group p-6 rounded-2xl bg-white dark:bg-gray-800 hover:shadow-xl transition-all cursor-pointer relative flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-extrabold text-lg text-gray-900 dark:text-white group-hover:text-[#5b4cf5] transition truncate pr-10">{note.title}</h4>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(note._id) }}
                                            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                            disabled={deleting === note._id}
                                            title="Delete Note"
                                        >
                                            {deleting === note._id ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed">
                                        {note.content.substring(0, 140)}...
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100 dark:border-gray-700/80 text-[11px] font-black uppercase tracking-wider text-gray-400">
                                    <span className="flex items-center gap-1.5"><FiClock className="text-[#5b4cf5]" /> {new Date(note.createdAt).toLocaleDateString()}</span>
                                    {note.sourceFileName && <span className="flex items-center gap-1 truncate max-w-[120px]"><FiFileText /> {note.sourceFileName}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <BlindSummaryModal
                isOpen={blindSummaryOpen}
                onClose={() => setBlindSummaryOpen(false)}
                onSkip={() => setBlindSummaryOpen(false)}
                title={selectedNote?.title || 'Saved Note'}
                originalSummaryText={selectedNote?.content || ''}
            />
        </div>
    )
}
