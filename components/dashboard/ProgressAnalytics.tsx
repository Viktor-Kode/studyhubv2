'use client'

import { useState, useEffect } from 'react'
import {
  FiTrendingUp, FiTrendingDown, FiTarget, FiAward,
  FiClock, FiBookOpen, FiBarChart2, FiCalendar,
  FiCheckCircle, FiZap, FiLoader, FiRefreshCw,
  FiStar, FiLayers
} from 'react-icons/fi'
import {
  BiBrain, BiCard, BiTimer
} from 'react-icons/bi'
import {
  MdOutlineQuiz
} from 'react-icons/md'
import { HiOutlineAcademicCap } from 'react-icons/hi'

// Import your API services
import { getFlashCardStats } from '@/lib/api/flashcardApi'
import { apiClient } from '@/lib/api/client'

// Import auth hook
import { useAuthStore } from '@/lib/store/authStore'

type DateRange = '7d' | '30d' | '90d'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo'
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    value: 'text-green-700 dark:text-green-300',
    trend: 'text-green-600'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
    trend: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    value: 'text-orange-700 dark:text-orange-300',
    trend: 'text-orange-600'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
    trend: 'text-red-600'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    value: 'text-indigo-700 dark:text-indigo-300',
    trend: 'text-indigo-600'
  }
}

