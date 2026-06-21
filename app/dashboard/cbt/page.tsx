'use client'

import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { FiHome, FiArrowLeft, FiHardDrive, FiSettings, FiActivity } from 'react-icons/fi'

export default function CBTPage() {
  const router = useRouter()

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md text-center z-10 space-y-8">
          {/* Header Action */}
          <div className="flex justify-start">
            <BackButton />
          </div>

          {/* Animated Construction Scene */}
          <div className="relative h-48 flex items-center justify-center">
            {/* Gear 1 (Large, slowly rotating clockwise) */}
            <div className="absolute animate-[spin_12s_linear_infinite] text-purple-500/20 dark:text-purple-500/30">
              <svg className="w-32 h-32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            {/* Gear 2 (Small, rotating counter-clockwise, offset position) */}
            <div className="absolute top-8 left-[60%] animate-[spin_8s_linear_infinite] [animation-direction:reverse] text-blue-500/30 dark:text-blue-500/40">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            {/* Glowing warning emblem in the center */}
            <div className="absolute w-20 h-20 bg-gradient-to-tr from-yellow-500 to-amber-500 rounded-3xl flex items-center justify-center shadow-xl shadow-yellow-500/20 animate-pulse border border-yellow-400">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          {/* Under Construction Copy */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              CBT Mode Under Construction
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              We are working behind the scenes to bring you a premium, state-of-the-art computer-based testing experience.
            </p>
          </div>

          {/* Simulated loading bar progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>UPGRADING ENGINES</span>
              <span className="animate-[pulse_1.5s_infinite]">78% COMPLETED</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden border border-slate-300/10">
              <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-[shimmer_2s_infinite_linear] bg-[length:40px_100%] bg-[image:linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0)_100%)]" style={{ width: '78%' }} />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              <FiHome className="text-lg" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Shimmer and Animation CSS */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -40px 0; }
          100% { background-position: 120px 0; }
        }
      `}</style>
    </ProtectedRoute>
  )
}
