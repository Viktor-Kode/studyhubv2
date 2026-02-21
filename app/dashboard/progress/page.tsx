'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FiTrendingUp, FiClock, FiBook, FiAward, FiBarChart2, FiCalendar, FiTarget, FiLoader } from 'react-icons/fi'
import { BiTimer, BiBrain } from 'react-icons/bi'

export default function ProgressPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get token from cookie
                const match = typeof document !== 'undefined'
                    ? document.cookie.match(/(^| )auth-token=([^;]+)/)
                    : null
                const token = match ? decodeURIComponent(match[2]) : ''

                const response = await fetch('/api/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                const data = await response.json()
                if (data.stats) {
                    setStats(data.stats)
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <FiLoader className="animate-spin text-4xl text-blue-500" />
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FiBarChart2 className="text-blue-500" />
                            Progress Analytics
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Visualize your learning journey and academic growth
                        </p>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Study Streak"
                        value={`${stats?.studyStreak || 0} days`}
                        icon={<FiTrendingUp />}
                        color="bg-orange-500"
                        subtitle="Keep it up!"
                    />
                    <StatCard
                        title="Total Focus"
                        value={`${stats?.totalDuration || 0} mins`}
                        icon={<FiClock />}
                        color="bg-blue-500"
                        subtitle={`${stats?.totalSessions || 0} sessions`}
                    />
                    <StatCard
                        title="Mastery"
                        value={`${stats?.masteredCards || 0}`}
                        icon={<FiAward />}
                        color="bg-purple-500"
                        subtitle={`out of ${stats?.flashcardCount || 0} cards`}
                    />
                    <StatCard
                        title="Questions"
                        value={`${stats?.questionCount || 0}`}
                        icon={<FiBook />}
                        color="bg-emerald-500"
                        subtitle="AI questions solved"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Activity Visualization (Placeholder for now) */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <FiCalendar className="text-blue-500" />
                            Consistency Map
                        </h3>
                        <div className="h-48 bg-gray-50 dark:bg-gray-900/50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                                <p className="text-gray-400 text-sm font-medium">Activity heat map loading...</p>
                                <p className="text-xs text-gray-500 mt-1">Daily focus tracking is active</p>
                            </div>
                        </div>
                    </div>

                    {/* Skill Radar / Breakdown */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <FiTarget className="text-red-500" />
                            Performance Breakdown
                        </h3>
                        <div className="space-y-6">
                            <ProgressItem label="Active Recall" progress={75} color="bg-blue-500" />
                            <ProgressItem label="Problem Solving" progress={60} color="bg-emerald-500" />
                            <ProgressItem label="Critical Thinking" progress={45} color="bg-purple-500" />
                            <ProgressItem label="Consistency" progress={stats?.studyStreak > 3 ? 90 : 40} color="bg-orange-500" />
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}

function StatCard({ title, value, icon, color, subtitle }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <div className={`${color} text-white p-4 rounded-2xl shadow-lg shadow-${color}/20 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                </div>
            </div>
        </div>
    )
}

function ProgressItem({ label, progress, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-gray-500 font-bold">{progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`${color} h-full rounded-full transition-all duration-1000`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}