function StatCard({ title, value, subtitle, icon, trend, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`${c.icon} p-3 rounded-xl flex-shrink-0`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">{title}</p>
        <div className="flex items-end gap-2">
          <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium mb-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'
              }`}>
              {trend >= 0
                ? <FiTrendingUp className="text-xs" />
                : <FiTrendingDown className="text-xs" />
              }
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default function ProgressAnalytics() {
  const { user } = useAuthStore()
  const userId = user?.uid || ''

  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'study' | 'flashcards' | 'quiz'>('overview')

  // New Full Analytics Data state
  const [fullAnalytics, setFullAnalytics] = useState<any>(null)

  useEffect(() => {
    loadFullData()
  }, [])

  const loadFullData = async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get('/analytics/full')
      if (res.data.success) {
        setFullAnalytics(res.data.data)
      }
    } catch (error) {
      console.error('Failed to load full analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !fullAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Computing your insights...</p>
        </div>
      </div>
    )
  }

  const { studyChart, flashStats, cbtStats } = fullAnalytics;

  // Flashcard computed
  const totalCards = flashStats.reduce((sum: number, s: any) => sum + s.count, 0);
  const masteredCards = flashStats.find((s: any) => s._id === 'mastered')?.count || 0;
  const learningCards = flashStats.find((s: any) => s._id === 'learning')?.count || 0;
  const reviewingCards = flashStats.find((s: any) => s._id === 'reviewing')?.count || 0;
  const unseenCards = flashStats.find((s: any) => s._id === 'unseen')?.count || 0;

  // CBT computed
  const bestSubject = cbtStats.length > 0 ? cbtStats.sort((a: any, b: any) => b.avgScore - a.avgScore)[0] : null;
  const totalExams = cbtStats.reduce((sum: number, s: any) => sum + s.count, 0);

  return (
    <div className="space-y-6">

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            Personalised analytics for <span className="text-blue-600 font-black tracking-tight">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadFullData}
            className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 transition shadow-sm"
            title="Refresh Data"
          >
            <FiRefreshCw className="text-sm" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mastery Level"
          value={totalCards > 0 ? `${Math.round((masteredCards / totalCards) * 100)}%` : '0%'}
          subtitle={`${masteredCards} cards mastered`}
          icon={<FiCheckCircle />}
          color="green"
        />
        <StatCard
          title="Daily Study"
          value={studyChart[studyChart.length - 1]?.minutes + 'm'}
          subtitle="Time studied today"
          icon={<FiClock />}
          color="blue"
        />
        <StatCard
          title="Best Subject"
          value={bestSubject ? `${Math.round(bestSubject.avgScore)}%` : 'N/A'}
          subtitle={bestSubject?._id || 'Keep practicing'}
          icon={<FiAward />}
          color="purple"
        />
        <StatCard
          title="Learning Pool"
          value={learningCards + reviewingCards}
          subtitle="Cards in active review"
          icon={<FiZap />}
          color="orange"
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Study Consistency Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <FiBarChart2 className="text-9xl transform rotate-12" />
          </div>

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Study Consistency</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Last 7 Days</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
              <FiTrendingUp size={24} />
            </div>
          </div>

          <div className="flex items-end justify-between h-48 gap-4 px-2 relative z-10">
            {studyChart.map((d: any) => {
              const maxMinutes = 120; // 2 hour goal
              const height = Math.min((d.minutes / maxMinutes) * 100, 100);
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center group/item gap-3 h-full justify-end">
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded mb-1 absolute -top-4 pointer-events-none">
                    {d.minutes}m
                  </div>
                  <div
                    className={`w-full rounded-xl transition-all duration-700 relative ${d.minutes >= 60 ? 'bg-blue-500' : 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200'}`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    {d.minutes >= 120 && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <FiAward className="text-white text-[8px]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900 dark:text-white">{studyChart.reduce((a: number, b: any) => a + b.minutes, 0)}m</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Weekly Total</span>
              </div>
              <div className="w-[1px] h-8 bg-gray-100 dark:bg-gray-700"></div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900 dark:text-white">{Math.round(studyChart.reduce((a: number, b: any) => a + b.minutes, 0) / 7)}m</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Daily Avg</span>
              </div>
            </div>
            <div className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">
              Target: 2h/day
            </div>
          </div>
        </div>

        {/* Flashcard Mastery Status */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Memory Health</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Spaced Repetition Status</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600">
              <BiBrain size={24} />
            </div>
          </div>

          <div className="space-y-5">
            {[
              { label: 'Mastered', count: masteredCards, color: 'bg-green-500', desc: 'Securely in long-term memory' },
              { label: 'Reviewing', count: reviewingCards, color: 'bg-blue-500', desc: 'Intermediate strength' },
              { label: 'Learning', count: learningCards, color: 'bg-orange-500', desc: 'Fresh information' },
              { label: 'Unseen', count: unseenCards, color: 'bg-gray-400', desc: 'Not yet reviewed' }
            ].map((status) => {
              const perc = totalCards > 0 ? (status.count / totalCards) * 100 : 0;
              return (
                <div key={status.label} className="group/item">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{status.label}</span>
                      <p className="text-[10px] font-medium text-gray-400">{status.desc}</p>
                    </div>
                    <span className="text-xs font-black text-gray-900 dark:text-white">{status.count} <span className="text-gray-400">({Math.round(perc)}%)</span></span>
                  </div>
                  <div className="h-3 bg-gray-50 dark:bg-gray-900 rounded-full overflow-hidden p-[2px]">
                    <div
                      className={`h-full ${status.color} rounded-full transition-all duration-1000 shadow-sm shadow-black/5`}
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Intelligence Pool</p>
              <span className="text-sm font-black text-purple-600">{totalCards} Cards</span>
            </div>
          </div>
        </div>

      </div>

      {/* CBT Performance Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Subject Performance</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Computer Based Testing Data</p>
          </div>
          <Link href="/dashboard/cbt">
            <button className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition">Practice Now</button>
          </Link>
        </div>

        {cbtStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cbtStats.map((sub: any) => (
              <div key={sub._id} className="p-6 rounded-[2rem] bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <FiTarget className={sub.avgScore >= 70 ? 'text-green-500' : 'text-blue-500'} />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{Math.round(sub.avgScore)}%</span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Average Score</p>
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white mb-4 line-clamp-1">{sub._id}</h3>
                <div className="h-1.5 bg-white dark:bg-gray-800 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all duration-1000 ${sub.avgScore >= 70 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${sub.avgScore}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <span>Attempts: {sub.count}</span>
                  <span className={sub.avgScore >= 70 ? 'text-green-500' : 'text-blue-500'}>
                    {sub.avgScore >= 70 ? 'Proficient' : 'Learning'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <MdOutlineQuiz className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest">No CBT data recorded yet.</p>
          </div>
        )}
      </div>

    </div>
  )
}

import Link from 'next/link'
