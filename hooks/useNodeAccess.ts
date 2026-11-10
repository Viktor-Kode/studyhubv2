'use client'

import { useState, useCallback } from 'react'
import { StudyPathNode } from '@/types/studyPath'
import { getFirebaseToken } from '@/lib/store/authStore'

export function useNodeAccess() {
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [loadingNodeId, setLoadingNodeId] = useState<number | null>(null)
  const [pendingGate, setPendingGate] = useState<{ topicId: string; nodeId: number } | null>(null)

  const getHeaders = async (): Promise<HeadersInit> => {
    let token = typeof window !== 'undefined' ? localStorage.getItem('studyhelp_auth_token') : null
    if (!token) {
      try {
        token = await getFirebaseToken()
      } catch {
        // Guest
      }
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const anonId = typeof window !== 'undefined' ? localStorage.getItem('studyhelp_anon_session_id') : null
    if (anonId) headers['x-anonymous-session-id'] = anonId
    return headers
  }

  const openNode = useCallback(async (topicId: string, nodeId: number): Promise<StudyPathNode | null> => {
    setLoadingNodeId(nodeId)
    try {
      const headers = await getHeaders()
      const res = await fetch(`/api/study-paths/${encodeURIComponent(topicId)}/nodes/${nodeId}/prepare`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bufferNext: true }),
      })

      const data = await res.json().catch(() => ({}))

      // Backend is authoritative security boundary for anonymous access interception
      if (res.status === 403 && data.requireSignup) {
        setPendingGate({ topicId, nodeId })
        setSignupModalOpen(true)
        return null
      }

      if (!res.ok) {
        throw new Error(data.message || `Failed to prepare Node ${nodeId}`)
      }

      return data.node
    } catch (err: any) {
      console.error('[useNodeAccess] Error:', err)
      throw err
    } finally {
      setLoadingNodeId(null)
    }
  }, [])

  const retryNode = useCallback(async (topicId: string, nodeId: number): Promise<StudyPathNode | null> => {
    try {
      const headers = await getHeaders()
      const res = await fetch(`/api/study-paths/${encodeURIComponent(topicId)}/nodes/${nodeId}/retry`, {
        method: 'POST',
        headers,
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 403 && data.requireSignup) {
        setPendingGate({ topicId, nodeId })
        setSignupModalOpen(true)
        return null
      }

      if (!res.ok) {
        throw new Error(data.message || `Failed to retry Node ${nodeId}`)
      }
      return data.node
    } catch (err: any) {
      console.error('[useNodeAccess] Retry Error:', err)
      throw err
    }
  }, [])

  return {
    openNode,
    retryNode,
    signupModalOpen,
    setSignupModalOpen,
    loadingNodeId,
    pendingGate,
    setPendingGate,
  }
}

