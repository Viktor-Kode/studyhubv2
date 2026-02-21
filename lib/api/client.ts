import axios from 'axios'
import { getTokenFromCookie } from '@/lib/store/authStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
})

// Request interceptor to add auth token from cookie
apiClient.interceptors.request.use(
  (config) => {
    const token = getTokenFromCookie()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      console.error('[apiClient] 401 Unauthorized detected for:', error.config?.url);
      if (typeof window !== 'undefined') {
        // Only redirect if not already on auth pages
        if (!window.location.pathname.includes('/auth/')) {
          console.warn('[apiClient] Redirecting to login due to 401');
          window.location.href = '/auth/login'
        }
      }
    }

    // Log error for debugging (only in development)
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
