import axios from 'axios'
import { getFirebaseToken } from '@/lib/store/authStore'

// Always use the internal Next.js proxy to forward requests to the backend
const API_BASE_URL = '/api/backend'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Async request interceptor — fetches a fresh Firebase ID token each time
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getFirebaseToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

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

      // If refresh failed or still 401, redirect to login (client side only)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
        console.error('[apiClient] Authentication failed permanently. Redirecting to login.')
        window.location.href = '/auth/login'
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
