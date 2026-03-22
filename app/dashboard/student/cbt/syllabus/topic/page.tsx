import { Suspense } from 'react'
import TopicStudyClient from './TopicStudyClient'

/**
 * Server Component wrapper so `useSearchParams` inside the client child is correctly
 * bounded by Suspense (avoids blank / static shell issues on navigation).
 * Auth is handled by `app/dashboard/layout.tsx` — do not nest another ProtectedRoute here.
 */
export default function TopicStudyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 bg-[#F7F8FA] dark:bg-slate-950 text-gray-600 dark:text-gray-400">
          <span className="inline-block h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm">Loading topic…</p>
        </div>
      }
    >
      <TopicStudyClient />
    </Suspense>
  )
}
