'use client'

import { useState, useEffect, useMemo } from 'react'
import { getFirebaseToken } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import { FiTrendingUp, FiCheckCircle, FiClock, FiBook, FiBarChart2, FiAward, FiAlertCircle, FiLoader } from 'react-icons/fi'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format } from 'date-fns'

export default function ProgressAnalytics() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [fullRes, summaryRes, progressRes] = await Promise.all([
                    apiClient.get('/analytics/full').catch(() => null),
                    apiClient.get('/dashboard/summary').catch(() => null),
                    apiClient.get('/progress/me').catch(() => null)
                ]);

                if (fullRes?.data?.success) {
                    const data = fullRes.data.data;
                    const progData = progressRes?.data;
                    const summaryData = summaryRes?.data?.data;

                    const loginStreak = typeof progData?.streak === 'number' ? progData.streak : 0;
                    const actStreak = summaryData?.streak?.current ?? 0;
                    data.studyStreak = Math.max(loginStreak, actStreak);

                    // Also pull question count and sessions from summary if they're higher (since summary aggregates multiple sources)
                    if (summaryData?.cbt?.totalQuestions > (data.questionCount || 0)) {
                        data.questionCount = summaryData.cbt.totalQuestions;
                    }
                    if (summaryData?.studyTimer?.totalSessions > (data.totalSessions || 0)) {
                        data.totalSessions = summaryData.studyTimer.totalSessions;
                    }

                    // Pull total study time from summary
                    data.totalStudyTime = summaryData?.studyTimer?.totalTime || '0m';

                    setStats(data)
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
        if (!stats?.cbtStats) return []
        return stats.cbtStats
            .map((sub: any) => ({ subject: sub._id, score: Math.round(Number(sub.avgScore)) }))
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 5)
    }, [stats?.cbtStats])

    const strongestSubjects = subjectPerformanceData.slice(0, 3)
    const weakestSubjects = [...subjectPerformanceData].reverse().slice(0, 3) // Need improvement

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <FiLoader className="animate-spin text-4xl text-blue-500" />
            </div>
        )
    }

    if (!hasData) {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <FiTrendingUp className="text-3xl sm:text-4xl" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">No progress data yet</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Complete your first practice session to see your progress, track your strengths, and visualize your growth over time.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">
            {/* 1. Header Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
                <StatCard
                    title="Total Study Time"
                    value={stats?.totalStudyTime || '0m'}
                    icon={<FiClock />}
                    color="bg-pink-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
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

                {/* 3. Subject Performance (Max 5) */}
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">Performance by Subject</h3>
                        <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">Top 5</span>
                    </div>
                    {subjectPerformanceData.length > 0 ? (
                        <div className="h-56 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectPerformanceData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.3} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis
                                        type="category"
                                        dataKey="subject"
                                        stroke="#9ca3af"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        width={95}
                                        tickFormatter={(v: string) => v.length > 13 ? v.substring(0, 11) + '…' : v}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem', fontSize: '12px' }}
                                        formatter={(value: number) => [`${value}%`, 'Score']}
                                        labelFormatter={(label: string) => label}
                                    />
                                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* 4. Strengths & Weaknesses */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Strengths & Focus Areas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                                <FiAward className="text-sm sm:text-base" /> Top Strengths
                            </h4>
                            <div className="space-y-2.5">
                                {strongestSubjects.length > 0 ? (
                                    strongestSubjects.map((subject, i) => (
                                        <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-xs sm:text-sm">
                                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{subject.subject}</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-2">{subject.score}%</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs sm:text-sm text-gray-500">Keep practicing to find your strengths.</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-yellow-500 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                                <FiAlertCircle className="text-sm sm:text-base" /> Needs Practice
                            </h4>
                            <div className="space-y-2.5">
                                {weakestSubjects.length > 0 ? (
                                    weakestSubjects.map((subject, i) => (
                                        <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800/30 text-xs sm:text-sm">
                                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{subject.subject}</span>
                                            <span className="font-bold text-yellow-600 dark:text-yellow-400 ml-2">{subject.score}%</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs sm:text-sm text-gray-500">You&apos;re doing great! No specific areas need immediate focus.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Recent Activity Feed */}
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Recent Activity</h3>
                    <div className="space-y-3 sm:space-y-4">
                        {stats?.recentSessions?.length > 0 ? (
                            stats.recentSessions.map((session: any, i: number) => (
                                <div key={i} className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0 text-xs sm:text-sm">
                                    <div className="min-w-0 pr-2">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">{session.subject}</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">{format(new Date(session.takenAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-gray-900 dark:text-white">{Math.round(session.accuracy)}%</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">Score</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 sm:gap-4 min-w-0">
            <div className={`${color} text-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-md flex-shrink-0 text-base sm:text-xl`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-0.5 truncate">{value}</p>
                <h4 className="text-[11px] sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h4>
            </div>
        </div>
    )
}

function EmptyChartMessage({ message }: { message: string }) {
    return (
        <div className="h-52 sm:h-64 flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mb-2.5">
                <FiBarChart2 className="text-gray-400 text-lg sm:text-xl" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    )
}


