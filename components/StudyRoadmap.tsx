'use client'

import React from 'react'
import { StudyPathResponse, StudyPathNode } from '@/types/studyPath'
import { Loader2, RotateCw, Lock, Check, Play, Sparkles } from 'lucide-react'

interface StudyRoadmapProps {
  studyPath: StudyPathResponse
  isAuthenticated: boolean
  onOpenNode: (node: StudyPathNode) => void
  onRetryNode?: (nodeId: number) => void
  loadingNodeId?: number | null
}

export const StudyRoadmap: React.FC<StudyRoadmapProps> = ({
  studyPath,
  isAuthenticated,
  onOpenNode,
  onRetryNode,
  loadingNodeId,
}) => {
  // Group variable N nodes by their unit module
  const unitsMap = (studyPath.nodes || []).reduce<Record<string, StudyPathNode[]>>((acc, node) => {
    const unitName = node.unit || 'Core Topics'
    if (!acc[unitName]) acc[unitName] = []
    acc[unitName].push(node)
    return acc
  }, {})

  return (
    <div className="study-roadmap-container py-8 max-w-3xl mx-auto px-4">
      <header className="mb-8">
        {studyPath.courseCode && (
          <p className="text-xs uppercase font-semibold text-blue-600 dark:text-blue-400 tracking-wider mb-1">
            {studyPath.courseCode}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {studyPath.title}
        </h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{studyPath.nodes?.length || 0} Lessons</span>
          <span>•</span>
          <span>
            {studyPath.nodes?.filter((n) => n.status === 'completed').length || 0} of{' '}
            {studyPath.nodes?.length || 0} completed
          </span>
        </div>
      </header>

      {Object.entries(unitsMap).map(([unitTitle, nodes], unitIndex) => (
        <section key={unitTitle} className="mb-10">
          <div className="unit-header flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-md">
              Module {unitIndex + 1}
            </span>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{unitTitle}</h2>
          </div>

          <div className="nodes-stack space-y-3">
            {nodes.map((node) => {
              // Crucial: Progression sequence 'active' does NOT equal authorization for guests!
              // Guests must not enter Node 2+ even if status is 'active' or 'completed'.
              const isLockedInSequence = node.status === 'locked'
              const isGatedGuestNode = !isAuthenticated && node.id >= 2
              const isLoadingThis = loadingNodeId === node.id

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    // Prevent clicking sequence-locked nodes
                    if (isLockedInSequence) return
                    // Pass click to onOpenNode: backend authoritatively returns 403 requireSignup for guests
                    onOpenNode(node)
                  }}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between select-none ${
                    isLockedInSequence
                      ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 opacity-60 cursor-not-allowed'
                      : isGatedGuestNode
                      ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer shadow-sm'
                      : node.status === 'completed'
                      ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer'
                      : 'border-blue-500/70 dark:border-blue-500/60 bg-white dark:bg-gray-800/80 shadow-md hover:border-blue-600 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                        node.status === 'completed' && !isGatedGuestNode
                          ? 'bg-emerald-500 text-white'
                          : isGatedGuestNode
                          ? 'bg-amber-500 text-white'
                          : node.status === 'active'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {isLoadingThis ? (
                        <Loader2 size={16} className="animate-spin text-white" />
                      ) : node.status === 'completed' && !isGatedGuestNode ? (
                        <Check size={18} strokeWidth={2.5} />
                      ) : isGatedGuestNode ? (
                        <Lock size={15} />
                      ) : node.status === 'active' ? (
                        <Play size={15} fill="currentColor" />
                      ) : (
                        node.id
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {node.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {node.duration || '5 min'} · +{node.xp || 25} XP
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {/* Content Status Indicators */}
                    {node.contentStatus === 'generating' && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-medium">
                        <Loader2 size={13} className="animate-spin" /> Generating...
                      </span>
                    )}

                    {node.contentStatus === 'failed' && onRetryNode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRetryNode(node.id)
                        }}
                        className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-900 flex items-center gap-1 font-medium"
                      >
                        <RotateCw size={12} /> Retry Lesson
                      </button>
                    )}

                    {/* Progression & Access Badges */}
                    <div className="status-badge text-xs font-semibold">
                      {isGatedGuestNode ? (
                        <span className="text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Lock size={12} /> Sign Up to Unlock
                        </span>
                      ) : node.status === 'completed' ? (
                        <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-md">
                          Completed
                        </span>
                      ) : node.status === 'active' ? (
                        <span className="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Play size={11} fill="currentColor" /> Start Lesson
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Lock size={11} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export default StudyRoadmap

