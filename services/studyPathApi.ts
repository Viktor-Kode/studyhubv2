import { JobInitResponse, JobStatusResponse, StudyPathResponse, StudyPathNode } from '@/types/studyPath'
import { getFirebaseToken } from '@/lib/store/authStore'
import { openPaywallModal } from '@/lib/upgradeHandler'

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {}
  let token = typeof window !== 'undefined' ? localStorage.getItem('studyhelp_auth_token') : null

  if (!token) {
    try {
      token = await getFirebaseToken()
    } catch {
      // Guest or unauthenticated
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const anonId = typeof window !== 'undefined' ? localStorage.getItem('studyhelp_anon_session_id') : null
  if (anonId) {
    headers['x-anonymous-session-id'] = anonId
  }

  return headers
}

export async function startStudyMapGeneration(file: File, title?: string): Promise<StudyPathResponse> {
  const formData = new FormData()
  formData.append('pdf', file)
  if (title) formData.append('title', title)

  const headers = await getAuthHeaders()

  const res = await fetch('/api/study-paths', {
    method: 'POST',
    headers,
    body: formData,
  })

  let initData: JobInitResponse
  try {
    initData = await res.json()
  } catch {
    throw new Error('Failed to parse server response.')
  }

  if (res.status === 403 && (initData as any).code === 'PAYWALL_TRIGGERED') {
    openPaywallModal('study_map')
    const err = new Error('PAYWALL_TRIGGERED')
    ;(err as any).code = 'PAYWALL_TRIGGERED'
    throw err
  }

  if (!res.ok) {
    throw new Error((initData as any).message || 'Failed to start generation')
  }

  // 1. FAST-PATH: Instant cache hit (<500ms) - render complete roadmap immediately without polling!
  if (initData.cached && initData.studyPath) {
    return initData.studyPath
  }

  // 2. Persist server-issued anonymousSessionId if returned
  if (initData.anonymousSessionId && typeof window !== 'undefined') {
    localStorage.setItem('studyhelp_anon_session_id', initData.anonymousSessionId)
  }

  // 3. ASYNC-PATH: Poll background job until skeleton ready (~15-20s)
  return await pollJobUntilReady(initData.jobId)
}

export async function pollJobUntilReady(
  jobId: string,
  onProgress?: (job: JobStatusResponse) => void
): Promise<StudyPathResponse> {
  const headers = await getAuthHeaders()
  const startTime = Date.now()
  const TIMEOUT_MS = 120000 // 2 minutes client timeout

  while (Date.now() - startTime < TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, 1500))

    let res: Response
    try {
      res = await fetch(`/api/generate-path/jobs/${encodeURIComponent(jobId)}`, { headers })
    } catch {
      // Transient network jitter, continue polling
      continue
    }

    // Handle expired job ID (TTL 1 hour) without blind duplicate generation
    if (res.status === 404) {
      try {
        const activeRes = await fetch('/api/study-paths/active', { headers })
        const activeData = await activeRes.json()
        if (activeData?.studyPath) return activeData.studyPath
      } catch {
        // Fall through
      }
      throw new Error('Study path job expired. Please check your existing maps before retrying.')
    }

    if (res.status === 403) {
      const errorData = await res.json().catch(() => ({}))
      if (errorData?.code === 'PAYWALL_TRIGGERED' || errorData?.showUpgrade) {
        openPaywallModal('study_map')
        const err = new Error('PAYWALL_TRIGGERED')
        ;(err as any).code = 'PAYWALL_TRIGGERED'
        throw err
      }
    }

    const data: JobStatusResponse = await res.json().catch(() => null)
    if (!data) continue

    if (onProgress) {
      onProgress(data)
    }

    if (data.status === 'done' && data.studyPath) {
      return data.studyPath
    }
    if (data.status === 'error') {
      throw new Error(data.message || 'Generation failed')
    }
  }

  throw new Error('Generation timed out. Please try again.')
}

