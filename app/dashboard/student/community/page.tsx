'use client'

import { useCallback, useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { useAuthStore } from '@/lib/store/authStore'
import { progressApi } from '@/lib/api/progressApi'
import { useProgress } from '@/hooks/useProgress'
import LeaderboardPanel, { type BoardRow } from '@/components/community/LeaderboardPanel'
import BadgesPanel from '@/components/community/BadgesPanel'
import SharePanel from '@/components/community/SharePanel'
import { Trophy } from 'lucide-react'

export default function CommunityPage() {
  const { user } = useAuthStore()
  const { progress, loading: progLoading } = useProgress()
  const [tab, setTab] = useState<'leaderboard' | 'badges' | 'share'>('leaderboard')
  const [filter, setFilter] = useState<'all' | 'exam' | 'subject'>('all')
  const [examSubject, setExamSubject] = useState<string>('JAMB')
  const [subjectPick, setSubjectPick] = useState<string>('Mathematics')
  const [leaderboard, setLeaderboard] = useState<BoardRow[]>([])
  const [myRank, setMyRank] = useState(0)
  const [myWeeklyXP, setMyWeeklyXP] = useState(0)
  const [lbLoading, setLbLoading] = useState(true)

  const loadBoard = useCallback(async () => {
    setLbLoading(true)
    try {
      const params: { filter?: string; subject?: string } = {}
      if (filter === 'exam') {
        params.filter = 'exam'
        params.subject = examSubject
      } else if (filter === 'subject') {
        params.filter = 'subject'
        params.subject = subjectPick
      }
      const res = await progressApi.getLeaderboard(params)
      const d = res.data as { leaderboard: BoardRow[]; myRank: number; myWeeklyXP: number }
      setLeaderboard(d.leaderboard || [])
      setMyRank(d.myRank || 0)
      setMyWeeklyXP(d.myWeeklyXP ?? 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLbLoading(false)
    }
  }, [filter, examSubject, subjectPick])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  useEffect(() => {
    const t = setInterval(() => void loadBoard(), 60000)
    return () => clearInterval(t)
  }, [loadBoard])

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 py-6 px-4 pb-28 max-w-4xl mx-auto">
        <BackButton label="Back to dashboard" href="/dashboard/student" />

        <div className="flex items-center gap-3 mt-2 mb-6">
          <div className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-[#5B4CF5] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Community
            </h1>
            <p className="text-sm text-[#64748B] dark:text-slate-400">
              Leaderboard, badges & share cards
            </p>
          </div>
        </div>

        <div className="gw-seg mb-6" role="tablist" aria-label="Community section">
          {(
            [
              ['leaderboard', 'Leaderboard'],
              ['badges', 'My Badges'],
              ['share', 'Share'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-active={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'leaderboard' && (
          <LeaderboardPanel
            filter={filter}
            setFilter={setFilter}
            examSubject={examSubject}
            setExamSubject={setExamSubject}
            subjectPick={subjectPick}
            setSubjectPick={setSubjectPick}
            leaderboard={leaderboard}
            lbLoading={lbLoading}
            myRank={myRank}
            myWeeklyXP={myWeeklyXP}
            progress={progress}
            progLoading={progLoading}
            user={user}
          />
        )}

        {tab === 'badges' && progress && <BadgesPanel progress={progress} />}

        {tab === 'badges' && progLoading && (
          <div className="h-64 rounded-[20px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
        )}

        {tab === 'badges' && !progress && !progLoading && (
          <p className="text-center text-slate-500 text-sm py-12">
            Progress could not be loaded. Refresh the page and try again.
          </p>
        )}

        {tab === 'share' && progress && (
          <SharePanel progress={progress} progLoading={progLoading} user={user} myRank={myRank} />
        )}

        {tab === 'share' && !progress && progLoading && (
          <div className="h-64 rounded-[20px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
        )}

        {tab === 'share' && !progress && !progLoading && (
          <p className="text-center text-slate-500 text-sm py-12">
            Progress could not be loaded. Refresh the page and try again.
          </p>
        )}
      </div>
    </ProtectedRoute>
  )
}
