'use client'

import { useState, useEffect } from 'react'
import {
    FiClock, FiSearch, FiLoader, FiChevronDown,
    FiChevronUp, FiFileText, FiCheckCircle, FiTrash2,
    FiHelpCircle, FiZap, FiBook, FiXCircle
} from 'react-icons/fi'
import { getAllQuizSessions, deleteQuizSession, QuizSession } from '@/lib/api/quizApi'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function QuestionHistory() {
    const [sessions, setSessions] = useState<QuizSession[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedSession, setExpandedSession] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [showOnlyIncorrect, setShowOnlyIncorrect] = useState<Record<string, boolean>>({})

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
            toast.error('Failed to delete session')
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
            case 'multiple-choice': return <FiHelpCircle className="text-emerald-500" />
            case 'theory': return <FiFileText className="text-blue-500" />
            case 'fill-in-the-blank': return <FiZap className="text-amber-500" />
            default: return <FiZap className="text-purple-500" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
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
                    <FiLoader className="animate-spin text-4xl mb-4 text-emerald-500" />
                    <p className="font-medium">Loading your quiz history...</p>
                </div>
            ) : filteredSessions.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FiClock className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium font-bold">
                        {searchQuery ? 'No sessions match your search.' : 'No sessions found. Start generating quizzes to build your collection!'}
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
                                        {expandedSession === session._id ? <FiChevronUp /> : <FiChevronDown />}
                                    </button>
                                    <button
                                        disabled={deletingId === session._id}
                                        onClick={() => handleDelete(session._id)}
                                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all"
                                        title="Delete Quiz"
                                    >
                                        {deletingId === session._id ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                                    </button>
                                </div>
                            </div>

                            {expandedSession === session._id && (
                                <div className="px-6 pb-6 bg-gray-50/30 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        {session.lastResult && (
                                            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-emerald-500/30 shadow-sm flex-1 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">LATEST PERFORMANCE</p>
                                                        <p className="text-xl font-black text-gray-900 dark:text-white">
                                                            {session.lastResult.correctAnswers} / {session.lastResult.totalQuestions} <span className="text-emerald-500 text-sm ml-1">({session.lastResult.accuracy}%)</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                                        <FiCheckCircle className="text-emerald-500" />
                                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">COMPLETED</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setShowOnlyIncorrect(prev => ({ ...prev, [session._id]: !prev[session._id] }))}
                                                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${showOnlyIncorrect[session._id]
                                                            ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-red-500/50'
                                                        }`}
                                                >
                                                    <FiXCircle />
                                                    {showOnlyIncorrect[session._id] ? 'SHOWING INCORRECT ONLY' : 'FILTER INCORRECT'}
                                                </button>
                                            </div>
                                        )}

                                    <div className="grid gap-4 mt-6">
                                        {session.questions
                                            .filter(q => {
                                                if (!showOnlyIncorrect[session._id]) return true;
                                                const result = session.lastResult?.answers.find(a => String(a.questionId) === String(q._id));
                                                return result && !result.isCorrect;
                                            })
                                            .map((q, idx) => {
                                                const userResult = session.lastResult?.answers.find(a => String(a.questionId) === String(q._id));
                                                // If we have an explicit isCorrect from the result, use it.
                                                // Otherwise, we might not have a result for this specific question.
                                                const isIncorrect = userResult ? userResult.isCorrect === false : false;

                                                return (
                                                    <div key={q._id} className={`p-5 rounded-xl border shadow-sm transition-all ${isIncorrect
                                                            ? 'bg-red-50/30 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 ring-1 ring-red-500/10'
                                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                                        }`}>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex gap-2">
                                                            <span className={isIncorrect ? "text-red-500" : "text-emerald-500"}>Q{idx + 1}.</span> {q.content || (q as any).question}
                                                        </p>

                                                    {q.options && q.options.length > 0 && (
                                                        <div className="space-y-2 ml-7 mb-4">
                                                            {q.options.map((opt, i) => {
                                                                const norm = (s: any) => String(s || '').toLowerCase().trim();
                                                                const optNorm = norm(opt);
                                                                
                                                                // 1. Identify if this specific option is the correct one
                                                                const isCorrectOption = userResult?.correctAnswer 
                                                                    ? norm(userResult.correctAnswer) === optNorm
                                                                    : (Number(q.answer) === i || norm(q.answer) === optNorm);

                                                                // 2. Identify if this is the option the user selected
                                                                const isUserChoice = userResult?.selectedAnswer 
                                                                    ? (norm(userResult.selectedAnswer) === optNorm || userResult.selectedAnswer === String(i))
                                                                    : false;

                                                                const isWrongChoice = isUserChoice && !isCorrectOption;

                                                                return (
                                                                    <div key={i} className={`text-xs p-2.5 rounded-xl border flex items-center gap-2 transition-all ${isCorrectOption ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold' : isWrongChoice ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'border-gray-50 dark:border-gray-700 text-gray-500'}`}>
                                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isCorrectOption ? 'bg-emerald-500 text-white' : isWrongChoice ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                                            {String.fromCharCode(65 + i)}
                                                                        </span>
                                                                        {opt}
                                                                        {isWrongChoice && (
                                                                            <span className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase text-red-500 tracking-wider">
                                                                                <FiXCircle /> YOUR ANSWER
                                                                            </span>
                                                                        )}
                                                                        {isCorrectOption && userResult && isUserChoice && (
                                                                            <span className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 tracking-wider">
                                                                                <FiCheckCircle /> CORRECT
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FiCheckCircle className="text-emerald-500 text-[10px]" />
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correct Answer</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {q.options && q.options.length > 0 ? q.options[Number(q.answer || (q as any).correctAnswer)] : (q.answer || (q as any).correctAnswer)}
                                                    </p>
                                                    <div className="mt-2 p-4 bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl">
                                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1"><FiBook /> Knowledge Deep-Dive</p>
                                                        <p className="text-sm text-blue-900 dark:text-blue-100 italic leading-relaxed">
                                                            {q.knowledgeDeepDive || (q as any).explanation || (q as any).modelAnswer || "No deep-dive available."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
