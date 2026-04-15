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
    const token = await getFirebaseToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // For FormData, strip Content-Type so the runtime sets multipart/form-data with boundary.
    // Axios 1.x uses AxiosHeaders; delete on plain object is not always enough.
    if (config.data instanceof FormData) {
      const h = config.headers
      if (h && typeof (h as { delete?: (k: string, rewrite?: boolean) => void }).delete === 'function') {
        ;(h as { delete: (k: string, rewrite?: boolean) => void }).delete('Content-Type', true)
      } else {
        delete (h as Record<string, unknown>)['Content-Type']
      }
    }
    // Heavy routes (AI generation, file uploads) need up to 2 minutes.
    // All other routes already get 55 s from the default above.
    const url = config.url || ''
    if (
      url.includes('/ai/') ||
      url.includes('/teacher') ||
      url.includes('/teacher-tools') ||
      url.includes('/generate-topic-questions') ||
      url.includes('/community/upload-image')
    ) {
      config.timeout = 120000 // 2 minutes (must exceed slow proxy + backend)
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Auto-retry once or twice for 502/503/504 errors (Render cold starts)
    if (
      error.response &&
      [502, 503, 504].includes(error.response.status) &&
      (!originalRequest._retryCount || originalRequest._retryCount < 2)
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
      const delayMs = originalRequest._retryCount * 2500 // wait 2.5s, then 5.0s
      console.warn(`[apiClient] Backend returned ${error.response.status}. Retrying in ${delayMs}ms (attempt ${originalRequest._retryCount})...`)
      
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      return apiClient(originalRequest)
    }

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      console.warn('[apiClient] 401 detected. Attempting token refresh...')

      try {
        // Force refresh the token
        const newToken = await getFirebaseToken(true)
        if (newToken) {
          console.log('[apiClient] Token refreshed. Retrying request...')
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshErr) {
        console.error('[apiClient] Token refresh failed:', refreshErr)
      }

      // ── Safety check: only redirect if Firebase also has no active user ──────
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
        try {
          const { auth } = await import('@/lib/firebase')
          if (auth.currentUser) {
            console.warn('[apiClient] Backend returned 401 but Firebase user still active — not redirecting.')
            return Promise.reject(error)
          }
        } catch {
          // Could not import firebase 
        }
        console.error('[apiClient] No Firebase user confirmed. Redirecting to login.')
        window.location.href = '/auth/login'
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
