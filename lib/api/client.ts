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
  (error) => {
    if (error.response?.status === 401) {
      console.error('[apiClient] 401 Unauthorized:', error.config?.url)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
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
