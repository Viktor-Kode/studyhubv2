'use client'

import { useState, useEffect } from 'react'
import {
    FaHistory, FaSearch, FaSpinner, FaChevronDown,
    FaChevronUp, FaFileAlt, FaCheckCircle, FaTrash,
    FaFilePdf, FaFileWord, FaQuestionCircle, FaBolt
} from 'react-icons/fa'
import { getAllQuizSessions, deleteQuizSession, QuizSession } from '@/lib/api/quizApi'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function QuestionHistory() {
    const [sessions, setSessions] = useState<QuizSession[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedSession, setExpandedSession] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        setLoading(true)
        try {
            const response = await getAllQuizSessions()
            setSessions(response.data)
        } catch (error) {
            console.error('Failed to fetch sessions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (sessionId: string) => {
        if (!confirm('Are you sure you want to delete this entire quiz session and all its questions? This cannot be undone.')) {
            return;
        }

        setDeletingId(sessionId)
        try {
            await deleteQuizSession(sessionId)
            setSessions(sessions.filter(s => s._id !== sessionId))
        } catch (error) {
            alert('Failed to delete session')
            console.error(error)
        } finally {
            setDeletingId(null)
        }
    }

    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.questionType.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'multiple-choice': return <FaQuestionCircle className="text-emerald-500" />
            case 'theory': return <FaFileAlt className="text-blue-500" />
            case 'fill-in-the-blank': return <FaBolt className="text-amber-500" />
            default: return <FaBolt className="text-purple-500" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search by title or type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm transition focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                </div>

                <Link
                    href="/dashboard/question-bank"
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 text-center"
                >
                    + Create New Quiz
                </Link>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-20 text-gray-400">
                    <FaSpinner className="animate-spin text-4xl mb-4 text-emerald-500" />
                    <p className="font-medium">Loading your quiz history...</p>
                </div>
            ) : filteredSessions.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FaHistory className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium font-bold">
                        {searchQuery ? 'No sessions match your search.' : 'No sessions found. Start generating quizzes to build your library!'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredSessions.map((session) => (
                        <div
                            key={session._id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all shadow-sm group"
                        >
                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        {getTypeIcon(session.questionType)}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                                            {session.title}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                                {session.questionType.replace(/-/g, ' ')}
                                            </span>
                                            <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium italic">
                                                {session.questionCount} Questions • {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpandedSession(expandedSession === session._id ? null : session._id)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {expandedSession === session._id ? 'HIDE QUESTIONS' : 'VIEW QUESTIONS'}
                                        {expandedSession === session._id ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                    <button
                                        disabled={deletingId === session._id}
                                        onClick={() => handleDelete(session._id)}
                                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all"
                                        title="Delete Quiz"
                                    >
                                        {deletingId === session._id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                    </button>
                                </div>
                            </div>

                            {expandedSession === session._id && (
                                <div className="px-6 pb-6 bg-gray-50/30 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid gap-4 mt-6">
                                        {session.questions.map((q, idx) => (
                                            <div key={q._id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex gap-2">
                                                    <span className="text-emerald-500">Q{idx + 1}.</span> {q.content}
                                                </p>

                                                {q.options && q.options.length > 0 && (
                                                    <div className="space-y-2 ml-7 mb-4">
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${Number(q.answer) === i ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold' : 'border-gray-50 dark:border-gray-700 text-gray-500'}`}>
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${Number(q.answer) === i ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                                    {String.fromCharCode(65 + i)}
                                                                </span>
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FaCheckCircle className="text-emerald-500 text-[10px]" />
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correct Answer</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {q.options && q.options.length > 0 ? q.options[Number(q.answer)] : q.answer}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 italic bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                                        <strong>Explanation:</strong> {q.explanation}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
