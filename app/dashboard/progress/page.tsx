'use client'

import { useState, useEffect, useMemo } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getFirebaseToken } from '@/lib/store/authStore'
import { FiTrendingUp, FiCheckCircle, FiClock, FiBook, FiBarChart2, FiAward, FiAlertCircle, FiLoader } from 'react-icons/fi'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format } from 'date-fns'

export default function ProgressPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = await getFirebaseToken()
                const headers: Record<string, string> = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                const response = await fetch('/api/stats', { headers })
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

    const hasData = stats?.recentSessions?.length > 0 || stats?.questionCount > 0

    // Chart logic
    const trendColor = useMemo(() => {
        if (!stats?.trendData || stats.trendData.length < 2) return '#3b82f6' // Default neutral blue
        const first = stats.trendData[0].score
        const last = stats.trendData[stats.trendData.length - 1].score
        return last >= first ? '#22c55e' : '#3b82f6' // Green if improving, blue (neutral) if declining
    }, [stats?.trendData])

    const formattedTrendData = useMemo(() => {
        return (stats?.trendData || []).map((d: any) => ({
            ...d,
            formattedDate: format(new Date(d.date), 'MMM dd')
        }))
    }, [stats?.trendData])

    const subjectPerformanceData = useMemo(() => {
        if (!stats?.subjectAverages) return []
        return Object.entries(stats.subjectAverages)
            .map(([subject, score]) => ({ subject, score: Math.round(Number(score)) }))
            .sort((a, b) => b.score - a.score)
    }, [stats?.subjectAverages])

    const strongestSubjects = subjectPerformanceData.slice(0, 3)
    const weakestSubjects = [...subjectPerformanceData].reverse().slice(0, 3).filter(s => s.score < 80) // Need improvement

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <FiLoader className="animate-spin text-4xl text-blue-500" />
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
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

                {!hasData ? (
                    <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiTrendingUp className="text-4xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No progress data yet</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            Complete your first practice session to see your progress, track your strengths, and visualize your growth over time.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* 1. Header Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Questions Answered"
                                value={stats?.questionCount || 0}
                                icon={<FiBook />}
                                color="bg-blue-500"
                            />
                            <StatCard
                                title="Overall Accuracy"
                                value={`${Math.round(stats?.overallAccuracy || 0)}%`}
                                icon={<FiCheckCircle />}
                                color="bg-emerald-500"
                            />
                            <StatCard
                                title="Study Streak"
                                value={`${stats?.studyStreak || 0} days`}
                                icon={<FiTrendingUp />}
                                color="bg-orange-500"
                            />
                            <StatCard
                                title="Study Sessions"
                                value={stats?.totalSessions || 0}
                                icon={<FiClock />}
                                color="bg-purple-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* 2. Score Trend Chart */}
                            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Score Over Time</h3>
                                {formattedTrendData.length > 0 ? (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={formattedTrendData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                                                <XAxis dataKey="formattedDate" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke={trendColor}
                                                    strokeWidth={3}
                                                    dot={{ fill: trendColor, strokeWidth: 2, r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyChartMessage message="Not enough data to show a trend yet." />
                                )}
                            </div>

                            {/* 3. Subject Performance */}
                            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance by Subject</h3>
                                {subjectPerformanceData.length > 0 ? (
                                    <div style={{ height: Math.max(200, subjectPerformanceData.length * 48) }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={subjectPerformanceData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.3} />
                                                <XAxis type="number" domain={[0, 100]} hide />
                                                <YAxis
                                                    type="category"
                                                    dataKey="subject"
                                                    stroke="#9ca3af"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    width={130}
                                                    tickFormatter={(v: string) => v.length > 18 ? v.substring(0, 16) + '…' : v}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem' }}
                                                    formatter={(value: number) => [`${value}%`, 'Score']}
                                                    labelFormatter={(label: string) => label}
                                                />
                                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={22}>
                                                    {subjectPerformanceData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill="#3b82f6" />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyChartMessage message="No subject performance data available." />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* 4. Strengths & Weaknesses */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Strengths & Focus Areas</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <FiAward /> Top Strengths
                                        </h4>
                                        <div className="space-y-3">
                                            {strongestSubjects.length > 0 ? (
                                                strongestSubjects.map((subject, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{subject.subject}</span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{subject.score}%</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">Keep practicing to find your strengths.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <FiAlertCircle /> Needs Practice
                                        </h4>
                                        <div className="space-y-3">
                                            {weakestSubjects.length > 0 ? (
                                                weakestSubjects.map((subject, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{subject.subject}</span>
                                                        <span className="font-bold text-yellow-600 dark:text-yellow-400">{subject.score}%</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">You're doing great! No specific areas need immediate focus.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Recent Activity Feed */}
                            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                                <div className="space-y-4">
                                    {stats?.recentSessions?.length > 0 ? (
                                        stats.recentSessions.map((session: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{session.subject}</p>
                                                    <p className="text-xs text-gray-500">{format(new Date(session.takenAt), 'MMM dd, yyyy')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900 dark:text-white">{Math.round(session.accuracy)}%</p>
                                                    <p className="text-xs text-gray-500">Score</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </ProtectedRoute>
    )
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className={`${color} text-white p-4 rounded-2xl shadow-lg shadow-${color}/20 flex-shrink-0`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mb-1">{value}</p>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h4>
            </div>
        </div>
    )
}

function EmptyChartMessage({ message }: { message: string }) {
    return (
        <div className="h-64 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mb-3">
                <FiBarChart2 className="text-gray-400 text-xl" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    )
}
