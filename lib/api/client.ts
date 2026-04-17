import axios from 'axios'
import { getFirebaseToken } from '@/lib/store/authStore'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

// Always use the internal Next.js proxy to forward requests to the backend
const API_BASE_URL = '/api/backend'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 55 s matches the backend proxy's default ceiling (50 s) plus a small buffer,
  // ensuring the proxy always returns a clean JSON error before axios times out.
  timeout: 55000,
})

// Async request interceptor — fetches a fresh Firebase ID token each time
apiClient.interceptors.request.use(
  async (config) => {
    // 1. Wait for Firebase to be ready and get token
    const token = await getFirebaseToken()
    
    // 2. Attach token if available
    if (token) {
      // DEBUG LOGGING
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        console.log(`[apiClient] Request: ${config.url} | Token Expiry: ${new Date(payload.exp * 1000).toLocaleString()}`)
      } catch (e) {
        console.warn('[apiClient] Could not parse token payload for logging')
      }
      
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // If we're on a dashboard route, we expect a token.
      // If none found after waitForAuth (8s delay), then we are truly unauthenticated.
      const isPublicRoute = config.url?.includes('/public/') || config.url?.includes('/auth/')
      if (!isPublicRoute && typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
         console.warn(`[apiClient] No token for protected route: ${config.url}. Request may fail with 401.`)
      }
    }

    // For FormData, strip Content-Type so the runtime sets multipart/form-data with boundary.
    if (config.data instanceof FormData) {
      const h = config.headers
      if (h && typeof (h as { delete?: (k: string, rewrite?: boolean) => void }).delete === 'function') {
        ;(h as { delete: (k: string, rewrite?: boolean) => void }).delete('Content-Type', true)
      } else {
        delete (h as Record<string, unknown>)['Content-Type']
      }
    }

    const url = config.url || ''
    if (
      url.includes('/ai/') ||
      url.includes('/teacher') ||
      url.includes('/teacher-tools') ||
      url.includes('/generate-topic-questions') ||
      url.includes('/community/upload-image')
    ) {
      config.timeout = 120000 // 2 minutes
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // ─── 1. Handle 502/503/504 and Network Timeouts (Cold starts / Intermittent) ───
    const isTimeout = (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout'))
    const isRetryableError = (
      (error.response && [502, 503, 504].includes(error.response.status)) ||
      (isTimeout && !originalRequest.url?.includes('/ai/')) // Don't auto-retry long AI calls twice
    )

    if (isRetryableError && (!originalRequest._retryCount || originalRequest._retryCount < 2)) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
      const delayMs = originalRequest._retryCount * 2500
      console.warn(`[apiClient] Retryable error (${error.response?.status || 'TIMEOUT'}). Attempt ${originalRequest._retryCount}/2. Retrying in ${delayMs}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      return apiClient(originalRequest)
    }

    // ─── 2. Handle 401 (Unauthorized / Expired Token) ────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      console.warn('[apiClient] 401 detected. Attempting token refresh and retry...')

      try {
        // Force refresh the token (ignore cache)
        const newToken = await getFirebaseToken(true)
        if (newToken) {
          console.log(`[apiClient] Refresh Successful. New token length: ${newToken.length}. Snippet: ${newToken.substring(0, 15)}...`)
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          // Update default header for subsequent requests
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`
          
          return apiClient(originalRequest)
        } else {
          console.error('[apiClient] Refresh returned null token')
        }
      } catch (refreshErr) {
        console.error('[apiClient] Token refresh failed:', refreshErr)
      }

      // If we failed to get a new token, redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
        // Double check: if Firebase thinks we are logged out, redirect.
        // If Firebase still says we are logged in, maybe it's a server-side config issue.
        try {
          const { auth } = await import('@/lib/firebase')
          if (!auth.currentUser) {
            console.error('[apiClient] No session found. Redirecting to login.')
            window.location.href = '/auth/login'
          }
        } catch {
          window.location.href = '/auth/login'
        }
      }
    }

    // Auto-show upgrade modal on 403 paywall responses
    if (error.response?.status === 403) {
      const data = error.response?.data
      if (data?.showUpgrade || data?.upgradeRequired || data?.code) {
        triggerUpgradeModal(data?.code || 'default')
        return Promise.reject(error)
      }
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    }

    return Promise.reject(error)
  }
)
