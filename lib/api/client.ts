import axios from 'axios'
import { getTokenFromCookie } from '@/lib/store/authStore'

const PROXY_BASE = '/api/backend'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || PROXY_BASE

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

apiClient.interceptors.request.use(
  (config) => {
    const token = getTokenFromCookie()
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
      console.error('[apiClient] 401 Unauthorized detected for:', error.config?.url);
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
        console.warn('[apiClient] Redirecting to login due to 401');
        window.location.href = '/auth/login'
      }
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