export async function getStudyPath(topicId: string): Promise<StudyPathResponse | null> {
  if (!topicId) return null
  const headers = await getAuthHeaders()
  try {
    const res = await fetch(`/api/study-paths/${encodeURIComponent(topicId)}`, { headers })
    if (!res.ok) return null
    const data = await res.json()
    return data?.studyPath || null
  } catch {
    return null
  }
}

export async function getActiveStudyPath(): Promise<StudyPathResponse | null> {
  const headers = await getAuthHeaders()
  try {
    const res = await fetch('/api/study-paths/active', { headers })
    if (!res.ok) return null
    const data = await res.json()
    return data?.studyPath || null
  } catch {
    return null
  }
}

export async function getUserStudyPaths(): Promise<StudyPathResponse[]> {
  const headers = await getAuthHeaders()
  try {
    const res = await fetch('/api/study-paths/all', { headers })
    if (!res.ok) return []
    const data = await res.json()
    return data?.studyPaths || []
  } catch {
    return []
  }
}

export async function prepareStudyPathNode(
  topicId: string,
  nodeId: number,
  options: { bufferNext?: boolean } = { bufferNext: true }
): Promise<{ success: boolean; node: StudyPathNode; requireSignup?: boolean; anonymousSessionId?: string; message?: string }> {
  const headers = await getAuthHeaders()
  ;(headers as Record<string, string>)['Content-Type'] = 'application/json'

  const res = await fetch(`/api/study-paths/${encodeURIComponent(topicId)}/nodes/${nodeId}/prepare`, {
    method: 'POST',
    headers,
    body: JSON.stringify(options),
  })

  const data = await res.json().catch(() => ({}))

  if (res.status === 403 && data.requireSignup) {
    return {
      success: false,
      node: null as any,
      requireSignup: true,
      anonymousSessionId: data.anonymousSessionId,
      message: data.message || 'Create a free account to unlock Node 2 and keep your progress!',
    }
  }

  if (!res.ok) {
    throw new Error(data.message || `Failed to prepare Node ${nodeId}`)
  }

  return { success: true, node: data.node }
}

export async function retryStudyPathNode(
  topicId: string,
  nodeId: number
): Promise<{ success: boolean; node: StudyPathNode; requireSignup?: boolean; message?: string }> {
  const headers = await getAuthHeaders()
  ;(headers as Record<string, string>)['Content-Type'] = 'application/json'

  const res = await fetch(`/api/study-paths/${encodeURIComponent(topicId)}/nodes/${nodeId}/retry`, {
    method: 'POST',
    headers,
  })

  const data = await res.json().catch(() => ({}))

  if (res.status === 403 && data.requireSignup) {
    return {
      success: false,
      node: null as any,
      requireSignup: true,
      message: data.message || 'Create a free account to retry this lesson and keep your progress!',
    }
  }

  if (!res.ok) {
    throw new Error(data.message || `Failed to retry Node ${nodeId}`)
  }

  return { success: true, node: data.node }
}

export async function updateStudyPathNode(
  topicId: string,
  nodeId: number,
  status: 'active' | 'completed' | 'locked'
): Promise<StudyPathResponse | null> {
  const headers = await getAuthHeaders()
  ;(headers as Record<string, string>)['Content-Type'] = 'application/json'

  const res = await fetch(`/api/study-paths/${encodeURIComponent(topicId)}/node/${nodeId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status }),
  })

  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  return data?.studyPath || null
}

export async function claimAnonymousStudyPath(
  topicId: string,
  anonymousSessionId: string
): Promise<{ success: boolean; alreadyClaimed?: boolean; message?: string }> {
  const headers = await getAuthHeaders()
  ;(headers as Record<string, string>)['Content-Type'] = 'application/json'

  const res = await fetch('/api/study-paths/claim', {
    method: 'POST',
    headers,
    body: JSON.stringify({ topicId, anonymousSessionId }),
  })

  const data = await res.json().catch(() => ({}))
  return {
    success: res.ok,
    alreadyClaimed: Boolean(data?.alreadyClaimed),
    message: data?.message,
  }
}

