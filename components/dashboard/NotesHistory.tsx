'use client'

import { useState, useEffect } from 'react'
import { FiTrash2, FiClock, FiFileText, FiLoader, FiExternalLink } from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'
import { fetchStudyNotes, deleteStudyNote, StudyNote } from '@/lib/api/quizApi'

export default function NotesHistory() {
    const [notes, setNotes] = useState<StudyNote[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null)

    // Helper
    const toLocaleLongDateString = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    }

    useEffect(() => {
        loadNotes()
    }, [])

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
                if (selectedNote?._id === id) setSelectedNote(null)
            }
        } catch (err: any) {
            alert(err.message || 'Failed to delete note')
        } finally {
            setDeleting(null)
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
        <div className="grid lg:grid-cols-3 gap-8">
            {/* List Side */}
            <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {notes.map((note) => (
                    <div
                        key={note._id}
                        onClick={() => setSelectedNote(note)}
                        className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer relative
              ${selectedNote?._id === note._id
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/5'
                                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-200'}
            `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 transition truncate pr-8">{note.title}</h4>
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
            <div className="lg:col-span-2">
                {selectedNote ? (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{selectedNote.title}</h2>
                                <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-md">Saved Note</span>
                                    <span>{toLocaleLongDateString(selectedNote.createdAt)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    window.location.href = '/dashboard/question-bank?tab=quiz&text=' + encodeURIComponent(selectedNote.content)
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                            >
                                <BiBrain className="text-lg" />
                                Practice with Quiz
                            </button>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-medium text-gray-700 dark:text-gray-300 flex-1 overflow-y-auto">
                            {selectedNote.content}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl opacity-50">
                        <FiExternalLink className="text-4xl text-gray-300 mb-4" />
                        <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Select a note from the library</p>
                    </div>
                )}
            </div>
        </div>
    )
}
